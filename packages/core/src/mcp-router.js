/**
 * Tidy Ecosystem — Dynamic MCP Router
 * Decoupled binding between procedural Skills ("How") and executable Tools ("Execution").
 * Automatically routes skill actions to registered MCP tools and populates ephemeral working context.
 *
 * @module @tidy/core/mcp-router
 * @version 1.7.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

class DynamicMcpRouter {
  /**
   * @param {object} [options={}]
   * @param {Map<string, Function>|object} [options.toolRegistry=null] - In-memory map of tool handlers
   */
  constructor(options = {}) {
    this.toolRegistry = new Map();

    // Default built-in tool mappings based on action keywords
    this.actionBindings = [
      { pattern: /recall|search|query_memory|lookup/i, tool: 'tidy_recall' },
      { pattern: /memorize|save_memory|persist_fact/i, tool: 'tidy_memorize' },
      { pattern: /add_task|create_task|schedule_task/i, tool: 'tidy_task_add' },
      { pattern: /list_tasks|get_tasks/i, tool: 'tidy_task_list' },
      { pattern: /invoice|create_invoice|bill/i, tool: 'tidy_invoice_create' },
      { pattern: /cashflow|revenue|expenses/i, tool: 'tidy_cashflow_summary' },
      { pattern: /crm|add_client|client_dossier/i, tool: 'tidy_client_dossier' },
      { pattern: /doctor|diagnose|health_check/i, tool: 'tidy_doctor' },
      { pattern: /firewall|check_firewall|isolation/i, tool: 'tidy_firewall' },
      { pattern: /extract|extract_ki/i, tool: 'tidy_extract' },
      { pattern: /hygiene|prune|clean_storage/i, tool: 'tidy_hygiene' },
      { pattern: /parallel|swarm|dispatch_concurrent/i, tool: 'tidy_parallel_dispatch' }
    ];

    if (options.toolRegistry) {
      if (options.toolRegistry instanceof Map) {
        this.toolRegistry = options.toolRegistry;
      } else if (typeof options.toolRegistry === 'object') {
        for (const [k, v] of Object.entries(options.toolRegistry)) {
          this.toolRegistry.set(k, v);
        }
      }
    }
  }

  /**
   * Register or override an executable tool handler
   * @param {string} toolName
   * @param {Function} handler
   */
  registerTool(toolName, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for tool "${toolName}" must be a function.`);
    }
    this.toolRegistry.set(toolName, handler);
  }

  /**
   * 1. Resolve which MCP tool satisfies a given skill step or action requirement
   * @param {string} skillName - Name of the active skill
   * @param {string} actionIntent - Action requirement or step description
   * @returns {string} Name of matching MCP tool
   */
  resolveToolForSkillStep(skillName, actionIntent = '') {
    const text = `${skillName} ${actionIntent}`.trim();

    for (const binding of this.actionBindings) {
      if (binding.pattern.test(text)) {
        return binding.tool;
      }
    }

    // Default fallback tool for intelligence & memory
    return 'tidy_recall';
  }

  /**
   * 2. Safely execute an MCP tool step
   * @param {string} toolName - Normalized tool identifier
   * @param {object} args - Tool payload parameters
   * @param {object} [contextEnvelope=null] - Optional context package
   * @returns {Promise<object>} Execution result envelope
   */
  async executeStep(toolName, args = {}, contextEnvelope = null) {
    const handler = this.toolRegistry.get(toolName);

    if (!handler) {
      return {
        ok: false,
        tool: toolName,
        status: 'unbound',
        error: `Tool "${toolName}" is not registered in active router execution map.`,
        simulated: true,
        args
      };
    }

    try {
      const output = await handler(args, contextEnvelope);
      return {
        ok: true,
        tool: toolName,
        status: 'executed',
        data: output,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        ok: false,
        tool: toolName,
        status: 'error',
        error: err.message
      };
    }
  }

  /**
   * 3. Populate Working Context with tool execution output
   * Injects results directly into the ephemeral Working Context tier
   * @param {object} workingContext - Mutable or initial working context object
   * @param {object} executionResult - Output from executeStep
   * @returns {object} Updated working context envelope
   */
  populateWorkingContext(workingContext = {}, executionResult) {
    const context = { ...workingContext };
    if (!context.tool_executions) {
      context.tool_executions = [];
    }

    const entry = {
      tool: executionResult.tool,
      status: executionResult.status,
      timestamp: executionResult.timestamp || new Date().toISOString(),
      summary: executionResult.ok ? 'Executed successfully' : (executionResult.error || 'Execution failed'),
      payload: executionResult.data || executionResult.args || null
    };

    context.tool_executions.push(entry);
    context.last_tool_output = executionResult.data || null;

    return context;
  }

  /**
   * 4. List all action bindings and active registered tools
   * @returns {object} Status map
   */
  listBindings() {
    return {
      registered_tool_count: this.toolRegistry.size,
      available_tools: Array.from(this.toolRegistry.keys()),
      pattern_rules: this.actionBindings.map(b => ({
        pattern: b.pattern.toString(),
        tool: b.tool
      }))
    };
  }
}

module.exports = {
  DynamicMcpRouter
};
