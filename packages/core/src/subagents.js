/**
 * Tidy Sub-Agents Registry & Orchestrator
 * Manages specialized roles, scoped prompts, and tool delegation.
 */

const { getDb } = require('./db');
const { recallMemory } = require('./memory');

function listSubagents() {
  const db = getDb();
  return db.prepare('SELECT * FROM subagents WHERE is_enabled = 1 ORDER BY name ASC').all();
}

function getSubagent(nameOrId) {
  const db = getDb();
  return db.prepare('SELECT * FROM subagents WHERE id = ? OR name = ? LIMIT 1').get(nameOrId, nameOrId);
}

function registerSubagent({ name, role, description, systemPrompt, allowedTools = [] }) {
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
  prepareSubagentContext,
  runSubagent
};
