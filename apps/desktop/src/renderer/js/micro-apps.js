/**
 * Tidy Micro-Apps & System Hygiene Controller
 * Code Snippets, Daily Journal, Vault & Secret Keys, and SQLite WAL Diagnostics.
 */

// ----------------- Snippets App -----------------
async function loadSnippets() {
  const container = document.getElementById('snippetsListContainer');
  if (!container) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  const res = await window.api.listSnippets();
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    container.innerHTML = `<div class="skeleton-loader">${lang === 'ar' ? 'لا توجد قصاصات برمجية مسجلة بعد. أضف قصاصة جديدة!' : 'No code snippets saved yet. Add your first snippet!'}</div>`;
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
      window.showDeleteConfirm(
        lang === 'ar' ? 'هل أنت متأكد من حذف هذه القصاصة البرمجية؟' : 'Are you sure you want to delete this snippet?',
        async () => {
          await window.api.deleteSnippet(id);
          loadSnippets();
          if (window.loadStats) window.loadStats();
        }
      );
    });
  });
}

// ----------------- Journal App -----------------
async function loadJournal() {
  const container = document.getElementById('journalListContainer');
  if (!container) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  const res = await window.api.listJournal({ limit: 20 });
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    container.innerHTML = `<div class="skeleton-loader">${lang === 'ar' ? 'لا توجد ملاحظات مسجلة في اليوميات حتى الآن.' : 'No journal entries logged yet. Record your daily reflection!'}</div>`;
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

// ----------------- Vault App -----------------
async function loadVault() {
  const tbody = document.getElementById('vaultTableBody');
  if (!tbody) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  const res = await window.api.listVaultKeys();
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">${lang === 'ar' ? 'الخزنة فارغة حالياً.' : 'No secret keys stored in vault.'}</td></tr>`;
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
        const res = await window.api.getSecret(key);
        btn.innerHTML = svgLock;
        valEl.textContent = res?.data?.value || res?.value || '(empty)';
        valEl.dataset.revealed = 'true';
      }
    });
  });

  tbody.querySelectorAll('.btn-copy-secret').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-key');
      btn.textContent = '...';
      const res = await window.api.getSecret(key);
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

  tbody.querySelectorAll('.btn-delete-secret').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      window.showDeleteConfirm(
        lang === 'ar' ? `هل أنت متأكد من حذف المفتاح السري "${key}"؟` : `Are you sure you want to delete secret key "${key}"?`,
        async () => {
          await window.api.deleteSecret(key);
          loadVault();
          if (window.loadStats) window.loadStats();
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
      const res = await window.api.backupDatabase();
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
      const res = await window.api.checkpointWal();
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
      const res = await window.api.checkIntegrity();
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
  // Snippets Submit
  document.getElementById('btnCreateSnippet')?.addEventListener('click', () => {
    document.getElementById('inputSnippetTitle').value = '';
    document.getElementById('inputSnippetCode').value = '';
    document.getElementById('inputSnippetTags').value = '';
    window.openModal('modalNewSnippet');
  });

  document.getElementById('btnSaveSnippetSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputSnippetTitle').value.trim();
    const language = document.getElementById('inputSnippetLanguage').value;
    const code = document.getElementById('inputSnippetCode').value.trim();
    const tagsRaw = document.getElementById('inputSnippetTags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!title || !code) return alert('Snippet title and code are required.');

    await window.api.addSnippet({ title, language, code, tags });
    window.closeModal('modalNewSnippet');
    loadSnippets();
    if (window.loadStats) window.loadStats();
  });

  // Journal Submit
  document.getElementById('btnCreateJournal')?.addEventListener('click', () => {
    document.getElementById('inputJournalTitle').value = '';
    document.getElementById('inputJournalEntry').value = '';
    window.openModal('modalNewJournal');
  });

  document.getElementById('btnSaveJournalSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputJournalTitle').value.trim();
    const mood = document.getElementById('inputJournalMood').value;
    const entry = document.getElementById('inputJournalEntry').value.trim();

    if (!title || !entry) return alert('Journal title and entry content are required.');

    await window.api.addJournalEntry({ title, mood, entry });
    window.closeModal('modalNewJournal');
    loadJournal();
    if (window.loadStats) window.loadStats();
  });

  // Vault Submit
  document.getElementById('btnCreateVaultSecret')?.addEventListener('click', () => {
    document.getElementById('inputVaultKey').value = '';
    document.getElementById('inputVaultValue').value = '';
    window.openModal('modalNewVaultSecret');
  });

  document.getElementById('btnSaveVaultSubmit')?.addEventListener('click', async () => {
    const key = document.getElementById('inputVaultKey').value.trim().toUpperCase();
    const value = document.getElementById('inputVaultValue').value.trim();

    if (!key || !value) return alert('Secret key and value are required.');

    await window.api.setSecret({ key, value });
    window.closeModal('modalNewVaultSecret');
    loadVault();
    if (window.loadStats) window.loadStats();
  });
}

// Global exports
window.loadSnippets = loadSnippets;
window.loadJournal = loadJournal;
window.loadVault = loadVault;
window.initDbMaintenanceHandlers = initDbMaintenanceHandlers;
window.initMicroAppHandlers = initMicroAppHandlers;
