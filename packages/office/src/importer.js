/**
 * @file packages/office/src/importer.js
 * 1-Click PocketOffice JSON to SQLite Migration Utility for @tidy/office
 */

const fs = require('fs');
const path = require('path');
const { addClient } = require('./crm');
const { addProduct } = require('./products');
const { createInvoice } = require('./invoices');
const { createProposal } = require('./proposals');
const { addExpense } = require('./expenses');

function importFromPocketOffice(dataDirectory) {
  if (!dataDirectory || !fs.existsSync(dataDirectory)) {
    throw new Error(`Data directory "${dataDirectory}" does not exist.`);
  }

  const results = {
    clients: 0,
    products: 0,
    invoices: 0,
    proposals: 0,
    expenses: 0,
    errors: []
  };

  // Helper to read JSON files from a directory
  function readJsonFiles(dirPath) {
    if (!fs.existsSync(dirPath)) return [];
    try {
      return fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.json') && !f.startsWith('.'))
        .map(f => {
          try {
            return JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  // 1. Import Clients
  const clientsDir = path.join(dataDirectory, 'clients');
  const clientFiles = readJsonFiles(clientsDir);
  for (const c of clientFiles) {
    try {
      addClient({
        name: c.name || c.client_name,
        company: c.company || c.company_name,
        email: c.email || c.client_email,
        phone: c.phone || c.client_phone,
        industry: c.industry,
        budget: c.budget || 0,
        currency: c.currency || 'USD',
        notes: c.notes || `Imported from PocketOffice (${c.id || 'legacy'})`
      });
      results.clients++;
    } catch (err) {
      results.errors.push(`Client error: ${err.message}`);
    }
  }

  // 2. Import Products
  const productsDir = path.join(dataDirectory, 'products');
  const productFiles = readJsonFiles(productsDir);
  for (const p of productFiles) {
    try {
      addProduct({
        name: p.name || p.title,
        sku: p.sku || p.id,
        category: p.category || 'service',
        unitPrice: p.unit_price || p.price || 0,
        currency: p.currency || 'USD',
        billingCycle: p.billing_cycle || 'one_time',
        description: p.description
      });
      results.products++;
    } catch (err) {
      results.errors.push(`Product error: ${err.message}`);
    }
  }

  // 3. Import Invoices
  const invoicesDir = path.join(dataDirectory, 'invoices');
  const invoiceFiles = readJsonFiles(invoicesDir);
  for (const inv of invoiceFiles) {
    try {
      createInvoice({
        invoiceNumber: inv.invoice_number || inv.id,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        items: inv.line_items || inv.items || [],
        taxRate: inv.tax_rate || 0,
        discountAmount: inv.discount_amount || 0,
        currency: inv.currency || 'USD',
        paymentNote: inv.payment_note,
        terms: inv.terms,
        notes: inv.notes,
        status: inv.status || 'pending'
      });
      results.invoices++;
    } catch (err) {
      results.errors.push(`Invoice error: ${err.message}`);
    }
  }

  // 4. Import Proposals
  const proposalsDir = path.join(dataDirectory, 'proposals');
  const proposalFiles = readJsonFiles(proposalsDir);
  for (const pr of proposalFiles) {
    try {
      createProposal({
        title: pr.title || pr.name || 'Imported Proposal',
        items: pr.line_items || pr.items || [],
        scopeOfWork: pr.scope || pr.description,
        terms: pr.terms,
        validUntil: pr.valid_until,
        currency: pr.currency || 'USD',
        status: pr.status || 'draft'
      });
      results.proposals++;
    } catch (err) {
      results.errors.push(`Proposal error: ${err.message}`);
    }
  }

  // 5. Import Expenses
  const expensesDir = path.join(dataDirectory, 'expenses', 'expenses');
  const altExpensesDir = path.join(dataDirectory, 'expenses');
  const expenseFiles = [...readJsonFiles(expensesDir), ...readJsonFiles(altExpensesDir)];
  for (const exp of expenseFiles) {
    if (exp.amount && exp.title) {
      try {
        addExpense({
          title: exp.title,
          category: exp.category || 'General',
          vendor: exp.vendor,
          amount: exp.amount,
          currency: exp.currency || 'USD',
          expenseDate: exp.date || exp.expense_date,
          notes: exp.notes
        });
        results.expenses++;
      } catch (err) {
        results.errors.push(`Expense error: ${err.message}`);
      }
    }
  }

  return results;
}

module.exports = {
  importFromPocketOffice
};
