/**
 * Tidy Interactive Terminal UI / Wizard
 * Powered by @clack/prompts, picocolors, and SQLite SSOT.
 * Clean, standard interface for maximum cross-platform compatibility.
 */

let core;
try {
  core = require('@tidy/core');
} catch {
  core = require('../../core/src/index');
}

let office;
try {
  office = require('@tidy/office');
} catch {
  try {
    office = require('../../office/src/index');
  } catch {
    office = null;
  }
}

const {
  getDb,
  getStats,
  saveMemory,
  recallMemory,
  listMemories,
  listSubagents,
  prepareSubagentContext,
  addTask,
  listTasks,
  completeTask,
  exportToMarkdown,
  exportToJson,
  importFromJson,
  importFromMarkdown,
  pruneDecayedMemories
} = core;

async function runWizard() {
  const clack = await import('@clack/prompts');
  const pc = (await import('picocolors')).default;

  const { intro, outro, text, select, confirm, spinner, isCancel, note, log } = clack;

  console.clear();
  intro(pc.bgCyan(pc.black(' ✨ Tidy — Sovereign Personal Assistant & Memory OS (v1.4.1) ')));

  const stats = getStats();
  note(
    `👤 User: ${pc.bold(stats.profile?.user_name)} | Mode: ${pc.green(stats.activeContext?.domain.toUpperCase())}\n` +
    `🎯 Context: ${pc.cyan(`[${stats.activeContext?.id}] ${stats.activeContext?.name}`)}\n` +
    `🧠 Memories: ${pc.yellow(stats.counts.memories)} | 📋 Tasks: ${pc.yellow(stats.counts.tasks)} | 🤖 Sub-Agents: ${pc.yellow(stats.counts.subagents)}`,
    'Active Workspace State'
  );

  let running = true;

  while (running) {
    const action = await select({
      message: 'Choose an action to perform:',
      options: [
        { value: 'recall', label: '🔍 Search Memory (Cognitive FTS5)', hint: 'BM25 + mathematical decay ranking' },
        { value: 'save', label: '💾 Save New Memory / Decision', hint: 'Persist rule, fact, or decision' },
        { value: 'context', label: '🎯 Switch Workspace Context', hint: 'Dev, Marketing, Personal, General' },
        { value: 'tasks', label: '📋 Manage Tasks & Priorities', hint: 'View, add, or complete tasks' },
        { value: 'portability', label: '📦 Export / Import Vault', hint: 'Obsidian PARA Markdown or JSON SSOT' },
        { value: 'prune', label: '🧹 Smart Cognitive Memory Prune', hint: 'Purge decayed ephemeral records' },
        ...(office ? [{ value: 'office', label: '💼 Office Suite (CRM & Financials)', hint: 'Clients, invoices, cashflow' }] : []),
        { value: 'agent', label: '🤖 Delegate to Sub-Agent', hint: 'Planner, Coder, Researcher, Scribe' },
        { value: 'stats', label: '📊 Database Health & Stats', hint: 'WAL mode, storage, tables' },
        { value: 'exit', label: '🚪 Exit', hint: 'Close session' }
      ]
    });

    if (isCancel(action) || action === 'exit') {
      outro(pc.dim('Session closed. Tidy SQLite SSOT is intact. 👋'));
      process.exit(0);
    }

    switch (action) {
      case 'recall': {
        const query = await text({
          message: 'Enter search keyword (Arabic or English):',
          placeholder: 'Next.js, auth, database, قواعد العمل',
          validate: (val) => (!val || !val.trim() ? 'Query cannot be empty.' : undefined)
        });

        if (isCancel(query)) break;

        const s = spinner();
        s.start('Searching memory via Cognitive FTS5 BM25...');
        const results = recallMemory({ query, limit: 5 });
        s.stop(`Found ${pc.green(results.length)} matching memory node(s):`);

        if (results.length === 0) {
          log.warn(pc.yellow('No matching memories found for this query in current domain firewall.'));
        } else {
          results.forEach((r, idx) => {
            const stars = '★'.repeat(r.importance || 3) + '☆'.repeat(5 - (r.importance || 3));
            const decay = r.decay_score ? ` (Decay: ${(r.decay_score * 100).toFixed(0)}%)` : '';
            const domain = r.context_domain ? ` [${r.context_domain.toUpperCase()}]` : '';
            const header = `${idx + 1}. [${r.tier.toUpperCase()} | ${r.category.toUpperCase()}] ${stars}${decay}${domain}`;
            const body = `${r.content}\n${pc.dim(`ID: ${r.id} | Access count: ${r.access_count || 0}`)}`;
            note(body, header);
          });
        }
        break;
      }

      case 'save': {
        const content = await text({
          message: 'Enter the fact, rule, or architectural decision to store:',
          placeholder: 'e.g. Always use WAL mode for concurrent SQLite reads',
          validate: (val) => (!val || !val.trim() ? 'Content cannot be empty.' : undefined)
        });

        if (isCancel(content)) break;

        const category = await select({
          message: 'Select memory category:',
          options: [
            { value: 'fact', label: 'Fact', hint: 'General truth or permanent knowledge' },
            { value: 'decision', label: 'Decision', hint: 'Architectural or technical choice' },
            { value: 'pattern', label: 'Pattern', hint: 'Code or workflow design pattern' },
            { value: 'preference', label: 'Preference', hint: 'User preference or stylistic habit' },
            { value: 'rule', label: 'Rule', hint: 'Strict constraint or security requirement' }
          ]
        });

        if (isCancel(category)) break;

        const importance = await select({
          message: 'Select importance rating (1 = lowest, 5 = critical):',
          options: [
            { value: 5, label: '★★★★★ 5 - Critical (Never prune)' },
            { value: 4, label: '★★★★☆ 4 - High priority' },
            { value: 3, label: '★★★☆☆ 3 - Normal fact' },
            { value: 2, label: '★★☆☆☆ 2 - Low relevance' },
            { value: 1, label: '★☆☆☆☆ 1 - Ephemeral thought' }
          ]
        });

        if (isCancel(importance)) break;

        const s = spinner();
        s.start('Persisting to SQLite SSOT...');
        const saved = saveMemory({ content, category, importance: Number(importance) });
        s.stop(pc.green(`✓ Memory persisted with ID: [${saved.id}]`));
        break;
      }

      case 'context': {
        const db = getDb();
        const contexts = db.prepare('SELECT * FROM contexts ORDER BY is_active DESC, name ASC').all();

        const selectedCtx = await select({
          message: 'Choose active workspace context (sets domain firewall):',
          options: contexts.map((c) => ({
            value: c.id,
            label: `${c.is_active ? '● ' : '○ '} [${c.domain.toUpperCase().padEnd(9)}] ${c.name}`,
            hint: c.id
          }))
        });

        if (isCancel(selectedCtx)) break;

        db.prepare('UPDATE contexts SET is_active = 0').run();
        db.prepare('UPDATE contexts SET is_active = 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').run(selectedCtx);

        const activeNow = db.prepare('SELECT * FROM contexts WHERE id = ?').get(selectedCtx);
        log.success(pc.green(`✓ Switched to [${activeNow.id}] ${activeNow.name} (${activeNow.domain.toUpperCase()} domain)`));
        break;
      }

      case 'tasks': {
        const sub = await select({
          message: 'Task Operations:',
          options: [
            { value: 'list', label: '📋 View Pending Tasks', hint: 'Sorted by priority' },
            { value: 'add', label: '➕ Add New Task', hint: 'Set title and priority' },
            { value: 'complete', label: '✅ Complete Task & Archive Decision', hint: 'Mark done & auto-save to memory' },
            { value: 'back', label: '↩ Back to Main Menu', hint: 'Return' }
          ]
        });

        if (isCancel(sub) || sub === 'back') break;

        if (sub === 'list') {
          const tasks = listTasks({ status: 'pending' });
          if (tasks.length === 0) {
            log.info(pc.cyan('No pending tasks. You are all caught up!'));
          } else {
            tasks.forEach((t, i) => {
              const pColor = t.priority === 'urgent' ? pc.red : t.priority === 'high' ? pc.yellow : pc.blue;
              log.step(`${i + 1}. [${pColor(t.priority.toUpperCase())}] ${t.title} ${pc.dim(`(ID: ${t.id})`)}`);
            });
          }
        } else if (sub === 'add') {
          const title = await text({
            message: 'Task title:',
            placeholder: 'e.g. Implement Supabase RLS policies',
            validate: (val) => (!val || !val.trim() ? 'Title cannot be empty.' : undefined)
          });
          if (isCancel(title)) break;

          const priority = await select({
            message: 'Select priority:',
            options: [
              { value: 'urgent', label: '🚨 Urgent', hint: 'Top blocker' },
              { value: 'high', label: '🔥 High', hint: 'Important milestone' },
              { value: 'medium', label: '⚡ Medium', hint: 'Standard progress' },
              { value: 'low', label: '🌱 Low', hint: 'Backlog enhancement' }
            ]
          });
          if (isCancel(priority)) break;

          const created = addTask({ title, priority });
          log.success(pc.green(`✓ Task created [${created.id}]: ${created.title}`));
        } else if (sub === 'complete') {
          const tasks = listTasks({ status: 'pending' });
          if (tasks.length === 0) {
            log.warn('No pending tasks available to complete.');
            break;
          }

          const chosen = await select({
            message: 'Choose task to complete:',
            options: tasks.map((t) => ({
              value: t.id,
              label: `[${t.priority.toUpperCase()}] ${t.title}`,
              hint: t.id
            }))
          });

          if (isCancel(chosen)) break;

          const outcome = await text({
            message: 'Learned decision or result summary (optional, auto-archives to memory):',
            placeholder: 'e.g. Implemented successfully with test verification'
          });

          if (isCancel(outcome)) break;

          completeTask(chosen, { result: outcome || null, archiveToMemory: true });
          log.success(pc.green(`✓ Task [${chosen}] marked as completed!`));
          if (outcome && outcome.trim()) {
            log.info(pc.cyan(`🧠 Architectural decision archived into Memory SSOT.`));
          }
        }
        break;
      }

      case 'portability': {
        const portAction = await select({
          message: 'Sovereignty & Portability Operations:',
          options: [
            { value: 'export_md', label: '📤 Export to Obsidian PARA Markdown Vault', hint: 'Projects, Areas, Resources, Archive' },
            { value: 'export_json', label: '📦 Export to Unified JSON SSOT', hint: 'Complete database snapshot' },
            { value: 'import_json', label: '📥 Import from JSON SSOT', hint: 'Restore or sync database dump' },
            { value: 'import_md', label: '📄 Import Markdown Notes Folder', hint: 'Ingest and index notes into SQLite FTS5' },
            { value: 'back', label: '↩ Back to Main Menu', hint: 'Return' }
          ]
        });

        if (isCancel(portAction) || portAction === 'back') break;

        if (portAction === 'export_md') {
          const targetDir = await text({
            message: 'Enter destination directory:',
            placeholder: './tidy_vault',
            initialValue: './tidy_vault'
          });
          if (isCancel(targetDir)) break;
          const s = spinner();
          s.start('Exporting PARA Markdown vault...');
          const res = exportToMarkdown(targetDir);
          s.stop(pc.green(`✓ Exported ${res.totalExported} notes to ${res.targetDir}`));
        } else if (portAction === 'export_json') {
          const defaultPath = `./tidy_export_${Date.now()}.json`;
          const targetPath = await text({
            message: 'Enter output JSON file path:',
            placeholder: defaultPath,
            initialValue: defaultPath
          });
          if (isCancel(targetPath)) break;
          const s = spinner();
          s.start('Exporting JSON SSOT...');
          const res = exportToJson(targetPath);
          s.stop(pc.green(`✓ Exported ${res.totalRecords} records to ${res.filePath}`));
        } else if (portAction === 'import_json') {
          const sourcePath = await text({
            message: 'Enter path to JSON file to import:',
            placeholder: './backup.json'
          });
          if (isCancel(sourcePath) || !sourcePath) break;
          const s = spinner();
          s.start('Importing JSON SSOT...');
          try {
            const res = importFromJson(sourcePath);
            s.stop(pc.green(`✓ Ingested ${res.totalImported} records from ${res.sourceFile}`));
          } catch (err) {
            s.stop(pc.red(`Failed: ${err.message}`));
          }
        } else if (portAction === 'import_md') {
          const sourceDir = await text({
            message: 'Enter path to Markdown folder to ingest:',
            placeholder: './notes'
          });
          if (isCancel(sourceDir) || !sourceDir) break;
          const s = spinner();
          s.start('Scanning and indexing Markdown notes...');
          try {
            const res = importFromMarkdown(sourceDir);
            s.stop(pc.green(`✓ Indexed ${res.totalImported} nodes from ${res.filesProcessed} files`));
          } catch (err) {
            s.stop(pc.red(`Failed: ${err.message}`));
          }
        }
        break;
      }

      case 'prune': {
        const thresholdChoice = await select({
          message: 'Select decay score threshold for pruning ephemeral records:',
          options: [
            { value: '0.25', label: 'Standard (Score <= 25%)', hint: 'Safest recommendation' },
            { value: '0.40', label: 'Aggressive (Score <= 40%)', hint: 'Cleans older session thoughts' },
            { value: '0.10', label: 'Conservative (Score <= 10%)', hint: 'Only near-zero decay' }
          ]
        });

        if (isCancel(thresholdChoice)) break;

        const execute = await confirm({
          message: 'Run prune now? (Core and Project tier memories will NEVER be touched)',
          initialValue: true
        });

        if (isCancel(execute) || !execute) break;

        const s = spinner();
        s.start('Evaluating cognitive decay and pruning...');
        const res = pruneDecayedMemories({ threshold: parseFloat(thresholdChoice), dryRun: false });
        s.stop(pc.green(`✓ Pruned ${res.prunedCount} stale record(s).`));
        break;
      }

      case 'office': {
        if (!office) break;
        const sub = await select({
          message: 'Office Suite Operations:',
          options: [
            { value: 'cashflow', label: '📊 Financial Cashflow & P&L', hint: 'Revenue, expenses, profit' },
            { value: 'crm_list', label: '👥 CRM Client Directory', hint: 'Browse active clients' },
            { value: 'crm_add', label: '➕ Add New Client', hint: 'Register new B2B account' },
            { value: 'inv_list', label: '🧾 Invoices & Billing', hint: 'View active invoices' },
            { value: 'dossier', label: '📁 Compile AI Client Dossier', hint: 'Synthesize 3-ring context profile' },
            { value: 'back', label: '↩ Back to Main Menu', hint: 'Return' }
          ]
        });

        if (isCancel(sub) || sub === 'back') break;

        if (sub === 'cashflow') {
          const summary = office.getCashflowSummary();
          note(
            `💰 Total Revenue Collected : $${summary.totalRevenue.toFixed(2)}\n` +
            `💸 Total Expenses Paid     : $${summary.totalExpenses.toFixed(2)}\n` +
            `📈 Net Profit (Cashflow)   : $${summary.netProfit.toFixed(2)} (${summary.marginPct}% margin)\n` +
            `⏳ Pending Receivables     : $${summary.pendingReceivables.toFixed(2)}`,
            'Financial Telemetry & Cashflow'
          );
        } else if (sub === 'crm_list') {
          const clients = office.listClients({ limit: 10 });
          if (clients.length === 0) {
            log.info('No CRM clients registered yet.');
          } else {
            clients.forEach((c) => {
              log.step(`[${(c.status || 'lead').toUpperCase()}] ${c.name} (${c.company || 'Individual'}) — Budget: $${c.budget}`);
            });
          }
        } else if (sub === 'crm_add') {
          const name = await text({
            message: 'Client or Company Name:',
            validate: (v) => (!v || !v.trim() ? 'Name cannot be empty.' : undefined)
          });
          if (isCancel(name)) break;

          const company = await text({ message: 'Company Name (optional):' });
          if (isCancel(company)) break;

          const budget = await text({
            message: 'Deal Value / Budget (USD):',
            placeholder: '5000'
          });
          if (isCancel(budget)) break;

          const cl = office.addClient({
            name,
            company: company?.trim() || null,
            budget: Number(budget) || 0,
            status: 'lead'
          });
          log.success(pc.green(`✓ Client [${cl.id}] registered successfully!`));
        } else if (sub === 'inv_list') {
          const invoices = office.listInvoices({ limit: 10 });
          if (invoices.length === 0) {
            log.info('No invoices issued yet.');
          } else {
            invoices.forEach((inv) => {
              log.step(`[${inv.status.toUpperCase()}] ${inv.invoice_number}: $${inv.total_amount.toFixed(2)} (Client: ${inv.client_name || inv.client_id})`);
            });
          }
        } else if (sub === 'dossier') {
          const clients = office.listClients({ limit: 20 });
          if (clients.length === 0) {
            log.warn('No clients found. Add a client first.');
            break;
          }
          const chosen = await select({
            message: 'Select client to compile dossier for:',
            options: clients.map(c => ({
              value: c.id,
              label: `${c.name} (${c.company || 'N/A'})`,
              hint: c.id
            }))
          });
          if (isCancel(chosen)) break;

          const s = spinner();
          s.start('Synthesizing 3-Ring Evidence and institutional memory...');
          const dossier = office.compileClientDossier(chosen);
          s.stop(pc.green('✓ Executive dossier compiled!'));
          note(dossier.dossierMarkdown, `Client Dossier: ${chosen}`);
        }
        break;
      }

      case 'agent': {
        const agents = listSubagents();
        const agentChoice = await select({
          message: 'Choose specialized subagent to delegate task to:',
          options: agents.map((a) => ({
            value: a.name,
            label: `🤖 @${a.name} — ${a.role}`,
            hint: a.description
          }))
        });

        if (isCancel(agentChoice)) break;

        const taskPrompt = await text({
          message: `Enter the instruction for @${agentChoice}:`,
          placeholder: 'e.g. Review database schema and suggest optimizations',
          validate: (val) => (!val || !val.trim() ? 'Instruction cannot be empty.' : undefined)
        });

        if (isCancel(taskPrompt)) break;

        const s = spinner();
        s.start(`Injecting 3-Ring Context and delegating to @${agentChoice}...`);
        const ctx = prepareSubagentContext({ name: agentChoice, task: taskPrompt });
        s.stop(pc.green(`✓ Delegation payload prepared for @${agentChoice}:`));

        note(
          `🤖 Subagent      : @${ctx.agent.name} (${ctx.agent.role})\n` +
          `🎯 Context Scope : [${ctx.ring1_workspace.context_name}] (${ctx.ring1_workspace.domain})\n` +
          `🧠 Recalled KIs  : ${ctx.ring2_recalled_memory.length} items injected from FTS5\n` +
          `📝 Task          : ${ctx.task}\n\n` +
          `⚙️ Allowed Tools : ${JSON.stringify(ctx.agent.allowed_tools)}`,
          'Subagent Execution Packet'
        );
        break;
      }

      case 'stats': {
        const curStats = getStats();
        note(
          `📁 Database Path   : ${curStats.dbPath}\n` +
          `⚡ Journal Mode    : WAL (Write-Ahead Logging)\n` +
          `🧠 Stored Memories : ${curStats.counts.memories}\n` +
          `🎯 Workspaces      : ${curStats.counts.contexts}\n` +
          `🤖 Sub-Agents      : ${curStats.counts.subagents}\n` +
          `📋 Pending Tasks   : ${curStats.counts.tasks}\n` +
          `📝 Snippets Saved  : ${curStats.counts.snippets}\n` +
          `📓 Journal Entries : ${curStats.counts.journal}\n` +
          `🛡️ Audit Logs      : ${curStats.counts.audit_logs}`,
          'SQLite System Health'
        );
        break;
      }
    }

    console.log();
  }
}

module.exports = { runWizard };
