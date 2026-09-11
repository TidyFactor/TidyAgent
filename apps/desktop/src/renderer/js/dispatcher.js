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
  modelSelect?.addEventListener('change', updateDispatcherActiveBadges);
  agentSelect?.addEventListener('change', updateDispatcherActiveBadges);

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
    const model = modelSelect?.value || 'claude-3-5-sonnet';
    if (!task) return alert('Task instruction is required.');

    const ringProject = document.getElementById('ringProjectContext')?.checked ?? true;
    const ringEphemeral = document.getElementById('ringEphemeralSession')?.checked ?? true;

    if (consoleDot) consoleDot.className = 'console-status-dot running';
    if (consoleStatus) consoleStatus.textContent = `Dispatching @${name} [${model}]...`;

    btnDispatch.disabled = true;
    const origHtml = btnDispatch.innerHTML;
    btnDispatch.innerHTML = `<span>Dispatching...</span>`;

    const startTime = performance.now();
    try {
      const res = await window.api.runSubagent({
        name,
        task,
        model,
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
