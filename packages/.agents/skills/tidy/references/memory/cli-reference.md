# Memory: CLI & MCP Reference

<!-- last-verified: 2026-09-08 -->

Comprehensive syntax reference for the Tidy executable engine.

## CLI Commands

| Command | Subcommand | Arguments | Description |
|---|---|---|---|
| `tidy` | `init` | None | Verify or initialize SQLite database |
| `tidy` | `whoami` | None | Display active profile, context, and domain |
| `tidy` | `context` | `list` | List all available contexts |
| `tidy` | `context` | `switch <id>` | Switch active workspace context |
| `tidy` | `memory` | `recall <query>` | BM25 FTS5 search in SQLite |
| `tidy` | `memory` | `save <text>` | Persist a fact/decision to SQLite |
| `tidy` | `memory` | `list` | List recent memory nodes |
| `tidy` | `memory` | `forget <id>` | Delete a memory node by ID |
| `tidy` | `memory` | `prune` | Clean expired ephemeral nodes |
| `tidy` | `agent` | `list` | List registered subagents |
| `tidy` | `agent` | `run <name> <task>` | Dispatch task to subagent |
| `tidy` | `app` | `task add <title>` | Add a new task |
| `tidy` | `app` | `task list` | List all tasks |
| `tidy` | `app` | `task done <id>` | Mark a task as completed |
| `tidy` | `app` | `snippet add <t> <c>`| Add a code snippet |
| `tidy` | `app` | `journal add <t> <e>`| Add a journal entry |
| `tidy` | `app` | `vault set <k> <v>` | Store secure configuration |
| `tidy` | `app` | `vault get <k>` | Retrieve configuration value |
| `tidy` | `db` | `stats` | View database size & table stats |
| `tidy` | `db` | `backup <path>` | Execute atomic `VACUUM INTO` |
| `tidy` | `mcp` | None | Run Stdio JSON-RPC MCP server |

## MCP Tools & Resources

- **Tools**: `tidy_recall`, `tidy_memorize`, `tidy_get_context`, `tidy_switch_context`, `tidy_task_add`, `tidy_task_list`, `tidy_exec_subagent`, `tidy_db_stats`.
- **Resources**: `tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`.
