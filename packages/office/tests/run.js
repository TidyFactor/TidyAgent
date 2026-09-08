/**
 * @file packages/office/tests/run.js
 * Comprehensive Test Suite for @tidy/office domain pack
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Point TIDY_DB to a temporary isolated database
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tidy_office_test_'));
const testDbPath = path.join(tempDir, 'office_test.db');
process.env.TIDY_DB = testDbPath;

console.log('============================================================');
console.log('  RUNNING @tidy/office TEST SUITE');
console.log(`  Isolated Test DB: ${testDbPath}`);
console.log('============================================================');

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failedCount++;
  }
}

const {
  addClient,
  getClient,
  listClients,
  updateClient,
  deleteClient,
  addProduct,
  getProduct,
  listProducts,
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
  createProposal,
  getProposal,
  convertProposalToInvoice,
  addExpense,
  listExpenses,
  getCashflowSummary,
  addEvent,
  getUpcomingDeadlines,
  compileClientDossier
} = require('../src/index');

// 1. CRM Tests
console.log('\n[1] CRM & Client Pipeline Tests');
let testClientId;
test('CRM: can add new client with custom fields and budget', () => {
  const c = addClient({
    name: 'Ahmed Al-Mansoor',
    company: 'Al-Mansoor Media Ltd',
    email: 'ahmed@mansoor.com',
    phone: '+971 50 123 4567',
    industry: 'Media & Production',
    budget: 25000,
    currency: 'USD',
    notes: 'Key client for Q4 campaigns'
  });
  assert.ok(c.id);
  assert.strictEqual(c.name, 'Ahmed Al-Mansoor');
  assert.strictEqual(c.budget, 25000);
  testClientId = c.id;
});

test('CRM: can retrieve and update client status', () => {
  const updated = updateClient(testClientId, { status: 'active', budget: 30000 });
  assert.strictEqual(updated.status, 'active');
  assert.strictEqual(updated.budget, 30000);
  const fetched = getClient(testClientId);
  assert.strictEqual(fetched.budget, 30000);
});

test('CRM: can list clients with search query', () => {
  const list = listClients({ search: 'Mansoor' });
  assert.ok(list.length > 0);
  assert.strictEqual(list[0].id, testClientId);
});

// 2. Products Catalog Tests
console.log('\n[2] Products & Service Catalog Tests');
let testProdId;
test('Products: can add service product with billing cycle', () => {
  const prod = addProduct({
    name: 'AI Content Engine Retainer',
    category: 'service',
    unitPrice: 3500,
    currency: 'USD',
    billingCycle: 'monthly',
    description: 'Monthly automated content production and SEO distribution'
  });
  assert.ok(prod.id);
  assert.strictEqual(prod.unit_price, 3500);
  assert.strictEqual(prod.billing_cycle, 'monthly');
  testProdId = prod.id;
});

test('Products: can list active products', () => {
  const prods = listProducts({ activeOnly: true });
  assert.ok(prods.some(p => p.id === testProdId));
});

// 3. Commercial Proposals Tests
console.log('\n[3] Proposals & Conversion Tests');
let testProposalId;
test('Proposals: can create commercial B2B proposal', () => {
  const prop = createProposal({
    title: 'Enterprise AI Modernization Proposal',
    clientId: testClientId,
    items: [
      { name: 'Architecture Review', qty: 1, unitPrice: 5000 },
      { name: 'Core Engine Deployment', qty: 1, unitPrice: 10000 }
    ],
    currency: 'USD',
    scopeOfWork: 'Complete system refactor and AI integration'
  });
  assert.ok(prop.id);
  assert.strictEqual(prop.total_amount, 15000);
  assert.strictEqual(prop.status, 'draft');
  testProposalId = prop.id;
});

test('Proposals: can convert accepted proposal to invoice automatically', () => {
  const conv = convertProposalToInvoice(testProposalId);
  assert.strictEqual(conv.proposal.status, 'accepted');
  assert.ok(conv.invoice.id);
  assert.strictEqual(conv.invoice.total_amount, 15000);
  assert.strictEqual(conv.invoice.status, 'pending');
});

// 4. Invoicing & Billing Tests
console.log('\n[4] Invoicing & Taxes Tests');
let testInvoiceId;
test('Invoices: can create itemized invoice with VAT calculation and discounts', () => {
  const inv = createInvoice({
    clientId: testClientId,
    items: [
      { name: 'Software Development', qty: 10, unitPrice: 100 }, // 1000
      { name: 'Cloud Infrastructure', qty: 1, unitPrice: 500 }   // 500 => Subtotal: 1500
    ],
    discountAmount: 100, // 1400 taxable
    taxRate: 15,          // 15% VAT on 1400 = 210 => Total: 1610
    currency: 'USD'
  });
  assert.ok(inv.id);
  assert.strictEqual(inv.subtotal, 1500);
  assert.strictEqual(inv.tax_amount, 210);
  assert.strictEqual(inv.total_amount, 1610);
  testInvoiceId = inv.id;
});

test('Invoices: can update invoice payment status', () => {
  const paid = updateInvoiceStatus(testInvoiceId, 'paid');
  assert.strictEqual(paid.status, 'paid');
  assert.strictEqual(paid.amount_paid, 1610);
});

// 5. Expenses & Cashflow Tests
console.log('\n[5] Expenses & Cashflow Tests');
test('Expenses: can record operational expense', () => {
  const exp = addExpense({
    title: 'AWS Cloud Server Hosting',
    category: 'Hosting',
    vendor: 'Amazon Web Services',
    amount: 350,
    currency: 'USD'
  });
  assert.ok(exp.id);
  assert.strictEqual(exp.amount, 350);
});

test('Cashflow: computes accurate revenue, expenses, and net profit', () => {
  const cashflow = getCashflowSummary();
  assert.ok(cashflow.totalRevenue >= 1610);
  assert.ok(cashflow.totalExpenses >= 350);
  assert.strictEqual(cashflow.netProfit, cashflow.totalRevenue - cashflow.totalExpenses);
  assert.ok(cashflow.marginPct > 0);
});

// 6. Calendar & Deadlines Tests
console.log('\n[6] Calendar & Deadlines Tests');
test('Calendar: can schedule event and retrieve upcoming deadlines', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const evt = addEvent({
    title: 'Sprint Review & Architecture Milestone',
    eventType: 'milestone',
    startTime: tomorrow.toISOString()
  });
  assert.ok(evt.id);

  const upcoming = getUpcomingDeadlines(7);
  assert.ok(upcoming.events.some(e => e.id === evt.id));
});

// 7. Evidence Compiler Tests
console.log('\n[7] Evidence-Based AI Compiler Tests');
test('Evidence Compiler: synthesizes comprehensive client dossier', () => {
  const dossier = compileClientDossier('Ahmed Al-Mansoor');
  assert.ok(dossier.client);
  assert.strictEqual(dossier.client.id, testClientId);
  assert.ok(dossier.dossierMarkdown.includes('Ahmed Al-Mansoor'));
  assert.ok(dossier.dossierMarkdown.includes('Financial Overview'));
  assert.ok(dossier.dossierMarkdown.includes('Executive Dossier'));
});

// 8. 1-Click PocketOffice Migration Importer Tests
console.log('\n[8] 1-Click PocketOffice Migration Importer Tests');
const { importFromPocketOffice } = require('../src/index');
test('Importer: can import sample data from PocketOffice data folder', () => {
  const sampleDataDir = path.resolve(__dirname, '../../../../PocketOffice-community/resources/app/data');
  if (fs.existsSync(sampleDataDir)) {
    const res = importFromPocketOffice(sampleDataDir);
    assert.ok(res.clients > 0 || res.products > 0 || res.invoices > 0, 'Should import entities from PocketOffice');
  } else {
    // Fallback: test with empty temporary folder
    const dummyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dummy_po_'));
    fs.mkdirSync(path.join(dummyDir, 'clients'));
    fs.writeFileSync(path.join(dummyDir, 'clients', 'dummy.json'), JSON.stringify({ name: 'Imported Client' }));
    const res = importFromPocketOffice(dummyDir);
    assert.strictEqual(res.clients, 1);
  }
});

console.log('\n============================================================');
console.log(`  OFFICE SUITE TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('============================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL @tidy/office TESTS PASSED SUCCESSFULLY!\n');
}

