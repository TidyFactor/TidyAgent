/**
 * Tidy Ecosystem — Memory & Recall Engine
 * Full-Text Search (FTS5 BM25), Tiered Storage, Mathematical Decay Scoring & Cognitive Recall.
 *
 * @module @tidy/core/memory
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */


const crypto = require('crypto');
const { getDb } = require('./db');
const { normalizeTaxonomy } = require('./memory-taxonomy');

// Half-life Lambda values by tier for Ebbinghaus Decay curve (in 1/hours)
const TIER_LAMBDAS = {
  core: 0.0,         // Permanent truth, zero decay
  project: 0.0005,   // ~58 days half-life (1386 hours)
  session: 0.01,     // ~3 days half-life (69.3 hours)
  ephemeral: 0.05    // ~14 hours half-life (13.8 hours)
};

// Category boost multipliers for cognitive significance (8-Taxonomy aligned)
const CATEGORY_BOOSTS = {
  lesson: 1.30,
  lessons: 1.30,
  rule: 1.25,
  decision: 1.20,
  decisions: 1.20,
  preference: 1.15,
  preferences: 1.15,
  asset: 1.10,
  assets: 1.10,
  pattern: 1.10,
  reference: 1.05,
  references: 1.05,
  relationship: 1.05,
  relationships: 1.05,
  fact: 1.00,
  facts: 1.00,
  output: 1.00,
  outputs: 1.00,
  previous_outputs: 1.00,
  task: 0.90
};

// Domain firewall permissions: maps active domain to allowed recall domains
const DOMAIN_FIREWALL_MAP = {
  general: ['general'],
  dev: ['dev', 'general'],
  marketing: ['marketing', 'general'],
  personal: ['personal', 'general'],
  ops: ['ops', 'general']
};

function generateId(prefix = 'mem') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Calculate dynamic decay score and effective cognitive score for a memory node
 */
function calculateCognitiveScore(node, referenceDate = new Date()) {
  const tier = node.tier || 'project';
  const category = node.category || 'fact';
  const importance = Number(node.importance) || 3;
  const accessCount = Number(node.access_count) || 0;

  const lambda = TIER_LAMBDAS[tier] !== undefined ? TIER_LAMBDAS[tier] : 0.0005;

  let lastAccessedTime = referenceDate.getTime();
  if (node.last_accessed_at) {
    const raw = String(node.last_accessed_at);
    const parsed = new Date(raw.endsWith('Z') ? raw : `${raw.replace(' ', 'T')}Z`).getTime();
    if (!isNaN(parsed)) {
      lastAccessedTime = parsed;
    }
  }

  const elapsedHours = Math.max(0, (referenceDate.getTime() - lastAccessedTime) / (1000 * 60 * 60));

  // Exponential decay formula: e^(-lambda * delta_t)
  const decayScore = Math.max(0.01, Math.min(1.0, Math.exp(-lambda * elapsedHours)));

  // Access reinforcement (logarithmic growth based on repeated access)
  const reinforcement = 1.0 + (0.35 * Math.log(1 + accessCount));

  // Category weight
  const catBoost = CATEGORY_BOOSTS[category] || 1.0;

  // Effective score synthesis
  const effectiveScore = Number((importance * decayScore * reinforcement * catBoost).toFixed(4));

  return {
    decayScore: Number(decayScore.toFixed(4)),
    effectiveScore
  };
}

function saveMemory(optionsOrContent, maybeOptions = {}) {
  let opts = {};
  if (typeof optionsOrContent === 'string') {
    opts = { ...maybeOptions, content: optionsOrContent };
  } else if (optionsOrContent && typeof optionsOrContent === 'object') {
    opts = { ...optionsOrContent };
  }

  const {
    content,
    summary = null,
    tier = 'project',
    category = 'fact',
    importance = 3,
    contextId = null
  } = opts;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Memory content cannot be empty.');
  }

  const db = getDb();
  let ctxId = contextId;

  if (!ctxId) {
    const activeCtx = db.prepare('SELECT id FROM contexts WHERE is_active = 1 LIMIT 1').get();
    ctxId = activeCtx ? activeCtx.id : 'ctx_general';
  }

  const id = generateId('mem');
  const validTiers = ['core', 'project', 'session', 'ephemeral'];
  const validCategories = [
    'fact', 'decision', 'pattern', 'preference', 'task', 'rule',
    'facts', 'decisions', 'preferences', 'assets', 'references',
    'previous_outputs', 'lessons', 'relationships',
    'asset', 'reference', 'lesson', 'relationship', 'output', 'outputs'
  ];

  let normalizedCategory = 'fact';
  if (category && validCategories.includes(category)) {
    normalizedCategory = category;
  } else if (category) {
    normalizedCategory = normalizeTaxonomy(category);
  }
  const normalizedTier = validTiers.includes(tier) ? tier : 'project';
  const cleanSummary = summary ? summary.trim() : content.trim().substring(0, 120);
  const cleanImportance = Math.max(1, Math.min(5, Number(importance) || 3));

  const stmt = db.prepare(`
    INSERT INTO memory_nodes (id, context_id, tier, category, content, summary, importance, access_count, decay_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1.0)
  `);

  stmt.run(id, ctxId, normalizedTier, normalizedCategory, content.trim(), cleanSummary, cleanImportance);

  // Log action
  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('SAVE_MEMORY', 'memory_engine', JSON.stringify({ id, tier: normalizedTier, category: normalizedCategory, importance: cleanImportance }));

  return {
    id,
    context_id: ctxId,
    tier: normalizedTier,
    category: normalizedCategory,
    content: content.trim(),
    summary: cleanSummary,
    importance: cleanImportance,
    decay_score: 1.0,
    effective_score: cleanImportance * (CATEGORY_BOOSTS[normalizedCategory] || 1.0)
  };
}

function recallMemory(queryOrOpts, maybeOpts = {}) {
  let opts = {};
  if (typeof queryOrOpts === 'string') {
    opts = { query: queryOrOpts, ...maybeOpts };
  } else if (queryOrOpts && typeof queryOrOpts === 'object') {
    opts = queryOrOpts;
  }

  const {
    query = null,
    category = null,
    tier = null,
    limit = 5,
    contextId = null,
    domain = null,
    bypassFirewall = false
  } = opts;

  const db = getDb();
  let results = [];

  // Determine Firewall Boundaries
  let allowedDomains = null;
  if (!bypassFirewall && !contextId) {
    if (domain) {
      allowedDomains = DOMAIN_FIREWALL_MAP[domain] || [domain, 'general'];
    } else {
      const activeCtx = db.prepare('SELECT domain FROM contexts WHERE is_active = 1 LIMIT 1').get();
      const activeDomain = activeCtx ? activeCtx.domain : 'general';
      allowedDomains = DOMAIN_FIREWALL_MAP[activeDomain] || ['general'];
    }
  }

  if (query && typeof query === 'string' && query.trim().length > 0) {
    // Sanitize FTS5 query terms
    const sanitized = query
      .replace(/["*+\-^:()]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(term => `"${term}"*`)
      .join(' OR ');

    if (sanitized) {
      try {
        let ftsSql = `
          SELECT m.*, c.domain as context_domain, c.name as context_name, rank
          FROM memory_fts f
          JOIN memory_nodes m ON f.node_id = m.id
          LEFT JOIN contexts c ON m.context_id = c.id
          WHERE memory_fts MATCH ?
        `;
        const params = [sanitized];

        if (category) {
          ftsSql += ' AND m.category = ?';
          params.push(category);
        }
        if (tier) {
          ftsSql += ' AND m.tier = ?';
          params.push(tier);
        }
        if (contextId) {
          ftsSql += ' AND m.context_id = ?';
          params.push(contextId);
        } else if (allowedDomains && allowedDomains.length > 0) {
          const placeholders = allowedDomains.map(() => '?').join(',');
          ftsSql += ` AND (c.domain IN (${placeholders}) OR m.context_id IS NULL)`;
          params.push(...allowedDomains);
        }

        // Pull candidates for cognitive re-ranking
        ftsSql += ` ORDER BY rank LIMIT ?`;
        params.push(Math.max(limit * 3, 20));

        results = db.prepare(ftsSql).all(...params);
      } catch (err) {
        results = [];
      }
    }

    // Fallback to LIKE search if FTS5 had 0 matches
    if (results.length === 0) {
      let likeSql = `
        SELECT m.*, c.domain as context_domain, c.name as context_name, 0 as rank
        FROM memory_nodes m
        LEFT JOIN contexts c ON m.context_id = c.id
        WHERE (m.content LIKE ? OR m.summary LIKE ?)
      `;
      const likeParams = [`%${query.trim()}%`, `%${query.trim()}%`];

      if (category) {
        likeSql += ' AND m.category = ?';
        likeParams.push(category);
      }
      if (tier) {
        likeSql += ' AND m.tier = ?';
        likeParams.push(tier);
      }
      if (contextId) {
        likeSql += ' AND m.context_id = ?';
        likeParams.push(contextId);
      } else if (allowedDomains && allowedDomains.length > 0) {
        const placeholders = allowedDomains.map(() => '?').join(',');
        likeSql += ` AND (c.domain IN (${placeholders}) OR m.context_id IS NULL)`;
        likeParams.push(...allowedDomains);
      }

      likeSql += ' ORDER BY m.importance DESC LIMIT ?';
      likeParams.push(Math.max(limit * 3, 20));

      results = db.prepare(likeSql).all(...likeParams);
    }
  } else {
    // If no query string provided, retrieve recent memories
    let sql = `
      SELECT m.*, c.domain as context_domain, c.name as context_name, 0 as rank
      FROM memory_nodes m
      LEFT JOIN contexts c ON m.context_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ' AND m.category = ?';
      params.push(category);
    }
    if (tier) {
      sql += ' AND m.tier = ?';
      params.push(tier);
    }
    if (contextId) {
      sql += ' AND m.context_id = ?';
      params.push(contextId);
    } else if (allowedDomains && allowedDomains.length > 0) {
      const placeholders = allowedDomains.map(() => '?').join(',');
      sql += ` AND (c.domain IN (${placeholders}) OR m.context_id IS NULL)`;
      params.push(...allowedDomains);
    }

    sql += ' ORDER BY m.importance DESC, m.last_accessed_at DESC LIMIT ?';
    params.push(Math.max(limit * 3, 20));

    results = db.prepare(sql).all(...params);
  }

  // Cognitive Re-Ranking with Mathematical Decay & Reinforcement
  const scoredResults = results.map(row => {
    const scores = calculateCognitiveScore(row);
    // In FTS5, rank is negative BM25 (e.g. -2.5). More negative is more relevant.
    const bm25Score = row.rank ? Math.abs(Number(row.rank)) : 1.0;
    const finalScore = Number(((bm25Score * 0.4) + (scores.effectiveScore * 0.6)).toFixed(4));

    return {
      ...row,
      decay_score: scores.decayScore,
      effective_score: scores.effectiveScore,
      final_score: finalScore
    };
  });

  // Sort by final combined cognitive score descending
  scoredResults.sort((a, b) => b.final_score - a.final_score);
  const finalTop = scoredResults.slice(0, limit);

  // Touch access count and update decay score for returned results
  if (finalTop.length > 0) {
    const updateStmt = db.prepare(`
      UPDATE memory_nodes
      SET access_count = access_count + 1,
          decay_score = ?,
          last_accessed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    for (const row of finalTop) {
      updateStmt.run(row.decay_score, row.id);
    }
  }

  return finalTop;
}

function forgetMemory(nodeId) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM memory_nodes WHERE id = ?').get(nodeId);
  if (!existing) {
    return false;
  }

  db.prepare('DELETE FROM memory_nodes WHERE id = ?').run(nodeId);

  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('FORGET_MEMORY', 'memory_engine', JSON.stringify({ id: nodeId }));
  return true;
}

function updateMemory(id, { content, summary = null, tier = null, category = null, importance = null, contextId = null } = {}) {
  if (!id) throw new Error('Memory ID is required for update.');
  const db = getDb();
  const existing = db.prepare('SELECT * FROM memory_nodes WHERE id = ?').get(id);
  if (!existing) {
    throw new Error(`Memory node not found: ${id}`);
  }

  const validTiers = ['core', 'project', 'session', 'ephemeral'];

  const updatedContent = (content !== undefined && content !== null) ? content.trim() : existing.content;
  if (!updatedContent) {
    throw new Error('Memory content cannot be empty.');
  }
  const validCategories = [
    'fact', 'decision', 'pattern', 'preference', 'task', 'rule',
    'facts', 'decisions', 'preferences', 'assets', 'references',
    'previous_outputs', 'lessons', 'relationships',
    'asset', 'reference', 'lesson', 'relationship', 'output', 'outputs'
  ];
  let updatedCategory = existing.category;
  if (category !== null && category !== undefined) {
    updatedCategory = validCategories.includes(category) ? category : normalizeTaxonomy(category);
  }
  const updatedTier = (tier && validTiers.includes(tier)) ? tier : existing.tier;
  const updatedSummary = (summary !== null && summary !== undefined) ? summary.trim() : (content ? updatedContent.substring(0, 120) : existing.summary);
  const updatedImportance = (importance !== null && importance !== undefined) ? Math.max(1, Math.min(5, Number(importance) || 3)) : existing.importance;
  const updatedContextId = (contextId !== undefined && contextId !== null) ? contextId : existing.context_id;

  const stmt = db.prepare(`
    UPDATE memory_nodes
    SET content = ?,
        summary = ?,
        category = ?,
        tier = ?,
        importance = ?,
        context_id = ?,
        last_accessed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(updatedContent, updatedSummary, updatedCategory, updatedTier, updatedImportance, updatedContextId, id);

  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('UPDATE_MEMORY', 'memory_engine', JSON.stringify({ id, tier: updatedTier, category: updatedCategory, importance: updatedImportance }));

  return {
    id,
    context_id: updatedContextId,
    tier: updatedTier,
    category: updatedCategory,
    content: updatedContent,
    summary: updatedSummary,
    importance: updatedImportance
  };
}

function listMemories({ limit = 20, tier = null, category = null, contextId = null } = {}) {
  const db = getDb();
  let sql = `
    SELECT m.*, c.domain as context_domain, c.name as context_name
    FROM memory_nodes m
    LEFT JOIN contexts c ON m.context_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (tier) {
    sql += ' AND m.tier = ?';
    params.push(tier);
  }
  if (category) {
    sql += ' AND m.category = ?';
    params.push(category);
  }
  if (contextId) {
    sql += ' AND m.context_id = ?';
    params.push(contextId);
  }

  sql += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => {
    const scores = calculateCognitiveScore(r);
    return {
      ...r,
      decay_score: scores.decayScore,
      effective_score: scores.effectiveScore
    };
  });
}

function pruneMemories({ daysOld = 30, onlyEphemeral = true } = {}) {
  const db = getDb();
  let sql = `
    DELETE FROM memory_nodes
    WHERE created_at <= datetime('now', '-' || ? || ' days')
  `;
  if (onlyEphemeral) {
    sql += " AND tier = 'ephemeral'";
  } else {
    sql += " AND tier IN ('ephemeral', 'session')";
  }

  const result = db.prepare(sql).run(daysOld);
  return result;
}

/**
 * Smart Cognitive Pruning
 * Evaluates mathematical decay score and deletes stale ephemeral/session memories
 */
function pruneDecayedMemories({ threshold = 0.25, olderThanHours = 24, dryRun = false } = {}) {
  const db = getDb();
  const candidates = db.prepare(`
    SELECT * FROM memory_nodes
    WHERE tier IN ('ephemeral', 'session')
  `).all();

  const now = new Date();
  const toPrune = [];

  for (const node of candidates) {
    const scores = calculateCognitiveScore(node, now);
    let createdTime = now.getTime();
    if (node.created_at) {
      const raw = String(node.created_at);
      const parsed = new Date(raw.endsWith('Z') ? raw : `${raw.replace(' ', 'T')}Z`).getTime();
      if (!isNaN(parsed)) createdTime = parsed;
    }
    const ageHours = (now.getTime() - createdTime) / (1000 * 3600);

    if (ageHours >= olderThanHours && scores.decayScore <= threshold) {
      toPrune.push({
        id: node.id,
        content: node.content,
        tier: node.tier,
        decay_score: scores.decayScore,
        age_hours: Number(ageHours.toFixed(1))
      });
    }
  }

  if (!dryRun && toPrune.length > 0) {
    const deleteStmt = db.prepare('DELETE FROM memory_nodes WHERE id = ?');
    const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
    for (const item of toPrune) {
      deleteStmt.run(item.id);
      logStmt.run('PRUNE_DECAYED_MEMORY', 'memory_engine', JSON.stringify(item));
    }
  }

  return {
    prunedCount: toPrune.length,
    prunedItems: toPrune,
    dryRun
  };
}

module.exports = {
  saveMemory,
  updateMemory,
  recallMemory,
  forgetMemory,
  listMemories,
  pruneMemories,
  calculateCognitiveScore,
  pruneDecayedMemories,
  TIER_LAMBDAS,
  CATEGORY_BOOSTS
};
