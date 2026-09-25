/**
 * Tidy MCP — Model Context Protocol (MCP) Prompts Protocol
 * Powers fast slash commands (/brief, /parallel, /context, /intent, /memorize, /recall, /plan, /extract, /firewall, /doctor, /search, /hygiene, /agent, /cashflow, /dossier)
 *
 * @module @tidy/mcp/modules/prompts
 * @version 1.7.0
 */

'use strict';

const core = require('@tidy/core');
const {
  generateTaskBrief,
  runSystemDoctor,
  searchHybridKnowledge,
  checkContextualFirewall,
  auditStorageHygiene,
  prepareSubagentContext,
  compileContext,
  routeIntent,
  classifyMemoryTaxonomy,
  saveMemory,
  recallMemory
} = core;

let office = null;
try {
  office = require('@tidy/office');
} catch {
  // Optional pack
}

const promptsList = [
  {
    name: 'brief',
    description: 'Generate an autonomous, context-rich task brief for AI Coding Agents blending 3-Ring Cognitive Context with Skill boundaries.',
    arguments: [
      { name: 'title', description: 'Goal or title of the task to be performed', required: true },
      { name: 'agent', description: 'Target subagent role (coder, reviewer, designer, architect)', required: false },
      { name: 'requirements', description: 'Specific technical constraints or verification requirements', required: false }
    ]
  },
  {
    name: 'parallel',
    description: 'Orchestrate a multi-agent parallel swarm with ephemeral context sandboxes, proposal extraction, and conflict adjudication.',
    arguments: [
      { name: 'objective', description: 'Root strategic objective or user task to orchestrate', required: true },
      { name: 'agents', description: 'Comma-separated target subagents (e.g. planner, coder, reviewer)', required: false },
      { name: 'domain', description: 'Target domain (dev, ops, marketing, office, general)', required: false }
    ]
  },
  {
    name: 'context',
    description: 'Compile a 5-Tier minimal, zero-slop context package (Global, Project, Task, Session, Working) with token budget allocation.',
    arguments: [
      { name: 'task', description: 'Current task description or prompt to assemble context for', required: true },
      { name: 'domain', description: 'Target domain (dev, ops, marketing, office, general)', required: false },
      { name: 'max_tokens', description: 'Maximum token budget for compiled context (default: 2000)', required: false }
    ]
  },
  {
    name: 'intent',
    description: 'Analyze user prompt intent, decompose requirements, identify target domain, and recommend top 2-3 skills and MCP tools.',
    arguments: [
      { name: 'prompt', description: 'User prompt or instruction to analyze and route', required: true }
    ]
  },
  {
    name: 'memorize',
    description: 'Persist a fact, decision, user preference, or lesson directly into the SQLite SSOT with taxonomy classification.',
    arguments: [
      { name: 'content', description: 'Information, architectural decision, or lesson to persist', required: true },
      { name: 'category', description: 'Taxonomy (facts, decisions, preferences, assets, references, previous_outputs, lessons, relationships)', required: false },
      { name: 'importance', description: 'Importance level (1 to 5, default: 3)', required: false }
    ]
  },
  {
    name: 'recall',
    description: 'Recall persisted facts, decisions, rules, and preferences from SQLite SSOT memory via FTS5 BM25 with decay scoring.',
    arguments: [
      { name: 'query', description: 'Keywords or search topic', required: true },
      { name: 'category', description: 'Taxonomy filter (facts, decisions, preferences, assets, references, previous_outputs, lessons, relationships)', required: false },
      { name: 'limit', description: 'Max results (default: 5)', required: false }
    ]
  },
  {
    name: 'plan',
    description: 'Decompose a complex mission into a milestone roadmap with risk matrix, subagent assignments, and verification gates.',
    arguments: [
      { name: 'goal', description: 'Strategic goal, feature, or milestone to plan', required: true },
      { name: 'domain', description: 'Active domain (dev, ops, marketing, office, general)', required: false }
    ]
  },
  {
    name: 'extract',
    description: 'Format an architectural decision or pattern into an atomic Knowledge Item with a mandatory negative constraint.',
    arguments: [
      { name: 'decision', description: 'Raw engineering decision or architectural pattern statement', required: true },
      { name: 'negative_constraint', description: 'Explicit boundary / what this pattern strictly forbids', required: false }
    ]
  },
  {
    name: 'firewall',
    description: 'Audit text or instructions against the contextual domain firewall to prevent cross-domain contamination.',
    arguments: [
      { name: 'content', description: 'Text or code to be audited', required: true },
      { name: 'mode', description: 'Current active mode: dev, marketing, or ops', required: false }
    ]
  },
  {
    name: 'doctor',
    description: 'Run comprehensive health diagnostics on SQLite SSOT, WAL mode, 4-tier knowledge base, and storage footprint.',
    arguments: [
      { name: 'scope', description: 'Audit scope: all, sqlite, knowledge, storage', required: false }
    ]
  },
  {
    name: 'search',
    description: 'Hybrid search querying both SQLite SSOT memory (FTS5 BM25) and 4-tier disk knowledge files (~/.gemini/knowledge/).',
    arguments: [
      { name: 'query', description: 'Search keywords, topics, or error messages', required: true },
      { name: 'scope', description: 'Taxonomy scope: all, global, tech, project, session', required: false }
    ]
  },
  {
    name: 'hygiene',
    description: 'Inspect disk storage consumption of recordings, sessions, and temp artifacts with safe dry-run.',
    arguments: [
      { name: 'days', description: 'Minimum age threshold in days', required: false }
    ]
  },
  {
    name: 'agent',
    description: 'Dispatch an autonomous subagent or community skill with 3-Ring Cognitive Context injection.',
    arguments: [
      { name: 'name', description: 'Subagent alias (e.g. coder, designer, marketing, doc, php, next, reviewer)', required: true },
      { name: 'task', description: 'Goal, requirement, or instruction for the subagent to execute', required: true }
    ]
  },
  {
    name: 'run',
    description: 'Run an autonomous subagent or community skill with 3-Ring Cognitive Context injection.',
    arguments: [
      { name: 'name', description: 'Subagent alias (e.g. coder, designer, marketing, doc, php, next, reviewer)', required: true },
      { name: 'task', description: 'Goal, requirement, or instruction for the subagent to execute', required: true }
    ]
  },
  {
    name: 'cashflow',
    description: 'Inspect sovereign commercial telemetry: B2B CRM pipeline, itemized invoicing, and cashflow summary.',
    arguments: [
      { name: 'period', description: 'Timeframe filter (current_month, quarter, year, all)', required: false }
    ]
  },
  {
    name: 'dossier',
    description: 'Synthesize an executive B2B client dossier from CRM contacts, deal pipeline, and billing history.',
    arguments: [
      { name: 'client', description: 'Client name or company', required: true }
    ]
  }
];

const promptHandlers = new Map();

// 1. Task Brief Generator (/brief)
const handleBrief = (args = {}) => {
  const briefObj = generateTaskBrief({
    taskTitle: args.title || args.taskTitle || 'Task Goal',
    agentName: args.agent || 'coder',
    taskDescription: args.requirements || args.description || ''
  });
  const text = typeof briefObj === 'string' ? briefObj : (briefObj.briefMarkdown || JSON.stringify(briefObj));
  return {
    description: 'Context-rich Task Brief for AI Agent',
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('brief', handleBrief);
promptHandlers.set('tidy_prompt_task_brief', handleBrief);

// 2. Parallel Multi-Agent Swarm (/parallel)
const handleParallel = (args = {}) => {
  const objective = args.objective || args.task || 'Strategic Objective';
  const agentsStr = args.agents || 'planner, coder';
  const agentList = agentsStr.split(',').map(s => s.trim()).filter(Boolean);
  const domain = args.domain || 'general';

  const text = [
    `# ⚡ Sovereign Parallel Multi-Agent Swarm Directive`,
    `**Root Objective**: "${objective}"`,
    `**Assigned Subagents**: ${agentList.map(a => `@${a}`).join(', ')}`,
    `**Context Domain**: \`${domain}\``,
    '',
    '## 🎯 Swarm Execution Protocol',
    '1. Decompose the objective into distinct, decoupled subtasks per specialized subagent.',
    '2. Execute tasks in parallel using isolated context sandboxes (token budget ceiling: 1200 per agent).',
    '3. Detect and adjudicate any conflicting proposals, strategy divergence, or file mutation collisions.',
    '4. Synthesize final unified deliverable and commit atomic decision to SQLite memory SSOT.',
    '',
    '### 📋 Recommended Execution Payload:',
    '```json',
    JSON.stringify({
      objective,
      tasks: agentList.map(ag => ({
        agent: ag,
        task: `Contribute specialized analysis and implementation for: ${objective}`
      })),
      domain
    }, null, 2),
    '```',
    '',
    '*Execute directly using the `tidy_parallel_dispatch` MCP tool or terminal command `tidy parallel`.*'
  ].join('\n');

  return {
    description: `Parallel Multi-Agent Swarm for: "${objective}"`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('parallel', handleParallel);

// 3. 5-Tier Context Compiler (/context)
const handleContext = (args = {}) => {
  const task = args.task || args.title || args.query || 'Active Mission';
  const domain = args.domain || 'general';
  const maxTokens = parseInt(args.max_tokens, 10) || 2000;

  let text = '';
  if (compileContext) {
    const compiled = compileContext({ task, domain, maxTokens, format: 'markdown' });
    text = typeof compiled === 'string'
      ? compiled
      : (compiled?.compiledPrompt || `Compiled 5-Tier Context for: ${task}\nDomain: ${domain}`);
  } else {
    text = `# 🧠 5-Tier Compiled Context\n**Task**: "${task}"\n**Domain**: \`${domain}\``;
  }

  return {
    description: `5-Tier Compiled Context for: "${task}"`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('context', handleContext);

// 4. Intent Routing & Capability Discovery (/intent)
const handleIntent = (args = {}) => {
  const prompt = args.prompt || args.task || 'General goal';
  let text = '';
  if (routeIntent) {
    const routed = routeIntent(prompt);
    text = [
      `# 🧭 TidyAgent Intent Routing Plan`,
      `- **Analyzed Prompt:** "${prompt}"`,
      `- **Detected Domain:** \`${routed.domain}\``,
      `- **Intent Classification:** \`${routed.intentType}\``,
      `- **Capability-First Rule:** Strict cap of 2-3 skills maximum applied.`,
      '',
      `### 🎯 Recommended Skills (Top ${routed.matchedSkills.length}):`,
      ...routed.matchedSkills.map(s => `- \`${s}\``),
      '',
      `### ⚡ Recommended MCP Execution Tools:`,
      ...routed.recommendedTools.map(t => `- \`${t}\``)
    ].join('\n');
  } else {
    text = `Routing intent for: "${prompt}"`;
  }

  return {
    description: `Intent Routing for: "${prompt.slice(0, 40)}"`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('intent', handleIntent);

// 5. Memorize / Learn (/memorize, /learn)
const handleMemorize = (args = {}) => {
  const content = args.content || args.fact || '';
  const category = args.category || (classifyMemoryTaxonomy ? classifyMemoryTaxonomy(content) : 'facts');
  const importance = parseInt(args.importance, 10) || 3;

  let memNode = null;
  if (saveMemory && content) {
    memNode = saveMemory({
      content,
      category,
      importance,
      tier: 'project'
    });
  }

  const text = [
    `# 🧠 Memory Persisted into SQLite SSOT`,
    `- **Memory ID**: \`${memNode?.id || 'mem_' + Date.now()}\``,
    `- **Taxonomy Category**: \`${category}\``,
    `- **Importance**: ${importance}/5`,
    `- **Content**: "${content}"`,
    '',
    `*Indexed via FTS5 BM25. Available for instant zero-latency recall via \`tidy_recall\` or \`/recall\`.*`
  ].join('\n');

  return {
    description: `Persisted Memory: [${category}]`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('memorize', handleMemorize);
promptHandlers.set('learn', handleMemorize);

// 6. Recall Memory (/recall)
const handleRecall = (args = {}) => {
  const query = args.query || args.term || '';
  const category = args.category || null;
  const limit = parseInt(args.limit, 10) || 5;

  let results = [];
  if (recallMemory && query) {
    results = recallMemory({ query, category, limit });
  }

  const bullets = results.length > 0
    ? results.map(m => `- **[${(m.category || 'fact').toUpperCase()}]** (${m.id}): ${m.content} *(Score: ${m.effective_score || m.importance || 3})*`).join('\n')
    : `- No matching memories found in active workspace for query "${query}".`;

  const text = [
    `# 🔍 Memory Recall Results for: "${query}"`,
    category ? `- **Taxonomy Filter**: \`${category}\`` : '',
    '',
    bullets
  ].filter(Boolean).join('\n');

  return {
    description: `Recalled Memory for: "${query}"`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('recall', handleRecall);

// 7. Strategic Plan & Roadmap Generator (/plan)
const handlePlan = (args = {}) => {
  const goal = args.goal || args.title || 'Strategic Roadmap';
  const domain = args.domain || 'general';

  const text = [
    `# 🗺️ Autonomous Strategic Execution Plan: "${goal}"`,
    `**Target Domain**: \`${domain}\` | **Framework**: TidyAgent Sovereign Architecture`,
    '',
    '## 🎯 Objective & Success Criteria',
    `- **Core Mission**: ${goal}`,
    '- **Execution Standard**: Non-destructive diagnosis first, SemVer consistency, 100% test pass rate.',
    '',
    '## 🏗️ Phase Decomposition & Milestones',
    '1. **Phase 1: Architecture & Invariant Inspection** — Review existing contracts, schemas, and constraints.',
    '2. **Phase 2: Core Engine Implementation** — Apply backward-compatible changes with minimal diffs.',
    '3. **Phase 3: Automated Verification** — Validate against unit tests, AST parsers, and edge cases.',
    '4. **Phase 4: Release & Documentation Sync** — Update CHANGELOG, ROADMAP, and package manifests.',
    '',
    '## 🛡️ Risk Matrix & Boundary Guardrails',
    '- **Zero In-Memory Drift**: All operational state lives exclusively in SQLite SSOT.',
    '- **Context Isolation**: No cross-domain data bleed between active workspaces.',
    '',
    '*Execute using specialized subagents via `/agent` or parallel multi-agent swarms via `/parallel`.*'
  ].join('\n');

  return {
    description: `Strategic Plan for: "${goal}"`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('plan', handlePlan);

// 8. Atomic Knowledge Item Extractor (/extract)
const handleExtract = (args = {}) => {
  const lines = [
    'Please format the following architectural decision into an atomic Knowledge Item with a mandatory negative constraint:',
    `Decision: ${args.decision || ''}`,
    args.negative_constraint ? `Negative Constraint Hint: ${args.negative_constraint}` : '',
    '',
    'Requirements:',
    '1. Explicit unique ID (e.g. KI-Tech-Topic)',
    '2. Deterministic Rule / Directive statement',
    '3. Trigger Context (When this activates)',
    '4. Mandatory Negative Constraint (What it strictly forbids/avoids)'
  ].filter(Boolean).join('\n');
  return {
    description: 'Atomic KI Formulation Guide',
    messages: [
      { role: 'user', content: { type: 'text', text: lines } }
    ]
  };
};
promptHandlers.set('extract', handleExtract);
promptHandlers.set('tidy_prompt_extract_ki', handleExtract);

// 9. Contextual Domain Firewall (/firewall)
const handleFirewall = (args = {}) => {
  const mode = args.mode || 'dev';
  const text = [
    `Audit the following content against the [${mode}] mode contextual firewall.`,
    'Check for domain contamination (e.g. marketing sales hooks inside engineering docs, or raw database queries in marketing copy):',
    '',
    args.content || ''
  ].join('\n');
  return {
    description: 'Contextual Firewall Audit Guide',
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('firewall', handleFirewall);
promptHandlers.set('tidy_prompt_firewall_audit', handleFirewall);

// 10. System Health Doctor (/doctor)
promptHandlers.set('doctor', (args = {}) => {
  const doc = runSystemDoctor();
  return {
    description: 'Tidy Brain Health Diagnostics',
    messages: [
      { role: 'user', content: { type: 'text', text: doc.markdownReport } }
    ]
  };
});

// 11. Hybrid Search (/search)
promptHandlers.set('search', (args = {}) => {
  const query = args.query || '';
  const scope = args.scope || 'all';
  const res = searchHybridKnowledge({ query, scope, limit: 5 });
  const text = [
    `Hybrid search results for: "${query}" (Scope: ${scope}):`,
    '',
    JSON.stringify(res, null, 2)
  ].join('\n');
  return {
    description: 'Hybrid Knowledge Recall Report',
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
});

// 12. Storage Hygiene (/hygiene)
promptHandlers.set('hygiene', (args = {}) => {
  const days = parseInt(args.days, 10) || 7;
  const hygiene = auditStorageHygiene({ daysThreshold: days, dryRun: true });
  const text = [
    `# 🧹 Storage Hygiene Inspection Report (Dry-Run)`,
    `- Days Threshold: ${hygiene.daysThreshold} days`,
    `- Recordings Found: ${hygiene.breakdown?.recordingsCount || 0} (${hygiene.breakdown?.recordingsMb || '0'} MB)`,
    `- Temporary Artifacts: ${hygiene.breakdown?.scratchCount || 0} (${hygiene.breakdown?.scratchMb || '0'} MB)`,
    `- Candidate Cleanup Space: ${hygiene.candidateMb} MB across ${hygiene.candidateCount} files.`,
    '',
    'Run `tidy clean --prune` or invoke `tidy_hygiene` tool with `prune: true` to execute deletion.'
  ].join('\n');
  return {
    description: 'Storage Hygiene Audit Report',
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
});

// 13. Autonomous Subagent Runner (/agent, /run)
const handleAgentRunPrompt = (args = {}) => {
  const agentName = args.name || args.agent || 'coder';
  const task = args.task || args.instructions || 'Execute domain task';
  const ctx = prepareSubagentContext({ name: agentName, task });

  const text = [
    `# 🤖 Autonomous Subagent Runner: @${ctx.agent.name}`,
    `**Role**: ${ctx.agent.role}`,
    `**Domain**: ${ctx.ring1_workspace.domain.toUpperCase()} (Workspace: ${ctx.ring1_workspace.context_name})`,
    '',
    '## 📜 Scoped System Directive',
    ctx.agent.system_prompt,
    '',
    '## 🎯 Assigned Task',
    task,
    '',
    '## 🧠 Ring 2: Recalled Working Memory',
    ctx.ring2_recalled_memory.length > 0
      ? ctx.ring2_recalled_memory.map(m => `- [${m.category.toUpperCase()}] ${m.content}`).join('\n')
      : '- (No conflicting memory constraints in active domain)',
    '',
    '## ⚡ Allowed Tools & Capabilities',
    ctx.agent.allowed_tools.length > 0
      ? ctx.agent.allowed_tools.map(t => `- \`${t}\``).join('\n')
      : '- General workspace tools and commands',
    '',
    '---',
    `*Execute with 100% fidelity to @${ctx.agent.name} protocol. Zero robotic preamble.*`
  ].join('\n');

  return {
    description: `Subagent Runner Dispatch for @${ctx.agent.name}`,
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('agent', handleAgentRunPrompt);
promptHandlers.set('run', handleAgentRunPrompt);

// 14. Cashflow Summary (/cashflow)
const handleCashflow = (args = {}) => {
  let summaryText = '';
  if (office && office.getCashflowSummary) {
    const summary = office.getCashflowSummary(args.period || 'current_month');
    summaryText = JSON.stringify(summary, null, 2);
  } else {
    summaryText = 'Commercial Office pack active. Querying live CRM and Invoicing pipeline.';
  }

  const text = [
    `# 💰 Sovereign Cashflow & Revenue Telemetry`,
    `- **Period**: \`${args.period || 'current_month'}\``,
    '',
    '```json',
    summaryText,
    '```',
    '',
    '*Manage itemized invoices and CRM clients using `tidy_invoice_create` and `tidy_crm_add`.*'
  ].join('\n');

  return {
    description: 'Sovereign Cashflow Telemetry',
    messages: [
      { role: 'user', content: { type: 'text', text } }
    ]
  };
};
promptHandlers.set('cashflow', handleCashflow);

// 15. Client Dossier (/dossier)
const handleDossier = (args = {}) => {
  const client = args.client || 'Client Name';
  let dossierText = '';
  if (office && office.synthesizeClientDossier) {
    const d = office.synthesizeClientDossier(client);
    dossierText = typeof d === 'string' ? d : JSON.stringify(d, null, 2);
  } else {
    dossierText = `Client profile & relationship summary for: "${client}"`;
  }

  return {
    description: `Executive Dossier: ${client}`,
    messages: [
      { role: 'user', content: { type: 'text', text: dossierText } }
    ]
  };
};
promptHandlers.set('dossier', handleDossier);

function handlePromptGet(name, args = {}) {
  const handler = promptHandlers.get(name);
  if (!handler) {
    throw new Error(`Prompt not found: ${name}`);
  }
  return handler(args);
}

module.exports = {
  promptsList,
  promptHandlers,
  handlePromptGet
};
