/**
 * Tidy MCP — Sovereign Brain Engine Tools
 *
 * @module @tidy/mcp/modules/brain-tools
 */

const core = require('@tidy/core');
const {
  runSystemDoctor,
  searchHybridKnowledge,
  extractAndPersistKi,
  recallSessionTranscripts,
  auditStorageHygiene,
  checkContextualFirewall,
  getSkillManifest,
  getUserProfile,
  getDb
} = core;

const SERVER_VERSION = '1.5.0';

function resolveDbPath() {
  const path = require('path');
  const os = require('os');
  return process.env.TIDY_DB || path.join(os.homedir(), '.tidy', 'tidy.db');
}

const brainTools = [
  {
    definition: {
      name: 'tidy_doctor',
      description: 'Comprehensive health audit of SQLite SSOT, WAL mode, 4-tier knowledge taxonomy, storage footprint, and registered skills.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: () => {
      const doc = runSystemDoctor();
      return {
        content: [
          { type: 'text', text: doc.markdownReport }
        ]
      };
    }
  },
  {
    definition: {
      name: 'tidy_search',
      description: 'Hybrid search querying both SQLite SSOT memory (FTS5 BM25) and 4-tier disk knowledge (~/.gemini/knowledge/) with taxonomy filtering.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords or phrases' },
          scope: { type: 'string', enum: ['all', 'global', 'tech', 'project', 'session'], default: 'all' },
          project_id: { type: 'string', description: 'Target project key if scope is project' },
          domain: { type: 'string', description: 'Optional domain filter (dev, marketing, ops)' },
          limit: { type: 'integer', default: 5 }
        },
        required: ['query']
      }
    },
    handler: (args) => {
      const res = searchHybridKnowledge({
        query: args.query,
        scope: args.scope,
        projectId: args.project_id || args.projectId,
        domain: args.domain,
        limit: args.limit
      });
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_extract',
      description: 'Extract and persist a compliant atomic Knowledge Item (KI) with mandatory negative constraint into 4-tier storage and SQLite SSOT.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier (e.g. KI-Postgres-WAL-Tuning)' },
          title: { type: 'string', description: 'Human readable title' },
          rule: { type: 'string', description: 'Deterministic rule directives' },
          trigger_context: { type: 'string', description: 'When this rule activates' },
          negative_constraint: { type: 'string', description: 'Explicit negative boundary / suppression condition (Mandatory)' },
          scope: { type: 'string', enum: ['global', 'tech', 'project', 'session'], default: 'tech' },
          project_id: { type: 'string', description: 'Project key if scope is project' },
          domain: { type: 'string', default: 'Development' },
          importance: { type: 'integer', minimum: 1, maximum: 5, default: 4 }
        },
        required: ['id', 'title', 'negative_constraint']
      }
    },
    handler: (args) => {
      const res = extractAndPersistKi({
        id: args.id,
        title: args.title,
        rule: args.rule,
        triggerContext: args.trigger_context || args.triggerContext,
        negativeConstraint: args.negative_constraint || args.negativeConstraint,
        scope: args.scope,
        projectId: args.project_id || args.projectId,
        domain: args.domain,
        importance: args.importance
      });
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_transcripts',
      description: 'Forensic scanner searching past agent conversation transcripts on-demand without active context bloat.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or keyword' },
          days: { type: 'integer', default: 7, description: 'Age window in days' },
          limit: { type: 'integer', default: 10 },
          conversation_id: { type: 'string', description: 'Optional specific conversation ID' }
        },
        required: ['query']
      }
    },
    handler: (args) => {
      const res = recallSessionTranscripts({
        query: args.query,
        days: args.days,
        limit: args.limit,
        conversationId: args.conversation_id || args.conversationId
      });
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_hygiene',
      description: 'Audit disk consumption of recordings, sessions, and temp artifacts with safe dry-run and pruning.',
      inputSchema: {
        type: 'object',
        properties: {
          days_threshold: { type: 'integer', default: 7, description: 'Minimum age in days' },
          dry_run: { type: 'boolean', default: true, description: 'Simulate without deleting files' },
          prune: { type: 'boolean', default: false, description: 'Execute actual deletion' }
        }
      }
    },
    handler: (args) => {
      const res = auditStorageHygiene({
        daysThreshold: args.days_threshold || args.daysThreshold,
        dryRun: args.dry_run !== undefined ? args.dry_run : args.dryRun,
        prune: args.prune
      });
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_firewall',
      description: 'Check text or prompt for domain contamination and context bleed between dev, marketing, and ops modes.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text or prompt to analyze' },
          active_mode: { type: 'string', enum: ['dev', 'marketing', 'ops'], default: 'dev' }
        },
        required: ['text']
      }
    },
    handler: (args) => {
      const res = checkContextualFirewall({
        text: args.text,
        activeMode: args.active_mode || args.activeMode
      });
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_manifest',
      description: "Inspect a skill's full manifest, commands, workflows, and 15-rules compliance score.",
      inputSchema: {
        type: 'object',
        properties: {
          skill_id: { type: 'string', description: 'Skill ID or name (e.g. tidy, tidyfactor-next, design)' }
        },
        required: ['skill_id']
      }
    },
    handler: (args) => {
      const res = getSkillManifest(args.skill_id || args.skillId || args.name);
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_whoami',
      description: 'Get current sovereign user persona, assistant role, active context ID, firewall mode, and SQLite SSOT path.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: () => {
      const profile = getUserProfile();
      const db = getDb();
      const activeCtx = db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            user: profile.userName,
            assistant: profile.assistantName,
            role: profile.role,
            theme: profile.theme,
            currency: profile.currency,
            locale: profile.locale,
            active_context: activeCtx ? {
              id: activeCtx.id,
              name: activeCtx.name,
              domain: activeCtx.domain_mode
            } : null,
            sqlite_db: resolveDbPath(),
            version: SERVER_VERSION
          }, null, 2)
        }]
      };
    }
  }
];

module.exports = { brainTools };
