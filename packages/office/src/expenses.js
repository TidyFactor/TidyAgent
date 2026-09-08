/**
 * @file packages/office/src/expenses.js
 * Operational Overhead & Cashflow Engine for @tidy/office
 */

const crypto = require('crypto');
const { getDb } = require('./core-bridge');
const { initOfficeSchema } = require('./schema');

function generateId(prefix = 'exp') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function ensureSchema() {
  const db = getDb();
  initOfficeSchema(db);
  return db;
}

function addExpense({
  title,
  description,
  category = 'General',
  vendor = null,
  amount,
  currency = 'USD',
  expenseDate = null,
  isRecurring = false,
  recurrenceInterval = null,
  receiptPath = null,
  notes = null
}) {
  const cleanTitle = (title || description || '').trim();
  if (!cleanTitle) {
    throw new Error('Expense title is required.');
  }
  const cleanAmount = Number(amount);
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    throw new Error('Valid expense amount is required.');
  }

  const db = ensureSchema();
  const id = generateId('exp');
  const cleanDate = expenseDate || new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO app_expenses (
      id, title, category, vendor, amount, currency, expense_date,
      is_recurring, recurrence_interval, receipt_path, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    cleanTitle,
    category ? category.trim() : 'General',
    vendor ? vendor.trim() : null,
    cleanAmount,
    currency || 'USD',
    cleanDate,
    isRecurring ? 1 : 0,
    recurrenceInterval,
    receiptPath,
    notes ? notes.trim() : null
  );

  return getExpense(id);
}

function getExpense(id) {
  if (!id) return null;
  const db = ensureSchema();
  return db.prepare('SELECT * FROM app_expenses WHERE id = ?').get(id) || null;
}

function listExpenses({ category = null, startDate = null, endDate = null, limit = 100 } = {}) {
  const db = ensureSchema();
  let sql = 'SELECT * FROM app_expenses WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (startDate) {
    sql += ' AND expense_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND expense_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY expense_date DESC, created_at DESC LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params);
}

function deleteExpense(id) {
  if (!id) return false;
  const db = ensureSchema();
  const res = db.prepare('DELETE FROM app_expenses WHERE id = ?').run(id);
  return res.changes > 0;
}

function getCashflowSummary() {
  const db = ensureSchema();

  // 1. Total Revenue Collected (from Paid / Partially Paid Invoices)
  const revenueRow = db.prepare(`
    SELECT
      COALESCE(SUM(amount_paid), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN (total_amount - amount_paid) ELSE 0 END), 0) as pending_receivables
    FROM app_invoices
    WHERE status != 'cancelled'
  `).get() || { total_revenue: 0, pending_receivables: 0 };

  // 2. Total Operational Expenses
  const expenseRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_expenses
    FROM app_expenses
  `).get() || { total_expenses: 0 };

  // 3. Category Breakdown
  const categoryBreakdown = db.prepare(`
    SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM app_expenses
    GROUP BY category
    ORDER BY total DESC
  `).all();

  const totalRevenue = Math.round(revenueRow.total_revenue * 100) / 100;
  const totalExpenses = Math.round(expenseRow.total_expenses * 100) / 100;
  const pendingReceivables = Math.round(revenueRow.pending_receivables * 100) / 100;
  const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;
  const marginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    marginPct,
    pendingReceivables,
    categoryBreakdown
  };
}

module.exports = {
  addExpense,
  getExpense,
  listExpenses,
  deleteExpense,
  getCashflowSummary
};
