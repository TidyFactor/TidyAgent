# Command: skills

Runtime entry point for discovering community skills (TidyFactor Skills-LAB), registering them as managed subagents, and generating self-contained task briefs.

## Dispatch

1. Load `../workflows/orchestrate-subagents.md`
2. Load `../memory/subagent-contract.md`
3. Execute via CLI:
   - Scan & Register: `node bin/tidy.js skills scan [dir]`
   - List Registered: `node bin/tidy.js skills list`
   - Register Custom: `node bin/tidy.js skills register <path> [alias]`
   - Generate Brief: `node bin/tidy.js brief <taskId>`
