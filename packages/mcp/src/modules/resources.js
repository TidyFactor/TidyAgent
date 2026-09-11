/**
 * Tidy MCP — Live Dynamic Resources
 *
 * @module @tidy/mcp/modules/resources
 */

const core = require('@tidy/core');
const { office } = require('./office-tools');

const {
  getUserProfile,
  listTasks,
  listConfig,
  getGovernanceRules,
  runSystemDoctor,
  auditStorageHygiene,
  getDb
} = core;

const resourcesList = [
  {
    uri: 'tidy://profile',
    name: 'Current User & Assistant Profile',
    description: 'Ring 0 sovereign persona definition including name, role, language, and core preferences.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://context/current',
    name: 'Active Context Ring',
    description: 'Current active domain, working directory, and isolated memory boundaries.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://tasks/pending',
    name: 'Pending Tasks Backlog',
    description: 'Uncompleted tasks currently tracked in SQLite SSOT.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://config',
    name: 'System Configuration Provider',
    description: 'Live snapshot of all system-wide key-value configurations stored in SQLite SSOT.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://govern',
    name: 'Active Governance & Firewall Rules',
    description: 'Current runtime domain isolation rules, memory decay policies, and firewall configurations.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://brain/doctor',
    name: 'System Doctor Diagnostics',
    description: 'Live full diagnostic report of SQLite SSOT, WAL mode, 4-tier knowledge base, and storage footprint.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://brain/taxonomy',
    name: '4-Tier Knowledge Base Taxonomy',
    description: 'Index of global, tech, project, and session knowledge items in ~/.gemini/knowledge/.',
    mimeType: 'application/json'
  },
  {
    uri: 'tidy://brain/hygiene',
    name: 'Storage Hygiene Status',
    description: 'Live storage audit breakdown and cleanup candidates.',
    mimeType: 'application/json'
  },
  ...(office ? [
    {
      uri: 'tidy://office/cashflow',
      name: 'Real-time Cashflow Ledger',
      description: 'Real-time cashflow metrics including total billed, collected, outstanding, and overdue receivables.',
      mimeType: 'application/json'
    }
  ] : [])
];

const resourceHandlers = new Map();

resourceHandlers.set('tidy://profile', (rawUri) => {
  const profile = getUserProfile();
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(profile, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://brain/doctor', (rawUri) => {
  const doc = runSystemDoctor();
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(doc, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://brain/taxonomy', (rawUri) => {
  const doc = runSystemDoctor();
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(doc.taxonomy, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://brain/hygiene', (rawUri) => {
  const hygiene = auditStorageHygiene({ dryRun: true });
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(hygiene, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://context/current', (rawUri) => {
  const db = getDb();
  const activeCtx = db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(activeCtx || { message: 'No active context found' }, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://tasks/pending', (rawUri) => {
  const tasks = listTasks({ status: 'pending' });
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(tasks, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://config', (rawUri) => {
  const configs = listConfig();
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(configs, null, 2)
    }]
  };
});

resourceHandlers.set('tidy://govern', (rawUri) => {
  const rules = getGovernanceRules();
  return {
    contents: [{
      uri: rawUri,
      mimeType: 'application/json',
      text: JSON.stringify(rules, null, 2)
    }]
  };
});

if (office) {
  resourceHandlers.set('tidy://office/cashflow', (rawUri) => {
    const summary = office.getCashflowSummary();
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(summary, null, 2)
      }]
    };
  });
}

function handleResourceRead(rawUri) {
  const uri = rawUri.trim();
  const handler = resourceHandlers.get(uri);
  if (!handler) {
    throw new Error(`Resource not found: ${rawUri}`);
  }
  return handler(rawUri);
}

module.exports = {
  resourcesList,
  resourceHandlers,
  handleResourceRead
};
