/**
 * Tidy Memory Explorer & Cognitive Architecture Controller
 * SQLite BM25 Full-Text Search, Cognitive Decay, Telemetry, and Instant Cross-View Reactivity.
 */

(function () {
  'use strict';

  let currentMemoriesCache = [];
  let activeFilterCategory = '';
  let activeFilterTier = '';

  const isAr = () => document.documentElement.getAttribute('lang') !== 'en';

  const CATEGORY_NAMES = {
    decision: { ar: 'قرار', en: 'Decision' },
    rule: { ar: 'قاعدة', en: 'Rule' },
    fact: { ar: 'حقيقة', en: 'Fact' },
    pattern: { ar: 'نمط', en: 'Pattern' },
    preference: { ar: 'تفضيل', en: 'Preference' },
    task: { ar: 'مهمة', en: 'Task' }
  };

  const TIER_NAMES = {
    core: { ar: 'نواة', en: 'Core' },
    project: { ar: 'مشروع', en: 'Project' },
    session: { ar: 'جلسة', en: 'Session' },
    ephemeral: { ar: 'عابر', en: 'Ephemeral' }
  };

  const _mdCache = new Map();
  const MD_CACHE_LIMIT = 200;

  /**
   * Escape HTML entities to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Fast, secure markdown to HTML renderer tailored for memory cards
   */
  function renderMemoryMarkdown(raw) {
    if (!raw) return '';
    const src = String(raw).trim();
    if (_mdCache.has(src)) return _mdCache.get(src);

    let text = src;

    // 1. Strip YAML frontmatter if present
    text = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

    // 2. Protect fenced code blocks
    const codeBlocks = [];
    text = text.replace(/(?:^|\n)```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)\r?\n```/g, (match, lang, code) => {
      const idx = codeBlocks.push({ lang, code: escapeHtml(code) }) - 1;
      return `\n\x00CODEBLOCK_${idx}\x00\n`;
    });

    // 3. Protect inline code
    const inlineCodes = [];
    text = text.replace(/`([^`\n]+)`/g, (match, code) => {
      const idx = inlineCodes.push(escapeHtml(code)) - 1;
      return `\x00INLINECODE_${idx}\x00`;
    });

    // 4. Escape remaining HTML
    let html = escapeHtml(text);

    // 5. Horizontal rules
    html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="memory-md-hr" />');

    // 6. Headers (scaled down proportionally for card display)
    html = html.replace(/^#### (.*$)/gm, '<h6 class="memory-md-h">$1</h6>');
    html = html.replace(/^### (.*$)/gm, '<h5 class="memory-md-h">$1</h5>');
    html = html.replace(/^## (.*$)/gm, '<h4 class="memory-md-h">$1</h4>');
    html = html.replace(/^# (.*$)/gm, '<h4 class="memory-md-h">$1</h4>');

    // 7. Blockquotes
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="memory-md-quote">$1</blockquote>');

    // 8. Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 9. Markdown Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="memory-md-link" target="_blank" rel="noopener">$1</a>');

    // 10. Process lists (ordered, unordered, and task checkboxes)
    const lines = html.split('\n');
    const out = [];
    let inUl = false;
    let inOl = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (inOl) { out.push('</ol>'); inOl = false; }
        if (!inUl) { out.push('<ul class="memory-md-ul">'); inUl = true; }
        let content = ulMatch[2];
        if (/^\[ \]\s*/.test(content)) {
          out.push(`<li class="memory-task-item"><input type="checkbox" disabled /> <span>${content.replace(/^\[ \]\s*/, '')}</span></li>`);
        } else if (/^\[x\]\s*/i.test(content)) {
          out.push(`<li class="memory-task-item"><input type="checkbox" checked disabled /> <span>${content.replace(/^\[x\]\s*/i, '')}</span></li>`);
        } else {
          out.push(`<li>${content}</li>`);
        }
        continue;
      } else if (inUl) {
        out.push('</ul>');
        inUl = false;
      }

      if (olMatch) {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (!inOl) { out.push('<ol class="memory-md-ol">'); inOl = true; }
        out.push(`<li>${olMatch[2]}</li>`);
        continue;
      } else if (inOl) {
        out.push('</ol>');
        inOl = false;
      }

      out.push(line);
    }
    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');
    html = out.join('\n');

    // 11. Paragraphs & Multiline breaks
    html = html.split(/\n{2,}/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|table|div|pre|blockquote|hr)/i.test(block)) return block;
      if (block.startsWith('\x00CODEBLOCK')) return block;
      return `<p>${block.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    // 12. Restore inline code
    html = html.replace(/\x00INLINECODE_(\d+)\x00/g, (_, i) => {
      return `<code class="memory-inline-code">${inlineCodes[+i]}</code>`;
    });

    // 13. Restore code blocks
    html = html.replace(/\x00CODEBLOCK_(\d+)\x00/g, (_, i) => {
      const b = codeBlocks[+i];
      const langClass = b.lang ? ` class="language-${escapeHtml(b.lang)}"` : '';
      return `<pre class="memory-code-block"><code${langClass}>${b.code}</code></pre>`;
    });

    // Cache management
    if (_mdCache.size >= MD_CACHE_LIMIT) {
      _mdCache.delete(_mdCache.keys().next().value);
    }
    _mdCache.set(src, html);

    return html;
  }

  /**
   * Calculate and update memory telemetry numbers
   */
  async function updateMemoryTelemetry(memories) {
    const totalEl = document.getElementById('memTelemetryTotal');
    const coreEl = document.getElementById('memTelemetryCore');
    const decisionsEl = document.getElementById('memTelemetryDecisions');
    const ephemeralEl = document.getElementById('memTelemetryEphemeral');

    if (!totalEl) return;

    let all = memories;
    if (!all || all.length === 0) {
      try {
        const res = await window.api.listMemories({ limit: 500 });
        if (res && res.ok && Array.isArray(res.data)) {
          all = res.data;
        }
      } catch (e) {}
    }

    const total = all ? all.length : 0;
    const coreCount = all ? all.filter(m => m.tier === 'core').length : 0;
    const decCount = all ? all.filter(m => m.category === 'decision').length : 0;
    const ephCount = all ? all.filter(m => m.tier === 'ephemeral').length : 0;

    totalEl.textContent = total;
    if (coreEl) coreEl.textContent = coreCount;
    if (decisionsEl) decisionsEl.textContent = decCount;
    if (ephemeralEl) ephemeralEl.textContent = ephCount;
  }

  /**
   * Load memories according to active filters
   */
  async function loadMemories() {
    const tier = activeFilterTier || document.getElementById('memoryTierFilter')?.value || null;
    const cat = activeFilterCategory || null;

    try {
      const res = await window.api.listMemories({ limit: 60, category: cat, tier });
      if (res && res.ok && Array.isArray(res.data)) {
        currentMemoriesCache = res.data;
        renderMemoryCards(res.data);
        renderOverviewMemories(res.data.slice(0, 4));
        updateMemoryTelemetry(res.data);
      }
    } catch (err) {
      console.error('Error loading memories:', err);
    }
  }

  /**
   * Search memories via FTS5 BM25 query
   */
  async function searchMemories(query) {
    if (!query || query.trim().length === 0) {
      return loadMemories();
    }
    const tier = activeFilterTier || document.getElementById('memoryTierFilter')?.value || null;
    const cat = activeFilterCategory || null;

    try {
      const res = await window.api.recallMemory({ query: query.trim(), category: cat, tier, limit: 30 });
      if (res && res.ok && Array.isArray(res.data)) {
        renderMemoryCards(res.data);
      }
    } catch (err) {
      console.error('Error searching memories:', err);
    }
  }

  /**
   * Render memory cards grid
   */
  function renderMemoryCards(memories) {
    const container = document.getElementById('memoryListContainer');
    if (!container) return;

    const arabic = isAr();

    if (!memories || memories.length === 0) {
      container.innerHTML = `
        <div class="skeleton-loader" style="grid-column: 1 / -1; padding: 32px 0;">
          ${arabic ? 'لم يتم العثور على عقد ذاكرة تطابق معايير التصفية.' : 'No memory nodes found matching your criteria.'}
        </div>
      `;
      return;
    }

    container.innerHTML = memories.map((m) => {
      const catLabel = CATEGORY_NAMES[m.category] ? (arabic ? CATEGORY_NAMES[m.category].ar : CATEGORY_NAMES[m.category].en) : m.category;
      const tierLabel = TIER_NAMES[m.tier] ? (arabic ? TIER_NAMES[m.tier].ar : TIER_NAMES[m.tier].en) : m.tier;
      const ctxLabel = m.context_domain || (m.context_id ? m.context_id.replace('ctx_', '') : null);
      const hitsWord = arabic ? 'استدعاء' : 'hits';
      const copyTooltip = arabic ? 'نسخ المحتوى' : 'Copy Content';
      const editTooltip = arabic ? 'تعديل الذاكرة' : 'Edit Memory';
      const deleteTooltip = arabic ? 'حذف الذاكرة' : 'Delete Memory';

      return `
        <div class="memory-card" data-id="${m.id}">
          <div class="memory-header">
            <div class="memory-meta-group">
              <span class="badge-tag ${m.category}">${escapeHtml(catLabel)}</span>
              <span class="version-pill">${escapeHtml(tierLabel)}</span>
              ${ctxLabel ? `<span class="context-pill">${escapeHtml(ctxLabel)}</span>` : ''}
            </div>
            <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">★ ${m.importance || 3}/5</span>
          </div>

          <div class="memory-content" dir="auto">${renderMemoryMarkdown(m.content)}</div>

          <div class="memory-footer">
            <span style="font-family: var(--font-mono); font-size: 11px;">
              ${m.access_count || 0} ${hitsWord}
            </span>
            <div class="memory-actions">
              <button class="memory-action-btn btn-copy-memory" data-id="${m.id}" title="${copyTooltip}" type="button">
                <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
              <button class="memory-action-btn btn-edit-memory" data-id="${m.id}" title="${editTooltip}" type="button">
                <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="memory-action-btn delete btn-delete-memory" data-id="${m.id}" title="${deleteTooltip}" type="button">
                <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Copy listeners
    container.querySelectorAll('.btn-copy-memory').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const node = memories.find(m => m.id === id);
        if (node && node.content) {
          try {
            await navigator.clipboard.writeText(node.content);
            btn.classList.add('copied');
            const origHtml = btn.innerHTML;
            btn.innerHTML = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.innerHTML = origHtml;
            }, 1400);
          } catch (err) {
            console.error('Failed to copy memory:', err);
          }
        }
      });
    });

    // Attach Edit listeners
    container.querySelectorAll('.btn-edit-memory').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const node = memories.find(m => m.id === id) || currentMemoriesCache.find(m => m.id === id);
        if (node) {
          openEditMemoryModal(node);
        }
      });
    });

    // Attach Delete listeners
    container.querySelectorAll('.btn-delete-memory').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const confirmMsg = arabic
          ? 'هل أنت متأكد من حذف هذه الذاكرة نهائياً من قاعدة البيانات؟'
          : 'Are you sure you want to permanently delete this memory node?';

        window.showDeleteConfirm(confirmMsg, async () => {
          await window.api.forgetMemory(id);
          // Instant reactivity across views without page reload
          loadMemories();
          if (window.loadStats) window.loadStats();
        });
      });
    });
  }

  /**
   * Render Recent Memories in the Overview dashboard
   */
  function renderOverviewMemories(memories) {
    const container = document.getElementById('overviewRecentMemories');
    if (!container) return;
    const arabic = isAr();

    if (!memories || memories.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); padding: 12px 0; text-align: center;">${arabic ? 'لا توجد ذكريات بعد.' : 'No memories stored yet.'}</div>`;
      return;
    }

    container.innerHTML = memories.map((m) => `
      <div class="overview-item">
        <div class="overview-item-header">
          <span class="badge-tag ${m.category}">[${(m.category || 'fact').toUpperCase()}]</span>
          <span class="version-pill" style="font-size: 10px;">${m.tier || 'project'}</span>
        </div>
        <div class="overview-item-body" dir="auto">${renderMemoryMarkdown(m.content)}</div>
      </div>
    `).join('');
  }

  /**
   * Update character and word counter for memory modal editor
   */
  function updateMemoryModalCounter() {
    const contentInput = document.getElementById('inputMemoryContent');
    const counterEl = document.getElementById('memContentCounter');
    if (!contentInput || !counterEl) return;
    const val = contentInput.value;
    const charCount = val.length;
    const wordCount = val.trim() ? val.trim().split(/\s+/).length : 0;
    const arabic = isAr();
    counterEl.textContent = arabic
      ? `${charCount} حرف • ${wordCount} كلمة`
      : `${charCount} chars • ${wordCount} words`;
  }

  /**
   * Ensure modal tabs, hints, and labels match current language
   */
  function updateMemoryModalI18n() {
    const arabic = isAr();
    const writeText = document.getElementById('memTabWriteText');
    const previewText = document.getElementById('memTabPreviewText');
    const hintText = document.getElementById('memMarkdownHint');
    const shortcutText = document.getElementById('memSaveShortcutText');

    if (writeText) writeText.textContent = arabic ? 'تحرير' : 'Write';
    if (previewText) previewText.textContent = arabic ? 'معاينة' : 'Preview';
    if (shortcutText) shortcutText.textContent = arabic ? 'للحفظ السريع' : 'to save';
    if (hintText) {
      hintText.innerHTML = arabic
        ? 'Markdown مدعوم: <code>**عريض**</code> <code>`كود`</code> <code># عنوان</code> <code>- قائمة</code>'
        : 'Markdown supported: <code>**bold**</code> <code>`code`</code> <code># header</code> <code>- list</code>';
    }
  }

  /**
   * Reset modal editor tabs to 'Write' mode
   */
  function resetMemoryModalEditorState() {
    const btnWrite = document.getElementById('btnMemTabWrite');
    const btnPreview = document.getElementById('btnMemTabPreview');
    const contentInput = document.getElementById('inputMemoryContent');
    const previewPane = document.getElementById('memoryModalPreview');

    btnWrite?.classList.add('active');
    btnPreview?.classList.remove('active');
    contentInput?.classList.remove('hidden');
    previewPane?.classList.add('hidden');
    updateMemoryModalCounter();
    updateMemoryModalI18n();
  }

  /**
   * Open Modal in Edit Mode
   */
  function openEditMemoryModal(node) {
    const modalTitle = document.getElementById('modalMemoryTitle');
    const modalSubtitle = document.getElementById('modalMemorySubtitle');
    const submitBtnText = document.getElementById('btnSaveMemoryText');
    const idInput = document.getElementById('inputMemoryEditId');
    const contentInput = document.getElementById('inputMemoryContent');
    const catSelect = document.getElementById('inputMemoryCategory');
    const tierSelect = document.getElementById('inputMemoryTier');
    const impSelect = document.getElementById('inputMemoryImportance');

    if (idInput) idInput.value = node.id;
    if (contentInput) contentInput.value = node.content || '';
    if (catSelect) catSelect.value = node.category || 'decision';
    if (tierSelect) tierSelect.value = node.tier || 'project';
    if (impSelect) impSelect.value = String(node.importance || 3);

    const arabic = isAr();
    if (modalTitle) modalTitle.textContent = arabic ? 'تعديل الذاكرة المعرفية' : 'Edit Memory Node';
    if (submitBtnText) submitBtnText.textContent = arabic ? 'حفظ التعديلات' : 'Save Changes';
    if (modalSubtitle) {
      modalSubtitle.textContent = `#${node.id} • ${node.access_count || 0} ${arabic ? 'استدعاء' : 'hits'}`;
      modalSubtitle.style.display = 'block';
    }

    resetMemoryModalEditorState();
    window.openModal('modalNewMemory');
  }

  /**
   * Open Modal in Create Mode
   */
  function openCreateMemoryModal() {
    const modalTitle = document.getElementById('modalMemoryTitle');
    const modalSubtitle = document.getElementById('modalMemorySubtitle');
    const submitBtnText = document.getElementById('btnSaveMemoryText');
    const idInput = document.getElementById('inputMemoryEditId');
    const contentInput = document.getElementById('inputMemoryContent');
    const catSelect = document.getElementById('inputMemoryCategory');
    const tierSelect = document.getElementById('inputMemoryTier');
    const impSelect = document.getElementById('inputMemoryImportance');

    if (idInput) idInput.value = '';
    if (contentInput) contentInput.value = '';
    if (catSelect) catSelect.value = 'decision';
    if (tierSelect) tierSelect.value = 'project';
    if (impSelect) impSelect.value = '3';

    const arabic = isAr();
    if (modalTitle) modalTitle.textContent = arabic ? 'تسجيل ذاكرة أو قرار جديد' : 'Store New Memory';
    if (submitBtnText) submitBtnText.textContent = arabic ? 'حفظ الذاكرة' : 'Save Memory';
    if (modalSubtitle) {
      modalSubtitle.textContent = '';
      modalSubtitle.style.display = 'none';
    }

    resetMemoryModalEditorState();
    window.openModal('modalNewMemory');
  }

  /**
   * Submit Create or Edit Memory
   */
  async function handleMemorySubmit() {
    const idInput = document.getElementById('inputMemoryEditId');
    const contentInput = document.getElementById('inputMemoryContent');
    const catSelect = document.getElementById('inputMemoryCategory');
    const tierSelect = document.getElementById('inputMemoryTier');
    const impSelect = document.getElementById('inputMemoryImportance');
    const submitBtn = document.getElementById('btnSaveMemorySubmit');

    const content = contentInput ? contentInput.value.trim() : '';
    const category = catSelect ? catSelect.value : 'decision';
    const tier = tierSelect ? tierSelect.value : 'project';
    const importance = impSelect ? Number(impSelect.value) : 3;
    const editId = idInput ? idInput.value.trim() : '';

    if (!content) {
      alert(isAr() ? 'محتوى الذاكرة لا يمكن أن يكون فارغاً.' : 'Memory content cannot be empty.');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editId) {
        // Update existing memory
        await window.api.updateMemory({ id: editId, content, category, tier, importance });
      } else {
        // Save new memory
        await window.api.saveMemory({ content, category, tier, importance });
      }

      window.closeModal('modalNewMemory');
      if (contentInput) contentInput.value = '';
      if (idInput) idInput.value = '';

      // Instant cross-view reactivity
      await loadMemories();
      if (window.loadStats) window.loadStats();
    } catch (err) {
      console.error('Error saving/updating memory:', err);
      alert(isAr() ? `تعذر حفظ الذاكرة: ${err.message}` : `Failed to save memory: ${err.message}`);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /**
   * Smart Prune decayed memories
   */
  async function handlePruneMemories() {
    const arabic = isAr();
    const confirmMsg = arabic
      ? 'هل ترغب في تشغيل التنظيف الذكي وحذف الذكريات العابرة المتراجعة تلقائياً؟'
      : 'Are you sure you want to run smart prune on decayed ephemeral memories?';

    window.showDeleteConfirm(confirmMsg, async () => {
      try {
        const res = await window.api.pruneMemories({ olderThanHours: 1, threshold: 0.35 });
        const count = res && res.data ? (res.data.prunedCount || 0) : 0;
        const msg = arabic
          ? `✓ تم تنظيف ${count} من العناصر العابرة بنجاح.`
          : `✓ Successfully pruned ${count} decayed memories.`;

        alert(msg);
        loadMemories();
        if (window.loadStats) window.loadStats();
      } catch (err) {
        console.error('Error pruning memories:', err);
        alert(arabic ? `تعذر التنظيف: ${err.message}` : `Prune failed: ${err.message}`);
      }
    });
  }

  /**
   * Initialize Global Search and Filters
   */
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
          if (window.switchTab) window.switchTab('memory');
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

    // Filter Chips
    const chips = document.querySelectorAll('#memoryFilterChips .filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        activeFilterCategory = chip.getAttribute('data-chip-cat') || '';
        activeFilterTier = chip.getAttribute('data-chip-tier') || '';

        const searchVal = memorySearchInput?.value.trim() || '';
        if (searchVal) {
          searchMemories(searchVal);
        } else {
          loadMemories();
        }
      });
    });

    // Memory Tier select dropdown
    document.getElementById('memoryTierFilter')?.addEventListener('change', () => {
      activeFilterTier = document.getElementById('memoryTierFilter')?.value || '';
      const searchVal = memorySearchInput?.value.trim() || '';
      if (searchVal) {
        searchMemories(searchVal);
      } else {
        loadMemories();
      }
    });

    // Prune Button
    document.getElementById('btnPruneMemories')?.addEventListener('click', handlePruneMemories);

    // Harvest Knowledge Button
    document.getElementById('btnHarvestMemories')?.addEventListener('click', openHarvestModal);
    document.getElementById('btnHarvestRescan')?.addEventListener('click', scanHarvestSources);
    document.getElementById('chkHarvestSelectAll')?.addEventListener('change', toggleHarvestSelectAll);
    document.getElementById('btnSubmitHarvestImport')?.addEventListener('click', handleHarvestSubmit);

    // Create Memory buttons
    document.getElementById('btnCreateMemory')?.addEventListener('click', openCreateMemoryModal);

    // Modal submit button
    document.getElementById('btnSaveMemorySubmit')?.addEventListener('click', handleMemorySubmit);

    // Modal editor tabs and live preview interactions
    initMemoryModalInteractions();
  }

  /**
   * Initialize Write / Preview Tabs and Editor Keyboard Shortcuts
   */
  function initMemoryModalInteractions() {
    const btnWrite = document.getElementById('btnMemTabWrite');
    const btnPreview = document.getElementById('btnMemTabPreview');
    const contentInput = document.getElementById('inputMemoryContent');
    const previewPane = document.getElementById('memoryModalPreview');
    const modal = document.getElementById('modalNewMemory');

    function switchToWrite() {
      if (!btnWrite || !btnPreview || !contentInput || !previewPane) return;
      btnWrite.classList.add('active');
      btnPreview.classList.remove('active');
      contentInput.classList.remove('hidden');
      previewPane.classList.add('hidden');
      contentInput.focus();
    }

    function switchToPreview() {
      if (!btnWrite || !btnPreview || !contentInput || !previewPane) return;
      btnPreview.classList.add('active');
      btnWrite.classList.remove('active');
      contentInput.classList.add('hidden');
      previewPane.classList.remove('hidden');
      const val = contentInput.value.trim();
      if (val) {
        previewPane.innerHTML = renderMemoryMarkdown(val);
      } else {
        const arabic = isAr();
        previewPane.innerHTML = `<div style="color: var(--text-muted); padding: 24px 0; text-align: center; font-style: italic;">${arabic ? 'لا يوجد محتوى للمعاينة بعد...' : 'No content to preview yet...'}</div>`;
      }
    }

    btnWrite?.addEventListener('click', switchToWrite);
    btnPreview?.addEventListener('click', switchToPreview);

    contentInput?.addEventListener('input', updateMemoryModalCounter);

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter submits modal
    modal?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleMemorySubmit();
      }
    });
  }

  let harvestedCandidatesCache = [];
  let selectedCandidateIds = new Set();

  /**
   * Open Harvester Studio and trigger source scan
   */
  async function openHarvestModal() {
    if (typeof window.switchTab === 'function') {
      window.switchTab('harvester');
    }
  }

  /**
   * Scan agent environments and populate candidate list
   */
  async function scanHarvestSources() {
    const arabic = isAr();
    const listContainer = document.getElementById('harvestCandidateList');
    const submitBtn = document.getElementById('btnSubmitHarvestImport');
    const countEl = document.getElementById('harvestSelectionCount');
    const badgeTotal = document.getElementById('badgeHarvestTotal');
    const badgeNew = document.getElementById('badgeHarvestNew');
    const selectAllChk = document.getElementById('chkHarvestSelectAll');

    if (!listContainer) return;

    listContainer.innerHTML = `
      <div class="skeleton-loader" style="padding: 24px; text-align: center;">
        ${arabic ? 'جاري فحص بيئات الوكلاء والعقول المعرفية...' : 'Scanning agent environments and knowledge bases...'}
      </div>
    `;
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await window.api.harvestScan({ checkExisting: true });
      if (!res || !res.ok || !res.data) {
        throw new Error(res?.error || 'Scan failed');
      }

      const { totalScanned, newCount, items } = res.data;
      harvestedCandidatesCache = items || [];
      selectedCandidateIds.clear();

      if (badgeTotal) badgeTotal.textContent = `${totalScanned} ${arabic ? 'عنصر مفحوص' : 'scanned'}`;
      if (badgeNew) badgeNew.textContent = `${newCount} ${arabic ? 'جديد' : 'new'}`;

      if (harvestedCandidatesCache.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 32px 16px; color: var(--text-secondary);">
            ${arabic ? 'لم يتم العثور على معارف جديدة في البيئات المفحوصة.' : 'No knowledge items found in scanned locations.'}
          </div>
        `;
        if (countEl) countEl.textContent = `0 ${arabic ? 'محدد' : 'selected'}`;
        if (selectAllChk) selectAllChk.checked = false;
        return;
      }

      // Default: select all non-imported items
      harvestedCandidatesCache.forEach(item => {
        if (!item.alreadyImported) {
          selectedCandidateIds.add(item.id);
        }
      });

      if (selectAllChk) {
        selectAllChk.checked = selectedCandidateIds.size > 0;
      }

      renderHarvestCandidates();
      updateHarvestSelectionUI();
    } catch (err) {
      console.error('Error scanning harvest sources:', err);
      listContainer.innerHTML = `
        <div style="padding: 24px; color: var(--accent-red, #ef4444); text-align: center;">
          ${arabic ? 'فشل فحص بيئات الوكلاء:' : 'Failed to scan agent environments:'} ${escapeHtml(err.message)}
        </div>
      `;
    }
  }

  /**
   * Render candidate cards inside review modal
   */
  function renderHarvestCandidates() {
    const listContainer = document.getElementById('harvestCandidateList');
    if (!listContainer) return;

    const arabic = isAr();

    listContainer.innerHTML = harvestedCandidatesCache.map(item => {
      const isSelected = selectedCandidateIds.has(item.id);
      const isImported = !!item.alreadyImported;
      const srcLabel = item.sourceLabel || item.source;
      const alreadyBadge = isImported
        ? `<span class="badge amber">${arabic ? 'مسجل مسبقاً' : 'Already in Memory'}</span>`
        : `<span class="badge green">${arabic ? 'عنصر جديد' : 'New Item'}</span>`;

      return `
        <div class="harvest-candidate-card ${isImported ? 'imported' : ''}" id="card_${item.id}">
          <div class="harvest-candidate-header">
            <input type="checkbox"
                   class="harvest-item-check"
                   data-id="${item.id}"
                   ${isSelected ? 'checked' : ''}
                   style="width: 17px; height: 17px; margin-top: 3px; cursor: pointer;" />
            <div class="harvest-candidate-title-wrap">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <span class="harvest-candidate-title">${escapeHtml(item.title)}</span>
                ${alreadyBadge}
              </div>
              <p class="harvest-candidate-summary" dir="auto">${escapeHtml(item.summary)}</p>
            </div>
          </div>

          <div class="harvest-candidate-meta-row">
            <span class="harvest-source-tag">
              <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              ${escapeHtml(srcLabel)}
            </span>
            ${item.sizeFormatted ? `<span class="version-pill">${item.sizeFormatted}</span>` : ''}

            <div style="margin-inline-start: auto; display: flex; align-items: center; gap: 6px;">
              <select class="harvest-select-control harvest-item-category" data-id="${item.id}">
                <option value="decision" ${item.category === 'decision' ? 'selected' : ''}>${arabic ? 'قرار' : 'Decision'}</option>
                <option value="rule" ${item.category === 'rule' ? 'selected' : ''}>${arabic ? 'قاعدة' : 'Rule'}</option>
                <option value="pattern" ${item.category === 'pattern' ? 'selected' : ''}>${arabic ? 'نمط' : 'Pattern'}</option>
                <option value="fact" ${item.category === 'fact' ? 'selected' : ''}>${arabic ? 'حقيقة' : 'Fact'}</option>
                <option value="preference" ${item.category === 'preference' ? 'selected' : ''}>${arabic ? 'تفضيل' : 'Preference'}</option>
                <option value="task" ${item.category === 'task' ? 'selected' : ''}>${arabic ? 'مهمة' : 'Task'}</option>
              </select>

              <select class="harvest-select-control harvest-item-tier" data-id="${item.id}">
                <option value="core" ${item.tier === 'core' ? 'selected' : ''}>${arabic ? 'نواة' : 'Core'}</option>
                <option value="project" ${item.tier === 'project' ? 'selected' : ''}>${arabic ? 'مشروع' : 'Project'}</option>
                <option value="session" ${item.tier === 'session' ? 'selected' : ''}>${arabic ? 'جلسة' : 'Session'}</option>
                <option value="ephemeral" ${item.tier === 'ephemeral' ? 'selected' : ''}>${arabic ? 'عابر' : 'Ephemeral'}</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach checkbox listeners
    listContainer.querySelectorAll('.harvest-item-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          selectedCandidateIds.add(id);
        } else {
          selectedCandidateIds.delete(id);
        }
        updateHarvestSelectionUI();
      });
    });
  }

  /**
   * Update selection counter and import button disabled state
   */
  function updateHarvestSelectionUI() {
    const arabic = isAr();
    const count = selectedCandidateIds.size;
    const countEl = document.getElementById('harvestSelectionCount');
    const submitBtn = document.getElementById('btnSubmitHarvestImport');
    const selectAllChk = document.getElementById('chkHarvestSelectAll');

    if (countEl) {
      countEl.textContent = `${count} ${arabic ? 'محدد' : 'selected'}`;
    }

    if (submitBtn) {
      submitBtn.disabled = count === 0;
    }

    if (selectAllChk) {
      selectAllChk.checked = count > 0 && count === harvestedCandidatesCache.length;
    }
  }

  /**
   * Toggle select all candidates
   */
  function toggleHarvestSelectAll(e) {
    const checked = e.target.checked;
    selectedCandidateIds.clear();

    if (checked) {
      harvestedCandidatesCache.forEach(item => {
        selectedCandidateIds.add(item.id);
      });
    }

    const checkboxes = document.querySelectorAll('#harvestCandidateList .harvest-item-check');
    checkboxes.forEach(chk => {
      chk.checked = checked;
    });

    updateHarvestSelectionUI();
  }

  /**
   * Execute batch import of selected candidates into SQLite SSOT
   */
  async function handleHarvestSubmit() {
    if (selectedCandidateIds.size === 0) return;

    const arabic = isAr();
    const submitBtn = document.getElementById('btnSubmitHarvestImport');
    if (submitBtn) submitBtn.disabled = true;

    // Collect items with user modifications
    const itemsToImport = [];
    for (const item of harvestedCandidatesCache) {
      if (!selectedCandidateIds.has(item.id)) continue;

      const cardEl = document.getElementById(`card_${item.id}`);
      const catSelect = cardEl?.querySelector('.harvest-item-category');
      const tierSelect = cardEl?.querySelector('.harvest-item-tier');

      const chosenCategory = catSelect ? catSelect.value : item.category;
      const chosenTier = tierSelect ? tierSelect.value : item.tier;

      itemsToImport.push({
        title: item.title,
        summary: item.summary,
        content: item.content,
        category: chosenCategory,
        tier: chosenTier,
        importance: item.importance || (chosenTier === 'core' ? 4 : 3)
      });
    }

    try {
      const res = await window.api.harvestImport(itemsToImport);
      if (!res || !res.ok) {
        throw new Error(res?.error || 'Import failed');
      }

      const importedCount = res.data ? res.data.importedCount : itemsToImport.length;
      window.closeModal('modalHarvestMemories');

      alert(arabic
        ? `✓ تم استيراد ${importedCount} عنصر بنجاح إلى قاعدة البيانات السيادية.`
        : `✓ Successfully imported ${importedCount} memories to SQLite SSOT.`);

      // Instant cross-view reactivity
      await loadMemories();
      if (window.loadStats) window.loadStats();
    } catch (err) {
      console.error('Error importing harvested memories:', err);
      alert(arabic ? `تعذر استيراد الذكريات: ${err.message}` : `Failed to import memories: ${err.message}`);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // Hook into lifecycle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGlobalSearch();
      loadMemories();
    });
  } else {
    initGlobalSearch();
    loadMemories();
  }

  // Global exports
  window.loadMemories = loadMemories;
  window.searchMemories = searchMemories;
  window.renderMemoryCards = renderMemoryCards;
  window.renderOverviewMemories = renderOverviewMemories;
  window.initGlobalSearch = initGlobalSearch;
  window.openCreateMemoryModal = openCreateMemoryModal;
  window.openEditMemoryModal = openEditMemoryModal;
  window.openHarvestModal = openHarvestModal;
  window.scanHarvestSources = scanHarvestSources;
})();
