<div align="center">

# 🤖 Tidy `v1.1.0`
### Sovereign Personal Assistant Agent with Persistent SQLite Memory & Local Stdio MCP Server

Give **Google Antigravity, Claude Code, Cursor, OpenAI Codex, or Windsurf** a dedicated sovereign assistant layer with zero-config persistent memory, sub-agent delegation, micro-apps, and instant SQLite FTS5 search.

[![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](SKILL.md)
[![RTL Native Arabic](https://img.shields.io/badge/RTL-Native%20Arabic-emerald.svg?style=for-the-badge)](README.ar.md)
[![Architect Score](https://img.shields.io/badge/Architect%20Score-15%2F15%20Pass%20(100%25)-green.svg?style=for-the-badge)](#-architecture-and-governance)
[![AI Agents Compatible](https://img.shields.io/badge/AI%20Agents-Universal%20Compatibility-4285F4.svg?style=for-the-badge)](SKILL.md)

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • [ Deutsch ](README.de.md) • [ Français ](README.fr.md) • [ Português ](README.pt.md) • [ 中文 ](README.zh.md) • [ فارسی ](README.fa.md)

</div>

---

## 🌟 Overview & Value Proposition

**Tidy** is an autonomous personal assistant operating layer built on top of a single local SQLite database as its permanent Single Source of Truth (SSOT).

### Core Features
1. **Zero-Config Auto-Bootstrap**: Automatically creates `~/.tidy/tidy.db` with WAL mode, foreign keys, 8 relational tables, and an FTS5 full-text index on the very first command.
2. **The 3-Ring Context Architecture**:
   - **Ring 0 (Sovereign Profile)**: Permanent user preferences and assistant persona (~150 tokens).
   - **Ring 1 (Domain Firewall)**: Context switching between `dev`, `marketing`, and `personal` modes without context bleed.
   - **Ring 2 (Dynamic Working Memory)**: BM25-ranked FTS5 recall of relevant decisions, rules, and patterns.
3. **Pluggable Sub-Agents**: Built-in specialized roles (`planner`, `coder`, `researcher`, `scribe`) with scoped prompts and tool access.
4. **Integrated Micro-App Library**: Tasks, Snippets, Journal, and Vault backed directly by SQLite.
5. **Local Stdio MCP Server**: Model Context Protocol JSON-RPC 2.0 interface exposing 8 tools and live context resources.

---

## 🛠️ Quick Start & Usage

### 1. Interactive Terminal Wizard (Recommended)
Launch the modern, interactive `@clack/prompts` navigation interface with animated spinners and radio menus:

```bash
node bin/tidy.js
# or explicitly:
node bin/tidy.js ui
```

### 2. Verification & Status Inspection
```bash
node bin/tidy.js init
node bin/tidy.js whoami
```

### 3. Save & Recall Memories
```bash
# Save an architectural decision
node bin/tidy.js memory save "Project uses Next.js 16 and Supabase with strict tenant isolation"

# Instant BM25 search
node bin/tidy.js memory recall "Next.js"
```

### 4. Switch Contexts & Domains
```bash
node bin/tidy.js context list
node bin/tidy.js context switch ctx_dev
```

### 5. Delegate to Subagents
```bash
node bin/tidy.js agent run coder "Review database schema performance"
```

### 6. Micro-Apps (Tasks, Snippets, Journal, Vault)
```bash
node bin/tidy.js app task add "Implement auth middleware"
node bin/tidy.js app task list
node bin/tidy.js app snippet add "sqlite_connect" "const { DatabaseSync } = require('node:sqlite');"
node bin/tidy.js app vault set API_KEY "sk-secret-value"
```

---

## 🔌 Stdio MCP Server Configuration

Add to your IDE MCP configuration (`mcp_config.json`):

```json
{
  "mcpServers": {
    "tidy": {
      "command": "node",
      "args": ["path/to/tidy/scripts/mcp_server.js"]
    }
  }
}
```

### Registered Tools
- `tidy_recall`: FTS5 search across all saved memories.
- `tidy_memorize`: Save new facts or architectural choices.
- `tidy_get_context`: Read active Ring 0 profile and Ring 1 context.
- `tidy_switch_context`: Switch between workspace domains.
- `tidy_task_add` & `tidy_task_list`: Manage tasks.
- `tidy_exec_subagent`: Delegate tasks to specialized agents.
- `tidy_db_stats`: Query database health and statistics.

---

## 🏛️ Architecture & Governance

Tidy adheres strictly to the **15 Structural Rules** of TidyFactor Skills:
- **Dispatcher Discipline**: `SKILL.md` is a clean router (~350 tokens) with explicit anti-triggers.
- **Contextual Decision Layer (CDL v2.0)**: Automatic Context Delta Resolution before prompting.
- **Operational Memory Isolation**: Clean separation between pure technical schemas and human documentation.

---

## 📄 License

Apache-2.0 © 2026 TidyFactor Team.
