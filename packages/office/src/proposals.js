/**
 * @file packages/office/src/proposals.js
 * Commercial B2B Proposals Engine for @tidy/office
 * Supports quote creation, package building, and 1-click conversion to active invoices.
 */

const crypto = require('crypto');
const { getDb } = require('./core-bridge');
const { initOfficeSchema } = require('./schema');
const { createInvoice } = require('./invoices');

function generateId(prefix = 'prop') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function ensureSchema() {
  const db = getDb();
  initOfficeSchema(db);
  return db;
}

function createProposal({
  title,
  clientId = null,
  items = [],
  scopeOfWork = '',
  terms = 'Standard agency terms apply. 50% deposit required upon signing.',
  validUntil = null,
  currency = 'USD',
  status = 'draft'
}) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Proposal title is required.');
  }

  const db = ensureSchema();
  const id = generateId('prop');

  let totalAmount = 0;
  const normalizedItems = items.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const unitPrice = Number(item.unitPrice || item.unit_price) || 0;
    const lineTotal = qty * unitPrice;
    totalAmount += lineTotal;
    return {
      id: item.id || `item_${idx + 1}`,
      name: item.name || 'Deliverable',
      description: item.description || '',
      qty,
      unitPrice,
      lineTotal
    };
  });

  let cleanValidUntil = validUntil;
  if (!cleanValidUntil) {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    cleanValidUntil = d.toISOString().split('T')[0];
  }

  const proposalData = {
    items: normalizedItems,
    scopeOfWork,
    terms
  };

  const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  const cleanStatus = validStatuses.includes(status) ? status : 'draft';

  const stmt = db.prepare(`
    INSERT INTO app_proposals (
      id, client_id, title, status, total_amount, currency, valid_until, proposal_data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    clientId,
    title.trim(),
    cleanStatus,
    Math.round(totalAmount * 100) / 100,
    currency || 'USD',
    cleanValidUntil,
    JSON.stringify(proposalData)
  );

  return getProposal(id);
}

function getProposal(id) {
  if (!id) return null;
  const db = ensureSchema();
  const row = db.prepare(`
    SELECT p.*, c.name as client_name, c.company as client_company, c.email as client_email
    FROM app_proposals p
    LEFT JOIN app_crm_clients c ON p.client_id = c.id
    WHERE p.id = ?
  `).get(id);

  if (!row) return null;

  try {
    row.data = JSON.parse(row.proposal_data_json || '{}');
  } catch {
    row.data = {};
  }
  return row;
}

function listProposals({ status = null, clientId = null, limit = 50 } = {}) {
  const db = ensureSchema();
  let sql = `
    SELECT p.*, c.name as client_name, c.company as client_company
    FROM app_proposals p
    LEFT JOIN app_crm_clients c ON p.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (clientId) {
    sql += ' AND p.client_id = ?';
    params.push(clientId);
  }

  sql += ' ORDER BY p.created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => {
    try {
      r.data = JSON.parse(r.proposal_data_json || '{}');
    } catch {
      r.data = {};
    }
    return r;
  });
}

function updateProposalStatus(id, status) {
  if (!id) throw new Error('Proposal ID required.');
  const db = ensureSchema();
  const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid proposal status: ${status}`);
  }

  db.prepare(`
    UPDATE app_proposals
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, id);

  return getProposal(id);
}

function convertProposalToInvoice(proposalId, invoiceNumber = null) {
  const proposal = getProposal(proposalId);
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found.`);
  }

  // Create invoice from proposal items
  const invoice = createInvoice({
    invoiceNumber,
    clientId: proposal.client_id,
    proposalId: proposal.id,
    items: proposal.data.items || [],
    currency: proposal.currency,
    terms: proposal.data.terms || '',
    notes: `Invoice generated from accepted proposal: ${proposal.title}`,
    status: 'pending'
  });

  // Mark proposal as accepted
  updateProposalStatus(proposalId, 'accepted');

  return {
    proposal: getProposal(proposalId),
    invoice
  };
}

function deleteProposal(id) {
  if (!id) return false;
  const db = ensureSchema();
  const res = db.prepare('DELETE FROM app_proposals WHERE id = ?').run(id);
  return res.changes > 0;
}

module.exports = {
  createProposal,
  getProposal,
  listProposals,
  updateProposalStatus,
  convertProposalToInvoice,
  deleteProposal
};
