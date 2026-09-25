# AGENTS.md — Tidy Ecosystem Master Workspace Rules

This file governs the behavior of all AI Coding Agents (*Google Antigravity, Claude Code, Cursor, OpenAI Codex, Windsurf*) working within the **Tidy Platform Ecosystem** repository.

---

## 🏛️ Ecosystem Architecture & Boundary Doctrine

### 1. Multi-Product Monorepo Structure
Tidy is an autonomous, sovereign personal-assistant operating ecosystem built around an active, local-first SQLite database as its permanent Single Source of Truth (SSOT).
The repository is strictly partitioned into distinct packages and applications:

1. **`packages/core` (`@tidy/core`)**: The sovereign engine kernel.
   - Houses `node:sqlite` database bootstrapping, WAL concurrency tuning, FTS5 BM25 search, decay scoring, 3-Ring context assembly, subagents dispatcher, and productivity micro-apps (`tasks`, `snippets`, `journal`, `vault`).
   - Zero UI dependencies. Must remain pure Node.js (>= 22.0.0).
2. **`packages/cli` (`@tidy/cli`)**: Terminal command interface.
   - Houses `@clack/prompts` and `picocolors` interactive terminal wizards, plus scriptable subcommand execution.
3. **`packages/mcp` (`@tidy/mcp`)**: Model Context Protocol integration.
   - Stdio JSON-RPC 2.0 server exposing 8 tools and 3 dynamic live resources (`tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`) to IDE agents.
4. **`packages/office` (`@tidy/office`)**: Sovereign Office & Commerce Suite.
   - Houses B2B CRM pipeline, itemized invoicing, expense and cashflow telemetry, and client dossier synthesizer.
5. **`packages/skill` (`@tidy/skill`)**: TidyFactor Community Skill.
   - The official TidyFactor Skills-LAB skill compliant with the 15 Structural Rules, SemVer SSOT, and bilingual documentation.
6. **`packages/plugin` (`@tidy/plugin`)**: Universal Host Plugin & Adapters.
   - Distribution package and host adapter layer (ChatGPT Plugin, Claude Code adapter, Cursor/Codex bridge) exposing TidyAgent capabilities to external AI hosts.
7. **`apps/desktop`**: Electron Desktop Management GUI.
   - Native Windows x64 management dashboard (cross-platform ready for macOS and Linux).
   - Strict security architecture: `contextIsolation: true`, `nodeIntegration: false`, typed IPC messaging.
8. **`apps/web`**: Web Management Console.
   - Server-backed web GUI dashboard for browser-based access and remote workspace inspection.

---

## 🔒 Concurrency & SQLite SSOT Rules

1. **Single Source of Truth**: All operational state lives exclusively in `~/.tidy/tidy.db` (or custom `$TIDY_DB`).
2. **Zero In-Memory Drift**: Never write memory nodes or tasks to loose markdown, JSON sidecars, or chat histories instead of the database.
3. **High-Performance WAL Mode**:
   - `PRAGMA journal_mode = WAL;`
   - `PRAGMA synchronous = NORMAL;`
   - `PRAGMA foreign_keys = ON;`
   - `PRAGMA cache_size = -64000;` (64MB memory cache).
4. **Multi-Process Concurrency**:
   - Multiple processes (CLI, MCP Server, Electron App) may read concurrently via WAL mode.
   - All mutations must be fast and atomic. Long-running locks are strictly forbidden.

---

## ⚡ Electron Security & IPC Contract

When authoring or modifying code in `apps/desktop/`:
1. **Never Enable `nodeIntegration`**: Renderer processes must NEVER have direct access to Node.js built-ins or filesystem APIs.
2. **Strict `contextIsolation: true`**: All communication between Electron's main process and renderer must travel through `contextBridge.exposeInMainWorld('tidyApi', ...)` in `src/preload/index.js`.
3. **Typed IPC Channels**:
   - All IPC channels must be prefixed with `tidy:` (e.g. `tidy:stats`, `tidy:memory:recall`, `tidy:tasks:add`, `tidy:context:switch`).
4. **Main Process Delegator**: The Main process handles IPC events by calling `@tidy/core` methods directly, formatting errors into `{ ok: false, error: err.message }` payloads.

---

## 📦 SemVer & Backward Compatibility

1. **Root Entry Compatibility**: Running `node bin/tidy.js` or `npm test` from the repository root must continue to function without breaking.
2. **TidyFactor Skill Parity**: `packages/skill/` must maintain 100% compliance with `python tools/validate_skill.py`.
3. **Changelog SSOT**: Every release across the ecosystem must be logged in `CHANGELOG.md` following Keep a Changelog.

---

## 🛡️ Workspace Confidentiality & External Learning Boundaries

1. **Public Repository Boundary**: This repository is a public open-source library.
   - **ZERO Leakage Policy**: Never commit, output, or publish private credentials, internal server configs, local environment paths (e.g. local machine paths, local web server paths), local IPs, or proprietary user data.
2. **External Learning Projects (Read-Only)**:
   - Any external projects, reference models, or sample codebases shared or mounted in the workspace are strictly for **learning and reference patterns**.
   - Agents must **NEVER modify, mutate, or write to external reference projects**.
3. **Primary Mission**:
   - The primary objective is governing, maintaining, and advancing **Tidy as an Agent with persistent memory and skills** (`@tidy/core`, `@tidy/cli`, `@tidy/mcp`, `@tidy/skill`, `packages/office`, `packages/plugin`, `apps/desktop`, `apps/web`), its tools, marketing pages, and documentation.

---

## 🧠 6. TidyAgent Control Plane & Context Invariants

1. **Host-Decoupled Philosophy**:
   - Never couple agent reasoning, memory persistence, or skill execution to a specific proprietary host (ChatGPT, Claude, Codex, Cursor).
   - Hosts are treated strictly as interchangeable execution environments/adapters. Core logic must reside in `@tidy/core`.
2. **Context Compilation Discipline**:
   - Never stream uncompiled raw conversation logs, entire database dumps, or dozens of skill manifests into an LLM context window.
   - All prompts must be passed through the **Context Compiler**, which filters across the 5 Tiers (Global, Project, Task, Session, Working) to assemble the minimal necessary tokens.
3. **Structured 8-Taxonomy Memory Contract**:
   - Memory is never an unstructured chat transcript. All persisted nodes must be categorized into the 8 taxonomies: `Facts`, `Decisions`, `Preferences`, `Assets`, `References`, `Previous Outputs`, `Lessons`, or `Relationships`.
4. **Plugin vs. Core Boundary Doctrine**:
   - `packages/plugin` is strictly an adapter/distribution layer (manifests, schemas, RPC wrappers).
   - All state mutations, SQLite queries, context compilation, and skill orchestration MUST be implemented in `@tidy/core`.

---

## 🤖 7. Local Subagent (`@qwen`) Continuous Collaboration Protocol

1. **Persistent Local Subagent Role**:
   - The registered subagent `@qwen` (Model: `qwen/qwen3.5-9b`, Endpoint: `http://127.0.0.1:1234/v1`) serves as a permanent local co-pilot for technical reviews, code audits, and task decomposition.
   - When handling substantial architecture, review, or refactoring tasks, the primary agent should engage `@qwen` via `executeSubagent` or `tidy_parallel_dispatch`.
2. **Reasoning Model Token Budgeting & Context Scaffolding**:
   - **Token Budget Ceiling**: Enforce an ephemeral budget of 400–1200 tokens (via `options.maxTokens`) to prevent local generation stalls on lengthy reasoning traces.
   - **Explicit Grounding**: Always inject pertinent file excerpts, schemas, or requirements into the prompt payload. Never expect the offline subagent to infer file contents without grounding.
   - **Direct Output Format**: Instruct the subagent to be concise and structured to prevent token exhaustion inside chain-of-thought blocks.



