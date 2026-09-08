# 🗺️ Strategic Product Roadmap — Tidy Platform Ecosystem

This document outlines the multi-phase vision and release milestones for the **Tidy Sovereign Personal Assistant Platform**.

---

## 🧭 Strategic Vision

Tidy empowers developers, knowledge workers, and AI agents with a **single, local-first, sovereign intelligence layer**. Instead of context evaporating upon closing a chat window, Tidy persists facts, rules, architectural decisions, and personal workflows across all AI tools and operating systems.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TIDY ECOSYSTEM PLATFORM ROADMAP                     │
└────────────────────────────────────────────────────────────────────────┘
  Phase 1: Foundation (Core, CLI, MCP & TidyFactor Skill)       ✅ Done (v1.1)
  Phase 2: Management GUI (Electron Windows & Web Console)      🚀 In Progress
  Phase 3: Sovereign Multi-Device Sync (Cloud MCP & LibSQL)      ⏳ Planned
  Phase 4: Cross-Platform Expansion (macOS, Linux, Mobile App)   🔮 Vision
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

### Phase 3: Cognitive OS Services, Governance, AI Hub & Platform Engine 🚀 (Active Milestone — v1.5.0)
- [ ] **1. Core Governance & Settings Engine (The Central Nervous System)**:
  - Centralized application variables and governance rules management via `@tidy/core` Config Provider.
  - Granular Profile Management: display name, user role, system preferences, language (AR/EN), theme (Dark/Light/System), currency, date/time formatting.
  - Real-time reactive updates propagating immediately to CLI, MCP, and UI surfaces.
- [ ] **2. Advanced Memory, Search & Rich Text Editor**:
  - Full-featured Markdown/Text editor with syntax highlighting, live preview, auto-save, and tag extraction.
  - Enhanced FTS5 BM25 search with hybrid filtering, query operators, and visual memory inspector.
- [ ] **3. Professional Task Board v2 (Kanban & List Orchestration)**:
  - Comprehensive Kanban and list views with fluid drag-and-drop state transitions.
  - Deep integration with Subagent delegation (`@planner`, `@coder`, `@researcher`, `@scribe`) and automatic task-to-memory synthesis.
- [ ] **4. Agents & Skills Management Hub (Full CRUD)**:
  - Full lifecycle management (Create, Read, Update, Delete) for Subagents and Skills.
  - Capability definition, system prompt editing, tool bindings, and contextual firewall assignment.
- [ ] **5. Core Productivity Micro-Apps Hardening**:
  - **Snippets Vault**: Syntax-highlighted code vault with tags, language filter, 1-click copy, and IDE export.
  - **Journal & Daily Reflections**: Structured timeline reflections linked to memory nodes and daily activity logs.
  - **Vault & Secret Credentials**: Secure masked credential storage with AES-GCM encryption, reveal controls, and zero cloud leaks.
- [ ] **6. Multi-Workspace & Multi-Database Engine**:
  - Dynamic workspace creation, editing, switching, and domain isolation.
  - Multi-database pool: Create new SQLite databases, switch active SSOT at runtime, and isolate contexts per client/project.
- [ ] **7. Sovereign Backup, Export & Portability Center**:
  - 1-click SQLite snapshot backup with checksum verification and auto-recovery.
  - Bi-directional JSON SSOT package import/export and Obsidian PARA Markdown vault sync.
- [ ] **8. System Audit Logs & Diagnostics Center**:
  - Real-time stream of engine operations, subagent invocations, database mutations, and security events.
- [ ] **9. Plugin & Module Lifecycle Manager**:
  - Standardized plugin architecture allowing core services to register, load, sandbox, and hot-reload third-party or custom modules.
- [ ] **10. AI Services & Provider Center (BYOK & Local AI)**:
  - **BYOK (Bring Your Own Key)**: Native management and latency benchmarking for OpenAI, Anthropic, Gemini, DeepSeek, and Groq.
  - **Local AI Provider**: Zero-leakage local LLM execution via Ollama, LM Studio, and Llama.cpp.
  - Model routing, token cost estimation, and fallback failover tiers.

---

### Phase 4: Sovereign Office & Commerce Suite (`@tidy/office`) ⏳ (Planned — v1.6.0)
- [ ] Full B2B CRM Pipeline (Clients, Leads, Stages, Contacts, Activity log).
- [ ] Company Profile & Branding (Issuer credentials, VAT/tax numbers, payment accounts).
- [ ] Product & Service Catalog (Standardized SKUs, multi-currency pricing, unit types).
- [ ] Commercial Proposals & Quotations Builder (Scope of work, milestone timelines, approvals).
- [ ] Itemized Invoicing & Payment Receipts (Multi-currency, tax calculation, PDF export, luxury printable preview).
- [ ] Cashflow & Expense Telemetry (Operating expenses, burn rate, net profit analytics).

---

### Phase 5: Sovereign Multi-Device Sync & Cross-Platform 🔮 (v2.0)
- [ ] Local-First LibSQL / Litestream replication and CRDT changesets for zero-cloud lock-in sync.
- [ ] Cloud Companion MCP Server with encrypted token authentication for remote AI agents.
- [ ] Native macOS (Universal `.dmg`) and Linux (`.AppImage` / `.deb`) desktop builds.
- [ ] Mobile Companion Apps (iOS & Android) with local voice-to-memory dictation (Whisper).

