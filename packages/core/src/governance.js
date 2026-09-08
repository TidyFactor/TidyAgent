/**
 * Tidy Ecosystem — Core Governance & Central Settings Engine
 * Centralized configuration provider, granular profile management, and domain governance rules.
 *
 * @module @tidy/core/governance
 * @version 1.4.3
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
 */

const { getDb } = require('./db');

/**
 * Default governance rules baseline
 */
const DEFAULT_GOVERNANCE_RULES = {
  'firewall_policy': 'strict',         // 'strict' | 'permissive'
  'auto_extract': 'true',              // 'true' | 'false'
  'memory_decay': 'enabled',           // 'enabled' | 'disabled'
  'max_recall_limit': '5',             // integer string
  'ephemeral_retention_days': '7',     // days before smart prune eligibility
  'session_retention_days': '30',      // days before session prune
  'auto_checkpoint_wal': 'true'        // auto WAL truncate on operations
};

/**
 * Get a configuration value by key from system_config
 * @param {string} key
 * @param {any} defaultValue
 * @returns {string|any}
 */
function getConfig(key, defaultValue = null) {
  if (!key) return defaultValue;
  const db = getDb();
  const row = db.prepare('SELECT value FROM system_config WHERE key = ?').get(key);
  if (!row) return defaultValue;
  return row.value;
}

/**
 * Set a configuration value in system_config (inserts or updates)
 * @param {string} key
 * @param {any} value
 * @returns {boolean}
 */
function setConfig(key, value) {
  if (!key) throw new Error('Config key is required.');
  const db = getDb();
  const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
  
  const stmt = db.prepare(`
    INSERT INTO system_config (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, valStr);
  return true;
}

/**
 * List all system configuration entries
 * @returns {Array<{key: string, value: string, updated_at: string}>}
 */
function listConfig() {
  const db = getDb();
  return db.prepare('SELECT key, value, updated_at FROM system_config ORDER BY key ASC').all();
}

/**
 * Delete a configuration key
 * @param {string} key
 * @returns {boolean}
 */
function deleteConfig(key) {
  if (!key) return false;
  const db = getDb();
  const res = db.prepare('DELETE FROM system_config WHERE key = ?').run(key);
  return res.changes > 0;
}

/**
 * Get user profile and assistant persona details
 * @param {string} profileId
 * @returns {object}
 */
function getUserProfile(profileId = 'primary') {
  const db = getDb();
  const row = db.prepare('SELECT * FROM user_profile WHERE id = ?').get(profileId);
  if (!row) {
    return {
      id: profileId,
      user_name: 'User',
      assistant_name: 'Tidy',
      role: 'Owner & Lead Engineer',
      locale: 'ar',
      tone: 'concise_expert',
      theme: 'dark',
      currency: 'USD',
      time_format: '24h',
      preferences: {}
    };
  }

  let prefs = {};
  try {
    prefs = row.preferences_json ? JSON.parse(row.preferences_json) : {};
  } catch {
    prefs = {};
  }

  return {
    id: row.id,
    user_name: row.user_name || 'User',
    assistant_name: row.assistant_name || 'Tidy',
    role: row.role || 'Owner & Lead Engineer',
    locale: row.locale || 'ar',
    tone: row.tone || 'concise_expert',
    theme: row.theme || 'dark',
    currency: row.currency || 'USD',
    time_format: row.time_format || '24h',
    preferences: prefs,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Granularly update user profile and assistant persona
 * @param {object} updates
 * @param {string} profileId
 * @returns {object} updated user profile
 */
function updateUserProfile(updates = {}, profileId = 'primary') {
  const db = getDb();
  const current = getUserProfile(profileId);

  const newUserName = updates.userName ?? updates.user_name ?? current.user_name;
  const newAssistantName = updates.assistantName ?? updates.assistant_name ?? current.assistant_name;
  const newRole = updates.role ?? current.role;
  const newLocale = updates.locale ?? current.locale;
  const newTone = updates.tone ?? current.tone;
  const newTheme = updates.theme ?? current.theme;
  const newCurrency = updates.currency ?? current.currency;
  const newTimeFormat = updates.timeFormat ?? updates.time_format ?? current.time_format;

  let mergedPreferences = { ...current.preferences };
  if (updates.preferences && typeof updates.preferences === 'object') {
    mergedPreferences = { ...mergedPreferences, ...updates.preferences };
  }

  const prefsJson = JSON.stringify(mergedPreferences);

  const stmt = db.prepare(`
    INSERT INTO user_profile (id, user_name, assistant_name, role, locale, tone, theme, currency, time_format, preferences_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      user_name = excluded.user_name,
      assistant_name = excluded.assistant_name,
      role = excluded.role,
      locale = excluded.locale,
      tone = excluded.tone,
      theme = excluded.theme,
      currency = excluded.currency,
      time_format = excluded.time_format,
      preferences_json = excluded.preferences_json,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    profileId,
    newUserName,
    newAssistantName,
    newRole,
    newLocale,
    newTone,
    newTheme,
    newCurrency,
    newTimeFormat,
    prefsJson
  );

  // Log action in audit_log
  try {
    const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
    logStmt.run('PROFILE_UPDATE', 'governance', JSON.stringify({ profileId, updatedKeys: Object.keys(updates) }));
  } catch {}

  return getUserProfile(profileId);
}

/**
 * Get all active governance rules
 * Combines built-in defaults with active overrides in system_config ('gov:*')
 * @returns {object}
 */
function getGovernanceRules() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM system_config WHERE key LIKE 'gov:%'").all();
  
  const rules = { ...DEFAULT_GOVERNANCE_RULES };
  for (const row of rows) {
    const cleanKey = row.key.replace(/^gov:/, '');
    rules[cleanKey] = row.value;
  }
  return rules;
}

/**
 * Update or set a specific governance rule
 * @param {string} ruleKey
 * @param {string|number|boolean} ruleValue
 * @returns {object} updated governance rules
 */
function setGovernanceRule(ruleKey, ruleValue) {
  if (!ruleKey) throw new Error('Rule key is required.');
  const cleanKey = ruleKey.replace(/^gov:/, '');
  const configKey = `gov:${cleanKey}`;
  const valStr = String(ruleValue);
  
  setConfig(configKey, valStr);

  // Log in audit log
  const db = getDb();
  try {
    const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
    logStmt.run('GOVERNANCE_RULE_SET', 'governance', JSON.stringify({ rule: cleanKey, value: valStr }));
  } catch {}

  return getGovernanceRules();
}

module.exports = {
  DEFAULT_GOVERNANCE_RULES,
  getConfig,
  setConfig,
  listConfig,
  deleteConfig,
  getUserProfile,
  updateUserProfile,
  getGovernanceRules,
  setGovernanceRule
};
