/**
 * Tidy MCP — Model Context Protocol (MCP) Prompts Protocol
 * Powers fast slash commands (/brief, /extract, /firewall, /doctor, /search, /hygiene)
 *
 * @module @tidy/mcp/modules/prompts
 */

const core = require('@tidy/core');
const {
  generateTaskBrief,
  runSystemDoctor,
  searchHybridKnowledge,
  checkContextualFirewall,
  auditStorageHygiene
} = core;

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

// 2. Atomic Knowledge Item Extractor (/extract)
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

// 3. Contextual Domain Firewall (/firewall)
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

// 4. System Health Doctor (/doctor)
promptHandlers.set('doctor', (args = {}) => {
  const doc = runSystemDoctor();
  return {
    description: 'Tidy Brain Health Diagnostics',
    messages: [
      { role: 'user', content: { type: 'text', text: doc.markdownReport } }
    ]
  };
});

// 5. Hybrid Search (/search)
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

// 6. Storage Hygiene (/hygiene)
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
