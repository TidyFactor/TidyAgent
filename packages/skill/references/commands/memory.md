# Command: memory

Runtime entry point for storing facts, decisions, rules, or recalling knowledge via FTS5 BM25 search.

## Dispatch

1. Load `../workflows/manage-memory.md`
2. Load `../memory/context-rings.md`
3. Execute operation via CLI or MCP tool:
   - Save: `node bin/tidy.js memory save "<text>"`
   - Recall: `node bin/tidy.js memory recall "<query>"`
   - List: `node bin/tidy.js memory list`

## Do not load

- Do not load database DDL schemas or raw SQL scripts into working context.
