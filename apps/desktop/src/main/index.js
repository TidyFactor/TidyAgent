/**
 * Tidy Studio — Electron Main Process
 * Manages native window lifecycle and secure IPC bridge to @tidy/core.
 */

const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');

// Resolve @tidy/core kernel
let core;
try {
  core = require('@tidy/core');
} catch {
  try {
    core = require('../../../packages/core/src/index');
  } catch {
    core = require('../../../../packages/core/src/index');
  }
}

let office = null;
try {
  office = require('@tidy/office');
} catch {
  try {
    office = require('../../../packages/office/src/index');
  } catch {
    try {
      office = require('../../../../packages/office/src/index');
    } catch {
      office = null;
    }
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Tidy Studio — Sovereign Assistant & Memory OS',
    icon: path.join(__dirname, '../../assets/icon.png'),
    backgroundColor: '#090b10',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Remove default menu for clean, modern look
  mainWindow.setMenuBarVisibility(false);

  // Load renderer
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ----------------- IPC Handlers -----------------
function handle(channel, fn) {
  ipcMain.handle(`tidy:${channel}`, fn);
}

function registerIpcHandlers() {
  // System Health & Stats
  handle('stats', async () => {
    try {
      return { ok: true, data: core.getStats() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Profile & Granular Persona
  handle('profile:get', async () => {
    try {
      return { ok: true, data: core.getUserProfile() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('profile:update', async (_, updates) => {
    try {
      return { ok: true, data: core.updateUserProfile(updates) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Config Provider
  handle('config:list', async () => {
    try {
      return { ok: true, data: core.listConfig() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('config:get', async (_, key) => {
    try {
      return { ok: true, data: core.getConfig(key) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('config:set', async (_, { key, value }) => {
    try {
      core.setConfig(key, value);
      return { ok: true, data: { key, value } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Governance & Rules
  handle('govern:list', async () => {
    try {
      return { ok: true, data: core.getGovernanceRules() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('govern:set', async (_, { key, value }) => {
    try {
      return { ok: true, data: core.setGovernanceRule(key, value) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Memory Operations
  handle('memory:recall', async (_, { query, category, tier, limit }) => {
    try {
      const results = core.recallMemory({ query, category, tier, limit });
      return { ok: true, data: results };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:save', async (_, { content, category, importance, tier, contextId, summary }) => {
    try {
      const saved = core.saveMemory({ content, category, importance, tier, contextId, summary });
      return { ok: true, data: saved };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:update', async (_, { id, content, summary, tier, category, importance, contextId }) => {
    try {
      const updated = core.updateMemory(id, { content, summary, tier, category, importance, contextId });
      return { ok: true, data: updated };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:list', async (_, { limit, category, tier, contextId } = {}) => {
    try {
      const list = core.listMemories({ limit, category, tier, contextId });
      return { ok: true, data: list };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:forget', async (_, id) => {
    try {
      const ok = core.forgetMemory(id);
      return { ok: true, data: { deleted: ok } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:prune', async (_, opts) => {
    try {
      const res = core.pruneDecayedMemories(opts || {});
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Memory Knowledge Harvester
  handle('memory:harvest-scan', async (_, opts) => {
    try {
      const results = core.scanKnowledgeSources(opts || {});
      return { ok: true, data: results };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:harvest-read', async (_, sourcePath) => {
    try {
      const item = core.readHarvestItem(sourcePath);
      return { ok: true, data: item };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('memory:harvest-import', async (_, { items, options }) => {
    try {
      const results = core.importBatchMemories(items, options || {});
      return { ok: true, data: results };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Context & Workspaces
  handle('context:list', async () => {
    try {
      const db = core.getDb();
      const contexts = db.prepare('SELECT * FROM contexts ORDER BY is_active DESC, name ASC').all();
      return { ok: true, data: contexts };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('context:switch', async (_, contextId) => {
    try {
      const db = core.getDb();
      const target = db.prepare('SELECT * FROM contexts WHERE id = ?').get(contextId);
      if (!target) throw new Error(`Context "${contextId}" not found.`);
      db.prepare('UPDATE contexts SET is_active = 0').run();
      db.prepare('UPDATE contexts SET is_active = 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').run(contextId);
      return { ok: true, data: target };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Tasks App
  handle('tasks:list', async (_, filters) => {
    try {
      const tasks = core.listTasks(filters || {});
      return { ok: true, data: tasks };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('tasks:add', async (_, taskData) => {
    try {
      const created = core.addTask(taskData);
      return { ok: true, data: created };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('tasks:complete', async (_, id) => {
    try {
      core.completeTask(id);
      return { ok: true, data: { completed: true } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Snippets App
  handle('snippets:list', async (_, filters) => {
    try {
      const snippets = core.listSnippets(filters || {});
      return { ok: true, data: snippets };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('snippets:add', async (_, snippetData) => {
    try {
      const snip = core.addSnippet(snippetData);
      return { ok: true, data: snip };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('snippets:delete', async (_, id) => {
    try {
      const deleted = core.deleteSnippet(id);
      return { ok: true, data: { deleted } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Journal App
  handle('journal:list', async (_, { limit }) => {
    try {
      const logs = core.listJournal({ limit });
      return { ok: true, data: logs };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('journal:add', async (_, entryData) => {
    try {
      const entry = core.addJournalEntry(entryData);
      return { ok: true, data: entry };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Vault App
  handle('vault:list', async () => {
    try {
      const keys = core.listVaultKeys();
      return { ok: true, data: keys };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('vault:get', async (_, key) => {
    try {
      const val = core.getSecret(key);
      return { ok: true, data: { key, value: val } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('vault:set', async (_, { key, value }) => {
    try {
      core.setSecret({ key, value });
      return { ok: true, data: { key, saved: true } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('vault:delete', async (_, key) => {
    try {
      const deleted = core.deleteSecret(key);
      return { ok: true, data: { deleted } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Subagents
  handle('subagents:list', async () => {
    try {
      const agents = core.listSubagents();
      return { ok: true, data: agents };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('subagents:run', async (_, { name, task }) => {
    try {
      const result = core.runSubagent(name, task);
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Community Skills & Briefs
  handle('skills:list', async () => {
    try {
      const skills = core.listRegisteredSkills ? core.listRegisteredSkills() : [];
      return { ok: true, data: skills };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('skills:scan', async (_, dir) => {
    try {
      const discovered = core.discoverSkills ? core.discoverSkills(dir ? [dir] : []) : [];
      return { ok: true, data: discovered };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brief:generate', async (_, params) => {
    try {
      const brief = core.generateTaskBrief(params);
      return { ok: true, data: brief };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Database Maintenance Operations
  handle('db:backup', async (_, targetPath) => {
    try {
      const res = core.backupDatabase(targetPath);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('db:checkpoint', async () => {
    try {
      const res = core.checkpointWal();
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('db:integrity', async () => {
    try {
      const res = core.checkIntegrity();
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Data Sovereignty & Portability
  handle('export:markdown', async (_, outputDir) => {
    try {
      const res = core.exportToMarkdown(outputDir);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('export:json', async (_, filePath) => {
    try {
      const res = core.exportToJson(filePath);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('import:json', async (_, filePath) => {
    try {
      const res = core.importFromJson(filePath);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Office Suite Handlers (@tidy/office)
  handle('office:stats', async () => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const cashflow = office.getCashflowSummary();
      const clients = office.listClients({ limit: 100 });
      const invoices = office.listInvoices({ limit: 100 });
      return {
        ok: true,
        data: {
          clientsCount: clients.length,
          invoicesCount: invoices.length,
          cashflow
        }
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:crm:list', async (_, params) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const clients = office.listClients(params || {});
      return { ok: true, data: clients };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:crm:add', async (_, data) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const client = office.addClient(data);
      return { ok: true, data: client };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:crm:update', async (_, { id, params }) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const client = office.updateClient(id, params);
      return { ok: true, data: client };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:crm:delete', async (_, id) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const ok = office.deleteClient(id);
      return { ok: true, data: ok };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:invoices:list', async (_, params) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const invoices = office.listInvoices(params || {});
      return { ok: true, data: invoices };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:invoices:get', async (_, id) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const invoice = office.getInvoice(id);
      return { ok: true, data: invoice };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:invoices:create', async (_, data) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const invoice = office.createInvoice(data);
      return { ok: true, data: invoice };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:invoices:status', async (_, { id, status, amountPaid }) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const invoice = office.updateInvoiceStatus(id, status, amountPaid);
      return { ok: true, data: invoice };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:expenses:list', async (_, params) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const expenses = office.listExpenses(params || {});
      return { ok: true, data: expenses };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:expenses:add', async (_, data) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const expense = office.addExpense(data);
      return { ok: true, data: expense };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:cashflow', async () => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const cashflow = office.getCashflowSummary();
      return { ok: true, data: cashflow };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('office:dossier', async (_, clientId) => {
    try {
      if (!office) return { ok: false, error: 'Office pack not installed' };
      const dossier = office.compileClientDossier(clientId);
      return { ok: true, data: dossier };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Universal Skills & Agents Studio
  handle('studio:scanAll', async (_, options) => {
    try {
      const scanRes = core.scanAllTools(options || {});
      return { ok: true, data: scanRes };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:readItem', async (_, filePath) => {
    try {
      const item = core.readStudioItem(filePath);
      return { ok: true, data: item };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:saveItem', async (_, { filePath, content }) => {
    try {
      const res = core.saveStudioItem(filePath, content);
      if (core.invalidateScanCache) core.invalidateScanCache();
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:createItem', async (_, params) => {
    try {
      const created = core.createBoilerplate(params);
      if (core.invalidateScanCache) core.invalidateScanCache();
      return { ok: true, data: created };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:deleteItem', async (_, filePath) => {
    try {
      const deleted = core.deleteStudioItem(filePath);
      if (core.invalidateScanCache) core.invalidateScanCache();
      return { ok: true, data: { deleted } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:validateItem', async (_, filePath) => {
    try {
      const report = core.validateSkill(filePath);
      return { ok: true, data: report };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:collections:list', async () => {
    try {
      const cols = core.listCollections();
      return { ok: true, data: cols };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:collections:create', async (_, params) => {
    try {
      const col = core.createCollection(params);
      return { ok: true, data: col };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:collections:delete', async (_, id) => {
    try {
      const deleted = core.deleteCollection(id);
      return { ok: true, data: { deleted } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:collections:assign', async (_, { collectionId, itemPath, itemType, tool }) => {
    try {
      core.assignItemToCollection(collectionId, itemPath, itemType, tool);
      return { ok: true, data: { assigned: true } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:collections:remove', async (_, { collectionId, itemPath }) => {
    try {
      core.removeItemFromCollection(collectionId, itemPath);
      return { ok: true, data: { removed: true } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:favorites:toggle', async (_, { itemPath, itemType, tool }) => {
    try {
      const fav = core.toggleFavorite(itemPath, itemType, tool);
      return { ok: true, data: fav };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('studio:discovery', async () => {
    try {
      const catalog = core.listDiscoveryCatalog();
      return { ok: true, data: catalog };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // MCP Studio: Multi-IDE Server Management
  handle('mcp:scan', async () => {
    try {
      const data = core.scanAllMcpServers();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:get', async (_, ideId) => {
    try {
      const data = core.getMcpConfig(ideId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:save', async (_, ideId, config) => {
    try {
      const res = core.saveMcpConfig(ideId, config);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:add', async (_, ideId, name, config) => {
    try {
      const res = core.addMcpServer(ideId, name, config);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:update', async (_, ideId, name, config) => {
    try {
      const res = core.updateMcpServer(ideId, name, config);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:remove', async (_, ideId, name) => {
    try {
      const res = core.removeMcpServer(ideId, name);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:clone', async (_, sourceIdeId, targetIdeId, name, targetName) => {
    try {
      const res = core.cloneMcpServer(sourceIdeId, targetIdeId, name, targetName);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:catalog', async () => {
    try {
      const catalog = core.listMcpCatalog();
      return { ok: true, data: catalog };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('mcp:test', async (_, ideId, name) => {
    try {
      const res = core.testMcpServer(ideId, name);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // ---------------- Sovereign Brain Engine IPCs ----------------
  handle('brain:doctor', async () => {
    try {
      const res = core.runSystemDoctor();
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brain:search', async (_, params) => {
    try {
      const res = core.searchHybridKnowledge(params);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brain:extract', async (_, params) => {
    try {
      const res = core.extractAndPersistKi(params);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brain:transcripts', async (_, params) => {
    try {
      const res = core.recallSessionTranscripts(params);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brain:hygiene', async (_, params) => {
    try {
      const res = core.auditStorageHygiene(params);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brain:firewall', async (_, params) => {
    try {
      const res = core.checkContextualFirewall(params);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  handle('brain:manifest', async (_, skillId) => {
    try {
      const res = core.getSkillManifest(skillId);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Native OS Shell operations
  handle('shell:openPath', async (_, targetPath) => {
    try {
      if (!targetPath) return { ok: false, error: 'Path required' };
      const err = await shell.openPath(targetPath);
      if (err) return { ok: false, error: err };
      return { ok: true, data: { opened: targetPath } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

// App Lifecycle
app.whenReady().then(() => {
  // Ensure DB is bootstrapped
  core.initDatabase();

  registerIpcHandlers();
  createWindow();

  // Register Global Summon Shortcut (Alt+Space)
  try {
    globalShortcut.register('Alt+Space', () => {
      if (mainWindow) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (e) {
    // ignore if hotkey registration fails on some window managers
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch (e) {}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
