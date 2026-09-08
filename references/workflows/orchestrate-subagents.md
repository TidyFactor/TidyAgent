# Workflow: orchestrate-subagents

One outcome: A scoped execution payload prepared and dispatched to a specialized Tidy subagent with precise context injection.

---

## Steps

1. **Step 0: Context Auto-Sensing**:
   - Inspect active subagents via `node bin/tidy.js agent list`.
   - Identify candidate agent based on task domain:
     - `planner`: Schedules, priorities, task breakdowns.
     - `coder`: Code architectures, review, debugging.
     - `researcher`: Information synthesis, literature, summaries.
     - `scribe`: Decisions capture, logs, documentation.

2. **Assemble 3-Ring Context**:
   - Ring 0: Sovereign User Profile (name, tone, locale).
   - Ring 1: Active Workspace & Domain.
   - Ring 2: Recalled facts relevant to the immediate task prompt.

3. **Execute Delegation**:
   - Run: `node bin/tidy.js agent run <agent_name> "<task>"`
   - Provide subagent with system prompt and allowed tools list.

---

## Validation Checklist

- [ ] Target subagent exists in `subagents` registry
- [ ] Task injected with Ring 0 profile and Ring 1 domain
- [ ] Ring 2 recalled memories matched to task keywords
- [ ] Action logged in `audit_log`
