/**
 * Tidy MCP — Office Suite Tools (Optional Pluggable Pack)
 *
 * @module @tidy/mcp/modules/office-tools
 */

let office = null;
try {
  office = require('@tidy/office');
} catch {
  // Optional pack
}

const officeTools = office ? [
  {
    definition: {
      name: 'tidy_crm_list',
      description: 'List CRM clients or search clients by name/company/status.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['lead', 'active', 'inactive', 'all'], default: 'all' },
          query: { type: 'string', description: 'Search term' }
        }
      }
    },
    handler: (args) => {
      const clients = office.listClients(args);
      return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_crm_add',
      description: 'Add a new client to the CRM.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Client or contact name' },
          company: { type: 'string', description: 'Company name' },
          email: { type: 'string', description: 'Email address' },
          status: { type: 'string', enum: ['lead', 'active', 'inactive'], default: 'lead' }
        },
        required: ['name']
      }
    },
    handler: (args) => {
      const client = office.createClient(args);
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, client }, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_invoice_list',
      description: 'List or filter client invoices by status.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'all'], default: 'all' },
          client_id: { type: 'string', description: 'Filter by client ID' }
        }
      }
    },
    handler: (args) => {
      const invoices = office.listInvoices({ status: args.status, clientId: args.client_id });
      return { content: [{ type: 'text', text: JSON.stringify(invoices, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_invoice_create',
      description: 'Create a new invoice for a client with line items.',
      inputSchema: {
        type: 'object',
        properties: {
          client_id: { type: 'string', description: 'Client ID' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' }
              },
              required: ['description', 'unit_price']
            },
            description: 'Invoice line items'
          },
          tax_rate: { type: 'number', default: 0 },
          discount_amount: { type: 'number', default: 0 },
          due_date: { type: 'string', description: 'YYYY-MM-DD format' },
          notes: { type: 'string' }
        },
        required: ['client_id', 'items']
      }
    },
    handler: (args) => {
      const invoice = office.createInvoice({
        clientId: args.client_id,
        items: args.items,
        taxRate: args.tax_rate,
        discountAmount: args.discount_amount,
        dueDate: args.due_date,
        notes: args.notes
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, invoice }, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_cashflow_summary',
      description: 'Calculate real-time cashflow metrics including total billed, collected, outstanding, and overdue receivables.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: () => {
      const summary = office.getCashflowSummary();
      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_client_dossier',
      description: 'Generate a comprehensive client dossier aggregating profile, project tasks, and financial transaction history.',
      inputSchema: {
        type: 'object',
        properties: {
          client_id: { type: 'string', description: 'Client ID' }
        },
        required: ['client_id']
      }
    },
    handler: (args) => {
      const dossier = office.generateClientDossier(args.client_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(dossier, null, 2)
        }]
      };
    }
  }
] : [];

module.exports = { officeTools, office };
