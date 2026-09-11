/**
 * Tidy Studio — Preload Script
 * Exposes a strictly typed contextBridge API (window.tidyApi and window.tidyApi) to the renderer.
 * ContextIsolation is strictly enabled, nodeIntegration is disabled.
 */

const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // System Health
  getStats: () => ipcRenderer.invoke('tidy:stats'),

  // Profile & Granular Persona
  getUserProfile: () => ipcRenderer.invoke('tidy:profile:get'),
  updateUserProfile: (updates) => ipcRenderer.invoke('tidy:profile:update', updates),

  // Config Provider
  listConfig: () => ipcRenderer.invoke('tidy:config:list'),
  getConfig: (key) => ipcRenderer.invoke('tidy:config:get', key),
  setConfig: (key, value) => ipcRenderer.invoke('tidy:config:set', { key, value }),

  // Governance & Rules
  getGovernanceRules: () => ipcRenderer.invoke('tidy:govern:list'),
  setGovernanceRule: (key, value) => ipcRenderer.invoke('tidy:govern:set', { key, value }),

  // Memory Operations
  recallMemory: (params) => ipcRenderer.invoke('tidy:memory:recall', params),
  saveMemory: (params) => ipcRenderer.invoke('tidy:memory:save', params),
  updateMemory: (params) => ipcRenderer.invoke('tidy:memory:update', params),
  listMemories: (params) => ipcRenderer.invoke('tidy:memory:list', params),
  forgetMemory: (id) => ipcRenderer.invoke('tidy:memory:forget', id),
  pruneMemories: (opts) => ipcRenderer.invoke('tidy:memory:prune', opts),
  harvestScan: (opts) => ipcRenderer.invoke('tidy:memory:harvest-scan', opts),
  harvestReadItem: (sourcePath) => ipcRenderer.invoke('tidy:memory:harvest-read', sourcePath),
  harvestImport: (items, options) => ipcRenderer.invoke('tidy:memory:harvest-import', { items, options }),

  // Context & Workspaces
  listContexts: () => ipcRenderer.invoke('tidy:context:list'),
  switchContext: (contextId) => ipcRenderer.invoke('tidy:context:switch', contextId),

  // Tasks App
  listTasks: (filters) => ipcRenderer.invoke('tidy:tasks:list', filters),
  addTask: (taskData) => ipcRenderer.invoke('tidy:tasks:add', taskData),
  completeTask: (id) => ipcRenderer.invoke('tidy:tasks:complete', id),

  // Snippets App
  listSnippets: (filters) => ipcRenderer.invoke('tidy:snippets:list', filters),
  addSnippet: (snippetData) => ipcRenderer.invoke('tidy:snippets:add', snippetData),
  deleteSnippet: (id) => ipcRenderer.invoke('tidy:snippets:delete', id),

  // Journal App
  listJournal: (params) => ipcRenderer.invoke('tidy:journal:list', params),
  addJournalEntry: (entryData) => ipcRenderer.invoke('tidy:journal:add', entryData),

  // Vault App
  listVaultKeys: () => ipcRenderer.invoke('tidy:vault:list'),
  getSecret: (key) => ipcRenderer.invoke('tidy:vault:get', key),
  setSecret: (params) => ipcRenderer.invoke('tidy:vault:set', params),
  deleteSecret: (key) => ipcRenderer.invoke('tidy:vault:delete', key),

  // Subagents
  listSubagents: () => ipcRenderer.invoke('tidy:subagents:list'),
  runSubagent: (params) => ipcRenderer.invoke('tidy:subagents:run', params),

  // Community Skills & Briefs
  listSkills: () => ipcRenderer.invoke('tidy:skills:list'),
  scanSkills: (dir) => ipcRenderer.invoke('tidy:skills:scan', dir),
  generateBrief: (params) => ipcRenderer.invoke('tidy:brief:generate', params),

  // Database Maintenance Operations
  backupDatabase: (targetPath) => ipcRenderer.invoke('tidy:db:backup', targetPath),
  checkpointWal: () => ipcRenderer.invoke('tidy:db:checkpoint'),
  checkIntegrity: () => ipcRenderer.invoke('tidy:db:integrity'),

  // Data Sovereignty & Portability
  exportMarkdown: (outputDir) => ipcRenderer.invoke('tidy:export:markdown', outputDir),
  exportJson: (filePath) => ipcRenderer.invoke('tidy:export:json', filePath),
  importJson: (filePath) => ipcRenderer.invoke('tidy:import:json', filePath),

  // Office Suite Operations (@tidy/office)
  office: {
    getStats: () => ipcRenderer.invoke('tidy:office:stats'),
    listClients: (params) => ipcRenderer.invoke('tidy:office:crm:list', params),
    addClient: (params) => ipcRenderer.invoke('tidy:office:crm:add', params),
    updateClient: (id, params) => ipcRenderer.invoke('tidy:office:crm:update', { id, params }),
    deleteClient: (id) => ipcRenderer.invoke('tidy:office:crm:delete', id),
    listInvoices: (params) => ipcRenderer.invoke('tidy:office:invoices:list', params),
    createInvoice: (params) => ipcRenderer.invoke('tidy:office:invoices:create', params),
    getInvoice: (id) => ipcRenderer.invoke('tidy:office:invoices:get', id),
    updateInvoiceStatus: (params) => ipcRenderer.invoke('tidy:office:invoices:status', params),
    listExpenses: (params) => ipcRenderer.invoke('tidy:office:expenses:list', params),
    addExpense: (params) => ipcRenderer.invoke('tidy:office:expenses:add', params),
    getCashflow: () => ipcRenderer.invoke('tidy:office:cashflow'),
    compileDossier: (clientId) => ipcRenderer.invoke('tidy:office:dossier', clientId)
  },

  // Universal Skills & Agents Studio
  studio: {
    scanAll: (options) => ipcRenderer.invoke('tidy:studio:scanAll', options),
    readItem: (filePath) => ipcRenderer.invoke('tidy:studio:readItem', filePath),
    saveItem: (filePath, content) => ipcRenderer.invoke('tidy:studio:saveItem', { filePath, content }),
    createItem: (params) => ipcRenderer.invoke('tidy:studio:createItem', params),
    deleteItem: (filePath) => ipcRenderer.invoke('tidy:studio:deleteItem', filePath),
    validateItem: (filePath) => ipcRenderer.invoke('tidy:studio:validateItem', filePath),
    listCollections: () => ipcRenderer.invoke('tidy:studio:collections:list'),
    createCollection: (params) => ipcRenderer.invoke('tidy:studio:collections:create', params),
    deleteCollection: (id) => ipcRenderer.invoke('tidy:studio:collections:delete', id),
    assignCollection: (params) => ipcRenderer.invoke('tidy:studio:collections:assign', params),
    removeCollection: (params) => ipcRenderer.invoke('tidy:studio:collections:remove', params),
    toggleFavorite: (params) => ipcRenderer.invoke('tidy:studio:favorites:toggle', params),
    listDiscovery: () => ipcRenderer.invoke('tidy:studio:discovery')
  },

  // MCP Studio: Multi-IDE Server Management
  mcp: {
    scan: () => ipcRenderer.invoke('tidy:mcp:scan'),
    get: (ideId) => ipcRenderer.invoke('tidy:mcp:get', ideId),
    save: (ideId, config) => ipcRenderer.invoke('tidy:mcp:save', ideId, config),
    add: (ideId, name, config) => ipcRenderer.invoke('tidy:mcp:add', ideId, name, config),
    update: (ideId, name, config) => ipcRenderer.invoke('tidy:mcp:update', ideId, name, config),
    remove: (ideId, name) => ipcRenderer.invoke('tidy:mcp:remove', ideId, name),
    clone: (sourceIdeId, targetIdeId, name, targetName) => ipcRenderer.invoke('tidy:mcp:clone', sourceIdeId, targetIdeId, name, targetName),
    catalog: () => ipcRenderer.invoke('tidy:mcp:catalog'),
    test: (ideId, name) => ipcRenderer.invoke('tidy:mcp:test', ideId, name)
  },

  // Shell / OS Operations
  shell: {
    openPath: (targetPath) => ipcRenderer.invoke('tidy:shell:openPath', targetPath)
  },

  // Sovereign Brain Engine Operations
  brain: {
    doctor: () => ipcRenderer.invoke('tidy:brain:doctor'),
    search: (params) => ipcRenderer.invoke('tidy:brain:search', params),
    extract: (params) => ipcRenderer.invoke('tidy:brain:extract', params),
    transcripts: (params) => ipcRenderer.invoke('tidy:brain:transcripts', params),
    hygiene: (params) => ipcRenderer.invoke('tidy:brain:hygiene', params),
    firewall: (params) => ipcRenderer.invoke('tidy:brain:firewall', params),
    manifest: (skillId) => ipcRenderer.invoke('tidy:brain:manifest', skillId)
  }
};

contextBridge.exposeInMainWorld('tidyApi', api);

