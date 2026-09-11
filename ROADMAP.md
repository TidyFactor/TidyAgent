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
  Phase 1: Foundation (Core, CLI, MCP & Skill)                 ✅ Done (v1.1)
  Phase 2: Management GUI (Electron Windows & Web Console)     ✅ Done (v1.3)
  Phase 2.5: Cognitive Memory & Portability Engine             ✅ Done (v1.4.2)
  Phase 3: Cognitive OS Services & Platform Hubs (v1.4.3-v1.5) 🚀 In Progress
    ├── v1.4.3 Core Governance & Settings Engine               ✅ Done (v1.4.3)
    ├── v1.4.4 Universal Skills & Agents Studio                ✅ Done (v1.4.4)
    ├── v1.4.5 Knowledge Harvester & Agent Brain Extractor     ✅ Done (v1.4.5)
    └── v1.5.0 Tidy Sovereign Brain MCP Engine (Brain Replace) 🎯 Next Milestone
  Phase 4: Sovereign Office & Commerce Suite (v1.6.0)          ⏳ Planned
  Phase 5: Multi-Device Sync & Cross-Platform (v2.0.0)         🔮 Vision
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

#### 📦 `v1.5.0` — Tidy Sovereign Brain MCP Engine (Full Replacement for tidyfactor-brain) 🎯 [Next Immediate Release]
- [ ] **System Health Doctor (`tidy_doctor` / `doctor`)**: Diagnostic audit across SQLite SSOT, WAL mode, 4-tier knowledge count, storage footprint, and registered skills.
- [ ] **Hybrid 4-Tier Knowledge Search (`tidy_search_knowledge_base` / `search_knowledge_base`)**: Dual search querying both SQLite SSOT memory (BM25 FTS5) AND 4-tier disk knowledge (`~/.gemini/knowledge/**`) with taxonomy filtering (`global`, `tech`, `projects`, `session`).
- [ ] **Atomic Knowledge Extraction (`tidy_extract_knowledge_item` / `extract_knowledge_item`)**: Creates and persists compliant atomic KIs into 4-tier storage with mandatory negative constraints, writing to disk and dual-indexing into SQLite memory.
- [ ] **Forensic Transcript Scanner (`tidy_recall_transcripts` / `recall_transcripts`)**: On-demand search through session transcripts (`brain/**/transcript.jsonl`) without active context bloat.
- [ ] **Storage Hygiene & Cache Purge (`tidy_storage_hygiene` / `audit_storage_hygiene`)**: Audits disk consumption of recordings, sessions, and temp artifacts in `.gemini/antigravity-ide` with dry-run safety and pruning.
- [ ] **Contextual Firewall Checker (`tidy_check_firewall` / `check_contextual_firewall`)**: Inspects prompts and text for domain contamination between Dev, Marketing, and Ops modes.
- [ ] **Skill Manifest Deep Inspector (`tidy_get_skill_manifest` / `get_skill_manifest`)**: Deep manifest inspection returning parsed commands, workflows, subsystems, and 15-rule audit score.
- [ ] **Conversational Audio Overview Synthesizer (`tidy_audio_overview` / `generate_audio_overview`)**: Generates 2-host conversational podcast script (NotebookLM style).
- [ ] **Zero-Breaking Backward-Compatibility Aliases Layer**: Supports both `tidy_*` and legacy `tidyfactor-brain` tool names transparently.
- [ ] **Full Desktop IPC & Web REST Parity**: Exposes all new brain services to Desktop Management GUI and Web Console.

#### 📦 `v1.4.6` — Cognitive Memory, Advanced Search & Rich Text Editor
- [ ] Full-featured Markdown/Text editor with syntax highlighting, live preview, auto-save, and tag extraction.
- [ ] Enhanced FTS5 BM25 search with hybrid filtering, query operators, and visual memory inspector.

#### 📦 `v1.4.7` — Core Productivity Micro-Apps Hardening
- [ ] **Snippets Vault**: Syntax-highlighted code vault with tags, language filter, 1-click copy, and IDE export.
- [ ] **Journal & Daily Reflections**: Structured timeline reflections linked to memory nodes and daily activity logs.
- [ ] **Vault & Secret Credentials**: Secure masked credential storage with AES-GCM encryption, reveal controls, and zero cloud leaks.

#### 📦 `v1.4.8` — Multi-Workspace, Multi-Database Engine & Sovereign Backup Center
- [ ] Dynamic workspace creation, editing, switching, and domain isolation.
- [ ] Multi-database pool: Create new SQLite databases, switch active SSOT at runtime, and isolate contexts per client/project.
- [ ] 1-click SQLite snapshot backup with checksum verification and auto-recovery.
- [ ] Bi-directional JSON SSOT package import/export and Obsidian PARA Markdown vault sync.

#### 📦 `v1.4.9` — System Audit Logs & Plugin / Module Lifecycle Manager
- [ ] Real-time stream of engine operations, subagent invocations, database mutations, and security events.
- [ ] Standardized plugin architecture allowing core services to register, load, sandbox, and hot-reload third-party or custom modules.

#### 📦 `v1.4.10` — AI Services & Provider Center (BYOK & Local AI)
- [ ] **BYOK (Bring Your Own Key)**: Native management and latency benchmarking for OpenAI, Anthropic, Gemini, DeepSeek, and Groq.
- [ ] **Local AI Provider**: Zero-leakage local LLM execution via Ollama, LM Studio, and Llama.cpp.
- [ ] Model routing, token cost estimation, and fallback failover tiers.

#### 🏁 `v1.5.0` — Tidy Cognitive OS Unified Platform Release
- [ ] Final integration, stress testing, end-to-end regression validation across CLI, MCP, Desktop, and Web.
- [ ] Zero-drift documentation sync across all localized versions.

---

### Phase 4: Sovereign Office & Commerce Suite (`@tidy/office`) ⏳ (Planned — `v1.6.0`)
- [ ] Full B2B CRM Pipeline (Clients, Leads, Stages, Contacts, Activity log).
- [ ] Company Profile & Branding (Issuer credentials, VAT/tax numbers, payment accounts).
- [ ] Product & Service Catalog (Standardized SKUs, multi-currency pricing, unit types).
- [ ] Commercial Proposals & Quotations Builder (Scope of work, milestone timelines, approvals).
- [ ] Itemized Invoicing & Payment Receipts (Multi-currency, tax calculation, PDF export, luxury printable preview).
- [ ] Cashflow & Expense Telemetry (Operating expenses, burn rate, net profit analytics).

---

### Phase 5: Sovereign Multi-Device Sync & Cross-Platform 🔮 (`v2.0.0`)
- [ ] Local-First LibSQL / Litestream replication and CRDT changesets for zero-cloud lock-in sync.
- [ ] Cloud Companion MCP Server with encrypted token authentication for remote AI agents.
- [ ] Native macOS (Universal `.dmg`) and Linux (`.AppImage` / `.deb`) desktop builds.
- [ ] Mobile Companion Apps (iOS & Android) with local voice-to-memory dictation (Whisper).

