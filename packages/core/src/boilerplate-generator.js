/**
 * Tidy Ecosystem — Tool-Specific Boilerplate Generator
 * Generates compliant starter templates for Claude Code, Cursor, Codex, Windsurf,
 * and TidyFactor Skills-LAB.
 *
 * @module @tidy/core/boilerplate-generator
 * @version 1.4.4
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');

function generateSkillMd({ name, description, title, author = 'Tidy User' }) {
  const dateStr = new Date().toISOString().split('T')[0];
  const safeName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const safeDesc = (description || 'Autonomous assistant skill with context injection.').replace(/"/g, "'");

  return `---
name: "${safeName}"
description: "${safeDesc}"
---

# ${title || safeName}

<!-- last-verified: ${dateStr} -->

An autonomous skill for the TidyFactor ecosystem and AI coding assistants.

## Commands

| User intent | Command | What it loads |
|---|---|---|
| "Run ${safeName} workflow" | \`references/commands/run.md\` | \`workflows/main.md\` + \`memory/context.md\` |
| "Audit ${safeName} configuration" | \`references/commands/audit.md\` | \`workflows/audit.md\` + \`memory/rules.md\` |

## Protocol & Operational Rules

1. **Context-First**: Always inspect active workspace facts before asking the user.
2. **Quality Bar**: Deliver production-ready code with complete error handling.
3. **Zero Robotic Preamble**: No conversational filler; directly execute and report results.
`;
}

function generateAgentPrompt({ name, role, description }) {
  const safeName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `---
name: "${safeName}"
role: "${role || 'Specialized Autonomous Agent'}"
description: "${(description || 'Specialized role execution.').replace(/"/g, "'")}"
---

You are @${safeName}, a specialized AI agent operating under the Tidy Sovereign Cognitive Architecture.

## Role & Mission
${role || 'Specialized Autonomous Agent'}: ${description || 'Execute tasks with high precision.'}

## Operating Guidelines
1. Maintain strict 3-Ring Context awareness (User Identity, Project Context, Active Memory).
2. Adhere to the Single Source of Truth (SQLite SSOT).
3. Validate all inputs and enforce atomic, safe execution.
`;
}

function generateCursorRule({ name, description, globs = '**/*' }) {
  return `---
description: "${(description || 'Cursor project development rule.').replace(/"/g, "'")}"
globs: "${globs}"
alwaysApply: false
---

# ${name} Rules & Standards

- Adhere to the clean architecture conventions of this codebase.
- Prefer modular, single-responsibility files.
- Enforce strict typing and test coverage on newly added functions.
`;
}

function generateWindsurfMemory({ name, description }) {
  return `# ${name} Memory

${description || 'Contextual memory for Windsurf agent.'}

- Architecture: Local-first SQLite SSOT.
- Design Standards: Apple x Cartier luxury aesthetics.
- Performance: Zero-latency async I/O.
`;
}

/**
 * Generate full item according to tool and type
 */
function createBoilerplate({ tool = 'global', type = 'skill', name, description = '', targetDir = null }) {
  if (!name) throw new Error('Item name is required');

  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  let finalDir = targetDir;
  let filePath;
  let content;

  if (type === 'skill') {
    if (!finalDir) {
      const home = require('os').homedir();
      if (tool === 'claude') finalDir = path.join(home, '.claude', 'skills', slug);
      else if (tool === 'cursor') finalDir = path.join(home, '.cursor', 'skills', slug);
      else if (tool === 'antigravity') finalDir = path.join(home, '.gemini', 'config', 'skills', slug);
      else finalDir = path.join(home, '.agents', 'skills', slug);
    }
    filePath = path.join(finalDir, 'SKILL.md');
    content = generateSkillMd({ name: slug, description, title: name });
  } else if (type === 'agent') {
    if (!finalDir) {
      const home = require('os').homedir();
      if (tool === 'claude') finalDir = path.join(home, '.claude', 'agents');
      else if (tool === 'cursor') finalDir = path.join(home, '.cursor', 'agents');
      else finalDir = path.join(home, '.agents', 'agents');
    }
    filePath = path.join(finalDir, `${slug}.md`);
    content = generateAgentPrompt({ name: slug, role: name, description });
  } else if (type === 'rule') {
    if (!finalDir) {
      const home = require('os').homedir();
      if (tool === 'cursor') finalDir = path.join(home, '.cursor', 'rules');
      else if (tool === 'windsurf') finalDir = path.join(home, '.windsurf', 'rules');
      else finalDir = path.join(process.cwd(), '.cursor', 'rules');
    }
    filePath = path.join(finalDir, `${slug}.mdc`);
    content = generateCursorRule({ name, description });
  }

  // Ensure directory exists
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filePath, content, 'utf8');

  // Invalidate scan cache immediately so the new item appears on next scan
  try {
    const { invalidateScanCache } = require('./multi-tool-scanner');
    invalidateScanCache();
  } catch {}

  return {
    ok: true,
    tool,
    type,
    name: slug,
    filePath,
    dir: finalDir,
    content
  };
}

module.exports = {
  generateSkillMd,
  generateAgentPrompt,
  generateCursorRule,
  generateWindsurfMemory,
  createBoilerplate
};
