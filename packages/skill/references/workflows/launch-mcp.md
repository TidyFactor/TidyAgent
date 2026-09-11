# Workflow: launch-mcp

One outcome: A running Stdio JSON-RPC 2.0 MCP server responding to lifecycle and tool calls.

---

## Steps

1. **Step 0: Context Auto-Sensing**:
   - Check if database is accessible and migrations applied.
   - Verify Node.js runtime version >= 22.0.0.

2. **Configure IDE MCP Settings**:
   - Add to `mcp_config.json` (or Antigravity/Cursor/Claude settings):
     ```json
     {
       "mcpServers": {
         "tidy": {
           "command": "node",
           "args": ["<path-to-tidy>/scripts/mcp_server.js"]
         }
       }
     }
     ```

3. **Verify Stdio Handshake**:
   - Send `initialize` and `tools/list` request.
   - Confirm the core tools plus memory extraction tools are registered: `tidy_recall`, `tidy_memorize`, `tidy_harvest_scan`, `tidy_harvest_read`, `tidy_harvest_import`, `tidy_get_context`, `tidy_switch_context`, `tidy_task_add`, `tidy_task_list`, `tidy_exec_subagent`, and `tidy_db_stats`.

---

## Validation Checklist

- [ ] Node process responds to JSON-RPC 2.0 messages via stdin/stdout
- [ ] Protocol version 2024-11-05 returned on `initialize`
- [ ] Core and memory-harvesting tools declared with inputSchema
- [ ] Resources accessible via `resources/read`
