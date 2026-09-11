/**
 * Tidy Office Suite Controller (@tidy/office)
 * CRM Pipeline, Invoices & Billing Engine, Cashflow Telemetry, and AI Dossier.
 */

async function loadClients() {
  const status = document.getElementById('crmStatusFilter')?.value || null;
  const search = document.getElementById('crmSearchInput')?.value || null;
  const tbody = document.getElementById('crmClientsTableBody');
  if (!tbody) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  tbody.innerHTML = `<tr><td colspan="6" class="skeleton-loader">${lang === 'ar' ? 'جاري تحميل العملاء...' : 'Loading CRM accounts...'}</td></tr>`;

  const res = await window.api.office.listClients({ status, search });
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">${lang === 'ar' ? 'لا يوجد عملاء مسجلون حالياً.' : 'No CRM clients found.'}</td></tr>`;
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
      window.openModal('modalNewInvoice');
      const clientSelect = document.getElementById('inputInvoiceClient');
      if (clientSelect) clientSelect.value = clientId;
    });
  });

  tbody.querySelectorAll('.btn-delete-client').forEach(btn => {
    btn.addEventListener('click', () => {
      const clientId = btn.getAttribute('data-id');
      window.showDeleteConfirm(
        lang === 'ar' ? 'هل أنت متأكد من حذف هذا العميل وسجلاته؟' : 'Are you sure you want to delete this client record?',
        async () => {
          await window.api.office.deleteClient(clientId);
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

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  tbody.innerHTML = `<tr><td colspan="8" class="skeleton-loader">${lang === 'ar' ? 'جاري تحميل الفواتير...' : 'Loading invoices...'}</td></tr>`;

  const res = await window.api.office.listInvoices({ status });
  if (!res || !res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">${lang === 'ar' ? 'لا توجد فواتير مسجلة.' : 'No invoices found.'}</td></tr>`;
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
      await window.api.office.updateInvoiceStatus({ id: invId, status: 'paid' });
      loadInvoices();
      loadCashflow();
    });
  });
}

async function loadCashflow() {
  const res = await window.api.office.getCashflow();
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

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
        catContainer.innerHTML = `<div style="color: var(--text-muted); padding: 12px 0;">${lang === 'ar' ? 'لا توجد نفقات مسجلة بعد.' : 'No expenses categorized yet.'}</div>`;
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
  const expRes = await window.api.office.listExpenses({ limit: 15 });
  const listContainer = document.getElementById('cashflowExpensesList');
  if (listContainer) {
    if (!expRes || !expRes.ok || !expRes.data || expRes.data.length === 0) {
      listContainer.innerHTML = `<div style="color: var(--text-muted); padding: 12px 0;">${lang === 'ar' ? 'لا توجد نفقات مسجلة.' : 'No recorded expenses.'}</div>`;
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
  window.openModal('modalClientDossier');

  const res = await window.api.office.compileDossier(clientId);
  if (res && res.ok && res.data) {
    pre.textContent = res.data.dossierMarkdown || res.data.markdown || 'No dossier generated.';
  } else {
    pre.textContent = `Error compiling dossier: ${res?.error || 'Unknown error'}`;
  }
}

async function populateClientDropdown(targetSelectId = 'inputInvoiceClient') {
  const select = document.getElementById(targetSelectId);
  if (!select) return;
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  select.innerHTML = lang === 'ar' ? '<option value="">اختر عميلاً...</option>' : '<option value="">Select a client...</option>';
  const res = await window.api.office.listClients({ limit: 100 });
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
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  // Proposal Submit Handler
  document.getElementById('btnSaveProposalSubmit')?.addEventListener('click', async () => {
    const clientId = document.getElementById('inputProposalClient')?.value;
    const title = document.getElementById('inputProposalTitle')?.value.trim();
    const totalAmount = Number(document.getElementById('inputProposalAmount')?.value || 0);
    const validUntil = document.getElementById('inputProposalValidUntil')?.value || null;
    const notes = document.getElementById('inputProposalNotes')?.value.trim() || '';

    if (!clientId) return alert(lang === 'ar' ? 'يرجى اختيار عميل مستهدف.' : 'Please select a target client.');
    if (!title) return alert(lang === 'ar' ? 'يرجى إدخال عنوان العرض أو المشروع.' : 'Proposal title is required.');

    const res = await window.api.office.createProposal({
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
      window.closeModal('modalNewProposal');
      document.getElementById('inputProposalTitle').value = '';
      document.getElementById('inputProposalAmount').value = '';
      document.getElementById('inputProposalNotes').value = '';
      alert(lang === 'ar' ? 'تم إنشاء العرض التجاري بنجاح!' : 'Commercial proposal created successfully!');
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
    window.openModal('modalNewClient');
  });

  document.getElementById('btnOpenNewInvoice')?.addEventListener('click', async () => {
    await populateClientDropdown();
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const dueInput = document.getElementById('inputInvoiceDueDate');
    if (dueInput) dueInput.value = d.toISOString().split('T')[0];
    window.openModal('modalNewInvoice');
  });

  document.getElementById('btnOpenNewExpense')?.addEventListener('click', () => {
    const dateInput = document.getElementById('inputExpenseDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    window.openModal('modalNewExpense');
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

    const res = await window.api.office.addClient({ name, company, industry, email, phone, status, budget, notes });
    if (res && res.ok) {
      window.closeModal('modalNewClient');
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

    const res = await window.api.office.createInvoice({ clientId, items, taxRate, discountAmount, dueDate, notes });
    if (res && res.ok) {
      window.closeModal('modalNewInvoice');
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

    const res = await window.api.office.addExpense({ title, amount, category, vendor, expenseDate, notes });
    if (res && res.ok) {
      window.closeModal('modalNewExpense');
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

// Global exports
window.loadClients = loadClients;
window.loadInvoices = loadInvoices;
window.loadCashflow = loadCashflow;
window.showClientDossierModal = showClientDossierModal;
window.populateClientDropdown = populateClientDropdown;
window.initOfficeHandlers = initOfficeHandlers;
