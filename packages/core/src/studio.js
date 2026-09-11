/**
 * Tidy Ecosystem — Studio Management Hub (Collections, Favorites & Remote Discovery)
 * Manages SQLite SSOT collections, favorites, and community catalog discovery.
 *
 * @module @tidy/core/studio
 * @version 1.4.4
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { invalidateScanCache } = require('./multi-tool-scanner');

// Pre-seeded verified community skills catalog for discovery
const COMMUNITY_CATALOG = [
  {
    name: 'tidyfactor-doc',
    title: 'Code Documentation Builder & llms.txt Generator',
    description: 'Triple-engine publishing platform (VitePress, MkDocs, Docsify) with ADR generation.',
    domain: 'docs',
    author: 'TidyFactor Team',
    stars: 284,
    tools: ['antigravity', 'claude', 'cursor']
  },
  {
    name: 'tidyfactor-design',
    title: 'Code-Native UI Design Lifecycle Engine',
    description: 'Figma alternative for web applications with Contextual Decision Layer and 7-axis review.',
    domain: 'design',
    author: 'TidyFactor Team',
    stars: 341,
    tools: ['antigravity', 'claude', 'cursor']
  },
  {
    name: 'tidyfactor-marketing',
    title: 'Production-Grade AI Marketing & Growth Engine',
    description: 'MENA intelligence, 7 marketing pillars, copy generation, and SEO pillar clusters.',
    domain: 'marketing',
    author: 'TidyFactor Team',
    stars: 219,
    tools: ['antigravity', 'claude']
  },
  {
    name: 'tidyfactor-seo',
    title: 'Technical SEO & Generative Engine Optimization (GEO)',
    description: 'Schema JSON-LD, agentic browsing readiness, and multi-lingual XML sitemaps.',
    domain: 'marketing',
    author: 'TidyFactor Team',
    stars: 198,
    tools: ['antigravity', 'cursor']
  },
  {
    name: 'tidyfactor-github',
    title: 'GitHub Platform Operations & Open Source Governance',
    description: 'Rulesets, actions automation, contributor experience, and repository security.',
    domain: 'ops',
    author: 'TidyFactor Team',
    stars: 175,
    tools: ['antigravity', 'claude', 'cursor']
  },
  {
    name: 'tidyfactor-skill-architect',
    title: 'Master Governance Layer for AI Coding Agent Skills',
    description: 'Enforces the 15 Structural Rules, SemVer SSOT, and automated compliance auditing.',
    domain: 'ops',
    author: 'TidyFactor Team',
    stars: 312,
    tools: ['antigravity', 'claude', 'cursor']
  },
  {
    name: 'openclaw-agent',
    title: 'OpenClaw Autonomous Web Intelligence & Crawling',
    description: 'Distributed web scraping and knowledge pack extraction for AI agents.',
    domain: 'tech',
    author: 'OpenClaw',
    stars: 420,
    tools: ['global', 'claude']
  },
  {
    name: 'hermes-researcher',
    title: 'NousResearch Hermes Agentic Reasoner',
    description: 'Deep chain-of-thought research and hypothesis testing pipeline.',
    domain: 'tech',
    author: 'NousResearch',
    stars: 580,
    tools: ['global', 'cursor']
  }
];

// ----------------- Collections Management -----------------
function listCollections() {
  const db = getDb();
  const cols = db.prepare('SELECT * FROM skill_collections ORDER BY name ASC').all();
  const counts = db.prepare(`
    SELECT collection_id, COUNT(*) as count
    FROM skill_collection_items
    GROUP BY collection_id
  `).all();

  const countMap = new Map(counts.map(c => [c.collection_id, c.count]));

  return cols.map(c => ({
    ...c,
    itemsCount: countMap.get(c.id) || 0
  }));
}

function createCollection({ name, color = '#4a9eff', icon = 'folder' }) {
  if (!name || typeof name !== 'string') {
    throw new Error('Collection name is required');
  }

  const db = getDb();
  const id = `col_${name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

  const stmt = db.prepare(`
    INSERT INTO skill_collections (id, name, color, icon)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET color = excluded.color, icon = excluded.icon
  `);
  stmt.run(id, name.trim(), color, icon);

  return db.prepare('SELECT * FROM skill_collections WHERE id = ?').get(id);
}

function deleteCollection(id) {
  const db = getDb();
  const res = db.prepare('DELETE FROM skill_collections WHERE id = ?').run(id);
  return res.changes > 0;
}

function assignItemToCollection(collectionId, itemPath, itemType = 'skill', tool = 'global') {
  const db = getDb();
  const id = `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO skill_collection_items (id, collection_id, item_path, item_type, tool)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, collectionId, itemPath, itemType, tool);
  invalidateScanCache();
  return true;
}

function removeItemFromCollection(collectionId, itemPath) {
  const db = getDb();
  const res = db.prepare('DELETE FROM skill_collection_items WHERE collection_id = ? AND item_path = ?').run(collectionId, itemPath);
  invalidateScanCache();
  return res.changes > 0;
}

// ----------------- Favorites Management -----------------
function toggleFavorite(itemPath, itemType = 'skill', tool = 'global') {
  const db = getDb();
  const existing = db.prepare('SELECT item_path FROM skill_favorites WHERE item_path = ?').get(itemPath);

  invalidateScanCache();
  if (existing) {
    db.prepare('DELETE FROM skill_favorites WHERE item_path = ?').run(itemPath);
    return { isFavorite: false };
  } else {
    db.prepare('INSERT INTO skill_favorites (item_path, item_type, tool) VALUES (?, ?, ?)').run(itemPath, itemType, tool);
    return { isFavorite: true };
  }
}

function listFavorites() {
  const db = getDb();
  return db.prepare('SELECT * FROM skill_favorites ORDER BY created_at DESC').all();
}

// ----------------- Remote Discovery Hub -----------------
function listDiscoveryCatalog() {
  return COMMUNITY_CATALOG;
}

// ----------------- Delete Item File -----------------
function deleteStudioItem(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    fs.rmSync(filePath, { recursive: true, force: true });
  } else {
    // If inside a skill dir, remove entire skill dir if it's SKILL.md
    if (path.basename(filePath) === 'SKILL.md') {
      const dir = path.dirname(filePath);
      fs.rmSync(dir, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }

  // Cleanup references in SQLite SSOT
  try {
    const db = getDb();
    db.prepare('DELETE FROM skill_favorites WHERE item_path = ?').run(filePath);
    db.prepare('DELETE FROM skill_collection_items WHERE item_path = ?').run(filePath);
  } catch {}

  invalidateScanCache();
  return true;
}

module.exports = {
  listCollections,
  createCollection,
  deleteCollection,
  assignItemToCollection,
  removeItemFromCollection,
  toggleFavorite,
  listFavorites,
  listDiscoveryCatalog,
  deleteStudioItem
};
