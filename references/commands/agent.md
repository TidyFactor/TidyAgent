# Command: agent

Runtime entry point for orchestrating specialized subagents (planner, coder, researcher, scribe) and delegating scoped tasks.

## Dispatch

1. Load `../workflows/orchestrate-subagents.md`
2. Load `../memory/subagent-contract.md`
3. Execute via CLI:
   - List: `node bin/tidy.js agent list`
   - Run: `node bin/tidy.js agent run <agent_name> "<task>"`
