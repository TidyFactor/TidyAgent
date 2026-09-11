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
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
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

    if (pathname === '/api/memories/prune' && req.method === 'POST') {
      const body = await parseBody(req).catch(() => ({}));
      const resPruned = core.pruneDecayedMemories(body || {});
      return sendJson(res, 200, { ok: true, data: resPruned });
    }

    if ((pathname === '/api/memories/harvest/scan' || pathname === '/api/memories/harvest-scan') && (req.method === 'POST' || req.method === 'GET')) {
      const body = req.method === 'POST' ? await parseBody(req).catch(() => ({})) : query;
      const results = core.scanKnowledgeSources(body || {});
      return sendJson(res, 200, { ok: true, data: results });
    }

    if ((pathname === '/api/memories/harvest/item' || pathname === '/api/memories/harvest-item') && (req.method === 'POST' || req.method === 'GET')) {
      const body = req.method === 'POST' ? await parseBody(req).catch(() => ({})) : query;
      const targetPath = body.sourcePath || body.path || query.path;
      if (!targetPath) return sendJson(res, 400, { ok: false, error: 'Missing path parameter' });
      const item = core.readHarvestItem(targetPath);
      return sendJson(res, 200, { ok: true, data: item });
    }

    if ((pathname === '/api/memories/harvest/import' || pathname === '/api/memories/harvest-import') && req.method === 'POST') {
      const body = await parseBody(req);
      const results = core.importBatchMemories(body.items, body.options || {});
      return sendJson(res, 201, { ok: true, data: results });
    }

    if (pathname.startsWith('/api/memories/') && (req.method === 'PUT' || req.method === 'POST') && !pathname.endsWith('/prune') && !pathname.includes('/harvest')) {
      const id = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = core.updateMemory(id, body);
      return sendJson(res, 200, { ok: true, data: updated });
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

    // ---------------- Subagents & Skills CRUD ----------------
    if (pathname === '/api/subagents' && req.method === 'GET') {
      const includeDisabled = query.all === '1';
      const domain = query.domain || null;
      return sendJson(res, 200, { ok: true, data: core.listSubagents({ includeDisabled, domain }) });
    }

    if (pathname === '/api/subagents' && req.method === 'POST') {
      const body = await parseBody(req);
      const agent = core.registerSubagent(body);
      return sendJson(res, 201, { ok: true, data: agent });
    }

    if (pathname.startsWith('/api/subagents/') && pathname.endsWith('/toggle') && req.method === 'POST') {
      const id = pathname.split('/')[3];
      const toggled = core.toggleSubagent(id);
      return sendJson(res, 200, { ok: true, data: toggled });
    }

    if (pathname.startsWith('/api/subagents/') && req.method === 'PUT') {
      const id = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = core.updateSubagent(id, body);
      return sendJson(res, 200, { ok: true, data: updated });
    }

    if (pathname.startsWith('/api/subagents/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      const deleted = core.deleteSubagent(id);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    if (pathname === '/api/subagents/run' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = core.runSubagent(body.name, body.task);
      return sendJson(res, 200, { ok: true, data: result });
    }

    if (pathname === '/api/skills' && req.method === 'GET') {
      const includeDisabled = query.all === '1';
      const skills = core.listRegisteredSkills ? core.listRegisteredSkills({ includeDisabled }) : [];
      return sendJson(res, 200, { ok: true, data: skills });
    }

    if (pathname === '/api/skills' && req.method === 'POST') {
      const body = await parseBody(req);
      const skill = core.createSkill(body);
      return sendJson(res, 201, { ok: true, data: skill });
    }

    if (pathname.startsWith('/api/skills/') && pathname.endsWith('/toggle') && req.method === 'POST') {
      const id = pathname.split('/')[3];
      const toggled = core.toggleSkill(id);
      return sendJson(res, 200, { ok: true, data: toggled });
    }

    if (pathname.startsWith('/api/skills/') && req.method === 'PUT') {
      const id = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = core.updateSkill(id, body);
      return sendJson(res, 200, { ok: true, data: updated });
    }

    if (pathname.startsWith('/api/skills/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      const deleted = core.deleteSkill(id);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    if (pathname === '/api/skills/scan' && req.method === 'POST') {
      const body = await parseBody(req);
      const discovered = core.discoverSkills ? core.discoverSkills(body.dir ? [body.dir] : []) : [];
      return sendJson(res, 200, { ok: true, data: discovered });
    }

    // ---------------- Universal Skills & Agents Studio ----------------
    if (pathname === '/api/studio/items' && req.method === 'GET') {
      const force = query.force === '1' || query.rescan === '1';
      const scanRes = core.scanAllTools({ force });
      let filtered = scanRes.items;

      if (query.tool) {
        filtered = filtered.filter(i => i.tools.includes(query.tool));
      }
      if (query.type) {
        filtered = filtered.filter(i => i.itemType === query.type);
      }
      if (query.favorites === '1') {
        filtered = filtered.filter(i => i.isFavorite);
      }
      if (query.collection) {
        filtered = filtered.filter(i => i.collections.includes(query.collection));
      }
      if (query.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(i =>
          i.name.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
        );
      }

      // Compact items for fast serialization
      const lightItems = filtered.map(i => ({
        id: i.id,
        slug: i.slug,
        name: i.name,
        title: i.title,
        itemType: i.itemType,
        description: i.description,
        primaryPath: i.primaryPath,
        primaryDir: i.primaryDir,
        tools: i.tools,
        authorTag: i.authorTag,
        sizeFormatted: i.sizeFormatted,
        mtime: i.mtime,
        isFavorite: i.isFavorite,
        collections: i.collections
      }));

      return sendJson(res, 200, {
        ok: true,
        data: {
          total: scanRes.total,
          skillsCount: scanRes.skillsCount,
          agentsCount: scanRes.agentsCount,
          rulesCount: scanRes.rulesCount,
          favoritesCount: scanRes.favoritesCount,
          tools: scanRes.tools,
          filteredCount: lightItems.length,
          items: lightItems
        }
      }, req);
    }

    if (pathname === '/api/studio/item' && req.method === 'GET') {
      const itemPath = query.path;
      if (!itemPath) return sendJson(res, 400, { ok: false, error: 'Path query param required' });
      try {
        const item = core.readStudioItem(itemPath);
        return sendJson(res, 200, { ok: true, data: item }, req);
      } catch (err) {
        return sendJson(res, 404, { ok: false, error: err.message });
      }
    }

    if (pathname === '/api/studio/item' && req.method === 'PUT') {
      const body = await parseBody(req);
      try {
        const result = core.saveStudioItem(body.path, body.content);
        if (core.invalidateScanCache) core.invalidateScanCache();
        return sendJson(res, 200, { ok: true, data: result });
      } catch (err) {
        return sendJson(res, 500, { ok: false, error: err.message });
      }
    }

    if (pathname === '/api/studio/item' && req.method === 'DELETE') {
      const body = await parseBody(req);
      const targetPath = body.path || query.path;
      const ok = core.deleteStudioItem(targetPath);
      if (core.invalidateScanCache) core.invalidateScanCache();
      return sendJson(res, 200, { ok: true, data: { deleted: ok } });
    }

    if (pathname === '/api/studio/create' && req.method === 'POST') {
      const body = await parseBody(req);
      try {
        const created = core.createBoilerplate(body);
        if (core.invalidateScanCache) core.invalidateScanCache();
        return sendJson(res, 201, { ok: true, data: created });
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
      }
    }

    if (pathname === '/api/studio/validate' && req.method === 'POST') {
      const body = await parseBody(req);
      const report = core.validateSkill(body.path);
      return sendJson(res, 200, { ok: true, data: report });
    }

    if (pathname === '/api/studio/collections' && req.method === 'GET') {
      const cols = core.listCollections();
      return sendJson(res, 200, { ok: true, data: cols });
    }

    if (pathname === '/api/studio/collections' && req.method === 'POST') {
      const body = await parseBody(req);
      const col = core.createCollection(body);
      return sendJson(res, 201, { ok: true, data: col });
    }

    if (pathname.startsWith('/api/studio/collections/') && req.method === 'DELETE') {
      const id = pathname.split('/')[4];
      const deleted = core.deleteCollection(id);
      return sendJson(res, 200, { ok: true, data: { deleted } });
    }

    if (pathname === '/api/studio/collections/assign' && req.method === 'POST') {
      const body = await parseBody(req);
      core.assignItemToCollection(body.collectionId, body.itemPath, body.itemType, body.tool);
      return sendJson(res, 200, { ok: true, data: { assigned: true } });
    }

    if (pathname === '/api/studio/collections/remove' && req.method === 'POST') {
      const body = await parseBody(req);
      core.removeItemFromCollection(body.collectionId, body.itemPath);
      return sendJson(res, 200, { ok: true, data: { removed: true } });
    }

    if (pathname === '/api/studio/favorites/toggle' && req.method === 'POST') {
      const body = await parseBody(req);
      const fav = core.toggleFavorite(body.itemPath, body.itemType, body.tool);
      return sendJson(res, 200, { ok: true, data: fav });
    }

    if (pathname === '/api/studio/discovery' && req.method === 'GET') {
      const catalog = core.listDiscoveryCatalog();
      return sendJson(res, 200, { ok: true, data: catalog });
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

    // ---------------- Data Sovereignty & Portability ----------------
    if (pathname === '/api/export/markdown' && req.method === 'POST') {
      const body = await parseBody(req);
      const resExp = core.exportToMarkdown(body.outputDir);
      return sendJson(res, 200, { ok: true, data: resExp });
    }

    if (pathname === '/api/export/json' && req.method === 'GET') {
      const resExp = core.exportToJson();
      return sendJson(res, 200, { ok: true, data: resExp });
    }

    if (pathname === '/api/import/json' && req.method === 'POST') {
      const body = await parseBody(req);
      const resImp = core.importFromJson(body.filePath);
      return sendJson(res, 200, { ok: true, data: resImp });
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

    if (pathname === '/api/shell/open' && req.method === 'POST') {
      const body = await parseBody(req);
      const targetPath = (body?.path || '').trim();
      if (!targetPath) return sendJson(res, 400, { ok: false, error: 'Path required' });
      try {
        const { spawn, exec } = require('child_process');
        let resolved = path.resolve(targetPath);
        if (!fs.existsSync(resolved)) {
          resolved = path.dirname(resolved);
        }

        if (process.platform === 'win32') {
          const winDir = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
          const explorerExe = path.join(winDir, 'explorer.exe');
          const winPath = resolved.replace(/[\\/]+$/, '');
          const isFile = fs.existsSync(winPath) && fs.statSync(winPath).isFile();
          const args = isFile ? [`/select,${winPath}`] : [winPath];
          const child = spawn(explorerExe, args, { detached: true, stdio: 'ignore' });
          child.unref();
        } else if (process.platform === 'darwin') {
          exec(`open "${resolved}"`);
        } else {
          exec(`xdg-open "${resolved}"`);
        }
        return sendJson(res, 200, { ok: true, data: { opened: resolved } });
      } catch (err) {
        return sendJson(res, 500, { ok: false, error: err.message });
      }
    }


    // ---------------- Static Asset Delivery (Gzip & Smart Caching) ----------------
    function serveStaticFile(targetPath, isHtml = false) {
      const ext = path.extname(targetPath).toLowerCase();
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const headers = {
        'Content-Type': MIME_TYPES[ext] || 'text/plain',
        'Vary': 'Accept-Encoding',
        'Cache-Control': 'no-cache, must-revalidate'
      };

      if (isHtml) {
        let content = fs.readFileSync(targetPath, 'utf8');
        // Ensure all relative assets (css, js, images) resolve relative to root /
        if (!content.includes('<base ')) {
          content = content.replace(/<head>/i, '<head>\n  <base href="/">');
        }
        headers['Content-Type'] = 'text/html; charset=utf-8';
        if (/\bgzip\b/.test(acceptEncoding) && content.length > 512) {
          headers['Content-Encoding'] = 'gzip';
          res.writeHead(200, headers);
          return zlib.gzip(Buffer.from(content, 'utf8'), (_, zipped) => res.end(zipped));
        }
        res.writeHead(200, headers);
        return res.end(content);
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

    // Direct markdown requests (e.g. /maintainers/audit.md) redirected safely to dashboard
    if (pathname.endsWith('.md') || pathname.endsWith('.mdc')) {
      res.writeHead(302, { Location: '/' });
      return res.end();
    }

    let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveStaticFile(filePath, pathname === '/' || pathname.endsWith('.html'));
    }

    // Missing static assets (.css, .js, .png, etc.) return 404 to avoid MIME type corruption
    const reqExt = path.extname(pathname).toLowerCase();
    if (reqExt && reqExt !== '.html') {
      return sendJson(res, 404, { ok: false, error: `Static asset not found: ${pathname}` });
    }

    // Fallback to index.html for client SPA routing
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
