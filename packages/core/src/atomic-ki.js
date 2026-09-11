/**
 * Tidy Ecosystem — Atomic Knowledge Item (KI) Extractor
 * Validates, creates, and dual-indexes atomic KIs into 4-tier disk storage and SQLite SSOT.
 *
 * @module @tidy/core/atomic-ki
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { saveMemory } = require('./memory');

function getHomeDir() {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
}

function getKnowledgeRootDir() {
  return path.join(getHomeDir(), '.gemini', 'knowledge');
}

/**
 * Extracts, validates, and persists a compliant atomic Knowledge Item.
 *
 * @param {object} params
 * @param {string} params.id Unique identifier (e.g. KI-Postgres-WAL-Tuning)
 * @param {string} params.title Human readable title
 * @param {string} [params.rule] Deterministic rule directives
 * @param {string} [params.trigger_context] When this rule activates
 * @param {string} [params.triggerContext] Alias for trigger_context
 * @param {string} params.negative_constraint Explicit negative boundary / suppression condition
 * @param {string} [params.negativeConstraint] Alias for negative_constraint
 * @param {string} [params.scope='tech'] Scope tier ('global', 'tech', 'project', 'session')
 * @param {string} [params.project_id] Target project id if scope is project
 * @param {string} [params.projectId] Alias for project_id
 * @param {string} [params.domain='Development'] Domain categorization
 * @param {number} [params.importance=4] Importance rating (1-5)
 * @returns {object} Extraction result and file path
 */
function extractAndPersistKi(params = {}) {
  const id = (params.id || '').trim();
  const title = (params.title || '').trim();
  const rule = (params.rule || '').trim();
  const triggerContext = (params.trigger_context || params.triggerContext || '').trim();
  const negativeConstraint = (params.negative_constraint || params.negativeConstraint || '').trim();
  const scope = (params.scope || 'tech').toLowerCase();
  const projectId = (params.project_id || params.projectId || 'general').trim();
  const domain = (params.domain || 'Development').trim();
  const importance = Math.max(1, Math.min(params.importance || 4, 5));

  if (!id) {
    throw new Error('Atomic KI extraction rejected: Missing unique identifier "id".');
  }
  if (!title) {
    throw new Error('Atomic KI extraction rejected: Missing human readable "title".');
  }

  // Non-negotiable Cognitive Invariant: Mandatory Negative Constraint
  if (!negativeConstraint) {
    throw new Error(
      'Atomic KI extraction rejected: Mandatory negative constraint is missing. ' +
      'Every Knowledge Item must define an explicit negative boundary/suppression condition to prevent agent hallucinations and context bleed.'
    );
  }

  // 1. Resolve Target Directory on Disk (~/.gemini/knowledge/<scope>/...)
  const knowledgeRoot = getKnowledgeRootDir();
  let targetDir = path.join(knowledgeRoot, 'tech');

  if (scope === 'global') {
    targetDir = path.join(knowledgeRoot, 'global');
  } else if (scope === 'project' || scope === 'projects') {
    targetDir = path.join(knowledgeRoot, 'projects', projectId);
  } else if (scope === 'session') {
    targetDir = path.join(knowledgeRoot, 'session');
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const safeFileName = `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
  const filePath = path.join(targetDir, safeFileName);
  const now = new Date().toISOString();

  // 2. Generate Standardized Markdown Document with YAML Frontmatter
  const markdownContent = [
    '---',
    `id: "${id}"`,
    `title: "${title}"`,
    `scope: "${scope}"`,
    `domain: "${domain}"`,
    projectId ? `project_id: "${projectId}"` : null,
    triggerContext ? `trigger_context: "${triggerContext}"` : null,
    `negative_constraint: "${negativeConstraint.replace(/"/g, '\\"')}"`,
    `created_at: "${now}"`,
    '---',
    '',
    `# ${title}`,
    '',
    '## 📋 Directive / Rule',
    rule || '_No specific rule body provided._',
    '',
    '## ⚡ Trigger Context',
    triggerContext || '_Applies globally within domain context._',
    '',
    '## 🚫 Mandatory Negative Constraint',
    negativeConstraint,
    ''
  ].filter(Boolean).join('\n');

  fs.writeFileSync(filePath, markdownContent, 'utf8');

  // 3. Dual-Write Indexing into SQLite SSOT (memory_nodes + memory_fts)
  let memoryRecord = null;
  try {
    const memoryTier = scope === 'global' ? 'core' : (scope === 'session' ? 'session' : 'project');
    const combinedMemoryText = [
      `[KI: ${id}] ${title}`,
      rule ? `Rule: ${rule}` : null,
      `Negative Constraint: ${negativeConstraint}`,
      `Scope: ${scope} | Domain: ${domain}`
    ].filter(Boolean).join('\n');

    memoryRecord = saveMemory({
      content: combinedMemoryText,
      summary: title,
      tier: memoryTier,
      category: 'rule',
      importance
    });
  } catch (dbErr) {
    process.stderr.write(`[atomic-ki] Warning: Dual SQLite indexing failed: ${dbErr.message}\n`);
  }

  return {
    ok: true,
    id,
    title,
    scope,
    domain,
    filePath,
    negativeConstraint,
    memoryId: memoryRecord ? memoryRecord.id : null,
    dualIndexed: !!memoryRecord
  };
}

module.exports = {
  extractAndPersistKi,
  getKnowledgeRootDir
};
