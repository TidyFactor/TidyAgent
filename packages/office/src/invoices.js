/**
 * @file packages/office/src/invoices.js
 * Invoicing & Billing Engine for @tidy/office
 * Supports itemized calculation, taxes, discounts, status tracking, and receipt generation.
 */

const crypto = require('crypto');
const { getDb } = require('./core-bridge');
const { initOfficeSchema } = require('./schema');

function generateId(prefix = 'inv') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function ensureSchema() {
  const db = getDb();
  initOfficeSchema(db);
  return db;
}

function getNextInvoiceNumber(prefix = 'INV') {
  const db = ensureSchema();
  const countRow = db.prepare('SELECT COUNT(*) as c FROM app_invoices').get();
  const nextNum = (countRow.c + 1).toString().padStart(4, '0');
  return `${prefix}-${nextNum}`;
}

function calculateInvoiceTotals(items = [], taxRate = 0, discountAmount = 0) {
  let subtotal = 0;
  const normalizedItems = items.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const unitPrice = Number(item.unitPrice || item.unit_price) || 0;
    const discountPct = Number(item.discountPct || item.discount_pct) || 0;
    const lineTotal = qty * unitPrice * (1 - discountPct / 100);
    subtotal += lineTotal;
    return {
      id: item.id || `item_${idx + 1}`,
      name: item.name || 'Service',
      description: item.description || '',
      qty,
      unitPrice,
      discountPct,
      lineTotal: Math.round(lineTotal * 100) / 100
    };
  });

  const cleanSubtotal = Math.round(subtotal * 100) / 100;
  const taxableAmount = Math.max(0, cleanSubtotal - (Number(discountAmount) || 0));
  const rate = Number(taxRate) || 0;
  const taxAmount = Math.round(taxableAmount * (rate / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    items: normalizedItems,
    subtotal: cleanSubtotal,
    taxRate: rate,
    taxAmount,
    discountAmount: Number(discountAmount) || 0,
    totalAmount
  };
}

function createInvoice({
  invoiceNumber = null,
  clientId = null,
  proposalId = null,
  issueDate = null,
  dueDate = null,
  items = [],
  taxRate = 0,
  discountAmount = 0,
  currency = 'USD',
  paymentNote = 'Payment due within 14 days',
  terms = 'Services rendered under standard contract terms.',
  notes = 'Thank you for your business!',
  status = 'pending'
}) {
  const db = ensureSchema();
  const id = generateId('inv');
  const invNumber = invoiceNumber ? invoiceNumber.trim() : getNextInvoiceNumber();
  const today = new Date().toISOString().split('T')[0];
  const cleanIssueDate = issueDate || today;

  // Default due date: 14 days from issueDate
  let cleanDueDate = dueDate;
  if (!cleanDueDate) {
    const d = new Date(cleanIssueDate);
    d.setDate(d.getDate() + 14);
    cleanDueDate = d.toISOString().split('T')[0];
  }

  const totals = calculateInvoiceTotals(items, taxRate, discountAmount);
  const validStatuses = ['draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled'];
  const cleanStatus = validStatuses.includes(status) ? status : 'pending';

  const invoiceData = {
    items: totals.items,
    paymentNote,
    terms,
    notes
  };

  const stmt = db.prepare(`
    INSERT INTO app_invoices (
      id, invoice_number, client_id, proposal_id, status, issue_date, due_date,
      subtotal, tax_rate, tax_amount, discount_amount, total_amount, amount_paid,
      currency, payment_note, invoice_data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `);

  stmt.run(
    id,
    invNumber,
    clientId,
    proposalId,
    cleanStatus,
    cleanIssueDate,
    cleanDueDate,
    totals.subtotal,
    totals.taxRate,
    totals.taxAmount,
    totals.discountAmount,
    totals.totalAmount,
    currency || 'USD',
    paymentNote,
    JSON.stringify(invoiceData)
  );

  return getInvoice(id);
}

function getInvoice(idOrNumber) {
  if (!idOrNumber) return null;
  const db = ensureSchema();
  const row = db.prepare(`
    SELECT i.*, c.name as client_name, c.company as client_company, c.email as client_email
    FROM app_invoices i
    LEFT JOIN app_crm_clients c ON i.client_id = c.id
    WHERE i.id = ? OR i.invoice_number = ?
  `).get(idOrNumber, idOrNumber);

  if (!row) return null;

  try {
    row.data = JSON.parse(row.invoice_data_json || '{}');
  } catch {
    row.data = {};
  }
  return row;
}

function listInvoices({ status = null, clientId = null, limit = 50 } = {}) {
  const db = ensureSchema();
  let sql = `
    SELECT i.*, c.name as client_name, c.company as client_company
    FROM app_invoices i
    LEFT JOIN app_crm_clients c ON i.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (clientId) {
    sql += ' AND i.client_id = ?';
    params.push(clientId);
  }

  sql += ' ORDER BY i.issue_date DESC, i.created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => {
    try {
      r.data = JSON.parse(r.invoice_data_json || '{}');
    } catch {
      r.data = {};
    }
    return r;
  });
}

function updateInvoiceStatus(id, status, amountPaid = null) {
  if (!id) throw new Error('Invoice ID required.');
  const db = ensureSchema();
  const inv = getInvoice(id);
  if (!inv) return null;

  const validStatuses = ['draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled'];
  const cleanStatus = validStatuses.includes(status) ? status : inv.status;
  let paid = inv.amount_paid;

  if (amountPaid !== null) {
    paid = Number(amountPaid) || 0;
  } else if (cleanStatus === 'paid') {
    paid = inv.total_amount;
  }

  db.prepare(`
    UPDATE app_invoices
    SET status = ?, amount_paid = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cleanStatus, paid, inv.id);

  return getInvoice(inv.id);
}

function deleteInvoice(idOrNumber) {
  if (!idOrNumber) return false;
  const db = ensureSchema();
  const inv = getInvoice(idOrNumber);
  if (!inv) return false;
  const res = db.prepare('DELETE FROM app_invoices WHERE id = ?').run(inv.id);
  return res.changes > 0;
}

module.exports = {
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
  deleteInvoice,
  getNextInvoiceNumber,
  calculateInvoiceTotals
};
