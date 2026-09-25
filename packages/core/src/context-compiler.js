/**
 * Tidy Ecosystem — Context Compiler Engine
 * 5-Tier Context Hierarchy Assembly, Deterministic Token Budgeting, and Zero-Slop Prompt Compilation.
 *
 * @module @tidy/core/context-compiler
 * @version 1.6.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

/**
 * Standard 5-Tier Context Hierarchy
 */
const TIER_NAMES = {
  GLOBAL: 'global',     // Tier 1: Principal persona, assistant identity, core invariants
  PROJECT: 'project',   // Tier 2: Workspace domain, active rules, brand guidelines, key decisions
  TASK: 'task',         // Tier 3: Current objective, assigned agent, constraints, outcomes
  SESSION: 'session',   // Tier 4: Active dialogue thread, verified checkpoints, tool telemetry
  WORKING: 'working'    // Tier 5: Ephemeral candidate assets, code diffs, reviewer critique
};

/**
 * Default percentage-based token budget allocation across the 5 tiers
 */
const DEFAULT_TIER_PERCENTAGES = {
  [TIER_NAMES.GLOBAL]: 0.10,    // 10%
  [TIER_NAMES.PROJECT]: 0.20,   // 20%
  [TIER_NAMES.TASK]: 0.35,      // 35%
  [TIER_NAMES.SESSION]: 0.15,   // 15%
  [TIER_NAMES.WORKING]: 0.20    // 20%
};

/**
 * Estimate token count using robust character/word heuristic (averaging 3.8 chars/token)
 * @param {string|object} input
 * @returns {number} Estimated tokens
 */
function estimateTokenCount(input) {
  if (!input) return 0;
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  if (!text.trim()) return 0;
  // A standard blend: average of character length / 3.8 and word count * 1.3
  const charBased = Math.ceil(text.length / 3.8);
  const words = text.trim().split(/\s+/).length;
  const wordBased = Math.ceil(words * 1.3);
  return Math.max(charBased, wordBased);
}

/**
 * Safely truncate text to fit within a designated token budget
 * @param {string} text - Source text
 * @param {number} maxTokens - Token ceiling
 * @returns {string} Truncated text with indicator if clipped
 */
function truncateToTokenBudget(text, maxTokens) {
  if (!text || maxTokens <= 0) return '';
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) return text;

  // Approximate character target
  const targetChars = Math.floor(maxTokens * 3.6);
  const truncated = text.slice(0, targetChars);
  return `${truncated}\n\n[... truncated by Tidy Context Compiler to satisfy ${maxTokens} token budget ...]`;
}

/**
 * Compile 5-Tier Context into a unified, zero-slop context payload
 *
 * @param {object} options
 * @param {object} options.tiers - Object containing tier payloads { global, project, task, session, working }
 * @param {number} [options.maxTokens=4000] - Total token ceiling for compiled output
 * @param {string} [options.format='markdown'] - Output format: 'markdown', 'system_prompt', 'json'
 * @param {boolean} [options.includeBudgetReport=true] - Whether to include metadata token accounting
 * @returns {object} { compiledPrompt, tokenBudget, metadata }
 */
function compileContext(options = {}) {
  const {
    maxTokens = 4000,
    format = 'markdown',
    includeBudgetReport = true
  } = options;

  // Support both nested tiers and flat options for caller ergonomics
  const inputTiers = options.tiers || {};
  const tiers = {
    [TIER_NAMES.GLOBAL]: inputTiers[TIER_NAMES.GLOBAL] || options.global || '',
    [TIER_NAMES.PROJECT]: inputTiers[TIER_NAMES.PROJECT] || options.project || (options.domain && options.domain !== 'general' ? `Active Domain: ${options.domain}` : ''),
    [TIER_NAMES.TASK]: inputTiers[TIER_NAMES.TASK] || options.task || '',
    [TIER_NAMES.SESSION]: inputTiers[TIER_NAMES.SESSION] || options.session || '',
    [TIER_NAMES.WORKING]: inputTiers[TIER_NAMES.WORKING] || options.working || options.workingContext || options.working_context || ''
  };

  // 1. Calculate per-tier budget caps
  const tierBudgets = {};
  for (const [tier, pct] of Object.entries(DEFAULT_TIER_PERCENTAGES)) {
    tierBudgets[tier] = Math.floor(maxTokens * pct);
  }

  // 2. Extract and format content for each tier
  const processedTiers = {};
  const tokenBreakdown = {};
  let totalEstimatedTokens = 0;

  for (const tierKey of Object.values(TIER_NAMES)) {
    const rawContent = tiers[tierKey] || '';
    const textContent = typeof rawContent === 'object'
      ? (Array.isArray(rawContent) ? rawContent.join('\n') : JSON.stringify(rawContent, null, 2))
      : String(rawContent).trim();

    const allowedTokens = tierBudgets[tierKey];
    const budgetedContent = truncateToTokenBudget(textContent, allowedTokens);
    const estimated = estimateTokenCount(budgetedContent);

    processedTiers[tierKey] = budgetedContent;
    tokenBreakdown[tierKey] = {
      allocatedBudget: allowedTokens,
      usedTokens: estimated,
      truncated: estimated < estimateTokenCount(textContent)
    };
    totalEstimatedTokens += estimated;
  }

  // 3. Assemble output based on target format
  let compiledPrompt = '';

  if (format === 'json') {
    compiledPrompt = JSON.stringify({
      version: '1.6.0',
      compiler: 'TidyAgent Context Compiler',
      totalTokens: totalEstimatedTokens,
      tokenBreakdown,
      tiers: processedTiers
    }, null, 2);
  } else if (format === 'system_prompt') {
    const sections = [];
    sections.push('=== TIDYAGENT COMPILED CONTEXT (ZERO-SLOP RUNTIME) ===');

    if (processedTiers.global) {
      sections.push(`[TIER 1: GLOBAL CONSTRAINTS & PERSONA]\n${processedTiers.global}`);
    }
    if (processedTiers.project) {
      sections.push(`[TIER 2: PROJECT & WORKSPACE DOMAIN]\n${processedTiers.project}`);
    }
    if (processedTiers.task) {
      sections.push(`[TIER 3: ACTIVE TASK & OBJECTIVE]\n${processedTiers.task}`);
    }
    if (processedTiers.session) {
      sections.push(`[TIER 4: SESSION TELEMETRY & CHECKPOINTS]\n${processedTiers.session}`);
    }
    if (processedTiers.working) {
      sections.push(`[TIER 5: WORKING CONTEXT & ARTIFACTS]\n${processedTiers.working}`);
    }

    compiledPrompt = sections.join('\n\n');
  } else {
    // Default: 'markdown' format
    const lines = [];
    lines.push('# 🧠 TidyAgent Compiled Context');
    lines.push('<!-- Compiled by Tidy Context Compiler v1.6.0 -->');

    if (includeBudgetReport) {
      lines.push('');
      lines.push('> [!NOTE]');
      lines.push(`> **Token Budget Accounting**: ~${totalEstimatedTokens} / ${maxTokens} tokens compiled across 5 tiers.`);
    }

    if (processedTiers.global) {
      lines.push('');
      lines.push('## 🌐 Tier 1: Global Context');
      lines.push(processedTiers.global);
    }

    if (processedTiers.project) {
      lines.push('');
      lines.push('## 📁 Tier 2: Project Context');
      lines.push(processedTiers.project);
    }

    if (processedTiers.task) {
      lines.push('');
      lines.push('## 🎯 Tier 3: Task Context');
      lines.push(processedTiers.task);
    }

    if (processedTiers.session) {
      lines.push('');
      lines.push('## 💬 Tier 4: Session Context');
      lines.push(processedTiers.session);
    }

    if (processedTiers.working) {
      lines.push('');
      lines.push('## ⚡ Tier 5: Working Context');
      lines.push(processedTiers.working);
    }

    compiledPrompt = lines.join('\n');
  }

  return {
    compiledPrompt,
    totalEstimatedTokens,
    maxTokens,
    format,
    tokenBreakdown,
    metadata: {
      compiledAt: new Date().toISOString(),
      engine: 'TidyAgent Context Compiler',
      version: '1.6.0'
    }
  };
}

module.exports = {
  TIER_NAMES,
  DEFAULT_TIER_PERCENTAGES,
  estimateTokenCount,
  truncateToTokenBudget,
  compileContext
};
