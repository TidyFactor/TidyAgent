/**
 * Tidy Studio & Web Management Console — Root Orchestrator (v1.4.4)
 * Architecture: Clean 4-Tier Modular Domain Engine
 * Powered by Qahera UI Kit Design System.
 */

let activeTab = 'overview';

// ----------------- Tab Navigation & State -----------------
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
  if (!tabId) return;
  activeTab = tabId;

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === `pane-${tabId}`);
  });

  // Lazy-load or refresh tab content
  if (tabId === 'overview') {
    loadStats();
    if (window.loadMemories) window.loadMemories();
    if (window.loadTasks) window.loadTasks();
  } else if (tabId === 'memory') {
    if (window.loadMemories) window.loadMemories();
  } else if (tabId === 'tasks') {
    if (window.loadTasks) window.loadTasks();
  } else if (tabId === 'subagents') {
    if (window.loadSubagents) window.loadSubagents();
  } else if (tabId === 'dispatcher') {
    if (window.populateDispatcherAgents) window.populateDispatcherAgents();
  } else if (tabId === 'snippets') {
    if (window.loadSnippets) window.loadSnippets();
  } else if (tabId === 'journal') {
    if (window.loadJournal) window.loadJournal();
  } else if (tabId === 'vault') {
    if (window.loadVault) window.loadVault();
  } else if (tabId === 'crm') {
    if (window.loadClients) window.loadClients();
  } else if (tabId === 'invoices') {
    if (window.loadInvoices) window.loadInvoices();
  } else if (tabId === 'cashflow') {
    if (window.loadCashflow) window.loadCashflow();
  } else if (tabId === 'harvester') {
    if (window.loadHarvesterIndex) window.loadHarvesterIndex();
  } else if (tabId === 'settings') {
    loadStats();
    if (window.renderThemeGallery) window.renderThemeGallery();
    if (window.loadGovernanceSettings) window.loadGovernanceSettings();
    if (window.loadUserProfile) window.loadUserProfile();
  }
}

function refreshCurrentTab() {
  switchTab(activeTab);
}

// ----------------- Core Engine Telemetry -----------------
async function loadStats() {
  const res = await window.api.getStats();
  if (res && res.ok && res.data) {
    const d = res.data;
    const memEl = document.getElementById('statMemoriesCount');
    const tskEl = document.getElementById('statTasksCount');
    const subEl = document.getElementById('statSubagentsCount');
    if (memEl) memEl.textContent = d.counts?.memories ?? 0;
    if (tskEl) tskEl.textContent = d.counts?.tasks ?? 0;
    if (subEl) subEl.textContent = d.counts?.subagents ?? 4;

    if (d.activeContext) {
      const wsBadge = document.getElementById('activeWorkspaceName');
      if (wsBadge) wsBadge.textContent = d.activeContext.name;
      const topWsBadge = document.getElementById('topBarWorkspaceLabel');
      if (topWsBadge) topWsBadge.textContent = d.activeContext.name;
      const dispWs = document.getElementById('dispatcherActiveWorkspace');
      if (dispWs) dispWs.textContent = `Workspace: ${d.activeContext.name}`;
    }
    if (d.dbPath) {
      const diagPath = document.getElementById('diagDbPath');
      const storageLabel = document.getElementById('storagePathLabel');
      if (diagPath) diagPath.textContent = d.dbPath;
      if (storageLabel) storageLabel.textContent = `SSOT: ${d.dbPath.split(/[\\/]/).pop()}`;
    }
  }
}

async function loadAllData() {
  await Promise.all([
    loadStats(),
    window.loadMemories ? window.loadMemories() : Promise.resolve(),
    window.loadTasks ? window.loadTasks() : Promise.resolve(),
    window.loadSubagents ? window.loadSubagents() : Promise.resolve()
  ]);
}

// ----------------- Adaptive Telemetry Heartbeat -----------------
function startAdaptiveTelemetry() {
  // Adaptive polling every 4s
  setInterval(async () => {
    if (document.hidden) return; // Pause polling when window is minimized/hidden
    await loadStats();
    if (activeTab === 'overview') {
      if (window.loadMemories) await window.loadMemories();
      if (window.loadTasks) await window.loadTasks();
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
  const wsBadge = document.getElementById('currentWorkspaceBadge');
  const wsDropdown = document.getElementById('workspaceDropdownMenu');
  const wsList = document.getElementById('workspaceDropdownList');
  const wsCountBadge = document.getElementById('workspaceCountBadge');
  const sidebar = document.getElementById('mainSidebar') || document.querySelector('.sidebar');

  let cachedContexts = [];

  const renderDropdown = (contexts) => {
    if (!wsList) return;
    if (!Array.isArray(contexts) || contexts.length === 0) {
      wsList.innerHTML = `<div style="padding: 10px; font-size: 11px; color: var(--text-muted); text-align: center;">No workspaces found</div>`;
      return;
    }
    if (wsCountBadge) {
      wsCountBadge.textContent = `${contexts.length} ${contexts.length === 1 ? 'Workspace' : 'Workspaces'}`;
    }

    wsList.innerHTML = contexts.map(c => `
      <button class="workspace-dropdown-item ${c.is_active ? 'is-active' : ''}" data-context-id="${c.id}" type="button">
        <div class="workspace-item-info">
          <span class="workspace-item-name">${c.name}</span>
          <span class="workspace-item-domain">${c.domain || 'general'} &bull; ${c.id}</span>
        </div>
        ${c.is_active ? `
          <span class="workspace-item-check" title="Active">
            <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </span>` : ''}
      </button>
    `).join('');

    // Bind item click
    wsList.querySelectorAll('.workspace-dropdown-item').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-context-id');
        await doSwitchContext(cid);
        closeDropdown();
      });
    });
  };

  const loadAndRenderContexts = async () => {
    try {
      const res = await window.api.listContexts();
      if (res && res.ok && Array.isArray(res.data)) {
        cachedContexts = res.data;
        if (selector) {
          selector.innerHTML = cachedContexts.map(c => `
            <option value="${c.id}" ${c.is_active ? 'selected' : ''}>${c.name} (${c.id})</option>
          `).join('');
        }
        renderDropdown(cachedContexts);
      }
    } catch (err) {
      console.error('Error fetching contexts:', err);
    }
  };

  const doSwitchContext = async (newContextId) => {
    try {
      const res = await window.api.switchContext(newContextId);
      if (res && res.ok) {
        window.dispatchEvent(new CustomEvent('tidy:context-changed', { detail: { contextId: newContextId } }));
        await loadAllData();
        await loadAndRenderContexts();
        refreshCurrentTab();
      }
    } catch (err) {
      console.error('Error switching context:', err);
    }
  };

  const closeDropdown = () => {
    if (wsDropdown) wsDropdown.hidden = true;
    if (wsBadge) {
      wsBadge.classList.remove('is-open');
      wsBadge.setAttribute('aria-expanded', 'false');
    }
  };

  const openDropdown = async () => {
    if (sidebar && sidebar.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
      const appLayout = document.querySelector('.app-layout');
      if (appLayout) appLayout.classList.remove('sidebar-collapsed');
    }
    await loadAndRenderContexts();
    if (wsDropdown) wsDropdown.hidden = false;
    if (wsBadge) {
      wsBadge.classList.add('is-open');
      wsBadge.setAttribute('aria-expanded', 'true');
    }
  };

  const toggleDropdown = () => {
    if (wsDropdown && !wsDropdown.hidden) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  if (wsBadge) {
    wsBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    wsBadge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (wsDropdown && !wsDropdown.hidden) {
      if (!wsDropdown.contains(e.target) && !wsBadge?.contains(e.target)) {
        closeDropdown();
      }
    }
  });

  // Close on Escape globally
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });

  if (selector) {
    selector.addEventListener('change', async (e) => {
      await doSwitchContext(e.target.value);
    });
  }

  // Initial load
  await loadAndRenderContexts();
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

// ----------------- Master Bootstrapper -----------------
document.addEventListener('DOMContentLoaded', () => {
  const initialTheme = window.getCurrentTheme ? window.getCurrentTheme() : 'light';
  const initialLang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  if (window.applyTheme) window.applyTheme(initialTheme);
  if (window.applyLanguage) window.applyLanguage(initialLang);

  initNavigation();
  if (window.initThemeToggle) window.initThemeToggle();
  if (window.initLanguageSelector) window.initLanguageSelector();
  if (window.initQuickNewDropdown) window.initQuickNewDropdown();
  if (window.initGlobalSearch) window.initGlobalSearch();
  if (window.initModals) window.initModals();
  if (window.initTasksHandlers) window.initTasksHandlers();
  if (window.initDispatcher) window.initDispatcher();
  if (window.initMicroAppHandlers) window.initMicroAppHandlers();
  if (window.initOfficeHandlers) window.initOfficeHandlers();
  if (window.initDbMaintenanceHandlers) window.initDbMaintenanceHandlers();
  initSidebarToggle();
  initContextSwitcher();
  initRefreshButton();

  loadAllData();
  startAdaptiveTelemetry();
  if (window.renderThemeGallery) window.renderThemeGallery();
});

// ----------------- Collapsible Sidebar Controller -----------------
function initSidebarToggle() {
  const sidebar = document.getElementById('mainSidebar') || document.querySelector('.sidebar');
  const appLayout = document.querySelector('.app-layout');
  const btnSidebarToggle = document.getElementById('btnToggleSidebar');
  const btnTopbarToggle = document.getElementById('btnTopbarToggleSidebar');

  if (!sidebar) return;

  const setSidebarCollapsed = (collapsed) => {
    sidebar.classList.toggle('collapsed', collapsed);
    if (appLayout) appLayout.classList.toggle('sidebar-collapsed', collapsed);
    try {
      localStorage.setItem('tidy_sidebar_collapsed', collapsed ? '1' : '0');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('tidy:sidebar-toggled', { detail: { collapsed } }));
  };

  const toggleSidebar = () => {
    const isCollapsed = sidebar.classList.contains('collapsed');
    setSidebarCollapsed(!isCollapsed);
  };

  if (btnSidebarToggle) btnSidebarToggle.addEventListener('click', toggleSidebar);
  if (btnTopbarToggle) btnTopbarToggle.addEventListener('click', toggleSidebar);

  // Global Keyboard Shortcut: Ctrl+B or Cmd+B to toggle sidebar
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id !== 'globalSearchInput') {
        return;
      }
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Restore saved state
  try {
    const saved = localStorage.getItem('tidy_sidebar_collapsed');
    if (saved === '1') {
      setSidebarCollapsed(true);
    }
  } catch (e) {}
}

// Global exports
window.switchTab = switchTab;
window.refreshCurrentTab = refreshCurrentTab;
window.loadStats = loadStats;
window.loadAllData = loadAllData;
