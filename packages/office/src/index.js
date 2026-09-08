/**
 * @file packages/office/src/index.js
 * Main entry point for @tidy/office domain pack
 */

const { getDb } = require('./core-bridge');
const { OFFICE_SCHEMA_SQL, initOfficeSchema } = require('./schema');
const crm = require('./crm');
const products = require('./products');
const invoices = require('./invoices');
const proposals = require('./proposals');
const expenses = require('./expenses');
const calendar = require('./calendar');
const evidenceCompiler = require('./evidence-compiler');
const importer = require('./importer');

// Auto-initialize schema when pack is loaded
try {
  const db = getDb();
  initOfficeSchema(db);
} catch {}

module.exports = {
  // Schema
  OFFICE_SCHEMA_SQL,
  initOfficeSchema,

  // CRM
  addClient: crm.addClient,
  updateClient: crm.updateClient,
  getClient: crm.getClient,
  listClients: crm.listClients,
  deleteClient: crm.deleteClient,

  // Products
  addProduct: products.addProduct,
  getProduct: products.getProduct,
  listProducts: products.listProducts,
  updateProduct: products.updateProduct,
  deleteProduct: products.deleteProduct,

  // Invoices
  createInvoice: invoices.createInvoice,
  getInvoice: invoices.getInvoice,
  listInvoices: invoices.listInvoices,
  updateInvoiceStatus: invoices.updateInvoiceStatus,
  deleteInvoice: invoices.deleteInvoice,
  getNextInvoiceNumber: invoices.getNextInvoiceNumber,
  calculateInvoiceTotals: invoices.calculateInvoiceTotals,

  // Proposals
  createProposal: proposals.createProposal,
  getProposal: proposals.getProposal,
  listProposals: proposals.listProposals,
  updateProposalStatus: proposals.updateProposalStatus,
  convertProposalToInvoice: proposals.convertProposalToInvoice,
  deleteProposal: proposals.deleteProposal,

  // Expenses & Cashflow
  addExpense: expenses.addExpense,
  getExpense: expenses.getExpense,
  listExpenses: expenses.listExpenses,
  deleteExpense: expenses.deleteExpense,
  getCashflowSummary: expenses.getCashflowSummary,

  // Calendar
  addEvent: calendar.addEvent,
  getEvent: calendar.getEvent,
  listEvents: calendar.listEvents,
  getUpcomingDeadlines: calendar.getUpcomingDeadlines,
  deleteEvent: calendar.deleteEvent,

  // Evidence Compiler
  compileClientDossier: evidenceCompiler.compileClientDossier,

  // Importer
  importFromPocketOffice: importer.importFromPocketOffice
};
