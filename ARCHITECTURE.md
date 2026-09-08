# 🏛️ Architecture Specification — Tidy Platform Ecosystem

This document provides the authoritative technical architecture specification for the **Tidy Sovereign Personal Assistant Platform**.

---

## 📐 System Overview

Tidy is structured as a **Local-First, Sovereign Intelligence & Execution Platform**. It couples a high-performance embedded SQLite database with a multi-surface access layer (CLI, Stdio MCP Server, Electron Desktop, and Web Dashboard).

```
                      ┌─────────────────────────────────────────┐
                      │            CONSUMPTION SURFACES         │
                      └─────────────────────────────────────────┘
                       │                     │                 │
              ┌────────▼────────┐   ┌────────▼───────┐   ┌─────▼──────────┐
              │  Terminal CLI   │   │  Stdio MCP Srv │   │ Electron GUI   │
              │  (@clack/wizard)│   │  (IDE Agents)  │   │ (Win/Web App)  │
              └────────┬────────┘   └────────┬───────┘   └─────┬──────────┘
                       │                     │                 │
                       └──────────────┬──────┴─────────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │      @tidy/core        │
                         │  (Node.js Kernel Engine) │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼────────────────────────┐
              ▼                       ▼                        ▼
       ┌──────────────┐       ┌───────────────┐       ┌────────────────┐
       │ Memory FTS5  │       │  Context Rings│       │   Micro-Apps   │
       │ (BM25 Engine)│       │(R0/R1/R2 Model│       │(Tasks/Snippets/│
       │              │       │  & Firewall)  │       │ Journal/Vault) │
       └──────┬───────┘       └───────┬───────┘       └────────┬───────┘
              │                       │                        │
              └───────────────────────┼────────────────────────┘
                                      ▼
                      ┌─────────────────────────────────┐
                      │    Single Source of Truth (SSOT)│
                      │   ~/.tidy/tidy.db (WAL Mode)│
                      └─────────────────────────────────┘
```

---

## 🗄️ 1. Active SQLite SSOT & Database Tuning

All state is preserved in a single database file (`~/.tidy/tidy.db`). The database is auto-bootstrapped upon first use with strict performance PRAGMAs:

### PRAGMA Configuration
```sql
PRAGMA journal_mode = WAL;         -- Non-blocking concurrent reads & atomic writes
PRAGMA synchronous = NORMAL;       -- Safe crash durability without disk sync stalls
PRAGMA foreign_keys = ON;          -- Strict referential integrity
PRAGMA temp_store = MEMORY;        -- Store temporary tables and indices in RAM
PRAGMA cache_size = -64000;        -- 64MB working cache memory
```

### Relational Schema (8 Core Tables)
1. **`system_config`**: Engine metadata, schema version, and migration state.
2. **`user_profile`**: Permanent Ring 0 identity (user name, assistant name, tone, locale).
3. **`contexts`**: Ring 1 workspace boundaries (`dev`, `marketing`, `personal`, `ops`, `general`).
4. **`memory_nodes`**: Core facts, decisions, patterns, preferences, tasks, and rules.
5. **`memory_fts`**: FTS5 virtual table with `unicode61 remove_diacritics 2` for bilingual search.
6. **`subagents`**: Registered roles, prompt templates, and tool access policies.
7. **`installed_apps`**: Registered micro-apps (`tasks`, `snippets`, `journal`, `vault`).
8. **`audit_log`**: Security, debugging, and operation timeline trace.

---

## 🛡️ 2. The 3-Ring Context Architecture

To prevent context bloat and guarantee privacy across unrelated tasks, Tidy organizes context into three isolated concentric rings:

```
    ┌────────────────────────────────────────────────────────┐
    │ RING 2: DYNAMIC WORKING MEMORY (FTS5 BM25 Ranked)      │
    │  - Retrievable facts, decisions, code patterns         │
    │  - Budget: ~1,000 tokens                               │
    │   ┌────────────────────────────────────────────────────┐
    │   │ RING 1: ACTIVE WORKSPACE CONTEXT & FIREWALL        │
    │   │  - Domain boundary: [dev] vs [marketing]           │
    │   │  - Budget: ~250 tokens                             │
    │   │   ┌────────────────────────────────────────────────┐
    │   │   │ RING 0: SOVEREIGN IDENTITY PROFILE             │
    │   │   │  - User identity, assistant persona, tone      │
    │   │   │  - Budget: ~150 tokens                         │
    │   │   └────────────────────────────────────────────────┘
    │   └────────────────────────────────────────────────────┘
    └────────────────────────────────────────────────────────┘
```

### Context Delta Discipline
$$\text{Unknowns} = \text{Required Decisions} - (\text{Discovered Facts} \cup \text{Database Memory})$$
Tidy never prompts the user for facts, tokens, or preferences already stored in SQLite.

### Mathematical Cognitive Memory & Ebbinghaus Decay Engine
Memory nodes in Ring 2 are ranked dynamically via an exponential forgetting curve combined with access frequency reinforcement:

$$\text{decay\_score} = e^{-\lambda \Delta t}$$

- **`core`**: $\lambda = 0$ (Zero decay, permanent truth)
- **`project`**: $\lambda = 0.0005$ (~58 days half-life)
- **`session`**: $\lambda = 0.01$ (~3 days half-life)
- **`ephemeral`**: $\lambda = 0.05$ (~14 hours half-life)

Dynamic Effective Score:
$$\text{Effective Score} = \text{Importance} \times \text{decay\_score} \times \left(1 + 0.35 \times \ln(1 + \text{access\_count})\right) \times \text{Category Boost}$$

Hybrid Cognitive Retrieval Ranking:
$$\text{Final Rank} = (\text{BM25 Weight} \times 0.4) + (\text{Effective Score} \times 0.6)$$

### Contextual Firewall & Domain Isolation
Ring 1 enforces deterministic privacy boundaries. Active contexts (`dev`, `marketing`, `personal`, `ops`) strictly filter memory queries to prevent cross-domain context bleed, while the neutral `general` domain and `--bypass` flag allow holistic auditing.

### Autonomous Task-to-Memory Loop
Completing any task with an outcome or architectural decision automatically synthesizes a new `decision` or `pattern` node in `memory_nodes` and indexes it in `memory_fts`, transforming past task outcomes into instant working memory for subsequent agent invocations.

---

## 🔌 3. Model Context Protocol (MCP) Interface

The `@tidy/mcp` package provides an external stdio JSON-RPC 2.0 gateway for IDE agents:
- **8 Executable Tools**: `tidy_recall`, `tidy_memorize`, `tidy_get_context`, `tidy_switch_context`, `tidy_task_add`, `tidy_task_list`, `tidy_exec_subagent`, `tidy_db_stats`.
- **3 Live Dynamic Resources**:
  - `tidy://profile`: Active Ring 0 user/assistant persona.
  - `tidy://context/current`: Active Ring 1 workspace context and domain.
  - `tidy://tasks/pending`: Real-time pending tasks list.

---

## 💻 4. Desktop Electron Architecture (`apps/desktop`)

The visual management console is built with **Electron + Vanilla CSS/JS** for maximum speed, zero bloat, and instant startup:

```
  ┌───────────────────────────────────────────────────────────┐
  │                 ELECTRON MAIN PROCESS                     │
  │  - Lifecycle & BrowserWindow management                   │
  │  - Direct import of @tidy/core (node:sqlite)            │
  │  - IPC Event Handlers (ipcMain.handle)                    │
  └─────────────────────────────┬─────────────────────────────┘
                                │ Typed IPC Messages
  ┌─────────────────────────────▼─────────────────────────────┐
  │                 SECURE PRELOAD SCRIPT                     │
  │  - contextBridge.exposeInMainWorld('tidyApi', ...)      │
  │  - contextIsolation: true, nodeIntegration: false         │
  └─────────────────────────────┬─────────────────────────────┘
                                │ Window API
  ┌─────────────────────────────▼─────────────────────────────┐
  │                 RENDERER PROCESS (DASHBOARD)              │
  │  - Luxury Dark Glassmorphic UI                            │
  │  - Reactive Vanilla DOM Controller (no heavy frameworks)  │
  │  - Instant FTS5 Search & Task Management Views            │
  └───────────────────────────────────────────────────────────┘
```

---

## 📦 5. Monorepo Package Topology

```
tidy (root)
├── packages/
│   ├── core/      --> Pure Node.js SQLite & Memory Engine
│   ├── cli/       --> @clack/prompts interactive terminal experience
│   ├── mcp/       --> Stdio JSON-RPC 2.0 MCP Server
│   └── skill/     --> TidyFactor Skills-LAB Community Skill
└── apps/
    ├── desktop/   --> Electron GUI for Windows, macOS, Linux
    └── web/       --> Web Management Console
```
