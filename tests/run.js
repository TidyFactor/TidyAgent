/**
 * Tidy Automated Test Suite
 * Zero-dependency unit & integration test runner for SQLite SSOT, Memory, Apps, Subagents.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

// Point to isolated test database
const TEST_DIR = path.join(os.tmpdir(), `tidy_test_${Date.now()}`);
fs.mkdirSync(TEST_DIR, { recursive: true });
const TEST_DB = path.join(TEST_DIR, 'tidy_test.db');
process.env.TIDY_DB = TEST_DB;

console.log('='.repeat(60));
console.log('  RUNNING TIDY TEST SUITE');
console.log(`  Isolated Test DB: ${TEST_DB}`);
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

const { initDatabase, getDb, getStats, backupDatabase, checkpointWal, checkIntegrity } = require('../scripts/db');
const { saveMemory, recallMemory, forgetMemory, listMemories, calculateCognitiveScore, pruneDecayedMemories } = require('../scripts/memory');
const { addTask, listTasks, completeTask, addSnippet, listSnippets, deleteSnippet, addJournalEntry, listJournal, setSecret, getSecret, deleteSecret } = require('../scripts/apps');
const { listSubagents, runSubagent } = require('../scripts/subagents');
const { exportToMarkdown, exportToJson, importFromJson, importFromMarkdown } = require('../scripts/portability');
const { getConfig, setConfig, listConfig, deleteConfig, getUserProfile, updateUserProfile, getGovernanceRules, setGovernanceRule } = require('../scripts/governance');

console.log('\n[1] Database Bootstrap & Schema Tests');
test('Database initializes with tables and WAL mode', () => {
  const db = initDatabase(TEST_DB);
  assert.ok(db, 'DB instance should be created');
  const stats = getStats();
  assert.strictEqual(stats.profile.assistant_name, 'Tidy', 'Assistant name should be Tidy');
  assert.strictEqual(stats.activeContext.domain, 'general');
  assert.ok(stats.counts.subagents >= 4, 'Pre-seeded subagents should be loaded');
});

console.log('\n[2] Memory & FTS5 BM25 Engine Tests');
let savedMemoryId;
test('saveMemory inserts a fact into memory_nodes and FTS5', () => {
  const mem = saveMemory({
    content: 'Tidy uses native node:sqlite for zero-dependency portability',
    category: 'decision',
    importance: 5
  });
  assert.ok(mem.id, 'Memory ID should be returned');
  assert.strictEqual(mem.category, 'decision');
  savedMemoryId = mem.id;
});

test('saveMemory handles Arabic text content properly', () => {
  const memAr = saveMemory({
    content: 'نظام تايدي يوفر واجهة طرفية حديثة تدعم اللغة العربية والإنجليزية',
    category: 'fact',
    importance: 4
  });
  assert.ok(memAr.id);
});

test('recallMemory retrieves matching memory via FTS5 BM25', () => {
  const results = recallMemory('portability');
  assert.ok(results.length > 0, 'Should find memory by keyword portability');
  assert.ok(results[0].content.includes('node:sqlite'));
});

test('recallMemory retrieves Arabic tokens via FTS5 unicode61', () => {
  const resultsAr = recallMemory('واجهة');
  assert.ok(resultsAr.length > 0, 'Should find memory by Arabic keyword');
});

test('forgetMemory removes memory from DB and triggers FTS5 sync', () => {
  assert.ok(savedMemoryId, 'Saved memory ID exists');
  const forgotten = forgetMemory(savedMemoryId);
  assert.strictEqual(forgotten, true);
  const searchAfter = recallMemory('portability');
  assert.strictEqual(searchAfter.length, 0, 'Deleted memory should no longer be recalled');
});

console.log('\n[3] Micro-Apps (Tasks, Snippets, Journal, Vault) Tests');
let taskId;
test('Tasks App: can add, list, and complete tasks', () => {
  const task = addTask({
    title: 'Audit database performance',
    priority: 'urgent',
    tags: ['perf', 'sqlite']
  });
  assert.ok(task.id);
  taskId = task.id;

  const pending = listTasks({ status: 'pending' });
  assert.ok(pending.some(t => t.id === taskId));

  const done = completeTask(taskId);
  assert.strictEqual(done, true);

  const completed = listTasks({ status: 'completed' });
  assert.ok(completed.some(t => t.id === taskId));
});

test('Snippets App: can store and list code snippets', () => {
  const snip = addSnippet({
    title: 'sqlite_wal',
    language: 'sql',
    code: 'PRAGMA journal_mode = WAL;'
  });
  assert.ok(snip.id);
  const list = listSnippets({ language: 'sql' });
  assert.ok(list.length > 0);
  assert.strictEqual(list[0].language, 'sql');
});

test('Snippets App: can delete snippet by ID', () => {
  const snip = addSnippet({ title: 'to_delete', language: 'bash', code: 'echo "hello"' });
  assert.ok(snip.id);
  const ok = deleteSnippet(snip.id);
  assert.strictEqual(ok, true);
  const found = listSnippets().some(s => s.id === snip.id);
  assert.strictEqual(found, false);
});

test('Journal App: can record reflections', () => {
  const entry = addJournalEntry({
    title: 'Release Validation',
    entry: 'Successfully validated Tidy v1.1.0 release',
    mood: 'focused',
    tags: ['release']
  });
  assert.ok(entry.id);
  const logs = listJournal({ limit: 5 });
  assert.ok(logs.length > 0);
});

test('Vault App: can store and retrieve secret key-value pairs', () => {
  setSecret({ key: 'TEST_API_KEY', value: 'sk_tidy_secret_12345' });
  const val = getSecret('TEST_API_KEY');
  assert.strictEqual(val, 'sk_tidy_secret_12345');
});

test('Vault App: can delete secret key', () => {
  setSecret({ key: 'DEL_KEY', value: 'to_be_deleted' });
  assert.strictEqual(getSecret('DEL_KEY'), 'to_be_deleted');
  const ok = deleteSecret('DEL_KEY');
  assert.strictEqual(ok, true);
  assert.strictEqual(getSecret('DEL_KEY'), null);
});

console.log('\n[4] Subagents Delegation Tests');
test('Subagents: pre-seeded specialized roles exist', () => {
  const agents = listSubagents();
  const names = agents.map(a => a.name);
  assert.ok(names.includes('planner'), 'Should have planner subagent');
  assert.ok(names.includes('coder'), 'Should have coder subagent');
  assert.ok(names.includes('researcher'), 'Should have researcher subagent');
  assert.ok(names.includes('scribe'), 'Should have scribe subagent');
});

test('Subagents: can delegate task and inject context rings', () => {
  const res = runSubagent('planner', 'Create an execution roadmap for v1.1.0 release');
  assert.ok(res.subagent, 'Planner agent should respond');
  assert.ok(res.output.includes('3-Ring Context Injected'));
  assert.ok(res.memoryNodeId, 'Delegation result should be recorded to memory');
});

console.log('\n[5] Community Skills-as-Agents & Brief Generator Tests');
const { discoverSkills, listRegisteredSkills, getRegisteredSkill, registerSkillFromPath } = require('../scripts/skills-loader');
const { generateTaskBrief } = require('../scripts/brief-generator');

test('Skills Loader: discovers and registers community skills as subagents', () => {
  const discovered = discoverSkills();
  assert.ok(discovered.length > 0, 'Should discover at least 1 community skill in Skills-LAB');
  const skills = listRegisteredSkills();
  assert.ok(skills.length > 0, 'Registered skills table should contain discovered skills');
});

test('Task Domain & Assigned Agent: can create and filter domain-specific tasks', () => {
  const marketingTask = addTask({
    title: 'Draft Solopreneur launch strategy for MENA region',
    priority: 'high',
    domain: 'marketing',
    assignedAgent: 'marketing',
    tags: ['launch', 'mena']
  });
  assert.ok(marketingTask.id);
  assert.strictEqual(marketingTask.domain, 'marketing');
  assert.strictEqual(marketingTask.assignedAgent, 'marketing');

  const marketingList = listTasks({ domain: 'marketing' });
  assert.ok(marketingList.some(t => t.id === marketingTask.id));
});

test('Brief Generator: synthesizes 3-Ring context into a self-contained Markdown Brief', () => {
  const brief = generateTaskBrief({
    taskTitle: 'Build secure authentication module for Next.js',
    taskDescription: 'Implement session cookies and Supabase RLS policies',
    agentName: 'coder',
    domain: 'tech',
    verificationGates: [
      'Pass all unit tests in tests/',
      'Verify zero security leaks in logs'
    ]
  });

  assert.ok(brief.briefMarkdown, 'Brief Markdown must be generated');
  assert.ok(brief.briefMarkdown.includes('# TASK BRIEF: Build secure authentication module'));
  assert.ok(brief.briefMarkdown.includes('### Ring 0: Principal & Persona'));
  assert.ok(brief.briefMarkdown.includes('### Ring 1: Workspace & Operational Domain'));
  assert.ok(brief.briefMarkdown.includes('### Ring 2: Active Memory & Established Decisions'));
  assert.ok(brief.briefMarkdown.includes('## 4. Verification Gates'));
  assert.ok(brief.briefMarkdown.includes('Pass all unit tests in tests/'));
});

console.log('\n[6] SQLite Maintenance & Diagnostics Tests');
test('Database Maintenance: checkpointWal executes successfully', () => {
  const res = checkpointWal();
  assert.strictEqual(res.success, true);
});

test('Database Maintenance: checkIntegrity verifies clean database', () => {
  const res = checkIntegrity();
  assert.strictEqual(res.ok, true);
});

test('Database Maintenance: backupDatabase creates valid SQLite snapshot', () => {
  const backup = backupDatabase();
  assert.strictEqual(backup.success, true);
  assert.ok(fs.existsSync(backup.backupPath));
  assert.ok(backup.sizeBytes > 0);
  try { fs.unlinkSync(backup.backupPath); } catch {}
});

console.log('\n[7] Microkernel Pluggable Packs & @tidy/office Integration Tests');
test('Microkernel: core provides registerSchema extension API', () => {
  const { registerSchema } = require('../packages/core/src/index');
  assert.strictEqual(typeof registerSchema, 'function');
});

test('Office Pack: @tidy/office loads and registers schema into active SQLite instance', () => {
  const office = require('../packages/office/src/index');
  assert.strictEqual(typeof office.addClient, 'function');
  assert.strictEqual(typeof office.createInvoice, 'function');
  assert.strictEqual(typeof office.getCashflowSummary, 'function');
  const client = office.addClient({ name: 'Integration Test Client', budget: 10000 });
  assert.ok(client.id);
  assert.strictEqual(client.name, 'Integration Test Client');
});

test('MCP Server: dynamically exposes Office Suite tools and cashflow resource', () => {
  const { TOOLS, RESOURCES } = require('../packages/mcp/src/server');
  assert.ok(TOOLS.find(t => t.name === 'tidy_crm_list'), 'tidy_crm_list tool should be registered');
  assert.ok(TOOLS.find(t => t.name === 'tidy_invoice_create'), 'tidy_invoice_create tool should be registered');
  assert.ok(TOOLS.find(t => t.name === 'tidy_cashflow_summary'), 'tidy_cashflow_summary tool should be registered');
  assert.ok(TOOLS.find(t => t.name === 'tidy_client_dossier'), 'tidy_client_dossier tool should be registered');
  assert.ok(RESOURCES.find(r => r.uri === 'tidy://office/cashflow'), 'tidy://office/cashflow resource should be registered');
});

test('CLI Suite: bin/tidy.js executes crm and cashflow subcommands successfully', () => {
  const { execSync } = require('child_process');
  const outCrm = execSync(`node bin/tidy.js crm list`, { env: { ...process.env, TIDY_DB: TEST_DB } }).toString();
  assert.ok(outCrm.includes('CRM Clients'));
  const outCashflow = execSync(`node bin/tidy.js cashflow`, { env: { ...process.env, TIDY_DB: TEST_DB } }).toString();
  assert.ok(outCashflow.includes('Financial Cashflow & Operations Overview'));
});

console.log('\n[8] Cognitive Memory & Domain Firewall Tests');
test('calculateCognitiveScore: core tier never decays while ephemeral decays over time', () => {
  const now = new Date();
  const pastTime = new Date(now.getTime() - (24 * 3600 * 1000)).toISOString();

  const coreNode = { tier: 'core', category: 'fact', importance: 5, access_count: 0, last_accessed_at: pastTime };
  const ephemNode = { tier: 'ephemeral', category: 'fact', importance: 5, access_count: 0, last_accessed_at: pastTime };

  const coreScore = calculateCognitiveScore(coreNode, now);
  const ephemScore = calculateCognitiveScore(ephemNode, now);

  assert.strictEqual(coreScore.decayScore, 1.0, 'Core tier decay score must be 1.0');
  assert.ok(ephemScore.decayScore < 0.5, 'Ephemeral tier must decay significantly after 24 hours');
});

test('calculateCognitiveScore: access count reinforces effective score', () => {
  const node0 = { tier: 'project', category: 'decision', importance: 4, access_count: 0 };
  const node10 = { tier: 'project', category: 'decision', importance: 4, access_count: 10 };

  const score0 = calculateCognitiveScore(node0);
  const score10 = calculateCognitiveScore(node10);

  assert.ok(score10.effectiveScore > score0.effectiveScore, 'Higher access count must increase effective score');
});

test('Domain Firewall: firewalls marketing context from dev workspace unless bypassed', () => {
  const db = getDb();
  const devCtx = db.prepare("SELECT id FROM contexts WHERE domain = 'dev'").get();
  const mktCtx = db.prepare("SELECT id FROM contexts WHERE domain = 'marketing'").get();

  const mktMem = saveMemory({
    content: 'Meta Ads Q4 Budget allocation is confidential to growth team',
    category: 'fact',
    tier: 'project',
    contextId: mktCtx.id
  });

  const devRecalls = recallMemory({ query: 'Meta Ads', domain: 'dev', bypassFirewall: false });
  assert.strictEqual(devRecalls.length, 0, 'Marketing memory must be firewalled in dev domain');

  const bypassed = recallMemory({ query: 'Meta Ads', domain: 'dev', bypassFirewall: true });
  assert.ok(bypassed.length > 0, 'Memory should be retrievable when firewall is bypassed');
  assert.ok(bypassed.some(m => m.id === mktMem.id));
});

test('Smart Prune: pruneDecayedMemories safely removes stale ephemeral memories', () => {
  const db = getDb();
  const oldDate = new Date(Date.now() - (48 * 3600 * 1000)).toISOString();
  db.prepare(`
    INSERT INTO memory_nodes (id, context_id, tier, category, content, summary, importance, access_count, decay_score, created_at, last_accessed_at)
    VALUES ('mem_stale_test', 'ctx_general', 'ephemeral', 'fact', 'Stale ephemeral test node', 'Stale', 1, 0, 0.05, ?, ?)
  `).run(oldDate, oldDate);

  const pruneResult = pruneDecayedMemories({ threshold: 0.3, olderThanHours: 24, dryRun: false });
  assert.ok(pruneResult.prunedCount >= 1, 'Should prune at least one decayed ephemeral memory');

  const check = db.prepare("SELECT id FROM memory_nodes WHERE id = 'mem_stale_test'").get();
  assert.strictEqual(check, undefined, 'Stale memory must be deleted');
});

console.log('\n[9] Autonomous Task-to-Memory Loop Tests');
test('completeTask: auto-archives learned decision outcome into Memory SSOT', () => {
  const newTask = addTask({
    title: 'Migrate to SQLite WAL mode',
    priority: 'high',
    domain: 'dev'
  });
  assert.ok(newTask.id);

  const done = completeTask(newTask.id, {
    result: 'WAL mode enabled with 64MB cache and NORMAL synchronous for zero lockups',
    archiveToMemory: true,
    category: 'decision'
  });
  assert.strictEqual(done, true);

  const recalled = recallMemory({ query: 'zero lockups', domain: 'dev' });
  assert.ok(recalled.length > 0, 'Archived task outcome must be retrievable via FTS5 BM25');
  assert.ok(recalled[0].content.includes('WAL mode enabled'));
  assert.strictEqual(recalled[0].category, 'decision');
});

console.log('\n[10] Data Sovereignty & Portability (Export & Import) Tests');
test('exportToMarkdown: exports Obsidian PARA-compliant vault structure', () => {
  const outVault = path.join(TEST_DIR, 'obsidian_vault');
  const res = exportToMarkdown(outVault);
  assert.strictEqual(res.success, true);
  assert.ok(fs.existsSync(path.join(outVault, 'Projects')));
  assert.ok(fs.existsSync(path.join(outVault, 'Areas')));
  assert.ok(fs.existsSync(path.join(outVault, 'Resources')));
  assert.ok(fs.existsSync(path.join(outVault, 'Archive')));
  assert.ok(res.totalExported > 0);
});

test('exportToJson & importFromJson: round-trip atomic snapshot restoration', () => {
  const outJson = path.join(TEST_DIR, 'snapshot.json');
  const expRes = exportToJson(outJson);
  assert.strictEqual(expRes.success, true);
  assert.ok(fs.existsSync(outJson));
  assert.ok(expRes.totalRecords > 0);

  const impRes = importFromJson(outJson);
  assert.strictEqual(impRes.success, true);
  assert.ok(impRes.totalImported > 0);
});

test('importFromMarkdown: scans and indexes external markdown notes', () => {
  const notesDir = path.join(TEST_DIR, 'test_notes');
  fs.mkdirSync(notesDir, { recursive: true });
  fs.writeFileSync(
    path.join(notesDir, 'auth_rule.md'),
    '---\ntitle: JWT Auth Rule\ncategory: rule\nimportance: 5\n---\nAll API requests must carry signed bearer tokens.'
  );

  const res = importFromMarkdown(notesDir);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.totalImported, 1);

  const found = recallMemory({ query: 'bearer tokens', bypassFirewall: true });
  assert.ok(found.length > 0);
  assert.strictEqual(found[0].category, 'rule');
});

console.log('\n[11] Fast Developer CLI One-Liners Tests');
test('CLI One-Liners: who, m, q, task, tasks execute successfully', () => {
  const { execSync } = require('child_process');
  const env = { ...process.env, TIDY_DB: TEST_DB };

  // 1. tidy who
  const whoOut = execSync('node bin/tidy.js who', { env }).toString();
  assert.ok(whoOut.includes('Firewall Mode'));

  // 2. tidy m (memo)
  const memoOut = execSync('node bin/tidy.js m "CLI rule: Keep SQLite in WAL mode" --cat rule --imp 5', { env }).toString();
  assert.ok(memoOut.includes('Saved memory'));

  // 3. tidy q (recall)
  const qOut = execSync('node bin/tidy.js q "Keep SQLite in WAL mode" --bypass', { env }).toString();
  assert.ok(qOut.includes('Recall results'));
  assert.ok(qOut.includes('RULE'));

  // 4. tidy task & tasks
  const taskOut = execSync('node bin/tidy.js task "End to end test task" --priority urgent --domain dev', { env }).toString();
  assert.ok(taskOut.includes('Task Created'));

  const tasksOut = execSync('node bin/tidy.js tasks --pending', { env }).toString();
  assert.ok(tasksOut.includes('End to end test task'));
});

console.log('\n[12] Core Governance, Granular Profile & Central Settings Engine Tests');
test('getConfig and setConfig: stores and retrieves system configurations', () => {
  setConfig('app_cluster', 'production-west');
  assert.strictEqual(getConfig('app_cluster'), 'production-west');
  assert.strictEqual(getConfig('missing_key', 'fallback'), 'fallback');

  const configs = listConfig();
  assert.ok(configs.some(c => c.key === 'app_cluster'));

  const deleted = deleteConfig('app_cluster');
  assert.strictEqual(deleted, true);
  assert.strictEqual(getConfig('app_cluster'), null);
});

test('getUserProfile & updateUserProfile: granular preferences & persona updates', () => {
  const initial = getUserProfile();
  assert.strictEqual(initial.assistant_name, 'Tidy');

  const updated = updateUserProfile({
    userName: 'Lead Architect',
    role: 'Staff Principal Engineer',
    theme: 'system',
    currency: 'SAR',
    timeFormat: '12h',
    preferences: { customKey: 123 }
  });

  assert.strictEqual(updated.user_name, 'Lead Architect');
  assert.strictEqual(updated.role, 'Staff Principal Engineer');
  assert.strictEqual(updated.theme, 'system');
  assert.strictEqual(updated.currency, 'SAR');
  assert.strictEqual(updated.time_format, '12h');
  assert.strictEqual(updated.preferences.customKey, 123);

  // Verify persistence across calls
  const persisted = getUserProfile();
  assert.strictEqual(persisted.user_name, 'Lead Architect');
});

test('getGovernanceRules & setGovernanceRule: firewall & retention policy governance', () => {
  const rules = getGovernanceRules();
  assert.strictEqual(rules.firewall_policy, 'strict');
  assert.strictEqual(rules.memory_decay, 'enabled');

  const updatedRules = setGovernanceRule('firewall_policy', 'permissive');
  assert.strictEqual(updatedRules.firewall_policy, 'permissive');
  assert.strictEqual(getGovernanceRules().firewall_policy, 'permissive');

  // Revert rule
  setGovernanceRule('firewall_policy', 'strict');
});

test('CLI One-Liners: tidy govern and tidy cfg execute successfully', () => {
  const { execSync } = require('child_process');
  const env = { ...process.env, TIDY_DB: TEST_DB };

  const govOut = execSync('node bin/tidy.js govern', { env }).toString();
  assert.ok(govOut.includes('Governance & Context Firewall Policies'));

  const cfgOut = execSync('node bin/tidy.js cfg list', { env }).toString();
  assert.ok(cfgOut.includes('System Configuration'));
});

// Cleanup test DB
try {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
} catch {
  // Ignore temp cleanup errors on windows locks
}

console.log('\n' + '=' .repeat(60));
console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('=' .repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
}
