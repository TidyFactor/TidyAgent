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

// Global exports
window.escapeHtml = escapeHtml;
window.openModal = openModal;
window.closeModal = closeModal;
window.showDeleteConfirm = showDeleteConfirm;
window.initModals = initModals;
window.initQuickNewDropdown = initQuickNewDropdown;
window.handleQuickNewAction = handleQuickNewAction;
