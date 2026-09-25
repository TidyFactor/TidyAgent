/**
 * Tidy MCP — Parallel Subagent Dispatch & Conflict Adjudication Tools
 *
 * Exposes TidyAgent v1.7.0 Sovereign Parallel Multi-Agent Engine
 * (Fork & Join Dispatcher, Ephemeral Sandboxed Context, and Conflict Adjudication).
 *
 * @module @tidy/mcp/modules/parallel-tools
 * @version 1.7.0
 */

'use strict';

const core = require('@tidy/core');
const { ParallelOrchestrator } = core;

const parallelTools = [
  {
    definition: {
      name: 'tidy_parallel_dispatch',
      description: 'Concurrently dispatches multiple specialized subagents with isolated context sandboxes, adjudicates conflicting proposals, and returns a reconciled deliverable without context bloat.',
      inputSchema: {
        type: 'object',
        properties: {
          objective: {
            type: 'string',
            description: 'Root strategic objective or user task to orchestrate'
          },
          tasks: {
            type: 'array',
            description: 'Array of subtasks to execute concurrently across specialized subagents',
            items: {
              type: 'object',
              properties: {
                agent: {
                  type: 'string',
                  description: 'Registered subagent name (e.g. planner, coder, researcher, scribe)'
                },
                task: {
                  type: 'string',
                  description: 'Focused task instructions for this specific subagent'
                },
                max_tokens: {
                  type: 'integer',
                  default: 1200,
                  description: 'Ephemeral token budget ceiling for this subagent'
                },
                schema: {
                  type: 'object',
                  description: 'Optional strict JSON output schema expected from this subagent'
                }
              },
              required: ['agent', 'task']
            }
          },
          context_id: {
            type: 'string',
            description: 'Optional workspace context ID to associate deliverables with'
          },
          auto_commit: {
            type: 'boolean',
            default: true,
            description: 'Whether to write final reconciled plan into permanent SQLite memory'
          }
        },
        required: ['objective', 'tasks']
      }
    },
    handler: async (args) => {
      const objective = String(args.objective || '').trim();
      const taskList = Array.isArray(args.tasks) ? args.tasks : [];
      const contextId = args.context_id || null;
      const autoCommit = args.auto_commit !== false;

      if (!objective) {
        throw new Error("Parameter 'objective' is required for parallel dispatch.");
      }
      if (taskList.length === 0) {
        throw new Error("Parameter 'tasks' must contain at least one subagent task.");
      }

      const orchestrator = new ParallelOrchestrator();

      // Normalize task batch format
      const normalizedBatch = taskList.map(t => ({
        agentName: t.agent || t.agentName,
        subTask: t.task || t.subTask,
        maxTokens: t.max_tokens || t.maxTokens || 1200,
        schemaContract: t.schema || t.schemaContract || null
      }));

      // 1. Concurrent Execution
      const batchResults = await orchestrator.dispatchParallel(normalizedBatch);

      // 2. Reconciliation & Conflict Adjudication
      const synthesized = await orchestrator.synthesizeAndPersist({
        originalObjective: objective,
        batchResults,
        contextId,
        autoCommit
      });

      // 3. Format Concise Markdown Report
      let report = `### ⚡ TidyAgent Parallel Multi-Agent Execution Report\n\n`;
      report += `- **Objective:** "${objective}"\n`;
      report += `- **Execution Mode:** Concurrent Fork & Join (${synthesized.orchestration_summary.total_subagents} Subagents)\n`;
      report += `- **Success Rate:** ${synthesized.orchestration_summary.succeeded} succeeded, ${synthesized.orchestration_summary.failed} failed\n`;
      report += `- **Conflicts Detected:** ${synthesized.orchestration_summary.conflicts_detected} (${synthesized.orchestration_summary.resolution_status})\n\n`;

      if (synthesized.conflicts_report && synthesized.conflicts_report.compromises_made && synthesized.conflicts_report.compromises_made.length > 0) {
        report += `#### ⚖️ Adjudication Concessions & Resolutions:\n`;
        for (const comp of synthesized.conflicts_report.compromises_made) {
          report += `- **Agent @${comp.agent}:** ${comp.concession} (${comp.reason})\n`;
        }
        report += `\n`;
      }

      report += `#### 📦 Reconciled Deliverables:\n`;
      for (const [agentName, deliverable] of Object.entries(synthesized.deliverables)) {
        report += `##### 🤖 @${agentName}\n`;
        report += `\`\`\`json\n${JSON.stringify(deliverable, null, 2)}\n\`\`\`\n\n`;
      }

      if (synthesized.failures && synthesized.failures.length > 0) {
        report += `#### ⚠️ Failed Subagent Tasks:\n`;
        for (const fail of synthesized.failures) {
          report += `- **@${fail.agent}:** ${fail.reason}\n`;
        }
      }

      return {
        content: [
          { type: 'text', text: report }
        ]
      };
    }
  }
];

module.exports = { parallelTools };
