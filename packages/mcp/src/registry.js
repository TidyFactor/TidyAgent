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

const TOOLS = [];
const toolHandlers = new Map();

for (const tool of allToolModules) {
  TOOLS.push(tool.definition);
  toolHandlers.set(tool.definition.name, tool.handler);
}

// 2. Resources Catalog
const RESOURCES = resourcesList;

// 3. Prompts Catalog
const PROMPTS = promptsList;

/**
 * Execute a tool by name with O(1) dispatching
 * @param {string} rawName - The tool name
 * @param {object} args - Tool arguments
 * @returns {Promise<object>|object} Tool execution result formatted for MCP
 */
function executeTool(rawName, args = {}) {
  const handler = toolHandlers.get(rawName);
  if (!handler) {
    throw new Error(`Unknown tool: ${rawName}`);
  }
  return handler(args);
}

module.exports = {
  TOOLS,
  RESOURCES,
  PROMPTS,
  executeTool,
  handleToolCall: executeTool,
  handleResourceRead,
  handlePromptGet
};
