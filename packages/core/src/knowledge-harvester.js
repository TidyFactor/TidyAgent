/**
 * Tidy Ecosystem — Knowledge Harvester & Agent Brain Extractor
 * Discovers, extracts, normalizes, and stages knowledge, decisions, and architectural rules
 * from Antigravity Brain, Gemini Knowledge Items, Cursor, Windsurf, and Claude directories.
 *
 * @module @tidy/core/knowledge-harvester
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { getDb } = require('./db');
const { saveMemory } = require('./memory');

// Standard agent knowledge directories
function getStandardHarvestLocations() {
  const home = os.homedir() || process.env.USERPROFILE || process.env.HOME;
  const geminiRoot = path.join(home, '.gemini');

  return [
    {
      id: 'gemini_knowledge',
      name: 'Gemini Knowledge Base',
      type: 'ki',
      dir: path.join(geminiRoot, 'knowledge')
    },
    {
      id: 'antigravity_brain',
      name: 'Antigravity Brain Sessions',
      type: 'brain',
      dir: path.join(geminiRoot, 'antigravity-ide', 'brain')
    },
    {
      id: 'gemini_rules',
      name: 'Antigravity Agent Rules',
      type: 'rule',
      dir: path.join(geminiRoot, 'config', 'rules')
    },
    {
      id: 'gemini_global_rule',
      name: 'Antigravity Global Rules',
      type: 'file',
      file: path.join(geminiRoot, 'GEMINI.md')
    },
    {
      id: 'cursor_rules',
      name: 'Cursor Rules',
      type: 'rule',
      dir: path.join(home, '.cursor', 'rules')
    },
    {
      id: 'windsurf_memories',
      name: 'Windsurf Memories',
      type: 'rule',
      dir: path.join(home, '.codeium', 'windsurf', 'memories')
    },
    {
      id: 'workspace_agents',
      name: 'Workspace Agent Skills',
      type: 'skill',
      dir: path.join(process.cwd(), '.agents', 'skills')
    }
  ];
}

/**
 * Clean markdown symbols for a crisp summary line
 */
function cleanSummaryText(text, maxLen = 160) {
  if (!text || typeof text !== 'string') return '';
  const cleaned = text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\r?\n+/g, ' ')
    .trim();
  return cleaned.length > maxLen ? cleaned.substring(0, maxLen).trim() + '...' : cleaned;
}

/**
 * Infer category based on textual clues and frontmatter
 */
function inferCategoryFromText(text, fallback = 'fact') {
  if (!text) return fallback;
  const lower = text.toLowerCase();
  if (lower.includes('decision') || lower.includes('قرار') || lower.includes('architecture') || lower.includes('خطة') || lower.includes('plan')) {
    return 'decision';
  }
  if (lower.includes('rule') || lower.includes('قاعدة') || lower.includes('ممنوع') || lower.includes('must') || lower.includes('policy') || lower.includes('يحظر')) {
    return 'rule';
  }
  if (lower.includes('pattern') || lower.includes('نمط') || lower.includes('design') || lower.includes('تصميم') || lower.includes('layout') || lower.includes('walkthrough')) {
    return 'pattern';
  }
  if (lower.includes('preference') || lower.includes('تفضيل') || lower.includes('style') || lower.includes('لون')) {
    return 'preference';
  }
  if (lower.includes('todo') || lower.includes('task') || lower.includes('مهمة') || lower.includes('خطوة')) {
    return 'task';
  }
  return fallback;
}

/**
 * Parse frontmatter and body from markdown
 */
function parseMarkdownDocument(raw) {
  const result = { frontmatter: {}, title: '', body: raw || '' };
  if (!raw || typeof raw !== 'string') return result;

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  let bodyContent = raw;
  if (fmMatch) {
    bodyContent = fmMatch[2];
    const lines = fmMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kv) {
        let val = kv[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result.frontmatter[kv[1]] = val;
      }
    }
  }

  result.body = bodyContent;
  const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    result.title = titleMatch[1].replace(/[\[\]]/g, '').trim();
  }

  return result;
}

/**
 * Scan all supported knowledge locations and extract candidate memories.
 *
 * @param {Object} [options]
 * @param {string[]} [options.customDirs]
 * @param {boolean} [options.checkExisting=true]
 * @param {number} [options.limit=250]
 * @returns {Object} Scan results with candidate items and statistics
 */
function scanKnowledgeSources(options = {}) {
  const {
    customDirs = [],
    checkExisting = true,
    limit = 250
  } = options;

  const locations = getStandardHarvestLocations();
  if (Array.isArray(customDirs)) {
    customDirs.forEach((cd, idx) => {
      if (cd && fs.existsSync(cd)) {
        locations.push({
          id: `custom_${idx}`,
          name: `Custom Directory: ${path.basename(cd)}`,
          type: 'custom',
          dir: cd
        });
      }
    });
  }

  // Load existing memory fingerprints to flag duplicates
  let existingSummaries = new Set();
  let existingContentSnippets = new Set();
  let existingIdsBySummary = new Map();

  if (checkExisting) {
    try {
      const db = getDb();
      const existingRows = db.prepare('SELECT id, summary, SUBSTR(content, 1, 100) as snippet FROM memory_nodes').all();
      for (const row of existingRows) {
        if (row.summary) {
          existingSummaries.add(row.summary.toLowerCase().trim());
          existingIdsBySummary.set(row.summary.toLowerCase().trim(), row.id);
        }
        if (row.snippet) {
          existingContentSnippets.add(row.snippet.toLowerCase().trim());
        }
      }
    } catch {
      // DB might be unitialized or in memory
    }
  }

  const candidateItems = [];
  const sourceStats = {};

  function registerCandidate(item) {
    const sumLower = (item.summary || '').toLowerCase().trim();
    const snipLower = (item.content || '').substring(0, 100).toLowerCase().trim();

    const isDup = existingSummaries.has(sumLower) || existingContentSnippets.has(snipLower);
    item.alreadyImported = isDup;
    if (isDup && existingIdsBySummary.has(sumLower)) {
      item.existingId = existingIdsBySummary.get(sumLower);
    }

    candidateItems.push(item);

    if (!sourceStats[item.source]) {
      sourceStats[item.source] = { id: item.source, label: item.sourceLabel, count: 0 };
    }
    sourceStats[item.source].count++;
  }

  for (const loc of locations) {
    // 1. Single direct file (e.g. GEMINI.md)
    if (loc.file && fs.existsSync(loc.file)) {
      try {
        const stats = fs.statSync(loc.file);
        const raw = fs.readFileSync(loc.file, 'utf8');
        const parsed = parseMarkdownDocument(raw);
        const title = parsed.title || path.basename(loc.file);
        const summary = cleanSummaryText(parsed.body, 160) || title;
        registerCandidate({
          id: `harvest_${crypto.createHash('md5').update(loc.file).digest('hex').slice(0, 10)}`,
          title,
          summary,
          content: parsed.body.trim(),
          category: 'rule',
          tier: 'core',
          importance: 5,
          source: loc.id,
          sourceLabel: loc.name,
          sourcePath: loc.file,
          mtime: stats.mtimeMs,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`
        });
      } catch { }
      continue;
    }

    if (!loc.dir || !fs.existsSync(loc.dir)) continue;

    // 2. Antigravity Brain Sessions (~/.gemini/antigravity-ide/brain/<session>/...)
    if (loc.type === 'brain') {
      try {
        const sessions = fs.readdirSync(loc.dir, { withFileTypes: true });
        for (const sess of sessions) {
          if (!sess.isDirectory()) continue;
          const sessDir = path.join(loc.dir, sess.name);

          // Check for implementation_plan.md
          const planPath = path.join(sessDir, 'implementation_plan.md');
          if (fs.existsSync(planPath)) {
            try {
              const stats = fs.statSync(planPath);
              const raw = fs.readFileSync(planPath, 'utf8');
              const parsed = parseMarkdownDocument(raw);
              const title = parsed.title || `Implementation Plan (${sess.name.slice(0, 8)})`;
              const summary = cleanSummaryText(parsed.body, 160) || title;
              registerCandidate({
                id: `harvest_${crypto.createHash('md5').update(planPath).digest('hex').slice(0, 10)}`,
                title,
                summary,
                content: parsed.body.trim(),
                category: 'decision',
                tier: 'project',
                importance: 4,
                source: loc.id,
                sourceLabel: loc.name,
                sourcePath: planPath,
                mtime: stats.mtimeMs,
                sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`
              });
            } catch { }
          }

          // Check for walkthrough.md
          const walkPath = path.join(sessDir, 'walkthrough.md');
          if (fs.existsSync(walkPath)) {
            try {
              const stats = fs.statSync(walkPath);
              const raw = fs.readFileSync(walkPath, 'utf8');
              const parsed = parseMarkdownDocument(raw);
              const title = parsed.title || `Walkthrough (${sess.name.slice(0, 8)})`;
              const summary = cleanSummaryText(parsed.body, 160) || title;
              registerCandidate({
                id: `harvest_${crypto.createHash('md5').update(walkPath).digest('hex').slice(0, 10)}`,
                title,
                summary,
                content: parsed.body.trim(),
                category: 'pattern',
                tier: 'session',
                importance: 3,
                source: loc.id,
                sourceLabel: loc.name,
                sourcePath: walkPath,
                mtime: stats.mtimeMs,
                sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`
              });
            } catch { }
          }
        }
      } catch { }
      continue;
    }

    // 3. Gemini Knowledge Items (~/.gemini/knowledge/<tier>/...)
    if (loc.type === 'ki') {
      function walkKi(currentPath, depth = 0) {
        if (depth > 5) return;
        try {
          const entries = fs.readdirSync(currentPath, { withFileTypes: true });
          for (const ent of entries) {
            const fullPath = path.join(currentPath, ent.name);
            if (ent.isDirectory()) {
              walkKi(fullPath, depth + 1);
            } else if (ent.isFile()) {
              if (ent.name.endsWith('.md')) {
                const stats = fs.statSync(fullPath);
                const raw = fs.readFileSync(fullPath, 'utf8');
                const parsed = parseMarkdownDocument(raw);
                const title = parsed.title || parsed.frontmatter.id || path.basename(ent.name, '.md');
                const summary = cleanSummaryText(parsed.body, 160) || title;

                // Infer tier from path: global -> core, tech -> project, session -> session
                let tier = 'project';
                if (fullPath.includes(`${path.sep}global${path.sep}`) || parsed.frontmatter.scope === 'global') {
                  tier = 'core';
                } else if (fullPath.includes(`${path.sep}session${path.sep}`)) {
                  tier = 'session';
                }

                const category = inferCategoryFromText(parsed.frontmatter.domain || title || parsed.body, 'pattern');

                registerCandidate({
                  id: `harvest_${crypto.createHash('md5').update(fullPath).digest('hex').slice(0, 10)}`,
                  title,
                  summary,
                  content: parsed.body.trim(),
                  category,
                  tier,
                  importance: tier === 'core' ? 4 : 3,
                  source: loc.id,
                  sourceLabel: loc.name,
                  sourcePath: fullPath,
                  mtime: stats.mtimeMs,
                  sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`
                });
              } else if (ent.name === 'metadata.json') {
                try {
                  const metaRaw = fs.readFileSync(fullPath, 'utf8');
                  const meta = JSON.parse(metaRaw);
                  const stats = fs.statSync(fullPath);
                  const title = meta.title || meta.name || path.basename(currentPath);
                  const summary = cleanSummaryText(meta.summary || meta.description || '', 160) || title;
                  const tier = meta.tier === 'global' ? 'core' : (meta.tier || 'project');
                  const category = inferCategoryFromText(meta.category || meta.domain || title, 'pattern');

                  registerCandidate({
                    id: `harvest_${crypto.createHash('md5').update(fullPath).digest('hex').slice(0, 10)}`,
                    title,
                    summary,
                    content: meta.content || meta.summary || metaRaw,
                    category,
                    tier,
                    importance: 3,
                    source: loc.id,
                    sourceLabel: loc.name,
                    sourcePath: fullPath,
                    mtime: stats.mtimeMs,
                    sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`
                  });
                } catch { }
              }
            }
          }
        } catch { }
      }
      walkKi(loc.dir, 0);
      continue;
    }

    // 4. Generic rules or markdown folder (e.g. ~/.gemini/config/rules, .cursor/rules)
    try {
      const files = fs.readdirSync(loc.dir, { withFileTypes: true });
      for (const f of files) {
        if (!f.isFile() || (!f.name.endsWith('.md') && !f.name.endsWith('.mdc'))) continue;
        const filePath = path.join(loc.dir, f.name);
        try {
          const stats = fs.statSync(filePath);
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = parseMarkdownDocument(raw);
          const title = parsed.title || parsed.frontmatter.name || path.basename(f.name, path.extname(f.name));
          const summary = cleanSummaryText(parsed.body, 160) || title;
          const category = inferCategoryFromText(parsed.frontmatter.domain || parsed.frontmatter.category || title || parsed.body, 'rule');
          const tier = parsed.frontmatter.scope === 'global' ? 'core' : (parsed.frontmatter.tier || 'project');
          registerCandidate({
            id: `harvest_${crypto.createHash('md5').update(filePath).digest('hex').slice(0, 10)}`,
            title,
            summary,
            content: parsed.body.trim(),
            category,
            tier,
            importance: tier === 'core' ? 4 : 3,
            source: loc.id,
            sourceLabel: loc.name,
            sourcePath: filePath,
            mtime: stats.mtimeMs,
            sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`
          });
        } catch { }
      }
    } catch { }
  }

  // Sort candidates: unimported items first, then by most recent mtime descending
  candidateItems.sort((a, b) => {
    if (a.alreadyImported !== b.alreadyImported) {
      return a.alreadyImported ? 1 : -1;
    }
    return (b.mtime || 0) - (a.mtime || 0);
  });

  const sliced = candidateItems.slice(0, limit);
  const newCount = candidateItems.filter(i => !i.alreadyImported).length;
  const alreadyImportedCount = candidateItems.filter(i => i.alreadyImported).length;

  return {
    totalScanned: candidateItems.length,
    newCount,
    alreadyImportedCount,
    sources: Object.values(sourceStats),
    items: sliced
  };
}

/**
 * Read the full document content and metadata for a specific harvested candidate on demand.
 *
 * @param {string} sourcePath Absolute path to the candidate file
 * @returns {Object} Full document representation including raw body, parsed markdown, lines count, etc.
 */
function readHarvestItem(sourcePath) {
  if (!sourcePath || typeof sourcePath !== 'string') {
    throw new Error('sourcePath must be a valid file path string.');
  }

  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Candidate file not found: ${resolved}`);
  }

  const stats = fs.statSync(resolved);
  const raw = fs.readFileSync(resolved, 'utf8');
  let parsed;

  if (resolved.endsWith('.json')) {
    try {
      const meta = JSON.parse(raw);
      parsed = {
        title: meta.title || meta.name || path.basename(path.dirname(resolved)),
        body: meta.content || meta.summary || raw,
        frontmatter: meta
      };
    } catch {
      parsed = { title: path.basename(resolved), body: raw, frontmatter: {} };
    }
  } else {
    parsed = parseMarkdownDocument(raw);
  }

  const title = parsed.title || path.basename(resolved, path.extname(resolved));
  const category = inferCategoryFromText(parsed.frontmatter?.domain || parsed.frontmatter?.category || title || parsed.body, 'pattern');

  let tier = 'project';
  if (resolved.includes(`${path.sep}global${path.sep}`) || parsed.frontmatter?.scope === 'global') {
    tier = 'core';
  } else if (resolved.includes(`${path.sep}session${path.sep}`) || resolved.includes('walkthrough')) {
    tier = 'session';
  }

  // Check Studio interoperability
  const isSkill = resolved.endsWith('SKILL.md') || resolved.includes('skills');
  const isAgent = resolved.includes('agents');
  const isRule = resolved.endsWith('.mdc') || resolved.includes('rules');

  const lines = raw.split(/\r?\n/).length;

  return {
    ok: true,
    sourcePath: resolved,
    title,
    summary: cleanSummaryText(parsed.body, 180) || title,
    content: parsed.body.trim(),
    rawContent: raw,
    frontmatter: parsed.frontmatter || {},
    category,
    tier,
    mtime: stats.mtimeMs,
    mtimeFormatted: new Date(stats.mtimeMs).toLocaleString(),
    sizeBytes: stats.size,
    sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
    linesCount: lines,
    studioInterop: {
      canOpenInStudio: isSkill || isAgent || isRule,
      studioType: isSkill ? 'skill' : (isAgent ? 'agent' : (isRule ? 'rule' : 'file')),
      fileName: path.basename(resolved)
    }
  };
}

/**
 * Import a batch of selected harvested memory candidates into SQLite SSOT.
 *
 * @param {Array<Object>} items Array of candidate memory objects
 * @param {Object} [options]
 * @param {string} [options.contextId]
 * @returns {Object} Import outcome with count and created IDs
 */
function importBatchMemories(items, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No items provided for batch memory import.');
  }

  const db = getDb();
  const contextId = options.contextId || null;
  const importedResults = [];

  // Execute in an atomic transaction
  db.exec('BEGIN TRANSACTION');
  try {
    for (const item of items) {
      let contentToSave = item.content;
      if ((!contentToSave || typeof contentToSave !== 'string' || contentToSave.trim().length === 0) && item.sourcePath && fs.existsSync(item.sourcePath)) {
        try {
          const loaded = readHarvestItem(item.sourcePath);
          contentToSave = loaded.content;
        } catch { }
      }

      if (!contentToSave || typeof contentToSave !== 'string' || contentToSave.trim().length === 0) {
        continue;
      }

      const saved = saveMemory({
        content: contentToSave.trim(),
        summary: item.summary ? item.summary.trim() : (item.title || contentToSave.trim().slice(0, 120)),
        tier: item.tier || 'project',
        category: item.category || 'fact',
        importance: Math.max(1, Math.min(5, Number(item.importance) || 3)),
        contextId: item.contextId || contextId
      });

      importedResults.push(saved);
    }
    db.exec('COMMIT');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { }
    throw err;
  }

  // Record harvest event in audit log
  try {
    const auditStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
    auditStmt.run(
      'HARVEST_BATCH_IMPORT',
      'knowledge_harvester',
      JSON.stringify({
        importedCount: importedResults.length,
        sources: [...new Set(items.map(i => i.source).filter(Boolean))]
      })
    );
  } catch { }

  return {
    ok: true,
    importedCount: importedResults.length,
    items: importedResults
  };
}

module.exports = {
  scanKnowledgeSources,
  readHarvestItem,
  importBatchMemories,
  getStandardHarvestLocations,
  cleanSummaryText,
  inferCategoryFromText
};
