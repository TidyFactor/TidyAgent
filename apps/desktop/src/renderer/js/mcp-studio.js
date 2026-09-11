/**
 * Tidy Ecosystem — MCP Studio Controller
 * Multi-IDE Model Context Protocol Server Manager.
 * Governs MCP configurations across Antigravity, Cursor, VS Code, Claude, and Windsurf.
 *
 * @module apps/desktop/renderer/js/mcp-studio
 * @version 1.5.0
 * @license Apache-2.0
 */

(function () {
  'use strict';

  // State
  let mcpState = {
    activeFilter: 'all',     // 'all' | 'antigravity' | 'cursor' | 'vscode' | 'claude' | 'windsurf'
    viewMode: 'servers',     // 'servers' | 'catalog'
    searchQuery: '',
    ides: [],
    servers: [],
    catalog: [],
    totalCount: 0,
    loading: false
  };

  const getLang = () => (window.getCurrentLang ? window.getCurrentLang() : (document.documentElement.getAttribute('lang') || 'en'));
  const isAr = () => getLang() === 'ar';
  const t = (k, fb) => (window.t ? window.t(k, fb) : fb);

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 1-click clipboard copy with visual feedback
  window.mcpCopyCommand = function(btn, text) {
    if (!navigator.clipboard || !text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      btn.classList.add('copied');
      const originalSvg = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:12px; height:12px; stroke:#10b981; stroke-width:2.5; fill:none;"><polyline points="20 6 9 17 4 12"/></svg>`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalSvg;
      }, 1400);
    }).catch(err => console.warn('[MCP] Copy failed:', err));
  };

  const IDE_BADGE_STYLES = {
    antigravity: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', label: 'Antigravity' },
    cursor: { bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)', label: 'Cursor' },
    vscode: { bg: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)', label: 'VS Code' },
    claude: { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)', label: 'Claude' },
    windsurf: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', label: 'Windsurf' }
  };

  /**
   * Load MCP Studio scan data and catalog
   */
  async function loadMcpStudio(force = false) {
    const grid = document.getElementById('mcpServersGrid');
    const lang = isAr() ? 'ar' : 'en';

    if (mcpState.loading) return;
    mcpState.loading = true;

    if (grid && mcpState.servers.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; color:var(--text-secondary); text-align:center;">
          <div style="width:26px; height:26px; border:3px solid var(--border-subtle); border-top-color:var(--qhr-color-primary, #1D4ED8); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:12px;"></div>
          <div style="font-size:13px; font-weight:500;">${lang === 'ar' ? 'جاري فحص إعدادات بروتوكول MCP...' : 'Scanning MCP configurations...'}</div>
        </div>`;
    }

    try {
      const [scanRes, catRes] = await Promise.all([
        window.api?.mcp?.scan ? window.api.mcp.scan() : { ok: false, error: 'MCP API unavailable' },
        window.api?.mcp?.catalog ? window.api.mcp.catalog() : { ok: false, error: 'Catalog API unavailable' }
      ]);

      if (scanRes?.ok && scanRes.data) {
        mcpState.ides = scanRes.data.ides || [];
        mcpState.servers = scanRes.data.servers || [];
        mcpState.totalCount = scanRes.data.totalCount || 0;
      } else {
        const errorMsg = scanRes?.error || 'Failed to scan MCP servers';
        console.error('[MCP Studio] Scan failed:', errorMsg);
        if (grid) {
          grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:50px 20px; font-size:13px;">
              <div style="color:#ef4444; font-weight:700; margin-bottom:8px; font-size:14px;">${isAr() ? 'تعذر جلب إعدادات خوادم MCP' : 'Failed to load MCP configurations'}</div>
              <div style="font-family:var(--font-mono, monospace); font-size:11px; margin-bottom:14px; color:var(--text-secondary); background:var(--bg-tertiary); display:inline-block; padding:6px 12px; border-radius:6px;">${escapeHtml(errorMsg)}</div>
              <div>
                <button class="btn btn-sm btn-primary" onclick="window.loadMcpStudio(true)">${isAr() ? 'إعادة المحاولة' : 'Retry'}</button>
              </div>
            </div>`;
        }
        return;
      }

      if (catRes?.ok && catRes.data) {
        mcpState.catalog = catRes.data || [];
      }

      updateMcpBadges();
      renderMcpContent();
    } catch (err) {
      console.error('[MCP Studio] Failed to load:', err);
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align:center; color:var(--text-tertiary); padding:40px 16px; font-size:13px;">
            <div style="color:#ef4444; font-weight:600; margin-bottom:8px;">${isAr() ? 'تعذر فحص خوادم MCP' : 'Failed to scan MCP servers'}</div>
            <div style="font-family:var(--font-mono, monospace); font-size:11px; color:var(--text-secondary);">${escapeHtml(err.message)}</div>
          </div>`;
      }
    } finally {
      mcpState.loading = false;
    }
  }

  /**
   * Update header badges, chip counts, and detected status dots
   */
  function updateMcpBadges() {
    const totalBadge = document.getElementById('badgeMcpTotal');
    const catalogBadge = document.getElementById('badgeMcpCatalog');

    if (totalBadge) totalBadge.textContent = mcpState.totalCount;
    if (catalogBadge) catalogBadge.textContent = mcpState.catalog.length;

    // Update count & status dot directly on IDE filter chips
    for (const ide of mcpState.ides) {
      const chipBadge = document.getElementById(`mcpBadge_${ide.id}`);
      if (chipBadge) chipBadge.textContent = ide.serverCount;

      const chipDot = document.getElementById(`mcpDot_${ide.id}`);
      if (chipDot) {
        chipDot.classList.toggle('detected', Boolean(ide.exists));
        chipDot.title = ide.exists
          ? (isAr() ? `تم اكتشاف التهيئة (${ide.serverCount} خوادم مسجلة)` : `Config active (${ide.serverCount} servers)`)
          : (isAr() ? 'لم يتم العثور على المسار بعد' : 'Config path not detected');
      }
    }

    // If legacy container exists, keep it empty or clear
    const ideBadgesContainer = document.getElementById('mcpIdeCountsRow');
    if (ideBadgesContainer) {
      ideBadgesContainer.innerHTML = '';
      ideBadgesContainer.style.display = 'none';
    }
  }

  /**
   * Main render router based on active view mode
   */
  function renderMcpContent() {
    if (mcpState.viewMode === 'catalog') {
      renderMcpCatalog();
    } else {
      renderMcpServersGrid();
    }
  }

  /**
   * Render installed servers card grid
   */
  function renderMcpServersGrid() {
    const grid = document.getElementById('mcpServersGrid');
    if (!grid) return;

    let list = [...mcpState.servers];

    // Filter by IDE
    if (mcpState.activeFilter !== 'all') {
      list = list.filter(s => s.ideId === mcpState.activeFilter);
    }

    // Filter by search query
    if (mcpState.searchQuery) {
      const q = mcpState.searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.command && s.command.toLowerCase().includes(q)) ||
        (s.url && s.url.toLowerCase().includes(q)) ||
        s.ideName.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      const emptyMsg = mcpState.searchQuery
        ? (isAr() ? 'لا توجد خوادم مطابقة للبحث' : 'No matching servers found')
        : (isAr() ? 'لا توجد خوادم MCP مسجلة في هذا المحرر' : 'No MCP servers configured for this IDE');
      const actionText = isAr() ? 'إضافة خادم جديد' : 'Add New Server';
      const catalogText = isAr() ? 'تصفح الكتالوج' : 'Browse Catalog';

      grid.innerHTML = `
        <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; color:var(--text-tertiary); text-align:center;">
          <svg style="width:48px; height:48px; stroke:currentColor; fill:none; opacity:0.3; margin-bottom:14px;" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="8" rx="2" stroke-width="1.5"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" stroke-width="1.5"></rect>
            <circle cx="6" cy="6" r="1" fill="currentColor"></circle>
            <circle cx="6" cy="18" r="1" fill="currentColor"></circle>
          </svg>
          <div style="font-size:14px; font-weight:600; margin-bottom:8px; color:var(--text-secondary);">${emptyMsg}</div>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button class="btn btn-primary btn-sm" onclick="window.mcpOpenAddModal()">${actionText}</button>
            <button class="btn btn-secondary btn-sm" onclick="window.mcpSetViewMode('catalog')">${catalogText}</button>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(s => {
      const ideBadge = IDE_BADGE_STYLES[s.ideId] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', label: s.ideName };
      const isStdio = s.transport === 'stdio';
      const transportPill = isStdio
        ? `<span class="mcp-transport-pill stdio">stdio</span>`
        : `<span class="mcp-transport-pill sse">sse</span>`;

      const envCount = Object.keys(s.env || {}).length;
      const envPill = envCount > 0
        ? `<span class="mcp-env-pill" title="${escapeHtml(Object.keys(s.env).join(', '))}">env: ${envCount}</span>`
        : '';

      const argsStr = s.args && s.args.length > 0 ? s.args.join(' ') : '';
      const execDisplay = isStdio
        ? `${s.command} ${argsStr}`.trim()
        : s.url;

      const lblTest = isAr() ? 'فحص' : 'Test';
      const lblClone = isAr() ? 'نسخ' : 'Clone';
      const lblEdit = isAr() ? 'تعديل' : 'Edit';
      const lblDelete = isAr() ? 'حذف' : 'Delete';

      return `
        <div class="mcp-server-card">
          <div>
            <div class="mcp-card-header">
              <span class="mcp-ide-tag" style="background:${ideBadge.bg}; color:${ideBadge.color}; border:1px solid ${ideBadge.border || 'transparent'};">
                <span class="chip-dot detected" style="width:5px; height:5px; margin-inline-end:2px;"></span>
                ${escapeHtml(ideBadge.label)}
              </span>
              <div class="mcp-meta-pills">
                ${transportPill}
                ${envPill}
              </div>
            </div>

            <div class="mcp-card-title-row">
              <h4 class="mcp-card-title">
                ${escapeHtml(s.name)}
              </h4>
              ${s.disabled ? `<span class="mcp-disabled-pill">disabled</span>` : ''}
            </div>

            <div class="mcp-command-box" title="${escapeHtml(execDisplay)}">
              <code>${escapeHtml(execDisplay)}</code>
              <button type="button" class="mcp-copy-btn" onclick="window.mcpCopyCommand(this, '${escapeHtml(execDisplay)}')" title="${isAr() ? 'نسخ الأمر' : 'Copy command'}">
                <svg viewBox="0 0 24 24" style="width:12px; height:12px; stroke:currentColor; stroke-width:2; fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>

          <div class="mcp-card-footer">
            <div class="mcp-btn-group">
              <button type="button" class="btn-mcp-action" onclick="window.mcpTestServer('${escapeHtml(s.ideId)}', '${escapeHtml(s.name)}')" title="${isAr() ? 'فحص جاهزية الخادم' : 'Test server connection'}">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>${lblTest}</span>
              </button>
              <button type="button" class="btn-mcp-action" onclick="window.mcpOpenCloneModal('${escapeHtml(s.ideId)}', '${escapeHtml(s.name)}')" title="${isAr() ? 'نسخ إلى محرر آخر' : 'Clone to another IDE'}">
                <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>${lblClone}</span>
              </button>
            </div>
            <div class="mcp-btn-group">
              <button type="button" class="btn-mcp-action" onclick="window.mcpOpenEditModal('${escapeHtml(s.ideId)}', '${escapeHtml(s.name)}')" title="${isAr() ? 'تعديل إعدادات الخادم' : 'Edit server config'}">
                <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>${lblEdit}</span>
              </button>
              <button type="button" class="btn-mcp-action btn-mcp-danger" onclick="window.mcpRemoveServer('${escapeHtml(s.ideId)}', '${escapeHtml(s.name)}')" title="${isAr() ? 'حذف الخادم' : 'Remove server'}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span>${lblDelete}</span>
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /**
   * Render verified catalog cards for 1-click installation
   */
  function renderMcpCatalog() {
    const grid = document.getElementById('mcpServersGrid');
    if (!grid) return;

    let list = [...mcpState.catalog];

    if (mcpState.searchQuery) {
      const q = mcpState.searchQuery.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; color:var(--text-tertiary); padding:40px 16px; font-size:13px;">
          ${isAr() ? 'لا توجد حزم في الكتالوج مطابقة للبحث' : 'No catalog items matching search'}
        </div>`;
      return;
    }

    grid.innerHTML = list.map(item => {
      const installBtnText = item.installed
        ? (isAr() ? 'تثبيت إضافي' : 'Add to Another')
        : (isAr() ? 'تثبيت سريع' : 'Install');

      const fullCommand = `${item.command} ${item.args.join(' ')}`.trim();

      return `
        <div class="mcp-server-card">
          <div>
            <div class="mcp-card-header">
              <span class="mcp-catalog-badge">
                ${escapeHtml(item.category)}
              </span>
              <span class="mcp-catalog-vendor">${escapeHtml(item.vendor)}</span>
            </div>

            <div class="mcp-card-title-row">
              <h4 class="mcp-card-title" style="font-family:inherit;">
                ${escapeHtml(item.name)}
              </h4>
            </div>

            <p class="mcp-catalog-desc">
              ${escapeHtml(item.description)}
            </p>

            <div class="mcp-command-box" title="${escapeHtml(fullCommand)}">
              <code>${escapeHtml(fullCommand)}</code>
              <button type="button" class="mcp-copy-btn" onclick="window.mcpCopyCommand(this, '${escapeHtml(fullCommand)}')" title="${isAr() ? 'نسخ الأمر' : 'Copy command'}">
                <svg viewBox="0 0 24 24" style="width:12px; height:12px; stroke:currentColor; stroke-width:2; fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>

          <div class="mcp-catalog-footer">
            <span style="font-size:11px; font-weight:600; color:${item.installed ? '#10b981' : 'var(--text-tertiary)'}; display:inline-flex; align-items:center; gap:5px;">
              ${item.installed ? `<span style="color:#10b981;">✓</span> ${isAr() ? 'مثبت' : 'Installed'}` : `<span style="opacity:0.6;">○</span> ${isAr() ? 'متاح' : 'Available'}`}
            </span>
            <button type="button" class="btn btn-primary btn-xs" onclick="window.mcpInstallCatalogItem('${escapeHtml(item.id)}')">
              ${installBtnText}
            </button>
          </div>
        </div>`;
    }).join('');
  }

  /**
   * Set active IDE filter
   */
  window.mcpSetFilter = function (filterId) {
    mcpState.activeFilter = filterId;
    mcpState.viewMode = 'servers';

    // Update chip active classes
    document.querySelectorAll('#mcpFilterChips .filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-mcp-filter') === filterId);
    });

    // Toggle view buttons
    const btnServers = document.getElementById('mcpBtnViewServers');
    const btnCatalog = document.getElementById('mcpBtnViewCatalog');
    if (btnServers) btnServers.classList.add('active');
    if (btnCatalog) btnCatalog.classList.remove('active');

    renderMcpServersGrid();
  };

  /**
   * Toggle between Servers view and Catalog view
   */
  window.mcpSetViewMode = function (mode) {
    mcpState.viewMode = mode;

    const btnServers = document.getElementById('mcpBtnViewServers');
    const btnCatalog = document.getElementById('mcpBtnViewCatalog');
    if (btnServers) btnServers.classList.toggle('active', mode === 'servers');
    if (btnCatalog) btnCatalog.classList.toggle('active', mode === 'catalog');

    renderMcpContent();
  };

  /**
   * Test server executable or endpoint
   */
  window.mcpTestServer = async function (ideId, serverName) {
    try {
      const res = await window.api?.mcp?.test(ideId, serverName);
      if (res?.ok) {
        if (window.showToast) {
          window.showToast(`[${serverName}] ${res.message || (isAr() ? 'الخادم يعمل وجاهز' : 'Server is available')}`, 'success');
        } else {
          alert(`[${serverName}]: ${res.message}`);
        }
      } else {
        if (window.showToast) {
          window.showToast(`[${serverName}] ${res?.message || res?.error || (isAr() ? 'فشل فحص الخادم' : 'Server test failed')}`, 'error');
        } else {
          alert(`[${serverName}] Error: ${res?.message || res?.error}`);
        }
      }
    } catch (err) {
      if (window.showToast) window.showToast(err.message, 'error');
    }
  };

  /**
   * Remove a server from an IDE
   */
  window.mcpRemoveServer = async function (ideId, serverName) {
    const confirmMsg = isAr()
      ? `هل تريد بالتاكيد حذف الخادم "${serverName}" من ${ideId}؟`
      : `Are you sure you want to remove server "${serverName}" from ${ideId}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await window.api?.mcp?.remove(ideId, serverName);
      if (res?.ok) {
        if (window.showToast) {
          window.showToast(isAr() ? 'تم حذف الخادم بنجاح' : 'Server removed successfully', 'success');
        }
        await loadMcpStudio(true);
      } else {
        alert(res?.error || 'Failed to remove server');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Open Add Server Modal
   */
  window.mcpOpenAddModal = function () {
    const modal = document.getElementById('mcpServerModal');
    if (!modal) return;

    document.getElementById('mcpModalTitle').textContent = isAr() ? 'إضافة خادم جديد' : 'Add New Server';
    document.getElementById('mcpModalIsEdit').value = '0';
    document.getElementById('mcpModalOriginalName').value = '';

    const selectIde = document.getElementById('mcpModalIdeSelect');
    if (selectIde) {
      selectIde.disabled = false;
      if (mcpState.activeFilter !== 'all') {
        selectIde.value = mcpState.activeFilter;
      } else {
        selectIde.value = 'antigravity';
      }
    }

    document.getElementById('mcpModalServerName').value = '';
    document.getElementById('mcpModalServerName').disabled = false;
    document.getElementById('mcpModalTransportSelect').value = 'stdio';
    document.getElementById('mcpModalCommand').value = 'npx';
    document.getElementById('mcpModalArgs').value = '';
    document.getElementById('mcpModalUrl').value = '';
    document.getElementById('mcpModalEnv').value = '';

    window.mcpToggleTransportFields();
    if (typeof openModal === 'function') {
      openModal('mcpServerModal');
    } else {
      modal.style.display = 'flex';
      modal.classList.add('open', 'active');
    }
  };

  /**
   * Open Edit Server Modal
   */
  window.mcpOpenEditModal = function (ideId, serverName) {
    const modal = document.getElementById('mcpServerModal');
    if (!modal) return;

    const server = mcpState.servers.find(s => s.ideId === ideId && s.name === serverName);
    if (!server) return;

    document.getElementById('mcpModalTitle').textContent = isAr() ? `تعديل: ${serverName}` : `Edit: ${serverName}`;
    document.getElementById('mcpModalIsEdit').value = '1';
    document.getElementById('mcpModalOriginalName').value = serverName;

    const selectIde = document.getElementById('mcpModalIdeSelect');
    if (selectIde) {
      selectIde.value = ideId;
      selectIde.disabled = true; // IDE is locked during edit
    }

    const nameInput = document.getElementById('mcpModalServerName');
    nameInput.value = serverName;
    nameInput.disabled = true; // Name is locked during edit

    const transport = server.transport || (server.command ? 'stdio' : 'sse');
    document.getElementById('mcpModalTransportSelect').value = transport;
    document.getElementById('mcpModalCommand').value = server.command || '';
    document.getElementById('mcpModalArgs').value = (server.args || []).join(' ');
    document.getElementById('mcpModalUrl').value = server.url || '';

    const envStr = server.env && Object.keys(server.env).length > 0
      ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`).join('\n')
      : '';
    document.getElementById('mcpModalEnv').value = envStr;

    window.mcpToggleTransportFields();
    if (typeof openModal === 'function') {
      openModal('mcpServerModal');
    } else {
      modal.style.display = 'flex';
      modal.classList.add('open', 'active');
    }
  };

  /**
   * Open Clone Modal
   */
  window.mcpOpenCloneModal = function (sourceIdeId, serverName) {
    const modal = document.getElementById('mcpCloneModal');
    if (!modal) return;

    document.getElementById('mcpCloneSourceIde').value = sourceIdeId;
    document.getElementById('mcpCloneSourceLabel').textContent = sourceIdeId;
    document.getElementById('mcpCloneServerName').value = serverName;

    const targetSelect = document.getElementById('mcpCloneTargetIdeSelect');
    if (targetSelect) {
      targetSelect.innerHTML = mcpState.ides
        .filter(ide => ide.id !== sourceIdeId)
        .map(ide => `<option value="${ide.id}">${escapeHtml(ide.name)}</option>`)
        .join('');
    }

    if (typeof openModal === 'function') {
      openModal('mcpCloneModal');
    } else {
      modal.style.display = 'flex';
      modal.classList.add('open', 'active');
    }
  };

  /**
   * Submit Clone Server
   */
  window.mcpSubmitClone = async function () {
    const sourceIdeId = document.getElementById('mcpCloneSourceIde').value;
    const targetIdeId = document.getElementById('mcpCloneTargetIdeSelect').value;
    const serverName = document.getElementById('mcpCloneServerName').value.trim();

    if (!serverName) {
      alert(isAr() ? 'اسم الخادم مطلوب' : 'Server name is required');
      return;
    }

    try {
      const res = await window.api?.mcp?.clone(sourceIdeId, targetIdeId, serverName, serverName);
      if (res?.ok) {
        if (window.showToast) {
          window.showToast(isAr() ? 'تم استنساخ الخادم بنجاح' : 'Server cloned successfully', 'success');
        }
        window.mcpCloseModal('mcpCloneModal');
        await loadMcpStudio(true);
      } else {
        alert(res?.error || 'Failed to clone server');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Toggle stdio vs sse form fields
   */
  window.mcpToggleTransportFields = function () {
    const transport = document.getElementById('mcpModalTransportSelect')?.value;
    const stdioGroup = document.getElementById('mcpStdioFieldsGroup');
    const sseGroup = document.getElementById('mcpSseFieldsGroup');

    if (transport === 'sse') {
      if (stdioGroup) stdioGroup.style.display = 'none';
      if (sseGroup) sseGroup.style.display = 'block';
    } else {
      if (stdioGroup) stdioGroup.style.display = 'block';
      if (sseGroup) sseGroup.style.display = 'none';
    }
  };

  /**
   * Save (Add or Update) Server from modal
   */
  window.mcpSaveServerModal = async function () {
    const isEdit = document.getElementById('mcpModalIsEdit').value === '1';
    const ideId = document.getElementById('mcpModalIdeSelect').value;
    const serverName = document.getElementById('mcpModalServerName').value.trim();
    const transport = document.getElementById('mcpModalTransportSelect').value;

    if (!serverName) {
      alert(isAr() ? 'يرجى إدخال اسم الخادم' : 'Please enter server name');
      return;
    }

    const serverConfig = {};

    if (transport === 'sse') {
      const url = document.getElementById('mcpModalUrl').value.trim();
      if (!url) {
        alert(isAr() ? 'يرجى إدخال رابط SSE' : 'Please enter SSE URL');
        return;
      }
      serverConfig.url = url;
    } else {
      const cmd = document.getElementById('mcpModalCommand').value.trim();
      if (!cmd) {
        alert(isAr() ? 'يرجى إدخال الأمر الأساسي' : 'Please enter command');
        return;
      }
      serverConfig.command = cmd;

      const rawArgs = document.getElementById('mcpModalArgs').value.trim();
      if (rawArgs) {
        // Support JSON array or whitespace split
        if (rawArgs.startsWith('[') && rawArgs.endsWith(']')) {
          try {
            serverConfig.args = JSON.parse(rawArgs);
          } catch {
            serverConfig.args = rawArgs.split(/\s+/).filter(Boolean);
          }
        } else {
          serverConfig.args = rawArgs.split(/\s+/).filter(Boolean);
        }
      } else {
        serverConfig.args = [];
      }

      // Parse env lines (KEY=VALUE)
      const rawEnv = document.getElementById('mcpModalEnv').value.trim();
      if (rawEnv) {
        const envObj = {};
        rawEnv.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const k = trimmed.substring(0, idx).trim();
            const v = trimmed.substring(idx + 1).trim();
            if (k) envObj[k] = v;
          }
        });
        if (Object.keys(envObj).length > 0) {
          serverConfig.env = envObj;
        }
      }
    }

    try {
      const fn = isEdit ? window.api?.mcp?.update : window.api?.mcp?.add;
      const res = await fn(ideId, serverName, serverConfig);

      if (res?.ok) {
        if (window.showToast) {
          window.showToast(isAr() ? 'تم حفظ الخادم بنجاح' : 'Server saved successfully', 'success');
        }
        window.mcpCloseModal('mcpServerModal');
        await loadMcpStudio(true);
      } else {
        alert(res?.error || 'Failed to save server');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Install a catalog item into chosen IDE
   */
  window.mcpInstallCatalogItem = function (catalogId) {
    const item = mcpState.catalog.find(c => c.id === catalogId);
    if (!item) return;

    window.mcpOpenAddModal();
    document.getElementById('mcpModalServerName').value = item.id;
    document.getElementById('mcpModalCommand').value = item.command;
    document.getElementById('mcpModalArgs').value = (item.args || []).join(' ');

    if (item.env && Object.keys(item.env).length > 0) {
      const envLines = Object.entries(item.env).map(([k, v]) => `${k}=${v}`).join('\n');
      document.getElementById('mcpModalEnv').value = envLines;
    }
  };

  /**
   * Close any modal by ID
   */
  window.mcpCloseModal = function (modalId) {
    if (typeof closeModal === 'function') {
      closeModal(modalId);
    }
    const el = document.getElementById(modalId);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('open', 'active');
    }
  };

  /**
   * Open config folder in OS file manager
   */
  window.mcpOpenConfigFolder = async function () {
    const activeIde = mcpState.ides.find(i => i.id === mcpState.activeFilter) || mcpState.ides[0];
    if (activeIde?.path) {
      if (window.api?.shell?.openPath) {
        await window.api.shell.openPath(activeIde.path);
      }
    }
  };

  /**
   * Initialize MCP Studio DOM listeners
   */
  function initMcpStudio() {
    // Filter chips
    const filterChips = document.querySelectorAll('#mcpFilterChips .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const filter = chip.getAttribute('data-mcp-filter');
        if (filter) window.mcpSetFilter(filter);
      });
    });

    // Search input
    let searchDebounce;
    document.getElementById('mcpSearchInput')?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        mcpState.searchQuery = e.target.value.trim();
        renderMcpContent();
      }, 200);
    });

    // View mode buttons
    document.getElementById('mcpBtnViewServers')?.addEventListener('click', () => {
      window.mcpSetViewMode('servers');
    });
    document.getElementById('mcpBtnViewCatalog')?.addEventListener('click', () => {
      window.mcpSetViewMode('catalog');
    });

    // Transport select change
    document.getElementById('mcpModalTransportSelect')?.addEventListener('change', () => {
      window.mcpToggleTransportFields();
    });

    // Refresh button
    document.getElementById('mcpBtnRefresh')?.addEventListener('click', () => {
      loadMcpStudio(true);
    });

    // Hook into tab switching: when user navigates to "mcp" tab
    document.querySelectorAll('[data-tab="mcp"], [data-goto="mcp"]').forEach(btn => {
      btn.addEventListener('click', () => {
        loadMcpStudio();
      });
    });

    // Listen for language changes and refresh labels dynamically
    window.addEventListener('tidy:lang-changed', () => {
      if (mcpState.servers.length > 0 || mcpState.catalog.length > 0) {
        updateMcpBadges();
        renderMcpContent();
      }
    });

    // Check if pane-mcp is already active on initialization
    const pane = document.getElementById('pane-mcp');
    if (pane && pane.classList.contains('active')) {
      loadMcpStudio();
    }
  }

  // Lifecycle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMcpStudio);
  } else {
    initMcpStudio();
  }

  // Global export
  window.loadMcpStudio = loadMcpStudio;
})();
