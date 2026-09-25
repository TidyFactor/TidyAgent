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
const { saveMemory, updateMemory, recallMemory, forgetMemory, listMemories, calculateCognitiveScore, pruneDecayedMemories } = require('../scripts/memory');
const { addTask, listTasks, completeTask, addSnippet, listSnippets, deleteSnippet, addJournalEntry, listJournal, setSecret, getSecret, deleteSecret } = require('../scripts/apps');
const { listSubagents, runSubagent } = require('../scripts/subagents');
const { exportToMarkdown, exportToJson, importFromJson, importFromMarkdown } = require('../scripts/portability');
const { getConfig, setConfig, listConfig, deleteConfig, getUserProfile, updateUserProfile, getGovernanceRules, setGovernanceRule } = require('../scripts/governance');
const {
  scanKnowledgeSources,
  importBatchMemories,
  getIdeProfiles,
  listMcpCatalog,
  addMcpServer,
  getMcpConfig,
  updateMcpServer,
  removeMcpServer,
  cloneMcpServer,
  testMcpServer,
  scanAllMcpServers,
  setConfigPathOverride,
  clearConfigPathOverrides,
  // Control Plane APIs (v1.6.0)
  MEMORY_TAXONOMIES,
  normalizeTaxonomy,
  isValidTaxonomy,
  classifyMemoryTaxonomy,
  listTaxonomies,
  TIER_NAMES,
  estimateTokenCount,
  compileContext,
  INTENT_TYPES,
  routeIntent
} = require('../packages/core/src');

const {
  getHostAdapter,
  listSupportedHosts,
  getPluginManifest,
  generateOpenApiSpec,
  generateAiPluginManifest,
  exportHostConfiguration
} = require('../packages/plugin/src');

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

test('updateMemory updates memory content and triggers FTS5 sync', () => {
  assert.ok(savedMemoryId);
  const updated = updateMemory(savedMemoryId, {
    content: 'Tidy uses native node:sqlite for extreme high-speed portability',
    importance: 4
  });
  assert.strictEqual(updated.importance, 4);
  const searchAfter = recallMemory('extreme');
  assert.ok(searchAfter.length > 0, 'Updated content should be indexed in FTS5');
});

test('forgetMemory removes memory from DB and triggers FTS5 sync', () => {
  assert.ok(savedMemoryId, 'Saved memory ID exists');
  const forgotten = forgetMemory(savedMemoryId);
  assert.strictEqual(forgotten, true);
  const searchAfter = recallMemory('extreme');
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
  assert.ok(TOOLS.find(t => t.name === 'tidy_harvest_scan'), 'tidy_harvest_scan tool should be registered');
  assert.ok(TOOLS.find(t => t.name === 'tidy_harvest_read'), 'tidy_harvest_read tool should be registered');
  assert.ok(TOOLS.find(t => t.name === 'tidy_harvest_import'), 'tidy_harvest_import tool should be registered');
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

console.log('\n[13] Universal Skills & Agents Studio (v1.4.4) Tests');
const {
  scanAllTools,
  readStudioItem,
  saveStudioItem,
  validateSkill,
  createBoilerplate,
  listCollections,
  createCollection,
  deleteCollection,
  assignItemToCollection,
  removeItemFromCollection,
  toggleFavorite,
  listFavorites,
  listDiscoveryCatalog
} = require('../packages/core/src');
const { updateSubagent, toggleSubagent, deleteSubagent, registerSubagent, getSubagent } = require('../packages/core/src/subagents');
const { createSkill, updateSkill, toggleSkill, deleteSkill, getRegisteredSkill: fetchRegisteredSkill } = require('../packages/core/src/skills-loader');

test('Subagents CRUD: create, update, toggle, delete subagent', () => {
  const agent = registerSubagent({
    name: 'test_architect',
    role: 'System Architect',
    description: 'Designs high-scale distributed systems',
    systemPrompt: 'You are a lead system architect.',
    allowedTools: ['tidy_recall', 'tidy_task_add']
  });
  assert.strictEqual(agent.name, 'test_architect');
  assert.strictEqual(agent.role, 'System Architect');

  // Update
  const updated = updateSubagent('test_architect', { role: 'Principal Architect' });
  assert.strictEqual(updated.role, 'Principal Architect');

  // Toggle
  const toggled = toggleSubagent('test_architect', false);
  assert.strictEqual(toggled.is_enabled, 0);

  // Delete
  const deleted = deleteSubagent('test_architect');
  assert.ok(deleted);
  assert.strictEqual(getSubagent('test_architect'), null);
});

test('Skills CRUD: create, update, toggle, delete skill with subagent sync', () => {
  const skill = createSkill({
    name: 'tidyfactor-test-skill',
    alias: 'test_skill',
    description: 'A test skill for Studio',
    domain: 'ops',
    allowedTools: ['tidy_memorize']
  });
  assert.strictEqual(skill.alias, 'test_skill');
  assert.strictEqual(skill.domain, 'ops');

  // Verify linked subagent was auto-registered
  const linkedAgent = getSubagent('test_skill');
  assert.ok(linkedAgent, 'Linked subagent should be created');
  assert.strictEqual(linkedAgent.role, 'tidyfactor-test-skill');

  // Update
  const updated = updateSkill('test_skill', { description: 'Updated test skill description' });
  assert.strictEqual(updated.description, 'Updated test skill description');

  // Toggle
  const toggled = toggleSkill('test_skill', false);
  assert.strictEqual(toggled.is_enabled, 0);

  // Delete
  const deleted = deleteSkill('test_skill', true);
  assert.ok(deleted);
  assert.ok(!getRegisteredSkill('test_skill'));
  assert.ok(!getSubagent('test_skill'), 'Linked agent should be cleaned up');
});

test('Studio Collections & Favorites: SQLite SSOT tagging without modifying files', () => {
  const col = createCollection({ name: 'Security Audits', color: '#ef4444', icon: 'shield' });
  assert.strictEqual(col.name, 'Security Audits');

  const samplePath = path.join(TEST_DIR, 'sample-skill', 'SKILL.md');
  assignItemToCollection(col.id, samplePath, 'skill', 'claude');

  const cols = listCollections();
  const foundCol = cols.find(c => c.id === col.id);
  assert.ok(foundCol);
  assert.strictEqual(foundCol.itemsCount, 1);

  // Favorites toggle
  const fav1 = toggleFavorite(samplePath, 'skill', 'claude');
  assert.strictEqual(fav1.isFavorite, true);

  const favList = listFavorites();
  assert.ok(favList.some(f => f.item_path === samplePath));

  const fav2 = toggleFavorite(samplePath, 'skill', 'claude');
  assert.strictEqual(fav2.isFavorite, false);

  // Remove and delete collection
  removeItemFromCollection(col.id, samplePath);
  deleteCollection(col.id);
  assert.ok(!listCollections().some(c => c.id === col.id));
});

test('Boilerplate Generator & File I/O: generates valid Claude/Cursor templates', () => {
  const targetDir = path.join(TEST_DIR, 'generated-skill');
  const res = createBoilerplate({
    tool: 'claude',
    type: 'skill',
    name: 'quick-crawler',
    description: 'Scrapes targeted documentation sites',
    targetDir
  });

  assert.ok(fs.existsSync(res.filePath));
  assert.ok(res.content.includes('name: "quick-crawler"'));

  // Read item
  const item = readStudioItem(res.filePath);
  assert.strictEqual(item.frontmatter.name, 'quick-crawler');
  assert.ok(item.charCount > 0);

  // Edit and Save Item (Cmd+S simulation)
  const modifiedContent = res.content + '\n<!-- edited by test -->';
  const saveRes = saveStudioItem(res.filePath, modifiedContent);
  assert.ok(saveRes.ok);

  const reRead = readStudioItem(res.filePath);
  assert.ok(reRead.rawContent.includes('<!-- edited by test -->'));
});

test('Skills-LAB 15 Rules Validator: audits SKILL.md compliance', () => {
  const targetDir = path.join(TEST_DIR, 'generated-skill');
  const skillFile = path.join(targetDir, 'SKILL.md');

  const report = validateSkill(skillFile);
  assert.strictEqual(report.valid, true);
  assert.ok(report.score >= 80);
  assert.ok(report.checks.length >= 5);
});

test('Multi-Tool Scanner: discovers tools and handles catalog', () => {
  const catalog = listDiscoveryCatalog();
  assert.ok(catalog.length >= 5);
  assert.ok(catalog.some(c => c.name === 'tidyfactor-doc'));

  const scan = scanAllTools({ cwd: process.cwd(), customDirs: [TEST_DIR] });
  assert.ok(scan.total >= 1);
  assert.ok(scan.tools.global);
});

console.log('\n[12] Knowledge Harvester & Agent Brain Extractor Tests');
test('Knowledge Harvester: scans agent sources and extracts candidate memories', () => {
  // Setup simulated agent knowledge folder in test dir
  const agentDir = path.join(TEST_DIR, 'simulated-agent');
  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(
    path.join(agentDir, 'architecture-decision.md'),
    `---
domain: Architecture
scope: global
---
# Adopt SQLite WAL Mode for Single Source of Truth
We decided to adopt SQLite WAL mode to ensure multi-process concurrency across CLI, Electron, and Web.
`
  );

  const scanRes = scanKnowledgeSources({ customDirs: [agentDir], checkExisting: true });
  assert.ok(scanRes.totalScanned > 0, 'Should discover items');
  const found = scanRes.items.find(i => i.title.includes('Adopt SQLite WAL Mode'));
  assert.ok(found, 'Should find simulated agent decision');
  assert.strictEqual(found.category, 'decision');
  assert.strictEqual(found.alreadyImported, false);
});

test('Knowledge Harvester: batch imports candidate memories into SQLite SSOT', () => {
  const itemsToImport = [
    {
      title: 'Decoupled Context Engine',
      summary: 'Separates 3-Ring context layers into Core, Domain, and Task rings',
      content: 'The 3-Ring context builder partitions cognitive memory into permanent Core truth, contextual Domain rules, and active Task parameters.',
      category: 'pattern',
      tier: 'core',
      importance: 5
    },
    {
      title: 'Contextual Firewall Boundary',
      summary: 'Prevents dev context bleed into marketing workflows',
      content: 'Strict domain boundaries and contextual firewall boundary prevent development code snippets from polluting marketing workflows and sales pitch context windows.',
      category: 'rule',
      tier: 'project',
      importance: 4
    }
  ];

  const importRes = importBatchMemories(itemsToImport);
  assert.strictEqual(importRes.ok, true);
  assert.strictEqual(importRes.importedCount, 2);

  // Verify memories exist in DB and FTS5
  const recalled = recallMemory({ query: 'bleed marketing', bypassFirewall: true });
  assert.ok(recalled.length > 0, 'FTS5 should index batch imported items');
  assert.ok(recalled.some(m => m.summary.includes('marketing workflows') || m.content.includes('marketing workflows')));

  // Test duplication detection on subsequent scan
  const db = getDb();
  const checkStmt = db.prepare('SELECT id FROM memory_nodes WHERE summary = ?');
  const found = checkStmt.get('Prevents dev context bleed into marketing workflows');
  assert.ok(found, 'Memory should be stored in memory_nodes table');
});

console.log('\n[14] MCP Studio (Multi-IDE Server Management) Tests');
test('MCP Studio: Registry exposes all 5 IDE profiles with schema awareness', () => {
  const profiles = getIdeProfiles();
  assert.ok(profiles.antigravity, 'Should include Antigravity profile');
  assert.ok(profiles.cursor, 'Should include Cursor profile');
  assert.ok(profiles.vscode, 'Should include VS Code profile');
  assert.ok(profiles.claude, 'Should include Claude profile');
  assert.ok(profiles.windsurf, 'Should include Windsurf profile');

  assert.strictEqual(profiles.vscode.rootKey, 'servers', 'VS Code must use "servers" rootKey');
  assert.strictEqual(profiles.antigravity.rootKey, 'mcpServers', 'Antigravity must use "mcpServers" rootKey');
  assert.strictEqual(profiles.cursor.rootKey, 'mcpServers', 'Cursor must use "mcpServers" rootKey');
});

test('MCP Studio: Verified catalog lists pre-seeded servers', () => {
  const catalog = listMcpCatalog();
  assert.ok(catalog.length >= 7, 'Catalog should contain at least 7 verified servers');
  const sqlite = catalog.find(c => c.id === 'sqlite');
  assert.ok(sqlite, 'Catalog should have sqlite server');
  assert.strictEqual(sqlite.category, 'database');
  const brain = catalog.find(c => c.id === 'tidy-brain');
  assert.ok(brain, 'Catalog should have Tidy Sovereign MCP server');
});

test('MCP Studio: Server CRUD, atomic file safety, and cross-IDE cloning', () => {
  const testHome = path.join(TEST_DIR, 'mock-home');
  const antigravityConfigPath = path.join(testHome, '.gemini', 'config', 'mcp_config.json');
  const vscodeConfigPath = path.join(testHome, '.vscode', 'mcp.json');

  fs.mkdirSync(path.dirname(antigravityConfigPath), { recursive: true });
  fs.mkdirSync(path.dirname(vscodeConfigPath), { recursive: true });

  fs.writeFileSync(antigravityConfigPath, JSON.stringify({ mcpServers: {} }), 'utf8');
  fs.writeFileSync(vscodeConfigPath, JSON.stringify({ servers: {} }), 'utf8');

  // Override paths cleanly for isolated testing
  setConfigPathOverride('antigravity', antigravityConfigPath);
  setConfigPathOverride('vscode', vscodeConfigPath);

  // 1. Add server to Antigravity
  const addRes = addMcpServer('antigravity', 'test-sqlite', {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    env: { TEST_ENV: '1' }
  });
  assert.strictEqual(addRes.ok, true);

  // Verify file on disk
  const cfg = getMcpConfig('antigravity');
  assert.strictEqual(cfg.exists, true);
  assert.strictEqual(cfg.serverCount, 1);
  assert.ok(cfg.servers['test-sqlite']);
  assert.strictEqual(cfg.servers['test-sqlite'].command, 'npx');

  // 2. Update server in Antigravity
  const updateRes = updateMcpServer('antigravity', 'test-sqlite', {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '--readonly'],
    env: { TEST_ENV: '2' }
  });
  assert.strictEqual(updateRes.ok, true);
  const updatedCfg = getMcpConfig('antigravity');
  assert.deepStrictEqual(updatedCfg.servers['test-sqlite'].args, ['-y', '@modelcontextprotocol/server-sqlite', '--readonly']);

  // 3. Clone server from Antigravity (rootKey: mcpServers) to VS Code (rootKey: servers)
  const cloneRes = cloneMcpServer('antigravity', 'vscode', 'test-sqlite', 'cloned-sqlite');
  assert.strictEqual(cloneRes.ok, true);

  const vscodeCfg = getMcpConfig('vscode');
  assert.strictEqual(vscodeCfg.exists, true);
  assert.ok(vscodeCfg.servers['cloned-sqlite'], 'Server should be cloned to VS Code');
  assert.strictEqual(vscodeCfg.servers['cloned-sqlite'].command, 'npx');

  // Verify raw VS Code config has "servers" rootKey, not "mcpServers"
  assert.ok(vscodeCfg.raw.servers);
  assert.strictEqual(vscodeCfg.raw.mcpServers, undefined);

  // 4. Test server command diagnostic
  const testRes = testMcpServer('antigravity', 'test-sqlite');
  assert.strictEqual(typeof testRes.ok, 'boolean');

  // 5. Remove server from Antigravity
  const remRes = removeMcpServer('antigravity', 'test-sqlite');
  assert.strictEqual(remRes.ok, true);
  const afterRem = getMcpConfig('antigravity');
  assert.strictEqual(afterRem.serverCount, 0);
  assert.strictEqual(afterRem.servers['test-sqlite'], undefined);

  // Clean up overrides
  clearConfigPathOverrides();
});

console.log('\n[14] Tidy Sovereign Brain MCP Engine (v1.5.0) Tests');
const {
  runSystemDoctor,
  searchHybridKnowledge,
  extractAndPersistKi,
  recallSessionTranscripts,
  auditStorageHygiene,
  checkContextualFirewall,
  getSkillManifest: inspectSkillManifest
} = require('../packages/core/src');
const {
  TOOLS: mcpTools,
  RESOURCES: mcpResources,
  PROMPTS: mcpPrompts,
  handleToolCall,
  handleResourceRead,
  handlePromptGet
} = require('../packages/mcp/src/server');

test('Brain Doctor: SQLite SSOT, WAL mode, taxonomy, and storage diagnostics', () => {
  const doc = runSystemDoctor();
  assert.ok(doc.status === 'HEALTHY' || doc.status === 'WARNING', `Doctor status was ${doc.status}`);
  assert.strictEqual(doc.db.walMode, 'wal');
  assert.strictEqual(doc.db.integrityOk, true);
  assert.ok(typeof doc.db.memoryCount === 'number');
  assert.ok(doc.taxonomy.tiers.global);
  assert.ok(doc.taxonomy.tiers.tech);
  assert.ok(doc.markdownReport.includes('Tidy Brain Doctor Report'));
});

test('Atomic KI Extractor: Mandatory negative constraint & dual-write SQLite sync', () => {
  const ki = extractAndPersistKi({
    id: 'KI-Test-WAL-Performance',
    title: 'Test SQLite WAL Concurrency Tuning',
    rule: 'Always set PRAGMA journal_mode = WAL and synchronous = NORMAL.',
    triggerContext: 'When initializing local-first databases.',
    negativeConstraint: 'Never use DELETE journal mode in multi-process setups.',
    scope: 'tech',
    domain: 'Database',
    importance: 5
  });

  assert.strictEqual(ki.ok, true);
  assert.strictEqual(ki.id, 'KI-Test-WAL-Performance');
  assert.strictEqual(ki.dualIndexed, true);
  assert.ok(fs.existsSync(ki.filePath));

  // Verify file content has frontmatter
  const content = fs.readFileSync(ki.filePath, 'utf8');
  assert.ok(content.includes('negative_constraint:'));
  assert.ok(content.includes('Never use DELETE journal mode in multi-process setups.'));

  // Test Non-negotiable Cognitive Invariant: Mandatory Negative Constraint
  assert.throws(() => {
    extractAndPersistKi({
      id: 'KI-Invalid-Test',
      title: 'Invalid KI without negative boundary',
      rule: 'Some rule',
      negativeConstraint: '' // Missing!
    });
  }, /Mandatory negative constraint is missing/);

  // Clean up test KI file
  try { fs.unlinkSync(ki.filePath); } catch {}
});

test('Hybrid Knowledge Search: Unified recall across SQLite and 4-tier disk files', () => {
  const res = searchHybridKnowledge({
    query: 'WAL mode',
    scope: 'all',
    limit: 5
  });

  assert.strictEqual(res.query, 'WAL mode');
  assert.ok(Array.isArray(res.matches));
  assert.ok(res.matches.length > 0, 'Should find WAL mode in memory or knowledge files');
  assert.ok(res.matches.some(m => m.source === 'sqlite' || m.source === 'disk'));
});

test('Contextual Domain Firewall: Strict isolation and zero context bleed', () => {
  // 1. Clean engineering text in Dev mode -> Compliant
  const cleanDev = checkContextualFirewall({
    text: 'Refactor database indexing to use composite FTS5 keys.',
    activeMode: 'dev'
  });
  assert.strictEqual(cleanDev.compliant, true);
  assert.strictEqual(cleanDev.score, 100);

  // 2. Marketing bleed in Dev mode -> Contaminated
  const contaminatedDev = checkContextualFirewall({
    text: 'Use the AIDA framework to craft a high conversion landing page hook with FOMO.',
    activeMode: 'dev'
  });
  assert.strictEqual(contaminatedDev.compliant, false);
  assert.ok(contaminatedDev.violations.includes('aida framework'));
  assert.ok(contaminatedDev.violations.includes('fomo'));
  assert.ok(contaminatedDev.score < 100);

  // 3. Low-level dev bleed in Marketing mode -> Contaminated
  const contaminatedMarketing = checkContextualFirewall({
    text: 'Our product helps clients run SELECT * FROM users and check PRAGMA journal_mode.',
    activeMode: 'marketing'
  });
  assert.strictEqual(contaminatedMarketing.compliant, false);
  assert.ok(contaminatedMarketing.violations.includes('select * from'));
  assert.ok(contaminatedMarketing.violations.includes('pragma journal_mode'));
});

test('Storage Hygiene: Safe dry-run inspection of recordings and cache artifacts', () => {
  const hygiene = auditStorageHygiene({ daysThreshold: 30, dryRun: true });
  assert.strictEqual(hygiene.dryRun, true);
  assert.strictEqual(hygiene.action, 'audit_only');
  assert.strictEqual(typeof hygiene.candidateCount, 'number');
  assert.strictEqual(typeof hygiene.candidateMb, 'number');
  assert.strictEqual(hygiene.deletedFilesCount, 0, 'Dry-run must never delete files');
});

test('Skill Manifest Inspector: 15-rules compliance scoring', () => {
  const manifest = inspectSkillManifest('tidy');
  assert.ok(manifest.id.includes('tidy'));
  assert.ok(manifest.commands.length > 0);
  assert.ok(manifest.complianceScore.includes('/15'));
  assert.strictEqual(manifest.isCompliant, true);
});

test('Stdio MCP Server: Tools fleet, dynamic resources, and Prompts protocol', () => {
  // 1. Verify 8 brain tools registered
  const toolNames = mcpTools.map(t => t.name);
  const requiredTools = [
    'tidy_doctor',
    'tidy_search',
    'tidy_extract',
    'tidy_transcripts',
    'tidy_hygiene',
    'tidy_firewall',
    'tidy_manifest',
    'tidy_whoami'
  ];
  for (const name of requiredTools) {
    assert.ok(toolNames.includes(name), `Missing required MCP tool: ${name}`);
  }

  // 2. Test handleToolCall for tidy_doctor
  const docResult = handleToolCall('tidy_doctor', {});
  assert.ok(docResult.content[0].text.includes('Tidy Brain Doctor Report'));

  // 3. Test handleToolCall for tidy_whoami
  const whoResult = handleToolCall('tidy_whoami', {});
  const whoData = JSON.parse(whoResult.content[0].text);
  assert.strictEqual(whoData.version, '1.5.0');
  assert.ok(whoData.sqlite_db);

  // 4. Test live dynamic resources
  const resDoc = handleResourceRead('tidy://brain/doctor');
  assert.strictEqual(resDoc.contents[0].mimeType, 'application/json');
  const resTaxonomy = handleResourceRead('tidy://brain/taxonomy');
  assert.ok(resTaxonomy.contents[0].text.includes('global'));

  // 5. Test MCP Prompts protocol
  assert.ok(mcpPrompts.length >= 3);
  const promptResult = handlePromptGet('tidy_prompt_task_brief', { title: 'Implement Auth' });
  assert.ok(promptResult.messages[0].content.text.includes('Implement Auth'));
  const shortPrompt = handlePromptGet('brief', { title: 'Implement Auth' });
  assert.ok(shortPrompt.messages[0].content.text.includes('Implement Auth'));
});

console.log('\n[15] TidyAgent Sovereign Control Plane & Universal Host Plugin Engine (v1.6.0) Tests');

test('Memory Taxonomy: normalization, aliases, classification, and schema specs', () => {
  // 1. Authoritative 8 taxonomies list
  const allTaxonomies = listTaxonomies();
  assert.strictEqual(allTaxonomies.length, 8, 'Must declare exactly 8 canonical taxonomies');

  // 2. Normalization & Aliases
  assert.strictEqual(normalizeTaxonomy('adr'), 'decisions');
  assert.strictEqual(normalizeTaxonomy('rule'), 'lessons');
  assert.strictEqual(normalizeTaxonomy('gotcha'), 'lessons');
  assert.strictEqual(normalizeTaxonomy('style'), 'preferences');
  assert.strictEqual(normalizeTaxonomy('brand'), 'assets');
  assert.strictEqual(normalizeTaxonomy('deliverable'), 'previous_outputs');
  assert.strictEqual(normalizeTaxonomy('truth'), 'facts');
  assert.strictEqual(normalizeTaxonomy('client'), 'relationships');

  // 3. Validation
  assert.ok(isValidTaxonomy('facts'));
  assert.ok(isValidTaxonomy('decisions'));
  assert.ok(isValidTaxonomy('negative constraint'));
  assert.strictEqual(isValidTaxonomy('unknown_garbage_xyz'), false);

  // 4. Heuristic Classification
  assert.strictEqual(classifyMemoryTaxonomy('ممنوع نهائيا تشغيل المتصفح'), 'lessons');
  assert.strictEqual(classifyMemoryTaxonomy('Never execute destructive operations without preview'), 'lessons');
  assert.strictEqual(classifyMemoryTaxonomy('قرار معماري: اعتماد SQLite WAL mode'), 'decisions');
  assert.strictEqual(classifyMemoryTaxonomy('Brand color palette: primary #003366'), 'assets');
  assert.strictEqual(classifyMemoryTaxonomy('API reference endpoint https://api.tidyfactor.com'), 'references');
  assert.strictEqual(classifyMemoryTaxonomy('Approved deliverable invoice #INV-2026-001'), 'previous_outputs');
  assert.strictEqual(classifyMemoryTaxonomy('Normal empirical fact about server node'), 'facts');
});

test('Context Compiler: 5-tier assembly, token budgeting, and zero-slop formatting', () => {
  // 1. Token estimation
  const count = estimateTokenCount('TidyAgent Sovereign Control Plane Engine');
  assert.ok(count > 0 && count < 25);

  // 2. 5-Tier Assembly (Markdown format)
  const compiledMd = compileContext({
    tiers: {
      global: 'Principal: Wael | Tone: Concise Expert',
      project: 'Workspace: TidyAgent Core | Domain: general',
      task: 'Build 5-tier context compiler engine',
      session: 'Session checkpoint: tests pass',
      working: 'Active file: packages/core/src/context-compiler.js'
    },
    maxTokens: 3000,
    format: 'markdown'
  });

  assert.ok(compiledMd.compiledPrompt.includes('Tier 1: Global Context'));
  assert.ok(compiledMd.compiledPrompt.includes('Tier 2: Project Context'));
  assert.ok(compiledMd.compiledPrompt.includes('Tier 3: Task Context'));
  assert.ok(compiledMd.compiledPrompt.includes('Tier 4: Session Context'));
  assert.ok(compiledMd.compiledPrompt.includes('Tier 5: Working Context'));
  assert.strictEqual(compiledMd.format, 'markdown');
  assert.ok(compiledMd.totalEstimatedTokens > 0);
  assert.ok(compiledMd.tokenBreakdown.task.allocatedBudget > 0);

  // 3. System Prompt Format
  const compiledSys = compileContext({
    tiers: {
      global: 'Persona: Principal Wael',
      task: 'Execute code refactor'
    },
    format: 'system_prompt'
  });
  assert.ok(compiledSys.compiledPrompt.includes('=== TIDYAGENT COMPILED CONTEXT (ZERO-SLOP RUNTIME) ==='));
  assert.ok(compiledSys.compiledPrompt.includes('[TIER 1: GLOBAL CONSTRAINTS & PERSONA]'));
  assert.ok(compiledSys.compiledPrompt.includes('[TIER 3: ACTIVE TASK & OBJECTIVE]'));

  // 4. JSON Format
  const compiledJson = compileContext({
    tiers: { task: 'JSON export test' },
    format: 'json'
  });
  const parsed = JSON.parse(compiledJson.compiledPrompt);
  assert.strictEqual(parsed.version, '1.6.0');
  assert.strictEqual(parsed.compiler, 'TidyAgent Context Compiler');
  assert.ok(parsed.tiers.task.includes('JSON export test'));

  // 5. Budget enforcement & safe truncation
  const veryLongText = 'repeating statement with excessive length. '.repeat(500);
  const constrained = compileContext({
    tiers: { task: veryLongText },
    maxTokens: 50 // Very small budget
  });
  assert.ok(constrained.compiledPrompt.includes('truncated by Tidy Context Compiler'));
});

test('Intent Router: capability-first matching, max 3 skills invariant, and MCP tool routing', () => {
  // 1. Marketing Intent & Capability Routing
  const marketingRoute = routeIntent('اعمل اعلان لمنتج Livianaturals مع الحفاظ على شكل العبوة وكتابة كوبي تسويقي');
  assert.strictEqual(marketingRoute.intentType, INTENT_TYPES.MARKETING_COPY);
  assert.strictEqual(marketingRoute.domain, 'marketing');
  assert.ok(marketingRoute.targetSkills.length <= 3, 'Capability-First Invariant: maximum 3 skills');
  assert.ok(marketingRoute.targetSkills.includes('tidyfactor-marketing'));
  assert.ok(marketingRoute.recommendedTools.includes('tidy_recall'));

  // 2. Sysadmin Ops Intent
  const opsRoute = routeIntent('افحص حالة سيرفر cpanel والذاكرة ومشاكل الـ firewall في الخادم');
  assert.strictEqual(opsRoute.intentType, INTENT_TYPES.SYSADMIN_OPS);
  assert.strictEqual(opsRoute.domain, 'ops');
  assert.ok(opsRoute.targetSkills.includes('ops-cpanel'));
  assert.ok(opsRoute.recommendedTools.includes('tidy_doctor'));

  // 3. Invoicing & Commerce Intent
  const invoiceRoute = routeIntent('انشئ فاتورة جديدة بقيمة 1500 دولار للعميل شركة الأمل واضفها في كشف التدفق النقدي cashflow');
  assert.strictEqual(invoiceRoute.intentType, INTENT_TYPES.INVOICING_COMMERCE);
  assert.ok(invoiceRoute.recommendedTools.includes('tidy_invoice_create'));
  assert.ok(invoiceRoute.recommendedTools.includes('tidy_cashflow_summary'));
});

test('Universal Host Plugin & Adapters (@tidy/plugin): manifest and multi-host adapters', () => {
  // 1. Manifest
  const manifest = getPluginManifest();
  assert.strictEqual(manifest.name_for_model, 'tidyagent');
  assert.strictEqual(manifest.version, '1.6.0');
  assert.ok(manifest.capabilities.context_compiler);
  assert.ok(manifest.capabilities.memory_taxonomy);

  // 2. Supported Hosts
  const hosts = listSupportedHosts();
  assert.ok(hosts.includes('chatgpt'));
  assert.ok(hosts.includes('claude'));
  assert.ok(hosts.includes('cursor'));
  assert.ok(hosts.includes('codex'));
  assert.ok(hosts.includes('antigravity'));

  // 3. Claude Code Adapter
  const claudeAdapter = getHostAdapter('claude');
  const claudePrompt = claudeAdapter.formatPrompt('Implement feature', {
    tiers: { task: 'Add OAuth2 verification' }
  });
  assert.strictEqual(claudePrompt.prompt, 'Implement feature');
  assert.ok(claudePrompt.system.includes('Tier 3: Task Context'));
  assert.strictEqual(claudePrompt.metadata.host, 'claude');

  // 4. Cursor Bridge Adapter
  const cursorAdapter = getHostAdapter('cursor');
  const ruleContent = cursorAdapter.generateRuleContent({
    tiers: { task: 'Project Rule' }
  });
  assert.ok(ruleContent.includes('---'));
  assert.ok(ruleContent.includes('alwaysApply: true'));
  assert.ok(ruleContent.includes('TidyAgent Sovereign Control Plane Context'));

  // 5. ChatGPT Plugin Adapter
  const gptAdapter = getHostAdapter('chatgpt');
  const gptMsg = gptAdapter.formatPrompt('Optimize DB', {
    tiers: { task: 'Index optimization' }
  });
  assert.strictEqual(gptMsg.role, 'system');
  assert.strictEqual(gptMsg.user_message, 'Optimize DB');

  // 6. Antigravity IDE Adapter
  const agyAdapter = getHostAdapter('antigravity');
  const agyContext = agyAdapter.formatContext('تصميم واجهة مستخدم فاخرة', {
    tiers: { task: 'Design luxury UI' }
  });
  assert.ok(agyContext.compiledMarkdown.includes('Tier 3: Task Context'));
  assert.ok(Array.isArray(agyContext.targetSkills));
  assert.ok(Array.isArray(agyContext.recommendedTools));

  // 7. Parameter Normalization & Detailed Classification
  const flatCompiled = claudeAdapter.compile({ task: 'Build microservice', domain: 'dev' });
  assert.ok(flatCompiled.compiledPrompt.includes('Tier 3: Task Context'));
  assert.ok(flatCompiled.totalEstimatedTokens > 0);

  const detailedClassification = claudeAdapter.classifyDetails('قرار معماري: استخدام SQLite WAL mode');
  assert.strictEqual(detailedClassification.taxonomy, 'decisions');
  assert.strictEqual(detailedClassification.canonical_taxonomy, 'decisions');
  assert.ok(detailedClassification.confidence >= 0.7);
  assert.ok(detailedClassification.rationale.length > 0);
  assert.strictEqual(detailedClassification.metadata.defaultTier, 'core');
});

test('Universal Host Plugin: OpenAPI 3.1 & AI Plugin Manifest Generation', () => {
  const spec = generateOpenApiSpec({ serverUrl: 'https://test.tidyfactor.com' });
  assert.strictEqual(spec.openapi, '3.1.0');
  assert.ok(spec.paths['/api/v1/context/compile']);
  assert.ok(spec.paths['/api/v1/intent/route']);
  assert.ok(spec.paths['/api/v1/taxonomy/classify']);
  assert.ok(spec.paths['/api/mcp/sse']);
  assert.strictEqual(spec.servers[0].url, 'https://test.tidyfactor.com');

  const aiPlugin = generateAiPluginManifest({ baseUrl: 'https://test.tidyfactor.com' });
  assert.strictEqual(aiPlugin.schema_version, 'v1');
  assert.strictEqual(aiPlugin.name_for_model, 'tidyagent');
  assert.ok(aiPlugin.api.url.includes('/.well-known/openapi.json'));
});

test('Universal Host Plugin: exportHostConfiguration across all 5 platforms', () => {
  // 1. Claude
  const claudeConfig = exportHostConfiguration('claude', { token: 'tok_123' });
  assert.ok(claudeConfig.desktopConfig.mcpServers.tidy.url.includes('tok_123'));
  assert.ok(claudeConfig.claudeMd.includes('CLAUDE.md'));

  // 2. Cursor
  const cursorConfig = exportHostConfiguration('cursor', { useLocal: true });
  assert.ok(cursorConfig.mcpConfig.mcpServers['tidy-brain'].command);
  assert.ok(cursorConfig.ruleContent.includes('alwaysApply: true'));

  // 3. ChatGPT
  const chatgptConfig = exportHostConfiguration('chatgpt');
  assert.ok(chatgptConfig.openapi);
  assert.ok(chatgptConfig.aiPlugin);
  assert.ok(chatgptConfig.customGptPrompt.includes('TidyAgent Sovereign Assistant'));

  // 4. Codex
  const codexConfig = exportHostConfiguration('codex');
  assert.ok(codexConfig.codexConfig.mcpServers.tidy);

  // 5. Antigravity
  const agyConfig = exportHostConfiguration('antigravity', { token: 'tok_agy' });
  assert.ok(agyConfig.mcpConfig.mcpServers['tidyfactor-brain'].url.includes('tok_agy'));
  assert.ok(agyConfig.geminiRule.includes('GEMINI.md'));
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
