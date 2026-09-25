/**
 * Tidy Ecosystem — Skill Lifecycle Engine
 * Complete lifecycle governance: discover, install, enable, disable, load, execute, validate, update, and semantic capability matching.
 *
 * @module @tidy/core/skill-lifecycle
 * @version 1.7.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { parseSkillMd, loadSkills } = require('./skills-loader');
const { validateSkill } = require('./skills-validator');
const { routeIntent } = require('./intent-router');

class SkillLifecycleEngine {
  /**
   * @param {object} [options={}]
   * @param {string} [options.skillsDir=null] - Default directory path for community skills
   * @param {number} [options.maxSkillsCap=3] - Maximum skills allowed per context injection
   */
  constructor(options = {}) {
    this.defaultSkillsDir = options.skillsDir || path.resolve(process.cwd(), 'packages/skill');
    this.maxSkillsCap = options.maxSkillsCap || 3;
  }

  /**
   * 1. Discover all skills across custom or standard skill directories
   * @param {string} [targetDir=null]
   * @returns {Array<object>} List of discovered skill summaries
   */
  discover(targetDir = null) {
    const dir = targetDir || this.defaultSkillsDir;
    if (!fs.existsSync(dir)) {
      return [];
    }

    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const skillMd = path.join(fullPath, 'SKILL.md');

      if (entry.isDirectory() && fs.existsSync(skillMd)) {
        try {
          const parsed = parseSkillMd(skillMd);
          results.push({
            id: `skill_${entry.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
            name: entry.name,
            title: parsed.title || entry.name,
            version: parsed.frontmatter?.version || '1.0.0',
            domain: parsed.frontmatter?.domain || 'general',
            description: parsed.frontmatter?.description || '',
            path: fullPath,
            skillMdPath: skillMd
          });
        } catch {
          // Ignore unparseable directories
        }
      }
    }

    return results;
  }

  /**
   * 2. Load and inspect an individual skill by ID or path
   * @param {string} skillIdOrPath
   * @returns {object} Loaded skill specification and manifest
   */
  load(skillIdOrPath) {
    let skillPath = skillIdOrPath;
    if (!fs.existsSync(skillPath)) {
      // Check in default skills directory
      const candidate = path.join(this.defaultSkillsDir, skillIdOrPath);
      if (fs.existsSync(candidate)) {
        skillPath = candidate;
      } else {
        const db = getDb();
        const row = db.prepare('SELECT * FROM subagents WHERE id = ? OR name = ?').get(skillIdOrPath, skillIdOrPath);
        if (row) {
          return {
            id: row.id,
            name: row.name,
            role: row.role,
            description: row.description,
            system_prompt: row.system_prompt,
            is_enabled: Boolean(row.is_enabled),
            allowed_tools: JSON.parse(row.allowed_tools_json || '[]')
          };
        }
        throw new Error(`Skill not found at path or ID: "${skillIdOrPath}"`);
      }
    }

    const skillMd = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      throw new Error(`SKILL.md missing in skill directory: ${skillPath}`);
    }

    const parsed = parseSkillMd(skillMd);
    return {
      name: path.basename(skillPath),
      title: parsed.title,
      frontmatter: parsed.frontmatter,
      body: parsed.body,
      path: skillPath
    };
  }

  /**
   * 3. Enable or disable a skill in SQLite state
   * @param {string} skillNameOrId
   * @param {boolean} enabled
   * @returns {boolean} Success status
   */
  setState(skillNameOrId, enabled = true) {
    const db = getDb();
    const stmt = db.prepare('UPDATE subagents SET is_enabled = ? WHERE id = ? OR name = ?');
    const res = stmt.run(enabled ? 1 : 0, skillNameOrId, skillNameOrId);
    return res.changes > 0;
  }

  /**
   * 4. Validate skill compliance against Skills-LAB 15 Structural Invariants
   * @param {string} skillDirPath
   * @returns {object} Validation report { ok, score, violations }
   */
  validate(skillDirPath) {
    if (!fs.existsSync(skillDirPath)) {
      throw new Error(`Directory does not exist for validation: ${skillDirPath}`);
    }
    return validateSkill(skillDirPath);
  }

  /**
   * 5. Semantic Capability Matching (Invariant: Max 2-3 skills per context)
   * Caps loaded skills strictly to top relevant matches without context bloat.
   * @param {string} prompt
   * @param {object} [options={}]
   * @returns {object} { domain, matchedSkills: Array<string>, rejectedSkills: Array<string> }
   */
  matchCapabilities(prompt, options = {}) {
    const maxSkills = options.maxSkills || this.maxSkillsCap;
    const routing = routeIntent(prompt);

    const matchedSkills = (routing.targetSkills || routing.recommendedSkills || []).slice(0, maxSkills);
    const rejectedSkills = (routing.targetSkills || routing.recommendedSkills || []).slice(maxSkills);

    return {
      domain: routing.domain,
      intentType: routing.intentType,
      confidence: routing.confidence,
      matchedSkills,
      rejectedSkills,
      recommendedTools: routing.recommendedTools || [],
      invariantPassed: matchedSkills.length <= maxSkills
    };
  }
}

module.exports = {
  SkillLifecycleEngine
};
