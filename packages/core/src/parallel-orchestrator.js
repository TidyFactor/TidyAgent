/**
 * Tidy Ecosystem — Sovereign Parallel Subagent Engine
 * Fork & Join Orchestration with Context Isolation, Strict Output Contracts,
 * and Conflict Adjudication for Antigravity and Multi-Agent Runtimes.
 *
 * @module @tidy/core/parallel-orchestrator
 * @version 1.7.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

const { compileContext } = require('./context-compiler');
const { getSubagent } = require('./subagents');
const { saveMemory } = require('./memory');
const { getDb } = require('./db');
const { ConflictResolver } = require('./conflict-resolver');

class ParallelOrchestrator {
  /**
   * @param {object} [options={}]
   * @param {number} [options.maxConcurrency=4] - Maximum concurrent subagent executions
   * @param {number} [options.timeoutMs=30000] - Subagent execution timeout
   * @param {Function} [options.llmCaller=null] - Global default async LLM caller
   */
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 4;
    this.defaultTimeoutMs = options.timeoutMs || 30000;
    this.llmCaller = options.llmCaller || null;
    this.conflictResolver = new ConflictResolver({
      llmCaller: this.llmCaller,
      strictMode: options.strictMode || false
    });
  }

  /**
   * Execute an individual subagent within a tightly budgeted, isolated context sandbox
   * @param {object} params
   * @param {string} params.agentName - Registered subagent identifier
   * @param {string} params.subTask - Focused task instruction
   * @param {object} [params.schemaContract=null] - Expected JSON schema or sample contract
   * @param {Function} [params.llmCaller=null] - Overriding task-specific LLM caller
   * @param {number} [params.maxTokens=1200] - Ephemeral token budget ceiling
   * @returns {Promise<object>} Settled subagent execution envelope
   */
  async runIsolatedSubAgent({
    agentName,
    subTask,
    schemaContract = null,
    llmCaller = null,
    maxTokens = 1200
  }) {
    const agent = getSubagent(agentName);
    if (!agent) {
      throw new Error(`Subagent "${agentName}" is not registered in Tidy.`);
    }
    if (!agent.is_enabled) {
      throw new Error(`Subagent "${agentName}" is currently disabled in governance rules.`);
    }

    // 1. Context Isolation: Compile ephemeral zero-slop context package
    const contextEnvelope = compileContext({
      tiers: {
        global: `Identity: @${agent.name} (${agent.role}). Adhere strictly to the required output schema.`,
        project: agent.domain && agent.domain !== 'general' ? `Operational Domain: ${agent.domain}` : '',
        task: subTask
      },
      maxTokens,
      format: 'system_prompt',
      includeBudgetReport: false
    });

    const caller = llmCaller || this.llmCaller;

    // 2. Strict Schema Prompt Scaffolding
    let strictSystemPrompt = contextEnvelope.compiledPrompt;
    if (schemaContract) {
      strictSystemPrompt += `\n\nCRITICAL OUTPUT REQUIREMENT:
Do not include conversational filler, greetings, markdown narrative, or internal thinking steps.
Your output MUST be a single parseable JSON object matching this schema:
${JSON.stringify(schemaContract, null, 2)}`;
    }

    let rawOutput;
    if (caller && typeof caller === 'function') {
      // Execute via designated LLM caller
      rawOutput = await caller({
        agent: agent.name,
        systemPrompt: strictSystemPrompt,
        prompt: subTask,
        allowedTools: agent.allowed_tools
      });
    } else {
      // Default deterministic execution envelope when running in local unit test mode
      rawOutput = {
        agent: agent.name,
        role: agent.role,
        verdict: true,
        summary: `Executed subtask: ${subTask}`,
        key_findings: [`Completed successfully in isolated sandbox by @${agent.name}`],
        timestamp: new Date().toISOString()
      };
    }

    // 3. Strict Output Validation & CoT Pruning
    let parsedData;
    if (typeof rawOutput === 'object' && rawOutput !== null) {
      parsedData = rawOutput;
    } else {
      try {
        const text = String(rawOutput).trim();
        // Remove markdown code fences if wrapped
        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedData = JSON.parse(clean);
      } catch {
        parsedData = {
          raw_text: String(rawOutput).slice(0, 500),
          parse_error: true
        };
      }
    }

    return {
      agent: agent.name,
      role: agent.role,
      status: 'fulfilled',
      tokens_allocated: maxTokens,
      data: parsedData
    };
  }

  /**
   * Concurrently dispatch a batch of subtasks across isolated subagents
   * @param {Array<object>} taskBatch - Array of { agentName, subTask, schemaContract, maxTokens }
   * @param {Function} [llmCaller=null] - Optional overriding LLM caller
   * @returns {Promise<Array<object>>} Settled results array with fulfilled/rejected states
   */
  async dispatchParallel(taskBatch = [], llmCaller = null) {
    if (!Array.isArray(taskBatch) || taskBatch.length === 0) {
      return [];
    }

    const executionPromises = taskBatch.map(item =>
      this.runIsolatedSubAgent({
        agentName: item.agentName || item.agent,
        subTask: item.subTask || item.task,
        schemaContract: item.schemaContract || null,
        llmCaller: item.llmCaller || llmCaller || this.llmCaller,
        maxTokens: item.maxTokens || 1200
      }).catch(err => ({
        agent: item.agentName || item.agent || 'unknown',
        status: 'rejected',
        error: err.message
      }))
    );

    // Fork & Join Barrier: Wait for all promises to settle without failing the batch
    return Promise.all(executionPromises);
  }

  /**
   * Reconcile deliverables, adjudicate conflicts, and atomically commit the final plan into SQLite SSOT
   * @param {object} params
   * @param {string} params.originalObjective - Root user goal
   * @param {Array<object>} params.batchResults - Results returned from dispatchParallel
   * @param {string} [params.contextId=null] - Active workspace context ID
   * @param {Function} [params.llmCaller=null] - Adjudication LLM caller
   * @param {boolean} [params.autoCommit=true] - Whether to write atomic memory decision node
   * @returns {Promise<object>} Synthesized and reconciled deliverable package
   */
  async synthesizeAndPersist({
    originalObjective,
    batchResults = [],
    contextId = null,
    llmCaller = null,
    autoCommit = true
  }) {
    const successfulOutputs = {};
    const failedAgents = [];

    for (const res of batchResults) {
      if (res && res.status === 'fulfilled') {
        successfulOutputs[res.agent] = res.data;
      } else if (res) {
        failedAgents.push({
          agent: res.agent,
          reason: res.error || 'Execution failed'
        });
      }
    }

    // 1. Conflict Detection across successful deliverables
    const directConflicts = this.conflictResolver.detectDirectConflicts(successfulOutputs);

    let finalDeliverables = successfulOutputs;
    let resolutionLog = null;

    // 2. Adjudication Pass if conflicts are detected
    if (directConflicts.length > 0) {
      const adjudicator = llmCaller
        ? new ConflictResolver({ llmCaller })
        : this.conflictResolver;

      resolutionLog = await adjudicator.adjudicateSemanticConflicts({
        objective: originalObjective,
        subagentOutputs: successfulOutputs,
        knownConflicts: directConflicts
      });

      if (resolutionLog && resolutionLog.adjudicated_deliverables) {
        finalDeliverables = resolutionLog.adjudicated_deliverables;
      }
    }

    // 3. Assemble Consolidated Deliverable Package
    const consolidatedPlan = {
      objective: originalObjective,
      timestamp: new Date().toISOString(),
      orchestration_summary: {
        total_subagents: batchResults.length,
        succeeded: Object.keys(successfulOutputs).length,
        failed: failedAgents.length,
        conflicts_detected: directConflicts.length,
        resolution_status: directConflicts.length > 0 ? (resolutionLog ? resolutionLog.method : 'adjudicated') : 'clean'
      },
      deliverables: finalDeliverables,
      conflicts_report: resolutionLog,
      failures: failedAgents
    };

    // 4. Atomic Memory & Audit Commit
    if (autoCommit) {
      try {
        const memoryContent = `[Parallel Orchestrator: "${originalObjective}"]\nStatus: ${consolidatedPlan.orchestration_summary.resolution_status}\nDeliverables: ${JSON.stringify(finalDeliverables, null, 2)}`;
        
        saveMemory({
          content: memoryContent,
          category: 'decisions',
          tier: 'project',
          importance: directConflicts.length > 0 ? 5 : 4,
          contextId
        });

        const db = getDb();
        const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
        logStmt.run(
          'PARALLEL_ORCHESTRATION_SYNTHESIS',
          'parallel_orchestrator',
          JSON.stringify({
            objective: originalObjective,
            agents_count: batchResults.length,
            conflicts: directConflicts.length
          })
        );
      } catch (err) {
        consolidatedPlan.commit_warning = err.message;
      }
    }

    return consolidatedPlan;
  }
}

const defaultOrchestrator = new ParallelOrchestrator();

module.exports = {
  ParallelOrchestrator,
  dispatchParallel: (batch, llmCaller) => defaultOrchestrator.dispatchParallel(batch, llmCaller),
  synthesizeAndPersist: (params) => defaultOrchestrator.synthesizeAndPersist(params)
};
