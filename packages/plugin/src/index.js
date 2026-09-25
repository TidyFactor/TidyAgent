/**
 * Tidy Ecosystem — Universal Host Plugin & Adapters Layer
 * Mounts TidyAgent Control Plane across ChatGPT, Claude Code, OpenAI Codex, Cursor, and Antigravity.
 *
 * @module @tidy/plugin
 * @version 1.6.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { generateOpenApiSpec, generateAiPluginManifest } = require('./openapi-generator');

// Attempt to load core modules safely
let core;
try {
  core = require('@tidy/core');
} catch {
  try {
    core = require('../../core/src');
  } catch {
    core = null;
  }
}

/**
 * Base Abstract Host Adapter
 */
class BaseHostAdapter {
  constructor(hostId, name) {
    this.hostId = hostId;
    this.name = name;
  }

  /**
   * Compile context for host ingestion
   * Automatically normalizes flat parameters (task, project, domain, working) into the 5-tier context schema.
   * @param {object} payload - { task, domain, maxTokens, format, bypassFirewall, tiers }
   * @returns {object} Compiled output
   */
  compile(payload = {}) {
    if (!core || !core.compileContext) {
      throw new Error('Tidy Core Context Compiler not available in host adapter runtime');
    }

    const options = { ...payload };
    if (!options.tiers) {
      const tiers = {};
      if (options.global) tiers.global = options.global;
      if (options.project) {
        tiers.project = options.project;
      } else if (options.domain && options.domain !== 'general') {
        tiers.project = `Domain: ${options.domain}`;
      }
      if (options.task) tiers.task = options.task;
      if (options.session) tiers.session = options.session;
      if (options.working || options.workingContext || options.working_context) {
        tiers.working = options.working || options.workingContext || options.working_context;
      }
      options.tiers = tiers;
    } else if (!options.tiers.task && options.task) {
      options.tiers.task = options.task;
    }

    return core.compileContext(options);
  }

  /**
   * Route user intent through Tidy Intent Router
   * @param {string} prompt - User request
   * @returns {object} Routing outcome
   */
  route(prompt) {
    if (!core || !core.routeIntent) {
      throw new Error('Tidy Core Intent Router not available in host adapter runtime');
    }
    return core.routeIntent(prompt);
  }

  /**
   * Concurrently dispatch tasks across isolated subagents with conflict adjudication
   * @param {string} objective
   * @param {Array<object>} tasks
   * @param {object} [options={}]
   * @returns {Promise<object>} Synthesized non-conflicting plan
   */
  async dispatchParallel(objective, tasks, options = {}) {
    if (!core || !core.ParallelOrchestrator) {
      throw new Error('Tidy Core Parallel Orchestrator not available in host adapter runtime');
    }
    const orchestrator = new core.ParallelOrchestrator(options);
    const batchResults = await orchestrator.dispatchParallel(tasks, options.llmCaller);
    return orchestrator.synthesizeAndPersist({
      originalObjective: objective,
      batchResults,
      contextId: options.contextId || null,
      llmCaller: options.llmCaller || null,
      autoCommit: options.autoCommit !== false
    });
  }

  /**
   * Classify memory snippet into 8 canonical taxonomies
   * @param {string} text
   * @param {Array<string>} tags
   * @param {object} [options={}] - { detailed: boolean }
   * @returns {string|object} Inferred canonical taxonomy key or detailed object if requested
   */
  classify(text, tags = [], options = {}) {
    if (!core || !core.classifyMemoryTaxonomy) {
      throw new Error('Tidy Core Memory Taxonomy Classifier not available in host adapter runtime');
    }
    const taxonomyKey = core.classifyMemoryTaxonomy(text, tags);
    if (options.detailed) {
      return this.classifyDetails(text, tags);
    }
    return taxonomyKey;
  }

  /**
   * Classify memory snippet with detailed confidence, rationale, and metadata
   * @param {string} text
   * @param {Array<string>} tags
   * @returns {object} { canonical_taxonomy, taxonomy, confidence, rationale, metadata }
   */
  classifyDetails(text, tags = []) {
    if (!core || !core.classifyMemoryTaxonomy) {
      throw new Error('Tidy Core Memory Taxonomy Classifier not available in host adapter runtime');
    }
    const taxonomyKey = core.classifyMemoryTaxonomy(text, tags);
    const meta = (core.getTaxonomyMetadata && core.getTaxonomyMetadata(taxonomyKey)) || {};

    let confidence = 0.85;
    let rationale = `Matched authoritative taxonomy "${taxonomyKey}".`;
    if (Array.isArray(tags) && tags.some(t => core.isValidTaxonomy && core.isValidTaxonomy(t))) {
      confidence = 0.98;
      rationale = `Explicit taxonomy tag detected in input metadata.`;
    } else if (taxonomyKey === 'facts' && !String(text).toLowerCase().includes('fact')) {
      confidence = 0.70;
      rationale = `Defaulted to facts ground-truth baseline without specific triggers.`;
    }

    return {
      canonical_taxonomy: taxonomyKey,
      taxonomy: taxonomyKey,
      confidence,
      rationale,
      metadata: {
        name: meta.name || taxonomyKey,
        nameAr: meta.nameAr || '',
        boostMultiplier: meta.boostMultiplier || 1.0,
        defaultTier: meta.defaultTier || 'core'
      }
    };
  }
}

/**
 * ChatGPT Plugin & Actions Host Adapter
 */
class ChatGPTPluginAdapter extends BaseHostAdapter {
  constructor() {
    super('chatgpt', 'ChatGPT Actions & Plugin Host');
  }

  formatPrompt(prompt, contextPayload = {}) {
    const payload = {
      task: prompt,
      ...contextPayload,
      format: 'system_prompt'
    };
    const compiled = this.compile(payload);
    return {
      role: 'system',
      content: compiled.compiledPrompt,
      user_message: prompt
    };
  }

  generateOpenApi(options = {}) {
    return generateOpenApiSpec(options);
  }

  generatePluginManifest(options = {}) {
    return generateAiPluginManifest(options);
  }

  generateCustomGptInstructions(contextPayload = {}) {
    const compiled = this.compile({ ...contextPayload, format: 'markdown' });
    return `# Role: TidyAgent Sovereign Assistant
You are paired with TidyAgent Control Plane. Always respect the 5 tiers of context and capability-first skill boundaries.

${compiled.compiledPrompt}

## Action Execution Guidelines
1. Call \`tidyContextCompile\` before beginning multi-step architectural or code tasks.
2. Call \`tidyIntentRoute\` when the user asks for domain-specific recommendations.
3. Call \`tidyTaxonomyClassify\` before storing decisions or learned lessons into memory.
`;
  }
}

/**
 * Claude Code (CLI & Desktop) Host Adapter
 */
class ClaudeCodeAdapter extends BaseHostAdapter {
  constructor() {
    super('claude', 'Claude Code Sovereign Adapter');
  }

  formatPrompt(prompt, contextPayload = {}) {
    const payload = {
      task: prompt,
      ...contextPayload,
      format: 'markdown'
    };
    const compiled = this.compile(payload);
    return {
      system: compiled.compiledPrompt,
      prompt: prompt,
      metadata: {
        host: 'claude',
        tokens: compiled.totalEstimatedTokens
      }
    };
  }

  generateClaudeDesktopConfig(options = {}) {
    const token = options.token || 'YOUR_SOVEREIGN_TOKEN';
    const serverUrl = options.serverUrl || 'https://tidyfactor.com/api/mcp/sse';
    const useLocal = options.useLocal || false;

    if (useLocal) {
      return {
        mcpServers: {
          tidy: {
            command: 'npx',
            args: ['-y', '@tidy/mcp']
          }
        }
      };
    }

    return {
      mcpServers: {
        tidy: {
          url: `${serverUrl}?token=${token}`
        }
      }
    };
  }

  generateClaudeMd(contextPayload = {}) {
    const compiled = this.compile({ ...contextPayload, format: 'markdown' });
    return `# CLAUDE.md — TidyAgent Sovereign Operational Rules

${compiled.compiledPrompt}

## Operational Invariants
- Contextual Firewall: Dev and Marketing domains must remain isolated.
- Single Source of Truth: SQLite WAL database-per-tenant.
- SemVer SSOT: Always maintain Keep a Changelog and synchronized package manifests.
- Capability-First: Limit active skill instructions to top 2-3 relevant skills.
`;
  }
}

/**
 * Cursor IDE / Rules Bridge Adapter
 */
class CursorBridgeAdapter extends BaseHostAdapter {
  constructor() {
    super('cursor', 'Cursor IDE Rules & MCP Bridge');
  }

  generateRuleContent(contextPayload = {}) {
    const compiled = this.compile({ ...contextPayload, format: 'markdown' });
    return `---
description: TidyAgent Sovereign Control Plane Context
globs: *
alwaysApply: true
---

${compiled.compiledPrompt}
`;
  }

  generateCursorMcpConfig(options = {}) {
    const token = options.token || 'YOUR_SOVEREIGN_TOKEN';
    const serverUrl = options.serverUrl || 'https://tidyfactor.com/api/mcp/sse';
    const useLocal = options.useLocal || false;

    if (useLocal) {
      return {
        mcpServers: {
          'tidy-brain': {
            command: 'node',
            args: ['bin/tidy.js', 'mcp']
          }
        }
      };
    }

    return {
      mcpServers: {
        'tidy-brain': {
          url: `${serverUrl}?token=${token}`
        }
      }
    };
  }
}

/**
 * OpenAI Codex / Stdio Bridge Adapter
 */
class OpenAICodexAdapter extends BaseHostAdapter {
  constructor() {
    super('codex', 'OpenAI Codex Stdio Bridge');
  }

  formatSystemMessage(contextPayload = {}) {
    const compiled = this.compile({ ...contextPayload, format: 'system_prompt' });
    return {
      role: 'developer',
      content: compiled.compiledPrompt
    };
  }

  generateCodexConfig() {
    return {
      mcpServers: {
        tidy: {
          command: 'npx',
          args: ['-y', '@tidy/mcp']
        }
      }
    };
  }
}

/**
 * Antigravity IDE Native Adapter
 */
class AntigravityIdeAdapter extends BaseHostAdapter {
  constructor() {
    super('antigravity', 'Google Antigravity IDE Integration');
  }

  formatContext(prompt, contextPayload = {}) {
    const payload = {
      task: prompt,
      ...contextPayload,
      format: 'markdown'
    };
    const compiled = this.compile(payload);
    const routing = this.route(prompt);
    return {
      compiledMarkdown: compiled.compiledPrompt,
      targetSkills: routing.matchedSkills || routing.targetSkills || [],
      recommendedTools: routing.recommendedTools || [],
      domain: routing.domain,
      tokens: compiled.totalEstimatedTokens
    };
  }

  generateMcpConfig(options = {}) {
    const token = options.token || 'YOUR_SOVEREIGN_TOKEN';
    const serverUrl = options.serverUrl || 'https://tidyfactor.com/api/mcp/sse';

    return {
      mcpServers: {
        'tidyfactor-brain': {
          url: `${serverUrl}?token=${token}`
        }
      }
    };
  }

  generateGeminiRule(contextPayload = {}) {
    const compiled = this.compile({ ...contextPayload, format: 'markdown' });
    return `# GEMINI.md — TidyAgent Sovereign Platform Rules

${compiled.compiledPrompt}
`;
  }
}

// Registry map of supported host adapters
const ADAPTER_REGISTRY = {
  chatgpt: ChatGPTPluginAdapter,
  claude: ClaudeCodeAdapter,
  cursor: CursorBridgeAdapter,
  codex: OpenAICodexAdapter,
  antigravity: AntigravityIdeAdapter
};

/**
 * Get instantiated Host Adapter by identifier
 * @param {string} hostId - 'chatgpt' | 'claude' | 'cursor' | 'codex' | 'antigravity'
 * @returns {BaseHostAdapter}
 */
function getHostAdapter(hostId) {
  const key = String(hostId || '').toLowerCase().trim();
  const AdapterClass = ADAPTER_REGISTRY[key];
  if (!AdapterClass) {
    throw new Error(`Unsupported host adapter: "${hostId}". Supported: ${Object.keys(ADAPTER_REGISTRY).join(', ')}`);
  }
  return new AdapterClass();
}

/**
 * List all available host adapters
 * @returns {Array<string>}
 */
function listSupportedHosts() {
  return Object.keys(ADAPTER_REGISTRY);
}

/**
 * Get plugin manifest JSON
 * @returns {object}
 */
function getPluginManifest() {
  const manifestPath = path.join(__dirname, '..', 'plugin.json');
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  return { version: '1.6.0', name: 'tidyagent' };
}

/**
 * Export complete host configuration in one call
 * @param {string} hostId
 * @param {object} options
 * @returns {object}
 */
function exportHostConfiguration(hostId, options = {}) {
  const adapter = getHostAdapter(hostId);
  switch (adapter.hostId) {
    case 'chatgpt':
      return {
        openapi: adapter.generateOpenApi(options),
        aiPlugin: adapter.generatePluginManifest(options),
        customGptPrompt: adapter.generateCustomGptInstructions(options)
      };
    case 'claude':
      return {
        desktopConfig: adapter.generateClaudeDesktopConfig(options),
        claudeMd: adapter.generateClaudeMd(options)
      };
    case 'cursor':
      return {
        mcpConfig: adapter.generateCursorMcpConfig(options),
        ruleContent: adapter.generateRuleContent(options)
      };
    case 'codex':
      return {
        codexConfig: adapter.generateCodexConfig(options)
      };
    case 'antigravity':
      return {
        mcpConfig: adapter.generateMcpConfig(options),
        geminiRule: adapter.generateGeminiRule(options)
      };
    default:
      return { error: 'Unknown host' };
  }
}

module.exports = {
  BaseHostAdapter,
  ChatGPTPluginAdapter,
  ClaudeCodeAdapter,
  CursorBridgeAdapter,
  OpenAICodexAdapter,
  AntigravityIdeAdapter,
  getHostAdapter,
  listSupportedHosts,
  getPluginManifest,
  generateOpenApiSpec,
  generateAiPluginManifest,
  exportHostConfiguration
};
