/**
 * Tidy Ecosystem — Multi-Tool Skills & Agents Discovery Engine
 * Scans, indexes, and normalizes skills, agents, and rules across Claude Code,
 * Cursor, Codex, Windsurf, Copilot, Aider, Amp, Antigravity, and Global directories.
 *
 * @module @tidy/core/multi-tool-scanner
 * @version 1.4.4
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDb } = require('./db');

// Supported Tool Identifiers and Display Badges
const TOOL_DEFINITIONS = {
  global: { id: 'global', name: 'Global', icon: '🌐', lobeIcon: 'global', label: 'Global' },
  claude: { id: 'claude', name: 'Claude Code', icon: '🤖', lobeIcon: 'claude', label: 'Claude Code' },
  cursor: { id: 'cursor', name: 'Cursor', icon: '💎', lobeIcon: 'cursor', label: 'Cursor' },
  codex: { id: 'codex', name: 'Codex', icon: '⚡', lobeIcon: 'codex', label: 'Codex' },
  copilot: { id: 'copilot', name: 'Copilot', icon: '🐙', lobeIcon: 'copilot', label: 'Copilot' },
  windsurf: { id: 'windsurf', name: 'Windsurf', icon: '🌊', lobeIcon: 'windsurf', label: 'Windsurf' },
  amp: { id: 'amp', name: 'Amp', icon: '📦', lobeIcon: 'amp', label: 'Amp' },
  antigravity: { id: 'antigravity', name: 'Antigravity', icon: '🚀', lobeIcon: 'antigravity', label: 'Antigravity' },
  aider: { id: 'aider', name: 'Aider', icon: '⚙️', lobeIcon: 'aider', label: 'Aider' },
  openclaw: { id: 'openclaw', name: 'OpenClaw', icon: '🦞', lobeIcon: 'openclaw', label: 'OpenClaw' },
  custom: { id: 'custom', name: 'Custom', icon: '📁', lobeIcon: 'custom', label: 'Custom' }
};

/**
 * Lightweight YAML frontmatter parser
 */
function parseFrontmatter(rawContent) {
  const result = {
    frontmatter: {},
    body: rawContent,
    rawFrontmatter: ''
  };

  if (!rawContent || typeof rawContent !== 'string') return result;

  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return result;

  result.rawFrontmatter = match[1];
  result.body = match[2];

  const lines = match[1].split(/\r?\n/);
  let currentKey = null;
  let currentValue = '';

  for (const line of lines) {
    const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey) {
        result.frontmatter[currentKey] = cleanScalar(currentValue);
      }
      currentKey = kvMatch[1];
      currentValue = kvMatch[2] || '';
    } else if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      currentValue += ' ' + line.trim();
    }
  }

  if (currentKey) {
    result.frontmatter[currentKey] = cleanScalar(currentValue);
  }

  return result;
}

function cleanScalar(val) {
  if (!val) return '';
  let str = val.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  return str;
}

/**
 * Get all standard search locations per tool.
 * Covers: Claude Code, Cursor, Windsurf, Codex, Amp, Aider, Copilot,
 * Antigravity (Google Gemini) — including Skills-LAB, Builtin Skills,
 * GEMINI.md global rules, and Knowledge Items (KIs).
 */
function getStandardScanLocations(cwd = process.cwd()) {
  const home = os.homedir();
  const geminiRoot = path.join(home, '.gemini');

  return [
    // ── Global User ─────────────────────────────────────────────────────────
    { tool: 'global', type: 'skill', dir: path.join(home, '.agents', 'skills') },

    // ── Claude Code ──────────────────────────────────────────────────────────
    { tool: 'claude', type: 'skill', dir: path.join(home, '.claude', 'skills') },
    { tool: 'claude', type: 'agent', dir: path.join(home, '.claude', 'agents') },

    // ── Cursor ───────────────────────────────────────────────────────────────
    { tool: 'cursor', type: 'skill', dir: path.join(home, '.cursor', 'skills') },
    { tool: 'cursor', type: 'rule', dir: path.join(home, '.cursor', 'rules') },
    { tool: 'cursor', type: 'agent', dir: path.join(home, '.cursor', 'agents') },

    // ── Windsurf ─────────────────────────────────────────────────────────────
    { tool: 'windsurf', type: 'skill', dir: path.join(home, '.codeium', 'windsurf', 'memories') },
    { tool: 'windsurf', type: 'rule', dir: path.join(home, '.windsurf', 'rules') },

    // ── Codex ────────────────────────────────────────────────────────────────
    { tool: 'codex', type: 'skill', dir: path.join(home, '.codex', 'skills') },
    { tool: 'codex', type: 'agent', dir: path.join(home, '.codex', 'agents') },

    // ── Amp ──────────────────────────────────────────────────────────────────
    { tool: 'amp', type: 'skill', dir: path.join(home, '.config', 'amp', 'skills') },

    // ── Antigravity / Google Gemini ──────────────────────────────────────────
    // 1. GEMINI.md — global agent rules file (equivalent to AGENTS.md / .cursorrules)
    { tool: 'antigravity', type: 'rule', dir: path.join(geminiRoot, 'GEMINI.md'), isDirectFile: true },

    // 2. TidyFactor Skills-LAB community skills (~/.gemini/config/skills/<skill>/SKILL.md)
    { tool: 'antigravity', type: 'skill', dir: path.join(geminiRoot, 'config', 'skills') },

    // 3. User-defined rules (~/.gemini/config/rules/*.md)
    { tool: 'antigravity', type: 'rule', dir: path.join(geminiRoot, 'config', 'rules') },

    // 4. Antigravity IDE Builtin Skills (~/.gemini/antigravity-ide/builtin/skills/)
    //    Houses: agy-customizations, antigravity_guide, permissioned-github, etc.
    { tool: 'antigravity', type: 'skill', dir: path.join(geminiRoot, 'antigravity-ide', 'builtin', 'skills') },

    // 5. Antigravity IDE Builtin root (catches skills directly in builtin/)
    { tool: 'antigravity', type: 'skill', dir: path.join(geminiRoot, 'antigravity-ide', 'builtin') },

    // 6. Knowledge Items (KIs) — TidyFactor Brain memory tiers
    //    Structure: ~/.gemini/knowledge/{tier}/{ki-name}/metadata.json
    { tool: 'antigravity', type: 'ki', dir: path.join(geminiRoot, 'knowledge', 'global') },
    { tool: 'antigravity', type: 'ki', dir: path.join(geminiRoot, 'knowledge', 'tech') },
    { tool: 'antigravity', type: 'ki', dir: path.join(geminiRoot, 'knowledge', 'projects') },
    { tool: 'antigravity', type: 'ki', dir: path.join(geminiRoot, 'knowledge', 'session') },

    // ── Project-Level Detection ───────────────────────────────────────────────
    { tool: 'copilot', type: 'rule', dir: path.join(cwd, '.github', 'copilot-instructions.md'), isDirectFile: true },
    { tool: 'copilot', type: 'skill', dir: path.join(cwd, '.github', 'skills') },
    { tool: 'copilot', type: 'agent', dir: path.join(cwd, '.github', 'agents') },
    { tool: 'aider', type: 'rule', dir: path.join(cwd, '.aider.conf.yml'), isDirectFile: true },
    { tool: 'global', type: 'skill', dir: path.join(cwd, '.agents', 'skills') },

    // Antigravity project-level skills
    { tool: 'antigravity', type: 'skill', dir: path.join(cwd, 'skills') },
    { tool: 'antigravity', type: 'skill', dir: path.join(cwd, 'packages', 'skills') },
    { tool: 'antigravity', type: 'skill', dir: path.join(cwd, 'packages', 'skill') }
  ];
}

let _cachedItemsBySlug = null;
let _cachedScanTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s memory TTL for disk scan

function invalidateScanCache() {
  _cachedItemsBySlug = null;
  _cachedScanTimestamp = 0;
}

/**
 * Scan all tools and build normalized registry
 */
function scanAllTools(options = {}) {
  const cwd = options.cwd || process.cwd();
  const customDirs = options.customDirs || [];
  const locations = getStandardScanLocations(cwd);
  const now = Date.now();

  let itemsBySlug;

  if (!options.force && _cachedItemsBySlug && (now - _cachedScanTimestamp < CACHE_TTL_MS)) {
    // Fast path: Reuse parsed files from memory cache
    itemsBySlug = _cachedItemsBySlug;
  } else {
    itemsBySlug = new Map();
    const scannedRoots = new Set();

    for (const loc of locations) {
      if (loc.isDirectFile) {
        if (fs.existsSync(loc.dir)) {
          parseSingleItemFile(loc.dir, loc.tool, loc.type, itemsBySlug);
        }
        continue;
      }

      if (!fs.existsSync(loc.dir)) continue;

      const canonicalRoot = safeRealPath(loc.dir);
      if (!canonicalRoot || scannedRoots.has(`${loc.tool}:${canonicalRoot}`)) continue;
      scannedRoots.add(`${loc.tool}:${canonicalRoot}`);

      // Check if dir itself is a single skill (contains SKILL.md)
      const directSkillMd = path.join(loc.dir, 'SKILL.md');
      if (fs.existsSync(directSkillMd)) {
        parseSkillDir(loc.dir, loc.tool, itemsBySlug);
        continue;
      }

      // KI type: scan for metadata.json-based Knowledge Items
      if (loc.type === 'ki') {
        try {
          const entries = fs.readdirSync(loc.dir, { withFileTypes: true });
          for (const ent of entries) {
            if (!ent.isDirectory()) continue;
            const kiPath = path.join(loc.dir, ent.name);
            parseKnowledgeItem(kiPath, loc.tool, itemsBySlug);
          }
        } catch { }
        continue;
      }

      // Otherwise, iterate children
      try {
        const entries = fs.readdirSync(loc.dir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.name.startsWith('.') && ent.name !== '.cursor') continue;
          if (['node_modules', 'dist', 'build', '.git'].includes(ent.name)) continue;

          const fullPath = path.join(loc.dir, ent.name);
          if (ent.isDirectory()) {
            const subSkillMd = path.join(fullPath, 'SKILL.md');
            if (fs.existsSync(subSkillMd)) {
              parseSkillDir(fullPath, loc.tool, itemsBySlug);
            } else {
              // Check for agent or rule files inside
              checkDirForAgentsOrRules(fullPath, loc.tool, loc.type, itemsBySlug);
            }
          } else if (ent.isFile()) {
            if (ent.name.endsWith('.md') || ent.name.endsWith('.mdc') || ent.name.endsWith('.json')) {
              parseSingleItemFile(fullPath, loc.tool, loc.type, itemsBySlug);
            }
          }
        }
      } catch { }
    }

    _cachedItemsBySlug = itemsBySlug;
    _cachedScanTimestamp = now;
  }

  // Fetch Favorites and Collections from SQLite SSOT
  let favorites = new Set();
  let collectionsMap = new Map(); // path -> [collection_id]

  try {
    const db = getDb();
    const favs = db.prepare('SELECT item_path FROM skill_favorites').all();
    favorites = new Set(favs.map(f => f.item_path.toLowerCase()));

    const colItems = db.prepare('SELECT item_path, collection_id FROM skill_collection_items').all();
    for (const ci of colItems) {
      const p = ci.item_path.toLowerCase();
      if (!collectionsMap.has(p)) collectionsMap.set(p, []);
      collectionsMap.get(p).push(ci.collection_id);
    }
  } catch { }

  // Consolidate into structured list
  const results = Array.from(itemsBySlug.values()).map(item => {
    const lowerPrimaryPath = item.primaryPath.toLowerCase();
    item.isFavorite = favorites.has(lowerPrimaryPath);
    item.collections = collectionsMap.get(lowerPrimaryPath) || [];
    return item;
  });

  // Sort alphabetically by name
  results.sort((a, b) => a.name.localeCompare(b.name));

  return {
    total: results.length,
    skillsCount: results.filter(i => i.itemType === 'skill').length,
    agentsCount: results.filter(i => i.itemType === 'agent').length,
    rulesCount: results.filter(i => i.itemType === 'rule').length,
    kiCount: results.filter(i => i.itemType === 'ki').length,
    favoritesCount: results.filter(i => i.isFavorite).length,
    tools: buildToolCounters(results),
    items: results
  };
}

function safeRealPath(p) {
  try {
    return fs.realpathSync(p).toLowerCase();
  } catch {
    return null;
  }
}

function buildToolCounters(items) {
  const counts = {};
  for (const [key, def] of Object.entries(TOOL_DEFINITIONS)) {
    counts[key] = {
      ...def,
      count: 0
    };
  }

  for (const item of items) {
    for (const t of item.tools) {
      if (counts[t]) {
        counts[t].count++;
      }
    }
  }
  return counts;
}
/**
 * Parse a Knowledge Item (KI) directory from TidyFactor Brain.
 * Structure: {ki-dir}/metadata.json + artifacts/
 * KIs use metadata.json (not SKILL.md) as their descriptor.
 */
function parseKnowledgeItem(kiDirPath, tool, itemsBySlug) {
  const metaPath = path.join(kiDirPath, 'metadata.json');
  if (!fs.existsSync(metaPath)) return;

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const stats = fs.statSync(metaPath);
    const folderName = path.basename(kiDirPath);

    const name = meta.title || meta.name || folderName;
    const slug = `ki-${normalizeSlug(name)}`;
    const description = meta.summary || meta.description || '';
    const tier = path.basename(path.dirname(kiDirPath)); // global | tech | projects | session

    // Find primary artifact file if present
    const artifactsDir = path.join(kiDirPath, 'artifacts');
    let primaryPath = metaPath;
    if (fs.existsSync(artifactsDir)) {
      const artifacts = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.md'));
      if (artifacts.length > 0) primaryPath = path.join(artifactsDir, artifacts[0]);
    }

    const sizeBytes = stats.size;
    const item = {
      slug,
      name,
      title: name,
      description,
      itemType: 'ki',
      primaryPath: metaPath,
      tools: [tool],
      authorTag: `KI • ${tier}`,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      mtime: stats.mtimeMs,
      tier,
      references: meta.references || [],
      isFavorite: false,
      collections: []
    };

    if (!itemsBySlug.has(slug)) {
      itemsBySlug.set(slug, item);
    } else {
      // Merge tools if same KI discovered via multiple paths
      const existing = itemsBySlug.get(slug);
      for (const t of item.tools) {
        if (!existing.tools.includes(t)) existing.tools.push(t);
      }
    }
  } catch { }
}

function parseSkillDir(skillDirPath, tool, itemsBySlug) {
  const skillMdPath = path.join(skillDirPath, 'SKILL.md');
  try {
    const raw = fs.readFileSync(skillMdPath, 'utf8');
    const parsed = parseFrontmatter(raw);
    const sizeBytes = Buffer.byteLength(raw);

    const folderName = path.basename(skillDirPath);
    const name = parsed.frontmatter.name || folderName;
    const slug = normalizeSlug(name);
    const description = parsed.frontmatter.description || extractLeadingParagraph(parsed.body) || 'TidyFactor Ecosystem Skill';

    // Extract primary markdown title
    const titleMatch = parsed.body.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : name;

    if (itemsBySlug.has(slug)) {
      const existing = itemsBySlug.get(slug);
      if (!existing.tools.includes(tool)) existing.tools.push(tool);
      if (!existing.locations.some(l => l.path === skillMdPath)) {
        existing.locations.push({ tool, path: skillMdPath, dir: skillDirPath });
      }
    } else {
      itemsBySlug.set(slug, {
        id: `skill_${slug}`,
        slug,
        name,
        title,
        itemType: 'skill',
        description,
        primaryPath: skillMdPath,
        primaryDir: skillDirPath,
        tools: [tool],
        locations: [{ tool, path: skillMdPath, dir: skillDirPath }],
        frontmatter: parsed.frontmatter,
        rawFrontmatter: parsed.rawFrontmatter,
        commands: [],
        manifest: null,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        mtime: '',
        authorTag: inferAuthorTag(skillDirPath, parsed.frontmatter)
      });
    }
  } catch { }
}

function parseSingleItemFile(filePath, tool, itemType, itemsBySlug) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseFrontmatter(raw);
    const sizeBytes = Buffer.byteLength(raw);

    const baseName = path.basename(filePath, path.extname(filePath));
    const name = parsed.frontmatter.name || baseName;
    const slug = normalizeSlug(name);
    const description = parsed.frontmatter.description || extractLeadingParagraph(parsed.body) || '';

    const titleMatch = parsed.body.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : name;

    if (itemsBySlug.has(slug)) {
      const existing = itemsBySlug.get(slug);
      if (!existing.tools.includes(tool)) existing.tools.push(tool);
      if (!existing.locations.some(l => l.path === filePath)) {
        existing.locations.push({ tool, path: filePath, dir: path.dirname(filePath) });
      }
    } else {
      itemsBySlug.set(slug, {
        id: `${itemType}_${slug}`,
        slug,
        name,
        title,
        itemType,
        description,
        primaryPath: filePath,
        primaryDir: path.dirname(filePath),
        tools: [tool],
        locations: [{ tool, path: filePath, dir: path.dirname(filePath) }],
        frontmatter: parsed.frontmatter,
        rawFrontmatter: parsed.rawFrontmatter,
        commands: [],
        manifest: null,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        mtime: '',
        authorTag: inferAuthorTag(filePath, parsed.frontmatter)
      });
    }
  } catch { }
}

function checkDirForAgentsOrRules(dirPath, tool, itemType, itemsBySlug) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      if (ent.name.endsWith('.md') || ent.name.endsWith('.mdc') || ent.name.endsWith('.json')) {
        parseSingleItemFile(path.join(dirPath, ent.name), tool, itemType, itemsBySlug);
      }
    }
  } catch { }
}

function normalizeSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

function extractLeadingParagraph(body) {
  if (!body) return '';
  const lines = body.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  return lines.length > 0 ? lines[0].slice(0, 200) : '';
}

function inferAuthorTag(targetPath, frontmatter = {}) {
  if (frontmatter.author) return frontmatter.author;
  if (targetPath.includes('tidyfactor') || targetPath.includes('TidyFactor')) return 'tidyfactor';
  if (targetPath.includes('.claude')) return 'claude';
  if (targetPath.includes('.cursor')) return 'cursor';
  if (targetPath.includes('.codex')) return 'codex';
  if (targetPath.includes('.gemini')) return 'skills-lab';
  return 'community';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Read raw content and parsed details of a file
 */
function readStudioItem(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const parsed = parseFrontmatter(raw);

  return {
    path: filePath,
    rawContent: raw,
    frontmatter: parsed.frontmatter,
    rawFrontmatter: parsed.rawFrontmatter,
    body: parsed.body,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    mtime: stats.mtime.toISOString(),
    linesCount: raw.split(/\r?\n/).length,
    charCount: raw.length
  };
}

/**
 * Atomic write of content back to disk (Cmd+S save)
 */
function saveStudioItem(filePath, content) {
  if (!filePath) throw new Error('Target filePath is required');

  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Backup existing before write
  if (fs.existsSync(resolved)) {
    const backupDir = path.join(os.homedir(), '.tidy', 'backups');
    try {
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(resolved, path.join(backupDir, `${path.basename(resolved)}.${Date.now()}.bak`));
    } catch { }
  }

  fs.writeFileSync(resolved, content, 'utf8');
  invalidateScanCache();
  const stats = fs.statSync(resolved);

  return {
    ok: true,
    path: resolved,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    mtime: stats.mtime.toISOString()
  };
}

module.exports = {
  TOOL_DEFINITIONS,
  parseFrontmatter,
  scanAllTools,
  invalidateScanCache,
  readStudioItem,
  saveStudioItem,
  formatBytes
};
