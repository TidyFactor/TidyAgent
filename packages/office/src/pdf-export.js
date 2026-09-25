/**
 * @file packages/office/src/pdf-export.js
 * Automated PDF & Printable Document Export Engine for @tidy/office
 * Generates standalone, responsive, print-ready HTML/PDF documents with customizable branded themes.
 *
 * @module @tidy/office/pdf-export
 * @version 1.8.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getInvoice } = require('./invoices');
const { getProposal } = require('./proposals');
const { compileClientDossier } = require('./evidence-compiler');

const THEMES = {
  modern: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    borderColor: '#e2e8f0',
    headerBg: '#f8fafc',
    badgeColor: '#3b82f6'
  },
  minimal: {
    fontFamily: '"SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    primaryColor: '#18181b',
    accentColor: '#27272a',
    borderColor: '#e4e4e7',
    headerBg: '#ffffff',
    badgeColor: '#71717a'
  },
  luxury: {
    fontFamily: '"Cinzel", "Didot", "Bodoni MT", Georgia, serif',
    primaryColor: '#09090b',
    accentColor: '#d97706',
    borderColor: '#27272a',
    headerBg: '#18181b',
    badgeColor: '#f59e0b'
  },
  corporate: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    primaryColor: '#1e3a8a',
    accentColor: '#1d4ed8',
    borderColor: '#cbd5e1',
    headerBg: '#f1f5f9',
    badgeColor: '#1e40af'
  }
};

/**
 * Formats monetary amounts with currency symbol
 */
function formatMoney(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  const syms = { USD: '$', EUR: '€', GBP: '£', EGP: 'EGP ', SAR: 'SAR ', AED: 'AED ' };
  const prefix = syms[currency] || `${currency} `;
  return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Returns baseline responsive print stylesheet
 */
function getBaseStyles(themeName = 'modern') {
  const theme = THEMES[themeName] || THEMES.modern;

  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${theme.fontFamily};
      color: ${theme.primaryColor};
      background: #ffffff;
      line-height: 1.5;
      padding: 40px;
      font-size: 14px;
    }
    .document-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid ${theme.borderColor};
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: ${theme.primaryColor};
    }
    .brand-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-number {
      font-size: 20px;
      font-weight: 700;
      color: ${theme.accentColor};
    }
    .doc-date {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: ${theme.headerBg};
      color: ${theme.badgeColor};
      border: 1px solid ${theme.borderColor};
    }
    .status-paid { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .status-accepted { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
    }
    .party-card h3 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 700;
    }
    .party-detail {
      font-size: 13px;
      color: #475569;
      margin-top: 2px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    table.data-table th {
      background: ${theme.headerBg};
      text-align: left;
      padding: 12px 14px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid ${theme.borderColor};
      color: #475569;
    }
    table.data-table td {
      padding: 14px;
      border-bottom: 1px solid ${theme.borderColor};
      font-size: 13px;
    }
    table.data-table td.numeric, table.data-table th.numeric {
      text-align: right;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-row.grand-total {
      border-top: 2px solid ${theme.borderColor};
      margin-top: 8px;
      padding-top: 10px;
      font-size: 18px;
      font-weight: 800;
      color: ${theme.primaryColor};
    }
    .terms-card {
      background: ${theme.headerBg};
      border-radius: 8px;
      padding: 16px 20px;
      border: 1px solid ${theme.borderColor};
      margin-top: 24px;
    }
    .terms-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
    }
    .terms-text {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 48px;
      padding-top: 20px;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      height: 40px;
      margin-bottom: 8px;
    }
    .sig-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
    }
    @media print {
      body { padding: 0; background: #ffffff; }
      .document-card { max-width: 100%; }
      @page { margin: 15mm; }
    }
  `;
}

/**
 * 1. Render Invoice to HTML
 * @param {object|string} invoiceOrId
 * @param {object} [options={}]
 * @returns {string} Full HTML document
 */
function renderInvoiceHtml(invoiceOrId, options = {}) {
  const invoice = typeof invoiceOrId === 'string' ? getInvoice(invoiceOrId) : invoiceOrId;
  if (!invoice) throw new Error('Invoice not found.');

  const themeName = options.theme || 'modern';
  const currency = invoice.currency || 'USD';
  const items = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items_json || '[]');

  const subtotal = items.reduce((acc, it) => acc + (Number(it.line_total || it.quantity * it.unit_price) || 0), 0);
  const tax = Number(invoice.tax_amount) || 0;
  const discount = Number(invoice.discount_amount) || 0;
  const total = Number(invoice.total_amount) || (subtotal + tax - discount);

  const statusClass = invoice.status === 'paid' ? 'status-paid' : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number || invoice.id}</title>
  <style>${getBaseStyles(themeName)}</style>
</head>
<body>
  <div class="document-card">
    <div class="header-bar">
      <div>
        <div class="brand-title">${options.issuerName || 'TidyFactor Agency'}</div>
        <div class="brand-subtitle">${options.issuerSubtitle || 'Sovereign Digital Services & AI Engineering'}</div>
      </div>
      <div class="doc-meta">
        <div class="doc-number">INVOICE #${invoice.invoice_number || invoice.id}</div>
        <div class="doc-date">Issued: ${invoice.issue_date || new Date().toISOString().split('T')[0]}</div>
        ${invoice.due_date ? `<div class="doc-date">Due: ${invoice.due_date}</div>` : ''}
        <div class="status-badge ${statusClass}">${invoice.status || 'draft'}</div>
      </div>
    </div>

    <div class="parties-grid">
      <div class="party-card">
        <h3>Billed To:</h3>
        <div class="party-name">${invoice.client_name || 'Client'}</div>
        ${invoice.client_company ? `<div class="party-detail">${invoice.client_company}</div>` : ''}
        ${invoice.client_email ? `<div class="party-detail">${invoice.client_email}</div>` : ''}
      </div>
      <div class="party-card">
        <h3>Payable To:</h3>
        <div class="party-name">${options.payeeName || 'TidyFactor Team'}</div>
        <div class="party-detail">${options.payeeEmail || 'billing@tidyfactor.com'}</div>
        <div class="party-detail">${options.payeeTaxId ? `Tax ID: ${options.payeeTaxId}` : 'Wire / Local Bank Transfer'}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="numeric">Qty</th>
          <th class="numeric">Unit Price</th>
          <th class="numeric">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(it => `
          <tr>
            <td>
              <strong>${it.description || it.name || 'Service Item'}</strong>
              ${it.notes ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${it.notes}</div>` : ''}
            </td>
            <td class="numeric">${it.quantity || it.qty || 1}</td>
            <td class="numeric">${formatMoney(it.unit_price || it.unitPrice || 0, currency)}</td>
            <td class="numeric">${formatMoney(it.line_total || (it.quantity || 1) * (it.unit_price || 0), currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatMoney(subtotal, currency)}</span>
        </div>
        ${tax > 0 ? `
          <div class="totals-row">
            <span>Tax / VAT (${invoice.tax_rate || 0}%)</span>
            <span>+${formatMoney(tax, currency)}</span>
          </div>
        ` : ''}
        ${discount > 0 ? `
          <div class="totals-row">
            <span>Discount</span>
            <span>-${formatMoney(discount, currency)}</span>
          </div>
        ` : ''}
        <div class="totals-row grand-total">
          <span>Total Amount</span>
          <span>${formatMoney(total, currency)}</span>
        </div>
      </div>
    </div>

    ${invoice.notes ? `
      <div class="terms-card">
        <div class="terms-title">Notes & Payment Instructions</div>
        <div class="terms-text">${invoice.notes}</div>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * 2. Render Commercial Proposal to HTML
 * @param {object|string} proposalOrId
 * @param {object} [options={}]
 * @returns {string} Full HTML document
 */
function renderProposalHtml(proposalOrId, options = {}) {
  const proposal = typeof proposalOrId === 'string' ? getProposal(proposalOrId) : proposalOrId;
  if (!proposal) throw new Error('Proposal not found.');

  const themeName = options.theme || 'modern';
  const currency = proposal.currency || 'USD';
  const data = typeof proposal.proposal_data === 'object' && proposal.proposal_data !== null
    ? proposal.proposal_data
    : JSON.parse(proposal.proposal_data_json || '{}');

  const items = data.items || [];
  const statusClass = proposal.status === 'accepted' ? 'status-accepted' : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Commercial Proposal: ${proposal.title}</title>
  <style>${getBaseStyles(themeName)}</style>
</head>
<body>
  <div class="document-card">
    <div class="header-bar">
      <div>
        <div class="brand-title">${options.issuerName || 'TidyFactor Agency'}</div>
        <div class="brand-subtitle">${options.issuerSubtitle || 'Commercial Proposal & Scope of Work'}</div>
      </div>
      <div class="doc-meta">
        <div class="doc-number">PROPOSAL #${proposal.id}</div>
        <div class="doc-date">Valid Until: ${proposal.valid_until || '30 days from issue'}</div>
        <div class="status-badge ${statusClass}">${proposal.status || 'draft'}</div>
      </div>
    </div>

    <div style="margin-bottom: 28px;">
      <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 6px;">${proposal.title}</h1>
      <div style="font-size: 13px; color: #64748b;">Prepared for ${proposal.client_name || proposal.client_company || 'Prospective Client'}</div>
    </div>

    ${data.scopeOfWork ? `
      <div style="margin-bottom: 28px;">
        <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Scope of Work & Objectives</h3>
        <div style="font-size: 13px; color: #334155; line-height: 1.7; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          ${data.scopeOfWork.split('\n').join('<br>')}
        </div>
      </div>
    ` : ''}

    <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Milestones & Deliverables</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>Deliverable</th>
          <th class="numeric">Qty</th>
          <th class="numeric">Investment</th>
          <th class="numeric">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(it => `
          <tr>
            <td>
              <strong>${it.name || it.title || 'Deliverable Item'}</strong>
              ${it.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${it.description}</div>` : ''}
            </td>
            <td class="numeric">${it.qty || 1}</td>
            <td class="numeric">${formatMoney(it.unitPrice || 0, currency)}</td>
            <td class="numeric">${formatMoney(it.lineTotal || (it.qty || 1) * (it.unitPrice || 0), currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="totals-table">
        <div class="totals-row grand-total">
          <span>Total Proposed Investment</span>
          <span>${formatMoney(proposal.total_amount, currency)}</span>
        </div>
      </div>
    </div>

    ${data.terms ? `
      <div class="terms-card">
        <div class="terms-title">Terms & Milestone Agreement</div>
        <div class="terms-text">${data.terms}</div>
      </div>
    ` : ''}

    <div class="signature-area">
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Authorized Signature (${options.issuerName || 'TidyFactor'})</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Client Acceptance & Signature (${proposal.client_name || 'Client'})</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 3. Export document HTML to file on disk
 * @param {object} params
 * @param {'invoice'|'proposal'} params.type
 * @param {string} params.id
 * @param {string} [params.outputPath]
 * @param {string} [params.theme='modern']
 * @returns {object} { success: true, filePath, htmlLength }
 */
function exportDocumentToFile({ type, id, outputPath = null, theme = 'modern' }) {
  let html = '';
  let defaultFilename = '';

  if (type === 'invoice') {
    html = renderInvoiceHtml(id, { theme });
    defaultFilename = `invoice_${id}.html`;
  } else if (type === 'proposal') {
    html = renderProposalHtml(id, { theme });
    defaultFilename = `proposal_${id}.html`;
  } else {
    throw new Error(`Unsupported document type for export: "${type}"`);
  }

  const dest = outputPath || path.resolve(process.cwd(), defaultFilename);
  fs.writeFileSync(dest, html, 'utf8');

  return {
    success: true,
    type,
    id,
    theme,
    filePath: dest,
    bytes: Buffer.byteLength(html, 'utf8')
  };
}

module.exports = {
  THEMES,
  formatMoney,
  renderInvoiceHtml,
  renderProposalHtml,
  exportDocumentToFile
};
