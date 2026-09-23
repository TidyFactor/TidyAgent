/**
 * Tidy MCP — Registry & O(1) Tool Dispatcher
 *
 * Compiles in-memory lookup tables for all tools, resources, and prompts at bootstrap
 * for sub-millisecond dispatching without hot-path dynamic resolution.
 *
 * @module @tidy/mcp/registry
 * @version 1.5.0
 */

const { coreTools } = require('./modules/core-tools');
const { brainTools } = require('./modules/brain-tools');
const { harvestTools } = require('./modules/harvest-tools');
const { officeTools } = require('./modules/office-tools');
const { resourcesList, handleResourceRead } = require('./modules/resources');
const { promptsList, handlePromptGet } = require('./modules/prompts');

// 1. Compile Tool Catalog and O(1) Handler Map
const allToolModules = [
  ...coreTools,
  ...harvestTools,
  ...brainTools,
  ...officeTools
];

// Legacy tool names mapping to sovereign Tidy tools
const LEGACY_ALIASES = {
  'doctor': 'tidy_doctor',
  'probe_server_health': 'tidy_doctor',
  'search_knowledge_base': 'tidy_search',
  'semantic_search_vss': 'tidy_search',
  'extract_knowledge_item': 'tidy_extract',
  'contextual_firewall': 'tidy_firewall',
  'check_contextual_firewall': 'tidy_firewall',
  'get_skill_manifest': 'tidy_manifest',
  'audit_codebase_ast': 'tidy_manifest',
  'recall_memory': 'tidy_recall',
  'memorize_fact': 'tidy_memorize',
  'switch_workspace_context': 'tidy_switch_context',
  'recall_transcripts': 'tidy_transcripts',
  'audit_storage_hygiene': 'tidy_hygiene',
  'whoami': 'tidy_whoami'
};

const TOOLS = [];
const toolHandlers = new Map();

for (const tool of allToolModules) {
  TOOLS.push(tool.definition);
  toolHandlers.set(tool.definition.name, tool.handler);
}

// Expose legacy aliases in TOOLS catalog so IDEs discover them directly via tools/list
for (const [aliasName, targetName] of Object.entries(LEGACY_ALIASES)) {
  const target = allToolModules.find(t => t.definition.name === targetName);
  if (target && !toolHandlers.has(aliasName)) {
    TOOLS.push({
      ...target.definition,
      name: aliasName,
      description: `[Alias for ${targetName}] ${target.definition.description}`
    });
    toolHandlers.set(aliasName, target.handler);
  }
}

// 2. Resources Catalog
const RESOURCES = resourcesList;

// 3. Prompts Catalog
const PROMPTS = promptsList;

/**
 * Normalizes tool arguments across legacy and sovereign signatures
 * @param {string} toolName - Normalized tool name
 * @param {object} args - Raw arguments
 * @returns {object} Normalized arguments
 */
function normalizeArgs(toolName, args = {}) {
  const normalized = { ...args };
  if (toolName === 'tidy_search') {
    if (args.top_k && !args.limit) normalized.limit = args.top_k;
    if (args.term && !args.query) normalized.query = args.term;
    if (args.q && !args.query) normalized.query = args.q;
  }
  if (toolName === 'tidy_recall') {
    if (args.top_k && !args.limit) normalized.limit = args.top_k;
    if (args.term && !args.query) normalized.query = args.term;
    if (args.q && !args.query) normalized.query = args.q;
  }
  if (toolName === 'tidy_manifest') {
    normalized.skill_id = args.skill_id || args.skillId || args.id || args.name || 'tidy';
  }
  if (toolName === 'tidy_memorize') {
    if (!normalized.content) {
      normalized.content = args.fact || args.text || args.data || args.information || args.entry || args.query || '';
    }
  }
  if (toolName === 'tidy_extract') {
    if (!normalized.id) normalized.id = args.ki_id || ('KI-' + Date.now());
    if (!normalized.title) normalized.title = args.rule || args.id || 'Extracted Knowledge';
    if (!normalized.negative_constraint) {
      normalized.negative_constraint = args.negative || args.constraint || args.suppression || 'Do not apply outside specified context';
    }
    if (!normalized.rule && args.content) normalized.rule = args.content;
    if (!normalized.trigger_context && args.context) normalized.trigger_context = args.context;
  }
  if (toolName === 'tidy_switch_context') {
    if (!normalized.context_id) {
      normalized.context_id = args.context || args.domain || args.name || args.id || 'dev';
    }
  }
  return normalized;
}

/**
 * Execute a tool by name with O(1) dispatching and backward compatibility
 * @param {string} rawName - The tool name (sovereign or legacy alias)
 * @param {object} args - Tool arguments
 * @returns {Promise<object>|object} Tool execution result formatted for MCP
 */
function executeTool(rawName, args = {}) {
  const normalizedName = LEGACY_ALIASES[rawName] || rawName;
  const handler = toolHandlers.get(normalizedName) || toolHandlers.get(rawName);
  if (!handler) {
    throw new Error(`Unknown tool: ${rawName}`);
  }
  const cleanArgs = normalizeArgs(normalizedName, args);
  return handler(cleanArgs);
}

module.exports = {
  TOOLS,
  RESOURCES,
  PROMPTS,
  LEGACY_ALIASES,
  executeTool,
  handleToolCall: executeTool,
  handleResourceRead,
  handlePromptGet
};

