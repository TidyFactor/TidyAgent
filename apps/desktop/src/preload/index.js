/**
 * Tidy Studio — Preload Script
 * Exposes a strictly typed contextBridge API (window.tidyApi and window.tidyApi) to the renderer.
 * ContextIsolation is strictly enabled, nodeIntegration is disabled.
 */

const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // System Health
  getStats: () => ipcRenderer.invoke('tidy:stats'),

  // Memory Operations
  recallMemory: (params) => ipcRenderer.invoke('tidy:memory:recall', params),
  saveMemory: (params) => ipcRenderer.invoke('tidy:memory:save', params),
  listMemories: (params) => ipcRenderer.invoke('tidy:memory:list', params),
  forgetMemory: (id) => ipcRenderer.invoke('tidy:memory:forget', id),

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
  }
};

contextBridge.exposeInMainWorld('tidyApi', api);

