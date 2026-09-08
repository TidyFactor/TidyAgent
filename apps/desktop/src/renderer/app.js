/**
 * Tidy Studio & Web Management Console Controller
 * Pure Vanilla Reactive Engine with zero external runtime dependencies.
 * Automatically interfaces with Electron IPC (window.tidyApi) or Web REST APIs.
 */

// ----------------- Unified API Client Bridge -----------------
const electronApi = window.tidyApi;

const api = {
  // System Health & Stats
  getStats: async () => {
    if (electronApi?.getStats) return electronApi.getStats();
    return fetch('/api/stats').then(r => r.json()).catch(err => ({ ok: false, error: err.message }));
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
  }
};

// ----------------- Bilingual (EN / AR) i18n Engine -----------------
const I18N = {
  en: {
    langBtn: 'العربية',
    searchPlaceholder: 'Quick Search Memory (FTS5 BM25)... Press / to focus',
    newTask: 'New Task',
    storeMemory: 'Store Memory',
    activeWorkspace: 'Active Workspace',
    navPlatform: 'PLATFORM',
    navOverview: 'Overview',
    navMemory: 'Memory Explorer',
    navTasks: 'Tasks Board',
    navSubagents: 'Subagents Hub',
    navMicroApps: 'MICRO-APPS',
    navSnippets: 'Code Snippets',
    navJournal: 'Daily Journal',
    navVault: 'Vault & Secrets',
    navOfficeSuite: 'OFFICE SUITE',
    navCrm: 'CRM Pipeline',
    navInvoices: 'Invoices & Billing',
    navCashflow: 'Cashflow & P&L',
    navSystem: 'SYSTEM',
    navSettings: 'Settings & Health',
    statMemories: 'Stored Memories',
    statTasks: 'Pending Tasks',
    statSubagents: 'Subagents Loaded',
    statEngine: 'Engine Mode',
    overviewRecentMemories: 'Recent Memories & Decisions',
    overviewTopTasks: 'Top Priority Tasks',
    viewAll: 'View All →',
    manageTasks: 'Manage Tasks →',
    refreshBtn: 'Refresh',

    // Tab Titles & Subtitles
    titleOverview: 'System Overview',
    subtitleOverview: 'Real-time telemetry and state of your sovereign SQLite database',
    titleMemory: 'Memory Explorer',
    subtitleMemory: 'Search, filter, and inspect persistent facts, rules, and architectural decisions',
    titleTasks: 'Tasks Management',
    subtitleTasks: 'SQLite-backed task tracking with priority triage and status lifecycle',
    titleSubagents: 'Subagents & Community Skills Hub',
    subtitleSubagents: 'Autonomous AI subagents and community skills with 3-Ring Context Window injection',
    titleSnippets: 'Code Snippets Library',
    subtitleSnippets: 'Reusable prompt templates, configurations, and code patterns',
    titleJournal: 'Daily Worklog & Journal',
    subtitleJournal: 'Session notes, personal reflections, and worklog history',
    titleVault: 'Vault & Secret Keys',
    subtitleVault: 'Secure local key-value configuration stored directly in SQLite',
    titleSettings: 'Settings & SQLite Diagnostics',
    subtitleSettings: 'Database location, performance PRAGMAs, and system identity',
    titleCrm: 'CRM & Client Pipeline',
    subtitleCrm: 'B2B client accounts, lead statuses, deal values, and AI executive dossiers',
    titleInvoices: 'Invoices & Billing Engine',
    subtitleInvoices: 'Itemized invoices, automatic tax calculations, line item discounts, and payment tracking',
    titleCashflow: 'Cashflow & Financial Telemetry',
    subtitleCashflow: 'Operational expenses, collected revenue, net cashflow profit, and pending receivables',
    kickerOverview: 'SOVEREIGN ENGINE & MEMORY TELEMETRY',
    quickNewBtn: 'New',
    quickNewMemory: '+ New Memory',
    quickNewMemoryDesc: 'Save fact or decision to SQLite',
    quickNewInvoice: '+ New Invoice',
    quickNewInvoiceDesc: 'Issue official billing invoice',
    quickNewTask: '+ New Task',
    quickNewTaskDesc: 'Assign task with priority',
    quickNewProposal: '+ New Proposal',
    quickNewProposalDesc: 'Draft commercial proposal',
    quickNewClient: '+ Add Client',
    quickNewClientDesc: 'Add B2B account to CRM',
    quickNewExpense: '+ Record Expense',
    quickNewExpenseDesc: 'Log operational expense',
    quickNewSnippet: '+ New Snippet',
    quickNewSnippetDesc: 'Save prompt or code template',
    quickNewJournal: '+ New Journal',
    quickNewJournalDesc: 'Record daily work log'
  },
  ar: {
    langBtn: 'English',
    searchPlaceholder: 'بحث فوري في الذاكرة (FTS5 BM25)... اضغط / للتركيز',
    newTask: 'مهمة جديدة',
    storeMemory: 'حفظ ذاكرة',
    activeWorkspace: 'مساحة العمل النشطة',
    navPlatform: 'المنصة الأساسية',
    navOverview: 'نظرة عامة',
    navMemory: 'مستكشف الذاكرة',
    navTasks: 'لوحة المهام',
    navSubagents: 'مركز الوكلاء والمهارات',
    navMicroApps: 'التطبيقات الإنتاجية',
    navSnippets: 'مكتبة الأكواد',
    navJournal: 'سجل اليوميات',
    navVault: 'الخزنة والمفاتيح السرية',
    navOfficeSuite: 'حزمة الأعمال',
    navCrm: 'إدارة العملاء',
    navInvoices: 'الفواتير والمطالبات',
    navCashflow: 'التدفق المالي والأرباح',
    navSystem: 'النظام والصيانة',
    navSettings: 'الإعدادات وتشخيص SQLite',
    statMemories: 'عقد الذاكرة المخزنة',
    statTasks: 'المهام المعلقة',
    statSubagents: 'الوكلاء المتاحون',
    statEngine: 'نمط المحرك',
    overviewRecentMemories: 'أحدث القرارات والذاكرة',
    overviewTopTasks: 'أهم المهام ذات الأولوية',
    viewAll: 'عرض الكل ←',
    manageTasks: 'إدارة المهام ←',
    refreshBtn: 'تحديث',

    // Tab Titles & Subtitles
    titleOverview: 'نظرة عامة على المنظومة',
    subtitleOverview: 'مؤشرات حية للحالة وقاعدة بيانات SQLite السيادية',
    titleMemory: 'مستكشف الذاكرة المعرفية',
    subtitleMemory: 'البحث والتصفية واستعراض الحقائق والقرارات والأنماط المعمارية الدائمة',
    titleTasks: 'لوحة إدارة المهام',
    subtitleTasks: 'متابعة وتوجيه المهام حسب الأولوية ومجالات العمل وحالات الإنجاز',
    titleSubagents: 'مركز الوكلاء والمهارات الذكية',
    subtitleSubagents: 'وكلاء ذكاء اصطناعي مستقلون مع حقن فوري لسياق الحلقات الثلاث',
    titleSnippets: 'مكتبة الأكواد والقوالب',
    subtitleSnippets: 'حفظ وإعادة استخدام القصاصات البرمجية ونماذج التعليمات والتكوينات',
    titleJournal: 'سجل اليوميات وملاحظات العمل',
    subtitleJournal: 'مذكرات الجلسات، الخواطر المهنية، وسجل الإنجازات اليومية',
    titleVault: 'الخزنة والمفاتيح السرية',
    subtitleVault: 'تخزين آمن ومحلي للمتغيرات والمفاتيح مباشرة داخل SQLite',
    titleSettings: 'الإعدادات وتشخيص SQLite',
    subtitleSettings: 'موقع قاعدة البيانات، إعدادات أداء نمط WAL، وسلامة النظام',
    titleCrm: 'إدارة العملاء وخط أنابيب الصفقات',
    subtitleCrm: 'حسابات الشركات، مراحل التفاوض، الميزانيات، وملف العميل بالذكاء الاصطناعي',
    titleInvoices: 'محرك الفواتير والمطالبات المالية',
    subtitleInvoices: 'فواتير رسمية مجزأة مع احتساب آلي للضرائب والخصومات ومتابعة السداد',
    titleCashflow: 'التدفق المالي والتحليل الرقمي',
    subtitleCashflow: 'المصروفات التشغيلية، الإيرادات المحصلة، صافي السيولة، والمستحقات المعلقة',
    kickerOverview: 'النواة السيادية ومؤشرات الذاكرة التراكمية',
    quickNewBtn: 'جديد',
    quickNewMemory: '+ ذاكرة جديدة',
    quickNewMemoryDesc: 'حفظ قرار أو حقيقة في SQLite',
    quickNewInvoice: '+ فاتورة جديدة',
    quickNewInvoiceDesc: 'إصدار مطالبة مالية رسمية',
    quickNewTask: '+ مهمة جديدة',
    quickNewTaskDesc: 'إسناد مهمة بأولوية وسياق',
    quickNewProposal: '+ عرض تجاري',
    quickNewProposalDesc: 'إنشاء مقترح تعاقد وصفقة',
    quickNewClient: '+ عميل جديد',
    quickNewClientDesc: 'إضافة جهة أو شركة إلى الـ CRM',
    quickNewExpense: '+ تسجيل مصروف',
    quickNewExpenseDesc: 'قيد تكاليف تشغيلية وخوادم',
    quickNewSnippet: '+ قصاصة برمجية',
    quickNewSnippetDesc: 'حفظ قالب أو كود متكرر',
    quickNewJournal: '+ تدوينة يومية',
    quickNewJournalDesc: 'تسجيل إنجاز أو فكرة لليوم'
  }
};

let currentLang = localStorage.getItem('tidy_lang') || 'en';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('tidy_lang', lang);

  const isRtl = lang === 'ar';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);

  const t = I18N[lang] || I18N.en;

  // Header Circular Language Toggle Icon
  const langIconEl = document.getElementById('langToggleIcon');
  if (langIconEl) {
    if (lang === 'ar') {
      // In Arabic mode, clicking switches to English -> show UK Flag as in user's image
      langIconEl.innerHTML = `
        <svg class="flag-icon" viewBox="0 0 60 40" width="22" height="15" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="uk-flag-clip"><rect width="60" height="40" rx="2"/></clipPath>
          <g clip-path="url(#uk-flag-clip)">
            <rect width="60" height="40" fill="#012169"/>
            <path d="M0 0 L60 40 M60 0 L0 40" stroke="#ffffff" stroke-width="8"/>
            <path d="M0 0 L60 40" stroke="#C8102E" stroke-width="4"/>
            <path d="M60 0 L0 40" stroke="#C8102E" stroke-width="4"/>
            <path d="M30 0 v40 M0 20 h60" stroke="#ffffff" stroke-width="14"/>
            <path d="M30 0 v40 M0 20 h60" stroke="#C8102E" stroke-width="8"/>
          </g>
        </svg>
      `;
    } else {
      // In English mode, clicking switches to Arabic -> show Arab/Egypt Flag
      langIconEl.innerHTML = `
        <svg class="flag-icon" viewBox="0 0 60 40" width="22" height="15" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="ar-flag-clip"><rect width="60" height="40" rx="2"/></clipPath>
          <g clip-path="url(#ar-flag-clip)">
            <rect width="60" height="13.33" fill="#C8102E"/>
            <rect y="13.33" width="60" height="13.33" fill="#FFFFFF"/>
            <rect y="26.66" width="60" height="13.34" fill="#000000"/>
            <path d="M28 17 h4 l1 3 l-3 4 l-3 -4 z" fill="#D4AF37"/>
          </g>
        </svg>
      `;
    }
  }

  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  // Unified Dropdown CTA button and items
  const quickNewText = document.getElementById('btnQuickNewText');
  if (quickNewText) quickNewText.textContent = t.quickNewBtn;

  const quickItems = [
    ['itemTitleMemory', t.quickNewMemory],
    ['itemDescMemory', t.quickNewMemoryDesc],
    ['itemTitleInvoice', t.quickNewInvoice],
    ['itemDescInvoice', t.quickNewInvoiceDesc],
    ['itemTitleTask', t.quickNewTask],
    ['itemDescTask', t.quickNewTaskDesc],
    ['itemTitleProposal', t.quickNewProposal],
    ['itemDescProposal', t.quickNewProposalDesc],
    ['itemTitleClient', t.quickNewClient],
    ['itemDescClient', t.quickNewClientDesc],
    ['itemTitleExpense', t.quickNewExpense],
    ['itemDescExpense', t.quickNewExpenseDesc],
    ['itemTitleSnippet', t.quickNewSnippet],
    ['itemDescSnippet', t.quickNewSnippetDesc],
    ['itemTitleJournal', t.quickNewJournal],
    ['itemDescJournal', t.quickNewJournalDesc]
  ];
  quickItems.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // Sidebar labels
  document.querySelectorAll('.nav-section-title').forEach(el => {
    const text = el.textContent.trim();
    if (text === 'PLATFORM' || text === 'المنصة الأساسية') el.textContent = t.navPlatform;
    if (text === 'MICRO-APPS' || text === 'التطبيقات الإنتاجية') el.textContent = t.navMicroApps;
    if (text === 'OFFICE SUITE' || text === 'حزمة الأعمال') el.textContent = t.navOfficeSuite;
    if (text === 'SYSTEM' || text === 'النظام والصيانة') el.textContent = t.navSystem;
  });

  const tabLabels = {
    overview: t.navOverview,
    memory: t.navMemory,
    tasks: t.navTasks,
    subagents: t.navSubagents,
    snippets: t.navSnippets,
    journal: t.navJournal,
    vault: t.navVault,
    crm: t.navCrm,
    invoices: t.navInvoices,
    cashflow: t.navCashflow,
    settings: t.navSettings
  };

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab && tabLabels[tab]) {
      const icon = btn.querySelector('.nav-icon')?.outerHTML || '';
      btn.innerHTML = `${icon} <span class="nav-label">${tabLabels[tab]}</span>`;
    }
  });

  // Overview stats labels
  const statLabels = document.querySelectorAll('.stat-details .stat-label');
  if (statLabels.length >= 4) {
    statLabels[0].textContent = t.statMemories;
    statLabels[1].textContent = t.statTasks;
    statLabels[2].textContent = t.statSubagents;
    statLabels[3].textContent = t.statEngine;
  }

  // Tab Titles & Subtitles mapping
  const titlePairs = [
    ['headerTitleOverview', t.titleOverview],
    ['headerSubtitleOverview', t.subtitleOverview],
    ['headerTitleMemory', t.titleMemory],
    ['headerSubtitleMemory', t.subtitleMemory],
    ['headerTitleTasks', t.titleTasks],
    ['headerSubtitleTasks', t.subtitleTasks],
    ['headerTitleSubagents', t.titleSubagents],
    ['headerSubtitleSubagents', t.subtitleSubagents],
    ['headerTitleSnippets', t.titleSnippets],
    ['headerSubtitleSnippets', t.subtitleSnippets],
    ['headerTitleJournal', t.titleJournal],
    ['headerSubtitleJournal', t.subtitleJournal],
    ['headerTitleVault', t.titleVault],
    ['headerSubtitleVault', t.subtitleVault],
    ['headerTitleSettings', t.titleSettings],
    ['headerSubtitleSettings', t.subtitleSettings],
    ['headerTitleCrm', t.titleCrm],
    ['headerSubtitleCrm', t.subtitleCrm],
    ['headerTitleInvoices', t.titleInvoices],
    ['headerSubtitleInvoices', t.subtitleInvoices],
    ['headerTitleCashflow', t.titleCashflow],
    ['headerSubtitleCashflow', t.subtitleCashflow],
    ['panelHeaderRecentMemories', t.overviewRecentMemories],
    ['panelHeaderTopTasks', t.overviewTopTasks],
    ['linkViewAllMemories', t.viewAll],
    ['linkManageTasks', t.manageTasks],
    ['btnRefreshText', t.refreshBtn],
    ['kickerOverview', t.kickerOverview]
  ];

  titlePairs.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

// ----------------- App Lifecycle & Initialization -----------------
let activeTab = 'overview';
let deleteCallback = null;
let currentTheme = localStorage.getItem('tidy_theme') || 'light';
let currentNeighborhood = localStorage.getItem('tidy_qahera_neighborhood') || 'zeitoun';

const QAHERA_THEMES = [
  { id: 'zeitoun', nameAr: 'الزيتون', nameEn: 'El-Zeitoun', descAr: 'قصور الضواحي الأرستقراطية والتراث العريق', primary: '#1D4ED8', accent: '#D97706', base: '#F8FAFC' },
  { id: 'zamalek', nameAr: 'الزمالك', nameEn: 'Zamalek', descAr: 'القصور الدبلوماسية ولؤلؤ الشامبانيا الملكي', primary: '#18181B', accent: '#B88A3B', base: '#FBF9F5' },
  { id: 'downtown', nameAr: 'وسط البلد', nameEn: 'Downtown', descAr: 'العمارة الخديوية التراثية والباتينا الباريسية', primary: '#9E7728', accent: '#832729', base: '#F6F3EC' },
  { id: 'heliopolis', nameAr: 'مصر الجديدة', nameEn: 'Heliopolis', descAr: 'طراز البارون إمبان والأندلسي الصحراوي', primary: '#B45309', accent: '#C86D51', base: '#FAF6F0' },
  { id: 'gardencity', nameAr: 'جاردن سيتي', nameEn: 'Garden City', descAr: 'هدوء النيل والأفنية الشجرية الفكتورية', primary: '#047857', accent: '#D97706', base: '#F9FAF7' },
  { id: 'maadi', nameAr: 'المعادي', nameEn: 'Maadi', descAr: 'الضواحي الهادئة وأشجار الكافور التراثية', primary: '#15803D', accent: '#A16207', base: '#FAFBF8' },
  { id: 'roxy', nameAr: 'روكسي', nameEn: 'Roxy', descAr: 'حداثة الستينيات والتجارة الكلاسيكية الراقية', primary: '#0284C7', accent: '#E11D48', base: '#F8FAFC' },
  { id: 'hussein', nameAr: 'الحسين', nameEn: 'El-Hussein', descAr: 'العمارة الفاطمية والنحاسيات والمشكاوات', primary: '#D97706', accent: '#0D9488', base: '#FAF8F5' },
  { id: 'sakakini', nameAr: 'السكاكيني', nameEn: 'Sakakini', descAr: 'القصور الإيطالية والروكوكو وزخارف المرمر', primary: '#7C3AED', accent: '#DB2777', base: '#FAF7FC' },
  { id: 'shubra', nameAr: 'شبرا', nameEn: 'Shubra', descAr: 'حيوية المجتمع العريق والنسيج العمراني الأصيل', primary: '#C2410C', accent: '#2563EB', base: '#FAF7F5' },
  { id: 'marg', nameAr: 'المرج', nameEn: 'El-Marg', descAr: 'بساتين الأسرة العلوية والمروج الخديوية الخضراء', primary: '#059669', accent: '#D97706', base: '#F6FAF7' },
  { id: 'newcairo', nameAr: 'القاهرة الجديدة', nameEn: 'New Cairo', descAr: 'الحداثة التكنولوجية والـ Cyber Minimalist', primary: '#0284C7', accent: '#10B981', base: '#F8FAFC' }
];

function applyTheme(theme, neighborhood = currentNeighborhood) {
  currentTheme = theme;
  currentNeighborhood = neighborhood;
  localStorage.setItem('tidy_theme', theme);
  localStorage.setItem('tidy_qahera_neighborhood', neighborhood);
  document.body.setAttribute('data-theme', neighborhood);
  document.documentElement.setAttribute('data-theme', neighborhood);
  document.body.setAttribute('data-mode', theme);
  document.documentElement.setAttribute('data-mode', theme);

  const iconEl = document.getElementById('themeToggleIcon');
  if (iconEl) {
    if (theme === 'light') {
      // Crescent Moon outline icon matching user's reference image
      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    } else {
      // Sun icon (click to switch to light)
      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    }
  }

  const activeThemePill = document.getElementById('activeThemePill');
  if (activeThemePill) {
    const found = QAHERA_THEMES.find(t => t.id === neighborhood);
    activeThemePill.textContent = currentLang === 'ar'
      ? `${found ? found.nameAr : neighborhood} (${neighborhood}) نشط`
      : `${found ? found.nameEn : neighborhood} Active`;
  }

  renderThemeGallery();
}

function renderThemeGallery() {
  const container = document.getElementById('themeGalleryGrid');
  if (!container) return;

  container.innerHTML = QAHERA_THEMES.map(theme => {
    const isActive = theme.id === currentNeighborhood;
    const title = currentLang === 'ar' ? theme.nameAr : theme.nameEn;
    const desc = currentLang === 'ar' ? theme.descAr : theme.id;
    return `
      <div class="theme-card ${isActive ? 'active' : ''}" data-theme-id="${theme.id}" title="${escapeHtml(title)} — ${escapeHtml(desc)}">
        <div class="theme-card-header">
          <span class="theme-card-title">
            ${escapeHtml(title)}
            ${isActive ? '<svg class="qhr-icon qhr-icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: var(--qhr-color-primary, #1D4ED8);"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </span>
          <span class="theme-card-badge">${theme.id}</span>
        </div>
        <p class="theme-card-desc">${escapeHtml(desc)}</p>
        <div class="theme-swatches">
          <span class="swatch-dot" style="background-color: ${theme.primary};" title="Primary: ${theme.primary}"></span>
          <span class="swatch-dot" style="background-color: ${theme.accent};" title="Accent: ${theme.accent}"></span>
          <span class="swatch-dot" style="background-color: ${theme.base};" title="Surface: ${theme.base}"></span>
          <span class="swatch-label">${isActive ? (currentLang === 'ar' ? '● مفعّل' : '● Active') : (currentLang === 'ar' ? 'تطبيق' : 'Select')}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id');
      applyTheme(currentTheme, themeId);
    });
  });
}

function initSettingsHandlers() {
  document.getElementById('btnResetThemeSettings')?.addEventListener('click', () => {
    applyTheme('light', 'zeitoun');
  });
}

function initThemeToggle() {
  const btn = document.getElementById('btnToggleTheme');
  btn?.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });
}

function initQuickNewDropdown() {
  const dropdown = document.getElementById('quickNewDropdown');
  const trigger = document.getElementById('btnQuickNew');
  if (!dropdown || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', dropdown.classList.contains('open'));
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  dropdown.querySelectorAll('.qhr-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      const action = item.getAttribute('data-action');
      handleQuickNewAction(action);
    });
  });
}

async function handleQuickNewAction(action) {
  switch (action) {
    case 'new-memory':
      openModal('modalNewMemory');
      break;
    case 'new-invoice':
      await populateClientDropdown('inputInvoiceClient');
      const d = new Date();
      d.setDate(d.getDate() + 14);
      const dueInput = document.getElementById('inputInvoiceDueDate');
      if (dueInput) dueInput.value = d.toISOString().split('T')[0];
      openModal('modalNewInvoice');
      break;
    case 'new-task':
      openModal('modalNewTask');
      break;
    case 'new-proposal':
      await populateClientDropdown('inputProposalClient');
      const dProp = new Date();
      dProp.setDate(dProp.getDate() + 30);
      const validUntilInput = document.getElementById('inputProposalValidUntil');
      if (validUntilInput) validUntilInput.value = dProp.toISOString().split('T')[0];
      openModal('modalNewProposal');
      break;
    case 'new-client':
      openModal('modalNewClient');
      break;
    case 'new-expense':
      const dateInput = document.getElementById('inputExpenseDate');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      openModal('modalNewExpense');
      break;
    case 'new-snippet':
      document.getElementById('inputSnippetTitle').value = '';
      document.getElementById('inputSnippetCode').value = '';
      document.getElementById('inputSnippetTags').value = '';
      openModal('modalNewSnippet');
      break;
    case 'new-journal':
      document.getElementById('inputJournalTitle').value = '';
      document.getElementById('inputJournalEntry').value = '';
      openModal('modalNewJournal');
      break;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  applyLanguage(currentLang);
  initNavigation();
  initThemeToggle();
  initLanguageToggle();
  initQuickNewDropdown();
  initGlobalSearch();
  initModals();
  initMicroAppHandlers();
  initOfficeHandlers();
  initDbMaintenanceHandlers();
  initSettingsHandlers();
  initContextSwitcher();
  initRefreshButton();
  loadAllData();
  startAdaptiveTelemetry();
  renderThemeGallery();
});

function initLanguageToggle() {
  const btn = document.getElementById('btnToggleLang');
  btn?.addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(nextLang);
    refreshCurrentTab();
  });
}

function initRefreshButton() {
  const refreshBtn = document.getElementById('btnRefreshStats');
  refreshBtn?.addEventListener('click', async () => {
    const spinIcon = refreshBtn.querySelector('.btn-icon-spin');
    if (spinIcon) spinIcon.style.transform = 'rotate(360deg)';
    await loadAllData();
    refreshCurrentTab();
    setTimeout(() => { if (spinIcon) spinIcon.style.transform = 'none'; }, 350);
  });
}

// ----------------- Tab Navigation -----------------
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-goto'));
    });
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === `pane-${tabId}`);
  });

  // Lazy-load or refresh tab content
  if (tabId === 'overview') loadStats();
  if (tabId === 'memory') loadMemories();
  if (tabId === 'tasks') loadTasks();
  if (tabId === 'subagents') loadSubagents();
  if (tabId === 'snippets') loadSnippets();
  if (tabId === 'journal') loadJournal();
  if (tabId === 'vault') loadVault();
  if (tabId === 'crm') loadClients();
  if (tabId === 'invoices') loadInvoices();
  if (tabId === 'cashflow') loadCashflow();
  if (tabId === 'settings') {
    loadStats();
    renderThemeGallery();
  }
}

function refreshCurrentTab() {
  switchTab(activeTab);
}

// ----------------- Adaptive Telemetry Heartbeat -----------------
function startAdaptiveTelemetry() {
  // Adaptive polling every 4s
  setInterval(async () => {
    if (document.hidden) return; // Pause polling when window is minimized/hidden
    await loadStats();
    if (activeTab === 'overview') {
      await loadMemories();
      await loadTasks();
    }
  }, 4000);

  // Instant refresh when window gains focus
  window.addEventListener('focus', () => {
    loadStats();
    refreshCurrentTab();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadStats();
    }
  });
}

// ----------------- Context & Workspace Switcher -----------------
async function initContextSwitcher() {
  const selector = document.getElementById('workspaceSelector');
  if (!selector) return;

  try {
    const res = await api.listContexts();
    if (res && res.ok && Array.isArray(res.data) && res.data.length > 0) {
      selector.innerHTML = res.data.map(c => `
        <option value="${c.id}" ${c.is_active ? 'selected' : ''}>
          ${c.is_active ? '●' : '○'} ${c.name} (${c.domain})
        </option>
      `).join('');
    }
  } catch {}

  selector.addEventListener('change', async (e) => {
    const contextId = e.target.value;
    const res = await api.switchContext(contextId);
    if (res && res.ok) {
      await loadStats();
      refreshCurrentTab();
    }
  });
}

// ----------------- Global Search & Shortcuts -----------------
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const memorySearchInput = document.getElementById('memorySearchInput');

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      searchInput?.focus();
    }
  });

  let debounceTimer;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const q = e.target.value.trim();
      if (q.length > 0) {
        switchTab('memory');
        if (memorySearchInput) memorySearchInput.value = q;
        await searchMemories(q);
      }
    }, 250);
  });

  if (memorySearchInput) {
    memorySearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchMemories(e.target.value.trim());
      }, 250);
    });
  }

  // Memory filter dropdowns
  document.getElementById('memoryCategoryFilter')?.addEventListener('change', () => loadMemories());
  document.getElementById('memoryTierFilter')?.addEventListener('change', () => loadMemories());
}

// ----------------- Data Loaders -----------------
async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadMemories(),
    loadTasks(),
    loadSubagents()
  ]);
}

async function loadStats() {
  const res = await api.getStats();
  if (res && res.ok && res.data) {
    const d = res.data;
    const memEl = document.getElementById('statMemoriesCount');
    const tskEl = document.getElementById('statTasksCount');
    const subEl = document.getElementById('statSubagentsCount');
    if (memEl) memEl.textContent = d.counts.memories || 0;
    if (tskEl) tskEl.textContent = d.counts.tasks || 0;
    if (subEl) subEl.textContent = d.counts.subagents || 4;

    if (d.activeContext) {
      const wsBadge = document.getElementById('activeWorkspaceName');
      if (wsBadge) wsBadge.textContent = d.activeContext.name;
      const topWsBadge = document.getElementById('topBarWorkspaceLabel');
      if (topWsBadge) topWsBadge.textContent = d.activeContext.name;
    }
    if (d.dbPath) {
      const diagPath = document.getElementById('diagDbPath');
      const storageLabel = document.getElementById('storagePathLabel');
      if (diagPath) diagPath.textContent = d.dbPath;
      if (storageLabel) storageLabel.textContent = `SSOT: ${d.dbPath.split(/[\\/]/).pop()}`;
    }
  }
}

// ----------------- Memory Explorer -----------------
async function loadMemories() {
  const cat = document.getElementById('memoryCategoryFilter')?.value || null;
  const tier = document.getElementById('memoryTierFilter')?.value || null;
  const res = await api.listMemories({ limit: 40, category: cat, tier });
  if (res && res.ok && res.data) {
    renderMemoryCards(res.data);
    renderOverviewMemories(res.data.slice(0, 4));
  }
}

async function searchMemories(query) {
  if (!query) return loadMemories();
  const cat = document.getElementById('memoryCategoryFilter')?.value || null;
  const tier = document.getElementById('memoryTierFilter')?.value || null;
  const res = await api.recallMemory({ query, category: cat, tier, limit: 20 });
  if (res && res.ok && res.data) {
    renderMemoryCards(res.data);
  }
}

function renderMemoryCards(memories) {
  const container = document.getElementById('memoryListContainer');
  if (!container) return;

  if (memories.length === 0) {
    container.innerHTML = `<div class="skeleton-loader">${currentLang === 'ar' ? 'لم يتم العثور على عقد ذاكرة تطابق البحث.' : 'No memory nodes found. Store one using the button above!'}</div>`;
    return;
  }

  container.innerHTML = memories.map((m) => `
    <div class="memory-card">
      <div class="memory-header">
        <span class="badge-tag ${m.category}">${m.category}</span>
        <span class="version-pill">${m.tier}</span>
      </div>
      <div class="memory-content" dir="auto">${escapeHtml(m.content)}</div>
      <div class="memory-footer">
        <span>★ ${m.importance || 3}/5 · ${m.access_count || 0} hits</span>
        <button class="btn-icon delete btn-delete-memory" data-id="${m.id}" title="Forget memory">
          <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-delete-memory').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      showDeleteConfirm(
        currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه الذاكرة نهائياً؟' : 'Are you sure you want to forget and permanently delete this memory node?',
        async () => {
          await api.forgetMemory(id);
          loadMemories();
          loadStats();
        }
      );
    });
  });
}

function renderOverviewMemories(memories) {
  const container = document.getElementById('overviewRecentMemories');
  if (!container) return;
  if (memories.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); padding: 12px 0; text-align: center;">${currentLang === 'ar' ? 'لا توجد ذكريات بعد.' : 'No memories stored yet.'}</div>`;
    return;
  }
  container.innerHTML = memories.map((m) => `
    <div class="overview-item">
      <div class="overview-item-header">
        <span class="badge-tag ${m.category}">[${m.category.toUpperCase()}]</span>
        <span class="version-pill" style="font-size: 10px;">${m.tier}</span>
      </div>
      <div class="overview-item-body" dir="auto">${escapeHtml(m.content)}</div>
    </div>
  `).join('');
}

// ----------------- Tasks Board -----------------
async function loadTasks() {
  const res = await api.listTasks();
  if (res && res.ok && res.data) {
    const tasks = res.data;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
    const high = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    const medium = tasks.filter(t => (t.priority === 'medium' || t.priority === 'low') && t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');

    const countUrgent = document.getElementById('countUrgentTasks');
    const countHigh = document.getElementById('countHighTasks');
    const countMedium = document.getElementById('countMediumTasks');
    const countCompleted = document.getElementById('countCompletedTasks');

    if (countUrgent) countUrgent.textContent = urgent.length;
    if (countHigh) countHigh.textContent = high.length;
    if (countMedium) countMedium.textContent = medium.length;
    if (countCompleted) countCompleted.textContent = completed.length;

    renderTaskList('urgentTasksList', urgent);
    renderTaskList('highTasksList', high);
    renderTaskList('mediumTasksList', medium);
    renderTaskList('completedTasksList', completed, true);

    const topPending = tasks.filter(t => t.status !== 'completed').slice(0, 4);
    const overviewContainer = document.getElementById('overviewTopTasks');
    if (overviewContainer) {
      overviewContainer.innerHTML = topPending.length === 0
        ? `<div style="color: var(--text-muted); padding: 12px 0; text-align: center;">${currentLang === 'ar' ? 'جميع المهام مكتملة!' : 'All tasks completed!'}</div>`
        : topPending.map(t => `
            <div class="overview-item" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <span class="overview-item-body" dir="auto" style="font-weight: 600; flex: 1;">${escapeHtml(t.title)}</span>
              <span class="badge-priority ${t.priority || 'medium'}">${(t.priority || 'medium').toUpperCase()}</span>
            </div>
          `).join('');
    }
  }
}

function renderTaskList(elementId, tasks, isCompleted = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (tasks.length === 0) {
    el.innerHTML = `<div style="color: var(--text-muted); font-size: 12px; padding: 8px;">${currentLang === 'ar' ? 'لا توجد مهام.' : 'No tasks.'}</div>`;
    return;
  }

  el.innerHTML = tasks.map(t => {
    const domainTag = t.domain && t.domain !== 'general' ? `<span class="badge-tag pattern" style="font-size: 10px; margin-inline-end: 4px;">${escapeHtml(t.domain)}</span>` : '';
    const agentTag = t.assigned_agent ? `<span class="badge-tag decision" style="font-size: 10px; margin-inline-end: 4px;">@${escapeHtml(t.assigned_agent)}</span>` : '';
    return `
      <div class="task-card">
        <div class="task-title" style="margin-bottom: 6px;">${escapeHtml(t.title)}</div>
        <div style="margin-bottom: 8px;">${domainTag}${agentTag}</div>
        <div class="task-actions">
          <span style="font-size: 11px; color: var(--text-muted);">${t.id}</span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-sm btn-outline btn-brief-task" data-task-id="${t.id}" title="Generate 3-Ring Task Brief">
              <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Brief</span>
            </button>
            ${!isCompleted ? `<button class="btn btn-sm btn-outline btn-complete-task" data-task-id="${t.id}">Done ✓</button>` : `<span style="font-size: 11px; color: var(--accent-green);">${currentLang === 'ar' ? 'مكتمل' : 'Completed'}</span>`}
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.btn-complete-task').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-task-id');
      await api.completeTask(id);
      loadTasks();
      loadStats();
    });
  });

  el.querySelectorAll('.btn-brief-task').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-task-id');
      showBriefModal({ taskId: id });
    });
  });
}

// ----------------- Subagents & Skills -----------------
async function loadSubagents() {
  const [agentsRes, skillsRes] = await Promise.all([
    api.listSubagents(),
    api.listSkills ? api.listSkills() : { ok: true, data: [] }
  ]);

  if (agentsRes && agentsRes.ok && agentsRes.data) {
    const container = document.getElementById('subagentsListContainer');
    const select = document.getElementById('dispatchAgentSelect');
    const agentOptions = [];

    if (container) {
      container.innerHTML = agentsRes.data.map(a => {
        agentOptions.push(`<option value="${a.name}">@${a.name} — ${a.role}</option>`);
        const isSkill = a.description.startsWith('[Skill:');
        const badge = isSkill ? `<span class="badge-tag fact" style="font-size: 10px;">COMMUNITY SKILL</span>` : `<span class="badge-tag decision" style="font-size: 10px;">CORE AGENT</span>`;
        return `
          <div class="subagent-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div class="subagent-name">@${a.name}</div>
              ${badge}
            </div>
            <div class="subagent-role">${escapeHtml(a.role)}</div>
            <div class="subagent-desc" style="font-size: 12px; line-height: 1.4; color: var(--text-secondary);">${escapeHtml(a.description)}</div>
          </div>
        `;
      }).join('');
    }

    if (select && agentOptions.length > 0) {
      select.innerHTML = agentOptions.join('');
    }

    const taskAgentSelect = document.getElementById('inputTaskAgent');
    if (taskAgentSelect) {
      taskAgentSelect.innerHTML = `<option value="">(Unassigned)</option>` + agentOptions.join('');
    }
  }
}

async function showBriefModal({ taskId = null, taskTitle = '', agentName = 'coder', domain = 'general' }) {
  const briefText = document.getElementById('briefContentText');
  const titleEl = document.getElementById('briefModalTitle');
  if (!briefText) return;

  briefText.textContent = currentLang === 'ar' ? 'جارٍ توليد ملخص المهمة (3-Ring Context)...' : 'Generating 3-Ring Task Brief...';
  openModal('modalTaskBrief');

  const res = await api.generateBrief({ taskId, taskTitle, agentName, domain });
  if (res && (res.ok || res.briefMarkdown || res.data)) {
    const b = res.data || res;
    if (titleEl) titleEl.textContent = `Task Brief: ${b.title || taskId || 'Generated'}`;
    briefText.textContent = b.briefMarkdown || JSON.stringify(b, null, 2);
  } else {
    briefText.textContent = 'Error generating task brief: ' + (res?.error || 'Unknown error');
  }
}

// ----------------- Micro-Apps: Snippets -----------------
async function loadSnippets() {
  const container = document.getElementById('snippetsListContainer');
  if (!container) return;

  const res = await api.listSnippets();
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    container.innerHTML = `<div class="skeleton-loader">${currentLang === 'ar' ? 'لا توجد قصاصات برمجية مسجلة بعد. أضف قصاصة جديدة!' : 'No code snippets saved yet. Add your first snippet!'}</div>`;
    return;
  }

  container.innerHTML = res.data.map(s => {
    return `
      <div class="snippet-card">
        <div class="snippet-header">
          <div class="snippet-title">${escapeHtml(s.title)}</div>
          <span class="snippet-lang-badge">${escapeHtml(s.language || 'code')}</span>
        </div>
        <pre class="snippet-code-box"><code>${escapeHtml(s.code)}</code></pre>
        <div class="snippet-actions">
          <button class="btn btn-sm btn-outline btn-copy-snippet" data-code="${encodeURIComponent(s.code)}">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <span>Copy</span>
          </button>
          <button class="btn-icon delete btn-delete-snippet" data-id="${s.id}" title="Delete Snippet">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-copy-snippet').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = decodeURIComponent(btn.getAttribute('data-code'));
      navigator.clipboard.writeText(code).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1800);
      });
    });
  });

  container.querySelectorAll('.btn-delete-snippet').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      showDeleteConfirm(
        currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه القصاصة البرمجية؟' : 'Are you sure you want to delete this snippet?',
        async () => {
          await api.deleteSnippet(id);
          loadSnippets();
          loadStats();
        }
      );
    });
  });
}

// ----------------- Micro-Apps: Journal -----------------
async function loadJournal() {
  const container = document.getElementById('journalListContainer');
  if (!container) return;

  const res = await api.listJournal({ limit: 20 });
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    container.innerHTML = `<div class="skeleton-loader">${currentLang === 'ar' ? 'لا توجد ملاحظات مسجلة في اليوميات حتى الآن.' : 'No journal entries logged yet. Record your daily reflection!'}</div>`;
    return;
  }

  container.innerHTML = res.data.map(j => {
    const dateFormatted = j.created_at ? new Date(j.created_at).toLocaleString() : '';
    return `
      <div class="journal-card">
        <div class="journal-card-header">
          <div class="journal-title">${escapeHtml(j.title)}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="journal-mood-badge">${escapeHtml(j.mood || 'focused')}</span>
            <span class="journal-date">${dateFormatted}</span>
          </div>
        </div>
        <div class="journal-entry-body">${escapeHtml(j.entry)}</div>
      </div>
    `;
  }).join('');
}

// ----------------- Micro-Apps: Vault -----------------
async function loadVault() {
  const tbody = document.getElementById('vaultTableBody');
  if (!tbody) return;

  const res = await api.listVaultKeys();
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">${currentLang === 'ar' ? 'الخزنة فارغة حالياً.' : 'No secret keys stored in vault.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map(k => `
    <tr style="border-bottom: 1px solid var(--border-subtle);">
      <td style="padding: 12px; font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 600;">${escapeHtml(k.key)}</td>
      <td style="padding: 12px;">
        <span class="vault-secret-val" id="secret-val-${escapeHtml(k.key)}">••••••••••••••••</span>
      </td>
      <td style="padding: 12px; font-size: 12px; color: var(--text-muted);">${k.updated_at || 'Recently'}</td>
      <td style="padding: 12px;">
        <div class="vault-actions-cell">
          <button class="btn-icon btn-reveal-secret" data-key="${escapeHtml(k.key)}" title="Reveal / Hide Value">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn-icon btn-copy-secret" data-key="${escapeHtml(k.key)}" title="Copy Value">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button class="btn-icon delete btn-delete-secret" data-key="${escapeHtml(k.key)}" title="Delete Secret">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  const svgEye = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const svgLock = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`;
  const svgCopy = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;

  // Reveal / Hide toggle
  tbody.querySelectorAll('.btn-reveal-secret').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-key');
      const valEl = document.getElementById(`secret-val-${key}`);
      if (!valEl) return;

      if (valEl.dataset.revealed === 'true') {
        valEl.textContent = '••••••••••••••••';
        valEl.dataset.revealed = 'false';
        btn.innerHTML = svgEye;
      } else {
        btn.textContent = '...';
        const res = await api.getSecret(key);
        btn.innerHTML = svgLock;
        valEl.textContent = res?.data?.value || res?.value || '(empty)';
        valEl.dataset.revealed = 'true';
      }
    });
  });

  // Copy secret value
  tbody.querySelectorAll('.btn-copy-secret').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-key');
      btn.textContent = '...';
      const res = await api.getSecret(key);
      const val = res?.data?.value || res?.value || '';
      if (val) {
        navigator.clipboard.writeText(val).then(() => {
          btn.textContent = '✓';
          setTimeout(() => { btn.innerHTML = svgCopy; }, 1800);
        });
      } else {
        btn.innerHTML = svgCopy;
      }
    });
  });

  // Delete secret
  tbody.querySelectorAll('.btn-delete-secret').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      showDeleteConfirm(
        currentLang === 'ar' ? `هل أنت متأكد من حذف المفتاح السري "${key}"؟` : `Are you sure you want to delete secret key "${key}"?`,
        async () => {
          await api.deleteSecret(key);
          loadVault();
          loadStats();
        }
      );
    });
  });
}

// ----------------- Database Maintenance Handlers -----------------
function initDbMaintenanceHandlers() {
  const resultBox = document.getElementById('dbActionResult');

  function showDbResult(msg, isSuccess = true) {
    if (!resultBox) return;
    resultBox.style.display = 'block';
    resultBox.style.color = isSuccess ? 'var(--accent-green)' : 'var(--accent-red)';
    resultBox.textContent = msg;
    setTimeout(() => {
      resultBox.style.display = 'none';
    }, 6000);
  }

  document.getElementById('btnDbBackup')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnDbBackup');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> <span>Creating...</span>`;
    try {
      const res = await api.backupDatabase();
      if (res && (res.ok || res.success || res.data?.success)) {
        const d = res.data || res;
        showDbResult(`✓ Backup created successfully: ${d.backupPath} (${Math.round((d.sizeBytes || 0) / 1024)} KB)`);
      } else {
        showDbResult(`✗ Backup failed: ${res?.error || 'Unknown error'}`, false);
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });

  document.getElementById('btnDbCheckpoint')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnDbCheckpoint');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> <span>Flushing WAL...</span>`;
    try {
      const res = await api.checkpointWal();
      if (res && (res.ok || res.success || res.data?.success)) {
        showDbResult(`✓ WAL checkpoint successful (Journal flushed and truncated to zero bytes).`);
      } else {
        showDbResult(`✗ Checkpoint failed: ${res?.error || 'Unknown error'}`, false);
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });

  document.getElementById('btnDbIntegrity')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnDbIntegrity');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> <span>Verifying...</span>`;
    try {
      const res = await api.checkIntegrity();
      const isOk = res?.ok || res?.data?.ok;
      if (isOk) {
        showDbResult(`✓ PRAGMA integrity_check: OK. Zero structural or B-tree anomalies detected.`);
      } else {
        showDbResult(`✗ Integrity warning: ${JSON.stringify(res?.data?.results || res?.results || res)}`, false);
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
}

// ----------------- Micro-Apps Form Handlers -----------------
function initMicroAppHandlers() {
  // Snippets
  document.getElementById('btnCreateSnippet')?.addEventListener('click', () => {
    document.getElementById('inputSnippetTitle').value = '';
    document.getElementById('inputSnippetCode').value = '';
    document.getElementById('inputSnippetTags').value = '';
    openModal('modalNewSnippet');
  });

  document.getElementById('btnSaveSnippetSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputSnippetTitle').value.trim();
    const language = document.getElementById('inputSnippetLanguage').value;
    const code = document.getElementById('inputSnippetCode').value.trim();
    const tagsRaw = document.getElementById('inputSnippetTags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!title || !code) return alert('Snippet title and code are required.');

    await api.addSnippet({ title, language, code, tags });
    closeModal('modalNewSnippet');
    loadSnippets();
    loadStats();
  });

  // Journal
  document.getElementById('btnCreateJournal')?.addEventListener('click', () => {
    document.getElementById('inputJournalTitle').value = '';
    document.getElementById('inputJournalEntry').value = '';
    openModal('modalNewJournal');
  });

  document.getElementById('btnSaveJournalSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputJournalTitle').value.trim();
    const mood = document.getElementById('inputJournalMood').value;
    const entry = document.getElementById('inputJournalEntry').value.trim();

    if (!title || !entry) return alert('Journal title and entry content are required.');

    await api.addJournalEntry({ title, mood, entry });
    closeModal('modalNewJournal');
    loadJournal();
    loadStats();
  });

  // Vault
  document.getElementById('btnCreateVaultSecret')?.addEventListener('click', () => {
    document.getElementById('inputVaultKey').value = '';
    document.getElementById('inputVaultValue').value = '';
    openModal('modalNewVaultSecret');
  });

  document.getElementById('btnSaveVaultSubmit')?.addEventListener('click', async () => {
    const key = document.getElementById('inputVaultKey').value.trim().toUpperCase();
    const value = document.getElementById('inputVaultValue').value.trim();

    if (!key || !value) return alert('Secret key and value are required.');

    await api.setSecret({ key, value });
    closeModal('modalNewVaultSecret');
    loadVault();
    loadStats();
  });

  // Delete Confirmation Modal Handler
  document.getElementById('btnConfirmDeleteSubmit')?.addEventListener('click', async () => {
    if (deleteCallback) {
      await deleteCallback();
      deleteCallback = null;
    }
    closeModal('modalConfirmDelete');
  });
}

function showDeleteConfirm(message, onConfirm) {
  const textEl = document.getElementById('confirmDeleteText');
  if (textEl) textEl.textContent = message;
  deleteCallback = onConfirm;
  openModal('modalConfirmDelete');
}

// ----------------- Base Modals & UI Handlers -----------------
function initModals() {
  document.getElementById('btnOpenNewMemory')?.addEventListener('click', () => openModal('modalNewMemory'));
  document.getElementById('btnCreateMemory')?.addEventListener('click', () => openModal('modalNewMemory'));

  document.getElementById('btnOpenNewTask')?.addEventListener('click', () => openModal('modalNewTask'));
  document.getElementById('btnCreateTask')?.addEventListener('click', () => openModal('modalNewTask'));

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.getAttribute('data-close'));
    });
  });

  // Close modal when pressing Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open, .modal-backdrop.active').forEach(m => {
        closeModal(m.id);
      });
    }
  });

  // Close modal when clicking directly on backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });

  // Save Memory Submit
  document.getElementById('btnSaveMemorySubmit')?.addEventListener('click', async () => {
    const content = document.getElementById('inputMemoryContent').value.trim();
    const category = document.getElementById('inputMemoryCategory').value;
    const importance = Number(document.getElementById('inputMemoryImportance').value);

    if (!content) return alert('Memory content cannot be empty.');

    await api.saveMemory({ content, category, importance });
    closeModal('modalNewMemory');
    document.getElementById('inputMemoryContent').value = '';
    loadMemories();
    loadStats();
  });

  // Save Task Submit
  document.getElementById('btnSaveTaskSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputTaskTitle').value.trim();
    const description = document.getElementById('inputTaskDescription').value.trim();
    const priority = document.getElementById('inputTaskPriority').value;
    const domain = document.getElementById('inputTaskDomain')?.value || 'general';
    const assignedAgent = document.getElementById('inputTaskAgent')?.value || null;

    if (!title) return alert('Task title cannot be empty.');

    await api.addTask({ title, description, priority, domain, assignedAgent });
    closeModal('modalNewTask');
    document.getElementById('inputTaskTitle').value = '';
    document.getElementById('inputTaskDescription').value = '';
    loadTasks();
    loadStats();
  });

  // Dispatch Subagent
  document.getElementById('btnDispatchSubagent')?.addEventListener('click', async () => {
    const name = document.getElementById('dispatchAgentSelect').value;
    const task = document.getElementById('dispatchTaskPrompt').value.trim();
    if (!task) return alert('Task instruction is required.');

    const btn = document.getElementById('btnDispatchSubagent');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>Dispatching...</span>`;

    const res = await api.runSubagent({ name, task });
    btn.innerHTML = origHtml;
    btn.disabled = false;

    if (res && res.ok && res.data) {
      document.getElementById('subagentResultBox').style.display = 'block';
      document.getElementById('subagentResultText').textContent = res.data.output;
      loadStats();
    }
  });

  // Generate Task Brief Button
  document.getElementById('btnGenerateBrief')?.addEventListener('click', async () => {
    const agent = document.getElementById('dispatchAgentSelect').value;
    const prompt = document.getElementById('dispatchTaskPrompt').value.trim();
    if (!prompt) return alert('Enter a task instruction or mission to generate brief.');
    showBriefModal({ taskTitle: prompt, agentName: agent });
  });

  // Scan Community Skills Button
  document.getElementById('btnScanCommunitySkills')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnScanCommunitySkills');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>Scanning...</span>`;
    try {
      const res = await api.scanSkills();
      await loadSubagents();
      await loadStats();
      alert(`Community Skills scanned! Discovered ${res?.data?.length || 0} skill(s).`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });

  // Copy Brief Button
  document.getElementById('btnCopyBrief')?.addEventListener('click', () => {
    const text = document.getElementById('briefContentText').textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert('Task Brief copied to clipboard!');
    });
  });

  // Refresh stats
  document.getElementById('btnRefreshStats')?.addEventListener('click', () => {
    loadAllData();
  });
}

// ==========================================================================
// Office Suite Controllers (@tidy/office: CRM, Invoices, Cashflow, Dossier)
// ==========================================================================

async function loadClients() {
  const status = document.getElementById('crmStatusFilter')?.value || null;
  const search = document.getElementById('crmSearchInput')?.value || null;
  const tbody = document.getElementById('crmClientsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="skeleton-loader">${currentLang === 'ar' ? 'جاري تحميل العملاء...' : 'Loading CRM accounts...'}</td></tr>`;

  const res = await api.office.listClients({ status, search });
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">${currentLang === 'ar' ? 'لا يوجد عملاء مسجلون حالياً.' : 'No CRM clients found.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map(c => {
    const statusPill = `<span class="badge ${c.status || 'lead'}">${(c.status || 'lead').toUpperCase()}</span>`;
    const budget = Number(c.budget || 0).toLocaleString();
    const contact = [c.email, c.phone].filter(Boolean).join(' • ') || '<span style="color: var(--text-muted);">N/A</span>';
    const date = (c.created_at || '').slice(0, 10);
    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(c.name)}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(c.company || 'Individual')}</div>
        </td>
        <td>${statusPill}</td>
        <td style="font-family: var(--font-mono); color: var(--accent-green); font-weight: 600;">$${budget}</td>
        <td style="font-size: 12px;">${contact}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${date}</td>
        <td style="text-align: right;">
          <button class="btn btn-sm btn-outline btn-client-dossier" data-id="${c.id}" data-name="${escapeHtml(c.name)}" title="Compile AI Dossier">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Dossier</span>
          </button>
          <button class="btn btn-sm btn-secondary btn-client-invoice" data-id="${c.id}" data-name="${escapeHtml(c.name)}" title="Issue Invoice">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>Bill</span>
          </button>
          <button class="btn btn-sm btn-outline btn-delete-client" data-id="${c.id}" style="color: var(--accent-red); border-color: rgba(239, 68, 68, 0.3);" title="Delete Client">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Wire row buttons
  tbody.querySelectorAll('.btn-client-dossier').forEach(btn => {
    btn.addEventListener('click', async () => {
      const clientId = btn.getAttribute('data-id');
      const clientName = btn.getAttribute('data-name');
      await showClientDossierModal(clientId, clientName);
    });
  });

  tbody.querySelectorAll('.btn-client-invoice').forEach(btn => {
    btn.addEventListener('click', () => {
      const clientId = btn.getAttribute('data-id');
      openModal('modalNewInvoice');
      const clientSelect = document.getElementById('inputInvoiceClient');
      if (clientSelect) clientSelect.value = clientId;
    });
  });

  tbody.querySelectorAll('.btn-delete-client').forEach(btn => {
    btn.addEventListener('click', () => {
      const clientId = btn.getAttribute('data-id');
      showDeleteConfirm(
        currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا العميل وسجلاته؟' : 'Are you sure you want to delete this client record?',
        async () => {
          await api.office.deleteClient(clientId);
          loadClients();
        }
      );
    });
  });
}

async function loadInvoices() {
  const status = document.getElementById('invoicesStatusFilter')?.value || null;
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" class="skeleton-loader">${currentLang === 'ar' ? 'جاري تحميل الفواتير...' : 'Loading invoices...'}</td></tr>`;

  const res = await api.office.listInvoices({ status });
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">${currentLang === 'ar' ? 'لا توجد فواتير مسجلة.' : 'No invoices found.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map(inv => {
    const isPaid = inv.status === 'paid';
    const statusColor = isPaid ? 'var(--accent-green)' : (inv.status === 'overdue' ? 'var(--accent-red)' : 'var(--accent-yellow)');
    const statusPill = `<span class="badge" style="background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor};">${inv.status.toUpperCase()}</span>`;
    const subtotal = Number(inv.subtotal || 0).toFixed(2);
    const tax = Number(inv.tax_amount || 0).toFixed(2);
    const total = Number(inv.total_amount || 0).toFixed(2);
    const due = inv.due_date || 'N/A';
    const clientDisplay = inv.client_name ? `${escapeHtml(inv.client_name)}` : `<span style="font-family: var(--font-mono); font-size: 11px;">${inv.client_id || 'N/A'}</span>`;

    return `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-cyan);">${escapeHtml(inv.invoice_number)}</td>
        <td>${clientDisplay}</td>
        <td>${statusPill}</td>
        <td style="font-family: var(--font-mono);">$${subtotal}</td>
        <td style="font-family: var(--font-mono); color: var(--text-muted);">$${tax}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">$${total}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${due}</td>
        <td style="text-align: right;">
          ${!isPaid ? `<button class="btn btn-sm btn-outline btn-mark-paid" data-id="${inv.id}" style="color: var(--accent-green); border-color: rgba(16, 185, 129, 0.4);" title="Mark as Paid">✓ Mark Paid</button>` : `<span style="color: var(--accent-green); font-size: 12px; font-weight: 600;">✓ Settled</span>`}
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-mark-paid').forEach(btn => {
    btn.addEventListener('click', async () => {
      const invId = btn.getAttribute('data-id');
      await api.office.updateInvoiceStatus({ id: invId, status: 'paid' });
      loadInvoices();
      loadCashflow();
    });
  });
}

async function loadCashflow() {
  const res = await api.office.getCashflow();
  if (res && res.ok && res.data) {
    const summary = res.data;
    const revEl = document.getElementById('statCollectedRevenue');
    const expEl = document.getElementById('statTotalExpenses');
    const netEl = document.getElementById('statNetProfit');
    const recEl = document.getElementById('statPendingReceivables');

    if (revEl) revEl.textContent = `$${Number(summary.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (expEl) expEl.textContent = `$${Number(summary.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (netEl) {
      const sign = summary.netProfit >= 0 ? '+' : '';
      netEl.textContent = `${sign}$${Number(summary.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      netEl.style.color = summary.netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
    if (recEl) recEl.textContent = `$${Number(summary.pendingReceivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // Render category breakdown
    const catContainer = document.getElementById('cashflowCategoryBreakdown');
    if (catContainer) {
      const cats = summary.categoryBreakdown || [];
      if (cats.length === 0) {
        catContainer.innerHTML = `<div style="color: var(--text-muted); padding: 12px 0;">${currentLang === 'ar' ? 'لا توجد نفقات مسجلة بعد.' : 'No expenses categorized yet.'}</div>`;
      } else {
        catContainer.innerHTML = cats.map(c => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <span style="font-weight: 600; text-transform: capitalize;">${escapeHtml(c.category || 'General')}</span>
              <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${c.count} items)</span>
            </div>
            <span style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-yellow);">$${Number(c.total || 0).toFixed(2)}</span>
          </div>
        `).join('');
      }
    }
  }

  // Load recent expenses list
  const expRes = await api.office.listExpenses({ limit: 15 });
  const listContainer = document.getElementById('cashflowExpensesList');
  if (listContainer) {
    if (!expRes || !expRes.ok || !expRes.data || expRes.data.length === 0) {
      listContainer.innerHTML = `<div style="color: var(--text-muted); padding: 12px 0;">${currentLang === 'ar' ? 'لا توجد نفقات مسجلة.' : 'No recorded expenses.'}</div>`;
    } else {
      listContainer.innerHTML = expRes.data.map(e => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(e.title || e.description)}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              <span class="badge" style="font-size: 10px; padding: 2px 6px;">${(e.category || 'operating').toUpperCase()}</span>
              <span style="margin-left: 8px; color: var(--text-muted);">${e.expense_date || ''}</span>
              ${e.vendor ? `<span style="margin-left: 8px; color: var(--text-muted);">• ${escapeHtml(e.vendor)}</span>` : ''}
            </div>
          </div>
          <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-red);">-$${Number(e.amount || 0).toFixed(2)}</span>
        </div>
      `).join('');
    }
  }
}

async function showClientDossierModal(clientId, clientName) {
  const modal = document.getElementById('modalClientDossier');
  const title = document.getElementById('dossierModalTitle');
  const pre = document.getElementById('dossierContentPre');
  if (!modal || !pre) return;

  if (title) title.textContent = `Client Executive Dossier: ${clientName || clientId}`;
  pre.textContent = 'Synthesizing evidence across SQLite CRM, invoices, proposals, tasks, and memory...';
  openModal('modalClientDossier');

  const res = await api.office.compileDossier(clientId);
  if (res && res.ok && res.data) {
    pre.textContent = res.data.dossierMarkdown || res.data.markdown || 'No dossier generated.';
  } else {
    pre.textContent = `Error compiling dossier: ${res?.error || 'Unknown error'}`;
  }
}

async function populateClientDropdown(targetSelectId = 'inputInvoiceClient') {
  const select = document.getElementById(targetSelectId);
  if (!select) return;
  select.innerHTML = currentLang === 'ar' ? '<option value="">اختر عميلاً...</option>' : '<option value="">Select a client...</option>';
  const res = await api.office.listClients({ limit: 100 });
  if (res && res.ok && res.data) {
    res.data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.company || 'Individual'})`;
      select.appendChild(opt);
    });
  }
}

function initOfficeHandlers() {
  // Proposal Submit Handler
  document.getElementById('btnSaveProposalSubmit')?.addEventListener('click', async () => {
    const clientId = document.getElementById('inputProposalClient')?.value;
    const title = document.getElementById('inputProposalTitle')?.value.trim();
    const totalAmount = Number(document.getElementById('inputProposalAmount')?.value || 0);
    const validUntil = document.getElementById('inputProposalValidUntil')?.value || null;
    const notes = document.getElementById('inputProposalNotes')?.value.trim() || '';

    if (!clientId) return alert(currentLang === 'ar' ? 'يرجى اختيار عميل مستهدف.' : 'Please select a target client.');
    if (!title) return alert(currentLang === 'ar' ? 'يرجى إدخال عنوان العرض أو المشروع.' : 'Proposal title is required.');

    const res = await api.office.createProposal({
      clientId,
      title,
      totalAmount,
      validUntil,
      proposalData: {
        items: [{ name: title, qty: 1, unitPrice: totalAmount, lineTotal: totalAmount }],
        terms: notes
      }
    });

    if (res && res.ok) {
      closeModal('modalNewProposal');
      document.getElementById('inputProposalTitle').value = '';
      document.getElementById('inputProposalAmount').value = '';
      document.getElementById('inputProposalNotes').value = '';
      alert(currentLang === 'ar' ? 'تم إنشاء العرض التجاري بنجاح!' : 'Commercial proposal created successfully!');
    } else {
      alert(`Failed to create proposal: ${res?.error || 'Unknown error'}`);
    }
  });
  // CRM search & filter
  document.getElementById('crmStatusFilter')?.addEventListener('change', () => loadClients());
  document.getElementById('crmSearchInput')?.addEventListener('input', () => loadClients());

  // Invoices filter
  document.getElementById('invoicesStatusFilter')?.addEventListener('change', () => loadInvoices());

  // Open modals
  document.getElementById('btnOpenNewClient')?.addEventListener('click', () => {
    openModal('modalNewClient');
  });

  document.getElementById('btnOpenNewInvoice')?.addEventListener('click', async () => {
    await populateClientDropdown();
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const dueInput = document.getElementById('inputInvoiceDueDate');
    if (dueInput) dueInput.value = d.toISOString().split('T')[0];
    openModal('modalNewInvoice');
  });

  document.getElementById('btnOpenNewExpense')?.addEventListener('click', () => {
    const dateInput = document.getElementById('inputExpenseDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    openModal('modalNewExpense');
  });

  // Add Invoice Line Item row
  document.getElementById('btnAddInvoiceItemRow')?.addEventListener('click', () => {
    const container = document.getElementById('invoiceItemsContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'invoice-item-row';
    row.style = 'display: flex; gap: 8px; margin-top: 6px;';
    row.innerHTML = `
      <input type="text" class="form-input item-name" placeholder="Item / Service description" style="flex: 2;" />
      <input type="number" class="form-input item-qty" placeholder="Qty" value="1" min="1" style="max-width: 80px;" />
      <input type="number" class="form-input item-price" placeholder="Unit Price ($)" step="0.01" style="flex: 1;" />
      <button type="button" class="btn btn-sm btn-outline btn-remove-item" style="color: var(--accent-red); border: none;">✕</button>
    `;
    row.querySelector('.btn-remove-item').addEventListener('click', () => row.remove());
    container.appendChild(row);
  });

  // Submit Client
  document.getElementById('btnSaveClientSubmit')?.addEventListener('click', async () => {
    const name = document.getElementById('inputClientName')?.value.trim();
    if (!name) return alert('Client name is required.');

    const company = document.getElementById('inputClientCompany')?.value.trim() || null;
    const industry = document.getElementById('inputClientIndustry')?.value.trim() || null;
    const email = document.getElementById('inputClientEmail')?.value.trim() || null;
    const phone = document.getElementById('inputClientPhone')?.value.trim() || null;
    const status = document.getElementById('inputClientStatus')?.value || 'lead';
    const budget = Number(document.getElementById('inputClientBudget')?.value || 0);
    const notes = document.getElementById('inputClientNotes')?.value.trim() || null;

    const res = await api.office.addClient({ name, company, industry, email, phone, status, budget, notes });
    if (res && res.ok) {
      closeModal('modalNewClient');
      document.getElementById('inputClientName').value = '';
      if (document.getElementById('inputClientCompany')) document.getElementById('inputClientCompany').value = '';
      if (document.getElementById('inputClientEmail')) document.getElementById('inputClientEmail').value = '';
      if (document.getElementById('inputClientPhone')) document.getElementById('inputClientPhone').value = '';
      if (document.getElementById('inputClientBudget')) document.getElementById('inputClientBudget').value = '';
      if (document.getElementById('inputClientNotes')) document.getElementById('inputClientNotes').value = '';
      loadClients();
    } else {
      alert(`Failed to save client: ${res?.error || 'Unknown error'}`);
    }
  });

  // Submit Invoice
  document.getElementById('btnSaveInvoiceSubmit')?.addEventListener('click', async () => {
    const clientId = document.getElementById('inputInvoiceClient')?.value;
    if (!clientId) return alert('Please select a target client.');

    const dueDate = document.getElementById('inputInvoiceDueDate')?.value || null;
    const taxRate = Number(document.getElementById('inputInvoiceTax')?.value || 0);
    const discountAmount = Number(document.getElementById('inputInvoiceDiscount')?.value || 0);
    const notes = document.getElementById('inputInvoiceNotes')?.value.trim() || null;

    const itemRows = document.querySelectorAll('#invoiceItemsContainer .invoice-item-row');
    const items = [];
    itemRows.forEach(row => {
      const name = row.querySelector('.item-name')?.value.trim();
      const qty = Number(row.querySelector('.item-qty')?.value || 1);
      const unitPrice = Number(row.querySelector('.item-price')?.value || 0);
      if (name && unitPrice > 0) {
        items.push({ name, qty, unitPrice });
      }
    });

    if (items.length === 0) return alert('Add at least one line item with a valid name and price.');

    const res = await api.office.createInvoice({ clientId, items, taxRate, discountAmount, dueDate, notes });
    if (res && res.ok) {
      closeModal('modalNewInvoice');
      loadInvoices();
      loadCashflow();
    } else {
      alert(`Failed to create invoice: ${res?.error || 'Unknown error'}`);
    }
  });

  // Submit Expense
  document.getElementById('btnSaveExpenseSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputExpenseTitle')?.value.trim();
    const amount = Number(document.getElementById('inputExpenseAmount')?.value || 0);
    if (!title || amount <= 0) return alert('Valid expense title and amount required.');

    const category = document.getElementById('inputExpenseCategory')?.value || 'other';
    const vendor = document.getElementById('inputExpenseVendor')?.value.trim() || null;
    const expenseDate = document.getElementById('inputExpenseDate')?.value || null;
    const notes = document.getElementById('inputExpenseNotes')?.value.trim() || null;

    const res = await api.office.addExpense({ title, amount, category, vendor, expenseDate, notes });
    if (res && res.ok) {
      closeModal('modalNewExpense');
      document.getElementById('inputExpenseTitle').value = '';
      document.getElementById('inputExpenseAmount').value = '';
      if (document.getElementById('inputExpenseVendor')) document.getElementById('inputExpenseVendor').value = '';
      if (document.getElementById('inputExpenseNotes')) document.getElementById('inputExpenseNotes').value = '';
      loadCashflow();
    } else {
      alert(`Failed to record expense: ${res?.error || 'Unknown error'}`);
    }
  });

  // Copy Dossier Markdown Button
  document.getElementById('btnCopyDossier')?.addEventListener('click', () => {
    const text = document.getElementById('dossierContentPre')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      alert('Client Dossier copied to clipboard!');
    });
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    el.classList.add('active');
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    el.classList.remove('active');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
