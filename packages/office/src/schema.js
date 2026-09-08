/**
 * @file packages/office/src/schema.js
 * Office Suite SQLite Schema Extension for @tidy/office
 * Pluggable DDL for CRM, Invoicing, Proposals, Cashflow, and Calendar.
 */

const OFFICE_SCHEMA_SQL = `
-- 1. Clients & CRM Pipeline
CREATE TABLE IF NOT EXISTS app_crm_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  industry TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'archived')),
  budget REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  custom_fields_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products & Service Packages Catalog
CREATE TABLE IF NOT EXISTS app_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT DEFAULT 'service',
  unit_price REAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'one_time' CHECK (billing_cycle IN ('one_time', 'monthly', 'quarterly', 'yearly')),
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Commercial Proposals & Contracts
CREATE TABLE IF NOT EXISTS app_proposals (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES app_crm_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  valid_until DATE,
  proposal_data_json TEXT NOT NULL, -- Line items, packages, scope, terms
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Invoices & Billing Records
CREATE TABLE IF NOT EXISTS app_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT REFERENCES app_crm_clients(id) ON DELETE SET NULL,
  proposal_id TEXT REFERENCES app_proposals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  amount_paid REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_note TEXT,
  invoice_data_json TEXT NOT NULL, -- Items, payment methods, notes, terms
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Operational Expenses & Cashflow
CREATE TABLE IF NOT EXISTS app_expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- Tools, Contractors, Marketing, Hosting, Office, General
  vendor TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  expense_date DATE NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  recurrence_interval TEXT, -- monthly, yearly
  receipt_path TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Unified Calendar & Deadlines
CREATE TABLE IF NOT EXISTS app_calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'deadline' CHECK (event_type IN ('meeting', 'deadline', 'invoice_due', 'milestone', 'followup')),
  related_entity_type TEXT, -- client, invoice, proposal, task
  related_entity_id TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  is_completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

function initOfficeSchema(dbInstance) {
  if (!dbInstance) {
    throw new Error('initOfficeSchema requires an active database adapter instance.');
  }
  dbInstance.exec(OFFICE_SCHEMA_SQL);
  return true;
}

module.exports = {
  OFFICE_SCHEMA_SQL,
  initOfficeSchema
};
