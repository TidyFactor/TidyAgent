#!/usr/bin/env node
/**
 * Tidy Ecosystem — Stdio Model Context Protocol (MCP) Server
 * High-performance JSON-RPC 2.0 server exposing SQLite memory, context rings, subagents, and micro-apps.
 *
 * @module @tidy/mcp/server
 * @version 1.4.2
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
 */


const readline = require('readline');

let core;
try {
  core = require('@tidy/core');
} catch {
  try {
    core = require('../../core/src/index');
  } catch {
    core = require('../../../packages/core/src/index');
  }
}

const {
  getDb,
  getStats,
  resolveDbPath,
  saveMemory,
  recallMemory,
  listMemories,
  forgetMemory,
  listSubagents,
  prepareSubagentContext,
  addTask,
  listTasks,
  completeTask,
  addSnippet,
  addJournalEntry,
  listRegisteredSkills,
  generateTaskBrief,
  exportToMarkdown,
  exportToJson,
  pruneDecayedMemories,
  getConfig,
  setConfig,
  listConfig,
  getUserProfile,
  updateUserProfile,
  getGovernanceRules,
  setGovernanceRule
} = core;

// Dynamically resolve @tidy/office domain pack if present
let office = null;
try {
  office = require('@tidy/office');
} catch {
  try {
    office = require('../../office/src/index');
  } catch {
    office = null;
  }
}

const SERVER_INFO = {
  name: 'tidy-mcp',
  version: '1.4.3'
};

const TOOLS = [
  {
    name: 'tidy_recall',
    description: 'Recall memories, decisions, facts, and patterns from Tidy SQLite SSOT via FTS5 BM25 search.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords or phrases in Arabic or English' },
        category: { type: 'string', enum: ['fact', 'decision', 'pattern', 'preference', 'task', 'rule'], description: 'Optional category filter' },
        tier: { type: 'string', enum: ['core', 'project', 'session', 'ephemeral'], description: 'Optional tier filter' },
        limit: { type: 'integer', default: 5, description: 'Maximum number of results to return' }
      }
    }
  },
  {
    name: 'tidy_memorize',
    description: 'Save a new fact, architectural decision, pattern, or rule into Tidy SQLite persistent storage.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The text content to persist' },
        summary: { type: 'string', description: 'Short summary or title (optional)' },
        tier: { type: 'string', enum: ['core', 'project', 'session', 'ephemeral'], default: 'project' },
        category: { type: 'string', enum: ['fact', 'decision', 'pattern', 'preference', 'task', 'rule'], default: 'fact' },
        importance: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Importance level (1-5)' }
      },
      required: ['content']
    }
  },
  {
    name: 'tidy_get_context',
    description: 'Read the active working context, domain firewall mode, and sovereign profile.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'tidy_switch_context',
    description: 'Switch the active workspace context and domain mode (dev, marketing, personal, general).',
    inputSchema: {
      type: 'object',
      properties: {
        context_id: { type: 'string', description: 'Context ID (e.g. ctx_dev, ctx_marketing, ctx_general, ctx_personal)' }
      },
      required: ['context_id']
    }
  },
  {
    name: 'tidy_task_add',
    description: 'Create a new task in Tidy local tasks app with optional domain tag and assigned agent.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Detailed description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        domain: { type: 'string', enum: ['general', 'tech', 'marketing', 'design', 'docs', 'ops'], default: 'general' },
        assigned_agent: { type: 'string', description: 'Target agent or skill alias (e.g. coder, marketing, design, doc)' }
      },
      required: ['title']
    }
  },
  {
    name: 'tidy_task_list',
    description: 'List tasks from Tidy local tasks app with status and domain filters.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        domain: { type: 'string', enum: ['general', 'tech', 'marketing', 'design', 'docs', 'ops'] }
      }
    }
  },
  {
    name: 'tidy_exec_subagent',
    description: 'Delegate a specific task to a specialized Tidy subagent or community skill (@marketing, @design, @coder, @doc, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        agent_name: { type: 'string', description: 'Subagent name or skill alias (e.g. planner, coder, marketing, design, doc)' },
        task: { type: 'string', description: 'Task prompt or instruction' }
      },
      required: ['agent_name', 'task']
    }
  },
  {
    name: 'tidy_list_skills',
    description: 'List registered community skills and available subagents under Tidy management.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'tidy_synthesize_brief',
    description: 'Generate a self-contained, context-rich Task Brief for an AI agent with 3-Ring Context and verification gates.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Optional task ID from app_tasks' },
        title: { type: 'string', description: 'Task title or objective' },
        description: { type: 'string', description: 'Detailed mission or specification' },
        agent_name: { type: 'string', default: 'coder', description: 'Target subagent or skill (e.g. marketing, design, doc, coder)' },
        domain: { type: 'string', enum: ['general', 'tech', 'marketing', 'design', 'docs', 'ops'], default: 'general' }
      }
    }
  },
  {
    name: 'tidy_db_stats',
    description: 'Get SQLite database statistics, record counts, and storage health.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  ...(office ? [
    {
      name: 'tidy_crm_list',
      description: 'List B2B CRM clients, pipelines, and contact details from Tidy SQLite SSOT.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['lead', 'prospect', 'active', 'inactive', 'archived'], description: 'Filter by client status' },
          search: { type: 'string', description: 'Search term for name, company, or email' },
          limit: { type: 'integer', default: 20 }
        }
      }
    },
    {
      name: 'tidy_crm_add',
      description: 'Register a new B2B client in CRM pipeline with company details and budget.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Client or Company Name' },
          company: { type: 'string', description: 'Company name' },
          email: { type: 'string', description: 'Contact email' },
          phone: { type: 'string', description: 'Contact phone' },
          status: { type: 'string', enum: ['lead', 'prospect', 'active', 'inactive'], default: 'lead' },
          budget: { type: 'number', description: 'Deal value or budget' },
          notes: { type: 'string', description: 'Initial notes or requirements' }
        },
        required: ['name']
      }
    },
    {
      name: 'tidy_invoice_list',
      description: 'List invoices with payment status, client details, due dates, and totals.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled'] },
          client_id: { type: 'string', description: 'Filter by client ID' },
          limit: { type: 'integer', default: 20 }
        }
      }
    },
    {
      name: 'tidy_invoice_create',
      description: 'Create an official itemized invoice with automatic subtotal, tax calculation, and discounts.',
      inputSchema: {
        type: 'object',
        properties: {
          client_id: { type: 'string', description: 'Target Client ID' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                qty: { type: 'number', default: 1 },
                unitPrice: { type: 'number' },
                discountPct: { type: 'number', default: 0 }
              },
              required: ['name', 'unitPrice']
            },
            description: 'Itemized invoice line items'
          },
          tax_rate: { type: 'number', default: 0, description: 'Tax percentage (e.g. 15 for 15%)' },
          discount_amount: { type: 'number', default: 0, description: 'Flat discount amount' },
          due_date: { type: 'string', description: 'YYYY-MM-DD due date' },
          notes: { type: 'string', description: 'Customer notes or terms' }
        },
        required: ['client_id', 'items']
      }
    },
    {
      name: 'tidy_cashflow_summary',
      description: 'Get live financial telemetry including collected revenue, operational expenses, net profit, margin, and pending receivables.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'tidy_client_dossier',
      description: 'Compile an evidence-based executive dossier for a client combining profile, financial ledger, proposals, tasks, and institutional memory.',
      inputSchema: {
        type: 'object',
        properties: {
          client_id: { type: 'string', description: 'The client ID to compile dossier for' }
        },
        required: ['client_id']
      }
    }
  ] : []),
  {
    name: 'tidy_config_get',
    description: 'Get a configuration setting or system variable from Tidy SQLite SSOT.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Configuration key name' }
      },
      required: ['key']
    }
  },
  {
    name: 'tidy_config_set',
    description: 'Set or update a configuration setting or system variable in Tidy SQLite SSOT.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Configuration key name' },
        value: { type: 'string', description: 'Value to assign' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'tidy_profile_update',
    description: 'Update user profile, assistant persona, display role, theme, currency, and preferences.',
    inputSchema: {
      type: 'object',
      properties: {
        userName: { type: 'string', description: 'User display name' },
        assistantName: { type: 'string', description: 'Assistant persona name' },
        role: { type: 'string', description: 'User title or role' },
        locale: { type: 'string', enum: ['ar', 'en'], description: 'Primary language' },
        theme: { type: 'string', enum: ['dark', 'light', 'system'], description: 'UI Theme' },
        currency: { type: 'string', description: 'Default currency code (e.g. USD, EGP, SAR)' },
        timeFormat: { type: 'string', enum: ['12h', '24h'], description: 'Time display format' }
      }
    }
  },
  {
    name: 'tidy_govern_rules',
    description: 'Inspect or update system governance rules, context firewall policies, and memory retention thresholds.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set'], default: 'get', description: 'Action to perform' },
        key: { type: 'string', description: 'Governance rule key if setting' },
        value: { type: 'string', description: 'Governance rule value if setting' }
      }
    }
  }
];

const RESOURCES = [
  {
    uri: 'tidy://profile',
    name: 'Tidy Sovereign User Profile',
    mimeType: 'application/json',
    description: 'Current user profile, language, and operating tone'
  },
  {
    uri: 'tidy://config',
    name: 'Tidy System Configuration',
    mimeType: 'application/json',
    description: 'Central system variables, engine metadata, and application configuration'
  },
  {
    uri: 'tidy://govern',
    name: 'Tidy Governance Rules & Firewall Policies',
    mimeType: 'application/json',
    description: 'Active governance policies, memory retention limits, and domain firewall rules'
  },
  {
    uri: 'tidy://context/current',
    name: 'Tidy Active Working Context',
    mimeType: 'application/json',
    description: 'Current active project context, domain mode, and firewall constraints'
  },
  {
    uri: 'tidy://tasks/pending',
    name: 'Tidy Pending Tasks',
    mimeType: 'application/json',
    description: 'List of currently pending tasks'
  },
  ...(office ? [
    {
      uri: 'tidy://office/cashflow',
      name: 'Tidy Financial Cashflow Statement',
      mimeType: 'application/json',
      description: 'Current real-time financial P&L, revenue, expenses, and receivables'
    }
  ] : [])
];

function handleToolCall(rawName, args) {
  const db = getDb();
  // Normalize tool name for full backward-compatibility
  const name = rawName.replace(/^tidy_/, 'tidy_');

  switch (name) {
    case 'tidy_recall': {
      const results = recallMemory({
        query: args?.query,
        category: args?.category,
        tier: args?.tier,
        limit: args?.limit || 5
      });
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }

    case 'tidy_memorize': {
      const saved = saveMemory({
        content: args.content,
        summary: args.summary,
        tier: args.tier || 'project',
        category: args.category || 'fact',
        importance: args.importance || 3
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, memory: saved }, null, 2) }] };
    }

    case 'tidy_get_context': {
      const activeCtx = db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();
      const profile = db.prepare("SELECT * FROM user_profile WHERE id = 'primary'").get();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            profile: {
              user_name: profile.user_name,
              assistant_name: profile.assistant_name,
              locale: profile.locale,
              tone: profile.tone
            },
            active_context: activeCtx
          }, null, 2)
        }]
      };
    }

    case 'tidy_switch_context': {
      const ctxId = args.context_id;
      const target = db.prepare('SELECT * FROM contexts WHERE id = ?').get(ctxId);
      if (!target) {
        throw new Error(`Context "${ctxId}" not found.`);
      }
      db.prepare('UPDATE contexts SET is_active = 0').run();
      db.prepare('UPDATE contexts SET is_active = 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').run(ctxId);
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, switched_to: target }, null, 2) }] };
    }

    case 'tidy_task_add': {
      const t = addTask({
        title: args.title,
        description: args.description || '',
        priority: args.priority || 'medium',
        domain: args.domain || 'general',
        assignedAgent: args.assigned_agent || null
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, task: t }, null, 2) }] };
    }

    case 'tidy_task_list': {
      const tasks = listTasks({ status: args?.status, priority: args?.priority, domain: args?.domain });
      return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
    }

    case 'tidy_exec_subagent': {
      const subContext = prepareSubagentContext({
        name: args.agent_name,
        task: args.task
      });
      return { content: [{ type: 'text', text: JSON.stringify(subContext, null, 2) }] };
    }

    case 'tidy_list_skills': {
      const skills = listRegisteredSkills ? listRegisteredSkills() : [];
      const agents = listSubagents();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            registered_skills_count: skills.length,
            skills: skills.map(s => ({
              alias: s.alias,
              name: s.name,
              domain: s.domain,
              role: s.role,
              description: s.description
            })),
            available_subagents: agents.map(a => ({
              name: a.name,
              role: a.role,
              description: a.description
            }))
          }, null, 2)
        }]
      };
    }

    case 'tidy_synthesize_brief': {
      const b = generateTaskBrief({
        taskId: args?.task_id,
        taskTitle: args?.title,
        taskDescription: args?.description,
        agentName: args?.agent_name || 'coder',
        domain: args?.domain || 'general'
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            task_title: b.title,
            agent: b.agent,
            domain: b.domain,
            brief_markdown: b.briefMarkdown
          }, null, 2)
        }]
      };
    }

    case 'tidy_db_stats': {
      const stats = getStats();
      return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
    }

    case 'tidy_crm_list': {
      if (!office) throw new Error('The @tidy/office pack is not installed.');
      const clients = office.listClients({
        status: args?.status,
        search: args?.search,
        limit: args?.limit || 20
      });
      return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] };
    }

    case 'tidy_crm_add': {
      if (!office) throw new Error('The @tidy/office pack is not installed.');
      const client = office.addClient({
        name: args.name,
        company: args?.company,
        email: args?.email,
        phone: args?.phone,
        status: args?.status || 'lead',
        budget: args?.budget || 0,
        notes: args?.notes
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, client }, null, 2) }] };
    }

    case 'tidy_invoice_list': {
      if (!office) throw new Error('The @tidy/office pack is not installed.');
      const invoices = office.listInvoices({
        status: args?.status,
        clientId: args?.client_id,
        limit: args?.limit || 20
      });
      return { content: [{ type: 'text', text: JSON.stringify(invoices, null, 2) }] };
    }

    case 'tidy_invoice_create': {
      if (!office) throw new Error('The @tidy/office pack is not installed.');
      const invoice = office.createInvoice({
        clientId: args.client_id,
        items: args.items || [],
        taxRate: args?.tax_rate || 0,
        discountAmount: args?.discount_amount || 0,
        dueDate: args?.due_date,
        notes: args?.notes
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, invoice }, null, 2) }] };
    }

    case 'tidy_cashflow_summary': {
      if (!office) throw new Error('The @tidy/office pack is not installed.');
      const summary = office.getCashflowSummary();
      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }

    case 'tidy_client_dossier': {
      if (!office) throw new Error('The @tidy/office pack is not installed.');
      const dossier = office.compileClientDossier(args.client_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            client_id: args.client_id,
            financials: dossier.financials,
            dossier_markdown: dossier.dossierMarkdown
          }, null, 2)
        }]
      };
    }

    case 'tidy_config_get': {
      const val = getConfig(args.key);
      return { content: [{ type: 'text', text: JSON.stringify({ key: args.key, value: val }, null, 2) }] };
    }

    case 'tidy_config_set': {
      setConfig(args.key, args.value);
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, key: args.key, value: args.value }, null, 2) }] };
    }

    case 'tidy_profile_update': {
      const updated = updateUserProfile(args);
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, profile: updated }, null, 2) }] };
    }

    case 'tidy_govern_rules': {
      if (args?.action === 'set' && args.key) {
        const rules = setGovernanceRule(args.key, args.value);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, rules }, null, 2) }] };
      }
      const rules = getGovernanceRules();
      return { content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }] };
    }

    default:
      throw new Error(`Unknown tool: ${rawName}`);
  }
}

function handleResourceRead(rawUri) {
  const db = getDb();
  const uri = rawUri.replace(/^tidy:\/\//, 'tidy://');

  if (uri === 'tidy://profile') {
    const profile = db.prepare("SELECT * FROM user_profile WHERE id = 'primary'").get();
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(profile, null, 2)
      }]
    };
  }

  if (uri === 'tidy://config') {
    const configs = listConfig();
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(configs, null, 2)
      }]
    };
  }

  if (uri === 'tidy://govern') {
    const rules = getGovernanceRules();
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(rules, null, 2)
      }]
    };
  }

  if (uri === 'tidy://context/current') {
    const activeCtx = db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(activeCtx, null, 2)
      }]
    };
  }

  if (uri === 'tidy://tasks/pending') {
    const tasks = listTasks({ status: 'pending' });
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(tasks, null, 2)
      }]
    };
  }

  if (uri === 'tidy://office/cashflow') {
    if (!office) throw new Error('The @tidy/office pack is not installed.');
    const summary = office.getCashflowSummary();
    return {
      contents: [{
        uri: rawUri,
        mimeType: 'application/json',
        text: JSON.stringify(summary, null, 2)
      }]
    };
  }

  throw new Error(`Resource not found: ${rawUri}`);
}

function startServer() {
  // Ensure database is initialized
  getDb();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(response) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  rl.on('line', (line) => {
    if (!line.trim()) return;

    let req;
    try {
      req = JSON.parse(line);
    } catch (e) {
      return;
    }

    const { id, method, params } = req;

    // Handle JSON-RPC Notifications
    if (id === undefined || id === null) {
      return;
    }

    try {
      switch (method) {
        case 'initialize':
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: SERVER_INFO
            }
          });
          break;

        case 'ping':
          sendResponse({ jsonrpc: '2.0', id, result: {} });
          break;

        case 'tools/list':
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: { tools: TOOLS }
          });
          break;

        case 'tools/call':
          try {
            const toolResult = handleToolCall(params.name, params.arguments);
            sendResponse({ jsonrpc: '2.0', id, result: toolResult });
          } catch (toolErr) {
            sendResponse({
              jsonrpc: '2.0',
              id,
              result: {
                isError: true,
                content: [{ type: 'text', text: `Error: ${toolErr.message}` }]
              }
            });
          }
          break;

        case 'resources/list':
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: { resources: RESOURCES }
          });
          break;

        case 'resources/read':
          try {
            const resResult = handleResourceRead(params.uri);
            sendResponse({ jsonrpc: '2.0', id, result: resResult });
          } catch (resErr) {
            sendResponse({
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: resErr.message }
            });
          }
          break;

        default:
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          });
          break;
      }
    } catch (err) {
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message }
      });
    }
  });

  process.stderr.write(`[tidy-mcp] Stdio MCP Server running with DB: ${resolveDbPath()}\n`);
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer, TOOLS, RESOURCES };
