/**
 * Tidy Modal Dialogs & Global Action Controller
 * Strict accessibility, keyboard traps, and Qahera UI Kit compliance.
 */

let deleteCallback = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    el.classList.add('active');
    // Focus first input or button inside modal
    const input = el.querySelector('input:not([type="hidden"]), textarea, select');
    if (input) setTimeout(() => input.focus(), 80);
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    el.classList.remove('active');
  }
}

function showDeleteConfirm(message, onConfirm) {
  const textEl = document.getElementById('confirmDeleteText');
  if (textEl) textEl.textContent = message;
  deleteCallback = onConfirm;
  openModal('modalConfirmDelete');
}

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
      // Also close open dropdowns
      document.querySelectorAll('.qhr-dropdown.open').forEach(d => {
        d.classList.remove('open');
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

  // Delete Confirmation Modal Handler
  document.getElementById('btnConfirmDeleteSubmit')?.addEventListener('click', async () => {
    if (deleteCallback) {
      await deleteCallback();
      deleteCallback = null;
    }
    closeModal('modalConfirmDelete');
  });
}

function initQuickNewDropdown() {
  const dropdown = document.getElementById('quickNewDropdown');
  const trigger = document.getElementById('btnQuickNew');
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
      if (window.openCreateMemoryModal) {
        window.openCreateMemoryModal();
      } else {
        openModal('modalNewMemory');
      }
      break;
    case 'new-invoice':
      if (window.populateClientDropdown) await window.populateClientDropdown('inputInvoiceClient');
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
      if (window.populateClientDropdown) await window.populateClientDropdown('inputProposalClient');
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

/**
 * Modern floating toast notification system compliant with Qahera UI Kit
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('qhrToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'qhrToastContainer';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 440px;
    `;
    if (document.documentElement.getAttribute('lang') === 'ar') {
      container.style.right = 'auto';
      container.style.left = '24px';
    }
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `qhr-toast qhr-toast--${type}`;

  const colors = {
    success: { border: '#10b981', icon: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>' },
    error: { border: '#ef4444', icon: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#ef4444" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' },
    warning: { border: '#f59e0b', icon: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#f59e0b" stroke-width="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    info: { border: '#3b82f6', icon: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#3b82f6" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }
  };
  const c = colors[type] || colors.info;

  toast.style.cssText = `
    pointer-events: auto;
    background: var(--bg-card, #ffffff);
    color: var(--text-primary, #0f172a);
    border: 1px solid var(--border-subtle, #e2e8f0);
    border-left: 4px solid ${c.border};
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    line-height: 1.4;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(12px);
    opacity: 0;
    cursor: pointer;
  `;
  if (document.documentElement.getAttribute('lang') === 'ar') {
    toast.style.borderLeft = '1px solid var(--border-subtle, #e2e8f0)';
    toast.style.borderRight = `4px solid ${c.border}`;
  }

  toast.innerHTML = `
    <span style="display:flex; align-items:center; flex-shrink:0;">${c.icon}</span>
    <span style="flex:1; word-break:break-word; font-weight:500;">${escapeHtml(message)}</span>
    <span style="opacity:0.4; font-size:16px; margin-left:4px; line-height:1;">×</span>
  `;

  toast.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 250);
    }
  }, duration);
}

// Global exports
window.escapeHtml = escapeHtml;
window.openModal = openModal;
window.closeModal = closeModal;
window.showDeleteConfirm = showDeleteConfirm;
window.showToast = showToast;
window.initModals = initModals;
window.initQuickNewDropdown = initQuickNewDropdown;
window.handleQuickNewAction = handleQuickNewAction;
