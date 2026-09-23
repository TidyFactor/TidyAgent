/**
 * Tidy Ecosystem — Sub-Agents Registry & Orchestrator
 * Manages specialized assistant roles, scoped system prompts, and tool delegation.
 *
 * @module @tidy/core/subagents
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */


const { getDb } = require('./db');
const { recallMemory } = require('./memory');

function listSubagents(options = {}) {
  const db = getDb();
  const includeDisabled = options.includeDisabled || false;
  const domain = options.domain || null;

  let query = 'SELECT * FROM subagents';
  const conditions = [];
  const params = [];

  if (!includeDisabled) {
    conditions.push('is_enabled = 1');
  }
  if (domain) {
    conditions.push('domain = ?');
    params.push(domain);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY name ASC';

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    allowed_tools: JSON.parse(r.allowed_tools_json || '[]')
  }));
}

function getSubagent(nameOrId) {
  const db = getDb();
  const agent = db.prepare('SELECT * FROM subagents WHERE id = ? OR name = ? LIMIT 1').get(nameOrId, nameOrId);
  if (!agent) return null;
  return {
    ...agent,
    allowed_tools: JSON.parse(agent.allowed_tools_json || '[]')
  };
}

function registerSubagent({ name, role, description, systemPrompt, allowedTools = [], domain = 'general' }) {
  if (!name || !role || !systemPrompt) {
    throw new Error('name, role, and systemPrompt are required to register a sub-agent.');
  }

  const db = getDb();
  const id = `agent_${name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
  const toolsJson = JSON.stringify(allowedTools);

  const stmt = db.prepare(`
    INSERT INTO subagents (id, name, role, description, system_prompt, allowed_tools_json, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(name) DO UPDATE SET
      role = excluded.role,
      description = excluded.description,
      system_prompt = excluded.system_prompt,
      allowed_tools_json = excluded.allowed_tools_json,
      is_enabled = 1
  `);

  stmt.run(id, name, role, description || '', systemPrompt, toolsJson);

  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('REGISTER_SUBAGENT', 'subagent_runner', JSON.stringify({ id, name, role }));

  return getSubagent(id);
}

function updateSubagent(idOrName, updates = {}) {
  const db = getDb();
  const agent = getSubagent(idOrName);
  if (!agent) throw new Error(`Subagent "${idOrName}" not found`);

  const role = updates.role !== undefined ? updates.role : agent.role;
  const description = updates.description !== undefined ? updates.description : agent.description;
  const systemPrompt = updates.systemPrompt !== undefined ? updates.systemPrompt : agent.system_prompt;
  const allowedTools = updates.allowedTools !== undefined ? updates.allowedTools : agent.allowed_tools;
  const isEnabled = updates.isEnabled !== undefined ? (updates.isEnabled ? 1 : 0) : agent.is_enabled;

  db.prepare(`
    UPDATE subagents
    SET role = ?, description = ?, system_prompt = ?, allowed_tools_json = ?, is_enabled = ?
    WHERE id = ?
  `).run(role, description, systemPrompt, JSON.stringify(allowedTools), isEnabled, agent.id);

  return getSubagent(agent.id);
}

function toggleSubagent(idOrName, isEnabled = null) {
  const db = getDb();
  const agent = getSubagent(idOrName);
  if (!agent) throw new Error(`Subagent "${idOrName}" not found`);

  const nextState = isEnabled !== null ? (isEnabled ? 1 : 0) : (agent.is_enabled ? 0 : 1);
  db.prepare('UPDATE subagents SET is_enabled = ? WHERE id = ?').run(nextState, agent.id);
  return getSubagent(agent.id);
}

function deleteSubagent(idOrName) {
  const db = getDb();
  const agent = getSubagent(idOrName);
  if (!agent) return false;

  // Protect system agent tidy
  if (agent.name === 'tidy') {
    throw new Error('Cannot delete primary system agent "@tidy"');
  }

  const res = db.prepare('DELETE FROM subagents WHERE id = ?').run(agent.id);
  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('DELETE_SUBAGENT', 'subagent_runner', JSON.stringify({ id: agent.id, name: agent.name }));
  return res.changes > 0;
}

function prepareSubagentContext({ name, task, contextId = null }) {
  const agent = getSubagent(name);
  if (!agent) {
    throw new Error(`Subagent "${name}" is not registered in Tidy.`);
  }

  const db = getDb();
  const activeCtx = contextId
    ? db.prepare('SELECT * FROM contexts WHERE id = ?').get(contextId)
    : db.prepare('SELECT * FROM contexts WHERE is_active = 1 LIMIT 1').get();

  const profile = db.prepare("SELECT * FROM user_profile WHERE id = 'primary'").get();

  // Recall memory relevant to task
  const relevantMemories = recallMemory({
    query: task,
    limit: 4,
    contextId: activeCtx ? activeCtx.id : null
  });

  const parsedTools = JSON.parse(agent.allowed_tools_json || '[]');

  const executionContext = {
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      system_prompt: agent.system_prompt,
      allowed_tools: parsedTools
    },
    ring0_profile: {
      user_name: profile.user_name,
      assistant_name: profile.assistant_name,
      locale: profile.locale,
      tone: profile.tone
    },
    ring1_workspace: {
      context_id: activeCtx ? activeCtx.id : 'ctx_general',
      context_name: activeCtx ? activeCtx.name : 'General Workspace',
      domain: activeCtx ? activeCtx.domain : 'general'
    },
    ring2_recalled_memory: relevantMemories.map(m => ({
      id: m.id,
      category: m.category,
      content: m.content,
      importance: m.importance
    })),
    task
  };

  const logStmt = db.prepare('INSERT INTO audit_log (action, component, details_json) VALUES (?, ?, ?)');
  logStmt.run('EXEC_SUBAGENT', 'subagent_runner', JSON.stringify({ agent: agent.name, task }));

  return executionContext;
}

function runSubagent(name, task, executorFn) {
  const ctx = prepareSubagentContext({ name, task });
  const exec = executorFn || ((agent, t) => `[${agent.role}] 3-Ring Context Injected. Task completed: "${t}"`);
  const output = exec(ctx.agent, task);

  // Record task execution into memory
  const { saveMemory } = require('./memory');
  const mem = saveMemory({
    content: `[Subagent: @${ctx.agent.name}] Task: ${task}\nOutput: ${output}`,
    tier: 'session',
    category: 'task',
    importance: 3,
    contextId: ctx.ring1_workspace.context_id
  });

  return {
    subagent: ctx.agent.name,
    task,
    output,
    memoryNodeId: mem.id,
    context: ctx
  };
}

module.exports = {
  listSubagents,
  getSubagent,
  registerSubagent,
  updateSubagent,
  toggleSubagent,
  deleteSubagent,
  prepareSubagentContext,
  runSubagent
};
