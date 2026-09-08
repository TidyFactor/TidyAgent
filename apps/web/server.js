/**
 * Tidy Web Management Server
 * Zero-dependency native Node.js HTTP server exposing REST APIs and Web Dashboard.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

let core;
try {
  core = require('@tidy/core');
} catch {
  try {
    core = require('../../packages/core/src/index');
  } catch {
    core = require('../../scripts/db');
  }
}

let office = null;
try {
  office = require('@tidy/office');
} catch {
  try {
    office = require('../../packages/office/src/index');
  } catch {
    office = null;
  }
}

const PORT = process.env.PORT || 3840;
const HOST = process.env.HOST || '127.0.0.1';
const WEB_TOKEN = process.env.TIDY_WEB_TOKEN || null;
const STATIC_DIR = path.join(__dirname, '../desktop/src/renderer');

// Ensure DB ready
core.initDatabase();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data, req = null) {
  const jsonStr = JSON.stringify(data);
  const acceptEncoding = req ? (req.headers['accept-encoding'] || '') : '';
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Accept-Encoding'
  };

  if (req && /\bgzip\b/.test(acceptEncoding) && jsonStr.length > 512) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(statusCode, headers);
    return zlib.gzip(Buffer.from(jsonStr, 'utf-8'), (err, zipped) => {
      if (err) return res.end(jsonStr);
      res.end(zipped);
    });
  }

  res.writeHead(statusCode, headers);
  res.end(jsonStr);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Check optional Token authentication
  if (WEB_TOKEN && pathname.startsWith('/api/')) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || query.token;
    if (token !== WEB_TOKEN) {
      return sendJson(res, 401, { ok: false, error: 'Unauthorized: Invalid or missing TIDY_WEB_TOKEN' });
    }
  }

  // REST API Router
  try {
    // ---------------- System & Telemetry ----------------
    if (pathname === '/api/stats' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, data: core.getStats() });
    }

    // ---------------- Profile & Settings ----------------
    if (pathname === '/api/profile' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, data: core.getUserProfile() });
    }

    if (pathname === '/api/profile' && (req.method === 'PUT' || req.method === 'POST')) {
      const body = await parseBody(req);
      const updated = core.updateUserProfile(body);
      return sendJson(res, 200, { ok: true, data: updated });
    }

    // ---------------- Config Provider ----------------
    if (pathname === '/api/config' && req.method === 'GET') {
      if (query.key) {
        return sendJson(res, 200, { ok: true, data: { key: query.key, value: core.getConfig(query.key) } });
      }
      return sendJson(res, 200, { ok: true, data: core.listConfig() });
    }

    if (pathname === '/api/config' && req.method === 'POST') {
      const body = await parseBody(req);
      core.setConfig(body.key, body.value);
      return sendJson(res, 200, { ok: true, data: { key: body.key, value: body.value } });
    }

    // ---------------- Governance & Policies ----------------
    if (pathname === '/api/govern' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, data: core.getGovernanceRules() });
    }

    if (pathname === '/api/govern' && req.method === 'POST') {
      const body = await parseBody(req);
      const rules = core.setGovernanceRule(body.key, body.value);
      return sendJson(res, 200, { ok: true, data: rules });
    }

    // ---------------- Contexts & Workspaces ----------------
    if (pathname === '/api/contexts' && req.method === 'GET') {
      const db = core.getDb();
      const contexts = db.prepare('SELECT * FROM contexts ORDER BY is_active DESC, name ASC').all();
      return sendJson(res, 200, { ok: true, data: contexts });
    }

    if (pathname === '/api/contexts/switch' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = core.getDb();
      const target = db.prepare('SELECT * FROM contexts WHERE id = ?').get(body.contextId);
      if (!target) throw new Error(`Context "${body.contextId}" not found.`);
      db.prepare('UPDATE contexts SET is_active = 0').run();
      db.prepare('UPDATE contexts SET is_active = 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?').run(body.contextId);
      return sendJson(res, 200, { ok: true, data: target });
    }

    // ---------------- Memories ----------------
    if (pathname === '/api/memories' && req.method === 'GET') {
      const q = query.query;
      const category = query.category || null;
      const tier = query.tier || null;
      const data = q
        ? core.recallMemory({ query: q, category, tier })
        : core.listMemories({ limit: 50, category, tier });
      return sendJson(res, 200, { ok: true, data });
    }

    if (pathname === '/api/memories' && req.method === 'POST') {
      const body = await parseBody(req);
      const saved = core.saveMemory(body);
      return sendJson(res, 201, { ok: true, data: saved });
    }

    if (pathname.startsWith('/api/memories/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      const deleted = core.forgetMemory(id);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    // ---------------- Tasks ----------------
    if (pathname === '/api/tasks' && req.method === 'GET') {
      const status = query.status || null;
      const domain = query.domain || null;
      return sendJson(res, 200, { ok: true, data: core.listTasks({ status, domain }) });
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
      const body = await parseBody(req);
      const task = core.addTask(body);
      return sendJson(res, 201, { ok: true, data: task });
    }

    if (pathname.startsWith('/api/tasks/') && pathname.endsWith('/complete') && req.method === 'POST') {
      const id = pathname.split('/')[3];
      core.completeTask(id);
      return sendJson(res, 200, { ok: true, data: { completed: true } });
    }

    // ---------------- Snippets App ----------------
    if (pathname === '/api/snippets' && req.method === 'GET') {
      const language = query.language || null;
      const search = query.search || null;
      return sendJson(res, 200, { ok: true, data: core.listSnippets({ language, search }) });
    }

    if (pathname === '/api/snippets' && req.method === 'POST') {
      const body = await parseBody(req);
      const snip = core.addSnippet(body);
      return sendJson(res, 201, { ok: true, data: snip });
    }

    if (pathname.startsWith('/api/snippets/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      const deleted = core.deleteSnippet(id);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    // ---------------- Journal App ----------------
    if (pathname === '/api/journal' && req.method === 'GET') {
      const limit = parseInt(query.limit, 10) || 20;
      return sendJson(res, 200, { ok: true, data: core.listJournal({ limit }) });
    }

    if (pathname === '/api/journal' && req.method === 'POST') {
      const body = await parseBody(req);
      const entry = core.addJournalEntry(body);
      return sendJson(res, 201, { ok: true, data: entry });
    }

    // ---------------- Vault App ----------------
    if (pathname === '/api/vault' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, data: core.listVaultKeys() });
    }

    if (pathname.startsWith('/api/vault/') && req.method === 'GET') {
      const key = decodeURIComponent(pathname.split('/')[3]);
      const value = core.getSecret(key);
      return sendJson(res, 200, { ok: true, data: { key, value } });
    }

    if (pathname === '/api/vault' && req.method === 'POST') {
      const body = await parseBody(req);
      const resVault = core.setSecret(body);
      return sendJson(res, 201, { ok: true, data: resVault });
    }

    if (pathname.startsWith('/api/vault/') && req.method === 'DELETE') {
      const key = decodeURIComponent(pathname.split('/')[3]);
      const deleted = core.deleteSecret(key);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    // ---------------- Subagents & Skills ----------------
    if (pathname === '/api/subagents' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, data: core.listSubagents() });
    }

    if (pathname === '/api/subagents/run' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = core.runSubagent(body.name, body.task);
      return sendJson(res, 200, { ok: true, data: result });
    }

    if (pathname === '/api/skills' && req.method === 'GET') {
      const skills = core.listRegisteredSkills ? core.listRegisteredSkills() : [];
      return sendJson(res, 200, { ok: true, data: skills });
    }

    if (pathname === '/api/skills/scan' && req.method === 'POST') {
      const body = await parseBody(req);
      const discovered = core.discoverSkills ? core.discoverSkills(body.dir ? [body.dir] : []) : [];
      return sendJson(res, 200, { ok: true, data: discovered });
    }

    if (pathname === '/api/brief' && req.method === 'POST') {
      const body = await parseBody(req);
      const brief = core.generateTaskBrief(body);
      return sendJson(res, 200, { ok: true, data: brief });
    }

    // ---------------- Database Maintenance Operations ----------------
    if (pathname === '/api/db/backup' && req.method === 'POST') {
      const body = await parseBody(req);
      const resDb = core.backupDatabase(body.targetPath);
      return sendJson(res, 200, { ok: true, data: resDb });
    }

    if (pathname === '/api/db/checkpoint' && req.method === 'POST') {
      const resDb = core.checkpointWal();
      return sendJson(res, 200, { ok: true, data: resDb });
    }

    if (pathname === '/api/db/integrity' && req.method === 'POST') {
      const resDb = core.checkIntegrity();
      return sendJson(res, 200, { ok: true, data: resDb });
    }

    // ---------------- Office Suite Operations (@tidy/office) ----------------
    if (pathname === '/api/office/stats' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const cashflow = office.getCashflowSummary();
      const clients = office.listClients({ limit: 100 });
      const invoices = office.listInvoices({ limit: 100 });
      return sendJson(res, 200, {
        ok: true,
        data: {
          clientsCount: clients.length,
          invoicesCount: invoices.length,
          cashflow
        }
      });
    }

    if (pathname === '/api/office/crm/clients' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const status = query.status || null;
      const search = query.search || null;
      const limit = parseInt(query.limit, 10) || 100;
      return sendJson(res, 200, { ok: true, data: office.listClients({ status, search, limit }) });
    }

    if (pathname === '/api/office/crm/clients' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const client = office.addClient(body);
      return sendJson(res, 201, { ok: true, data: client });
    }

    if (pathname.startsWith('/api/office/crm/clients/') && req.method === 'PUT') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const id = pathname.split('/')[4];
      const body = await parseBody(req);
      const updated = office.updateClient(id, body);
      return sendJson(res, 200, { ok: true, data: updated });
    }

    if (pathname.startsWith('/api/office/crm/clients/') && req.method === 'DELETE') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const id = pathname.split('/')[4];
      const deleted = office.deleteClient(id);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    if (pathname === '/api/office/invoices' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const status = query.status || null;
      const clientId = query.clientId || query.client_id || null;
      const limit = parseInt(query.limit, 10) || 100;
      return sendJson(res, 200, { ok: true, data: office.listInvoices({ status, clientId, limit }) });
    }

    if (pathname === '/api/office/invoices' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const invoice = office.createInvoice(body);
      return sendJson(res, 201, { ok: true, data: invoice });
    }

    if (pathname.startsWith('/api/office/invoices/') && pathname !== '/api/office/invoices/status' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const id = pathname.split('/')[4];
      const invoice = office.getInvoice(id);
      if (!invoice) return sendJson(res, 404, { ok: false, error: `Invoice "${id}" not found` });
      return sendJson(res, 200, { ok: true, data: invoice });
    }

    if (pathname === '/api/office/invoices/status' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const updated = office.updateInvoiceStatus(body.id || body.invoiceId, body.status, body.amountPaid);
      return sendJson(res, 200, { ok: true, data: updated });
    }

    if (pathname === '/api/office/expenses' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const category = query.category || null;
      const limit = parseInt(query.limit, 10) || 100;
      return sendJson(res, 200, { ok: true, data: office.listExpenses({ category, limit }) });
    }

    if (pathname === '/api/office/expenses' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const expense = office.addExpense(body);
      return sendJson(res, 201, { ok: true, data: expense });
    }

    if (pathname === '/api/office/cashflow' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const summary = office.getCashflowSummary();
      return sendJson(res, 200, { ok: true, data: summary });
    }

    if (pathname.startsWith('/api/office/dossier/') && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const clientId = pathname.split('/')[4];
      const dossier = office.compileClientDossier(clientId);
      return sendJson(res, 200, { ok: true, data: dossier });
    }

    if (pathname === '/api/office/proposals' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      return sendJson(res, 200, { ok: true, data: office.listProposals ? office.listProposals() : [] });
    }

    if (pathname === '/api/office/proposals' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const proposal = office.createProposal(body);
      return sendJson(res, 201, { ok: true, data: proposal });
    }

    if (pathname === '/api/office/products' && req.method === 'GET') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      return sendJson(res, 200, { ok: true, data: office.listProducts ? office.listProducts() : [] });
    }

    if (pathname === '/api/office/products' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const product = office.addProduct(body);
      return sendJson(res, 201, { ok: true, data: product });
    }

    if (pathname === '/api/office/import-pocketoffice' && req.method === 'POST') {
      if (!office) return sendJson(res, 503, { ok: false, error: 'Office pack not installed' });
      const body = await parseBody(req);
      const result = office.importFromPocketOffice(body.sourcePath);
      return sendJson(res, 200, { ok: true, data: result });
    }


    // ---------------- Static Asset Delivery (Gzip & Smart Caching) ----------------
    function serveStaticFile(targetPath, isHtml = false) {
      const ext = path.extname(targetPath).toLowerCase();
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const headers = {
        'Content-Type': MIME_TYPES[ext] || 'text/plain',
        'Vary': 'Accept-Encoding'
      };

      if (isHtml) {
        headers['Cache-Control'] = 'no-cache, must-revalidate';
      } else {
        headers['Cache-Control'] = 'public, max-age=86400, must-revalidate';
      }

      const stream = fs.createReadStream(targetPath);

      if (/\bgzip\b/.test(acceptEncoding)) {
        headers['Content-Encoding'] = 'gzip';
        res.writeHead(200, headers);
        return stream.pipe(zlib.createGzip({ level: 6 })).pipe(res);
      } else if (/\bdeflate\b/.test(acceptEncoding)) {
        headers['Content-Encoding'] = 'deflate';
        res.writeHead(200, headers);
        return stream.pipe(zlib.createDeflate()).pipe(res);
      }

      res.writeHead(200, headers);
      return stream.pipe(res);
    }

    let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveStaticFile(filePath, pathname === '/' || pathname.endsWith('.html'));
    }

    // Fallback to index.html for client routing
    const indexHtml = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return serveStaticFile(indexHtml, true);
    }

    sendJson(res, 404, { ok: false, error: 'Not Found' });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n============================================================`);
  console.log(`  ✨ Tidy Web Console listening on http://${HOST}:${PORT}`);
  console.log(`  📁 Connected to SQLite SSOT: ${core.resolveDbPath()}`);
  if (WEB_TOKEN) console.log(`  🔒 Protected with TIDY_WEB_TOKEN security guard`);
  console.log(`============================================================\n`);
});
