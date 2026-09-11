/**
 * Tidy Ecosystem — Sovereign Database Engine (Active SQLite SSOT)
 * Auto-bootstrapping, WAL concurrency tuning, FTS5 BM25 search & schema extension kernel.
 *
 * @module @tidy/core/db
 * @version 1.4.2
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
 */


const fs = require('fs');
const path = require('path');
const os = require('os');

// Suppress Node.js experimental warnings for node:sqlite
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  const msg = typeof warning === 'string' ? warning : warning?.message;
  if (msg && (msg.includes('SQLite is an experimental feature') || msg.includes('ExperimentalWarning: SQLite'))) {
    return;
  }
  return originalEmitWarning.call(process, warning, ...args);
};

let dbInstance = null;

function resolveDbPath(customPath) {
  if (customPath) return path.resolve(customPath);
  if (process.env.TIDY_DB) return path.resolve(process.env.TIDY_DB);

  const homeDir = os.homedir() || process.env.USERPROFILE || process.env.HOME;
  const tidyDir = path.join(homeDir, '.tidy');
  return path.join(tidyDir, 'tidy.db');
}

function getDatabaseDriver() {
  try {
    const { DatabaseSync } = require('node:sqlite');
    return { type: 'builtin', DatabaseSync };
  } catch {
    try {
      const BetterSqlite3 = require('better-sqlite3');
      return { type: 'better-sqlite3', BetterSqlite3 };
    } catch {
      throw new Error(
        'No SQLite driver found. Node.js >= 22.0.0 with native node:sqlite or better-sqlite3 is required.'
      );
    }
  }
}

class DatabaseAdapter {
  constructor(rawDb, type) {
    this.raw = rawDb;
    this.type = type;
  }

  exec(sql) {
    return this.raw.exec(sql);
  }

  prepare(sql) {
    const stmt = this.raw.prepare(sql);
    const self = this;
    return {
      all(...args) {
        if (self.type === 'builtin') {
          return args.length > 0 ? stmt.all(...args) : stmt.all();
        }
        return args.length > 0 ? stmt.all(...args) : stmt.all();
      },
      get(...args) {
        if (self.type === 'builtin') {
          return args.length > 0 ? stmt.get(...args) : stmt.get();
        }
        return args.length > 0 ? stmt.get(...args) : stmt.get();
      },
      run(...args) {
        if (self.type === 'builtin') {
          return args.length > 0 ? stmt.run(...args) : stmt.run();
        }
        return args.length > 0 ? stmt.run(...args) : stmt.run();
      }
    };
  }

  close() {
    if (this.raw && typeof this.raw.close === 'function') {
      this.raw.close();
    }
    dbInstance = null;
  }
}

function initDatabase(customPath) {
  if (dbInstance) return dbInstance;

  const dbPath = resolveDbPath(customPath);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const driver = getDatabaseDriver();
  let rawDb;

  if (driver.type === 'builtin') {
    rawDb = new driver.DatabaseSync(dbPath);
  } else {
    rawDb = new driver.BetterSqlite3(dbPath);
  }

  const db = new DatabaseAdapter(rawDb, driver.type);

  // Performance and integrity PRAGMAs
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = -64000;
  `);

  // Core Schema DDL
  db.exec(`
    -- System Configuration Table
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User Profile & Assistant Persona
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY DEFAULT 'primary',
      user_name TEXT NOT NULL,
      assistant_name TEXT NOT NULL DEFAULT 'Tidy',
      locale TEXT DEFAULT 'ar',
      tone TEXT DEFAULT 'concise_expert',
      preferences_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Contexts & Workspace Domains
    CREATE TABLE IF NOT EXISTS contexts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL CHECK (domain IN ('dev', 'marketing', 'personal', 'ops', 'general')),
      workspace_path TEXT,
      is_active INTEGER DEFAULT 0,
      metadata_yaml TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Memory Nodes (Core, Project, Session, Ephemeral)
    CREATE TABLE IF NOT EXISTS memory_nodes (
      id TEXT PRIMARY KEY,
      context_id TEXT REFERENCES contexts(id) ON DELETE CASCADE,
      tier TEXT NOT NULL CHECK (tier IN ('core', 'project', 'session', 'ephemeral')),
      category TEXT NOT NULL CHECK (category IN ('fact', 'decision', 'pattern', 'preference', 'task', 'rule')),
      content TEXT NOT NULL,
      summary TEXT,
      importance INTEGER DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
      access_count INTEGER DEFAULT 0,
      decay_score REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- FTS5 Virtual Table for Instant Search
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
      node_id UNINDEXED,
      content,
      summary,
      tokenize = 'unicode61 remove_diacritics 2'
    );

    -- Triggers for FTS5 Sync
    CREATE TRIGGER IF NOT EXISTS trg_memory_nodes_ai AFTER INSERT ON memory_nodes BEGIN
      INSERT INTO memory_fts(node_id, content, summary) VALUES (new.id, new.content, new.summary);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_memory_nodes_ad AFTER DELETE ON memory_nodes BEGIN
      DELETE FROM memory_fts WHERE node_id = old.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_memory_nodes_au AFTER UPDATE ON memory_nodes BEGIN
      DELETE FROM memory_fts WHERE node_id = old.id;
      INSERT INTO memory_fts(node_id, content, summary) VALUES (new.id, new.content, new.summary);
    END;

    -- Sub-Agents Registry
    CREATE TABLE IF NOT EXISTS subagents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      allowed_tools_json TEXT DEFAULT '[]',
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Micro-Apps Registry
    CREATE TABLE IF NOT EXISTS installed_apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      version TEXT NOT NULL,
      entry_point TEXT NOT NULL,
      config_json TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      installed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Integrated Tasks App Table
    CREATE TABLE IF NOT EXISTS app_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      due_date DATETIME,
      tags_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    -- Integrated Snippets App Table
    CREATE TABLE IF NOT EXISTS app_snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      tags_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Integrated Journal App Table
    CREATE TABLE IF NOT EXISTS app_journal (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      entry TEXT NOT NULL,
      mood TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Integrated Vault App Table (Secure key-value configuration)
    CREATE TABLE IF NOT EXISTS app_vault (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      is_secret INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Registered Community Skills as First-Class Subagents
    CREATE TABLE IF NOT EXISTS registered_skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      alias TEXT NOT NULL,
      description TEXT NOT NULL,
      skill_path TEXT NOT NULL,
      domain TEXT DEFAULT 'general',
      manifest_json TEXT DEFAULT '{}',
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit & Activity Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      component TEXT NOT NULL,
      details_json TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Skills & Agents Studio: Collections (Non-destructive tagging)
    CREATE TABLE IF NOT EXISTS skill_collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#4a9eff',
      icon TEXT DEFAULT 'folder',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Skills & Agents Studio: Collection Items
    CREATE TABLE IF NOT EXISTS skill_collection_items (
      id TEXT PRIMARY KEY,
      collection_id TEXT REFERENCES skill_collections(id) ON DELETE CASCADE,
      item_path TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('skill', 'agent', 'rule')),
      tool TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(collection_id, item_path)
    );

    -- Skills & Agents Studio: Starred Favorites
    CREATE TABLE IF NOT EXISTS skill_favorites (
      item_path TEXT PRIMARY KEY,
      item_type TEXT NOT NULL,
      tool TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Skills & Agents Studio: Tool Sources Registry
    CREATE TABLE IF NOT EXISTS tool_sources (
      tool_id TEXT PRIMARY KEY,
      tool_name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('global', 'claude', 'cursor', 'codex', 'copilot', 'windsurf', 'amp', 'antigravity', 'custom')),
      skills_path TEXT,
      agents_path TEXT,
      rules_path TEXT,
      is_enabled INTEGER DEFAULT 1,
      last_scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Idempotent column migrations for tasks and journal domains
  try { db.exec("ALTER TABLE app_tasks ADD COLUMN domain TEXT DEFAULT 'general'"); } catch {}
  try { db.exec("ALTER TABLE app_tasks ADD COLUMN assigned_agent TEXT"); } catch {}
  try { db.exec("ALTER TABLE app_tasks ADD COLUMN result_brief TEXT"); } catch {}
  try { db.exec("ALTER TABLE app_journal ADD COLUMN domain TEXT DEFAULT 'general'"); } catch {}

  // Idempotent column migrations for user_profile granular settings
  try { db.exec("ALTER TABLE user_profile ADD COLUMN theme TEXT DEFAULT 'dark'"); } catch {}
  try { db.exec("ALTER TABLE user_profile ADD COLUMN currency TEXT DEFAULT 'USD'"); } catch {}
  try { db.exec("ALTER TABLE user_profile ADD COLUMN time_format TEXT DEFAULT '24h'"); } catch {}
  try { db.exec("ALTER TABLE user_profile ADD COLUMN role TEXT DEFAULT 'Owner & Lead Engineer'"); } catch {}

  // Idempotent seed collections for Studio
  try {
    const colCount = db.prepare('SELECT COUNT(*) as count FROM skill_collections').get();
    if (!colCount || colCount.count === 0) {
      const insCol = db.prepare('INSERT OR IGNORE INTO skill_collections (id, name, color, icon) VALUES (?, ?, ?, ?)');
      insCol.run('col_marketing', 'Marketing', '#f59e0b', 'tag');
      insCol.run('col_design', 'Design', '#ec4899', 'palette');
      insCol.run('col_development', 'Development', '#3b82f6', 'code');
    }
  } catch {}

  // Seed default data if system_config is empty
  seedDefaults(db);

  dbInstance = db;
  return dbInstance;
}

function seedDefaults(db) {
  const checkConfig = db.prepare('SELECT COUNT(*) as count FROM system_config').get();
  if (checkConfig && checkConfig.count > 0) return;

  // Insert System Config
  const insertConfig = db.prepare('INSERT INTO system_config (key, value) VALUES (?, ?)');
  insertConfig.run('version', '1.1.0');
  insertConfig.run('initialized_at', new Date().toISOString());
  insertConfig.run('engine', 'node:sqlite');

  // Insert Default Profile
  const insertProfile = db.prepare(`
    INSERT INTO user_profile (id, user_name, assistant_name, locale, tone, preferences_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertProfile.run(
    'primary',
    'User',
    'Tidy',
    'en',
    'concise_expert',
    JSON.stringify({ autoExtract: true, maxRecallLimit: 5 })
  );

  // Insert Default Contexts
  const insertContext = db.prepare(`
    INSERT INTO contexts (id, name, domain, is_active, metadata_yaml)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertContext.run('ctx_general', 'General Workspace', 'general', 1, 'domain: general\ndescription: Main hub for daily tasks and active memory');
  insertContext.run('ctx_dev', 'Software Engineering', 'dev', 0, 'domain: dev\ndescription: Codebases, architecture, debugging and technical rules');
  insertContext.run('ctx_marketing', 'Growth & Marketing', 'marketing', 0, 'domain: marketing\ndescription: Marketing campaigns, copywriting, and growth strategy');
  insertContext.run('ctx_personal', 'Personal Life', 'personal', 0, 'domain: personal\ndescription: Personal goals, habits, journal, and schedules');

  // Insert Default Sub-Agents
  const insertAgent = db.prepare(`
    INSERT INTO subagents (id, name, role, description, system_prompt, allowed_tools_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAgent.run(
    'agent_planner',
    'planner',
    'Task & Priority Strategist',
    'Specialized in time organization, objective decomposition, and scheduling.',
    'You are a strategic task planner. Decompose complex objectives into actionable milestones.',
    JSON.stringify(['tidy_task_add', 'tidy_recall', 'tidy_memorize'])
  );

  insertAgent.run(
    'agent_coder',
    'coder',
    'Software Engineer & Code Reviewer',
    'Specialized in software architecture, code review, and engineering patterns.',
    'You are an expert software engineer. Focus on clean, tested, and reliable code.',
    JSON.stringify(['tidy_snippet_save', 'tidy_recall', 'tidy_memorize'])
  );

  insertAgent.run(
    'agent_researcher',
    'researcher',
    'Research & Knowledge Synthesizer',
    'Specialized in deep research, key insights extraction, and knowledge distillation.',
    'You are an analytical researcher. Synthesize essential insights with zero fluff.',
    JSON.stringify(['tidy_recall', 'tidy_memorize', 'tidy_journal_add'])
  );

  insertAgent.run(
    'agent_scribe',
    'scribe',
    'Decisions & Documentation Logger',
    'Specialized in recording architectural decisions, logs, and updating SQLite SSOT.',
    'You are a decision logger. Document key rationale and update the persistent memory.',
    JSON.stringify(['tidy_memorize', 'tidy_journal_add'])
  );

  // Insert Default Installed Apps
  const insertApp = db.prepare(`
    INSERT INTO installed_apps (id, name, version, entry_point, config_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertApp.run('app_tasks', 'tasks', '1.0.0', 'scripts/apps.js:tasks', JSON.stringify({ defaultPriority: 'medium' }));
  insertApp.run('app_snippets', 'snippets', '1.0.0', 'scripts/apps.js:snippets', JSON.stringify({ defaultLang: 'javascript' }));
  insertApp.run('app_journal', 'journal', '1.0.0', 'scripts/apps.js:journal', JSON.stringify({}));
  insertApp.run('app_vault', 'vault', '1.0.0', 'scripts/apps.js:vault', JSON.stringify({}));

  // Seed Default Collections if empty
  try {
    const insCol = db.prepare('INSERT OR IGNORE INTO skill_collections (id, name, color, icon) VALUES (?, ?, ?, ?)');
    insCol.run('col_marketing', 'Marketing', '#f59e0b', 'tag');
    insCol.run('col_design', 'Design', '#ec4899', 'palette');
    insCol.run('col_development', 'Development', '#3b82f6', 'code');
  } catch {}

  // Log Initial Bootstrap Action
  const logAction = db.prepare(`
    INSERT INTO audit_log (action, component, details_json)
    VALUES (?, ?, ?)
  `);
  logAction.run('BOOTSTRAP', 'system', JSON.stringify({ message: 'Tidy database initialized successfully with seed defaults' }));
}

function getDb(customPath) {
  if (!dbInstance) {
    return initDatabase(customPath);
  }
  return dbInstance;
}

function getStats() {
  const db = getDb();
  const counts = {
    memories: db.prepare('SELECT COUNT(*) as c FROM memory_nodes').get().c,
    core_memories: db.prepare("SELECT COUNT(*) as c FROM memory_nodes WHERE tier = 'core'").get().c,
    decision_memories: db.prepare("SELECT COUNT(*) as c FROM memory_nodes WHERE category = 'decision'").get().c,
    ephemeral_memories: db.prepare("SELECT COUNT(*) as c FROM memory_nodes WHERE tier = 'ephemeral'").get().c,
    contexts: db.prepare('SELECT COUNT(*) as c FROM contexts').get().c,
    subagents: db.prepare('SELECT COUNT(*) as c FROM subagents').get().c,
    tasks: db.prepare('SELECT COUNT(*) as c FROM app_tasks').get().c,
    pending_tasks: db.prepare("SELECT COUNT(*) as c FROM app_tasks WHERE status != 'completed'").get().c,
    snippets: db.prepare('SELECT COUNT(*) as c FROM app_snippets').get().c,
    journal: db.prepare('SELECT COUNT(*) as c FROM app_journal').get().c,
    skills: db.prepare('SELECT COUNT(*) as c FROM registered_skills').get().c,
    audit_logs: db.prepare('SELECT COUNT(*) as c FROM audit_log').get().c
  };

  const activeContext = db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();
  const profile = db.prepare("SELECT * FROM user_profile WHERE id = 'primary'").get();

  return {
    dbPath: resolveDbPath(),
    counts,
    activeContext,
    profile
  };
}

function backupDatabase(targetPath) {
  const db = getDb();
  let dest = targetPath;
  if (!dest) {
    const homeDir = os.homedir() || process.env.USERPROFILE || process.env.HOME;
    const defaultDir = path.join(homeDir, '.tidy', 'backups');
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    dest = path.join(defaultDir, `tidy_backup_${timestamp}.db`);
  }
  const parent = path.dirname(dest);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }
  const sanitized = dest.replace(/'/g, "''");
  db.exec(`VACUUM INTO '${sanitized}';`);
  const stat = fs.statSync(dest);
  return {
    success: true,
    backupPath: dest,
    sizeBytes: stat.size,
    createdAt: new Date().toISOString()
  };
}

function checkpointWal() {
  const db = getDb();
  const res = db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get() || {};
  return {
    success: true,
    busy: res.busy || 0,
    log: res.log || 0,
    checkpointed: res.checkpointed || 0,
    timestamp: new Date().toISOString()
  };
}

function checkIntegrity() {
  const db = getDb();
  const rows = db.prepare('PRAGMA integrity_check').all();
  const isOk = rows.length === 1 && (rows[0].integrity_check === 'ok' || rows[0]['integrity_check'] === 'ok');
  return {
    ok: isOk,
    results: rows.map(r => r.integrity_check || Object.values(r)[0]),
    timestamp: new Date().toISOString()
  };
}

/**
 * Register and execute an idempotent schema extension from a pluggable pack
 * @param {string} packName - Unique identifier of the package (e.g. 'office', 'builder')
 * @param {string} ddlSql - DDL SQL statements to execute
 */
function registerSchema(packName, ddlSql) {
  if (!packName || typeof packName !== 'string') {
    throw new Error('registerSchema requires a valid packName.');
  }
  if (!ddlSql || typeof ddlSql !== 'string') {
    throw new Error('registerSchema requires valid ddlSql statements.');
  }
  const db = getDb();
  db.exec(ddlSql);

  // Record extension registration in audit_log
  try {
    const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
    logStmt.run('REGISTER_SCHEMA', 'microkernel', JSON.stringify({ pack: packName, registeredAt: new Date().toISOString() }));
  } catch {}

  return true;
}

module.exports = {
  resolveDbPath,
  initDatabase,
  getDb,
  getStats,
  backupDatabase,
  checkpointWal,
  checkIntegrity,
  registerSchema
};


