/**
 * Universal Skills & Agents Studio Controller (v1.5.0)
 * 3-Pane sovereign workspace: Collections, Multi-Tool Catalog, Monospaced Editor.
 * Performance: event delegation, content cache, debounced search, markdown cache, TTL scan guard.
 */

let studioState = {
  view: 'skill',        // 'skill' | 'agent' | 'favorite'
  activeTool: null,
  activeCollection: null,
  search: '',
  items: [],
  selectedItem: null,
  editorMode: 'preview',
  collections: [],
  tools: {}
};

// ── Performance caches ────────────────────────────────────────────────────────
const _contentCache   = new Map();   // slug → { rawContent, rawFrontmatter, body }
const _markdownCache  = new Map();   // content string → rendered HTML
const _domRefs        = new Map();   // id → DOM element cache
let   _lastScanTs     = 0;           // Unix ms of last successful scan
const SCAN_TTL_MS     = 30_000;      // 30 s before we allow a background re-scan

let studioListenersBound = false;
let _searchDebounceTimer = null;
let _listDelegated       = false;    // event delegation flag — attach once only

// ── Helpers ───────────────────────────────────────────────────────────────────
function _now() { return Date.now(); }

function _getRef(id) {
  let el = _domRefs.get(id);
  if (!el || !el.isConnected) {
    el = document.getElementById(id);
    if (el) _domRefs.set(id, el);
  }
  return el;
}

// ── Load / Scan ───────────────────────────────────────────────────────────────
async function loadSubagents(force = false) {
  const container = document.getElementById('studioItemsList');
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  if (force) {
    _lastScanTs = 0;
    _contentCache.clear();
    _markdownCache.clear();
  }

  // Show spinner only on first load (no items cached yet)
  if (container && studioState.items.length === 0) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:var(--text-secondary);text-align:center;">
        <div style="width:26px;height:26px;border:3px solid var(--border-subtle);border-top-color:var(--qhr-color-primary,#1D4ED8);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:12px;"></div>
        <div style="font-size:13px;font-weight:500;">${lang === 'ar' ? 'جاري فحص واكتشاف المهارات والوكلاء...' : 'Scanning skills & agents...'}</div>
      </div>`;
  }

  // Skip API call if cache is fresh and not forced
  const cacheIsFresh = !force && (_now() - _lastScanTs) < SCAN_TTL_MS && studioState.items.length > 0;
  if (cacheIsFresh) {
    renderStudioSidebar();
    filterAndRenderStudioItems();
    if (!studioListenersBound) { setupStudioListeners(); studioListenersBound = true; }
    return;
  }

  try {
    const [scanRes, colsRes] = await Promise.all([
      window.api?.studio ? window.api.studio.scanAll({ force }) : { ok: true, data: { items: [], tools: {} } },
      window.api?.studio ? window.api.studio.listCollections() : { ok: true, data: [] }
    ]);

    if (scanRes?.ok && scanRes.data) {
      studioState.items   = scanRes.data.items || [];
      studioState.tools   = scanRes.data.tools || {};
      _lastScanTs         = _now();
      _contentCache.clear();   // invalidate content cache on rescan
    }
    if (colsRes?.ok && colsRes.data) {
      studioState.collections = colsRes.data || [];
    }

    // Badge counters — batch DOM writes
    const badgeSkills = document.getElementById('badgeTotalSkills');
    const badgeAgents = document.getElementById('badgeTotalAgents');
    const badgeFavs   = document.getElementById('badgeTotalFavorites');
    if (badgeSkills) badgeSkills.textContent = scanRes?.data?.skillsCount    || 0;
    if (badgeAgents) badgeAgents.textContent = scanRes?.data?.agentsCount    || 0;
    if (badgeFavs)   badgeFavs.textContent   = scanRes?.data?.favoritesCount || 0;

    renderStudioSidebar();
    filterAndRenderStudioItems();

    if (!studioListenersBound) { setupStudioListeners(); studioListenersBound = true; }
  } catch (err) {
    console.error('[Studio] loadSubagents failed:', err);
    if (container) {
      const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
      container.innerHTML = `
        <div style="text-align:center;color:var(--text-tertiary);padding:40px 16px;font-size:13px;">
          ${lang === 'ar' ? 'تعذر تحميل المهارات: ' + escapeHtml(err.message) : 'Failed to load items: ' + escapeHtml(err.message)}
        </div>`;
    }
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
// Uses class toggling on existing nodes instead of innerHTML rebuild.
function renderStudioSidebar() {
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  // 1. Tools — rebuild only if container is empty; otherwise just update active classes
  const toolsContainer = document.getElementById('studioToolsNavList');
  if (toolsContainer) {
    const tools = studioState.tools || {};
    const toolValues = Object.values(tools);

    if (toolsContainer.children.length !== toolValues.length) {
      // First render or tool set changed
      toolsContainer.innerHTML = toolValues.map(t => {
        const iconHtml = window.getLobeIcon ? window.getLobeIcon(t.id, { size: 18, color: true }) : t.icon;
        return `<button class="studio-nav-item${studioState.activeTool === t.id ? ' active' : ''}" data-tool-id="${t.id}">
          <span class="studio-nav-icon">${iconHtml}</span>
          <span class="studio-nav-label">${t.name}</span>
          <span class="studio-badge">${t.count}</span>
        </button>`;
      }).join('');
      // Delegate once
      toolsContainer.addEventListener('click', _onToolClick);
    } else {
      // Just toggle active class — no DOM rebuild
      toolsContainer.querySelectorAll('[data-tool-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.toolId === studioState.activeTool);
      });
    }
  }

  // 2. Collections
  const colsContainer = document.getElementById('studioCollectionsNavList');
  if (colsContainer) {
    if (studioState.collections.length === 0) {
      colsContainer.innerHTML = `<div style="font-size:11.5px;color:var(--text-tertiary);padding:6px 10px;">${lang === 'ar' ? 'لا توجد مجموعات بعد' : 'No collections yet'}</div>`;
    } else if (colsContainer.children.length !== studioState.collections.length) {
      colsContainer.innerHTML = studioState.collections.map(c => `
        <button class="studio-nav-item${studioState.activeCollection === c.id ? ' active' : ''}" data-collection-id="${c.id}">
          <span class="studio-nav-icon" style="color:${c.color || '#4a9eff'};">●</span>
          <span class="studio-nav-label">${escapeHtml(c.name)}</span>
          <span class="studio-badge">${c.itemsCount || 0}</span>
        </button>`).join('');
      colsContainer.addEventListener('click', _onCollectionClick);
    } else {
      colsContainer.querySelectorAll('[data-collection-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.collectionId === studioState.activeCollection);
      });
    }
  }
}

function _onToolClick(e) {
  const btn = e.target.closest('[data-tool-id]');
  if (!btn) return;
  const toolId = btn.dataset.toolId;
  studioState.activeTool       = studioState.activeTool === toolId ? null : toolId;
  studioState.activeCollection = null;
  renderStudioSidebar();
  filterAndRenderStudioItems();
}

function _onCollectionClick(e) {
  const btn = e.target.closest('[data-collection-id]');
  if (!btn) return;
  const colId = btn.dataset.collectionId;
  studioState.activeCollection = studioState.activeCollection === colId ? null : colId;
  studioState.activeTool       = null;
  renderStudioSidebar();
  filterAndRenderStudioItems();
}

// ── Item List (Progressive Chunked Rendering for Blazing Performance) ─────────
const RENDER_CHUNK_SIZE = 50;
let _renderedCount = 0;
let _currentFilteredList = [];
let _scrollListenerAttached = false;

function _renderCardBatch(items, selectedSlug) {
  return items.map(item => {
    const isSelected = item.slug === selectedSlug;
    const toolBadges = item.tools.map(t => {
      if (window.getToolBadge) return window.getToolBadge(t, { showLabel: false, size: 14 });
      const def = studioState.tools[t];
      return `<span class="studio-tool-mini-badge" title="${def?.name || t}">${def?.icon || '⚙️'}</span>`;
    }).join('');

    return `<div class="studio-item-card${isSelected ? ' active' : ''}" data-slug="${item.slug}">
      <div class="studio-item-main-info">
        <div class="studio-item-name">${escapeHtml(item.name)}</div>
        <div class="studio-item-meta-row">
          <span>${escapeHtml(item.authorTag || 'community')}</span>
          <span>•</span>
          <span>${item.sizeFormatted || ''}</span>
        </div>
      </div>
      <div class="studio-item-badges-strip">${item.isFavorite ? '⭐' : ''}${toolBadges}</div>
    </div>`;
  }).join('');
}

function filterAndRenderStudioItems() {
  const container = document.getElementById('studioItemsList');
  const titleEl   = document.getElementById('studioCurrentViewTitle');
  const chipEl    = document.getElementById('studioCurrentCountChip');
  if (!container) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  let filtered = studioState.items;

  // View filter
  if (studioState.view === 'skill') {
    filtered = filtered.filter(i => i.itemType === 'skill');
    if (titleEl) titleEl.textContent = lang === 'ar' ? 'كافة المهارات' : 'All Skills';
  } else if (studioState.view === 'agent') {
    filtered = filtered.filter(i => i.itemType === 'agent');
    if (titleEl) titleEl.textContent = lang === 'ar' ? 'كافة الوكلاء' : 'All Agents';
  } else if (studioState.view === 'favorite') {
    filtered = filtered.filter(i => i.isFavorite);
    if (titleEl) titleEl.textContent = lang === 'ar' ? 'المفضلة' : 'Favorites';
  }

  // Tool filter
  if (studioState.activeTool) {
    filtered = filtered.filter(i => i.tools.includes(studioState.activeTool));
    const toolName = studioState.tools[studioState.activeTool]?.name || studioState.activeTool;
    if (titleEl) titleEl.textContent += ` • ${toolName}`;
  }

  // Collection filter
  if (studioState.activeCollection) {
    const col = studioState.collections.find(c => c.id === studioState.activeCollection);
    filtered = filtered.filter(i => i.collections?.includes(studioState.activeCollection));
    if (titleEl && col) titleEl.textContent = `${col.name}`;
  }

  // Search filter
  if (studioState.search.trim()) {
    const q = studioState.search.toLowerCase();
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }

  _currentFilteredList = filtered;
  if (chipEl) chipEl.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-tertiary);padding:40px 16px;font-size:13px;">${lang === 'ar' ? 'لا توجد عناصر مطابقة.' : 'No items match current filters.'}</div>`;
    clearStudioDetails();
    return;
  }

  // Progressive rendering: initial batch of 50 items (instant 1ms render)
  _renderedCount = Math.min(RENDER_CHUNK_SIZE, filtered.length);
  const selectedSlug = studioState.selectedItem?.slug;
  const initialHtml = _renderCardBatch(filtered.slice(0, _renderedCount), selectedSlug);

  container.innerHTML = initialHtml;
  container.scrollTop = 0;

  // Infinite scroll listener — load next chunk on scroll near bottom
  if (!_scrollListenerAttached) {
    container.addEventListener('scroll', () => {
      if (_renderedCount >= _currentFilteredList.length) return;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 250) {
        const nextCount = Math.min(_renderedCount + RENDER_CHUNK_SIZE, _currentFilteredList.length);
        const nextBatch = _currentFilteredList.slice(_renderedCount, nextCount);
        _renderedCount = nextCount;
        const currentSel = studioState.selectedItem?.slug;
        container.insertAdjacentHTML('beforeend', _renderCardBatch(nextBatch, currentSel));
      }
    }, { passive: true });
    _scrollListenerAttached = true;
  }

  // Attach delegation listener once only
  if (!_listDelegated) {
    container.addEventListener('click', _onItemCardClick);
    _listDelegated = true;
  }

  // Auto-select
  if (!selectedSlug || !filtered.some(i => i.slug === selectedSlug)) {
    selectStudioItem(filtered[0]);
  }
}

function _onItemCardClick(e) {
  const card = e.target.closest('.studio-item-card');
  if (!card) return;
  const slug = card.dataset.slug;
  const item = studioState.items.find(i => i.slug === slug);
  if (item) selectStudioItem(item);
}

// ── Item Selection ────────────────────────────────────────────────────────────
// Skip re-read if same item; use cached DOM refs.
async function selectStudioItem(item) {
  if (!item) return;
  const prevSlug = studioState.selectedItem?.slug;
  studioState.selectedItem = item;

  // Active card highlight — only update changed cards
  const container = document.getElementById('studioItemsList');
  if (container) {
    if (prevSlug) {
      container.querySelector(`[data-slug="${prevSlug}"]`)?.classList.remove('active');
    }
    container.querySelector(`[data-slug="${item.slug}"]`)?.classList.add('active');
  }

  // Status bar — batch writes
  const pathEl  = _getRef('studioStatusPath');
  const sizeEl  = _getRef('studioStatusSize');
  const timeEl  = _getRef('studioStatusTime');
  const toolsEl = _getRef('studioStatusToolIcons');
  const favBtn  = _getRef('btnStudioActionFavorite');

  if (pathEl)  pathEl.textContent  = item.primaryPath;
  if (sizeEl)  sizeEl.textContent  = item.sizeFormatted || '';
  if (timeEl)  timeEl.textContent  = item.mtime ? new Date(item.mtime).toLocaleDateString() : '';
  if (toolsEl) toolsEl.innerHTML   = item.tools.map(t => {
    if (window.getToolBadge) return window.getToolBadge(t, { showLabel: true, size: 14 });
    const def = studioState.tools[t];
    return `<span style="font-size:13px;" title="${def?.name || t}">${def?.icon || '⚙️'}</span>`;
  }).join('');
  if (favBtn) favBtn.classList.toggle('active', Boolean(item.isFavorite));

  // ── Footer icon buttons: Folder open + Copy path ───────────────────────
  const openFolderBtn = document.getElementById('btnOpenSkillFolder');
  const copyPathBtn   = document.getElementById('btnCopySkillPath');
  const filePath      = item.primaryPath || item.primaryDir || '';

  /** Open the file's containing folder in the OS file explorer.
   *  window.api.shell.openPath is the unified bridge (api.js):
   *  → Electron: routes to tidyApi.shell.openPath (IPC)
   *  → Web:      routes to POST /api/shell/open (REST)
   */
  const openFolderFn = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!filePath) return;
    if (window.api?.shell?.openPath) {
      window.api.shell.openPath(filePath);
    }
  };

  if (openFolderBtn) {
    openFolderBtn.style.display = 'inline-flex';
    openFolderBtn.onclick = openFolderFn;
  }

  /** Copy the raw file path to the clipboard with brief visual confirmation */
  if (copyPathBtn) {
    copyPathBtn.style.display = 'inline-flex';
    copyPathBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!filePath) return;
      try {
        navigator.clipboard.writeText(filePath).then(() => {
          copyPathBtn.classList.add('copied');
          setTimeout(() => copyPathBtn.classList.remove('copied'), 1500);
        });
      } catch (_) {
        // Fallback for non-HTTPS or older browsers
        const ta = document.createElement('textarea');
        ta.value = filePath;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyPathBtn.classList.add('copied');
        setTimeout(() => copyPathBtn.classList.remove('copied'), 1500);
      }
    };
  }

  if (pathEl) {
    pathEl.style.cursor = 'default';
    pathEl.title = '';
    pathEl.onclick = null;
  }

  // Dispatcher pre-fill
  const dispatchSelect = document.getElementById('dispatchAgentSelect');
  if (dispatchSelect) {
    const opt = Array.from(dispatchSelect.options).find(o => o.value === item.slug || o.value === item.name);
    if (opt) dispatchSelect.value = opt.value;
  }

  // ── Content: use cache if available ──────────────────────────────────────
  let cached = _contentCache.get(item.slug);

  if (!cached) {
    const res = await window.api.studio.readItem(item.primaryPath);
    if (res?.ok && res.data) {
      cached = res.data;
      _contentCache.set(item.slug, cached);
    }
  }

  if (!cached) return;

  // ── Skill Info Card (Above Frontmatter) ─────────────────────────────────
  const skillCard = _getRef('studioSkillCard');
  if (skillCard) {
    const fm = cached.frontmatter || {};
    const version = fm.version || fm.semver || '';
    const author = fm.author || item.authorTag || 'community';
    const cmdsArr = fm.commands || item.commands || [];
    const cmdCount = Array.isArray(cmdsArr) ? cmdsArr.length : 0;

    const rawTitle = item.title || item.name || '';
    const cleanTitle = stripEmojis(rawTitle);
    const rawDesc = item.description || fm.description || '';
    const cleanDesc = stripEmojis(rawDesc);

    const typeLabelMap = { skill: 'Skill', agent: 'Agent', rule: 'Rule', ki: 'Knowledge Item' };
    const typeLabel = typeLabelMap[item.itemType] || item.itemType;

    const toolBadgesHtml = item.tools.map(t => {
      if (window.getToolBadge) return window.getToolBadge(t, { showLabel: true, size: 12 });
      const def = studioState.tools[t];
      return `<span class="studio-skill-tag">${escapeHtml(def?.name || t)}</span>`;
    }).join('');

    const modDate = item.mtime ? new Date(item.mtime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    skillCard.style.display = 'flex';
    skillCard.innerHTML = `
      <div class="studio-skill-card-name">${escapeHtml(cleanTitle)}</div>
      ${cleanDesc ? `<div class="studio-skill-card-desc">${escapeHtml(cleanDesc)}</div>` : ''}
      <div class="studio-skill-card-tags">
        <span class="studio-skill-tag type-${item.itemType}">${typeLabel}</span>
        ${version ? `<span class="studio-skill-tag">v${escapeHtml(version)}</span>` : ''}
        ${toolBadgesHtml}
      </div>
      <div class="studio-skill-card-stats">
        <span class="studio-skill-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <strong>${item.sizeFormatted || '-'}</strong>
        </span>
        ${cmdCount > 0 ? `<span class="studio-skill-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          <strong>${cmdCount}</strong> commands
        </span>` : ''}
        ${modDate ? `<span class="studio-skill-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <strong>${modDate}</strong>
        </span>` : ''}
        <span class="studio-skill-stat" style="margin-left:auto;opacity:0.6;font-size:10.5px;font-family:var(--font-mono);">
          ${escapeHtml(author)}
        </span>
      </div>
    `;
  }

  // Hide separate frontmatter box (metadata is displayed exclusively in the top card)
  const fmBox  = _getRef('studioFrontmatterBox');
  if (fmBox) {
    fmBox.style.display = 'none';
  }

  // Editor textarea — set value only if content changed
  const textEditor = _getRef('studioTextEditor');
  if (textEditor && textEditor.value !== cached.rawContent) {
    textEditor.value = cached.rawContent;
  }

  // Preview — use markdown cache and strip frontmatter block
  const previewBody = _getRef('studioPreviewBody');
  if (previewBody && studioState.editorMode === 'preview') {
    const rawMd = cached.body || cached.rawContent;
    const mdSrc = stripFrontmatter(rawMd);
    previewBody.innerHTML = renderMarkdownSimple(mdSrc);
  }
}

function stripEmojis(str) {
  if (!str) return '';
  return str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu, '').trim();
}

function stripFrontmatter(md) {
  if (!md) return '';
  return md.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]*/, '').trim();
}

function clearStudioDetails() {
  _domRefs.clear();

  const previewBody   = document.getElementById('studioPreviewBody');
  const skillCard     = document.getElementById('studioSkillCard');
  const fmBox         = document.getElementById('studioFrontmatterBox');
  const textEditor    = document.getElementById('studioTextEditor');
  const pathEl        = document.getElementById('studioStatusPath');
  const openFolderBtn = document.getElementById('btnOpenSkillFolder');
  const copyPathBtn   = document.getElementById('btnCopySkillPath');
  const lang          = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  if (skillCard) {
    skillCard.style.display = 'none';
    skillCard.innerHTML = '';
  }
  if (openFolderBtn) openFolderBtn.style.display = 'none';
  if (copyPathBtn)   copyPathBtn.style.display   = 'none';
  if (previewBody)  previewBody.innerHTML = `<div style="text-align:center;color:var(--text-tertiary);padding:80px 20px;font-size:13px;">${lang === 'ar' ? 'اختر عنصراً من القائمة لعرضه وتحريره' : 'Select an item from the list to inspect and edit.'}</div>`;
  if (fmBox)        fmBox.style.display   = 'none';
  if (textEditor)   textEditor.value       = '';
  if (pathEl)       pathEl.textContent     = '';
}

// ── Markdown Renderer ─────────────────────────────────────────────────────────
// Single-pass line processor + LRU-style cache (max 50 entries) to avoid re-parsing unchanged files.
const MD_CACHE_MAX = 50;

function renderMarkdownSimple(md) {
  if (!md) return '';

  // Cache lookup
  if (_markdownCache.has(md)) return _markdownCache.get(md);

  let html = escapeHtml(md);

  // ── Code blocks first (protect from further processing) ──
  const codeBlocks = [];
  html = html.replace(/```[\s\S]*?```/g, match => {
    const idx = codeBlocks.push(match) - 1;
    return `\x00CODE${idx}\x00`;
  });

  // ── Inline code ──
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // ── Horizontal rules ──
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="studio-md-hr">');

  // ── Blockquotes ──
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

  // ── Headers (single combined regex) ──
  html = html.replace(/^(#{1,6}) (.+)$/gm, (_, hashes, text) => {
    const level = Math.min(hashes.length, 4);
    return `<h${level}>${text}</h${level}>`;
  });

  // ── Bold & Italic (combined) ──
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g,         '<em>$1</em>');

  // ── Links ──
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="studio-md-link" data-href="$2" target="_blank" rel="noopener">$1</a>');

  // ── Tables ──
  html = html.replace(/\|(.+)\|/g, match => {
    const cells = match.split('|').slice(1, -1);
    if (cells.some(c => /^[\s:-]+$/.test(c))) return '';
    return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
  });
  html = html.replace(/(<tr>.+<\/tr>)+/g, m =>
    `<div class="table-responsive"><table>${m}</table></div>`
  );

  // ── Lists — process line by line ──
  const lines = html.split('\n');
  const out   = [];
  let inUl = false, inOl = false;

  for (const line of lines) {
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);

    if (ulMatch) {
      if (!inUl) { out.push('<ul>'); inUl = true; }
      let content = ulMatch[1];
      if (/^\[ \]\s*/.test(content)) {
        out.push(`<li class="task-list-item"><input type="checkbox" disabled /> ${content.replace(/^\[ \]\s*/, '')}</li>`);
      } else if (/^\[x\]\s*/i.test(content)) {
        out.push(`<li class="task-list-item"><input type="checkbox" checked disabled /> ${content.replace(/^\[x\]\s*/i, '')}</li>`);
      } else {
        out.push(`<li>${content}</li>`);
      }
      continue;
    } else if (inUl) { out.push('</ul>'); inUl = false; }

    if (olMatch) {
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${olMatch[1]}</li>`);
      continue;
    } else if (inOl) { out.push('</ol>'); inOl = false; }

    out.push(line);
  }
  if (inUl) out.push('</ul>');
  if (inOl) out.push('</ol>');
  html = out.join('\n');

  // ── Paragraphs ──
  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|li|table|div|pre|blockquote)/i.test(block)) return block;
    if (block.startsWith('\x00CODE')) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  // ── Restore code blocks ──
  html = html.replace(/\x00CODE(\d+)\x00/g, (_, i) => {
    const raw = codeBlocks[+i].replace(/^```\w*\n?/, '').replace(/```$/, '');
    return `<pre><code>${raw}</code></pre>`;
  });

  // ── Cache result (evict oldest if over limit) ──
  if (_markdownCache.size >= MD_CACHE_MAX) {
    _markdownCache.delete(_markdownCache.keys().next().value);
  }
  _markdownCache.set(md, html);

  return html;
}

function toggleStudioEditor(mode) {
  studioState.editorMode = mode;
  const previewBody = document.getElementById('studioPreviewBody');
  const fmBox = document.getElementById('studioFrontmatterBox');
  const editorBody = document.getElementById('studioEditorBody');
  const contentArea = document.getElementById('studioDetailContentArea');
  const saveBtn = document.getElementById('btnStudioActionSave');
  const btnEdit = document.getElementById('btnStudioActionEdit');
  const btnPrev = document.getElementById('btnStudioActionPreview');

  if (mode === 'edit') {
    if (previewBody) previewBody.style.display = 'none';
    if (fmBox) fmBox.style.display = 'none';
    if (editorBody) editorBody.style.display = 'flex';
    if (contentArea) contentArea.classList.add('studio-in-edit-mode');
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    if (btnEdit) btnEdit.classList.add('active');
    if (btnPrev) btnPrev.classList.remove('active');
    const textEditor = document.getElementById('studioTextEditor');
    if (textEditor) textEditor.focus();
  } else {
    // Switching back to preview: sync editor content → preview
    const textEditor = document.getElementById('studioTextEditor');
    if (textEditor && previewBody) {
      previewBody.innerHTML = renderMarkdownSimple(textEditor.value);
    }
    if (previewBody) previewBody.style.display = 'block';
    // Restore frontmatter box if item has frontmatter
    if (fmBox && studioState.selectedItem) {
      const code = document.getElementById('studioFrontmatterCode');
      fmBox.style.display = (code && code.textContent.trim()) ? 'block' : 'none';
    }
    if (editorBody) editorBody.style.display = 'none';
    if (contentArea) contentArea.classList.remove('studio-in-edit-mode');
    if (saveBtn) saveBtn.style.display = 'none';
    if (btnEdit) btnEdit.classList.remove('active');
    if (btnPrev) btnPrev.classList.add('active');
  }
}

async function saveCurrentStudioItem() {
  if (!studioState.selectedItem) return;

  const textEditor = document.getElementById('studioTextEditor');
  if (!textEditor) return;

  const content = textEditor.value;
  const filePath = studioState.selectedItem.primaryPath;

  const saveBtn = document.getElementById('btnStudioActionSave');
  // Optimistic UI — disable during save
  if (saveBtn) saveBtn.disabled = true;

  const res = await window.api.studio.saveItem(filePath, content);
  if (saveBtn) saveBtn.disabled = false;

  if (res && res.ok) {
    const sizeEl = document.getElementById('studioStatusSize');
    const timeEl = document.getElementById('studioStatusTime');
    if (sizeEl) sizeEl.textContent = res.data?.sizeFormatted || '';
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

    if (saveBtn) {
      const origContent = saveBtn.innerHTML;
      saveBtn.innerHTML = '<span>✓ Saved!</span>';
      saveBtn.classList.add('studio-save-flash');
      setTimeout(() => {
        saveBtn.innerHTML = origContent;
        saveBtn.classList.remove('studio-save-flash');
      }, 1500);
    }
    // Invalidate content cache for this item so next open re-reads updated file
    _lastScanTs = 0;
    if (studioState.selectedItem) {
      _contentCache.delete(studioState.selectedItem.slug);
      _markdownCache.delete(content); // drop old markdown cache entry too
      if (res.data?.sizeFormatted) studioState.selectedItem.sizeFormatted = res.data.sizeFormatted;
    }
    // Also update preview if currently in preview mode
    if (studioState.editorMode === 'preview') {
      const previewBody = document.getElementById('studioPreviewBody');
      if (previewBody) previewBody.innerHTML = renderMarkdownSimple(content);
    }
  } else {
    alert('Error saving file: ' + (res?.error || 'Unknown error'));
  }
}

function setupStudioListeners() {
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  // 1. Library Filter Buttons (Skills, Agents, Favorites)
  document.querySelectorAll('[data-studio-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-studio-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      studioState.view = btn.getAttribute('data-studio-view');
      // Clear tool & collection filters so user immediately sees all items for this library category
      studioState.activeTool = null;
      studioState.activeCollection = null;
      renderStudioSidebar();
      filterAndRenderStudioItems();
    });
  });

  // 2. Live Search — debounced 150ms to avoid render on every keystroke
  const searchInput = document.getElementById('studioFilterSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      studioState.search = e.target.value;
      clearTimeout(_searchDebounceTimer);
      _searchDebounceTimer = setTimeout(filterAndRenderStudioItems, 150);
    });
    // Clear search with Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        studioState.search = '';
        filterAndRenderStudioItems();
      }
    });
  }

  // 3. Edit / Preview Mode Toggles
  const btnEdit = document.getElementById('btnStudioActionEdit');
  const btnPrev = document.getElementById('btnStudioActionPreview');
  if (btnEdit) btnEdit.addEventListener('click', () => toggleStudioEditor('edit'));
  if (btnPrev) btnPrev.addEventListener('click', () => toggleStudioEditor('preview'));

  // 4. Save Button
  const saveBtn = document.getElementById('btnStudioActionSave');
  if (saveBtn) saveBtn.addEventListener('click', saveCurrentStudioItem);

  // 5. Global Keyboard Save Listener (Ctrl+S / Cmd+S)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      const pane = document.getElementById('pane-subagents');
      if (pane && pane.classList.contains('active')) {
        e.preventDefault();
        saveCurrentStudioItem();
      }
    }
  });

  // 6. Favorite Toggle Button
  const favBtn = document.getElementById('btnStudioActionFavorite');
  if (favBtn) {
    favBtn.addEventListener('click', async () => {
      if (!studioState.selectedItem) return;
      const item = studioState.selectedItem;
      const res = await window.api.studio.toggleFavorite({
        itemPath: item.primaryPath,
        itemType: item.itemType,
        tool: item.tools[0] || 'global'
      });
      if (res && res.ok) {
        item.isFavorite = res.data?.isFavorite;
        favBtn.classList.toggle('active', Boolean(item.isFavorite));
        const badgeFavs = document.getElementById('badgeTotalFavorites');
        if (badgeFavs) {
          const cur = parseInt(badgeFavs.textContent, 10) || 0;
          badgeFavs.textContent = item.isFavorite ? cur + 1 : Math.max(0, cur - 1);
        }
        filterAndRenderStudioItems();
      }
    });
  }

  // 7. Validate Skills-LAB Button
  const valBtn = document.getElementById('btnStudioActionValidate');
  if (valBtn) {
    valBtn.addEventListener('click', async () => {
      if (!studioState.selectedItem) return;
      const res = await window.api.studio.validateItem(studioState.selectedItem.primaryPath);
      if (res && res.ok && res.data) {
        const d = res.data;
        document.getElementById('valReportSkillName').textContent = d.meta?.name || studioState.selectedItem.name;
        document.getElementById('valReportPath').textContent = d.meta?.path || studioState.selectedItem.primaryPath;
        const scoreEl = document.getElementById('valReportScore');
        if (scoreEl) {
          scoreEl.textContent = d.score;
          scoreEl.style.color = d.score >= 80 ? '#10b981' : (d.score >= 50 ? '#f59e0b' : '#ef4444');
        }

        const checksList = document.getElementById('valReportChecksList');
        if (checksList) {
          checksList.innerHTML = (d.checks || []).map(c => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; background: var(--bg-surface); border: 1px solid var(--border-subtle); font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600;">${c.pass ? '✅' : '❌'}</span>
                <span>${escapeHtml(c.rule)}</span>
              </div>
              <span style="color: var(--text-secondary); font-size: 11.5px;">${escapeHtml(c.message)}</span>
            </div>
          `).join('');
        }
        openModal('modalStudioValidation');
      }
    });
  }

  // 8. Assign Collection Button
  const colBtn = document.getElementById('btnStudioActionCollection');
  if (colBtn) {
    colBtn.addEventListener('click', () => {
      if (!studioState.selectedItem) return;
      const item = studioState.selectedItem;
      const checklist = document.getElementById('assignCollectionsChecklist');
      if (checklist) {
        checklist.innerHTML = studioState.collections.map(c => {
          const isChecked = item.collections && item.collections.includes(c.id);
          return `
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px; border-radius: 6px;">
              <input type="checkbox" data-assign-col-id="${c.id}" ${isChecked ? 'checked' : ''} />
              <span style="color: ${c.color || '#3b82f6'};">●</span>
              <span style="font-size: 13px; font-weight: 500;">${escapeHtml(c.name)}</span>
            </label>
          `;
        }).join('');
      }
      openModal('modalStudioAssignCollection');
    });
  }

  // Submit Assign Collections
  const submitAssign = document.getElementById('btnSubmitAssignCollections');
  if (submitAssign) {
    submitAssign.addEventListener('click', async () => {
      if (!studioState.selectedItem) return;
      const item = studioState.selectedItem;
      const checkboxes = document.querySelectorAll('[data-assign-col-id]');
      const nextCols = [];

      for (const cb of checkboxes) {
        const colId = cb.getAttribute('data-assign-col-id');
        if (cb.checked) {
          nextCols.push(colId);
          await window.api.studio.assignCollection({
            collectionId: colId,
            itemPath: item.primaryPath,
            itemType: item.itemType,
            tool: item.tools[0] || 'global'
          });
        } else {
          await window.api.studio.removeCollection({
            collectionId: colId,
            itemPath: item.primaryPath
          });
        }
      }

      item.collections = nextCols;
      closeModal('modalStudioAssignCollection');
      loadSubagents();
    });
  }

  // 9. Delete Item Button
  const delBtn = document.getElementById('btnStudioActionDelete');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!studioState.selectedItem) return;
      const item = studioState.selectedItem;
      const promptText = lang === 'ar'
        ? `هل أنت متأكد من حذف الملف "${item.name}" نهائياً من القرص؟`
        : `Are you sure you want to permanently delete "${item.name}" from disk?`;

      if (confirm(promptText)) {
        const res = await window.api.studio.deleteItem(item.primaryPath);
        if (res && res.ok) {
          // 1. Optimistic removal: remove immediately from local items
          studioState.items = studioState.items.filter(i =>
            i.primaryPath !== item.primaryPath && i.slug !== item.slug
          );
          _contentCache.delete(item.slug);
          _lastScanTs = 0;
          studioState.selectedItem = null;
          clearStudioDetails();

          // 2. Re-render list & sidebar immediately (0ms visual lag)
          filterAndRenderStudioItems();
          renderStudioSidebar();

          // 3. Force rescan from server in background to sync counters
          await loadSubagents(true);
        } else {
          alert('Error deleting file: ' + (res?.error || 'Unknown error'));
        }
      }
    });
  }

  // 10. Rescan Button
  const rescanBtn = document.getElementById('btnStudioRescan');
  if (rescanBtn) {
    rescanBtn.addEventListener('click', async () => {
      rescanBtn.disabled = true;
      const origText = rescanBtn.innerHTML;
      rescanBtn.innerHTML = `<span>⏳ ${lang === 'ar' ? 'جاري الفحص...' : 'Rescanning...'}</span>`;
      await loadSubagents(true);
      rescanBtn.innerHTML = origText;
      rescanBtn.disabled = false;
    });
  }

  // 11. New Item Modal & Creation
  const newBtn1 = document.getElementById('btnStudioQuickNew');
  const newBtn2 = document.getElementById('btnStudioActionNew');
  if (newBtn1) newBtn1.addEventListener('click', () => openModal('modalStudioNewItem'));
  if (newBtn2) newBtn2.addEventListener('click', () => openModal('modalStudioNewItem'));

  const submitCreateItem = document.getElementById('btnSubmitCreateStudioItem');
  if (submitCreateItem) {
    submitCreateItem.addEventListener('click', async () => {
      const tool = document.getElementById('inputStudioTool')?.value || 'claude';
      const type = document.getElementById('inputStudioType')?.value || 'skill';
      const name = document.getElementById('inputStudioName')?.value || '';
      const desc = document.getElementById('inputStudioDesc')?.value || '';

      if (!name.trim()) {
        alert(lang === 'ar' ? 'يرجى إدخال اسم العنصر' : 'Please enter an item name');
        return;
      }

      const res = await window.api.studio.createItem({ tool, type, name, description: desc });
      if (res && res.ok) {
        closeModal('modalStudioNewItem');
        const nameInput = document.getElementById('inputStudioName');
        const descInput = document.getElementById('inputStudioDesc');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';

        // Invalidate caches and force fresh scan
        _lastScanTs = 0;
        _contentCache.clear();
        await loadSubagents(true);

        const createdItem = studioState.items.find(i =>
          i.name === res.data?.name ||
          i.slug === res.data?.name ||
          i.primaryPath === res.data?.filePath
        );
        if (createdItem) selectStudioItem(createdItem);
      } else {
        alert('Error creating item: ' + (res?.error || 'Unknown error'));
      }
    });
  }

  // 12. Add New Collection Modal & Creation
  const addColBtn = document.getElementById('btnAddCollectionModal');
  if (addColBtn) addColBtn.addEventListener('click', () => openModal('modalStudioNewCollection'));

  const submitCreateCol = document.getElementById('btnSubmitCreateCollection');
  if (submitCreateCol) {
    submitCreateCol.addEventListener('click', async () => {
      const name = document.getElementById('inputColName')?.value || '';
      const color = document.getElementById('inputColColor')?.value || '#3b82f6';

      if (!name.trim()) {
        alert(lang === 'ar' ? 'يرجى إدخال اسم المجموعة' : 'Please enter a collection name');
        return;
      }

      const res = await window.api.studio.createCollection({ name, color });
      if (res && res.ok) {
        closeModal('modalStudioNewCollection');
        const colInput = document.getElementById('inputColName');
        if (colInput) colInput.value = '';
        _lastScanTs = 0;
        await loadSubagents(true);
      } else {
        alert('Error creating collection: ' + (res?.error || 'Unknown error'));
      }
    });
  }

  const getContainer = () => document.querySelector('.studio-container');

  // 13. Studio Tools Panel Toggle Button (Collapse / Expand Left Panel)
  const toggleToolsBtn = document.getElementById('btnToggleStudioTools');
  if (toggleToolsBtn) {
    const updateToolsToggleState = (isCollapsed) => {
      const container = getContainer();
      if (!container) return;
      container.classList.toggle('tools-collapsed', isCollapsed);
      toggleToolsBtn.classList.toggle('active', isCollapsed);
      toggleToolsBtn.title = isCollapsed
        ? (lang === 'ar' ? 'إظهار شريط الأدوات والمجموعات' : 'Show Tools & Collections Sidebar')
        : (lang === 'ar' ? 'طي شريط الأدوات والمجموعات' : 'Hide Tools & Collections Sidebar');
      try {
        localStorage.setItem('tidy_studio_tools_collapsed', isCollapsed ? '1' : '0');
      } catch (e) {}
    };

    toggleToolsBtn.onclick = (e) => {
      e.preventDefault();
      const container = getContainer();
      if (!container) return;
      const isCollapsed = container.classList.contains('tools-collapsed');
      updateToolsToggleState(!isCollapsed);
    };

    // Restore saved state
    try {
      if (localStorage.getItem('tidy_studio_tools_collapsed') === '1') {
        updateToolsToggleState(true);
      }
    } catch (e) {}
  }

  // 14. Studio Workspace Maximize / Focus Mode
  const maxBtn = document.getElementById('btnStudioMaximize');
  if (maxBtn) {
    const updateMaximizeState = (isMaximized) => {
      const container = getContainer();
      if (!container) return;
      container.classList.toggle('editor-maximized', isMaximized);
      maxBtn.classList.toggle('active', isMaximized);
      const label = document.getElementById('btnStudioMaximizeLabel');
      if (label) {
        label.textContent = isMaximized
          ? (lang === 'ar' ? 'استعادة' : 'Restore')
          : (lang === 'ar' ? 'توسيع' : 'Expand');
      }
      maxBtn.title = isMaximized
        ? (lang === 'ar' ? 'استعادة التقسيم الافتراضي' : 'Restore Default 3-Pane Layout')
        : (lang === 'ar' ? 'توسيع مساحة العمل' : 'Expand Workspace');

      const svg = maxBtn.querySelector('svg');
      if (svg) {
        svg.innerHTML = isMaximized
          ? '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>'
          : '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>';
      }
    };

    maxBtn.onclick = (e) => {
      e.preventDefault();
      const container = getContainer();
      if (!container) return;
      const isMaximized = container.classList.contains('editor-maximized');
      updateMaximizeState(!isMaximized);
    };
  }

  // 15. Smart Markdown Link Navigation & Resolution
  const previewBody = document.getElementById('studioPreviewBody');
  if (previewBody && !previewBody._linksBound) {
    previewBody._linksBound = true;
    previewBody.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const rawHref = link.getAttribute('data-href') || link.getAttribute('href');
      if (!rawHref) return;

      e.preventDefault();
      e.stopPropagation();

      // Case A: In-page anchor link (#section)
      if (rawHref.startsWith('#')) {
        const targetId = rawHref.slice(1);
        const targetEl = previewBody.querySelector(`[id="${CSS.escape(targetId)}"]`) ||
          Array.from(previewBody.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .find(h => h.textContent.trim().toLowerCase().replace(/\s+/g, '-') === targetId.toLowerCase());
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // Case B: External web URLs (http, https, mailto)
      if (/^(https?:\/\/|mailto:)/i.test(rawHref)) {
        if (window.tidyApi?.shell?.openExternal) {
          window.tidyApi.shell.openExternal(rawHref);
        } else {
          window.open(rawHref, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // Case C: Local document / relative file navigation
      if (!studioState.selectedItem) return;

      const currentPath = studioState.selectedItem.primaryPath;
      const currentDir = studioState.selectedItem.primaryDir ||
        currentPath.substring(0, Math.max(currentPath.lastIndexOf('/'), currentPath.lastIndexOf('\\')));

      const resolvedPath = resolveRelativeFilePath(currentDir, rawHref);

      try {
        const res = await window.api.studio.readItem(resolvedPath);
        if (res && res.ok && res.data) {
          renderReferencedDocPreview(res.data, rawHref, resolvedPath);
        } else {
          showDocNotFoundNotice(rawHref, resolvedPath);
        }
      } catch (err) {
        showDocNotFoundNotice(rawHref, resolvedPath);
      }
    });
  }
}

function resolveRelativeFilePath(baseDir, relativePath) {
  const cleanBase = (baseDir || '').replace(/\\/g, '/').replace(/\/$/, '');
  const cleanRel = (relativePath || '').replace(/\\/g, '/').split('#')[0].split('?')[0];

  if (/^([a-zA-Z]:|\/)/.test(cleanRel)) {
    return cleanRel;
  }

  const baseParts = cleanBase ? cleanBase.split('/') : [];
  const relParts = cleanRel.split('/');

  for (const part of relParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (baseParts.length > 1) baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }

  return baseParts.join('/');
}

function renderReferencedDocPreview(docData, relPath, absPath) {
  const previewBody = document.getElementById('studioPreviewBody');
  if (!previewBody) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  const parentItem = studioState.selectedItem;

  const navBar = document.createElement('div');
  navBar.className = 'studio-ref-doc-banner';
  navBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:16px;background:var(--bg-surface-elevated,#f8fafc);border:1px solid var(--border-subtle,#e2e8f0);border-radius:8px;font-size:12.5px;';
  navBar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <button class="btn-studio-back-ref" id="btnStudioRefBack" style="background:var(--bg-card,#ffffff);border:1px solid var(--border-subtle,#cbd5e1);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;color:var(--text-primary,#0f172a);">
        <span>←</span>
        <span>${lang === 'ar' ? 'العودة إلى' : 'Back to'} ${escapeHtml(parentItem.name)}</span>
      </button>
      <span style="color:var(--text-tertiary,#94a3b8);">•</span>
      <span style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--text-secondary,#475569);">${escapeHtml(relPath)}</span>
    </div>
    <span style="font-size:11.5px;color:var(--text-tertiary,#94a3b8);">${docData.sizeFormatted || ''}</span>
  `;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'studio-ref-doc-content';
  const mdSrc = stripFrontmatter(docData.body || docData.rawContent || '');
  contentDiv.innerHTML = renderMarkdownSimple(mdSrc);

  previewBody.innerHTML = '';
  previewBody.appendChild(navBar);
  previewBody.appendChild(contentDiv);

  const backBtn = navBar.querySelector('#btnStudioRefBack') || document.getElementById('btnStudioRefBack');
  backBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (parentItem) {
      selectStudioItem(parentItem);
    }
  });
}

function showDocNotFoundNotice(relPath, absPath) {
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  const previewBody = document.getElementById('studioPreviewBody');
  if (!previewBody) return;

  const existing = previewBody.querySelector('.studio-ref-not-found');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'studio-ref-not-found';
  banner.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:12.5px;color:#b91c1c;';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:15px;">⚠️</span>
      <span>${lang === 'ar' ? 'الملف المشار إليه غير متوفر محلياً:' : 'Referenced file not found on disk:'} <strong style="font-family:var(--font-mono);">${escapeHtml(relPath)}</strong></span>
    </div>
    <button style="background:transparent;border:none;cursor:pointer;color:#b91c1c;font-size:15px;padding:0 4px;" onclick="this.parentElement.remove()">✕</button>
  `;
  previewBody.prepend(banner);
  setTimeout(() => { if (banner.isConnected) banner.remove(); }, 6000);
}

// Global exports
window.loadSubagents = loadSubagents;
window.selectStudioItem = selectStudioItem;
window.filterAndRenderStudioItems = filterAndRenderStudioItems;
window.studioState = studioState;
window.openItemInStudio = async function(identifierOrPath) {
  if (typeof window.switchTab === 'function') {
    window.switchTab('subagents');
  }
  if (!studioState.items || studioState.items.length === 0) {
    await loadSubagents();
  }
  const norm = (identifierOrPath || '').replace(/\\/g, '/').toLowerCase();
  const match = studioState.items.find(i => {
    const p = (i.filePath || '').replace(/\\/g, '/').toLowerCase();
    const s = (i.slug || '').toLowerCase();
    const n = (i.name || '').toLowerCase();
    return p.endsWith(norm) || norm.endsWith(p) || s === norm || n === norm;
  });
  if (match) {
    selectStudioItem(match);
  }
};

// Auto-bind listeners when document is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!studioListenersBound) { setupStudioListeners(); studioListenersBound = true; }
    });
  } else {
    setTimeout(() => {
      if (!studioListenersBound) { setupStudioListeners(); studioListenersBound = true; }
    }, 0);
  }
}
