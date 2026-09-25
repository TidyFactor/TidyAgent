/**
 * Tidy MCP — Sovereign Control Plane Tools
 *
 * Exposes TidyAgent v1.6.0 Control Plane engines (5-Tier Context Compiler,
 * Intent Router & Capability Discovery, and Structured 8-Taxonomy Classifier).
 *
 * @module @tidy/mcp/modules/control-plane-tools
 * @version 1.6.0
 */

const core = require('@tidy/core');
const {
  compileContext,
  routeIntent,
  classifyMemoryTaxonomy,
  normalizeTaxonomy,
  listTaxonomies
} = core;

const controlPlaneTools = [
  {
    definition: {
      name: 'tidy_context_compile',
      description: 'Compiles a lean, budget-aware context package from 5 tiers (Global, Project, Task, Session, Working) for LLM prompts without token bloat.',
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Current task description or prompt to assemble context for' },
          domain: { type: 'string', description: 'Target domain (dev, marketing, devops, office, general)', default: 'general' },
          max_tokens: { type: 'integer', description: 'Maximum token budget for compiled context', default: 2000 },
          format: { type: 'string', enum: ['markdown', 'system_prompt', 'json'], default: 'markdown' },
          bypass_firewall: { type: 'boolean', default: false, description: 'Whether to bypass contextual firewall domain filtering' },
          working_context: { type: 'string', description: 'Optional ephemeral working artifacts or diffs' }
        },
        required: ['task']
      }
    },
    handler: (args) => {
      const task = String(args.task || '').trim();
      const domain = String(args.domain || 'general').trim();
      const maxTokens = Number(args.max_tokens) || 2000;
      const format = String(args.format || 'markdown').trim();
      const bypassFirewall = Boolean(args.bypass_firewall);
      const workingContext = args.working_context || null;

      const compiled = compileContext({
        task,
        domain,
        maxTokens,
        format,
        bypassFirewall,
        workingContext
      });

      const text = typeof compiled === 'string' ? compiled : (compiled.content || JSON.stringify(compiled, null, 2));

      return {
        content: [
          { type: 'text', text }
        ]
      };
    }
  },
  {
    definition: {
      name: 'tidy_intent_route',
      description: 'Analyzes user prompt, decomposes intent, matches relevant domain, recommends optimal community skills (strictly capped at 2-3), and suggests MCP execution tools.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'User prompt or instruction to analyze and route' }
        },
        required: ['prompt']
      }
    },
    handler: (args) => {
      const prompt = String(args.prompt || args.request_text || '').trim();
      const routed = routeIntent(prompt);

      let text = `### 🧭 TidyAgent Intent Routing Plan\n\n`;
      text += `- **Analyzed Intent:** "${prompt}"\n`;
      text += `- **Detected Domain:** \`${routed.domain}\`\n`;
      text += `- **Intent Classification:** \`${routed.intentType}\`\n`;
      text += `- **Capability-First Rule:** Strict cap of 2-3 skills maximum applied.\n\n`;

      text += `#### 🎯 Recommended Skills (Top ${routed.matchedSkills.length}):\n`;
      for (const skill of routed.matchedSkills) {
        text += `- \`${skill}\`\n`;
      }

      text += `\n#### ⚡ Recommended MCP Execution Tools:\n`;
      for (const tool of routed.recommendedTools) {
        text += `- \`${tool}\`\n`;
      }

      return {
        content: [
          { type: 'text', text }
        ]
      };
    }
  },
  {
    definition: {
      name: 'tidy_taxonomy_classify',
      description: 'Classifies text or memory into one of the 8 canonical memory taxonomies (facts, decisions, preferences, assets, references, previous_outputs, lessons, relationships) with rationale.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text or memory content to classify' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags or keywords' }
        },
        required: ['text']
      }
    },
    handler: (args) => {
      const text = String(args.text || args.content || '').trim();
      const tags = Array.isArray(args.tags) ? args.tags : [];
      const classified = classifyMemoryTaxonomy(text, tags);

      const taxonomyKey = typeof classified === 'string' ? classified : (classified.taxonomy || classified.canonical_taxonomy || 'facts');
      const confidence = (typeof classified === 'object' && classified.confidence) ? classified.confidence : 0.85;
      const rationale = (typeof classified === 'object' && classified.rationale) ? classified.rationale : `Matched authoritative taxonomy "${taxonomyKey}".`;

      let out = `### 🏷️ Tidy Memory Taxonomy Classification\n\n`;
      out += `- **Input Snippet:** "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n`;
      out += `- **Assigned Taxonomy:** \`${taxonomyKey}\` (1 of 8 Canonical Taxonomies)\n`;
      out += `- **Confidence:** ${Math.round(confidence * 100)}%\n`;
      out += `- **Rationale:** ${rationale}\n`;
      out += `- **Taxonomy Matrix:** \`facts\`, \`decisions\`, \`preferences\`, \`assets\`, \`references\`, \`previous_outputs\`, \`lessons\`, \`relationships\`.`;

      return {
        content: [
          { type: 'text', text: out }
        ]
      };
    }
  }
];

module.exports = { controlPlaneTools };
