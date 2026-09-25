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
      const fn = office.compileClientDossier || office.generateClientDossier;
      const dossier = fn(args.client_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(dossier, null, 2)
        }]
      };
    }
  },
  {
    definition: {
      name: 'tidy_proposal_create',
      description: 'Create a commercial B2B proposal or quotation with scope of work, deliverables, and terms.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Proposal title' },
          client_id: { type: 'string', description: 'Client ID' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                qty: { type: 'number' },
                unit_price: { type: 'number' }
              },
              required: ['name', 'unit_price']
            },
            description: 'Proposed deliverables and milestone investment'
          },
          scope_of_work: { type: 'string', description: 'Detailed project scope and objectives' },
          terms: { type: 'string', description: 'Payment terms and milestone agreement' },
          currency: { type: 'string', default: 'USD' }
        },
        required: ['title']
      }
    },
    handler: (args) => {
      const proposal = office.createProposal({
        title: args.title,
        clientId: args.client_id,
        items: args.items,
        scopeOfWork: args.scope_of_work,
        terms: args.terms,
        currency: args.currency
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, proposal }, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_proposal_list',
      description: 'List or filter commercial proposals by status.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'all'], default: 'all' },
          client_id: { type: 'string', description: 'Filter by client ID' }
        }
      }
    },
    handler: (args) => {
      const proposals = office.listProposals({ status: args.status, clientId: args.client_id });
      return { content: [{ type: 'text', text: JSON.stringify(proposals, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_proposal_convert',
      description: 'Convert an accepted commercial proposal into an active itemized invoice.',
      inputSchema: {
        type: 'object',
        properties: {
          proposal_id: { type: 'string', description: 'Proposal ID to convert' }
        },
        required: ['proposal_id']
      }
    },
    handler: (args) => {
      const invoice = office.convertProposalToInvoice(args.proposal_id);
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, invoice }, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_product_list',
      description: 'List products and standardized services in the catalog.',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Optional category filter' },
          active_only: { type: 'boolean', default: true }
        }
      }
    },
    handler: (args) => {
      const products = office.listProducts({ category: args.category, activeOnly: args.active_only !== false });
      return { content: [{ type: 'text', text: JSON.stringify(products, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_product_add',
      description: 'Add a new product or standardized service SKU to the catalog.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product or service name' },
          sku: { type: 'string', description: 'Optional SKU code' },
          unit_price: { type: 'number', description: 'Base price per unit' },
          currency: { type: 'string', default: 'USD' },
          billing_cycle: { type: 'string', enum: ['one_time', 'monthly', 'quarterly', 'yearly'], default: 'one_time' },
          description: { type: 'string' }
        },
        required: ['name', 'unit_price']
      }
    },
    handler: (args) => {
      const product = office.addProduct({
        name: args.name,
        sku: args.sku,
        unitPrice: args.unit_price,
        currency: args.currency,
        billingCycle: args.billing_cycle,
        description: args.description
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, product }, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_document_export',
      description: 'Export an invoice or proposal into a responsive, print-ready HTML/PDF document with branded themes.',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['invoice', 'proposal'], description: 'Document type' },
          id: { type: 'string', description: 'Invoice or Proposal ID' },
          theme: { type: 'string', enum: ['modern', 'minimal', 'luxury', 'corporate'], default: 'modern' },
          output_path: { type: 'string', description: 'Optional destination file path on disk' }
        },
        required: ['type', 'id']
      }
    },
    handler: (args) => {
      const res = office.exportDocumentToFile({
        type: args.type,
        id: args.id,
        theme: args.theme || 'modern',
        outputPath: args.output_path || null
      });
      return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
    }
  }
] : [];

module.exports = { officeTools, office };
