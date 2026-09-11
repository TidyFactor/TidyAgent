/**
 * Tidy Multi-Language Architecture & Compact Dropdown Controller
 * Supports 8 international languages with RTL/LTR dynamic switching.
 * Strictly adheres to Qahera UI Kit Design System.
 */

/**
 * Crisp, High-DPI Vector SVG Flags (20x14)
 * Solves Windows Chromium / Electron emoji font limitations where flag emojis render as plain text regional codes.
 */
const FLAG_SVGS = {
  ar: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" rx="2" fill="#006C35"/><path d="M4 5.2c1-.3 2.2-.3 3.3 0 .7.2 1.4.2 2.1 0 1-.3 2.3-.3 3.3 0 .6.2 1.2.2 1.8 0v.8c-.6.2-1.2.2-1.8 0-1-.3-2.3-.3-3.3 0-.7.2-1.4.2-2.1 0-1-.3-2.3-.3-3.3 0v-.8z" fill="#ffffff"/><path d="M4.5 8h10v.7h-10zm1.3-.8v2.3M13.5 7.6l1.2.7-1.2.7z" fill="#ffffff"/></svg>`,
  en: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" rx="2" fill="#012169"/><path d="M0 0l20 14M20 0L0 14" stroke="#ffffff" stroke-width="2.6"/><path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" stroke-width="1.3"/><path d="M10 0v14M0 7h20" stroke="#ffffff" stroke-width="4.2"/><path d="M10 0v14M0 7h20" stroke="#C8102E" stroke-width="2.5"/></svg>`,
  fr: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="6.66" height="14" fill="#002654"/><rect x="6.66" width="6.68" height="14" fill="#FFFFFF"/><rect x="13.34" width="6.66" height="14" fill="#ED2939"/></svg>`,
  es: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="3.5" fill="#AA151B"/><rect y="3.5" width="20" height="7" fill="#F1BF00"/><rect y="10.5" width="20" height="3.5" fill="#AA151B"/><rect x="4" y="5.2" width="2.6" height="3.6" rx="0.6" fill="#AA151B"/><circle cx="5.3" cy="6.8" r="0.8" fill="#F1BF00"/></svg>`,
  de: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="4.66" fill="#000000"/><rect y="4.66" width="20" height="4.68" fill="#DD0000"/><rect y="9.34" width="20" height="4.66" fill="#FFCC00"/></svg>`,
  fa: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="4.66" fill="#239F40"/><rect y="4.66" width="20" height="4.68" fill="#FFFFFF"/><rect y="9.34" width="20" height="4.66" fill="#DA0000"/><circle cx="10" cy="7" r="1.4" fill="#DA0000"/><circle cx="10" cy="7" r="0.7" fill="#FFFFFF"/></svg>`,
  zh: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" fill="#DE2910"/><polygon points="4,2.2 4.6,3.8 6.3,3.8 4.9,4.8 5.4,6.4 4,5.4 2.6,6.4 3.1,4.8 1.7,3.8 3.4,3.8" fill="#FFDE00"/><circle cx="7.8" cy="2.8" r="0.6" fill="#FFDE00"/><circle cx="8.8" cy="4.2" r="0.6" fill="#FFDE00"/><circle cx="8.8" cy="6" r="0.6" fill="#FFDE00"/><circle cx="7.8" cy="7.4" r="0.6" fill="#FFDE00"/></svg>`,
  pt: `<svg class="lang-flag-svg" viewBox="0 0 20 14" width="20" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" fill="#009C3B"/><polygon points="10,1.8 18,7 10,12.2 2,7" fill="#FFDF00"/><circle cx="10" cy="7" r="2.7" fill="#002776"/><path d="M7.7 7.2a2.7 2.7 0 0 1 4.5-.7" stroke="#FFFFFF" stroke-width="0.6" fill="none"/></svg>`
};

const LANG_CONFIG = {
  ar: { name: 'العربية', sub: 'Arabic', dir: 'rtl', code: 'AR' },
  en: { name: 'English', sub: 'English', dir: 'ltr', code: 'EN' },
  fr: { name: 'Français', sub: 'French', dir: 'ltr', code: 'FR' },
  es: { name: 'Español', sub: 'Spanish', dir: 'ltr', code: 'ES' },
  de: { name: 'Deutsch', sub: 'German', dir: 'ltr', code: 'DE' },
  fa: { name: 'فارسی', sub: 'Persian', dir: 'rtl', code: 'FA' },
  zh: { name: '中文', sub: 'Chinese', dir: 'ltr', code: 'ZH' },
  pt: { name: 'Português', sub: 'Portuguese', dir: 'ltr', code: 'PT' }
};

let currentLang = localStorage.getItem('tidy_lang') || 'ar';
const localeCache = {};

/**
 * Resolve a dot-notated key from an object
 */
function resolveI18nKey(obj, path) {
  if (!obj || !path) return null;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Load localization dictionary for a specific language
 */
async function loadLocaleDictionary(lang) {
  if (localeCache[lang]) return localeCache[lang];

  try {
    const res = await fetch(`locales/${lang}.json?v=1.4.4`);
    if (res.ok) {
      const data = await res.json();
      localeCache[lang] = data;
      return data;
    }
  } catch {
    // Attempt absolute path fallback
    try {
      const res = await fetch(`/locales/${lang}.json?v=1.4.4`);
      if (res.ok) {
        const data = await res.json();
        localeCache[lang] = data;
        return data;
      }
    } catch {
      // Ignore network errors, fall back to default
    }
  }

  // Built-in emergency fallbacks
  if (lang === 'ar' && localeCache['ar']) return localeCache['ar'];
  if (lang === 'en' && localeCache['en']) return localeCache['en'];
  return null;
}

/**
 * Apply selected language across the entire application DOM
 */
async function applyLanguage(lang) {
  if (!LANG_CONFIG[lang]) lang = 'ar';
  currentLang = lang;
  localStorage.setItem('tidy_lang', lang);

  const cfg = LANG_CONFIG[lang];
  document.documentElement.setAttribute('dir', cfg.dir);
  document.documentElement.setAttribute('lang', lang);

  // Update topbar compact dropdown button
  const flagEl = document.getElementById('langCurrentFlag');
  const nameEl = document.getElementById('langCurrentName');
  const codeEl = document.getElementById('langCurrentCode');
  if (flagEl && FLAG_SVGS[lang]) flagEl.innerHTML = FLAG_SVGS[lang];
  if (nameEl) nameEl.textContent = cfg.name;
  if (codeEl) codeEl.textContent = cfg.code;

  // Update dropdown items active state
  document.querySelectorAll('#langMenu .lang-item').forEach(item => {
    const isActive = item.getAttribute('data-lang') === lang;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const dict = await loadLocaleDictionary(lang);
  if (!dict) return;

  // Translate all DOM elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = resolveI18nKey(dict, key);
    if (val) el.textContent = val;
  });

  // Translate all DOM elements with data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = resolveI18nKey(dict, key);
    if (val) el.setAttribute('title', val);
  });

  // Translate all inputs with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = resolveI18nKey(dict, key);
    if (val) el.setAttribute('placeholder', val);
  });

  // Topbar Global Search placeholder
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput && dict.searchPlaceholder) {
    searchInput.placeholder = dict.searchPlaceholder;
  }

  // Quick "+ New" CTA text & descriptions
  const quickNewText = document.getElementById('btnQuickNewText');
  if (quickNewText && dict.quickNew?.btn) quickNewText.textContent = dict.quickNew.btn;

  const quickItemKeys = [
    ['itemTitleMemory', 'quickNew.memory'],
    ['itemDescMemory', 'quickNew.memoryDesc'],
    ['itemTitleInvoice', 'quickNew.invoice'],
    ['itemDescInvoice', 'quickNew.invoiceDesc'],
    ['itemTitleTask', 'quickNew.task'],
    ['itemDescTask', 'quickNew.taskDesc'],
    ['itemTitleProposal', 'quickNew.proposal'],
    ['itemDescProposal', 'quickNew.proposalDesc'],
    ['itemTitleClient', 'quickNew.client'],
    ['itemDescClient', 'quickNew.clientDesc'],
    ['itemTitleExpense', 'quickNew.expense'],
    ['itemDescExpense', 'quickNew.expenseDesc'],
    ['itemTitleSnippet', 'quickNew.snippet'],
    ['itemDescSnippet', 'quickNew.snippetDesc'],
    ['itemTitleJournal', 'quickNew.journal'],
    ['itemDescJournal', 'quickNew.journalDesc']
  ];
  quickItemKeys.forEach(([id, path]) => {
    const el = document.getElementById(id);
    const val = resolveI18nKey(dict, path);
    if (el && val) el.textContent = val;
  });

  // Sidebar Nav Section Titles
  document.querySelectorAll('.nav-section-title').forEach(el => {
    const text = el.textContent.trim().toUpperCase();
    if (text.includes('PLATFORM') || text.includes('المنصة')) el.textContent = dict.nav?.platform || 'PLATFORM';
    if (text.includes('MICRO') || text.includes('الإنتاجية')) el.textContent = dict.nav?.microApps || 'MICRO-APPS';
    if (text.includes('OFFICE') || text.includes('الأعمال')) el.textContent = dict.nav?.officeSuite || 'OFFICE SUITE';
    if (text.includes('SYSTEM') || text.includes('النظام')) el.textContent = dict.nav?.system || 'SYSTEM';
  });

  // Sidebar Nav Items
  const tabNavMap = {
    overview: dict.nav?.overview,
    memory: dict.nav?.memory,
    tasks: dict.nav?.tasks,
    subagents: dict.nav?.subagents,
    harvester: dict.nav?.harvester,
    dispatcher: dict.nav?.dispatcher,
    snippets: dict.nav?.snippets,
    journal: dict.nav?.journal,
    vault: dict.nav?.vault,
    crm: dict.nav?.crm,
    invoices: dict.nav?.invoices,
    cashflow: dict.nav?.cashflow,
    settings: dict.nav?.settings
  };
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab && tabNavMap[tab]) {
      const labelEl = btn.querySelector('.nav-label');
      if (labelEl) {
        labelEl.textContent = tabNavMap[tab];
      } else {
        const icon = btn.querySelector('.nav-icon')?.outerHTML || '';
        btn.innerHTML = `${icon} <span class="nav-label">${tabNavMap[tab]}</span>`;
      }
    }
  });

  // Tab Titles & Subtitles
  const titlePairs = [
    ['headerTitleOverview', dict.titles?.overview],
    ['headerSubtitleOverview', dict.titles?.overviewSubtitle],
    ['headerTitleMemory', dict.titles?.memory],
    ['headerSubtitleMemory', dict.titles?.memorySubtitle],
    ['headerTitleTasks', dict.titles?.tasks],
    ['headerSubtitleTasks', dict.titles?.tasksSubtitle],
    ['headerTitleSubagents', dict.titles?.subagents],
    ['headerSubtitleSubagents', dict.titles?.subagentsSubtitle],
    ['headerTitleHarvester', dict.titles?.harvester],
    ['headerSubtitleHarvester', dict.titles?.harvesterSubtitle],
    ['headerTitleDispatcher', dict.titles?.dispatcher],
    ['headerSubtitleDispatcher', dict.titles?.dispatcherSubtitle],
    ['headerTitleSnippets', dict.titles?.snippets],
    ['headerSubtitleSnippets', dict.titles?.snippetsSubtitle],
    ['headerTitleJournal', dict.titles?.journal],
    ['headerSubtitleJournal', dict.titles?.journalSubtitle],
    ['headerTitleVault', dict.titles?.vault],
    ['headerSubtitleVault', dict.titles?.vaultSubtitle],
    ['headerTitleSettings', dict.titles?.settings],
    ['headerSubtitleSettings', dict.titles?.settingsSubtitle],
    ['headerTitleCrm', dict.titles?.crm],
    ['headerSubtitleCrm', dict.titles?.crmSubtitle],
    ['headerTitleInvoices', dict.titles?.invoices],
    ['headerSubtitleInvoices', dict.titles?.invoicesSubtitle],
    ['headerTitleCashflow', dict.titles?.cashflow],
    ['headerSubtitleCashflow', dict.titles?.cashflowSubtitle],
    ['panelHeaderSubagentsSpotlight', dict.overview?.subagentsSpotlight],
    ['panelHeaderHarvesterPulse', dict.overview?.harvesterPulse],
    ['panelHeaderRecentMemories', dict.overview?.recentMemories],
    ['panelHeaderTopTasks', dict.overview?.topTasks],
    ['linkViewAllMemories', dict.overview?.viewAll],
    ['linkManageTasks', dict.overview?.manageTasks],
    ['btnRefreshText', dict.overview?.refreshBtn],
    ['kickerOverview', dict.overview?.kicker]
  ];
  titlePairs.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  });

  // Re-render theme gallery active pill
  if (window.renderThemeGallery) window.renderThemeGallery();
  if (window.loadMemories) window.loadMemories();

  // Notify system of language update
  window.dispatchEvent(new CustomEvent('tidy:lang-changed', { detail: { lang, dict } }));
}

/**
 * Initialize Clean Compact Language Dropdown Selector (Qahera-native)
 */
function initLanguageSelector() {
  const dropdown = document.getElementById('langDropdown');
  const trigger = document.getElementById('btnToggleLang');
  const menu = document.getElementById('langMenu');
  if (!dropdown || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close other open dropdowns first
    document.querySelectorAll('.qhr-dropdown.open').forEach(d => {
      if (d !== dropdown) d.classList.remove('open');
    });
    dropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', dropdown.classList.contains('open'));
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  menu?.querySelectorAll('.lang-item').forEach(item => {
    item.addEventListener('click', () => {
      const selectedLang = item.getAttribute('data-lang');
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      if (selectedLang) {
        applyLanguage(selectedLang);
      }
    });
  });
}

// Global translation helper
window.t = function(path, fallback = '') {
  const dict = localeCache[currentLang];
  let val = resolveI18nKey(dict, path);
  if (!val && localeCache['en']) {
    val = resolveI18nKey(localeCache['en'], path);
  }
  return val !== null && val !== undefined ? val : fallback;
};

// Global exports
window.applyLanguage = applyLanguage;
window.initLanguageSelector = initLanguageSelector;
window.getCurrentLang = () => currentLang;
window.isRtl = () => LANG_CONFIG[currentLang]?.dir === 'rtl';
window.FLAG_SVGS = FLAG_SVGS;
window.LANG_CONFIG = LANG_CONFIG;
