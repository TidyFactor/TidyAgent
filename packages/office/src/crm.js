/**
 * @file packages/office/src/crm.js
 * CRM & Client Pipeline Service for @tidy/office
 */

const crypto = require('crypto');
const { getDb } = require('./core-bridge');
const { initOfficeSchema } = require('./schema');

function generateId(prefix = 'cli') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function ensureSchema() {
  const db = getDb();
  initOfficeSchema(db);
  return db;
}

function addClient({
  name,
  company = null,
  email = null,
  phone = null,
  industry = null,
  status = 'active',
  budget = 0,
  currency = 'USD',
  notes = null,
  customFields = {}
}) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Client name is required.');
  }

  const db = ensureSchema();
  const id = generateId('cli');
  const cleanName = name.trim();
  const validStatuses = ['lead', 'prospect', 'active', 'inactive', 'archived'];
  const cleanStatus = validStatuses.includes(status) ? status : 'active';

  const stmt = db.prepare(`
    INSERT INTO app_crm_clients (
      id, name, company, email, phone, industry, status, budget, currency, notes, custom_fields_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    cleanName,
    company ? company.trim() : null,
    email ? email.trim() : null,
    phone ? phone.trim() : null,
    industry ? industry.trim() : null,
    cleanStatus,
    Number(budget) || 0,
    currency || 'USD',
    notes ? notes.trim() : null,
    JSON.stringify(customFields || {})
  );

  return getClient(id);
}

function updateClient(id, updates = {}) {
  if (!id) throw new Error('Client ID is required for update.');
  const db = ensureSchema();
  const existing = getClient(id);
  if (!existing) return null;

  const validStatuses = ['lead', 'prospect', 'active', 'inactive', 'archived'];
  const newName = updates.name !== undefined ? updates.name.trim() : existing.name;
  const newCompany = updates.company !== undefined ? updates.company : existing.company;
  const newEmail = updates.email !== undefined ? updates.email : existing.email;
  const newPhone = updates.phone !== undefined ? updates.phone : existing.phone;
  const newIndustry = updates.industry !== undefined ? updates.industry : existing.industry;
  const newStatus = updates.status && validStatuses.includes(updates.status) ? updates.status : existing.status;
  const newBudget = updates.budget !== undefined ? Number(updates.budget) : existing.budget;
  const newCurrency = updates.currency || existing.currency;
  const newNotes = updates.notes !== undefined ? updates.notes : existing.notes;
  const newCustomFields = updates.customFields !== undefined ? JSON.stringify(updates.customFields) : JSON.stringify(existing.custom_fields || {});

  db.prepare(`
    UPDATE app_crm_clients
    SET name = ?, company = ?, email = ?, phone = ?, industry = ?, status = ?,
        budget = ?, currency = ?, notes = ?, custom_fields_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    newName,
    newCompany,
    newEmail,
    newPhone,
    newIndustry,
    newStatus,
    newBudget,
    newCurrency,
    newNotes,
    newCustomFields,
    id
  );

  return getClient(id);
}

function getClient(id) {
  if (!id) return null;
  const db = ensureSchema();
  const row = db.prepare('SELECT * FROM app_crm_clients WHERE id = ?').get(id);
  if (!row) return null;

  try {
    row.custom_fields = JSON.parse(row.custom_fields_json || '{}');
  } catch {
    row.custom_fields = {};
  }
  return row;
}

function listClients({ status = null, search = null, limit = 50 } = {}) {
  const db = ensureSchema();
  let sql = 'SELECT * FROM app_crm_clients WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    sql += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => {
    try {
      r.custom_fields = JSON.parse(r.custom_fields_json || '{}');
    } catch {
      r.custom_fields = {};
    }
    return r;
  });
}

function deleteClient(id) {
  if (!id) return false;
  const db = ensureSchema();
  const res = db.prepare('DELETE FROM app_crm_clients WHERE id = ?').run(id);
  return res.changes > 0;
}

module.exports = {
  addClient,
  updateClient,
  getClient,
  listClients,
  deleteClient
};
