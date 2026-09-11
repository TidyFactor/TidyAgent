/**
 * Tidy Ecosystem — Hybrid 4-Tier Knowledge Base & SQLite Search
 * Merges SQLite SSOT FTS5 BM25 recall with disk-based 4-tier markdown knowledge scanning.
 *
 * @module @tidy/core/hybrid-search
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { recallMemory } = require('./memory');

function getHomeDir() {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
}

function getKnowledgeRootDir() {
  return path.join(getHomeDir(), '.gemini', 'knowledge');
}

/**
 * Parses frontmatter and extracts title, rule, and text from markdown files.
 */
function parseKiFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    let title = path.basename(filePath, path.extname(filePath));
    let summary = '';
    let negativeConstraint = '';
    let body = raw;

    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (fmMatch) {
      const frontmatterText = fmMatch[1];
      body = fmMatch[2];

      for (const line of frontmatterText.split(/\r?\n/)) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim().toLowerCase();
          const val = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (key === 'title') title = val;
          if (key === 'summary' || key === 'rule') summary = val;
          if (key === 'negative_constraint' || key === 'negativeconstraint') negativeConstraint = val;
        }
      }
    }

    return {
      filePath,
      title,
      summary: summary || body.slice(0, 160).trim().replace(/\r?\n/g, ' '),
      negativeConstraint,
      content: body
    };
  } catch {
    return null;
  }
}

/**
 * Recursively scans markdown files under a target directory.
 */
function scanMarkdownFiles(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanMarkdownFiles(fullPath, files);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
        files.push(fullPath);
      }
    }
  } catch {}
  return files;
}

/**
 * Executes hybrid multi-store knowledge search.
 *
 * @param {object} params
 * @param {string} params.query Search keywords
 * @param {string} [params.scope='all'] Tier scope: 'all', 'global', 'tech', 'project', 'session'
 * @param {string} [params.projectId] Project key if scope is project
 * @param {string} [params.domain] Optional domain tag (dev, marketing, ops)
 * @param {number} [params.limit=5] Max combined results to return
 * @returns {object} Ranked combined search results
 */
function searchHybridKnowledge(params = {}) {
  const query = (params.query || '').trim();
  if (!query) {
    return { query: '', totalCount: 0, matches: [] };
  }

  const scope = (params.scope || 'all').toLowerCase();
  const projectId = params.projectId || null;
  const limit = Math.max(1, Math.min(params.limit || 5, 50));
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

  const matches = [];

  // 1. Search SQLite SSOT Memory (FTS5 BM25 + Cognitive Decay)
  try {
    const sqliteTier = ['core', 'project', 'session', 'ephemeral'].includes(scope) ? scope : undefined;
    const dbResults = recallMemory({
      query,
      tier: sqliteTier,
      limit: Math.max(limit, 10)
    });

    if (Array.isArray(dbResults)) {
      for (const item of dbResults) {
        matches.push({
          id: item.id,
          source: 'sqlite',
          title: item.summary || item.content?.slice(0, 60) || 'Memory Record',
          snippet: item.content ? item.content.slice(0, 240) : '',
          tier: item.tier || 'project',
          category: item.category || 'fact',
          score: item.score || 1.0,
          location: 'sqlite://memory_nodes'
        });
      }
    }
  } catch {}

  // 2. Search 4-Tier Knowledge Files on Disk (~/.gemini/knowledge/)
  const knowledgeRoot = getKnowledgeRootDir();
  const targetDirs = [];

  if (scope === 'all' || scope === 'global') {
    targetDirs.push({ dir: path.join(knowledgeRoot, 'global'), tier: 'global' });
  }
  if (scope === 'all' || scope === 'tech') {
    targetDirs.push({ dir: path.join(knowledgeRoot, 'tech'), tier: 'tech' });
  }
  if (scope === 'all' || scope === 'project' || scope === 'projects') {
    const projectsRoot = path.join(knowledgeRoot, 'projects');
    if (projectId) {
      targetDirs.push({ dir: path.join(projectsRoot, projectId), tier: 'project' });
    } else {
      targetDirs.push({ dir: projectsRoot, tier: 'project' });
    }
  }
  if (scope === 'all' || scope === 'session') {
    targetDirs.push({ dir: path.join(knowledgeRoot, 'session'), tier: 'session' });
  }

  for (const { dir, tier } of targetDirs) {
    const diskFiles = scanMarkdownFiles(dir);
    for (const filePath of diskFiles) {
      const parsed = parseKiFile(filePath);
      if (!parsed) continue;

      const haystack = `${parsed.title} ${parsed.summary} ${parsed.negativeConstraint} ${parsed.content}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (haystack.includes(token)) matchCount++;
      }

      if (matchCount > 0) {
        const relevance = Number((matchCount / queryTokens.length).toFixed(2));
        matches.push({
          id: path.basename(filePath, path.extname(filePath)),
          source: 'disk',
          title: parsed.title,
          snippet: parsed.summary || parsed.content.slice(0, 240),
          negativeConstraint: parsed.negativeConstraint || null,
          tier,
          category: 'knowledge_item',
          score: relevance,
          location: filePath
        });
      }
    }
  }

  // Deduplicate and rank by score descending
  const seen = new Set();
  const ranked = [];
  matches.sort((a, b) => (b.score || 0) - (a.score || 0));

  for (const item of matches) {
    const key = `${item.title}:${item.snippet.slice(0, 40)}`;
    if (!seen.has(key)) {
      seen.add(key);
      ranked.push(item);
    }
    if (ranked.length >= limit) break;
  }

  return {
    query,
    scope,
    totalCount: ranked.length,
    matches: ranked
  };
}

module.exports = {
  searchHybridKnowledge,
  getKnowledgeRootDir,
  parseKiFile
};
