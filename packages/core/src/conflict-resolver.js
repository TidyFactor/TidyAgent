/**
 * Tidy Ecosystem — Conflict Detection & Adjudication Engine
 * Resolves contradictory deliverables, file collision conflicts, and architectural discord
 * across parallel subagents using deterministic priorities and semantic adjudication.
 *
 * @module @tidy/core/conflict-resolver
 * @version 1.7.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

/**
 * Authoritative Domain Priority Hierarchy
 * When conflicts arise, specialized high-stakes domains take precedence.
 */
const DOMAIN_PRIORITIES = {
  security_auditor: 100, // Security always has supreme veto power
  ops_security: 100,
  performance_expert: 85,
  architect: 80,
  developer: 75,
  seo_specialist: 70,
  copywriter: 60,
  general: 50
};

class ConflictResolver {
  /**
   * @param {object} [options={}]
   * @param {Function} [options.llmCaller=null] - Optional async LLM caller function for semantic adjudication
   * @param {boolean} [options.strictMode=false] - Whether to throw on unresolvable conflicts
   */
  constructor(options = {}) {
    this.llmCaller = options.llmCaller || null;
    this.strictMode = Boolean(options.strictMode);
  }

  /**
   * Step 1: Detect direct deterministic conflicts across agent outputs
   * @param {object} subagentOutputs - Map of { [agentName]: outputData }
   * @returns {Array<object>} Array of detected conflict descriptors
   */
  detectDirectConflicts(subagentOutputs = {}) {
    const conflicts = [];
    const agents = Object.keys(subagentOutputs);

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agentA = agents[i];
        const agentB = agents[j];
        const dataA = subagentOutputs[agentA] || {};
        const dataB = subagentOutputs[agentB] || {};

        // 1. File Mutation Collision
        const filesA = dataA.target_files || dataA.files || [];
        const filesB = dataB.target_files || dataB.files || [];
        if (Array.isArray(filesA) && Array.isArray(filesB) && filesA.length > 0 && filesB.length > 0) {
          const overlap = filesA.filter(f => filesB.includes(f));
          if (overlap.length > 0) {
            conflicts.push({
              type: 'FILE_MUTATION_COLLISION',
              severity: 'high',
              agents: [agentA, agentB],
              contested_items: overlap,
              details: `Conflict over concurrent modification of file(s): ${overlap.join(', ')}`
            });
          }
        }

        // 2. Binary Verdict Discord (e.g. approve vs reject)
        const verdictA = dataA.verdict !== undefined ? dataA.verdict : dataA.approved;
        const verdictB = dataB.verdict !== undefined ? dataB.verdict : dataB.approved;
        if (typeof verdictA === 'boolean' && typeof verdictB === 'boolean' && verdictA !== verdictB) {
          conflicts.push({
            type: 'BINARY_VERDICT_DISCORD',
            severity: 'critical',
            agents: [agentA, agentB],
            details: `Agent "${agentA}" evaluated as ${verdictA}, whereas "${agentB}" evaluated as ${verdictB}.`
          });
        }

        // 3. Mutually Exclusive Strategy Proposals
        if (dataA.strategy && dataB.strategy && dataA.strategy !== dataB.strategy) {
          conflicts.push({
            type: 'STRATEGY_DIVERGENCE',
            severity: 'medium',
            agents: [agentA, agentB],
            details: `Strategy divergence: "${dataA.strategy}" vs "${dataB.strategy}"`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Step 2: Adjudicate semantic and structural conflicts
   * @param {object} params
   * @param {string} params.objective - Root user objective
   * @param {object} params.subagentOutputs - Map of { [agentName]: outputData }
   * @param {Array<object>} params.knownConflicts - Detected conflicts from detectDirectConflicts
   * @returns {Promise<object>} Adjudication outcome with reconciled deliverables and concessions
   */
  async adjudicateSemanticConflicts({ objective, subagentOutputs, knownConflicts = [] }) {
    if (this.llmCaller && typeof this.llmCaller === 'function') {
      try {
        const adjudicatorPrompt = `
Objective: "${objective}"

Agents have produced conflicting recommendations:
${JSON.stringify(knownConflicts, null, 2)}

Full Deliverables from Agents:
${JSON.stringify(subagentOutputs, null, 2)}

Domain Priority Hierarchy:
${JSON.stringify(DOMAIN_PRIORITIES, null, 2)}

INSTRUCTIONS:
1. Act as the Supreme Technical Adjudicator for TidyAgent Sovereign Control Plane.
2. Resolve all contradictions using the Domain Priority Hierarchy and the core objective.
3. Eliminate duplicate, overlapping, or opposing action items.
4. Output MUST be valid JSON only, following this exact schema:
{
  "resolved": true,
  "conflicts_analyzed": ["string"],
  "adjudicated_deliverables": {
    /* Merged and reconciled deliverables per agent/domain */
  },
  "compromises_made": [
    { "agent": "string", "concession": "string", "reason": "string" }
  ]
}
`;
        const rawDecision = await this.llmCaller({
          systemPrompt: 'You are the TidyAgent Supreme Technical Adjudicator. Return strictly valid JSON.',
          prompt: adjudicatorPrompt
        });

        const parsed = typeof rawDecision === 'object' ? rawDecision : JSON.parse(rawDecision);
        if (parsed && parsed.adjudicated_deliverables) {
          return {
            resolved: true,
            method: 'semantic_adjudication_llm',
            conflicts_analyzed: parsed.conflicts_analyzed || knownConflicts.map(c => c.type),
            adjudicated_deliverables: parsed.adjudicated_deliverables,
            compromises_made: parsed.compromises_made || []
          };
        }
      } catch {
        // Fallback gracefully on parsing/network error
      }
    }

    // Deterministic fallback resolution
    return this._fallbackHeuristicResolution(subagentOutputs, knownConflicts);
  }

  /**
   * Deterministic fallback resolution prioritizing high-rank domains
   * @private
   */
  _fallbackHeuristicResolution(subagentOutputs, knownConflicts = []) {
    const sortedAgents = Object.keys(subagentOutputs).sort((a, b) => {
      const weightA = DOMAIN_PRIORITIES[a] || DOMAIN_PRIORITIES.general;
      const weightB = DOMAIN_PRIORITIES[b] || DOMAIN_PRIORITIES.general;
      return weightB - weightA;
    });

    const dominantAgent = sortedAgents[0];
    const compromises = [];

    for (const conflict of knownConflicts) {
      const [agentA, agentB] = conflict.agents;
      const weightA = DOMAIN_PRIORITIES[agentA] || DOMAIN_PRIORITIES.general;
      const weightB = DOMAIN_PRIORITIES[agentB] || DOMAIN_PRIORITIES.general;

      const winner = weightA >= weightB ? agentA : agentB;
      const loser = weightA >= weightB ? agentB : agentA;

      compromises.push({
        agent: loser,
        concession: `Overruled on ${conflict.type} in favor of ${winner} (Priority: ${Math.max(weightA, weightB)})`,
        reason: conflict.details,
        resolved_by: winner
      });
    }

    // Reconcile deliverables: copy outputs, but tag overridden status if contested
    const reconciled = {};
    for (const [agent, data] of Object.entries(subagentOutputs)) {
      reconciled[agent] = {
        ...data,
        _adjudication: {
          priority_weight: DOMAIN_PRIORITIES[agent] || DOMAIN_PRIORITIES.general,
          is_dominant: agent === dominantAgent
        }
      };
    }

    return {
      resolved: true,
      method: 'deterministic_priority_hierarchy',
      conflicts_analyzed: knownConflicts.map(c => c.type),
      adjudicated_deliverables: reconciled,
      dominant_agent: dominantAgent,
      compromises_made: compromises
    };
  }
}

module.exports = {
  ConflictResolver,
  DOMAIN_PRIORITIES
};
