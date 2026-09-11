/**
 * Tidy Tasks Board & Brief Synthesizer Controller
 * SQLite-backed triage, status lifecycles, and 3-Ring contextual briefs.
 */

async function loadTasks() {
  const res = await window.api.listTasks();
  if (res && res.ok && res.data) {
    const tasks = res.data;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
    const high = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    const medium = tasks.filter(t => (t.priority === 'medium' || t.priority === 'low') && t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');

    const countUrgent = document.getElementById('countUrgentTasks');
    const countHigh = document.getElementById('countHighTasks');
    const countMedium = document.getElementById('countMediumTasks');
    const countCompleted = document.getElementById('countCompletedTasks');

    if (countUrgent) countUrgent.textContent = urgent.length;
    if (countHigh) countHigh.textContent = high.length;
    if (countMedium) countMedium.textContent = medium.length;
    if (countCompleted) countCompleted.textContent = completed.length;

    renderTaskList('urgentTasksList', urgent);
    renderTaskList('highTasksList', high);
    renderTaskList('mediumTasksList', medium);
    renderTaskList('completedTasksList', completed, true);

    const topPending = tasks.filter(t => t.status !== 'completed').slice(0, 4);
    const overviewContainer = document.getElementById('overviewTopTasks');
    const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

    if (overviewContainer) {
      overviewContainer.innerHTML = topPending.length === 0
        ? `<div style="color: var(--text-muted); padding: 12px 0; text-align: center;">${lang === 'ar' ? 'لا توجد مهام معلقة.' : 'No pending tasks.'}</div>`
        : topPending.map((t) => `
          <div class="overview-item">
            <div class="overview-item-header">
              <span class="badge-tag ${t.priority}">[${t.priority.toUpperCase()}]</span>
              <span style="font-size: 11px; color: var(--text-secondary);">${t.domain || 'general'}</span>
            </div>
            <div class="overview-item-body" style="font-weight: 500;">${escapeHtml(t.title)}</div>
          </div>
        `).join('');
    }
  }
}

function renderTaskList(containerId, tasks, isCompleted = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  if (tasks.length === 0) {
    el.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">${lang === 'ar' ? 'لا توجد مهام في هذه الفئة' : 'No tasks in this lane'}</div>`;
    return;
  }

  el.innerHTML = tasks.map(t => {
    const domainTag = t.domain && t.domain !== 'general' ? `<span class="badge-tag pattern" style="font-size: 10px; margin-inline-end: 4px;">${escapeHtml(t.domain)}</span>` : '';
    const agentTag = t.assigned_agent ? `<span class="badge-tag decision" style="font-size: 10px; margin-inline-end: 4px;">@${escapeHtml(t.assigned_agent)}</span>` : '';
    return `
      <div class="task-card">
        <div class="task-title" style="margin-bottom: 6px;">${escapeHtml(t.title)}</div>
        <div style="margin-bottom: 8px;">${domainTag}${agentTag}</div>
        <div class="task-actions">
          <span style="font-size: 11px; color: var(--text-muted);">${t.id}</span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-sm btn-outline btn-brief-task" data-task-id="${t.id}" title="Generate 3-Ring Task Brief">
              <svg class="qhr-icon qhr-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Brief</span>
            </button>
            ${!isCompleted ? `<button class="btn btn-sm btn-outline btn-complete-task" data-task-id="${t.id}">Done ✓</button>` : `<span style="font-size: 11px; color: var(--accent-green);">${lang === 'ar' ? 'مكتمل' : 'Completed'}</span>`}
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.btn-complete-task').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-task-id');
      await window.api.completeTask(id);
      loadTasks();
      if (window.loadStats) window.loadStats();
    });
  });

  el.querySelectorAll('.btn-brief-task').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-task-id');
      showBriefModal({ taskId: id });
    });
  });
}

async function showBriefModal({ taskId = null, taskTitle = '', agentName = 'coder', domain = 'general' }) {
  const briefText = document.getElementById('briefContentText');
  const titleEl = document.getElementById('briefModalTitle');
  if (!briefText) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
  briefText.textContent = lang === 'ar' ? 'جارٍ توليد ملخص المهمة (3-Ring Context)...' : 'Generating 3-Ring Task Brief...';
  window.openModal('modalTaskBrief');

  const res = await window.api.generateBrief({ taskId, taskTitle, agentName, domain });
  if (res && (res.ok || res.briefMarkdown || res.data)) {
    const b = res.data || res;
    if (titleEl) titleEl.textContent = `Task Brief: ${b.title || taskId || 'Generated'}`;
    briefText.textContent = b.briefMarkdown || JSON.stringify(b, null, 2);
  } else {
    briefText.textContent = 'Error generating task brief: ' + (res?.error || 'Unknown error');
  }
}

function initTasksHandlers() {
  // Save Task Submit Form
  document.getElementById('btnSaveTaskSubmit')?.addEventListener('click', async () => {
    const title = document.getElementById('inputTaskTitle').value.trim();
    const description = document.getElementById('inputTaskDescription').value.trim();
    const priority = document.getElementById('inputTaskPriority').value;
    const domain = document.getElementById('inputTaskDomain')?.value || 'general';
    const assignedAgent = document.getElementById('inputTaskAgent')?.value || null;

    if (!title) return alert('Task title cannot be empty.');

    await window.api.addTask({ title, description, priority, domain, assignedAgent });
    window.closeModal('modalNewTask');
    document.getElementById('inputTaskTitle').value = '';
    document.getElementById('inputTaskDescription').value = '';
    loadTasks();
    if (window.loadStats) window.loadStats();
  });

  // Copy Brief Button
  document.getElementById('btnCopyBrief')?.addEventListener('click', () => {
    const text = document.getElementById('briefContentText')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      alert('Task Brief copied to clipboard!');
    });
  });
}

// Global exports
window.loadTasks = loadTasks;
window.renderTaskList = renderTaskList;
window.showBriefModal = showBriefModal;
window.initTasksHandlers = initTasksHandlers;
