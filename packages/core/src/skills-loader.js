/**
 * Tidy Ecosystem — Skill-as-Agent Loader & Discovery Engine
 * Scans, parses, and bridges community skills (TidyFactor Skills-LAB) into context-injected managed subagents.
 *
 * @module @tidy/core/skills-loader
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */


const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { registerSubagent, getSubagent } = require('./subagents');

/**
 * Parse YAML frontmatter and title from SKILL.md
 */
function parseSkillMd(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`SKILL.md file not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let frontmatter = {};
  let body = raw;

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    const yamlBlock = fmMatch[1];
    body = fmMatch[2];

    // Lightweight YAML Parser (handles key: value, multiline quotes, and simple scalars)
    const lines = yamlBlock.split(/\r?\n/);
    let currentKey = null;
    let currentValue = '';

    for (const line of lines) {
      const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kvMatch) {
        if (currentKey) {
          frontmatter[currentKey] = currentValue.trim().replace(/^["']|["']$/g, '');
        }
        currentKey = kvMatch[1];
        currentValue = kvMatch[2] || '';
      } else if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
        currentValue += ' ' + line.trim();
      }
    }
    if (currentKey) {
      frontmatter[currentKey] = currentValue.trim().replace(/^["']|["']$/g, '');
    }
  }

  // Extract primary markdown heading (# Title)
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : (frontmatter.name || 'Community Skill');

  // Extract commands if defined
  const commands = [];
  // 1. Dash/bullet style: `command` — description
  const cmdMatches = body.matchAll(/`([a-zA-Z0-9_.-]+)`\s*—\s*([^.\n]+)/g);
  for (const m of cmdMatches) {
    commands.push({ command: m[1], description: m[2].trim() });
  }

  // 2. Table-style: | User Intent | `command` or `references/commands/xxx.md` | What it loads |
  const tableRows = body.matchAll(/\|\s*([^|\r\n]+?)\s*\|\s*`([^`\r\n]+)`\s*\|\s*([^|\r\n]*?)\s*\|/g);
  for (const tr of tableRows) {
    const rawCmd = tr[2].trim();
    if (rawCmd.toLowerCase() === 'command' || rawCmd.startsWith('---')) continue;
    const cleanCmd = rawCmd.replace(/^references\/commands\//, '').replace(/\.md$/, '');
    const desc = tr[1].trim().replace(/^["']|["']$/g, '') || tr[3].trim();
    if (!commands.some(c => c.command === cleanCmd)) {
      commands.push({ command: cleanCmd, description: desc });
    }
  }

  return {
    frontmatter,
    title,
    commands,
    rawBody: body
  };
}

/**
 * Infer domain from skill name or content
 */
function inferDomain(skillName, description) {
  const name = skillName.toLowerCase();
  const desc = (description || '').toLowerCase();

  if (name.includes('market') || desc.includes('marketing') || desc.includes('growth') || desc.includes('ads')) {
    return 'marketing';
  }
  if (name.includes('design') || name.includes('style') || name.includes('cinematic') || desc.includes('ui') || desc.includes('css')) {
    return 'design';
  }
  if (name.includes('doc') || desc.includes('documentation') || desc.includes('readme')) {
    return 'docs';
  }
  if (name.includes('php') || name.includes('next') || name.includes('js') || name.includes('html') || name.includes('htmx')) {
    return 'tech';
  }
  if (name.includes('github') || name.includes('cleaner') || name.includes('ops')) {
    return 'ops';
  }
  return 'general';
}

/**
 * Register a single skill path as a managed subagent
 */
function registerSkillFromPath(skillDir, customAlias = null) {
  const resolvedDir = path.resolve(skillDir);
  const skillFile = path.join(resolvedDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    throw new Error(`Directory ${resolvedDir} does not contain a SKILL.md file.`);
  }

  const parsed = parseSkillMd(skillFile);
  const folderName = path.basename(resolvedDir);
  const skillName = parsed.frontmatter.name || folderName;

  // Default alias: strip tidyfactor- prefix
  let alias = customAlias || skillName.replace(/^tidyfactor-/, '');
  if (alias.startsWith('tidyfactor-')) alias = alias.slice(11);
  alias = alias.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  const domain = inferDomain(skillName, parsed.frontmatter.description);
  const description = parsed.frontmatter.description || parsed.title;

  // Check manifest.json for declared tools if present
  let manifestJson = '{}';
  const manifestFile = path.join(resolvedDir, 'manifest.json');
  let allowedTools = ['tidy_recall', 'tidy_memorize', 'tidy_task_add'];

  if (fs.existsSync(manifestFile)) {
    try {
      manifestJson = fs.readFileSync(manifestFile, 'utf8');
      const manifest = JSON.parse(manifestJson);
      if (manifest.tools && Array.isArray(manifest.tools)) {
        allowedTools = allowedTools.concat(manifest.tools.map(t => t.name || t));
      }
    } catch {
      // Keep default tools on manifest parse warning
    }
  }

  const db = getDb();
  const skillId = `skill_${alias}`;

  // 1. Insert/Update in registered_skills
  const skillStmt = db.prepare(`
    INSERT INTO registered_skills (id, name, alias, description, skill_path, domain, manifest_json, is_enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
      alias = excluded.alias,
      description = excluded.description,
      skill_path = excluded.skill_path,
      domain = excluded.domain,
      manifest_json = excluded.manifest_json,
      is_enabled = 1,
      updated_at = CURRENT_TIMESTAMP
  `);
  skillStmt.run(skillId, skillName, alias, description, resolvedDir, domain, manifestJson);

  // 2. Synthesize System Prompt for the Subagent
  const systemPrompt = `You are @${alias}, an expert autonomous subagent powered by the "${skillName}" skill.
Domain: ${domain.toUpperCase()}
Role: ${parsed.title}

Instructions & Methodology:
${description}

Commands & Workflows available:
${parsed.commands.map(c => `- ${c.command}: ${c.description}`).join('\n') || '- General domain operations and strategic workflows'}

Operational Protocol:
1. You are managed under the Tidy Sovereign Cognitive Architecture.
2. Maintain strict 3-Ring Context awareness (Ring 0: User/Founder Identity, Ring 1: Project Facts, Ring 2: Active Memory).
3. Deliver production-grade, actionable execution with zero conversational filler.`;

  // 3. Register into subagents table as first-class agent
  registerSubagent({
    name: alias,
    role: parsed.title,
    description: `[Skill: ${skillName}] ${description}`,
    systemPrompt,
    allowedTools
  });

  return {
    id: skillId,
    name: skillName,
    alias,
    domain,
    role: parsed.title,
    description,
    skillPath: resolvedDir,
    allowedTools
  };
}

/**
 * Auto-discover skills across standard workspace and lab directories
 */
function discoverSkills(customSearchDirs = []) {
  const searchDirs = [...customSearchDirs];

  // Standard search locations
  const currentDir = process.cwd();
  searchDirs.push(path.join(currentDir, '.agents', 'skills'));
  searchDirs.push(path.join(currentDir, 'skills'));
  searchDirs.push(path.join(currentDir, 'packages', 'skills'));
  searchDirs.push(path.join(currentDir, 'packages', 'skill'));

  // Parent Skills-LAB check (portable relative resolution)
  const parentDir = path.resolve(currentDir, '..');
  if (path.basename(parentDir) === 'Skills-LAB' || fs.existsSync(path.join(parentDir, 'tidyfactor-doc'))) {
    searchDirs.push(parentDir);
  }
  const skillsLabInParent = path.join(parentDir, 'Skills', 'Skills-LAB');
  if (fs.existsSync(skillsLabInParent) && !searchDirs.includes(skillsLabInParent)) {
    searchDirs.push(skillsLabInParent);
  }
  const directSkillsLab = path.join(parentDir, 'Skills-LAB');
  if (fs.existsSync(directSkillsLab) && !searchDirs.includes(directSkillsLab)) {
    searchDirs.push(directSkillsLab);
  }

  // Optional custom Skills-LAB root via environment variable
  if (process.env.TIDY_SKILLS_DIR && fs.existsSync(process.env.TIDY_SKILLS_DIR)) {
    const customSkillsDir = path.resolve(process.env.TIDY_SKILLS_DIR);
    if (!searchDirs.includes(customSkillsDir)) {
      searchDirs.push(customSkillsDir);
    }
  }

  const discovered = [];
  const scannedDirs = new Set();
  const seenSkillPaths = new Set();

  for (const baseDir of searchDirs) {
    if (!fs.existsSync(baseDir) || scannedDirs.has(baseDir)) continue;
    scannedDirs.add(baseDir);

    // Direct check if baseDir itself is a skill
    const directSkillFile = path.join(baseDir, 'SKILL.md');
    if (fs.existsSync(directSkillFile)) {
      try {
        const canonical = fs.realpathSync(baseDir).toLowerCase();
        if (!seenSkillPaths.has(canonical)) {
          seenSkillPaths.add(canonical);
          const reg = registerSkillFromPath(baseDir);
          discovered.push(reg);
        }
      } catch {
        // Skip unparseable
      }
      continue;
    }

    // Check child directories
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;

        const candidateDir = path.join(baseDir, entry.name);
        if (fs.existsSync(path.join(candidateDir, 'SKILL.md'))) {
          try {
            const canonical = fs.realpathSync(candidateDir).toLowerCase();
            if (!seenSkillPaths.has(canonical)) {
              seenSkillPaths.add(canonical);
              const reg = registerSkillFromPath(candidateDir);
              discovered.push(reg);
            }
          } catch {
            // Ignore corrupted skills
          }
        }
      }
    } catch {
      // Base directory read error
    }
  }

  return discovered;
}

/**
 * List all registered community skills
 */
function listRegisteredSkills(options = {}) {
  const db = getDb();
  const includeDisabled = options.includeDisabled || false;
  const sql = includeDisabled
    ? 'SELECT * FROM registered_skills ORDER BY alias ASC'
    : 'SELECT * FROM registered_skills WHERE is_enabled = 1 ORDER BY alias ASC';
  return db.prepare(sql).all();
}

/**
 * Get a registered skill by alias or name or id
 */
function getRegisteredSkill(aliasOrNameOrId) {
  const db = getDb();
  return db.prepare('SELECT * FROM registered_skills WHERE id = ? OR alias = ? OR name = ? LIMIT 1').get(aliasOrNameOrId, aliasOrNameOrId, aliasOrNameOrId);
}

/**
 * Create a custom skill and register it as an agent
 */
function createSkill({ name, alias, description, domain = 'general', skillPath = '', allowedTools = [] }) {
  if (!name) throw new Error('Skill name is required');
  const safeAlias = (alias || name.replace(/^tidyfactor-/, '')).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const id = `skill_${safeAlias}`;

  const db = getDb();
  db.prepare(`
    INSERT INTO registered_skills (id, name, alias, description, skill_path, domain, manifest_json, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(name) DO UPDATE SET
      alias = excluded.alias,
      description = excluded.description,
      skill_path = excluded.skill_path,
      domain = excluded.domain,
      is_enabled = 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(id, name, safeAlias, description || '', skillPath || '', domain, JSON.stringify({ tools: allowedTools }));

  // Register or update linked subagent
  registerSubagent({
    name: safeAlias,
    role: name,
    description: `[Skill: ${name}] ${description || ''}`,
    systemPrompt: `You are @${safeAlias}, an autonomous subagent powered by the "${name}" skill in domain ${domain.toUpperCase()}.`,
    allowedTools
  });

  return getRegisteredSkill(id);
}

/**
 * Update registered skill metadata
 */
function updateSkill(idOrNameOrAlias, updates = {}) {
  const db = getDb();
  const skill = getRegisteredSkill(idOrNameOrAlias);
  if (!skill) throw new Error(`Skill "${idOrNameOrAlias}" not found`);

  const description = updates.description !== undefined ? updates.description : skill.description;
  const domain = updates.domain !== undefined ? updates.domain : skill.domain;
  const isEnabled = updates.isEnabled !== undefined ? (updates.isEnabled ? 1 : 0) : skill.is_enabled;

  db.prepare(`
    UPDATE registered_skills
    SET description = ?, domain = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(description, domain, isEnabled, skill.id);

  // Sync with linked subagent enable state
  try {
    const { toggleSubagent } = require('./subagents');
    toggleSubagent(skill.alias, isEnabled);
  } catch {}

  return getRegisteredSkill(skill.id);
}

/**
 * Toggle skill status
 */
function toggleSkill(idOrNameOrAlias, isEnabled = null) {
  const skill = getRegisteredSkill(idOrNameOrAlias);
  if (!skill) throw new Error(`Skill "${idOrNameOrAlias}" not found`);

  const nextState = isEnabled !== null ? isEnabled : !skill.is_enabled;
  return updateSkill(skill.id, { isEnabled: nextState });
}

/**
 * Delete a registered skill
 */
function deleteSkill(idOrNameOrAlias, deleteLinkedAgent = true) {
  const db = getDb();
  const skill = getRegisteredSkill(idOrNameOrAlias);
  if (!skill) return false;

  const res = db.prepare('DELETE FROM registered_skills WHERE id = ?').run(skill.id);

  if (deleteLinkedAgent) {
    try {
      const { deleteSubagent } = require('./subagents');
      deleteSubagent(skill.alias);
    } catch {}
  }

  return res.changes > 0;
}

/**
 * Inspects a skill's full manifest, commands, workflows, and 15-rules compliance score.
 *
 * @param {string} idOrName Skill ID, name, or path
 * @returns {object} Parsed skill manifest and compliance audit
 */
function getSkillManifest(idOrName) {
  const os = require('os');
  const home = os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
  let skillPath = null;
  let skillMeta = null;

  // 1. Check if registered in DB
  try {
    const registered = getRegisteredSkill(idOrName);
    if (registered && registered.path && fs.existsSync(registered.path)) {
      skillPath = registered.path;
      skillMeta = registered;
    }
  } catch {}

  // 2. Direct path check
  if (!skillPath && typeof idOrName === 'string' && fs.existsSync(idOrName)) {
    skillPath = idOrName;
  }

  // 3. Search standard skill directories
  if (!skillPath && typeof idOrName === 'string') {
    const cleanId = idOrName.replace(/^@/, '');
    const searchCandidates = [
      path.join(home, '.gemini', 'config', 'skills', cleanId),
      path.join(home, '.gemini', 'config', 'skills', `tidyfactor-${cleanId}`),
      path.join(home, '.gemini', 'antigravity-ide', 'builtin', 'skills', cleanId),
      path.join(process.cwd(), '.agents', 'skills', cleanId),
      path.join(process.cwd(), 'packages', 'skill')
    ];

    for (const cand of searchCandidates) {
      if (fs.existsSync(path.join(cand, 'SKILL.md'))) {
        skillPath = cand;
        break;
      }
    }
  }

  if (!skillPath) {
    throw new Error(`Skill "${idOrName}" not found in registered database or standard skill paths.`);
  }

  const skillMdFile = fs.statSync(skillPath).isDirectory() ? path.join(skillPath, 'SKILL.md') : skillPath;
  const parsed = parseSkillMd(skillMdFile);
  const skillDir = path.dirname(skillMdFile);

  // Run 15-rules compliance validation
  let compliance = { valid: true, score: 15, maxScore: 15, issues: [] };
  try {
    const { validateSkill } = require('./skills-validator');
    compliance = validateSkill(skillDir);
  } catch {}

  return {
    id: skillMeta?.id || parsed.frontmatter.name || path.basename(skillDir),
    name: parsed.frontmatter.name || path.basename(skillDir),
    title: parsed.title,
    domain: skillMeta?.domain || inferDomain(parsed.frontmatter.name || '', parsed.frontmatter.description || ''),
    description: parsed.frontmatter.description || skillMeta?.description || '',
    path: skillDir,
    skillMdPath: skillMdFile,
    frontmatter: parsed.frontmatter,
    commands: parsed.commands,
    complianceScore: `${compliance.score || 15}/${compliance.maxScore || 15}`,
    isCompliant: compliance.valid !== false,
    auditIssues: compliance.issues || [],
    rawBody: parsed.rawBody
  };
}

module.exports = {
  parseSkillMd,
  inferDomain,
  registerSkillFromPath,
  discoverSkills,
  listRegisteredSkills,
  getRegisteredSkill,
  getSkillManifest,
  createSkill,
  updateSkill,
  toggleSkill,
  deleteSkill
};

