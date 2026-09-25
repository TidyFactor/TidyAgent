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

## 📦 5. Monorepo Package Topology & Clean Root Doctrine

The repository is strictly partitioned into distinct packages, applications, and documentation layers with zero root pollution:

```text
tidy-agent (root)
├── packages/
│   ├── core/      --> (@tidy/core) Sovereign SQLite SSOT, FTS5 & Cognitive Memory Engine
│   ├── cli/       --> (@tidy/cli) Interactive @clack/prompts wizard & scriptable CLI
│   ├── mcp/       --> (@tidy/mcp) Stdio JSON-RPC 2.0 MCP Server (16 tools, 4 resources)
│   ├── skill/     --> (@tidy/skill) Certified TidyFactor Community Skill (references/, manifest.json, tools/)
│   └── office/    --> (@tidy/office) Standalone Business Suite (CRM, Invoicing, Proposals, Cashflow)
├── apps/
│   ├── desktop/   --> (@tidy/desktop) Native Electron Studio GUI (Windows, macOS, Linux)
│   └── web/       --> (@tidy/web) Web Management Console (HTTP 127.0.0.1:3840)
├── docs/          --> Unified Documentation Hub (Master index, user manual, specs/, i18n/)
├── bin/           --> Global CLI launcher (tidy binary)
├── scripts/       --> Backward-compatibility proxies to @tidy/core
├── tests/         --> Zero-dependency test runner (33 automated tests, 100% pass)
└── tools/         --> Environment & security hygiene auditor (check-leaks.js)
```

### 🏛️ 6. Clean Root & Boundary Doctrine
- **Single Root Entry**: A single authoritative `README.md` resides at the root, linking to all guides and translations.
- **Skill Encapsulation**: All skill manifests (`SKILL.md`, `manifest.json`, `references/`, `tools/`) are encapsulated strictly within `packages/skill/` to eliminate root duplication.
- **Documentation Isolation**: Translated READMEs are centralized in `docs/i18n/`, while architectural and functional specifications reside in `docs/specs/`.

---

## 🚀 7. Core OS Services Architecture (v1.4.3 – v1.5.0)

To support dynamic micro-apps, plugins, and third-party extensions without code duplication, `@tidy/core` provides four foundational platform services:
1. **Settings & Governance Provider (`system_config`)**: Central key-value store for application variables, active theme (`zeitoun`, `newcairo`, etc.), language (`ar`/`en`), currency, and user profile metadata.
2. **Multi-Database Pool Engine**: Runtime abstraction allowing dynamic creation, backup, and switching between multiple SQLite databases (`Switch Active SSOT`).
3. **AI Services Router (BYOK & Local AI)**: Multi-provider abstraction managing API credentials (OpenAI, Anthropic, Gemini, DeepSeek, Groq) alongside zero-leakage local execution (Ollama, LM Studio).
4. **Plugin & Extension Lifecycle**: Event hooks and schema registration interfaces (`registerSchema`) enabling modular business packs to mount without altering core kernel code.

---

## 🧠 8. TidyAgent Sovereign Control Plane & Orchestration Architecture (`v1.6.0+`)

TidyAgent transcends traditional single-model chatbots or isolated MCP servers. It operates as the **Sovereign Agent Control Plane & Runtime** for the entire TidyFactor ecosystem, decoupling cognitive intelligence from proprietary LLM vendors and treating AI models as interchangeable reasoning engines.

### 🏛️ Core Architectural Distinction

> **TidyFactor = The Sovereign Ecosystem of Modular Capabilities**  
> (Community skills, 15 structural rules, CDL workflows, and design systems)  
> 
> **TidyAgent = The Sovereign Agent Control Plane & Runtime**  
> (The orchestrator that plans, routes, compiles context, discovers skills, executes MCP tools, and validates results)

```text
                                TidyAgent
                          ┌─────────────────┐
                          │ Agent Runtime   │
                          │ Planning        │
                          │ Routing         │
                          │ Context         │
                          │ Memory          │
                          │ Skill Manager   │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                 Skills           MCP          Context
                    │              │              │
            ┌───────┼───────┐      │       ┌──────┼──────┐
            │       │       │      │       │      │      │
          Design Marketing Docs   Tools   Project Memory References
            │       │       │      │       │      │      │
            └───────┴───────┴──────┴───────┴──────┴──────┘
                                   │
                            TidyFactor Core
```

---

### 🧩 The 6 Cognitive Pillars of TidyAgent Brain

```text
User Request
     │
     ▼
[ 1. Intent Router ] ───► Deconstructs intent & required capabilities
     │
     ▼
[ 2. Skill Discovery ] ─► Semantic matching: loads 2-3 relevant skills (not 45)
     │
     ▼
[ 3. Context Manager ] ─► 5-Tier isolation: Global, Project, Task, Session, Working
     │
     ▼
[ 4. Context Compiler] ─► Deterministic compilation into zero-slop token payload
     │
     ▼
[ 5. MCP Router ] ──────► Binds procedural "How" (Skills) with executable "Tools" (MCP)
     │
     ▼
[ Host Execution ] ────► Dispatches to Host (Claude, ChatGPT, Codex, Antigravity)
     │
     ▼
[ 6. Memory Manager ] ──► Synthesizes outcome into 8-taxonomy structured memory
```

#### 1. Intent Router
Instead of dumping the entire conversation history into an LLM, the Intent Router extracts the precise execution contract:
- **Intent Type**: e.g., `product_ad`, `api_refactor`, `invoice_issuance`.
- **Target Skills**: Minimum viable set of required procedural capabilities.
- **Context Constraints**: Brand guidelines, active client ID, or repo invariants.

#### 2. Skill Lifecycle & Semantic Discovery
TidyAgent acts as a **Skill Governor**, managing skills across their complete lifecycle:
$$\text{Lifecycle} = \{\text{discover}, \text{install}, \text{enable}, \text{disable}, \text{load}, \text{execute}, \text{validate}, \text{update}, \text{version}\}$$
- **Capability-First / Token-Efficient**: For a repository of 50 skills, semantic routing loads only the exact 2 or 3 skills needed for the active task.

#### 3. 5-Tier Context Hierarchy
Context is strictly partitioned into five isolated tiers, preventing domain contamination:
1. **Global Context**: User persona, core values, system invariants (~150 tokens).
2. **Project Context**: Active workspace rules, brand guidelines, architectural decisions (~300 tokens).
3. **Task Context**: Current user objective, explicit constraints, target outcomes.
4. **Session Context**: Active dialogue thread, verified checkpoints, execution history.
5. **Working Context**: Ephemeral candidate assets, code diffs, reviewer critique stamps.

#### 4. The Context Compiler Engine
The Context Compiler sits between raw storage and the LLM reasoning engine. Rather than streaming raw memory dumps, it compiles the minimum necessary instructions:
$$\text{Compiled Prompt} = \text{Compiler}(\text{Project Identity}, \text{Active Task}, \text{Skill Workflow}, \text{Tool Schemas}, \text{Relevant Memory})$$
- Enforces strict token budgets and guarantees zero-slop outputs.

#### 5. Structured 8-Taxonomy Memory Manager
Memory is structured into 8 queryable domain types rather than unstructured chat transcripts:
- **`Facts`**: Empirical environment specifications and verified truths.
- **`Decisions`**: Architectural decisions with explicit rationale and trade-offs.
- **`Preferences`**: Principal stylistic, coding, and workflow preferences.
- **`Assets`**: Brand guidelines, SVGs, color tokens, and approved templates.
- **`References`**: External API contracts, benchmark implementations, and docs.
- **`Previous Outputs`**: Approved deliverables (code snippets, copy, invoices).
- **`Lessons`**: Negative constraints learned from past errors and debugging.
- **`Relationships`**: Graph edges connecting entities, projects, skills, and tools.

#### 6. Dynamic MCP Router
Decouples procedural knowledge ("How to do it" in Skills) from executable capabilities ("Tools to do it" in MCP):
```text
             TidyAgent
                 │
          ┌──────┴──────┐
          │             │
        Skill           MCP
          │             │
     "How" (Logic)   "Tools" (Execution)
          │             │
          └──────┬──────┘
                 │
            Atomic Task
```

---

### 🌐 Universal Host Decoupling & Plugin Distribution Doctrine

TidyAgent is strictly **host-agnostic**:
```text
                    TIDYFACTOR
                        │
              ┌─────────┴─────────┐
              │                   │
          TidyAgent          TidyFactor Skills
              │                   │
     ┌────────┼────────┐          │
     │        │        │          │
   Brain    Context   MCP       Registry
     │        │        │          │
     └────────┴────────┴──────────┘
                        │
                  Host Adapters
             ┌──────────┼──────────┐
          ChatGPT     Claude      Codex
```

- **`TidyAgent Core` (`@tidy/core`)**: The permanent sovereign engine housing Brain, Context Compiler, Memory SSOT, and Policy Engine.
- **`TidyAgent Plugin` (`packages/plugin`)**: The lightweight adapter and distribution package (manifests, JSON schemas, and RPC proxies) enabling any AI host (ChatGPT, Claude, Cursor, Antigravity) to mount TidyAgent as its central control plane.


