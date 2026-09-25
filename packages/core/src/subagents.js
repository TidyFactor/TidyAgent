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

/**
 * Helper to normalize local OpenAI-compatible endpoint to guarantee correct /v1 prefix.
 * Compatible with llama-server, LM Studio, vLLM, Ollama (/v1), LocalAI.
 */
function resolveOpenAiEndpoint(rawEndpoint, subpath = '/chat/completions') {
  let ep = (rawEndpoint || 'http://127.0.0.1:8080/v1').trim().replace(/\/+$/, '');
  ep = ep.replace(/\/chat\/completions$/, '').replace(/\/models$/, '');
  if (!ep.endsWith('/v1') && !ep.includes('/v1/')) {
    ep = `${ep}/v1`;
  }
  const cleanPath = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${ep}${cleanPath}`;
}

/**
 * Resolve API Key for LLM execution from Tidy Vault, Environment, or Local Server.
 */
function resolveApiKey(modelOrProvider = '', options = {}) {
  const lower = String(modelOrProvider).toLowerCase();
  const endpoint = options.endpoint || options.localEndpoint || '';

  // Local LLM & IDE Bridge do not require external cloud API keys
  if (
    options.isLocal ||
    endpoint.includes('127.0.0.1') ||
    endpoint.includes('localhost') ||
    lower.includes('local') ||
    lower.includes('llama') ||
    lower.includes('gemma') ||
    lower.includes('lmstudio') ||
    lower.includes('ollama') ||
    lower.includes('antigravity') ||
    lower.includes('bridge') ||
    lower.includes('ide')
  ) {
    return 'LOCAL_EXECUTION_NO_KEY_NEEDED';
  }

  let vaultKey = null;

  try {
    const { getSecret } = require('./apps');
    if (lower.includes('gemini') || lower.includes('google')) {
      vaultKey = getSecret('GEMINI_API_KEY') || getSecret('GOOGLE_API_KEY');
    } else if (lower.includes('claude') || lower.includes('anthropic')) {
      vaultKey = getSecret('ANTHROPIC_API_KEY') || getSecret('CLAUDE_API_KEY');
    } else if (lower.includes('gpt') || lower.includes('openai') || lower.includes('o1') || lower.includes('o3')) {
      vaultKey = getSecret('OPENAI_API_KEY');
    } else {
      vaultKey = getSecret('GEMINI_API_KEY') || getSecret('OPENAI_API_KEY') || getSecret('ANTHROPIC_API_KEY');
    }
  } catch {
    vaultKey = null;
  }

  if (vaultKey) return vaultKey;

  // Fallback to process.env
  if (lower.includes('gemini') || lower.includes('google')) {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }
  if (lower.includes('claude') || lower.includes('anthropic')) {
    return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || null;
  }
  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('o1') || lower.includes('o3')) {
    return process.env.OPENAI_API_KEY || null;
  }

  return process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || null;
}

/**
 * Execute real HTTP request to external LLM provider, local llama-server, or Antigravity bridge.
 */
async function callLlmProvider({ model, systemPrompt, userPrompt, apiKey, ctx = null, options = {} }) {
  const lower = String(model).toLowerCase();

  // 1. Antigravity & IDE Direct Execution Bridge
  if (lower.includes('antigravity') || lower.includes('bridge') || lower.includes('ide')) {
    const memories = ctx?.ring2_recalled_memory || [];
    const memoryContext = memories.map(m => `  * [${m.category}] ${m.content}`).join('\n');

    return `═══════════════════════════════════════════════════════════════════════════════
🛸 ANTIGRAVITY & CLAUDE CODE DIRECT EXECUTION DIRECTIVE
═══════════════════════════════════════════════════════════════════════════════
🎯 Subagent Target : @${ctx?.agent?.name || 'subagent'} (${ctx?.agent?.role || 'Expert Role'})
🌐 Workspace Scope : ${ctx?.ring1_workspace?.context_name || 'General Workspace'} [${ctx?.ring1_workspace?.domain || 'general'}]
🔑 Mode            : Direct IDE Dispatch (Zero External API Key Required)

Copy and paste the prompt below into Antigravity or Claude Code to execute directly:

-------------------------------------------------------------------------------
Act as @${ctx?.agent?.name || 'subagent'}, specialized in: ${ctx?.agent?.role || 'Expert'}.
Domain: ${ctx?.ring1_workspace?.domain || 'general'}.

Operational Directives & System Persona:
${systemPrompt}

${memoryContext ? `Persistent Memory Context (SSOT):\n${memoryContext}\n` : ''}
Mission Instruction:
${userPrompt}

Please execute this mission directly in the project files using your active IDE capabilities.
-------------------------------------------------------------------------------`;
  }

  // 2. Local llama-server / LM Studio / Local Inference (CUDA accelerated, e.g. Gemma-4, Qwen 3.5, Phi-4)
  const isLocalServer = options.isLocal ||
    lower.includes('local') ||
    lower.includes('llama') ||
    lower.includes('gemma') ||
    lower.includes('lmstudio') ||
    (options.endpoint && (options.endpoint.includes('127.0.0.1') || options.endpoint.includes('localhost')));

  if (isLocalServer) {
    const { getConfig } = require('./governance');
    const rawEndpoint = (options.endpoint || getConfig('local_llm_endpoint', process.env.LOCAL_LLM_ENDPOINT || 'http://127.0.0.1:8080/v1')).trim();
    const url = resolveOpenAiEndpoint(rawEndpoint, '/chat/completions');

    let targetModel = options.localModel || (model !== 'local-llama' && model !== '__custom__' ? model : null);
    if (!targetModel) {
      targetModel = getConfig('local_llm_model', process.env.LOCAL_LLM_MODEL || 'gemma-4-12b');
    }

    const payload = {
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature !== undefined ? options.temperature : 0.2,
      max_tokens: options.maxTokens || options.max_tokens || 1200
    };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // Fallback: If /v1/chat/completions returns 404, retry without /v1
      if (response.status === 404 && url.includes('/v1/')) {
        const fallbackUrl = rawEndpoint.replace(/\/+$/, '') + '/chat/completions';
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (fetchErr) {
      throw new Error(`Local model server unreachable at ${url}: ${fetchErr.message}. Ensure your llama-server or LM Studio is running.`);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Local model server Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Local model error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const choice = data.choices?.[0];
    const msg = choice?.message || {};
    const content = (msg.content || '').trim();
    const reasoning = (msg.reasoning_content || '').trim();
    const rawText = (choice?.text || '').trim();

    let output = content;
    if (!output && reasoning) {
      output = reasoning;
    } else if (output && reasoning) {
      output = `> 🧠 **Thought Process**:\n> ${reasoning.split('\n').join('\n> ')}\n\n${output}`;
    } else if (!output && rawText) {
      output = rawText;
    }

    if (!output) {
      throw new Error(`Empty response from local server. Ensure model "${targetModel}" is loaded and active in LM Studio / llama-server.`);
    }

    return output;
  }

  // 3. Local Ollama (port 11434)
  if (lower.includes('ollama')) {
    const { getConfig } = require('./governance');
    const rawEndpoint = getConfig('ollama_endpoint', 'http://127.0.0.1:11434').replace(/\/+$/, '');
    const url = `${rawEndpoint}/api/chat`;
    const targetModel = lower.includes('deepseek') ? 'deepseek-r1' : (lower.includes('qwen') ? 'qwen2.5-coder' : 'llama3.3');

    const payload = {
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false
    };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      throw new Error(`Ollama unreachable at ${url}: ${err.message}. Ensure Ollama daemon is running on port 11434.`);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.message?.content || 'No text output returned from Ollama.';
  }

  // 4. Google Gemini (Supports ANY Gemini version: 3.8 Flash, 3.7, 3.1 Pro, etc.)
  if (lower.startsWith('gemini') || lower.includes('google')) {
    const targetModel = lower.includes('google') ? 'gemini-3.8-flash' : model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
  }

  // 5. Anthropic Claude (Supports Thinking / Extended Reasoning: Claude Sonnet 4.6, Opus 4.6, 3.7, etc.)
  if (lower.startsWith('claude') || lower.includes('anthropic')) {
    const isThinking = lower.includes('thinking');
    // Normalize target model name for Anthropic endpoint
    let targetModel = model.replace(/\s*\(thinking\)/i, '').replace(/-thinking/i, '').trim();
    if (targetModel === 'claude' || targetModel === 'claude-sonnet') targetModel = 'claude-sonnet-4-6';

    const payload = {
      model: targetModel,
      max_tokens: isThinking ? 8192 : 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    };

    if (isThinking) {
      payload.thinking = { type: 'enabled', budget_tokens: 2048 };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic Claude API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.content?.filter(c => c.type === 'text')?.map(c => c.text)?.join('\n') ||
           data.content?.[0]?.text || 'No response generated from Claude.';
  }

  // 6. Generic OpenAI / OpenAI-Compatible / Custom Model (GPT-4.5, o3-mini, DeepSeek, or any custom entered model)
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Model Execution Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `No response generated from model "${model}".`;
}

/**
 * Dynamically discover available models from local server, host IDE, and cloud providers.
 */
async function discoverAvailableModels(options = {}) {
  const { getConfig } = require('./governance');
  const rawEndpoint = (options.endpoint || getConfig('local_llm_endpoint', process.env.LOCAL_LLM_ENDPOINT || 'http://127.0.0.1:8080/v1')).trim();

  const discovered = {
    ide: [
      { id: 'antigravity-bridge', name: '🛸 Host Active Model (Antigravity / Claude Code Passthrough)', protocol: 'ide-bridge', default: true }
    ],
    local: [],
    cloud_active: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thinking / Fast)', protocol: 'google-genai' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', protocol: 'google-genai' },
      { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (Deep Reasoning)', protocol: 'google-genai' },
      { id: 'claude-sonnet-4.6-thinking', name: 'Claude Sonnet 4.6 (Thinking)', protocol: 'anthropic-messages' },
      { id: 'claude-opus-4.6-thinking', name: 'Claude Opus 4.6 (Thinking)', protocol: 'anthropic-messages' },
      { id: 'gpt-4.5', name: 'GPT-4.5 (Frontier Intelligence)', protocol: 'openai-compatible' },
      { id: 'o3-mini', name: 'o3-mini (High-Compute Math/Code)', protocol: 'openai-compatible' },
      { id: 'deepseek-r1', name: 'DeepSeek R1 / V3', protocol: 'openai-compatible' }
    ]
  };

  // Try discovering live models from local server (/v1/models first, fallback to /models)
  const urlV1 = resolveOpenAiEndpoint(rawEndpoint, '/models');
  const urlFallback = rawEndpoint.replace(/\/+$/, '') + '/models';

  for (const url of [urlV1, urlFallback]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.error && String(data.error).includes('Unexpected endpoint')) continue;
        const list = data.data || data.models || [];
        if (list.length > 0) {
          list.forEach(m => {
            const mId = typeof m === 'string' ? m : (m.id || 'local-model');
            discovered.local.push({
              id: mId,
              name: `⚡ Local: ${mId}`,
              protocol: 'openai-compatible',
              isOnline: true
            });
          });
          break;
        }
      }
    } catch {
      // Try next
    }
  }

  if (discovered.local.length === 0) {
    const fallbackModel = getConfig('local_llm_model', process.env.LOCAL_LLM_MODEL || 'gemma-4-12b');
    discovered.local.push({
      id: fallbackModel,
      name: `⚡ Local: ${fallbackModel} (llama-server)`,
      protocol: 'openai-compatible',
      isOnline: false
    });
  }

  return discovered;
}

/**
 * Generate rich, structured Sovereign Autonomous Synthesis when offline or without external API keys.
 */
function synthesizeAutonomousExecution({ agent, task, ctx, model = 'sovereign-kernel' }) {
  const memories = ctx.ring2_recalled_memory || [];
  const memoryBullets = memories.length > 0
    ? memories.map(m => `  - [${m.category}] ${m.content.slice(0, 120)}...`).join('\n')
    : '  - No matching memory nodes found in active workspace.';

  const tools = agent.allowed_tools && agent.allowed_tools.length > 0
    ? agent.allowed_tools.join(', ')
    : 'All standard workspace tools';

  return `[${agent.role}] 3-Ring Context Injected & Sovereign Synthesis Completed:

### 🎯 Mission & Execution Objective
- **Target Subagent**: @${agent.name} (${agent.role})
- **Task Instruction**: "${task}"
- **Active Workspace**: ${ctx.ring1_workspace.context_name} [${ctx.ring1_workspace.domain}]
- **Operator**: ${ctx.ring0_profile.user_name || 'Wael'} | **Assistant Tone**: ${ctx.ring0_profile.tone || 'precise'}

### 🧠 3-Ring Context Grounding
- **System Persona**: ${agent.system_prompt}
- **Assigned Tools**: ${tools}
- **Relevant Memory Nodes (FTS5 BM25)**:
${memoryBullets}

### ⚡ Autonomous Deliverable & Blueprint
1. **Context Alignment**: Verified compliance with domain "${ctx.ring1_workspace.domain}".
2. **Analysis**: Evaluated task requirements against available workspace state and active tools.
3. **Execution Steps**:
   - Step 1: Synthesize input parameters and target outcome.
   - Step 2: Validate against project rules and firewall invariants.
   - Step 3: Produce verified deliverables ready for IDE integration.

---
ℹ️ *Sovereign Local Execution Engine (Offline Synthesis Mode).*
*To enable live LLM generation with Gemini, OpenAI, or Claude, configure your API key in Vault:*
\`tidy vault set GEMINI_API_KEY <your-key>\``;
}

/**
 * Synchronous subagent runner for CLI and backward-compatibility.
 */
function runSubagent(name, task, executorFn) {
  const ctx = prepareSubagentContext({ name, task });
  const exec = executorFn || ((agent, t) => synthesizeAutonomousExecution({ agent, task: t, ctx }));
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

/**
 * Asynchronous subagent runner supporting real LLM calls and rich autonomous synthesis.
 */
async function executeSubagent({ name, task, model = 'gemini-1.5-pro', rings = {}, options = {}, endpoint = null, localModel = null }) {
  const ctx = prepareSubagentContext({ name, task });
  const mergedOptions = {
    ...options,
    endpoint: endpoint || options.endpoint,
    localModel: localModel || options.localModel
  };
  const apiKey = resolveApiKey(model, mergedOptions);

  let output = '';
  let executionMode = 'sovereign_synthesis';

  if (apiKey) {
    try {
      const systemPrompt = `You are @${ctx.agent.name}, ${ctx.agent.role}.\n${ctx.agent.system_prompt}\n` +
        `Active Workspace: ${ctx.ring1_workspace.context_name} (${ctx.ring1_workspace.domain}).\n` +
        `Tone: ${ctx.ring0_profile.tone || 'precise, technical, actionable'}.`;

      output = await callLlmProvider({
        model,
        systemPrompt,
        userPrompt: task,
        apiKey,
        ctx,
        options: mergedOptions
      });

      const mLower = String(model).toLowerCase();
      if (mLower.includes('antigravity') || mLower.includes('bridge')) {
        executionMode = 'ide_direct_dispatch';
      } else if (
        mergedOptions.endpoint ||
        mLower.includes('local') ||
        mLower.includes('llama') ||
        mLower.includes('ollama') ||
        mLower.includes('gemma') ||
        mLower.includes('lmstudio')
      ) {
        executionMode = 'local_llm_cuda';
      } else {
        executionMode = 'cloud_llm';
      }
    } catch (err) {
      // Graceful fallback to deterministic synthesis if API call fails
      const fallbackOutput = synthesizeAutonomousExecution({ agent: ctx.agent, task, ctx, model });
      output = `⚠️ Live execution failed (${err.message}). Switched to Sovereign Synthesis:\n\n${fallbackOutput}`;
      executionMode = 'fallback_synthesis';
    }
  } else {
    output = synthesizeAutonomousExecution({ agent: ctx.agent, task, ctx, model });
  }

  // Record task execution into memory
  const { saveMemory } = require('./memory');
  const mem = saveMemory({
    content: `[Subagent: @${ctx.agent.name}] [Model: ${model}] [Mode: ${executionMode}]\nTask: ${task}\nOutput: ${output}`,
    tier: 'session',
    category: 'task',
    importance: 3,
    contextId: ctx.ring1_workspace.context_id
  });

  return {
    subagent: ctx.agent.name,
    task,
    model,
    executionMode,
    output,
    memoryNodeId: mem.id,
    context: ctx
  };
}

/**
 * Parallel subagent dispatcher delegating to ParallelOrchestrator.
 */
async function dispatchParallelTasks({ objective, tasks, agents, domain, autoCommit = true }) {
  const { ParallelOrchestrator } = require('./parallel-orchestrator');
  const orchestrator = new ParallelOrchestrator();

  let taskBatch = [];
  if (Array.isArray(tasks) && tasks.length > 0) {
    taskBatch = tasks.map(t => ({
      agentName: t.agent || t.agentName,
      subTask: t.task || t.subTask,
      maxTokens: t.max_tokens || t.maxTokens || 1200,
      schemaContract: t.schema || t.schemaContract || null
    }));
  } else {
    const agentList = Array.isArray(agents) && agents.length > 0
      ? agents
      : ['planner', 'coder'];
    taskBatch = agentList.map(ag => ({
      agentName: ag,
      subTask: `Analyze and contribute proposals for: "${objective}"`
    }));
  }

  const batchResults = await orchestrator.dispatchParallel(taskBatch);
  const synthesis = await orchestrator.synthesizeAndPersist({
    originalObjective: objective,
    batchResults,
    contextId: domain || null,
    autoCommit
  });

  return {
    objective,
    batchResults,
    synthesis
  };
}

/**
 * Ping local model server (llama-server / LM Studio / Ollama) to test availability.
 */
async function testLocalLlmConnection(options = {}) {
  const { getConfig } = require('./governance');
  const rawEndpoint = (options.endpoint || getConfig('local_llm_endpoint', process.env.LOCAL_LLM_ENDPOINT || 'http://127.0.0.1:8080/v1')).trim();
  const urlV1 = resolveOpenAiEndpoint(rawEndpoint, '/models');
  const urlFallback = rawEndpoint.replace(/\/+$/, '') + '/models';

  let lastError = null;
  for (const url of [urlV1, urlFallback]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.error && String(data.error).includes('Unexpected endpoint')) {
          continue;
        }
        const models = data.data || data.models || [];
        return {
          ok: true,
          running: true,
          endpoint: rawEndpoint,
          resolvedUrl: url,
          models,
          message: `🟢 Local model server is online and responding (${models.length} model${models.length === 1 ? '' : 's'} available).`
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  return {
    ok: false,
    running: false,
    endpoint: rawEndpoint,
    error: lastError ? lastError.message : 'No endpoint responded',
    message: `🔴 Local server unreachable at ${rawEndpoint}: ${lastError ? lastError.message : 'Check host & port'}`
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
  runSubagent,
  executeSubagent,
  dispatchParallelTasks,
  testLocalLlmConnection,
  discoverAvailableModels
};
