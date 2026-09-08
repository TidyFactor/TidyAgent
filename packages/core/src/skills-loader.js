/**
 * Tidy Ecosystem — Skill-as-Agent Loader & Discovery Engine
 * Scans, parses, and bridges community skills (TidyFactor Skills-LAB) into context-injected managed subagents.
 *
 * @module @tidy/core/skills-loader
 * @version 1.4.2
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
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
  const cmdMatches = body.matchAll(/`([a-zA-Z0-9_-]+)`\s*—\s*([^.\n]+)/g);
  for (const m of cmdMatches) {
    commands.push({ command: m[1], description: m[2].trim() });
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
function listRegisteredSkills() {
  const db = getDb();
  return db.prepare('SELECT * FROM registered_skills WHERE is_enabled = 1 ORDER BY alias ASC').all();
}

/**
 * Get a registered skill by alias or name
 */
function getRegisteredSkill(aliasOrName) {
  const db = getDb();
  return db.prepare('SELECT * FROM registered_skills WHERE alias = ? OR name = ? LIMIT 1').get(aliasOrName, aliasOrName);
}

module.exports = {
  parseSkillMd,
  inferDomain,
  registerSkillFromPath,
  discoverSkills,
  listRegisteredSkills,
  getRegisteredSkill
};
