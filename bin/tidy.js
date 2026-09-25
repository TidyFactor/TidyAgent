#!/usr/bin/env node
/**
 * Tidy Ecosystem — Unified Terminal CLI Engine
 * Interactive navigation wizard, one-liner commands, and subagent dispatcher.
 *
 * @module bin/tidy
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor 
 * @see https://github.com/TidyFactor/TidyAgent
 */


// Suppress Node.js experimental warnings for node:sqlite
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  const msg = typeof warning === 'string' ? warning : warning?.message;
  if (msg && (msg.includes('SQLite is an experimental feature') || msg.includes('ExperimentalWarning: SQLite'))) {
    return;
  }
  return originalEmitWarning.call(process, warning, ...args);
};

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const { getDb, getStats, resolveDbPath } = require('../scripts/db');
const { saveMemory, recallMemory, listMemories, forgetMemory, pruneMemories, pruneDecayedMemories } = require('../scripts/memory');
const { listSubagents, getSubagent, registerSubagent, prepareSubagentContext, runSubagent } = require('../scripts/subagents');
const { addTask, listTasks, getTask, completeTask, addSnippet, listSnippets, addJournalEntry, listJournal, setSecret, getSecret, listVaultKeys, listInstalledApps } = require('../scripts/apps');
const { discoverSkills, listRegisteredSkills, registerSkillFromPath, getRegisteredSkill } = require('../scripts/skills-loader');
const { generateTaskBrief } = require('../scripts/brief-generator');
const { exportToMarkdown, exportToJson, importFromJson, importFromMarkdown } = require('../scripts/portability');
const { getConfig, setConfig, listConfig, deleteConfig, getUserProfile, updateUserProfile, getGovernanceRules, setGovernanceRule } = require('../scripts/governance');
const { startServer } = require('../scripts/mcp_server');
const { runWizard } = require('../scripts/wizard');
const { runSystemDoctor } = require('../scripts/brain-doctor');
const { searchHybridKnowledge } = require('../scripts/hybrid-search');
const { auditStorageHygiene } = require('../scripts/storage-hygiene');
const { checkContextualFirewall } = require('../scripts/firewall-checker');

// Dynamically resolve @tidy/office domain pack if present
let office = null;
try {
  office = require('@tidy/office');
} catch {
  try {
    office = require('../packages/office/src/index');
  } catch {
    office = null;
  }
}

// Dynamically resolve @tidy/plugin universal adapter pack if present
let plugin = null;
try {
  plugin = require('@tidy/plugin');
} catch {
  try {
    plugin = require('../scripts/plugin');
  } catch {
    plugin = null;
  }
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

function parseFlags(rawArgs) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function printBanner() {
  const dbPath = resolveDbPath();
  const officeStatus = office ? ' [Office Pack: Active]' : '';
  console.log(`
==================================================================
  ✨ Tidy — Sovereign Personal Assistant & Memory OS (v${pkg.version})${officeStatus}
  📁 SQLite SSOT: ${dbPath}
==================================================================`);
}

function printHelp() {
  printBanner();
  console.log(`
Usage: tidy <command> [subcommand] [arguments] [options]

Interactive Mode:
  tidy                     Launch interactive terminal wizard (@clack/prompts)
  tidy wizard / ui         Launch interactive terminal UI explicitly

Fast Developer One-Liners:
  tidy q <query>           Instant memory recall with cognitive decay ranking (--limit, --bypass)
  tidy m <text>            Instant memory capture (--cat, --imp, --tier)
  tidy task <title>        Fast task creation (--priority, --agent, --domain)
  tidy tasks               Fast task list (--pending, --all, --domain)
  tidy done <id>           Complete task with auto-memory archival (--result)
  tidy who                 Fast identity & granular profile (--update, --user, --assistant)
  tidy govern              Fast governance rules & firewall policy inspector (or: tidy govern set <k> <v>)
  tidy cfg                 Fast configuration provider manager (or: tidy cfg get/set <k> <v>)
  tidy export              Export vault (Obsidian PARA Markdown or JSON SSOT)
  tidy import <path>       Import external Markdown or JSON vault into SQLite
  tidy prune               Smart cognitive purge of decayed ephemeral records

Commands:
  init                     Verify or auto-bootstrap SQLite storage
  whoami                   Display active profile, context, and firewall mode
  context                  Manage workspace contexts & domain firewalls
    context list           List all registered contexts
    context switch <id>    Switch active workspace (dev, marketing, personal, general)
  memory                   Manage active memory & FTS5 full-text search
    memory recall <query>  Search memory via BM25 ranking
    memory save <text>     Persist a new fact or decision
    memory list            List recent memory nodes
    memory forget <id>     Delete a memory node
    memory prune           Clean expired ephemeral records
  skills                   Manage community skills as subagents
    skills list            List registered skills & agent aliases
    skills scan [dir]      Auto-discover & register skills in workspace/Skills-LAB
    skills register <path> Register an external skill directory
  agent                    Orchestrate and delegate tasks to subagents
    agent list             List available subagents & skill agents
    agent run <name> <tsk> Dispatch task to subagent with 3-ring context
  brief                    Generate self-contained task briefs for AI agents
    brief <task_id>        Synthesize 3-ring context brief for a task
    brief create "<title>" Synthesize on-the-fly task brief
  app                      Integrated micro-apps library
    app list               List installed apps
    app task add <title>   Add a new task (--domain, --agent)
    app task list          List tasks (--domain, --status)
    app task done <id>     Mark task as completed
    app task brief <id>    Generate task brief directly
    app snippet add <t> <c> Add code snippet
    app snippet list       List code snippets
    app journal add <t> <e> Add journal entry
    app vault set <k> <v>  Save secret/config
    app vault get <k>      Read secret/config${office ? `

Office Suite (@tidy/office):
  crm                      Manage B2B client relationships & pipelines
    crm list               List CRM clients (--stage, --search)
    crm add <name>         Add new client (--company, --email, --stage, --value)
    crm view <id>          View client details & active proposals/invoices
  invoice                  Manage itemized billing & invoicing
    invoice list           List invoices (--status, --client)
    invoice issue <cl_id>  Create new invoice (--items <json>, --tax, --due)
    invoice pay <id>       Mark invoice as paid
    invoice view <id>      View invoice breakdown & line items
  expense                  Manage overhead & expenses
    expense list           List expenses (--category, --month)
    expense add <desc> <amt> Record business expense (--category)
  cashflow                 View financial cashflow (revenue, expenses, net)
  dossier <client_id>      Synthesize evidence-based AI client dossier
  import-pocketoffice <dir> Migrate legacy PocketOffice JSON to SQLite SSOT` : ''}
  db                       Database maintenance & inspection
    db stats               View storage health & table counts
    db backup <dest>       Run atomic backup via VACUUM INTO
  mcp                      Start Stdio MCP server for IDEs & AI agents
`);
}

async function main() {
  try {
    if (args.length === 0) {
      if (process.stdout.isTTY) {
        return await runWizard();
      }
      return printHelp();
    }

    switch (command) {
      case 'wizard':
      case 'ui': {
        return await runWizard();
      }
      case 'q':
      case 'recall': {
        const { flags, positional } = parseFlags(args.slice(1));
        const query = positional.join(' ');
        if (!query) {
          console.error('Error: specify search query (e.g. tidy q "SQLite WAL")');
          process.exit(1);
        }
        const limit = flags.limit ? parseInt(flags.limit, 10) : 5;
        const bypassFirewall = Boolean(flags.bypass || flags.all);
        const results = recallMemory({ query, limit, bypassFirewall });
        console.log(`\n  🔍 Recall results for "${query}" (${results.length} matches):`);
        if (results.length === 0) {
          console.log('     No matching memories found.');
        } else {
          results.forEach((r, idx) => {
            const domainTag = r.context_domain ? ` [${r.context_domain}]` : '';
            const stars = '★'.repeat(r.importance || 3) + '☆'.repeat(5 - (r.importance || 3));
            const decay = r.decay_score ? ` (Decay: ${(r.decay_score * 100).toFixed(0)}%)` : '';
            console.log(`\n  ${idx + 1}. [${r.tier.toUpperCase()} | ${r.category.toUpperCase()}] ${stars}${decay}${domainTag}`);
            console.log(`     ${r.content}`);
            console.log(`     ID: ${r.id} | Access count: ${r.access_count || 0}`);
          });
        }
        break;
      }

      case 'm':
      case 'memo': {
        const { flags, positional } = parseFlags(args.slice(1));
        const content = positional.join(' ');
        if (!content) {
          console.error('Error: specify text content (e.g. tidy m "Always use WAL mode" --cat rule --imp 5)');
          process.exit(1);
        }
        const category = flags.cat || flags.category || 'fact';
        const tier = flags.tier || 'project';
        const importance = flags.imp || flags.importance ? parseInt(flags.imp || flags.importance, 10) : 3;
        const saved = saveMemory({ content, category, tier, importance });
        console.log(`\n  ✨ Saved memory [${saved.id}]:`);
        console.log(`     Category   : ${saved.category}`);
        console.log(`     Tier       : ${saved.tier}`);
        console.log(`     Importance : ${saved.importance}/5`);
        console.log(`     Content    : ${saved.content}`);
        break;
      }

      case 'who':
      case 'whoami':
      case 'profile': {
        const { flags, positional } = parseFlags(args.slice(1));
        const hasUpdates = Boolean(flags.update || flags.user || flags.assistant || flags.name || flags.locale || flags.theme || flags.currency || flags.role);

        if (hasUpdates) {
          const updated = updateUserProfile({
            userName: flags.user || flags.name,
            assistantName: flags.assistant,
            role: flags.role,
            locale: flags.locale,
            tone: flags.tone,
            theme: flags.theme,
            currency: flags.currency,
            timeFormat: flags.format || flags.time_format
          });
          console.log(`\n  ✅ Profile Updated Successfully:`);
          console.log(`     User       : ${updated.user_name} (${updated.role})`);
          console.log(`     Assistant  : ${updated.assistant_name}`);
          console.log(`     Locale/Tone: ${updated.locale} (${updated.tone})`);
          console.log(`     Theme/Cur  : ${updated.theme} | ${updated.currency} (${updated.time_format})`);
          break;
        }

        printBanner();
        const profile = getUserProfile();
        const stats = getStats();
        console.log(`\n  👤 User            : ${profile.user_name} (${profile.role})`);
        console.log(`  🤖 Assistant       : ${profile.assistant_name}`);
        console.log(`  🌐 Locale & Tone   : ${profile.locale} (${profile.tone})`);
        console.log(`  🎨 Theme & Currency: ${profile.theme} | ${profile.currency} (${profile.time_format})`);
        console.log(`  🎯 Active Context  : [${stats.activeContext?.id}] ${stats.activeContext?.name}`);
        console.log(`  🛡️ Firewall Mode   : [${stats.activeContext?.domain.toUpperCase()} MODE]`);
        break;
      }

      case 'govern':
      case 'gov': {
        const { positional } = parseFlags(args.slice(1));
        const sub = positional[0] || 'list';

        if (sub === 'set') {
          const key = positional[1];
          const val = positional[2];
          if (!key || val === undefined) {
            console.error('Error: specify key and value (e.g. tidy govern set firewall_policy permissive)');
            process.exit(1);
          }
          const rules = setGovernanceRule(key, val);
          console.log(`\n  🛡️ Governance Rule Updated: ${key} = ${val}`);
          console.log(`     Active Policy   : ${rules[key] || val}`);
        } else {
          const rules = getGovernanceRules();
          console.log(`\n  🛡️ Tidy Ecosystem — Governance & Context Firewall Policies:`);
          console.log(`  ------------------------------------------------------------`);
          for (const [k, v] of Object.entries(rules)) {
            const label = k.replace(/_/g, ' ').padEnd(26);
            console.log(`  • ${label}: ${v}`);
          }
          console.log(`  ------------------------------------------------------------`);
          console.log(`  To update a policy: tidy govern set <rule_name> <value>`);
        }
        break;
      }

      case 'cfg':
      case 'config': {
        const { positional } = parseFlags(args.slice(1));
        const sub = positional[0] || 'list';

        if (sub === 'get') {
          const key = positional[1];
          if (!key) {
            console.error('Error: specify config key (e.g. tidy cfg get version)');
            process.exit(1);
          }
          const val = getConfig(key);
          console.log(val !== null ? `  ${key} = ${val}` : `  (not set)`);
        } else if (sub === 'set') {
          const key = positional[1];
          const val = positional[2];
          if (!key || val === undefined) {
            console.error('Error: specify key and value (e.g. tidy cfg set default_domain dev)');
            process.exit(1);
          }
          setConfig(key, val);
          console.log(`  [OK] Set ${key} = ${val}`);
        } else if (sub === 'del' || sub === 'delete') {
          const key = positional[1];
          if (!key) {
            console.error('Error: specify config key (e.g. tidy cfg del my_key)');
            process.exit(1);
          }
          const ok = deleteConfig(key);
          console.log(ok ? `  [OK] Deleted ${key}` : `  Key ${key} not found.`);
        } else {
          const entries = listConfig();
          console.log(`\n  ⚙️ System Configuration (${entries.length} variables):`);
          console.log(`  ------------------------------------------------------------`);
          if (entries.length === 0) {
            console.log('  (no variables configured)');
          } else {
            entries.forEach(e => {
              const keyPad = e.key.padEnd(24);
              console.log(`  • ${keyPad} = ${e.value}`);
            });
          }
          console.log(`  ------------------------------------------------------------`);
          console.log(`  Usage: tidy cfg get <key> | tidy cfg set <key> <value> | tidy cfg del <key>`);
        }
        break;
      }

      case 'run':
      case 'agent':
      case 'exec': {
        const { positional } = parseFlags(args.slice(1));
        const agentName = positional[0];
        const task = positional.slice(1).join(' ');

        if (!agentName) {
          const agents = listSubagents();
          console.log(`\n  🤖 Available Autonomous Agents & Skills (${agents.length}):`);
          console.log(`  ------------------------------------------------------------`);
          agents.forEach(a => {
            const namePad = `@${a.name}`.padEnd(16);
            console.log(`  • ${namePad} [${a.domain || 'general'}] ${a.role}`);
          });
          console.log(`  ------------------------------------------------------------`);
          console.log(`  Usage: tidy run <agent> <task> (e.g. tidy run coder "Review database indexing")`);
          break;
        }

        if (!task) {
          const agent = getSubagent(agentName);
          if (!agent) {
            console.error(`Error: Subagent "@${agentName}" not found.`);
            process.exit(1);
          }
          console.log(`\n  🤖 Agent Profile: @${agent.name}`);
          console.log(`     Role       : ${agent.role}`);
          console.log(`     Description: ${agent.description}`);
          console.log(`     System     : ${agent.system_prompt}`);
          console.log(`     Tools      : ${agent.allowed_tools.join(', ') || 'none'}`);
          console.log(`\n  To run this agent: tidy run ${agent.name} "<task description>"`);
          break;
        }

        const execution = runSubagent(agentName, task);
        console.log(`\n  🤖 Agent Runner Execution: @${execution.subagent}`);
        console.log(`  ------------------------------------------------------------`);
        console.log(`  Role       : ${execution.context.agent.role}`);
        console.log(`  Workspace  : ${execution.context.ring1_workspace.context_name} [${execution.context.ring1_workspace.domain}]`);
        console.log(`  Task       : ${execution.task}`);
        console.log(`  Memory SSOT: Created node [${execution.memoryNodeId}] (session tier)`);
        console.log(`  ------------------------------------------------------------`);
        console.log(`  ${execution.output}`);
        break;
      }

      case 'doc':
      case 'doctor': {
        const doc = runSystemDoctor();
        console.log(`\n${doc.markdownReport}`);
        break;
      }

      case 'find':
      case 'search': {
        const { flags, positional } = parseFlags(args.slice(1));
        const query = positional.join(' ');
        if (!query) {
          console.error('Error: specify search query (e.g. tidy find "Next.js architecture")');
          process.exit(1);
        }
        const limit = flags.limit ? parseInt(flags.limit, 10) : 5;
        const scope = flags.scope || 'all';
        const res = searchHybridKnowledge({ query, scope, limit });
        console.log(`\n  🔎 Hybrid Knowledge Matches for "${query}" (${res.matches.length} found):`);
        if (res.matches.length === 0) {
          console.log('     No matching memories or knowledge items found.');
        } else {
          res.matches.forEach((m, idx) => {
            const badge = `[${m.source.toUpperCase()} | ${m.tier.toUpperCase()}]`;
            console.log(`\n  ${idx + 1}. ${badge} ${m.title}`);
            console.log(`     ${m.snippet.slice(0, 160)}...`);
            console.log(`     Location: ${m.location}`);
          });
        }
        break;
      }

      case 'clean':
      case 'hygiene': {
        const { flags } = parseFlags(args.slice(1));
        const days = flags.days ? parseInt(flags.days, 10) : 7;
        const prune = Boolean(flags.prune);
        const res = auditStorageHygiene({ daysThreshold: days, prune });
        console.log(`\n  🧹 Storage Hygiene & Safe Pruning:`);
        console.log(`     Mode         : ${res.dryRun ? 'Dry-Run (Audit Only)' : 'Pruned (Files Deleted)'}`);
        console.log(`     Age Window   : > ${res.daysThreshold} days`);
        console.log(`     Candidates   : ${res.candidateCount} files (${res.candidateMb} MB)`);
        if (!res.dryRun) {
          console.log(`     Freed Space  : ${res.freedMb} MB (${res.deletedFilesCount} files removed)`);
          console.log(`     Decayed Mems : ${res.memoryRecordsPruned} records pruned`);
        } else {
          console.log(`\n  💡 Run "tidy clean --prune" to execute permanent cleanup.`);
        }
        break;
      }

      case 'firewall': {
        const { flags, positional } = parseFlags(args.slice(1));
        const text = positional.join(' ');
        if (!text) {
          console.error('Error: specify text to inspect (e.g. tidy firewall "Our AIDA sales funnel")');
          process.exit(1);
        }
        const mode = flags.mode || 'dev';
        const res = checkContextualFirewall({ text, activeMode: mode });
        console.log(`\n  🛡️ Contextual Firewall Inspection [${mode.toUpperCase()} MODE]:`);
        console.log(`     Status        : ${res.compliant ? '🟢 COMPLIANT (Zero Bleed)' : '🔴 CONTAMINATED'}`);
        console.log(`     Score         : ${res.score}/100`);
        if (res.violations.length > 0) {
          console.log(`     Violations    : ${res.violations.join(', ')}`);
        }
        console.log(`     Recommendation: ${res.recommendation}`);
        break;
      }

      case 'task': {
        const { flags, positional } = parseFlags(args.slice(1));
        const title = positional.join(' ');
        if (!title) {
          console.error('Error: specify task title (e.g. tidy task "Implement RLS" --priority urgent)');
          process.exit(1);
        }
        const priority = flags.priority || flags.p || (flags.urgent ? 'urgent' : flags.high ? 'high' : 'medium');
        const domain = flags.domain || flags.d || 'general';
        const assignedAgent = flags.agent || flags.a || null;
        const created = addTask({ title, priority, domain, assignedAgent });
        console.log(`\n  📋 Task Created [${created.id}]:`);
        console.log(`     Title     : ${created.title}`);
        console.log(`     Priority  : ${created.priority.toUpperCase()}`);
        console.log(`     Domain    : ${created.domain}`);
        if (created.assignedAgent) console.log(`     Agent     : @${created.assignedAgent}`);
        break;
      }

      case 'tasks': {
        const { flags } = parseFlags(args.slice(1));
        const status = flags.all ? null : (flags.completed ? 'completed' : 'pending');
        const domain = flags.domain || flags.d || null;
        const priority = flags.priority || flags.p || null;
        const tasks = listTasks({ status, domain, priority });
        console.log(`\n  📋 Tasks List (${tasks.length}${status ? ` - ${status}` : ''}):`);
        if (tasks.length === 0) {
          console.log('     No tasks found.');
        } else {
          tasks.forEach((t, i) => {
            const mark = t.status === 'completed' ? '✓ [DONE]' : '○ [TODO]';
            const agent = t.assigned_agent ? ` (@${t.assigned_agent})` : '';
            console.log(`  ${mark} [${t.priority.toUpperCase().padEnd(6)}] [${(t.domain || 'general').padEnd(8)}] ${t.title}${agent} (${t.id})`);
          });
        }
        break;
      }

      case 'done': {
        const { flags, positional } = parseFlags(args.slice(1));
        const taskId = positional[0];
        if (!taskId) {
          console.error('Error: specify task ID (e.g. tidy done tsk_xxx --result "Implemented auth")');
          process.exit(1);
        }
        const result = flags.result || flags.r || positional.slice(1).join(' ') || null;
        const ok = completeTask(taskId, { result, archiveToMemory: true });
        if (ok) {
          console.log(`\n  ✓ [OK] Task ${taskId} marked as completed.`);
          if (result) {
            console.log(`  🧠 Architectural decision archived into Memory SSOT: "${result}"`);
          }
        } else {
          console.error(`  Error: task ${taskId} not found.`);
        }
        break;
      }

      case 'export': {
        const { flags, positional } = parseFlags(args.slice(1));
        const format = (flags.format || flags.f || 'markdown').toLowerCase();
        const out = flags.out || flags.o || positional[0] || (format === 'json' ? path.join(process.cwd(), `tidy_export_${Date.now()}.json`) : path.join(process.cwd(), 'tidy_vault'));
        if (format === 'json') {
          const res = exportToJson(out);
          console.log(`\n  📦 Sovereign JSON SSOT Export Complete:`);
          console.log(`     File Path     : ${res.filePath}`);
          console.log(`     Total Records : ${res.totalRecords}`);
        } else {
          const res = exportToMarkdown(out);
          console.log(`\n  📦 Obsidian PARA Markdown Vault Export Complete:`);
          console.log(`     Vault Path    : ${res.targetDir}`);
          console.log(`     Total Notes   : ${res.totalExported}`);
          console.log(`     - Projects/   : ${res.breakdown.projects}`);
          console.log(`     - Areas/      : ${res.breakdown.areas}`);
          console.log(`     - Resources/  : ${res.breakdown.resources}`);
          console.log(`     - Archive/    : ${res.breakdown.archive}`);
        }
        break;
      }

      case 'import': {
        const { flags, positional } = parseFlags(args.slice(1));
        const source = positional[0] || flags.file || flags.path;
        if (!source) {
          console.error('Error: specify file or directory to import (e.g. tidy import ./backup.json or tidy import ./notes)');
          process.exit(1);
        }
        if (source.endsWith('.json')) {
          const res = importFromJson(source);
          console.log(`\n  📥 JSON SSOT Ingest Complete:`);
          console.log(`     Source File   : ${res.sourceFile}`);
          console.log(`     Total Records : ${res.totalImported}`);
        } else {
          const res = importFromMarkdown(source);
          console.log(`\n  📥 Markdown Notes Ingest Complete:`);
          console.log(`     Files Read    : ${res.filesProcessed}`);
          console.log(`     Nodes Created : ${res.totalImported}`);
        }
        break;
      }

      case 'prune': {
        const { flags } = parseFlags(args.slice(1));
        const threshold = flags.threshold ? parseFloat(flags.threshold) : 0.25;
        const olderThanHours = flags.older ? parseInt(flags.older, 10) : 24;
        const dryRun = Boolean(flags['dry-run']);
        const res = pruneDecayedMemories({ threshold, olderThanHours, dryRun });
        console.log(`\n  🧹 Cognitive Memory Prune Complete:`);
        console.log(`     Pruned Records : ${res.prunedCount}${dryRun ? ' (DRY RUN)' : ''}`);
        if (res.prunedItems && res.prunedItems.length > 0) {
          res.prunedItems.forEach(item => {
            console.log(`     - [${item.tier}] ${item.content.substring(0, 50)}... (Score: ${item.decay_score})`);
          });
        }
        break;
      }

      case 'init': {
        printBanner();
        const stats = getStats();
        console.log(`\n  [OK] SQLite Database Verified & Active`);
        console.log(`  Storage Path    : ${stats.dbPath}`);
        console.log(`  Contexts        : ${stats.counts.contexts}`);
        console.log(`  Sub-Agents      : ${stats.counts.subagents}`);
        console.log(`  Memory Nodes    : ${stats.counts.memories}`);
        console.log(`  Active Mode     : ${stats.activeContext?.name} (${stats.activeContext?.domain})`);
        break;
      }

      case 'whoami': {
        printBanner();
        const stats = getStats();
        console.log(`\n  👤 User            : ${stats.profile?.user_name}`);
        console.log(`  🤖 Assistant       : ${stats.profile?.assistant_name}`);
        console.log(`  🌐 Locale & Tone   : ${stats.profile?.locale} (${stats.profile?.tone})`);
        console.log(`  🎯 Active Context  : [${stats.activeContext?.id}] ${stats.activeContext?.name}`);
        console.log(`  🛡️ Firewall Mode   : [${stats.activeContext?.domain.toUpperCase()} MODE]`);
        break;
      }

      case 'context': {
        const sub = args[1] || 'list';
        const db = getDb();

        if (sub === 'list') {
          const contexts = db.prepare('SELECT * FROM contexts ORDER BY is_active DESC, name ASC').all();
          console.log('\n  Registered Workspaces:');
          contexts.forEach(c => {
            const mark = c.is_active ? '[ACTIVE] ' : '         ';
            console.log(`  ${mark} ${c.id.padEnd(16)} | ${c.domain.padEnd(10)} | ${c.name}`);
          });
        } else if (sub === 'switch') {
          const targetId = args[2];
          if (!targetId) {
            console.error('Error: specify context ID (e.g. tidy context switch ctx_dev)');
            process.exit(1);
          }
          const target = db.prepare('SELECT * FROM contexts WHERE id = ?').get(targetId);
          if (!target) {
            console.error(`Error: context "${targetId}" not found.`);
            process.exit(1);
          }
          db.prepare('UPDATE contexts SET is_active = 0').run();
          db.prepare('UPDATE contexts SET is_active = 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetId);
          console.log(`\n  [OK] Switched Context to: [${target.id}] ${target.name} (${target.domain} mode)`);
        } else {
          console.log('Usage: tidy context [list|switch <id>]');
        }
        break;
      }

      case 'memory': {
        const sub = args[1] || 'list';

        if (sub === 'save') {
          const content = args.slice(2).join(' ');
          if (!content) {
            console.error('Error: specify content to save (e.g. tidy memory save "Project uses Next.js")');
            process.exit(1);
          }
          const saved = saveMemory({ content, category: 'fact', tier: 'project' });
          console.log(`\n  [OK] Memory Node Saved: [${saved.id}]`);
        } else if (sub === 'recall') {
          const query = args.slice(2).join(' ');
          if (!query) {
            console.error('Error: specify search query (e.g. tidy memory recall SQLite)');
            process.exit(1);
          }
          const results = recallMemory({ query, limit: 5 });
          console.log(`\n  Memory Search Results for "${query}" (${results.length} matches):`);
          results.forEach((r, i) => {
            console.log(`\n  ${i + 1}. [${r.tier.toUpperCase()} | ${r.category}] Score: ${r.importance}/5`);
            console.log(`     ${r.content}`);
          });
        } else if (sub === 'list') {
          const memories = listMemories({ limit: 10 });
          console.log(`\n  Recent Memory Nodes (${memories.length}):`);
          memories.forEach((m, i) => {
            console.log(`  ${i + 1}. [${m.id}] (${m.tier}/${m.category}): ${m.summary || m.content.substring(0, 60)}`);
          });
        } else if (sub === 'forget') {
          const id = args[2];
          if (!id) {
            console.error('Error: specify memory node ID to forget');
            process.exit(1);
          }
          const ok = forgetMemory(id);
          console.log(ok ? `  [OK] Node ${id} forgotten.` : `  Error: node ${id} not found.`);
        } else if (sub === 'prune') {
          pruneMemories({ daysOld: 30 });
          console.log('  [OK] Ephemeral memory nodes pruned.');
        }
        break;
      }

      case 'skills': {
        const sub = args[1] || 'list';
        if (sub === 'scan') {
          const targetDir = args[2];
          console.log(`\n  🔍 Scanning for community skills...`);
          const discovered = discoverSkills(targetDir ? [targetDir] : []);
          console.log(`  [OK] Discovered and registered ${discovered.length} skill(s):`);
          discovered.forEach(s => {
            console.log(`  ✨ @${s.alias.padEnd(14)} [${s.domain.toUpperCase().padEnd(9)}] ${s.role}`);
          });
        } else if (sub === 'register') {
          const skillPath = args[2];
          const alias = args[3];
          if (!skillPath) {
            console.error('Error: specify skill directory path (e.g. tidy skills register ./skills/tidyfactor-marketing)');
            process.exit(1);
          }
          const reg = registerSkillFromPath(skillPath, alias);
          console.log(`\n  [OK] Skill registered as subagent @${reg.alias}`);
          console.log(`  Name        : ${reg.name}`);
          console.log(`  Domain      : ${reg.domain}`);
          console.log(`  Role        : ${reg.role}`);
        } else {
          const skills = listRegisteredSkills();
          console.log('\n  Registered Community Skills:');
          if (skills.length === 0) {
            console.log('  No external skills registered yet. Run: tidy skills scan');
          } else {
            skills.forEach(s => {
              console.log(`  ✨ @${s.alias.padEnd(14)} [${(s.domain || 'general').toUpperCase().padEnd(9)}] ${s.name}`);
              console.log(`     Path: ${s.skill_path}`);
            });
          }
        }
        break;
      }

      case 'brief': {
        const taskIdOrTitle = args[1];
        if (!taskIdOrTitle) {
          console.error('Error: specify task ID or task title (e.g. tidy brief tsk_123 or tidy brief "Build Auth")');
          process.exit(1);
        }
        let briefResult;
        if (taskIdOrTitle.startsWith('tsk_')) {
          briefResult = generateTaskBrief({ taskId: taskIdOrTitle });
        } else {
          briefResult = generateTaskBrief({ taskTitle: args.slice(1).join(' ') });
        }
        console.log(`\n` + briefResult.briefMarkdown);
        break;
      }

      case 'agent': {
        const sub = args[1] || 'list';

        if (sub === 'list') {
          const agents = listSubagents();
          console.log('\n  Registered Sub-Agents:');
          agents.forEach(a => {
            console.log(`\n  🔹 [${a.name}] - ${a.role}`);
            console.log(`     Role Description : ${a.description}`);
            console.log(`     Allowed Tools    : ${a.allowed_tools_json}`);
          });
        } else if (sub === 'run') {
          const agentName = args[2];
          const task = args.slice(3).join(' ');
          if (!agentName || !task) {
            console.error('Error: specify agent name and task (e.g. tidy agent run coder "Review schema")');
            process.exit(1);
          }
          const ctx = prepareSubagentContext({ name: agentName, task });
          console.log(`\n  🚀 Subagent Context Prepared [${ctx.agent.name}]:`);
          console.log(`     Role         : ${ctx.agent.role}`);
          console.log(`     Context      : ${ctx.ring1_workspace.context_name} (${ctx.ring1_workspace.domain})`);
          console.log(`     Recalled KIs : ${ctx.ring2_recalled_memory.length} items`);
          console.log(`     Task Prompt  : ${ctx.task}`);
          console.log(`\n     System Prompt: ${ctx.agent.system_prompt}`);
        }
        break;
      }

      case 'app': {
        const sub = args[1] || 'list';

        if (sub === 'list') {
          const apps = listInstalledApps();
          console.log('\n  Installed Micro-Apps:');
          apps.forEach(a => console.log(`  ▪️ ${a.name.padEnd(12)} (v${a.version})`));
        } else if (sub === 'task') {
          const action = args[2] || 'list';
          if (action === 'add') {
            const title = args.slice(3).join(' ');
            const t = addTask({ title });
            console.log(`  [OK] Task Created: [${t.id}] ${t.title}`);
          } else if (action === 'list') {
            const tasks = listTasks();
            console.log('\n  Task List:');
            tasks.forEach(t => {
              const mark = t.status === 'completed' ? '[DONE]' : '[TODO]';
              const agentTag = t.assigned_agent ? ` (@${t.assigned_agent})` : '';
              console.log(`  ${mark} [${t.priority.toUpperCase().padEnd(6)}] [${(t.domain || 'general').padEnd(8)}] ${t.title}${agentTag} (${t.id})`);
            });
          } else if (action === 'done') {
            completeTask(args[3]);
            console.log(`  [OK] Task marked as completed: ${args[3]}`);
          } else if (action === 'brief') {
            const taskId = args[3];
            if (!taskId) {
              console.error('Error: specify task ID (e.g. tidy app task brief tsk_xxx)');
              process.exit(1);
            }
            const b = generateTaskBrief({ taskId });
            console.log(`\n` + b.briefMarkdown);
          }
        } else if (sub === 'snippet') {
          const action = args[2] || 'list';
          if (action === 'add') {
            const title = args[3];
            const code = args.slice(4).join(' ');
            addSnippet({ title, code });
            console.log(`  [OK] Snippet saved: ${title}`);
          } else {
            const snippets = listSnippets();
            console.log('\n  Saved Code Snippets:');
            snippets.forEach(s => console.log(`  📄 [${s.language}] ${s.title} - ${s.code.substring(0, 40)}...`));
          }
        } else if (sub === 'journal') {
          const title = args[2];
          const entry = args.slice(3).join(' ');
          if (title && entry) {
            addJournalEntry({ title, entry });
            console.log(`  [OK] Journal entry logged: ${title}`);
          } else {
            const entries = listJournal();
            console.log('\n  Journal Entries:');
            entries.forEach(e => console.log(`  📅 [${e.created_at}] ${e.title}: ${e.entry}`));
          }
        } else if (sub === 'vault') {
          const action = args[2];
          if (action === 'set') {
            setSecret({ key: args[3], value: args[4] });
            console.log(`  [OK] Secret saved: ${args[3]}`);
          } else if (action === 'get') {
            const v = getSecret(args[3]);
            console.log(v ? `  Key ${args[3]}: ${v}` : `  Error: key not found.`);
          } else {
            const keys = listVaultKeys();
            console.log('\n  Vault Keys:');
            keys.forEach(k => console.log(`  🗝️ ${k.key} (Updated: ${k.updated_at})`));
          }
        }
        break;
      }

      case 'db': {
        const sub = args[1] || 'stats';
        if (sub === 'stats') {
          const stats = getStats();
          console.log('\n  SQLite Database Statistics:');
          console.log(`  File Path    : ${stats.dbPath}`);
          console.log(`  Memories     : ${stats.counts.memories}`);
          console.log(`  Contexts     : ${stats.counts.contexts}`);
          console.log(`  Subagents    : ${stats.counts.subagents}`);
          console.log(`  Tasks        : ${stats.counts.tasks}`);
          console.log(`  Snippets     : ${stats.counts.snippets}`);
          console.log(`  Journal      : ${stats.counts.journal}`);
          console.log(`  Audit Logs   : ${stats.counts.audit_logs}`);
        } else if (sub === 'backup') {
          const dest = args[2] || path.join(process.cwd(), `tidy_backup_${Date.now()}.db`);
          const db = getDb();
          db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}';`);
          console.log(`  [OK] Atomic backup created: ${dest}`);
        }
        break;
      }

      // ==========================================
      // Office Suite Domain Commands (@tidy/office)
      // ==========================================
      case 'crm': {
        if (!office) {
          console.error('\n  Error: @tidy/office pack is not loaded. Install or link @tidy/office.');
          process.exit(1);
        }
        const sub = args[1] || 'list';
        const { flags, positional } = parseFlags(args.slice(2));

        if (sub === 'list') {
          const clients = office.listClients({
            status: flags.status || flags.stage,
            search: flags.search
          });
          console.log(`\n  CRM Clients (${clients.length}):`);
          if (clients.length === 0) {
            console.log('  No clients found. Add one with: tidy crm add "Client Name"');
          } else {
            clients.forEach((c) => {
              const val = Number(c.budget || 0).toLocaleString();
              const statusTag = `[${(c.status || 'lead').toUpperCase()}]`.padEnd(12);
              console.log(`  ${statusTag} ${c.id.padEnd(24)} | ${(c.name || '').padEnd(20)} | ${(c.company || 'N/A').padEnd(18)} | Budget: $${val}`);
            });
          }
        } else if (sub === 'add') {
          const name = positional.join(' ');
          if (!name) {
            console.error('Error: specify client name (e.g. tidy crm add "Acme Corp" --company "Acme" --status lead --budget 5000)');
            process.exit(1);
          }
          const client = office.addClient({
            name,
            company: flags.company || null,
            email: flags.email || null,
            phone: flags.phone || null,
            status: flags.status || flags.stage || 'lead',
            budget: flags.budget ? Number(flags.budget) : (flags.value ? Number(flags.value) : 0),
            notes: flags.notes || null
          });
          console.log(`\n  [OK] CRM Client Created: [${client.id}] ${client.name}`);
        } else if (sub === 'view') {
          const clientId = positional[0];
          if (!clientId) {
            console.error('Error: specify client ID (e.g. tidy crm view cl_xxx)');
            process.exit(1);
          }
          const client = office.getClient(clientId);
          if (!client) {
            console.error(`Error: Client "${clientId}" not found.`);
            process.exit(1);
          }
          console.log(`\n  Client Profile: [${client.id}]`);
          console.log(`  Name        : ${client.name}`);
          console.log(`  Company     : ${client.company || 'N/A'}`);
          console.log(`  Email       : ${client.email || 'N/A'}`);
          console.log(`  Phone       : ${client.phone || 'N/A'}`);
          console.log(`  Status      : [${(client.status || 'active').toUpperCase()}]`);
          console.log(`  Budget      : $${Number(client.budget || 0).toLocaleString()} ${client.currency || 'USD'}`);
          console.log(`  Created At  : ${client.created_at}`);
          if (client.notes) console.log(`  Notes       : ${client.notes}`);
        } else {
          console.log('Usage: tidy crm [list|add <name>|view <id>]');
        }
        break;
      }

      case 'invoice': {
        if (!office) {
          console.error('\n  Error: @tidy/office pack is not loaded. Install or link @tidy/office.');
          process.exit(1);
        }
        const sub = args[1] || 'list';
        const { flags, positional } = parseFlags(args.slice(2));

        if (sub === 'list') {
          const invoices = office.listInvoices({
            status: flags.status,
            clientId: flags.client
          });
          console.log(`\n  Invoices (${invoices.length}):`);
          if (invoices.length === 0) {
            console.log('  No invoices found.');
          } else {
            invoices.forEach((inv) => {
              const statusTag = `[${inv.status.toUpperCase()}]`.padEnd(12);
              const num = (inv.invoice_number || inv.id).padEnd(14);
              const client = (inv.client_name || inv.client_id || 'N/A').padEnd(20);
              const total = `$${Number(inv.total_amount || 0).toFixed(2)}`;
              console.log(`  ${statusTag} ${num} | ${client} | Total: ${total} | Due: ${inv.due_date || 'N/A'}`);
            });
          }
        } else if (sub === 'issue') {
          const clientId = positional[0];
          if (!clientId) {
            console.error('Error: specify client ID (e.g. tidy invoice issue cl_xxx --items \'[{"description":"Consulting","unitPrice":1500,"qty":1}]\')');
            process.exit(1);
          }
          let items = [];
          if (flags.items) {
            try {
              items = JSON.parse(flags.items);
            } catch (e) {
              console.error('Error: --items must be valid JSON array of {name, qty, unitPrice}');
              process.exit(1);
            }
          } else {
            items = [{
              name: flags.name || flags.description || 'Professional Services',
              qty: flags.qty ? Number(flags.qty) : 1,
              unitPrice: flags.amount ? Number(flags.amount) : 1000
            }];
          }

          const inv = office.createInvoice({
            clientId,
            items,
            taxRate: flags.tax ? Number(flags.tax) : 0,
            discountAmount: flags.discount ? Number(flags.discount) : 0,
            dueDate: flags.due || null,
            notes: flags.notes || null
          });
          console.log(`\n  [OK] Invoice Issued: [${inv.invoice_number}] (${inv.id})`);
          console.log(`  Client ID    : ${inv.client_id}`);
          console.log(`  Subtotal     : $${Number(inv.subtotal).toFixed(2)}`);
          console.log(`  Tax Amount   : $${Number(inv.tax_amount).toFixed(2)}`);
          console.log(`  Total Amount : $${Number(inv.total_amount).toFixed(2)}`);
        } else if (sub === 'pay') {
          const invId = positional[0];
          if (!invId) {
            console.error('Error: specify invoice ID to mark as paid (e.g. tidy invoice pay inv_xxx)');
            process.exit(1);
          }
          const ok = office.updateInvoiceStatus(invId, 'paid');
          console.log(ok ? `\n  [OK] Invoice [${invId}] marked as PAID.` : `\n  Error: Invoice [${invId}] not found.`);
        } else if (sub === 'view') {
          const invId = positional[0];
          if (!invId) {
            console.error('Error: specify invoice ID (e.g. tidy invoice view inv_xxx)');
            process.exit(1);
          }
          const inv = office.getInvoice(invId);
          if (!inv) {
            console.error(`Error: Invoice "${invId}" not found.`);
            process.exit(1);
          }
          console.log(`\n  ========================================`);
          console.log(`  INVOICE: ${inv.invoice_number} [${inv.status.toUpperCase()}]`);
          console.log(`  Client      : ${inv.client_name || inv.client_id} (${inv.client_company || 'N/A'})`);
          console.log(`  Issue Date  : ${inv.issue_date}`);
          console.log(`  Due Date    : ${inv.due_date || 'N/A'}`);
          console.log(`  ----------------------------------------`);
          console.log(`  Line Items:`);
          const lineItems = inv.data?.items || [];
          lineItems.forEach((item, i) => {
            const desc = item.name || item.description || 'Service';
            console.log(`    ${i + 1}. ${desc} (x${item.qty}) @ $${Number(item.unitPrice).toFixed(2)} = $${Number(item.lineTotal).toFixed(2)}`);
          });
          console.log(`  ----------------------------------------`);
          console.log(`  Subtotal    : $${Number(inv.subtotal).toFixed(2)}`);
          console.log(`  Tax (${inv.tax_rate}%) : $${Number(inv.tax_amount).toFixed(2)}`);
          console.log(`  Discount    : -$${Number(inv.discount_amount || 0).toFixed(2)}`);
          console.log(`  TOTAL DUE   : $${Number(inv.total_amount).toFixed(2)}`);
          console.log(`  ========================================`);
        } else {
          console.log('Usage: tidy invoice [list|issue <cl_id>|pay <id>|view <id>]');
        }
        break;
      }

      case 'expense': {
        if (!office) {
          console.error('\n  Error: @tidy/office pack is not loaded. Install or link @tidy/office.');
          process.exit(1);
        }
        const sub = args[1] || 'list';
        const { flags, positional } = parseFlags(args.slice(2));

        if (sub === 'list') {
          const list = office.listExpenses({
            category: flags.category,
            month: flags.month
          });
          console.log(`\n  Expenses (${list.length}):`);
          list.forEach((e) => {
            const amt = `$${Number(e.amount).toFixed(2)}`.padStart(10);
            const cat = `[${(e.category || 'General').toUpperCase()}]`.padEnd(16);
            console.log(`  ${cat} ${amt} | ${e.title || e.description} (${e.expense_date || e.date})`);
          });
        } else if (sub === 'add') {
          const title = positional[0];
          const amount = positional[1] ? Number(positional[1]) : (flags.amount ? Number(flags.amount) : null);
          if (!title || !amount) {
            console.error('Error: specify title and amount (e.g. tidy expense add "Server Hosting" 49.99 --category hosting)');
            process.exit(1);
          }
          const exp = office.addExpense({
            title,
            amount,
            category: flags.category || 'operating',
            expenseDate: flags.date || new Date().toISOString().slice(0, 10),
            notes: flags.notes || null
          });
          console.log(`\n  [OK] Expense Recorded: [${exp.id}] $${exp.amount.toFixed(2)} - ${exp.title}`);
        } else {
          console.log('Usage: tidy expense [list|add <desc> <amt> [--category <c>]]');
        }
        break;
      }

      case 'cashflow': {
        if (!office) {
          console.error('\n  Error: @tidy/office pack is not loaded. Install or link @tidy/office.');
          process.exit(1);
        }
        const summary = office.getCashflowSummary();
        console.log(`\n  ========================================`);
        console.log(`  📊 Financial Cashflow & Operations Overview`);
        console.log(`  ========================================`);
        console.log(`  Total Revenue Received : $${summary.totalRevenue.toFixed(2)}`);
        console.log(`  Total Expenses Paid    : $${summary.totalExpenses.toFixed(2)}`);
        console.log(`  ----------------------------------------`);
        const netSign = summary.netProfit >= 0 ? '+' : '';
        console.log(`  NET PROFIT (CASHFLOW)  : ${netSign}$${summary.netProfit.toFixed(2)} (Margin: ${summary.marginPct}%)`);
        console.log(`  ----------------------------------------`);
        console.log(`  Pending Receivables    : $${summary.pendingReceivables.toFixed(2)}`);
        if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
          console.log(`  ----------------------------------------`);
          console.log(`  Expenses by Category:`);
          summary.categoryBreakdown.forEach(c => {
            console.log(`    - ${(c.category || 'general').padEnd(14)}: $${Number(c.total).toFixed(2)} (${c.count} items)`);
          });
        }
        console.log(`  ========================================\n`);
        break;
      }

      case 'dossier': {
        if (!office) {
          console.error('\n  Error: @tidy/office pack is not loaded. Install or link @tidy/office.');
          process.exit(1);
        }
        const clientId = args[1];
        if (!clientId) {
          console.error('Error: specify client ID (e.g. tidy dossier cl_xxx)');
          process.exit(1);
        }
        const dossier = office.compileClientDossier(clientId);
        console.log('\n' + (dossier.dossierMarkdown || dossier.markdown));
        break;
      }

      case 'import-pocketoffice': {
        if (!office) {
          console.error('\n  Error: @tidy/office pack is not loaded. Install or link @tidy/office.');
          process.exit(1);
        }
        const targetDir = args[1];
        if (!targetDir) {
          console.error('Error: specify PocketOffice data directory (e.g. tidy import-pocketoffice ./path/to/PocketOffice-data)');
          process.exit(1);
        }
        console.log(`\n  📦 Migrating data from: ${targetDir}`);
        const result = office.importFromPocketOffice(targetDir);
        console.log(`\n  [OK] Migration Complete:`);
        console.log(`  Clients Imported   : ${result.clients}`);
        console.log(`  Products Imported  : ${result.products}`);
        console.log(`  Invoices Imported  : ${result.invoices}`);
        console.log(`  Proposals Imported : ${result.proposals}`);
        console.log(`  Expenses Imported  : ${result.expenses}`);
        console.log(`  Events Imported    : ${result.events}`);
        if (result.errors.length > 0) {
          console.log(`  Warnings/Errors    : ${result.errors.length}`);
          result.errors.forEach(e => console.log(`    - ${e}`));
        }
        break;
      }

      case 'plugin':
      case 'adapter': {
        if (!plugin) {
          console.error('\n  Error: @tidy/plugin pack is not loaded. Install or link @tidy/plugin.');
          process.exit(1);
        }
        const sub = args[1] || 'list';
        const parsed = parseFlags(args.slice(2));
        const token = parsed.flags.token || 'YOUR_SOVEREIGN_TOKEN';
        const serverUrl = parsed.flags.url || 'https://tidyfactor.com/api/mcp/sse';
        const useLocal = Boolean(parsed.flags.local);

        if (sub === 'list') {
          console.log('\n  🔌 TidyAgent Universal Host Adapters & Plugins:');
          console.log('  ------------------------------------------------');
          const hosts = plugin.listSupportedHosts();
          hosts.forEach(h => console.log(`  - ${h.padEnd(14)}: tidy plugin ${h}`));
          console.log('\n  OpenAPI 3.1 Spec : tidy plugin openapi');
          console.log('  ChatGPT Manifest : tidy plugin chatgpt-manifest');
          console.log('');
          break;
        }

        if (sub === 'openapi') {
          console.log(JSON.stringify(plugin.generateOpenApiSpec({ serverUrl: parsed.flags.url }), null, 2));
          break;
        }

        if (sub === 'chatgpt-manifest') {
          console.log(JSON.stringify(plugin.generateAiPluginManifest({ baseUrl: parsed.flags.url }), null, 2));
          break;
        }

        try {
          const config = plugin.exportHostConfiguration(sub, {
            token,
            serverUrl,
            useLocal,
            task: parsed.flags.task || 'General Development & Coding'
          });
          console.log(`\n  🔌 TidyAgent Host Configuration for: [${sub.toUpperCase()}]`);
          console.log('  ========================================================\n');
          console.log(JSON.stringify(config, null, 2));
          console.log('\n  ========================================================\n');
        } catch (err) {
          console.error(`  Error: ${err.message}`);
        }
        break;
      }

      case 'mcp': {
        startServer();
        break;
      }

      case 'help':
      default:
        printHelp();
        break;
    }
  } catch (err) {
    console.error(`\n  Error: ${err.message}`);
    process.exit(1);
  }
}

main();
