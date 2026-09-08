/**
 * Tidy Ecosystem — Sovereignty & Portability Engine
 * Zero-Vendor-Lockin: Obsidian PARA Markdown Export/Import & Full JSON SSOT Migration.
 *
 * @module @tidy/core/portability
 * @version 1.4.2
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
 */


const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { saveMemory } = require('./memory');

/**
 * Format string as safe filename
 */
function sanitizeFilename(str) {
  return str
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

/**
 * Format YAML frontmatter
 */
function formatFrontmatter(meta) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(meta)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (typeof value === 'string' && (value.includes(':') || value.includes('\n') || value.includes('"'))) {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Parse YAML frontmatter and body from Markdown content
 */
function parseMarkdownWithFrontmatter(rawContent) {
  const trimmed = rawContent.trim();
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: trimmed };
  }

  const endIndex = trimmed.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: trimmed };
  }

  const rawMeta = trimmed.substring(3, endIndex).trim();
  const body = trimmed.substring(endIndex + 4).trim();
  const frontmatter = {};

  for (const line of rawMeta.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      let val = line.substring(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

/**
 * Export entire Tidy SQLite SSOT to Obsidian PARA-compliant Markdown Vault
 * Structure:
 * - Projects/  -> Active tasks & project memories
 * - Areas/     -> Daily journal & domain contexts
 * - Resources/ -> Code snippets & core rules/facts
 * - Archive/   -> Completed tasks & ephemeral notes
 */
function exportToMarkdown(targetDir) {
  const db = getDb();
  const resolvedDir = path.resolve(targetDir);

  const dirs = {
    projects: path.join(resolvedDir, 'Projects'),
    areas: path.join(resolvedDir, 'Areas'),
    resources: path.join(resolvedDir, 'Resources'),
    archive: path.join(resolvedDir, 'Archive')
  };

  for (const dir of Object.values(dirs)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const counts = { projects: 0, areas: 0, resources: 0, archive: 0 };

  // 1. Export Memories
  const memories = db.prepare(`
    SELECT m.*, c.domain as context_domain, c.name as context_name
    FROM memory_nodes m
    LEFT JOIN contexts c ON m.context_id = c.id
  `).all();

  for (const mem of memories) {
    const meta = {
      id: mem.id,
      domain: mem.context_domain || 'general',
      category: mem.category,
      tier: mem.tier,
      importance: mem.importance,
      access_count: mem.access_count,
      created_at: mem.created_at
    };

    const filename = `${sanitizeFilename(mem.summary || mem.id)}.md`;
    let destFolder = dirs.resources;

    if (mem.tier === 'core' || mem.category === 'rule') {
      destFolder = dirs.resources;
      counts.resources++;
    } else if (mem.tier === 'project') {
      destFolder = dirs.projects;
      counts.projects++;
    } else if (mem.tier === 'session') {
      destFolder = dirs.areas;
      counts.areas++;
    } else {
      destFolder = dirs.archive;
      counts.archive++;
    }

    const content = `${formatFrontmatter(meta)}\n\n# ${mem.summary || 'Memory Node'}\n\n${mem.content}\n`;
    fs.writeFileSync(path.join(destFolder, filename), content, 'utf8');
  }

  // 2. Export Tasks
  const tasks = db.prepare('SELECT * FROM app_tasks').all();
  for (const t of tasks) {
    const meta = {
      id: t.id,
      type: 'task',
      priority: t.priority,
      status: t.status,
      domain: t.domain,
      assigned_agent: t.assigned_agent,
      created_at: t.created_at,
      completed_at: t.completed_at
    };

    const filename = `task_${sanitizeFilename(t.title)}.md`;
    const destFolder = t.status === 'completed' ? dirs.archive : dirs.projects;

    if (t.status === 'completed') counts.archive++;
    else counts.projects++;

    const content = `${formatFrontmatter(meta)}\n\n# [${t.status.toUpperCase()}] ${t.title}\n\n${t.description || ''}\n\n${t.result_brief ? `### Outcome / Brief\n${t.result_brief}\n` : ''}`;
    fs.writeFileSync(path.join(destFolder, filename), content, 'utf8');
  }

  // 3. Export Snippets
  const snippets = db.prepare('SELECT * FROM app_snippets').all();
  for (const s of snippets) {
    const meta = {
      id: s.id,
      type: 'snippet',
      language: s.language,
      tags: s.tags_json ? JSON.parse(s.tags_json) : [],
      created_at: s.created_at
    };

    const filename = `snippet_${sanitizeFilename(s.title)}.md`;
    const content = `${formatFrontmatter(meta)}\n\n# ${s.title}\n\n\`\`\`${s.language}\n${s.code}\n\`\`\`\n`;
    fs.writeFileSync(path.join(dirs.resources, filename), content, 'utf8');
    counts.resources++;
  }

  // 4. Export Journal Entries
  const journal = db.prepare('SELECT * FROM app_journal').all();
  for (const j of journal) {
    const meta = {
      id: j.id,
      type: 'journal',
      mood: j.mood,
      domain: j.domain,
      created_at: j.created_at
    };

    const filename = `journal_${sanitizeFilename(j.title)}.md`;
    const content = `${formatFrontmatter(meta)}\n\n# ${j.title}\n\n*Mood: ${j.mood}*\n\n${j.entry}\n`;
    fs.writeFileSync(path.join(dirs.areas, filename), content, 'utf8');
    counts.areas++;
  }

  return {
    success: true,
    targetDir: resolvedDir,
    totalExported: counts.projects + counts.areas + counts.resources + counts.archive,
    breakdown: counts
  };
}

/**
 * Export complete SQLite SSOT to single atomic JSON document
 */
function exportToJson(targetFile) {
  const db = getDb();
  const resolvedPath = path.resolve(targetFile);

  const payload = {
    schema_version: '1.4.1',
    exported_at: new Date().toISOString(),
    format: 'tidy_ssot_v1',
    user_profile: db.prepare('SELECT * FROM user_profile').all(),
    contexts: db.prepare('SELECT * FROM contexts').all(),
    memory_nodes: db.prepare('SELECT * FROM memory_nodes').all(),
    app_tasks: db.prepare('SELECT * FROM app_tasks').all(),
    app_snippets: db.prepare('SELECT * FROM app_snippets').all(),
    app_journal: db.prepare('SELECT * FROM app_journal').all(),
    app_vault: db.prepare('SELECT key, value, is_secret, updated_at FROM app_vault').all(),
    subagents: db.prepare('SELECT * FROM subagents').all(),
    registered_skills: db.prepare('SELECT * FROM registered_skills').all()
  };

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, JSON.stringify(payload, null, 2), 'utf8');

  const totalCount =
    payload.contexts.length +
    payload.memory_nodes.length +
    payload.app_tasks.length +
    payload.app_snippets.length +
    payload.app_journal.length;

  return {
    success: true,
    filePath: resolvedPath,
    totalRecords: totalCount,
    counts: {
      contexts: payload.contexts.length,
      memories: payload.memory_nodes.length,
      tasks: payload.app_tasks.length,
      snippets: payload.app_snippets.length,
      journal: payload.app_journal.length,
      vaultKeys: payload.app_vault.length
    }
  };
}

/**
 * Import atomic JSON document into SQLite SSOT
 */
function importFromJson(sourceFile, { mergeStrategy = 'upsert' } = {}) {
  const resolvedPath = path.resolve(sourceFile);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Source JSON file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const payload = JSON.parse(raw);
  const db = getDb();

  let imported = { memories: 0, tasks: 0, snippets: 0, journal: 0 };

  // Import memories
  if (Array.isArray(payload.memory_nodes)) {
    const stmt = db.prepare(`
      INSERT INTO memory_nodes (id, context_id, tier, category, content, summary, importance, access_count, decay_score, created_at, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        summary = excluded.summary,
        importance = excluded.importance,
        decay_score = excluded.decay_score
    `);

    for (const m of payload.memory_nodes) {
      stmt.run(
        m.id,
        m.context_id || 'ctx_general',
        m.tier || 'project',
        m.category || 'fact',
        m.content,
        m.summary || m.content.substring(0, 100),
        m.importance || 3,
        m.access_count || 0,
        m.decay_score || 1.0,
        m.created_at || new Date().toISOString(),
        m.last_accessed_at || new Date().toISOString()
      );
      imported.memories++;
    }
  }

  // Import tasks
  if (Array.isArray(payload.app_tasks)) {
    const stmt = db.prepare(`
      INSERT INTO app_tasks (id, title, description, priority, domain, assigned_agent, status, due_date, tags_json, created_at, completed_at, result_brief)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        result_brief = excluded.result_brief
    `);

    for (const t of payload.app_tasks) {
      stmt.run(
        t.id,
        t.title,
        t.description || '',
        t.priority || 'medium',
        t.domain || 'general',
        t.assigned_agent || null,
        t.status || 'pending',
        t.due_date || null,
        t.tags_json || '[]',
        t.created_at || new Date().toISOString(),
        t.completed_at || null,
        t.result_brief || null
      );
      imported.tasks++;
    }
  }

  // Import snippets
  if (Array.isArray(payload.app_snippets)) {
    const stmt = db.prepare(`
      INSERT INTO app_snippets (id, title, language, code, tags_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code = excluded.code,
        language = excluded.language
    `);

    for (const s of payload.app_snippets) {
      stmt.run(s.id, s.title, s.language || 'javascript', s.code, s.tags_json || '[]', s.created_at || new Date().toISOString());
      imported.snippets++;
    }
  }

  // Import journal
  if (Array.isArray(payload.app_journal)) {
    const stmt = db.prepare(`
      INSERT INTO app_journal (id, title, entry, mood, domain, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET entry = excluded.entry
    `);

    for (const j of payload.app_journal) {
      stmt.run(j.id, j.title, j.entry, j.mood || 'focused', j.domain || 'general', j.created_at || new Date().toISOString());
      imported.journal++;
    }
  }

  return {
    success: true,
    sourceFile: resolvedPath,
    totalImported: imported.memories + imported.tasks + imported.snippets + imported.journal,
    breakdown: imported
  };
}

/**
 * Import external Markdown file or directory into SQLite SSOT
 */
function importFromMarkdown(sourcePath, { defaultDomain = 'general', defaultTier = 'project' } = {}) {
  const resolvedPath = path.resolve(sourcePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);
  const files = [];

  if (stat.isDirectory()) {
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          scanDir(full);
        } else if (e.isFile() && e.name.endsWith('.md')) {
          files.push(full);
        }
      }
    }
    scanDir(resolvedPath);
  } else if (stat.isFile() && resolvedPath.endsWith('.md')) {
    files.push(resolvedPath);
  }

  let importedCount = 0;
  const importedNodes = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const { frontmatter, body } = parseMarkdownWithFrontmatter(content);

    if (!body || body.trim().length === 0) continue;

    const baseName = path.basename(file, '.md').replace(/[-_]/g, ' ');
    const title = frontmatter.title || baseName;
    const tier = frontmatter.tier || defaultTier;
    const category = frontmatter.category || (frontmatter.type === 'snippet' ? 'pattern' : 'fact');
    const importance = frontmatter.importance ? Number(frontmatter.importance) : 3;

    const node = saveMemory({
      content: body,
      summary: title,
      tier,
      category,
      importance
    });

    importedNodes.push(node);
    importedCount++;
  }

  return {
    success: true,
    totalImported: importedCount,
    filesProcessed: files.length
  };
}

module.exports = {
  exportToMarkdown,
  exportToJson,
  importFromJson,
  importFromMarkdown
};
