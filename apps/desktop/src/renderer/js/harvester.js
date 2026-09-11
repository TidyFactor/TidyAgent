/**
 * Tidy Ecosystem — Autonomous Knowledge Harvester Studio Controller
 * 2-Pane Master-Detail Inspector, Lightweight Metadata Scan, Lazy Document Streaming,
 * and Universal Studio Interoperability Bridge.
 *
 * @module apps/desktop/renderer/js/harvester
 * @version 1.4.5
 * @license Apache-2.0
 */

(function () {
  'use strict';

  // State
  let candidatesList = [];
  let selectedCandidateIds = new Set();
  let activeCandidate = null;
  const fullDocumentCache = new Map(); // sourcePath -> full document object

  let currentStatusFilter = 'all'; // 'all' | 'new' | 'imported'
  let currentSourceFilter = '';    // '' | 'gemini_knowledge' | 'antigravity_brain' | 'rules'
  let currentSearchQuery = '';

  const isAr = () => document.documentElement.getAttribute('lang') !== 'en';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Fast, secure markdown to HTML renderer for full document inspector
   */
  function renderMarkdownPreview(rawMarkdown) {
    if (!rawMarkdown) return '';

    let md = rawMarkdown;

    // Remove frontmatter if present
    md = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

    // Escape raw HTML tags
    md = escapeHtml(md);

    // Code blocks ```lang ... ```
    md = md.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    md = md.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers (#, ##, ###)
    md = md.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    md = md.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    md = md.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes > quote
    md = md.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italics
    md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Horizontal Rules
    md = md.replace(/^---$/gim, '<hr />');

    // Tables (basic row formatting)
    md = md.replace(/^\|(.+)\|$/gim, (match, row) => {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.some(c => c.match(/^:?-+:?$/))) {
        return ''; // delimiter row
      }
      return `<tr>${cols.map(c => `<td>${c}</td>`).join('')}</tr>`;
    });
    md = md.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table>$1</table>');

    // Unordered lists
    md = md.replace(/^[-*+] (.*$)/gim, '<li>$1</li>');
    md = md.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs
    const lines = md.split(/\r?\n\r?\n/);
    const htmlLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<ul') || trimmed.startsWith('<table') || trimmed.startsWith('<hr')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\r?\n/g, '<br />')}</p>`;
    });

    return htmlLines.join('\n');
  }

  /**
   * Load and scan candidate knowledge sources
   */
  async function loadHarvesterIndex(forceRescan = false) {
    const arabic = isAr();
    const listScroll = document.getElementById('harvesterItemsList');
    const badgeTotal = document.getElementById('harvesterTotalCount');
    const badgeNew = document.getElementById('harvesterNewCount');
    const badgeImported = document.getElementById('harvesterImportedCount');
    const rescanBtn = document.getElementById('btnHarvesterRescan');

    if (!listScroll) return;

    if (rescanBtn) rescanBtn.disabled = true;
    listScroll.innerHTML = `
      <div class="skeleton-loader" style="padding: 24px 16px; text-align: center;">
        ${arabic ? 'جاري فحص بيئات الوكلاء والعقول المعرفية...' : 'Scanning agent environments and knowledge sources...'}
      </div>
    `;

    try {
      const res = await window.api.harvestScan({ checkExisting: true });
      if (!res || !res.ok || !res.data) {
        throw new Error(res?.error || 'Failed to scan sources');
      }

      const { totalScanned, newCount, alreadyImportedCount, items } = res.data;
      candidatesList = items || [];
      selectedCandidateIds.clear();

      if (badgeTotal) badgeTotal.textContent = totalScanned || 0;
      if (badgeNew) badgeNew.textContent = newCount || 0;
      if (badgeImported) badgeImported.textContent = alreadyImportedCount || 0;

      // Auto-select all new (non-imported) items
      candidatesList.forEach(item => {
        if (!item.alreadyImported) {
          selectedCandidateIds.add(item.id);
        }
      });

      renderCandidatesList();
      updateBatchImportButtonUI();

      // Auto inspect the first item if available
      if (candidatesList.length > 0) {
        inspectCandidate(candidatesList[0]);
      } else {
        showEmptyInspector();
      }
    } catch (err) {
      console.error('Error loading harvester index:', err);
      listScroll.innerHTML = `
        <div style="padding: 24px 16px; color: var(--accent-red, #ef4444); text-align: center;">
          ${arabic ? 'تعذر فحص المصادر:' : 'Failed to scan sources:'} ${escapeHtml(err.message)}
        </div>
      `;
    } finally {
      if (rescanBtn) rescanBtn.disabled = false;
    }
  }

  /**
   * Filter and render candidates in the left master pane
   */
  function renderCandidatesList() {
    const listScroll = document.getElementById('harvesterItemsList');
    const listBadge = document.getElementById('harvesterListBadge');
    if (!listScroll) return;

    const arabic = isAr();

    // Apply active filters
    let filtered = candidatesList.filter(item => {
      // Status filter
      if (currentStatusFilter === 'new' && item.alreadyImported) return false;
      if (currentStatusFilter === 'imported' && !item.alreadyImported) return false;

      // Source filter
      if (currentSourceFilter) {
        if (currentSourceFilter === 'rules') {
          if (item.source !== 'gemini_rules' && item.source !== 'gemini_global_rule' && item.source !== 'cursor_rules' && item.source !== 'windsurf_memories') {
            return false;
          }
        } else if (item.source !== currentSourceFilter) {
          return false;
        }
      }

      // Search query
      if (currentSearchQuery) {
        const q = currentSearchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchPath = (item.sourcePath || '').toLowerCase().includes(q);
        const matchSum = (item.summary || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPath && !matchSum) return false;
      }

      return true;
    });

    if (listBadge) {
      listBadge.textContent = `${filtered.length} ${arabic ? 'عنصر' : 'items'}`;
    }

    if (filtered.length === 0) {
      listScroll.innerHTML = `
        <div style="padding: 32px 16px; text-align: center; color: var(--text-secondary);">
          ${arabic ? 'لم يتم العثور على عناصر تطابق معايير التصفية.' : 'No candidates match active filter criteria.'}
        </div>
      `;
      return;
    }

    listScroll.innerHTML = filtered.map(item => {
      const isSelected = selectedCandidateIds.has(item.id);
      const isActive = activeCandidate && activeCandidate.id === item.id;
      const isImported = !!item.alreadyImported;
      const srcLabel = item.sourceLabel || item.source;

      const statusChip = isImported
        ? `<span class="badge amber" style="font-size: 10px;">${arabic ? 'مسجل' : 'In Memory'}</span>`
        : `<span class="badge green" style="font-size: 10px;">${arabic ? 'جديد' : 'New'}</span>`;

      const editedChip = item.isEdited
        ? `<span class="badge purple" style="font-size: 9.5px; padding: 1px 5px;">${arabic ? 'مُعدل' : 'Edited'}</span>`
        : '';

      return `
        <div class="harvester-item-card ${isActive ? 'active' : ''} ${isImported ? 'imported' : ''}" data-id="${item.id}">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <input type="checkbox"
                   class="harvester-chk-item"
                   data-id="${item.id}"
                   ${isSelected ? 'checked' : ''}
                   style="width: 16px; height: 16px; margin-top: 2px; cursor: pointer;" />
            <div style="flex: 1; overflow: hidden;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px;">
                <span class="badge-tag ${item.category || 'fact'}" style="font-size: 9.5px; padding: 1px 6px;">${item.category || 'fact'}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                  ${editedChip}
                  ${statusChip}
                  <button class="harvester-card-edit-btn" data-id="${item.id}" title="${arabic ? 'تعديل المسودة في مكانها' : 'Edit Candidate in Place'}" type="button">
                    <svg class="qhr-icon qhr-icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
              <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: var(--text-primary); line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(item.title)}
              </h4>
              <p style="margin: 0; font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${escapeHtml(item.summary)}
              </p>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono); padding-top: 4px; border-top: 1px dashed var(--border-subtle);">
            <span>${escapeHtml(srcLabel)}</span>
            <span>${item.sizeFormatted || ''}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards, checkboxes, and edit buttons
    listScroll.querySelectorAll('.harvester-item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('harvester-chk-item') || e.target.closest('.harvester-card-edit-btn')) return;
        const id = card.getAttribute('data-id');
        const targetItem = candidatesList.find(c => c.id === id);
        if (targetItem) {
          inspectCandidate(targetItem);
          listScroll.querySelectorAll('.harvester-item-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
        }
      });
    });

    listScroll.querySelectorAll('.harvester-card-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const targetItem = candidatesList.find(c => c.id === id);
        if (targetItem) {
          inspectCandidate(targetItem, true);
          listScroll.querySelectorAll('.harvester-item-card').forEach(c => c.classList.remove('active'));
          btn.closest('.harvester-item-card')?.classList.add('active');
        }
      });
    });

    listScroll.querySelectorAll('.harvester-chk-item').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          selectedCandidateIds.add(id);
        } else {
          selectedCandidateIds.delete(id);
        }
        updateBatchImportButtonUI();
      });
    });
  }

  /**
   * Display empty state in detail pane
   */
  function showEmptyInspector() {
    const emptyEl = document.getElementById('harvesterEmptyInspector');
    const contentEl = document.getElementById('harvesterInspectorContent');
    if (emptyEl) emptyEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';
  }

  /**
   * Update character and word counter for in-place draft editor
   */
  function updateHarvesterDocCounter(text) {
    const chars = text ? text.length : 0;
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const counterEl = document.getElementById('harvesterDocCounter');
    if (counterEl) {
      counterEl.textContent = isAr()
        ? `${chars} حرف • ${words} كلمة`
        : `${chars} chars • ${words} words`;
    }
  }

  /**
   * Switch Harvester Inspector to Preview Mode
   */
  function switchToPreviewMode() {
    const btnPreview = document.getElementById('btnHarvesterTabPreview');
    const btnEdit = document.getElementById('btnHarvesterTabEdit');
    const bodyEl = document.getElementById('inspectorDocBody');
    const editContainer = document.getElementById('harvesterEditContainer');

    if (btnPreview) btnPreview.classList.add('active');
    if (btnEdit) btnEdit.classList.remove('active');
    if (bodyEl) bodyEl.style.display = 'block';
    if (editContainer) editContainer.classList.add('hidden');
  }

  /**
   * Switch Harvester Inspector to In-Place Rich Edit Mode
   */
  function switchToEditMode() {
    const btnPreview = document.getElementById('btnHarvesterTabPreview');
    const btnEdit = document.getElementById('btnHarvesterTabEdit');
    const bodyEl = document.getElementById('inspectorDocBody');
    const editContainer = document.getElementById('harvesterEditContainer');
    const textarea = document.getElementById('harvesterEditTextarea');
    const titleInput = document.getElementById('harvesterEditTitleInput');

    if (btnPreview) btnPreview.classList.remove('active');
    if (btnEdit) btnEdit.classList.add('active');
    if (bodyEl) bodyEl.style.display = 'none';
    if (editContainer) editContainer.classList.remove('hidden');

    if (activeCandidate) {
      if (titleInput && (!titleInput.value || titleInput.value !== activeCandidate.title)) {
        titleInput.value = activeCandidate.title || '';
      }
      const cached = fullDocumentCache.get(activeCandidate.sourcePath);
      const currentContent = cached?.content || cached?.rawContent || activeCandidate.content || '';
      if (textarea && textarea.value !== currentContent) {
        textarea.value = currentContent;
      }
      updateHarvesterDocCounter(textarea ? textarea.value : '');
    }

    if (textarea) textarea.focus();
  }

  /**
   * Save candidate draft modifications in-place into memory cache before importing
   */
  function saveCandidateDraft() {
    if (!activeCandidate) return;

    const titleInput = document.getElementById('harvesterEditTitleInput');
    const textarea = document.getElementById('harvesterEditTextarea');
    const catSelect = document.getElementById('inspectorCategorySelect');
    const tierSelect = document.getElementById('inspectorTierSelect');
    const impSelect = document.getElementById('inspectorImportanceSelect');
    const arabic = isAr();

    const newTitle = titleInput ? titleInput.value.trim() : '';
    const newContent = textarea ? textarea.value : '';

    if (!newTitle) {
      alert(arabic ? 'يرجى إدخال عنوان للذاكرة' : 'Please enter a title for the candidate');
      titleInput?.focus();
      return;
    }

    // Update candidate model in-place
    activeCandidate.title = newTitle;
    activeCandidate.content = newContent;
    activeCandidate.isEdited = true;

    if (catSelect) activeCandidate.category = catSelect.value;
    if (tierSelect) activeCandidate.tier = tierSelect.value;
    if (impSelect) activeCandidate.importance = Number(impSelect.value);

    // Auto-extract first informative lines as summary
    const cleanLines = newContent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('---'));
    activeCandidate.summary = cleanLines.slice(0, 2).join(' ').slice(0, 260) || newTitle;

    // Update document cache with revised content and metadata
    const linesCount = newContent.split('\n').length;
    fullDocumentCache.set(activeCandidate.sourcePath, {
      content: newContent,
      rawContent: newContent,
      linesCount,
      mtimeFormatted: arabic ? 'مُعدل محلياً الآن' : 'Edited locally just now'
    });

    // Update inspector view headers
    const titleEl = document.getElementById('inspectorDocTitle');
    if (titleEl) titleEl.textContent = newTitle;

    const linesEl = document.getElementById('inspectorDocLines');
    if (linesEl) linesEl.textContent = `${linesCount} ${arabic ? 'سطر' : 'lines'}`;

    const mtimeEl = document.getElementById('inspectorDocMtime');
    if (mtimeEl) mtimeEl.textContent = arabic ? 'مُعدل محلياً الآن' : 'Edited locally just now';

    const editedBadge = document.getElementById('harvesterEditedBadge');
    if (editedBadge) editedBadge.style.display = 'inline-block';

    // Refresh preview with new markdown
    renderInspectorBody({
      content: newContent,
      linesCount,
      mtimeFormatted: arabic ? 'مُعدل محلياً الآن' : 'Edited locally just now'
    });

    // Switch back to preview tab
    switchToPreviewMode();

    // Re-render candidates list so the active card reflects updated title, summary, and badge
    renderCandidatesList();

    if (window.showToast) {
      window.showToast(arabic ? '✓ تم حفظ تعديل المسودة بنجاح' : '✓ Candidate draft updated in-place', 'success');
    }
  }

  /**
   * Inspect a specific candidate: loads full document content on demand
   */
  async function inspectCandidate(candidate, autoEdit = false) {
    activeCandidate = candidate;
    const arabic = isAr();

    const emptyEl = document.getElementById('harvesterEmptyInspector');
    const contentEl = document.getElementById('harvesterInspectorContent');
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'flex';

    // Populate header info immediately from candidate metadata
    const titleEl = document.getElementById('inspectorDocTitle');
    const statusBadgeEl = document.getElementById('inspectorDocStatusBadge');
    const editedBadgeEl = document.getElementById('harvesterEditedBadge');
    const sourceEl = document.getElementById('inspectorDocSource');
    const sizeEl = document.getElementById('inspectorDocSize');
    const linesEl = document.getElementById('inspectorDocLines');
    const mtimeEl = document.getElementById('inspectorDocMtime');
    const pathEl = document.getElementById('inspectorDocPath');
    const bodyEl = document.getElementById('inspectorDocBody');

    const titleInput = document.getElementById('harvesterEditTitleInput');
    const textarea = document.getElementById('harvesterEditTextarea');

    const catSelect = document.getElementById('inspectorCategorySelect');
    const tierSelect = document.getElementById('inspectorTierSelect');
    const impSelect = document.getElementById('inspectorImportanceSelect');
    const openStudioBtn = document.getElementById('btnInspectorOpenStudio');

    if (titleEl) titleEl.textContent = candidate.title;
    if (sourceEl) sourceEl.textContent = candidate.sourceLabel || candidate.source;
    if (sizeEl) sizeEl.textContent = candidate.sizeFormatted || '';
    if (pathEl) pathEl.textContent = candidate.sourcePath || '';

    if (editedBadgeEl) {
      editedBadgeEl.style.display = candidate.isEdited ? 'inline-block' : 'none';
    }

    if (titleInput) {
      titleInput.value = candidate.title || '';
    }

    if (statusBadgeEl) {
      statusBadgeEl.innerHTML = candidate.alreadyImported
        ? `<span class="badge amber">${arabic ? 'مسجل مسبقاً' : 'Already in Memory'}</span>`
        : `<span class="badge green">${arabic ? 'عنصر جديد' : 'New Candidate'}</span>`;
    }

    if (catSelect) catSelect.value = candidate.category || 'decision';
    if (tierSelect) tierSelect.value = candidate.tier || 'project';
    if (impSelect) impSelect.value = String(candidate.importance || 3);

    // Studio Interoperability check
    const isStudioTarget = candidate.sourcePath && (
      candidate.sourcePath.includes('skills') ||
      candidate.sourcePath.includes('agents') ||
      candidate.sourcePath.includes('rules') ||
      candidate.sourcePath.endsWith('SKILL.md')
    );

    if (openStudioBtn) {
      openStudioBtn.style.display = isStudioTarget ? 'inline-flex' : 'none';
    }

    const populateEditorContent = (content) => {
      if (textarea) textarea.value = content;
      updateHarvesterDocCounter(content);
    };

    if (autoEdit) {
      switchToEditMode();
    } else {
      switchToPreviewMode();
    }

    // Lazy load full content
    if (fullDocumentCache.has(candidate.sourcePath)) {
      const cached = fullDocumentCache.get(candidate.sourcePath);
      renderInspectorBody(cached);
      populateEditorContent(cached.content || cached.rawContent || candidate.content || '');
    } else {
      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="skeleton-loader" style="padding: 28px; text-align: center;">
            ${arabic ? 'جاري قراءة محتوى المستند الكامل...' : 'Streaming full document content...'}
          </div>
        `;
      }
      if (candidate.content) {
        populateEditorContent(candidate.content);
      }

      try {
        const res = await window.api.harvestReadItem(candidate.sourcePath);
        if (res && res.ok && res.data) {
          fullDocumentCache.set(candidate.sourcePath, res.data);
          // If the user hasn't switched to another candidate while fetching
          if (activeCandidate && activeCandidate.sourcePath === candidate.sourcePath) {
            renderInspectorBody(res.data);
            populateEditorContent(res.data.content || res.data.rawContent || '');
          }
        } else if (candidate.content) {
          // Fallback to initial scanned content if read API fails
          const fallbackData = {
            content: candidate.content,
            linesCount: candidate.content.split('\n').length,
            mtimeFormatted: candidate.mtime ? new Date(candidate.mtime).toLocaleString() : ''
          };
          renderInspectorBody(fallbackData);
          populateEditorContent(candidate.content);
        }
      } catch (err) {
        console.error('Error reading full harvest item:', err);
        if (candidate.content) {
          renderInspectorBody({
            content: candidate.content,
            linesCount: candidate.content.split('\n').length
          });
          populateEditorContent(candidate.content);
        } else if (bodyEl) {
          bodyEl.innerHTML = `<div style="color: var(--accent-red); padding: 20px;">${escapeHtml(err.message)}</div>`;
        }
      }
    }
  }

  function renderInspectorBody(docData) {
    const bodyEl = document.getElementById('inspectorDocBody');
    const linesEl = document.getElementById('inspectorDocLines');
    const mtimeEl = document.getElementById('inspectorDocMtime');

    if (linesEl && docData.linesCount) {
      linesEl.textContent = `${docData.linesCount} ${isAr() ? 'سطر' : 'lines'}`;
    }
    if (mtimeEl && docData.mtimeFormatted) {
      mtimeEl.textContent = docData.mtimeFormatted;
    }

    if (bodyEl) {
      bodyEl.innerHTML = renderMarkdownPreview(docData.content || docData.rawContent || '');
    }
  }

  /**
   * Update the batch import button label and disabled state
   */
  function updateBatchImportButtonUI() {
    const count = selectedCandidateIds.size;
    const btn = document.getElementById('btnHarvesterBatchImport');
    const btnText = document.getElementById('btnHarvesterBatchImportText');
    const summary = document.getElementById('harvesterSelectionSummary');
    const selectAllBtn = document.getElementById('btnHarvesterSelectAll');
    const arabic = isAr();

    if (btn) btn.disabled = count === 0;

    if (btnText) {
      btnText.textContent = arabic ? `استيراد المحدد (${count})` : `Import Selected (${count})`;
    }

    if (summary) {
      summary.textContent = arabic ? `تم تحديد ${count} عنصر` : `${count} selected`;
    }

    if (selectAllBtn) {
      const allSelected = count > 0 && count === candidatesList.length;
      selectAllBtn.textContent = allSelected
        ? (arabic ? 'إلغاء تحديد الكل' : 'Deselect All')
        : (arabic ? 'تحديد الكل' : 'Select All');
    }
  }

  /**
   * Toggle select all / deselect all
   */
  function handleToggleSelectAll() {
    const allSelected = selectedCandidateIds.size === candidatesList.length;
    selectedCandidateIds.clear();

    if (!allSelected) {
      candidatesList.forEach(c => selectedCandidateIds.add(c.id));
    }

    renderCandidatesList();
    updateBatchImportButtonUI();
  }

  /**
   * Import a single candidate directly from the inspector pane
   */
  async function handleImportSingleCandidate() {
    if (!activeCandidate) return;

    const arabic = isAr();
    const btn = document.getElementById('btnInspectorImportSingle');
    if (btn) btn.disabled = true;

    const catSelect = document.getElementById('inspectorCategorySelect');
    const tierSelect = document.getElementById('inspectorTierSelect');
    const impSelect = document.getElementById('inspectorImportanceSelect');

    const chosenCategory = catSelect ? catSelect.value : activeCandidate.category;
    const chosenTier = tierSelect ? tierSelect.value : activeCandidate.tier;
    const chosenImp = impSelect ? Number(impSelect.value) : 3;

    // Retrieve full content from cache if available
    const cached = fullDocumentCache.get(activeCandidate.sourcePath);
    const content = cached?.content || activeCandidate.content || '';

    const payload = [{
      title: activeCandidate.title,
      summary: activeCandidate.summary,
      content,
      sourcePath: activeCandidate.sourcePath,
      category: chosenCategory,
      tier: chosenTier,
      importance: chosenImp
    }];

    try {
      const res = await window.api.harvestImport(payload);
      if (!res || !res.ok) throw new Error(res?.error || 'Import failed');

      activeCandidate.alreadyImported = true;
      selectedCandidateIds.delete(activeCandidate.id);

      // Update inspector status badge
      const statusBadgeEl = document.getElementById('inspectorDocStatusBadge');
      if (statusBadgeEl) {
        statusBadgeEl.innerHTML = `<span class="badge amber">${arabic ? 'مسجل مسبقاً' : 'Already in Memory'}</span>`;
      }

      alert(arabic
        ? `✓ تم استيراد "${activeCandidate.title}" بنجاح إلى قاعدة البيانات السيادية.`
        : `✓ Successfully imported "${activeCandidate.title}" to SQLite SSOT.`);

      renderCandidatesList();
      updateBatchImportButtonUI();

      // Refresh memory explorer & stats
      if (window.loadMemories) window.loadMemories();
      if (window.loadStats) window.loadStats();
    } catch (err) {
      console.error('Error importing single candidate:', err);
      alert(arabic ? `تعذر الاستيراد: ${err.message}` : `Failed to import: ${err.message}`);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /**
   * Import all selected candidates in an atomic batch
   */
  async function handleBatchImport() {
    if (selectedCandidateIds.size === 0) return;

    const arabic = isAr();
    const btn = document.getElementById('btnHarvesterBatchImport');
    if (btn) btn.disabled = true;

    const itemsToImport = [];
    for (const candidate of candidatesList) {
      if (!selectedCandidateIds.has(candidate.id)) continue;

      const cached = fullDocumentCache.get(candidate.sourcePath);
      const content = cached?.content || candidate.content || '';

      itemsToImport.push({
        title: candidate.title,
        summary: candidate.summary,
        content,
        sourcePath: candidate.sourcePath,
        category: candidate.category || 'decision',
        tier: candidate.tier || 'project',
        importance: candidate.importance || 3
      });
    }

    try {
      const res = await window.api.harvestImport(itemsToImport);
      if (!res || !res.ok) throw new Error(res?.error || 'Batch import failed');

      const importedCount = res.data ? res.data.importedCount : itemsToImport.length;

      // Mark imported in state
      candidatesList.forEach(c => {
        if (selectedCandidateIds.has(c.id)) {
          c.alreadyImported = true;
        }
      });
      selectedCandidateIds.clear();

      alert(arabic
        ? `✓ تم استيراد ${importedCount} عنصر بنجاح إلى قاعدة البيانات السيادية.`
        : `✓ Successfully imported ${importedCount} items to SQLite SSOT.`);

      renderCandidatesList();
      updateBatchImportButtonUI();

      if (activeCandidate) {
        inspectCandidate(activeCandidate);
      }

      // Refresh memory explorer & stats
      if (window.loadMemories) window.loadMemories();
      if (window.loadStats) window.loadStats();
    } catch (err) {
      console.error('Error in batch import:', err);
      alert(arabic ? `تعذر الاستيراد الجماعي: ${err.message}` : `Batch import failed: ${err.message}`);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /**
   * Studio Interoperability: navigate to Universal Studio and open the candidate file
   */
  function handleOpenInStudio() {
    if (!activeCandidate || !activeCandidate.sourcePath) return;

    if (typeof window.openItemInStudio === 'function') {
      window.openItemInStudio(activeCandidate.sourcePath);
    } else {
      // Fallback switch to Studio Tab
      if (window.switchTab) {
        window.switchTab('subagents');
      }
      setTimeout(() => {
        if (window.openStudioItemByPath) {
          window.openStudioItemByPath(activeCandidate.sourcePath);
        }
      }, 150);
    }
  }

  /**
   * Copy source file path to clipboard
   */
  function handleCopyInspectorPath() {
    if (!activeCandidate || !activeCandidate.sourcePath) return;
    navigator.clipboard.writeText(activeCandidate.sourcePath).then(() => {
      const btn = document.getElementById('btnCopyInspectorPath');
      if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 1200);
      }
    });
  }

  /**
   * Copy full document markdown content to clipboard
   */
  function handleCopyInspectorContent() {
    if (!activeCandidate) return;
    const cached = fullDocumentCache.get(activeCandidate.sourcePath);
    const contentToCopy = cached?.rawContent || cached?.content || activeCandidate.content || '';

    if (!contentToCopy) return;

    navigator.clipboard.writeText(contentToCopy).then(() => {
      const btn = document.getElementById('btnInspectorCopyContent');
      const arabic = isAr();
      if (btn) {
        const origHtml = btn.innerHTML;
        btn.classList.add('active');
        btn.innerHTML = `<svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
          btn.innerHTML = origHtml;
          btn.classList.remove('active');
        }, 1200);
      }
      if (window.showToast) {
        window.showToast(arabic ? 'تم نسخ المحتوى إلى الحافظة' : 'Content copied to clipboard', 'info');
      }
    });
  }

  /**
   * Initialize event listeners and hooks
   */
  function initHarvester() {
    // Toolbar buttons
    document.getElementById('btnHarvesterRescan')?.addEventListener('click', () => loadHarvesterIndex(true));
    document.getElementById('btnHarvesterSelectAll')?.addEventListener('click', handleToggleSelectAll);
    document.getElementById('btnHarvesterBatchImport')?.addEventListener('click', handleBatchImport);

    // Inspector Action buttons
    document.getElementById('btnInspectorOpenStudio')?.addEventListener('click', handleOpenInStudio);
    document.getElementById('btnInspectorEditCandidate')?.addEventListener('click', () => {
      const editContainer = document.getElementById('harvesterEditContainer');
      if (editContainer && !editContainer.classList.contains('hidden')) {
        switchToPreviewMode();
      } else {
        switchToEditMode();
      }
    });
    document.getElementById('btnInspectorImportSingle')?.addEventListener('click', handleImportSingleCandidate);
    document.getElementById('btnInspectorCopyContent')?.addEventListener('click', handleCopyInspectorContent);
    document.getElementById('btnCopyInspectorPath')?.addEventListener('click', handleCopyInspectorPath);

    // Harvester In-Place Tabs & Draft Action buttons
    document.getElementById('btnHarvesterTabPreview')?.addEventListener('click', switchToPreviewMode);
    document.getElementById('btnHarvesterTabEdit')?.addEventListener('click', switchToEditMode);
    document.getElementById('btnHarvesterSaveDraft')?.addEventListener('click', saveCandidateDraft);
    document.getElementById('btnHarvesterCancelDraft')?.addEventListener('click', switchToPreviewMode);

    // Live character & word counter on textarea typing
    const editTextarea = document.getElementById('harvesterEditTextarea');
    editTextarea?.addEventListener('input', (e) => {
      updateHarvesterDocCounter(e.target.value);
    });

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to save draft immediately
    document.getElementById('harvesterEditContainer')?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveCandidateDraft();
      }
    });

    // Category / Tier / Importance inline tuning listeners
    document.getElementById('inspectorCategorySelect')?.addEventListener('change', (e) => {
      if (activeCandidate) activeCandidate.category = e.target.value;
    });
    document.getElementById('inspectorTierSelect')?.addEventListener('change', (e) => {
      if (activeCandidate) activeCandidate.tier = e.target.value;
    });
    document.getElementById('inspectorImportanceSelect')?.addEventListener('change', (e) => {
      if (activeCandidate) activeCandidate.importance = Number(e.target.value);
    });

    // Filter Chips
    const filterChips = document.querySelectorAll('#harvesterFilterChips .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const statusFilter = chip.getAttribute('data-harvester-filter');
        const sourceFilter = chip.getAttribute('data-harvester-source');

        if (statusFilter) {
          currentStatusFilter = statusFilter;
          currentSourceFilter = '';
        } else if (sourceFilter) {
          currentSourceFilter = sourceFilter;
          currentStatusFilter = 'all';
        }

        renderCandidatesList();
      });
    });

    // Search input
    let searchDebounce;
    document.getElementById('harvesterSearchInput')?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentSearchQuery = e.target.value.trim();
        renderCandidatesList();
      }, 200);
    });

    // Hook into tab switching: if user clicks "harvester" tab or [data-goto="harvester"]
    document.querySelectorAll('[data-tab="harvester"], [data-goto="harvester"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (candidatesList.length === 0) {
          loadHarvesterIndex();
        }
      });
    });
  }

  // Hook into lifecycle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHarvester);
  } else {
    initHarvester();
  }

  // Global exports
  window.loadHarvesterIndex = loadHarvesterIndex;
  window.inspectCandidate = inspectCandidate;
})();
