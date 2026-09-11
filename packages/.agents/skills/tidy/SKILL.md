---
name: tidy
description: "Sovereign Personal Assistant Agent with persistent SQLite Memory, CLI engine, and local Stdio MCP Server. Trigger on commands 'init', 'whoami', 'context', 'memory', 'agent', 'skills', 'brief', 'app', 'mcp', 'db', or requests to manage personal assistant memory, switch contextual domains, query SQLite FTS5, run subagents, generate task briefs, or start the local MCP server. Anti-triggers: Do NOT use for general prompt writing, UI styling, or cloud database administration."
---

# Tidy — Sovereign Personal Assistant

A command dispatcher. This file does not perform operations directly — it routes user intents to the appropriate command, which loads the precise workflow and operational memory files.

## Commands

| User intent | Command | What it loads |
|---|---|---|
| "Initialize Tidy" / "تهيئة المساعد" / "فحص قاعدة البيانات" | `references/commands/init.md` | `workflows/bootstrap-database.md` + `memory/schema.md` |
| "Search memory" / "Save fact" / "بحث في الذاكرة" / "تذكر هذا القرار" | `references/commands/memory.md` | `workflows/manage-memory.md` + `memory/context-rings.md` |
| "Switch context" / "تبديل السياق" / "تغيير المجال" | `references/commands/context.md` | `workflows/manage-memory.md` + `memory/context-rings.md` |
| "Run subagent" / "Delegate task" / "وكيل فرعي" / "تفويض مهمة" | `references/commands/agent.md` | `workflows/orchestrate-subagents.md` + `memory/subagent-contract.md` |
| "Community skills as agents" / "المهارات كوكلاء" / "موجز المهمة" | `references/commands/skills.md` | `workflows/orchestrate-subagents.md` + `memory/subagent-contract.md` |
| "Tasks, snippets or journal" / "المهام واليوميات" / "الخزنة" | `references/commands/app.md` | `workflows/manage-memory.md` + `memory/cli-reference.md` |
| "Start MCP server" / "خادم MCP المحلي" | `references/commands/mcp.md` | `workflows/launch-mcp.md` + `memory/cli-reference.md` |
| "Database stats & backup" / "صيانة قاعدة البيانات" | `references/commands/db.md` | `workflows/bootstrap-database.md` + `memory/schema.md` |

## Non-negotiable constraints

1. **SQLite SSOT**: `tidy.db` is the sole Single Source of Truth; zero mandatory cloud dependencies.
2. **The 3-Ring Context**: Ring 0 (Immutable Profile) + Ring 1 (Domain Firewall) + Ring 2 (FTS5 BM25 Working Memory).
3. **Zero Robotic Preamble**: No greeting fluff, textbook dumps, or persona roleplay.
4. **Context Delta Resolution**: Never prompt the user for facts already present in SQLite.

## Tooling Scope (Rule 10)

- **Languages**: Node.js (>= 22.0.0, built-in `node:sqlite`), Python (for validator)
- **Mutations**: Local SQLite DB (`~/.tidy/tidy.db`), audit logging, local snapshots
- **Network**: Local Stdio JSON-RPC 2.0 only (Zero external network overhead)
