/**
 * Tidy Ecosystem — Structured 8-Taxonomy Memory Engine
 * Standardized classification, normalization, and schema validation for permanent memory nodes.
 *
 * @module @tidy/core/memory-taxonomy
 * @version 1.6.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

/**
 * Authoritative 8-Taxonomy Schema Specification
 * Memory is never an unstructured chat transcript; all persisted nodes conform to these 8 types.
 */
const MEMORY_TAXONOMIES = {
  facts: {
    key: 'facts',
    singular: 'fact',
    name: 'Facts & Environment Truths',
    nameAr: 'الحقائق والمواصفات المعتمدة',
    description: 'Empirical environment specifications, platform versions, and verified ground truths.',
    boostMultiplier: 1.00,
    defaultTier: 'core'
  },
  decisions: {
    key: 'decisions',
    singular: 'decision',
    name: 'Architectural & Strategic Decisions',
    nameAr: 'القرارات المعمارية والاستراتيجية',
    description: 'Architectural choices, strategic plans, and explicit engineering trade-offs with rationale.',
    boostMultiplier: 1.25,
    defaultTier: 'core'
  },
  preferences: {
    key: 'preferences',
    singular: 'preference',
    name: 'Principal & Team Preferences',
    nameAr: 'التفضيلات وأنماط العمل',
    description: 'Principal stylistic, workflow, tone, and code authoring preferences.',
    boostMultiplier: 1.15,
    defaultTier: 'core'
  },
  assets: {
    key: 'assets',
    singular: 'asset',
    name: 'Digital Assets & Brand Artifacts',
    nameAr: 'الأصول والعلامات التجارية',
    description: 'Brand colors, typography tokens, SVGs, UI templates, and media asset definitions.',
    boostMultiplier: 1.10,
    defaultTier: 'project'
  },
  references: {
    key: 'references',
    singular: 'reference',
    name: 'External References & Contracts',
    nameAr: 'المراجع والعقود الخارجية',
    description: 'External API schemas, benchmark implementations, documentation links, and RFC links.',
    boostMultiplier: 1.05,
    defaultTier: 'project'
  },
  previous_outputs: {
    key: 'previous_outputs',
    singular: 'output',
    name: 'Previous Approved Deliverables',
    nameAr: 'المخرجات المعتمدة السابقة',
    description: 'Approved deliverables, code solutions, generated briefs, invoices, and campaigns.',
    boostMultiplier: 1.00,
    defaultTier: 'project'
  },
  lessons: {
    key: 'lessons',
    singular: 'lesson',
    name: 'Learned Lessons & Negative Constraints',
    nameAr: 'الدروس المستفادة والقيود السلبية',
    description: 'Negative constraints, solved bugs, edge-case gotchas, and anti-patterns to avoid.',
    boostMultiplier: 1.30,
    defaultTier: 'core'
  },
  relationships: {
    key: 'relationships',
    singular: 'relationship',
    name: 'Entity & Workflow Relationships',
    nameAr: 'العلاقات والروابط التخطيطية',
    description: 'Graph edges connecting clients, projects, community skills, and MCP tools.',
    boostMultiplier: 1.05,
    defaultTier: 'project'
  }
};

// Aliases mapping colloquial and singular terms to canonical taxonomy keys
const TAXONOMY_ALIASES = {
  fact: 'facts',
  facts: 'facts',
  truth: 'facts',
  spec: 'facts',
  environment: 'facts',

  decision: 'decisions',
  decisions: 'decisions',
  adr: 'decisions',
  strategy: 'decisions',
  plan: 'decisions',

  preference: 'preferences',
  preferences: 'preferences',
  style: 'preferences',
  tone: 'preferences',

  asset: 'assets',
  assets: 'assets',
  brand: 'assets',
  logo: 'assets',
  color: 'assets',

  reference: 'references',
  references: 'references',
  doc: 'references',
  documentation: 'references',
  contract: 'references',
  schema: 'references',

  output: 'previous_outputs',
  outputs: 'previous_outputs',
  previous_output: 'previous_outputs',
  previous_outputs: 'previous_outputs',
  deliverable: 'previous_outputs',
  snippet: 'previous_outputs',

  lesson: 'lessons',
  lessons: 'lessons',
  rule: 'lessons',
  constraint: 'lessons',
  negative_constraint: 'lessons',
  negative_constraints: 'lessons',
  bugfix: 'lessons',
  gotcha: 'lessons',

  relationship: 'relationships',
  relationships: 'relationships',
  edge: 'relationships',
  connection: 'relationships',
  client: 'relationships'
};

/**
 * Normalize an arbitrary taxonomy string or alias to canonical taxonomy key
 * @param {string} input - Category or alias input
 * @returns {string} Canonical taxonomy key (defaults to 'facts' if unrecognized)
 */
function normalizeTaxonomy(input) {
  if (!input || typeof input !== 'string') return 'facts';
  const clean = input.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return TAXONOMY_ALIASES[clean] || 'facts';
}

/**
 * Validate whether an input corresponds to a valid taxonomy key or alias
 * @param {string} input
 * @returns {boolean}
 */
function isValidTaxonomy(input) {
  if (!input || typeof input !== 'string') return false;
  const clean = input.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return Boolean(TAXONOMY_ALIASES[clean]);
}

/**
 * Get detailed metadata specification for a given taxonomy
 * @param {string} taxonomyKey
 * @returns {object} Taxonomy metadata specification
 */
function getTaxonomyMetadata(taxonomyKey) {
  const canonical = normalizeTaxonomy(taxonomyKey);
  return MEMORY_TAXONOMIES[canonical] || MEMORY_TAXONOMIES.facts;
}

/**
 * List all 8 authoritative taxonomies with their specs
 * @returns {Array<object>}
 */
function listTaxonomies() {
  return Object.values(MEMORY_TAXONOMIES);
}

/**
 * Heuristically classify memory content and tags into one of the 8 taxonomies
 * @param {string} content - Memory text content
 * @param {Array<string>} [tags=[]] - Associated tags
 * @returns {string} Inferred canonical taxonomy key
 */
function classifyMemoryTaxonomy(content, tags = []) {
  if (Array.isArray(tags) && tags.length > 0) {
    for (const tag of tags) {
      if (isValidTaxonomy(tag)) {
        return normalizeTaxonomy(tag);
      }
    }
  }

  if (!content || typeof content !== 'string') return 'facts';
  const text = content.toLowerCase();

  // Lessons / Negative Constraints (Highest priority)
  if (
    text.includes('لا تقم') ||
    text.includes('ممنوع') ||
    text.includes('never') ||
    text.includes('do not') ||
    text.includes('gotcha') ||
    text.includes('lesson learned') ||
    text.includes('negative constraint') ||
    text.includes('fix:') ||
    text.includes('avoid')
  ) {
    return 'lessons';
  }

  // Decisions / ADRs
  if (
    text.includes('قرار معماري') ||
    text.includes('اعتمد') ||
    text.includes('decision') ||
    text.includes('adr:') ||
    text.includes('architecture') ||
    text.includes('trade-off') ||
    text.includes('rationale')
  ) {
    return 'decisions';
  }

  // Preferences
  if (
    text.includes('أفضل') ||
    text.includes('تفضيل') ||
    text.includes('prefer') ||
    text.includes('preference') ||
    text.includes('formatting style') ||
    text.includes('tone:')
  ) {
    return 'preferences';
  }

  // Assets
  if (
    text.includes('brand') ||
    text.includes('color:') ||
    text.includes('palette') ||
    text.includes('svg') ||
    text.includes('logo') ||
    text.includes('typography') ||
    text.includes('هوية بصرية')
  ) {
    return 'assets';
  }

  // References
  if (
    text.includes('api reference') ||
    text.includes('endpoint:') ||
    text.includes('documentation') ||
    text.includes('schema:') ||
    text.includes('http://') ||
    text.includes('https://') ||
    text.includes('مرجع')
  ) {
    return 'references';
  }

  // Outputs
  if (
    text.includes('output:') ||
    text.includes('deliverable') ||
    text.includes('result brief') ||
    text.includes('invoice #') ||
    text.includes('مخرج معتمد')
  ) {
    return 'previous_outputs';
  }

  // Relationships
  if (
    text.includes('client:') ||
    text.includes('depends on') ||
    text.includes('relationship') ||
    text.includes('علاقة') ||
    text.includes('شريك')
  ) {
    return 'relationships';
  }

  // Default to facts
  return 'facts';
}

module.exports = {
  MEMORY_TAXONOMIES,
  TAXONOMY_ALIASES,
  normalizeTaxonomy,
  isValidTaxonomy,
  getTaxonomyMetadata,
  listTaxonomies,
  classifyMemoryTaxonomy
};
