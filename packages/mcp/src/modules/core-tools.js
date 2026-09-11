/**
 * Tidy MCP — Core Assistant, Memory, Context & Governance Tools
 *
 * @module @tidy/mcp/modules/core-tools
 */

const core = require('@tidy/core');
const {
  recallMemory,
  saveMemory,
  listTasks,
  addTask,
  delegateTask,
  listSubagents,
  listRegisteredSkills,
  generateTaskBrief,
  getDbStats,
  getConfig,
  setConfig,
  updateUserProfile,
  getGovernanceRules,
  setGovernanceRule,
  getDb
} = core;

const coreTools = [
  {
    definition: {
      name: 'tidy_recall',
      description: 'Search personal assistant memory nodes using high-performance SQLite FTS5 BM25 full-text indexing with decay scoring and ring filtering.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keyword or semantic phrase to search' },
          ring: { type: 'integer', minimum: 0, maximum: 2, description: 'Optional context ring filter (0: Profile, 1: Context, 2: Active Working Memory)' },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 5, description: 'Maximum results to return' }
        },
        required: ['query']
      }
    },
    handler: (args) => {
      const results = recallMemory(args.query, {
        ring: args.ring,
        limit: args.limit || 5
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_memorize',
      description: 'Store a permanent fact, decision, preference, snippet, or task outcome into SQLite memory with automatic cognitive decay tiering and FTS5 indexing.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The text content to commit to memory' },
          tier: { type: 'string', enum: ['core', 'project', 'session', 'ephemeral'], default: 'project', description: 'Memory retention tier' },
          context_id: { type: 'string', description: 'Optional context ring identifier' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Categorization tags' },
          ring: { type: 'integer', minimum: 0, maximum: 2, default: 2, description: 'Context ring level' },
          importance: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Importance weight (1-5)' }
        },
        required: ['content']
      }
    },
    handler: (args) => {
      const saved = saveMemory(args.content, {
        tier: args.tier || 'project',
        contextId: args.context_id,
        tags: args.tags || [],
        ring: args.ring !== undefined ? args.ring : 2,
        importance: args.importance || 3
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, memory: saved }, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_get_context',
      description: 'Retrieve the active sovereign workspace context, including current domain, working directory, and isolated memory namespace.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: () => {
      const db = getDb();
      const activeCtx = db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(activeCtx || { message: 'No active context found' }, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_switch_context',
      description: 'Switch active workspace context, activating strict domain boundary firewalls between dev, marketing, and ops.',
      inputSchema: {
        type: 'object',
        properties: {
          context_id: { type: 'string', description: 'Target context ID to activate' }
        },
        required: ['context_id']
      }
    },
    handler: (args) => {
      const db = getDb();
      db.prepare('UPDATE contexts SET is_active = 0').run();
      const res = db.prepare('UPDATE contexts SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(args.context_id);
      if (res.changes === 0) {
        throw new Error(`Context "${args.context_id}" not found.`);
      }
      const newCtx = db.prepare('SELECT * FROM contexts WHERE id = ?').get(args.context_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, active_context: newCtx }, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_task_add',
      description: 'Create a new tracked task in SQLite SSOT with domain tag and optional subagent assignment.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the task' },
          description: { type: 'string', description: 'Optional detailed requirements' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
          domain: { type: 'string', default: 'general', description: 'Domain classification (dev, marketing, general)' },
          assigned_agent: { type: 'string', description: 'Optional subagent alias (e.g., coder, designer)' }
        },
        required: ['title']
      }
    },
    handler: (args) => {
      const task = addTask({
        title: args.title,
        description: args.description,
        priority: args.priority || 'medium',
        domain: args.domain || 'general',
        assignedAgent: args.assigned_agent
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, task }, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_task_list',
      description: 'List tracked tasks from SQLite SSOT filtered by status, domain, or assigned subagent.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked', 'all'], default: 'pending' },
          domain: { type: 'string', description: 'Optional domain filter' },
          assigned_agent: { type: 'string', description: 'Optional assigned agent filter' }
        }
      }
    },
    handler: (args) => {
      const tasks = listTasks({
        status: args.status || 'pending',
        domain: args.domain,
        assignedAgent: args.assigned_agent
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(tasks, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_exec_subagent',
      description: 'Delegate a task to a specialized subagent and synthesize a self-contained Markdown Brief blending Ring 0, Ring 1, and Ring 2 context.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_name: { type: 'string', description: 'Subagent alias (e.g. coder, reviewer, designer, marketing)' },
          task_id: { type: 'string', description: 'Optional existing task ID' },
          task_title: { type: 'string', description: 'Task title if new' },
          instructions: { type: 'string', description: 'Specific delegation instructions' }
        },
        required: ['agent_name']
      }
    },
    handler: (args) => {
      const delegation = delegateTask(args.agent_name, {
        taskId: args.task_id,
        taskTitle: args.task_title,
        instructions: args.instructions
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(delegation, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_list_skills',
      description: 'List all community skills registered as managed subagents with their domain and allowed tools.',
      inputSchema: {
        type: 'object',
        properties: {
          include_disabled: { type: 'boolean', default: false }
        }
      }
    },
    handler: (args) => {
      const skills = listRegisteredSkills({ includeDisabled: args.include_disabled });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(skills, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_synthesize_brief',
      description: 'Generate an autonomous markdown task brief synthesized from 3-Ring context and assigned agent rules.',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'Task ID' },
          task_title: { type: 'string', description: 'Task title if no taskId' },
          agent_name: { type: 'string', default: 'coder' }
        }
      }
    },
    handler: (args) => {
      const brief = generateTaskBrief({
        taskId: args.task_id,
        taskTitle: args.task_title,
        agentName: args.agent_name
      });
      return {
        content: [{
          type: 'text',
          text: brief.briefMarkdown || (typeof brief === 'string' ? brief : JSON.stringify(brief, null, 2))
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_db_stats',
      description: 'Inspect SQLite database health metrics, WAL file size, memory counts, and table sizes.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: () => {
      const stats = getDbStats();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(stats, null, 2)
        }]
      };
    }
  },
  {
    definition: {
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
    handler: (args) => {
      const val = getConfig(args.key);
      return { content: [{ type: 'text', text: JSON.stringify({ key: args.key, value: val }, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_config_set',
      description: 'Set or update a configuration key-value pair in Tidy SQLite SSOT.',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Configuration key name' },
          value: { description: 'Value to persist' },
          description: { type: 'string', description: 'Optional documentation' }
        },
        required: ['key', 'value']
      }
    },
    handler: (args) => {
      const res = setConfig(args.key, args.value, args.description);
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_profile_update',
      description: 'Update user persona, assistant name, role, UI theme, currency, or locale in SQLite SSOT.',
      inputSchema: {
        type: 'object',
        properties: {
          user_name: { type: 'string', description: 'User display name' },
          assistant_name: { type: 'string', description: 'Assistant persona name' },
          role: { type: 'string', description: 'User title or role' },
          locale: { type: 'string', enum: ['ar', 'en'], description: 'Primary language' },
          theme: { type: 'string', enum: ['dark', 'light', 'system'], description: 'Interface theme' },
          currency: { type: 'string', description: 'Preferred currency (e.g. USD, SAR, EGP)' }
        }
      }
    },
    handler: (args) => {
      const updated = updateUserProfile({
        userName: args.user_name,
        assistantName: args.assistant_name,
        role: args.role,
        locale: args.locale,
        theme: args.theme,
        currency: args.currency
      });
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  },
  {
    definition: {
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
    },
    handler: (args) => {
      if (args.action === 'set') {
        if (!args.key) throw new Error('Key is required for setting governance rule');
        const res = setGovernanceRule(args.key, args.value);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      const rules = getGovernanceRules();
      return { content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }] };
    }
  }
];

module.exports = { coreTools };
