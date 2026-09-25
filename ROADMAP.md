# 🗺️ Strategic Product Roadmap — Tidy Platform Ecosystem

This document outlines the multi-phase vision and release milestones for the **Tidy Sovereign Personal Assistant Platform**.

---

## 🧭 Strategic Vision

Tidy empowers developers, knowledge workers, and AI agents with a **single, local-first, sovereign intelligence layer**. Instead of context evaporating upon closing a chat window, Tidy persists facts, rules, architectural decisions, and personal workflows across all AI tools and operating systems.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TIDY ECOSYSTEM PLATFORM ROADMAP                     │
└────────────────────────────────────────────────────────────────────────┘
  Phase 1: Foundation (Core, CLI, MCP & Skill)                 ✅ Done (v1.1)
  Phase 2: Management GUI (Electron Windows & Web Console)     ✅ Done (v1.3)
  Phase 2.5: Cognitive Memory & Portability Engine             ✅ Done (v1.4.2)
  Phase 3: Cognitive OS Services & Sovereign Brain MCP         ✅ Done (v1.5.0)
    ├── v1.4.3 Core Governance & Settings Engine               ✅ Done (v1.4.3)
    ├── v1.4.4 Universal Skills & Agents Studio                ✅ Done (v1.4.4)
    ├── v1.4.5 Knowledge Harvester & Office Suite Integration  ✅ Done (v1.4.5)
    └── v1.5.0 Tidy Sovereign Brain MCP Engine (Suite 14)      ✅ Done (v1.5.0)
  Phase 4: TidyAgent Sovereign Control Plane & Plugin Engine   ✅ Done (v1.6.0 - v1.7.0)
    ├── v1.6.0 TidyAgent Control Plane & Context Compiler      ✅ Done (v1.6.0)
    ├── v1.6.5 Skill Lifecycle & Dynamic MCP Router            ✅ Done (v1.6.5)
    └── v1.7.0 Parallel Multi-Agent & Conflict Adjudication    ✅ Done (v1.7.0)
  Phase 5: Sovereign Office & Commerce Suite Hardening         ✅ Done (v1.8.0)
  Phase 6: Multi-Device Sync & Cross-Platform                  🚀 Active Focus (v2.0.0)
```

---

## 📍 Phase Breakdown

### Phase 1: Core Foundation & Skill Integration ✅ (Completed — v1.0 / v1.1)
- [x] **Native SQLite Engine**: Migration to `node:sqlite` (`DatabaseSync`) for zero external C++ build dependencies.
- [x] **8-Table Relational Schema**: User profiles, workspaces, memory nodes, subagents, micro-apps, and audit log.
- [x] **Bilingual FTS5 Search**: Real-time BM25 ranking across Arabic and English tokens (`unicode61 remove_diacritics 2`).
- [x] **3-Ring Context Model**: Ring 0 (Profile) + Ring 1 (Domain Firewall) + Ring 2 (Dynamic Working Memory).
- [x] **Dual CLI Engine**: Scriptable subcommands + Interactive `@clack/prompts` wizard.
- [x] **Productivity Micro-Apps**: `tasks`, `snippets`, `journal`, `vault`.
- [x] **Stdio MCP Server**: JSON-RPC 2.0 interface with 8 tools and 3 live dynamic resources.
- [x] **TidyFactor Skill Release**: Official community skill packaged for Skills-LAB suite.
- [x] **Zero-Dependency Test Runner**: `tests/run.js` testing 12 critical paths.
- [x] **Full 8-Language Localization**: Documentation in English, Arabic, Spanish, German, French, Portuguese, Chinese, and Persian.

---

### Phase 2: Visual Management GUI (Electron Windows & Web) ✅ (Completed — v1.3)
- [x] **Ecosystem Monorepo Scaffolding**: Modular separation into `packages/core`, `packages/cli`, `packages/mcp`, `packages/skill`, `apps/desktop`, and `apps/web`.
- [x] **Electron Windows Desktop Application**:
  - Native Windows x64 shell with custom dark-themed frameless title bar.
  - Secure IPC bridge connecting Electron renderer directly to `@tidy/core`.
  - **Visual Memory Explorer**: Live FTS5 search bar, category filtering (fact, decision, pattern, rule), and importance rating sliders.
  - **Task Management Board**: Priority sorting (`urgent`, `high`, `medium`, `low`), domain tags, and completion toggles.
  - **Subagent Delegation Console**: One-click prompt orchestration with `@planner`, `@coder`, `@researcher`, `@scribe` + Community Skills.
  - **Micro-Apps Parity**: Interactive Snippets library, Daily Journal reflections timeline, and Vault secret keys editor with masked credentials and reveal/copy controls.
  - **Active SQLite Maintenance**: 1-click VACUUM INTO snapshot backups, WAL checkpoint truncation, and integrity checks.
  - **Bilingual i18n & Dynamic RTL**: Instant header switch between English (LTR) and Arabic (RTL).
  - **Dual Packaging**: Electron Builder configured for NSIS installer and portable standalone `.exe` with custom icons.
- [x] **Web Dashboard Console (`apps/web`)**:
  - Local HTTP server bound to `127.0.0.1:3840` by default with optional `TIDY_WEB_TOKEN` protection.
  - Full REST API parity for stats, memories, tasks, snippets, journal, vault, and database maintenance.
  - Responsive layout matching desktop aesthetics for browser-first developers.

---

### Phase 2.5: Cognitive Memory Intelligence & Sovereignty Engine ✅ (Completed — v1.4.2)
- [x] **Mathematical Ebbinghaus Memory Decay Engine**: Tier-based exponential decay (`core`, `project`, `session`, `ephemeral`) and logarithmic access count reinforcement.
- [x] **Contextual Domain Firewall Enforcement**: Strict cross-domain isolation (`dev`, `marketing`, `personal`, `ops`) with selective `--bypass` overrides.
- [x] **Autonomous Task-to-Memory Feedback Loop**: Automated synthesis and persistence of task completion outcomes into Memory SSOT.
- [x] **Obsidian PARA-Compliant Markdown Exporter**: 1-click structured Markdown vault export (`Projects/`, `Areas/`, `Resources/`, `Archive/`) with YAML frontmatter.
- [x] **Atomic JSON SSOT Snapshot & Ingestion**: Full database serialization and restoration with checksums.
- [x] **Fast Developer CLI One-Liners**: `tidy q`, `tidy m`, `tidy task`, `tidy tasks`, `tidy done`, `tidy who`, `tidy export`, `tidy import`, `tidy prune`.
- [x] **Automated Test Expansion**: 33 automated tests passing with 100% success rate.

---

### Phase 3: Cognitive OS Services, Governance, AI Hub & Platform Engine 🚀 (Active Milestone — SemVer Progression)

#### 📦 `v1.4.3` — Core Governance & Settings Engine (The Central Nervous System) ✅ (Completed — v1.4.3)
- [x] Centralized application variables and governance rules management via `@tidy/core` Config Provider.
- [x] Granular Profile Management: display name, user role, system preferences, language (AR/EN), theme (Dark/Light/System), currency, date/time formatting.
- [x] Fast CLI one-liners: `tidy govern` / `tidy gov`, `tidy cfg`, `tidy who --update`.
- [x] Full MCP Server, REST API, and Desktop IPC parity for governance and configuration.

#### 📦 `v1.4.4` — Universal Skills & Agents Studio (Multi-Tool Discovery, Monospaced Editor & Full CRUD) ✅ (Completed — v1.4.4)
- [x] **Multi-Tool Directory Scanner**: Seamless discovery across Global (`~/.agents/skills/`), Claude Code (`~/.claude/skills/`, `~/.claude/agents/`), Cursor (`~/.cursor/skills/`, `~/.cursor/rules`, `~/.cursor/agents/`), Windsurf (`~/.codeium/windsurf/memories/`, `~/.windsurf/rules`), Codex (`~/.codex/skills/`, `~/.codex/agents/`), Amp (`~/.config/amp/skills/`), Antigravity (`~/.gemini/config/skills`), plus project-level Copilot & Aider detection.
- [x] **3-Pane Luxury Studio GUI**: Apple-grade 3-column workspace (Sidebar: Library/Tools/Collections, Middle: Searchable Item Grid/List, Right: Monospaced Editor & YAML/Markdown Inspector).
- [x] **Full CRUD & Boilerplate Generator**: Create, read, edit, delete, and duplicate skills/agents with correct tool-specific boilerplates and YAML frontmatter.
- [x] **Built-in Monospaced Editor**: Monospaced code editor with line numbers, Cmd+S / Ctrl+S instant save, frontmatter AST parsing, and live rendered Markdown preview.
- [x] **Collections & Non-Destructive Tagging**: Organize skills and agents into user collections (Marketing, Design, Development) stored in SQLite SSOT without touching source files.
- [x] **Real-Time File Watching**: Instant auto-sync and refresh on disk changes across all watched tool directories.
- [x] **FTS5 BM25 Full-Text Search**: Instant search across skill/agent name, description, tags, and full Markdown body content.
- [x] **Remote Servers & Skills Discovery Hub**: Connect to remote registries (OpenClaw, Hermes, TidyFactor Skills-LAB) to browse, inspect, and install skills in 1 click.

#### 📦 `v1.4.5` — Knowledge Harvester & Agent Brain Extractor Studio ✅ (Completed — v1.4.5)
- [x] **Autonomous Knowledge Scanner (`knowledge-harvester.js`)**: Deep discovery across `~/.gemini/knowledge/**`, Antigravity `brain/**/implementation_plan.md` & `walkthrough.md`, `.cursor/rules`, and `GEMINI.md`.
- [x] **Standalone 2-Pane Master-Detail Studio**: Live search, multi-selection chips, atomic selection, full Markdown streaming inspector, and inline metadata tuning.
- [x] **Atomic Batch Memory Ingestion (`importBatchMemories`)**: Safe SQLite transactional import with FTS5 BM25 index synchronization and audit logging.
- [x] **Cross-Studio Interoperability**: Direct 1-click bridge routing items to Universal Skills & Agents Studio editor.
- [x] **Full MCP, IPC and REST Parity**: Added `tidy_harvest_scan`, `tidy_harvest_read`, `tidy_harvest_import` tools to MCP and endpoints across Desktop IPC and Web REST.

#### 📦 `v1.5.0` — Tidy Sovereign Brain MCP Engine (Suite 14) ✅ (Completed — v1.5.0)
- [x] **System Health Doctor (`tidy_doctor` / `doctor`)**: Diagnostic audit across SQLite SSOT, WAL mode, 4-tier knowledge count, storage footprint, and registered skills.
- [x] **Hybrid 4-Tier Knowledge Search (`tidy_search` / `search_knowledge_base`)**: Dual search querying both SQLite SSOT memory (BM25 FTS5) AND 4-tier disk knowledge (`~/.gemini/knowledge/**`) with taxonomy filtering (`global`, `tech`, `projects`, `session`).
- [x] **Atomic Knowledge Extraction (`tidy_extract` / `extract_knowledge_item`)**: Creates and persists compliant atomic KIs into 4-tier storage with mandatory negative constraints, writing to disk and dual-indexing into SQLite memory.
- [x] **Forensic Transcript Scanner (`tidy_transcripts` / `recall_transcripts`)**: On-demand search through session transcripts (`brain/**/transcript.jsonl`) without active context bloat.
- [x] **Storage Hygiene & Cache Purge (`tidy_hygiene` / `audit_storage_hygiene`)**: Audits disk consumption of recordings, sessions, and temp artifacts with dry-run safety and pruning.
- [x] **Contextual Firewall Checker (`tidy_firewall` / `check_contextual_firewall`)**: Inspects prompts and text for domain contamination between Dev, Marketing, and Ops modes.
- [x] **Skill Manifest Deep Inspector (`tidy_manifest` / `get_skill_manifest`)**: Deep manifest inspection returning parsed commands, workflows, subsystems, and 15-rule audit score.
- [x] **Zero-Breaking Backward-Compatibility Aliases Layer**: Supports both `tidy_*` and legacy `tidyfactor-brain` tool names transparently.
- [x] **Full Desktop IPC & Web REST Parity**: Exposes all brain services to Desktop Management GUI and Web Console.
- [x] **Suite 14 Automated Test Runner**: 56 passed tests with 100% pass rate.

---

### Phase 4: TidyAgent Sovereign Control Plane & Universal Plugin Engine 🚀 (Active Focus — `v1.6.0` – `v1.7.0`)

> **Architectural Doctrine**:
> - **TidyFactor**: The sovereign ecosystem of modular capabilities (Skills, structural invariants, and CDL workflows).
> - **TidyAgent**: The Agent Control Plane, Runtime, and Orchestrator that plans, routes, compiles context, and executes these capabilities across any AI host.
> - **TidyAgent Brain**: The cognitive operating layer that decouples the agent from individual LLM vendors, treating models as swappable reasoning engines.

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

#### 📦 `v1.6.0` — TidyAgent Control Plane, Context Compiler & Structured Memory ✅ (Completed — v1.6.0)
- [x] **Context Compiler Engine (`packages/core/src/context-compiler.js`)**:
  - Compiles 5 distinct context tiers into a precise, zero-slop prompt payload:
    - **Global Context**: User persona, core values, system invariants (~150 tokens).
    - **Project Context**: Active workspace rules, brand guidelines, architectural decisions (~300 tokens).
    - **Task Context**: Current user objective, explicit constraints, target outcomes.
    - **Session Context**: Active dialogue thread, verified checkpoints, execution history.
    - **Working Context**: Ephemeral candidate assets, code diffs, reviewer critique stamps.
  - Eliminates context bloat: Delivers strictly what the model needs for the current atomic step with deterministic token budgeting.
- [x] **Intent Router (`packages/core/src/intent-router.js`)**:
  - Deconstructs raw user requests into structured intent contracts:
    - Target domain (`dev`, `marketing`, `office`, `design`, `ops`).
    - Capability-First matching capping loaded skills to top 2-3 relevant skills.
    - Context parameters and reference requirements.
    - Dynamic MCP tool recommendations based on active intent.
- [x] **Structured 8-Taxonomy Memory Manager (`packages/core/src/memory-taxonomy.js`)**:
  - Elevates memory beyond linear chat logs into 8 dedicated node types:
    - `Facts` (Empirical knowledge and environment specifications).
    - `Decisions` (Architectural and business decisions with rationales).
    - `Preferences` (Principal stylistic, tool, and communication preferences).
    - `Assets` (Brand artifacts, SVGs, color palettes, templates).
    - `References` (External APIs, canonical documentation, benchmark projects).
    - `Previous Outputs` (Validated code, copy, invoices, or diagrams).
    - `Lessons` (Learned negative constraints, debugging solutions).
    - `Relationships` (Graph links between clients, projects, skills, and tools).
- [x] **Universal Host Plugin Foundation & Multi-Host Adapters (`packages/plugin`)**:
  - Scaffolded `@tidy/plugin` v1.6.0 with `plugin.json` manifest and robust adapters for ChatGPT, Claude, Cursor, Codex, and Antigravity.
  - OpenAPI 3.1.0 and ai-plugin.json specification generators (`openapi-generator.js`).
  - Multi-platform configuration exporter (`exportHostConfiguration`) and CLI command (`tidy plugin`).
- [x] **Suite 15 Automated Test Runner**: 62 passed tests with 100% pass rate.

#### 📦 `v1.6.5` — Skill Lifecycle Engine & Dynamic MCP Router ✅ (Completed — v1.6.5)
- [x] **Skill Lifecycle Engine (`packages/core/src/skill-lifecycle.js`)**:
  - Complete lifecycle governance: `discover`, `install`, `enable`, `disable`, `load`, `execute`, `validate`, `update`, `version`.
  - Semantic Capability Matching: Discovers the exact 2-3 relevant skills needed for a prompt instead of polluting the context with 40+ skill manifests.
  - Skills-LAB v2.0 Compliance Verifier with automated test harnesses.
- [x] **Dynamic MCP Router (`packages/core/src/mcp-router.js`)**:
  - Decoupled binding between procedural "How" (Skills) and executable "Tools" (MCP servers).
  - Automatically identifies which MCP tool satisfies a skill step requirement (e.g. `product-image` skill routes to local image tool; `crm` routes to `@tidy/office`).
  - Working context population: Injects tool results directly into ephemeral working context.

#### 📦 `v1.7.0` — Parallel Multi-Agent Orchestrator & Conflict Adjudication Engine ✅ (Completed — v1.7.0)
- [x] **Parallel Subagent Orchestrator (`packages/core/src/parallel-orchestrator.js`)**:
  - Fork & Join concurrent execution via `Promise.allSettled` with circuit-breaker fault isolation.
  - Ephemeral Context Sandboxing (`compileContext` per subagent) capping tokens strictly to 800–1200t.
  - Strict JSON output contract enforcement and zero-slop Chain-of-Thought (CoT) pruning.
  - Atomic synthesis and reconciliation committing single unified decision nodes into SQLite SSOT.
- [x] **Conflict Detection & Adjudication Engine (`packages/core/src/conflict-resolver.js`)**:
  - Multi-tier detection: File mutation collisions (`FILE_MUTATION_COLLISION`), binary verdict discords (`BINARY_VERDICT_DISCORD`), and strategy divergence.
  - Authoritative Domain Priority Hierarchy (`security_auditor` 100 > `performance` 85 > `architect` 80 > `seo` 70 > `copy` 60).
  - Semantic LLM Adjudicator pass with fallback deterministic priority resolution.
  - Auditable concessions tracking (`compromises_made`) persisted in permanent memory.
- [x] **MCP Tool & Host Adapter Integration**:
  - Registered `tidy_parallel_dispatch` tool in `@tidy/mcp` (`modules/parallel-tools.js` & `registry.js`).
  - Added `dispatchParallel` method in `@tidy/plugin` `BaseHostAdapter` across ChatGPT, Claude, Cursor, and Antigravity.
- [x] **MCP Prompts Fleet Expansion & Slash Commands Engine (`@tidy/mcp`)**:
  - Expanded Stdio Prompts protocol to 15 canonical prompts (`/parallel`, `/context`, `/intent`, `/memorize`, `/recall`, `/plan`, `/brief`, `/extract`, `/firewall`, `/doctor`, `/search`, `/hygiene`, `/agent`, `/cashflow`, `/dossier`).
  - IDE slash command palette integration for Google Antigravity, Cursor, and Claude with typed arguments and syntax hints.
  - Eliminated 24 duplicate shadow entries from `tools/list` (purified from 58 to 34 canonical tools) while preserving 100% backward execution compatibility via aliases.
- [x] **MCP Studio Interactive Prompts & Tools Console (`apps/desktop`, `apps/web`)**:
  - Added dedicated `⚡ Prompts` (15 prompts) and `🛠️ Tools` (34 tools) tabs to MCP Studio with 1-click slash command copying (`/cmd`, `/mcp:tidy-brain:cmd`).
  - Interactive Prompt Compiler & Tester Modal (`mcpPromptTestModal`) for live validation, argument input, and payload inspection before execution.
- [x] **Suite 16 Automated Test Verification**: 69 passed tests covering concurrency, isolation, MCP prompts, and conflict resolution.

---

### Phase 5: Sovereign Office & Commerce Suite Hardening (`@tidy/office`) ✅ (Completed — `v1.8.0`)
- [x] Full B2B CRM Pipeline (Clients, Leads, Stages, Contacts, Activity log).
- [x] Automated itemized invoicing with tax calculation, discounts, and payment status.
- [x] Real-time cashflow telemetry & P&L statements (Revenue, Expenses, Net Profit, Margin).
- [x] Commercial Proposals & Quotations Builder (Scope of work, milestone timelines, approvals).
- [x] Product & Service Catalog (Standardized SKUs, multi-currency pricing, unit types).
- [x] Automated PDF Export Engine with customizable branded templates.

---

### Phase 6: Sovereign Multi-Device Sync & Cross-Platform 🔮 (`v2.0.0`)
- [ ] Local-First LibSQL / Litestream replication and CRDT changesets for zero-cloud lock-in sync.
- [ ] Cloud Companion MCP Server with encrypted token authentication for remote AI agents.
- [ ] Native macOS (Universal `.dmg`) and Linux (`.AppImage` / `.deb`) desktop builds.
- [ ] Mobile Companion Apps (iOS & Android) with local voice-to-memory dictation (Whisper).


