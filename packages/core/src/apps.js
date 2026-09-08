/**
 * Tidy Micro-App Library
 * Integrated local productivity tools: Tasks, Snippets, Journal, and Vault.
 * With autonomous Task-to-Memory feedback loops and decision archival.
 */

const crypto = require('crypto');
const { getDb } = require('./db');

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

// ----------------- Tasks App -----------------
function addTask({
  title,
  description = '',
  priority = 'medium',
  domain = 'general',
  assignedAgent = null,
  dueDate = null,
  tags = []
}) {
  if (!title || !title.trim()) throw new Error('Task title cannot be empty.');
  const db = getDb();
  const id = generateId('tsk');
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const p = validPriorities.includes(priority) ? priority : 'medium';

  const stmt = db.prepare(`
    INSERT INTO app_tasks (id, title, description, priority, domain, assigned_agent, status, due_date, tags_json)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);
  stmt.run(id, title.trim(), description.trim(), p, domain, assignedAgent, dueDate, JSON.stringify(tags));

  // Audit log
  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('ADD_TASK', 'tasks_app', JSON.stringify({ id, title: title.trim(), priority: p, domain, assignedAgent }));

  return { id, title: title.trim(), priority: p, domain, assignedAgent, status: 'pending' };
}

function getTask(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM app_tasks WHERE id = ?').get(id);
}

function listTasks({ status = null, priority = null, domain = null, assignedAgent = null } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM app_tasks WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }
  if (domain) {
    sql += ' AND domain = ?';
    params.push(domain);
  }
  if (assignedAgent) {
    sql += ' AND assigned_agent = ?';
    params.push(assignedAgent);
  }
  sql += " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC";
  return db.prepare(sql).all(...params);
}

/**
 * Complete a task and optionally archive learned decision/outcome into Memory SSOT
 */
function completeTask(id, options = {}) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM app_tasks WHERE id = ?').get(id);
  if (!task) return false;

  const resultBrief = typeof options === 'string'
    ? options
    : (options.result || options.resultBrief || options.outcome || null);

  const archiveToMemory = typeof options === 'object' && options.archiveToMemory !== undefined
    ? options.archiveToMemory
    : Boolean(resultBrief);

  if (resultBrief) {
    db.prepare(`
      UPDATE app_tasks
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, result_brief = ?
      WHERE id = ?
    `).run(resultBrief, id);
  } else {
    db.prepare(`
      UPDATE app_tasks
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }

  // Audit log
  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('COMPLETE_TASK', 'tasks_app', JSON.stringify({ id, result: resultBrief }));

  // Autonomous Memory Archival
  if (archiveToMemory) {
    try {
      const memoryModule = require('./memory');
      const targetDomain = task.domain || 'general';
      const ctxRow = db.prepare('SELECT id FROM contexts WHERE domain = ? LIMIT 1').get(targetDomain);
      const ctxId = ctxRow ? ctxRow.id : 'ctx_general';

      const outcomeText = resultBrief
        ? `Task "${task.title}" completed. Outcome & Architectural Decision: ${resultBrief}`
        : `Task "${task.title}" completed under ${targetDomain} domain.`;

      memoryModule.saveMemory({
        content: outcomeText,
        summary: `Completed Task: ${task.title}`,
        tier: 'project',
        category: (typeof options === 'object' && options.category) || 'decision',
        importance: (typeof options === 'object' && options.importance) || 4,
        contextId: ctxId
      });
    } catch (err) {
      // Non-blocking if memory save fails
    }
  }

  return true;
}

function deleteTask(id) {
  if (!id) throw new Error('Task ID is required.');
  const db = getDb();
  const res = db.prepare('DELETE FROM app_tasks WHERE id = ?').run(id);
  return res.changes > 0;
}

function updateTaskBrief(id, briefContent) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE app_tasks
    SET result_brief = ?
    WHERE id = ?
  `);
  stmt.run(briefContent, id);
  return true;
}

// ----------------- Snippets App -----------------
function addSnippet({ title, language = 'javascript', code, tags = [] }) {
  if (!title || !code) throw new Error('Snippet title and code are required.');
  const db = getDb();
  const id = generateId('snp');
  const stmt = db.prepare(`
    INSERT INTO app_snippets (id, title, language, code, tags_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, title.trim(), language.trim().toLowerCase(), code.trim(), JSON.stringify(tags));
  return { id, title, language, code };
}

function listSnippets({ language = null, search = null } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM app_snippets WHERE 1=1';
  const params = [];
  if (language) {
    sql += ' AND language = ?';
    params.push(language.toLowerCase());
  }
  if (search) {
    sql += ' AND (title LIKE ? OR code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

function deleteSnippet(id) {
  if (!id) throw new Error('Snippet ID is required.');
  const db = getDb();
  const res = db.prepare('DELETE FROM app_snippets WHERE id = ?').run(id);
  return res.changes > 0;
}

// ----------------- Journal App -----------------
function addJournalEntry({ title, entry, mood = 'focused', domain = 'general' }) {
  if (!title || !entry) throw new Error('Journal title and entry are required.');
  const db = getDb();
  const id = generateId('jrn');
  const stmt = db.prepare(`
    INSERT INTO app_journal (id, title, entry, mood, domain)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, title.trim(), entry.trim(), mood, domain);
  return { id, title, mood, domain };
}

function listJournal({ limit = 10, domain = null } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM app_journal WHERE 1=1';
  const params = [];
  if (domain) {
    sql += ' AND domain = ?';
    params.push(domain);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

// ----------------- Vault App -----------------
function setSecret({ key, value }) {
  if (!key || !value) throw new Error('Vault key and value are required.');
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO app_vault (key, value, is_secret)
    VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key.trim(), value.trim());
  return { key, success: true };
}

function getSecret(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM app_vault WHERE key = ?').get(key.trim());
  return row ? row.value : null;
}

function listVaultKeys() {
  const db = getDb();
  return db.prepare('SELECT key, is_secret, updated_at FROM app_vault ORDER BY key ASC').all();
}

function deleteSecret(key) {
  if (!key) throw new Error('Vault key is required.');
  const db = getDb();
  const res = db.prepare('DELETE FROM app_vault WHERE key = ?').run(key.trim());
  return res.changes > 0;
}

// ----------------- App Registry -----------------
function listInstalledApps() {
  const db = getDb();
  return db.prepare('SELECT * FROM installed_apps WHERE is_active = 1 ORDER BY name ASC').all();
}

module.exports = {
  addTask,
  getTask,
  listTasks,
  completeTask,
  deleteTask,
  updateTaskBrief,
  addSnippet,
  listSnippets,
  deleteSnippet,
  addJournalEntry,
  listJournal,
  setSecret,
  getSecret,
  listVaultKeys,
  deleteSecret,
  listInstalledApps
};
