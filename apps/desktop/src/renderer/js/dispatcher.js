/**
 * Tidy Dedicated Agent Runner & Brief Synthesizer Controller
 * Manages 3-Ring context assembly (Core, Project, Ephemeral) and live execution telemetry.
 */

function initDispatcher() {
  const agentSelect = document.getElementById('dispatchAgentSelect');
  const btnDispatch = document.getElementById('btnDispatchSubagent');
  const btnBrief = document.getElementById('btnGenerateBrief');
  const btnClear = document.getElementById('btnClearPrompt');
  const btnCopyConsole = document.getElementById('btnCopyConsole');
  const btnClearConsole = document.getElementById('btnClearConsole');
  const promptInput = document.getElementById('dispatchTaskPrompt');
  const consoleBody = document.getElementById('subagentResultText');
  const consoleDot = document.getElementById('consoleStatusDot');
  const consoleStatus = document.getElementById('consoleStatusText');

  // Populate subagent select
  populateDispatcherAgents();

  const modelSelect = document.getElementById('dispatchModelSelect');
  const btnTestLocal = document.getElementById('btnTestLocalLlm');
  const localStatusBadge = document.getElementById('localLlmStatusBadge');
  const cfgEndpoint = document.getElementById('cfgLocalLlmEndpoint');
  const cfgModel = document.getElementById('cfgLocalLlmModel');
  const localLlmCard = document.getElementById('localLlmConfigCard');

  // Test Local llama-server / LM Studio ping and enumerate models
  async function testLocalLlm() {
    if (!localStatusBadge) return;
    localStatusBadge.textContent = 'Testing...';
    localStatusBadge.style.background = 'rgba(255,255,255,0.2)';
    localStatusBadge.style.color = 'var(--text-secondary)';

    const endpoint = cfgEndpoint?.value?.trim() || 'http://127.0.0.1:8080/v1';
    try {
      const res = await fetch(`/api/local-llm/status?endpoint=${encodeURIComponent(endpoint)}`).then(r => r.json());
      if (res && res.running) {
        const count = res.models?.length || 0;
        localStatusBadge.textContent = `🟢 Online (${count > 0 ? count + ' Models' : 'CUDA Active'})`;
        localStatusBadge.style.background = '#238636';
        localStatusBadge.style.color = '#ffffff';

        // Auto-populate local models into the dropdown
        if (res.models && res.models.length > 0) {
          const localGroup = modelSelect?.querySelector('optgroup[label*="Local"]');
          if (localGroup) {
            const currentSelected = modelSelect.value;
            localGroup.innerHTML = '';
            res.models.forEach(m => {
              const mId = typeof m === 'string' ? m : (m.id || 'local-model');
              const opt = document.createElement('option');
              opt.value = mId;
              opt.textContent = `⚡ Local: ${mId}`;
              if (mId === cfgModel?.value || mId === currentSelected) {
                opt.selected = true;
              }
              localGroup.appendChild(opt);
            });
            if (cfgModel && !cfgModel.value && res.models[0]) {
              cfgModel.value = typeof res.models[0] === 'string' ? res.models[0] : res.models[0].id;
            }
          }
        }
      } else {
        localStatusBadge.textContent = '🔴 Offline';
        localStatusBadge.style.background = '#da3633';
        localStatusBadge.style.color = '#ffffff';
      }
    } catch {
      localStatusBadge.textContent = '🔴 Offline';
      localStatusBadge.style.background = '#da3633';
      localStatusBadge.style.color = '#ffffff';
    }
  }

  btnTestLocal?.addEventListener('click', testLocalLlm);

  // Auto-save endpoint when changed
  cfgEndpoint?.addEventListener('change', () => {
    const val = cfgEndpoint.value.trim();
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'local_llm_endpoint', value: val })
    }).catch(() => {});
  });

  cfgModel?.addEventListener('change', () => {
    const val = cfgModel.value.trim();
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'local_llm_model', value: val })
    }).catch(() => {});
  });

  const customInputBox = document.getElementById('customModelInputBox');
  const customInput = document.getElementById('customModelIdentifier');

  // Toggle local config card and custom input based on selected model
  function handleModelChange() {
    const val = modelSelect?.value;
    if (customInputBox) {
      customInputBox.style.display = (val === '__custom__') ? 'block' : 'none';
      if (val === '__custom__' && customInput) customInput.focus();
    }
    if (localLlmCard) {
      localLlmCard.style.display = (val === 'local-llama' || val === 'ollama-local') ? 'block' : 'none';
    }
    if (val === 'local-llama') {
      testLocalLlm();
    }
    updateDispatcherActiveBadges();
  }

  modelSelect?.addEventListener('change', handleModelChange);
  agentSelect?.addEventListener('change', updateDispatcherActiveBadges);

  // Dynamic discovery of active local models from server
  fetch('/api/models').then(r => r.json()).then(res => {
    if (res && res.ok && res.data?.local?.length > 0) {
      const active = res.data.local.find(m => m.isOnline);
      if (active) {
        const opt = modelSelect?.querySelector('option[value="local-llama"]');
        if (opt) opt.textContent = active.name;
        if (cfgModel && !cfgModel.value) cfgModel.value = active.id;
      }
    }
  }).catch(() => {});

  // Clear Prompt
  btnClear?.addEventListener('click', () => {
    if (promptInput) {
      promptInput.value = '';
      promptInput.focus();
    }
  });

  // Clear Console
  btnClearConsole?.addEventListener('click', () => {
    if (consoleBody) {
      consoleBody.innerHTML = `
        <div class="console-empty-prompt" id="consoleEmptyPrompt">
          Console cleared. Waiting for task execution...
        </div>
      `;
    }
    if (consoleDot) consoleDot.className = 'console-status-dot';
    if (consoleStatus) consoleStatus.textContent = 'Engine Console [Standby]';
  });

  // Copy Console
  btnCopyConsole?.addEventListener('click', () => {
    if (!consoleBody) return;
    const text = consoleBody.textContent.trim();
    if (!text || text.includes('Select an agent')) {
      alert('Nothing to copy from console yet.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      const origText = btnCopyConsole.textContent;
      btnCopyConsole.textContent = '✓ Copied';
      setTimeout(() => { btnCopyConsole.textContent = origText; }, 1500);
    });
  });

  // Dispatch Subagent
  btnDispatch?.addEventListener('click', async () => {
    const name = agentSelect?.value;
    const task = promptInput?.value.trim();
    let model = modelSelect?.value || 'antigravity-bridge';
    if (model === '__custom__') {
      model = customInput?.value?.trim() || 'custom-model';
    }
    if (!task) return alert('Task instruction is required.');

    const ringProject = document.getElementById('ringProjectContext')?.checked ?? true;
    const ringEphemeral = document.getElementById('ringEphemeralSession')?.checked ?? true;

    if (consoleDot) consoleDot.className = 'console-status-dot running';
    if (consoleStatus) consoleStatus.textContent = `Dispatching @${name} [${model}]...`;

    btnDispatch.disabled = true;
    const origHtml = btnDispatch.innerHTML;
    btnDispatch.innerHTML = `<span>Dispatching...</span>`;

    const endpointVal = cfgEndpoint?.value?.trim() || null;
    const localModelVal = cfgModel?.value?.trim() || null;

    // Auto-save endpoint and model configuration before dispatch
    if (endpointVal) {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'local_llm_endpoint', value: endpointVal })
      }).catch(() => {});
    }
    if (localModelVal) {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'local_llm_model', value: localModelVal })
      }).catch(() => {});
    }

    const startTime = performance.now();
    try {
      const res = await window.api.runSubagent({
        name,
        task,
        model,
        endpoint: endpointVal,
        localModel: localModelVal,
        rings: {
          core: true,
          project: ringProject,
          ephemeral: ringEphemeral
        }
      });

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (consoleBody) {
        if (res && res.ok && res.data) {
          const timestamp = new Date().toLocaleTimeString();
          const modelBadgeHtml = window.getModelBadge ? window.getModelBadge(model) : model;
          consoleBody.innerHTML = `
<span style="color: #58a6ff;">[${timestamp}]</span> <span style="color: #7ee787;">SUCCESS</span> Task dispatched to <strong style="color: #d2a8ff;">@${escapeHtml(name)}</strong> via ${modelBadgeHtml} in ${elapsed}s
─────────────────────────────────────────────────────────────────────────────
${escapeHtml(res.data.output || 'Task finished with zero output.')}
          `.trim();
          if (consoleStatus) consoleStatus.textContent = `Completed in ${elapsed}s`;
          if (consoleDot) consoleDot.className = 'console-status-dot';
        } else {
          consoleBody.innerHTML = `
<span style="color: #ff7b72;">[ERROR]</span> Failed to dispatch subagent:
${escapeHtml(res?.error || 'Unknown execution error')}
          `.trim();
          if (consoleStatus) consoleStatus.textContent = 'Execution Failed';
          if (consoleDot) consoleDot.className = 'console-status-dot';
        }
      }

      if (window.loadStats) window.loadStats();
    } catch (err) {
      if (consoleBody) {
        consoleBody.innerHTML = `<span style="color: #ff7b72;">[EXCEPTION]</span> ${escapeHtml(err.message)}`;
      }
      if (consoleStatus) consoleStatus.textContent = 'Exception';
      if (consoleDot) consoleDot.className = 'console-status-dot';
    } finally {
      btnDispatch.disabled = false;
      btnDispatch.innerHTML = origHtml;
    }
  });

  // Generate Task Brief
  btnBrief?.addEventListener('click', async () => {
    const agent = agentSelect?.value;
    const prompt = promptInput?.value.trim();
    if (!prompt) return alert('Enter a task instruction or mission to generate brief.');

    if (window.showBriefModal) {
      window.showBriefModal({ taskTitle: prompt, agentName: agent });
    }
  });

  // Context Switcher observer: re-populate on workspace change
  window.addEventListener('tidy:context-changed', () => {
    populateDispatcherAgents();
  });
}

function updateDispatcherActiveBadges() {
  const container = document.getElementById('dispatcherActiveBadgesRow');
  const agentSelect = document.getElementById('dispatchAgentSelect');
  const modelSelect = document.getElementById('dispatchModelSelect');
  if (!container) return;

  const agentName = agentSelect?.value || 'antigravity';
  const modelName = modelSelect?.value || 'claude-3-5-sonnet';

  const modelBadge = window.getModelBadge ? window.getModelBadge(modelName) : '';
  let toolKey = 'antigravity';
  if (agentName.includes('claude')) toolKey = 'claude';
  else if (agentName.includes('cursor')) toolKey = 'cursor';
  else if (agentName.includes('windsurf')) toolKey = 'windsurf';
  else if (agentName.includes('codex')) toolKey = 'codex';
  else if (agentName.includes('tidy')) toolKey = 'global';

  const toolBadge = window.getToolBadge ? window.getToolBadge(toolKey) : '';

  container.innerHTML = `
    ${modelBadge}
    ${toolBadge}
  `;
}

async function populateDispatcherAgents() {
  const select = document.getElementById('dispatchAgentSelect');
  if (!select) return;

  try {
    const res = await window.api.listSubagents();
    if (res && res.ok && Array.isArray(res.data) && res.data.length > 0) {
      select.innerHTML = res.data.map(a => `
        <option value="${escapeHtml(a.name)}">${escapeHtml(a.name)} (${escapeHtml(a.type || 'Subagent')})</option>
      `).join('');
    } else {
      select.innerHTML = `
        <option value="antigravity">antigravity (System Master)</option>
        <option value="tidyfactor-skill-architect">tidyfactor-skill-architect (Skills-LAB)</option>
        <option value="tidyfactor-design">tidyfactor-design (Qahera UI Kit)</option>
        <option value="tidy">tidy (Sovereign Personal Assistant)</option>
      `;
    }
  } catch {
    select.innerHTML = `
      <option value="antigravity">antigravity (System Master)</option>
      <option value="tidy">tidy (Sovereign Assistant)</option>
    `;
  }

  updateDispatcherActiveBadges();
}

// Global exports
window.initDispatcher = initDispatcher;
window.populateDispatcherAgents = populateDispatcherAgents;
window.updateDispatcherActiveBadges = updateDispatcherActiveBadges;
