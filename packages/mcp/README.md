# @tidy/mcp

Model Context Protocol (MCP) Stdio JSON-RPC 2.0 Server for **Tidy**.

## Tools
- `tidy_recall`: FTS5 BM25 search across memories.
- `tidy_memorize`: Store facts, decisions, rules, patterns.
- `tidy_harvest_scan`: Read-only scan of agent knowledge sources for candidate memories.
- `tidy_harvest_read`: Read one harvested candidate in full.
- `tidy_harvest_import`: Atomically import explicitly selected candidates into SQLite SSOT.
- `tidy_get_context`: Query current workspace and sovereign profile.
- `tidy_switch_context`: Switch between workspace domains.
- `tidy_task_add` / `tidy_task_list`: Manage pending and completed tasks.
- `tidy_exec_subagent`: Delegate tasks to specialized subagents.
- `tidy_db_stats`: Query database health, row counts, and WAL status.

## Resources
- `tidy://profile`: Live user profile and operating tone.
- `tidy://context/current`: Active project workspace.
- `tidy://tasks/pending`: Real-time pending tasks list.

## Usage in `mcp_config.json`
```json
{
  "mcpServers": {
    "tidy": {
      "command": "node",
      "args": ["<path-to-tidy>/packages/mcp/src/server.js"]
    }
  }
}
```

### Extracting memories

Use the tools in this order:

1. Call `tidy_harvest_scan` to discover candidates. This does not write to SQLite.
2. Optionally call `tidy_harvest_read` for a candidate's `source_path`.
3. Call `tidy_harvest_import` with only the selected candidate objects. Existing candidates are skipped by default.
