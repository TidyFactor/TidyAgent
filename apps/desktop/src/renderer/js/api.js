/**
 * Tidy Unified API Client Module
 * Interfaces seamlessly with Electron IPC (window.tidyApi) or Web REST APIs.
 */
const electronApi = window.tidyApi;

window.api = {
  // System Health & Stats
  getStats: async () => {
    if (electronApi?.getStats) return electronApi.getStats();
    return fetch('/api/stats').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Profile & Persona
  getUserProfile: async () => {
    if (electronApi?.getUserProfile) return electronApi.getUserProfile();
    return fetch('/api/profile').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  updateUserProfile: async (updates) => {
    if (electronApi?.updateUserProfile) return electronApi.updateUserProfile(updates);
    return fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Governance & Rules
  getGovernanceRules: async () => {
    if (electronApi?.getGovernanceRules) return electronApi.getGovernanceRules();
    return fetch('/api/govern').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  setGovernanceRule: async (key, value) => {
    if (electronApi?.setGovernanceRule) return electronApi.setGovernanceRule(key, value);
    return fetch('/api/govern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Config Provider
  listConfig: async () => {
    if (electronApi?.listConfig) return electronApi.listConfig();
    return fetch('/api/config').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  getConfig: async (key) => {
    if (electronApi?.getConfig) return electronApi.getConfig(key);
    return fetch(`/api/config?key=${encodeURIComponent(key)}`).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  setConfig: async (key, value) => {
    if (electronApi?.setConfig) return electronApi.setConfig(key, value);
    return fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Data Sovereignty & Portability
  exportMarkdown: async (outputDir) => {
    if (electronApi?.exportMarkdown) return electronApi.exportMarkdown(outputDir);
    return fetch('/api/export/markdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputDir })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  exportJson: async () => {
    if (electronApi?.exportJson) return electronApi.exportJson();
    return fetch('/api/export/json').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  importJson: async (payload) => {
    if (electronApi?.importJson) return electronApi.importJson(payload);
    return fetch('/api/import/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Context & Workspaces
  listContexts: async () => {
    if (electronApi?.listContexts) return electronApi.listContexts();
    return fetch('/api/contexts').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  switchContext: async (contextId) => {
    if (electronApi?.switchContext) return electronApi.switchContext(contextId);
    return fetch('/api/contexts/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contextId })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Memory Operations
  recallMemory: async (params) => {
    if (electronApi?.recallMemory) return electronApi.recallMemory(params);
    const q = params?.query || '';
    const cat = params?.category || '';
    const tier = params?.tier || '';
    return fetch(`/api/memories?query=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}&tier=${encodeURIComponent(tier)}`)
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  saveMemory: async (data) => {
    if (electronApi?.saveMemory) return electronApi.saveMemory(data);
    return fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  updateMemory: async (params) => {
    if (electronApi?.updateMemory) return electronApi.updateMemory(params);
    return fetch(`/api/memories/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  listMemories: async (params) => {
    if (electronApi?.listMemories) return electronApi.listMemories(params);
    const cat = params?.category || '';
    const tier = params?.tier || '';
    return fetch(`/api/memories?category=${encodeURIComponent(cat)}&tier=${encodeURIComponent(tier)}`)
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  forgetMemory: async (id) => {
    if (electronApi?.forgetMemory) return electronApi.forgetMemory(id);
    return fetch(`/api/memories/${id}`, { method: 'DELETE' })
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  pruneMemories: async (opts) => {
    if (electronApi?.pruneMemories) return electronApi.pruneMemories(opts);
    return fetch('/api/memories/prune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts || {})
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  harvestScan: async (opts) => {
    if (electronApi?.harvestScan) return electronApi.harvestScan(opts);
    return fetch('/api/memories/harvest/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts || {})
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  harvestReadItem: async (sourcePath) => {
    if (electronApi?.harvestReadItem) return electronApi.harvestReadItem(sourcePath);
    return fetch('/api/memories/harvest/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  harvestImport: async (items, options) => {
    if (electronApi?.harvestImport) return electronApi.harvestImport(items, options);
    return fetch('/api/memories/harvest/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, options })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Tasks App
  listTasks: async (filters) => {
    if (electronApi?.listTasks) return electronApi.listTasks(filters);
    const status = filters?.status || '';
    const domain = filters?.domain || '';
    return fetch(`/api/tasks?status=${encodeURIComponent(status)}&domain=${encodeURIComponent(domain)}`)
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  addTask: async (data) => {
    if (electronApi?.addTask) return electronApi.addTask(data);
    return fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  completeTask: async (id) => {
    if (electronApi?.completeTask) return electronApi.completeTask(id);
    return fetch(`/api/tasks/${id}/complete`, { method: 'POST' })
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Snippets App
  listSnippets: async (filters) => {
    if (electronApi?.listSnippets) return electronApi.listSnippets(filters);
    const lang = filters?.language || '';
    const search = filters?.search || '';
    return fetch(`/api/snippets?language=${encodeURIComponent(lang)}&search=${encodeURIComponent(search)}`)
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  addSnippet: async (data) => {
    if (electronApi?.addSnippet) return electronApi.addSnippet(data);
    return fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  deleteSnippet: async (id) => {
    if (electronApi?.deleteSnippet) return electronApi.deleteSnippet(id);
    return fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Journal App
  listJournal: async (params) => {
    if (electronApi?.listJournal) return electronApi.listJournal(params);
    const limit = params?.limit || 20;
    return fetch(`/api/journal?limit=${limit}`)
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  addJournalEntry: async (data) => {
    if (electronApi?.addJournalEntry) return electronApi.addJournalEntry(data);
    return fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Vault App
  listVaultKeys: async () => {
    if (electronApi?.listVaultKeys) return electronApi.listVaultKeys();
    return fetch('/api/vault').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  getSecret: async (key) => {
    if (electronApi?.getSecret) return electronApi.getSecret(key);
    return fetch(`/api/vault/${encodeURIComponent(key)}`).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  setSecret: async (data) => {
    if (electronApi?.setSecret) return electronApi.setSecret(data);
    return fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  deleteSecret: async (key) => {
    if (electronApi?.deleteSecret) return electronApi.deleteSecret(key);
    return fetch(`/api/vault/${encodeURIComponent(key)}`, { method: 'DELETE' })
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Subagents & Community Skills
  listSubagents: async () => {
    if (electronApi?.listSubagents) return electronApi.listSubagents();
    return fetch('/api/subagents').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  runSubagent: async (data) => {
    if (electronApi?.runSubagent) return electronApi.runSubagent(data);
    return fetch('/api/subagents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  listSkills: async () => {
    if (electronApi?.listSkills) return electronApi.listSkills();
    return fetch('/api/skills').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  scanSkills: async (dir) => {
    if (electronApi?.scanSkills) return electronApi.scanSkills(dir);
    return fetch('/api/skills/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  generateBrief: async (data) => {
    if (electronApi?.generateBrief) return electronApi.generateBrief(data);
    return fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Universal Skills & Agents Studio
  studio: {
    scanAll: async (options) => {
      if (electronApi?.studio?.scanAll) return electronApi.studio.scanAll(options);
      const params = new URLSearchParams();
      params.set('_t', String(Date.now()));
      if (options?.force) params.set('force', '1');
      if (options?.tool) params.set('tool', options.tool);
      if (options?.type) params.set('type', options.type);
      if (options?.search) params.set('search', options.search);
      if (options?.collection) params.set('collection', options.collection);
      if (options?.favorites) params.set('favorites', '1');
      return fetch(`/api/studio/items?${params.toString()}`, { cache: 'no-store' }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    readItem: async (filePath) => {
      if (electronApi?.studio?.readItem) return electronApi.studio.readItem(filePath);
      return fetch(`/api/studio/item?path=${encodeURIComponent(filePath)}&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    saveItem: async (filePath, content) => {
      if (electronApi?.studio?.saveItem) return electronApi.studio.saveItem(filePath, content);
      return fetch('/api/studio/item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ path: filePath, content })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    createItem: async (params) => {
      if (electronApi?.studio?.createItem) return electronApi.studio.createItem(params);
      return fetch('/api/studio/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(params)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    deleteItem: async (filePath) => {
      if (electronApi?.studio?.deleteItem) return electronApi.studio.deleteItem(filePath);
      return fetch('/api/studio/item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ path: filePath })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    validateItem: async (filePath) => {
      if (electronApi?.studio?.validateItem) return electronApi.studio.validateItem(filePath);
      return fetch('/api/studio/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    listCollections: async () => {
      if (electronApi?.studio?.listCollections) return electronApi.studio.listCollections();
      return fetch('/api/studio/collections').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    createCollection: async (params) => {
      if (electronApi?.studio?.createCollection) return electronApi.studio.createCollection(params);
      return fetch('/api/studio/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    deleteCollection: async (id) => {
      if (electronApi?.studio?.deleteCollection) return electronApi.studio.deleteCollection(id);
      return fetch(`/api/studio/collections/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    assignCollection: async (params) => {
      if (electronApi?.studio?.assignCollection) return electronApi.studio.assignCollection(params);
      return fetch('/api/studio/collections/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    removeCollection: async (params) => {
      if (electronApi?.studio?.removeCollection) return electronApi.studio.removeCollection(params);
      return fetch('/api/studio/collections/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    toggleFavorite: async (params) => {
      if (electronApi?.studio?.toggleFavorite) return electronApi.studio.toggleFavorite(params);
      return fetch('/api/studio/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    getDiscoveryCatalog: async () => {
      if (electronApi?.studio?.getDiscoveryCatalog) return electronApi.studio.getDiscoveryCatalog();
      return fetch('/api/studio/discovery').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    }
  },

  // Database Maintenance Operations
  backupDatabase: async (targetPath) => {
    if (electronApi?.backupDatabase) return electronApi.backupDatabase(targetPath);
    return fetch('/api/db/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPath })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  checkpointWal: async () => {
    if (electronApi?.checkpointWal) return electronApi.checkpointWal();
    return fetch('/api/db/checkpoint', { method: 'POST' })
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },
  checkIntegrity: async () => {
    if (electronApi?.checkIntegrity) return electronApi.checkIntegrity();
    return fetch('/api/db/integrity', { method: 'POST' })
      .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
  },

  // Office Suite Operations (@tidy/office)
  office: {
    getStats: async () => {
      if (electronApi?.office?.getStats) return electronApi.office.getStats();
      return fetch('/api/office/stats').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    listClients: async (params) => {
      if (electronApi?.office?.listClients) return electronApi.office.listClients(params);
      return fetch('/api/office/crm/clients').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    addClient: async (data) => {
      if (electronApi?.office?.addClient) return electronApi.office.addClient(data);
      return fetch('/api/office/crm/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    updateClient: async (id, params) => {
      if (electronApi?.office?.updateClient) return electronApi.office.updateClient(id, params);
      return fetch(`/api/office/crm/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    deleteClient: async (id) => {
      if (electronApi?.office?.deleteClient) return electronApi.office.deleteClient(id);
      return fetch(`/api/office/crm/clients/${id}`, { method: 'DELETE' })
        .then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    listInvoices: async (params) => {
      if (electronApi?.office?.listInvoices) return electronApi.office.listInvoices(params);
      return fetch('/api/office/invoices').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    createInvoice: async (data) => {
      if (electronApi?.office?.createInvoice) return electronApi.office.createInvoice(data);
      return fetch('/api/office/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    getInvoice: async (id) => {
      if (electronApi?.office?.getInvoice) return electronApi.office.getInvoice(id);
      return fetch(`/api/office/invoices/${id}`).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    updateInvoiceStatus: async (data) => {
      if (electronApi?.office?.updateInvoiceStatus) return electronApi.office.updateInvoiceStatus(data);
      return fetch('/api/office/invoices/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    listExpenses: async (params) => {
      if (electronApi?.office?.listExpenses) return electronApi.office.listExpenses(params);
      return fetch('/api/office/expenses').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    addExpense: async (data) => {
      if (electronApi?.office?.addExpense) return electronApi.office.addExpense(data);
      return fetch('/api/office/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    getCashflow: async () => {
      if (electronApi?.office?.getCashflow) return electronApi.office.getCashflow();
      return fetch('/api/office/cashflow').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    createProposal: async (data) => {
      if (electronApi?.office?.createProposal) return electronApi.office.createProposal(data);
      return fetch('/api/office/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    compileDossier: async (clientId) => {
      if (electronApi?.office?.compileDossier) return electronApi.office.compileDossier(clientId);
      return fetch(`/api/office/dossier/${clientId}`).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    }
  },

  // MCP Studio: Multi-IDE Server Management
  mcp: {
    scan: async () => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.scan) return eApi.mcp.scan();
      return fetch('/api/mcp/scan').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    get: async (ideId) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.get) return eApi.mcp.get(ideId);
      return fetch(`/api/mcp/config?ide=${encodeURIComponent(ideId)}`).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    save: async (ideId, config) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.save) return eApi.mcp.save(ideId, config);
      return fetch('/api/mcp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideId, config })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    add: async (ideId, name, config) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.add) return eApi.mcp.add(ideId, name, config);
      return fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideId, name, config })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    update: async (ideId, name, config) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.update) return eApi.mcp.update(ideId, name, config);
      return fetch('/api/mcp/servers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideId, name, config })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    remove: async (ideId, name) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.remove) return eApi.mcp.remove(ideId, name);
      return fetch(`/api/mcp/servers?ide=${encodeURIComponent(ideId)}&name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    clone: async (sourceIdeId, targetIdeId, name, targetName) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.clone) return eApi.mcp.clone(sourceIdeId, targetIdeId, name, targetName);
      return fetch('/api/mcp/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIdeId, targetIdeId, name, targetName })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    catalog: async () => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.catalog) return eApi.mcp.catalog();
      return fetch('/api/mcp/catalog').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    },
    test: async (ideId, name) => {
      const eApi = window.tidyApi || electronApi;
      if (eApi?.mcp?.test) return eApi.mcp.test(ideId, name);
      return fetch(`/api/mcp/test?ide=${encodeURIComponent(ideId)}&name=${encodeURIComponent(name)}`).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    }
  },

  // Native OS Shell / File Manager Bridge
  shell: {
    openPath: async (dirPath) => {
      if (electronApi?.shell?.openPath) return electronApi.shell.openPath(dirPath);
      return fetch('/api/shell/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath })
      }).then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
    }
  }
};
