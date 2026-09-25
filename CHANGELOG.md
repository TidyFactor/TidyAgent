# CHANGELOG — tidy

All notable changes to the `tidy` skill and CLI engine are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **TidyAgent Sovereign Control Plane & Universal Plugin Architecture (`ARCHITECTURE.md`, `ROADMAP.md`, `AGENTS.md`)**:
  - Formalized architectural doctrine: **TidyFactor** (ecosystem of modular capabilities) vs. **TidyAgent** (sovereign Control Plane and orchestrator runtime).
  - Defined the 6 Cognitive Pillars of TidyAgent Brain: Intent Router, Skill Lifecycle & Semantic Discovery, 5-Tier Context Manager, Context Compiler, Structured 8-Taxonomy Memory Manager, and Dynamic MCP Router.
  - Specified the **Context Compiler Engine** assembling zero-slop token payloads across 5 tiers (Global, Project, Task, Session, Working).
  - Established host-decoupled architecture treating ChatGPT, Claude, Cursor, Codex, and Antigravity as swappable execution adapters.
  - Defined the `@tidy/plugin` (`packages/plugin`) distribution adapter doctrine separating distribution packages from sovereign core intelligence.
  - Updated strategic product roadmap with Phase 4 (`v1.6.0` – `v1.7.0`) as the immediate active milestone.
- **Tidy Studio Desktop Visual Showcase & Screenshots Suite (`@tidy/desktop`, `docs/`)**:
  - Captured and integrated 11 real high-resolution screenshots for all 14 desktop views (`overview.png`, `skills-studio.png`, `memory-explorer.png`, `harvester.png`, `dispatcher.png`, `mcp-studio.png`, `tasks-board.png`, `crm-pipeline.png`, `invoices-billing.png`, `cashflow.png`, `hud-floating.png`).
  - Created standalone comprehensive Arabic architecture and operations guide for Tidy Studio (`docs/apps/desktop-app.ar.md`).
  - Added dedicated visual desktop showcase sections with screenshot tables in root `README.md`, `docs/i18n/README.ar.md`, `apps/desktop/README.md`, and `docs/user_manual.ar.md`.
  - Linked Tidy Studio guide in VitePress documentation portal sidebar (`docs/.vitepress/config.mjs`) and Documentation Hub (`docs/README.md`).

### Changed
- **GitHub Repository Governance & Health Optimization (`tidyfactor-github`)**:
  - Migrated repository canonical URLs across package manifests, CLI headers, and documentation to `https://github.com/TidyFactor/TidyAgent`.
  - Added `@tidy/office` package ownership to `.github/CODEOWNERS`, `.github/github-brief.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and issue template choices.
  - Created root developer experience proxy `tools/validate_skill.py` delegating to `packages/skill/tools/validate_skill.py`.
  - Enabled active branch governance ruleset (`.github/rulesets/main-ruleset.json`) with enforced linear history, status check verification, and deletion/force-push prevention.
  - Converted repository scope to Public OSS with curated discoverability topics and metadata description.

## [1.5.0] - 2026-09-11

### Added
- **Tidy Sovereign Brain MCP Engine (`@tidy/mcp`, `@tidy/core`)**:
  - Full sovereign replacement for legacy external brain MCP with zero legacy dependency and pure SQLite SSOT architecture.
  - **Sovereign Brain Tools Fleet**:
    - `tidy_doctor`: Comprehensive health audit of SQLite SSOT (`tidy.db`), WAL mode, integrity check, 4-tier knowledge base count (`~/.gemini/knowledge/`), and storage footprint.
    - `tidy_search`: Hybrid search unifying SQLite FTS5 BM25 decay recall with 4-tier disk markdown knowledge files (`global`, `tech`, `projects`, `session`).
    - `tidy_extract`: Atomic Knowledge Item (KI) creator enforcing mandatory negative constraints, YAML frontmatter on disk, and instant dual-write SQLite SSOT index.
    - `tidy_transcripts`: Forensic scanner searching past agent conversation transcripts (`transcript.jsonl`) on-demand without context window bloat.
    - `tidy_hygiene`: Safe storage audit with `--dry-run` default for session recordings (`.webp`), scratch dirs, and ephemeral memory decay purge.
    - `tidy_firewall`: Contextual domain firewall enforcing zero context bleed between `[Dev Mode]` and `[Marketing Mode]`.
    - `tidy_manifest`: Deep skill manifest inspector with 15-rules compliance scoring and command table parsing.
    - `tidy_whoami`: Sovereign identity inspector reporting persona, assistant role, active context, firewall mode, and SQLite DB path.
  - **Model Context Protocol (MCP) Prompts Protocol**:
    - Native `prompts/list` and `prompts/get` implementation.
    - Prompts: `tidy_prompt_task_brief` (context-rich Task Brief synthesis), `tidy_prompt_extract_ki` (atomic KI formulation guide), `tidy_prompt_firewall_audit` (contextual firewall audit guide).
  - **Dynamic Live MCP Resources**:
    - `tidy://brain/doctor`: Live system diagnostic health report.
    - `tidy://brain/taxonomy`: 4-tier knowledge base taxonomy and index.
    - `tidy://brain/hygiene`: Disk storage breakdown and cleanup candidates.
  - **Developer CLI One-Liners (`bin/tidy.js`)**:
    - `tidy run <agent> <task>` / `tidy agent` / `tidy exec`: Autonomous subagent & skill execution with 3-Ring Cognitive Context injection and automatic memory outcome archiving.
    - `tidy doc` / `tidy doctor`: Fast terminal health diagnostics.
    - `tidy find <query>` / `tidy search <query>`: Fast hybrid recall across DB & disk.
    - `tidy clean` / `tidy hygiene`: Fast storage hygiene inspection and pruning.
    - `tidy firewall <text>`: Instant context bleed verification.
  - **Remote Web MCP Endpoint (`apps/web/server.js`)**:
    - High-performance `/mcp` JSON-RPC 2.0 HTTP endpoint enabling remote IDE agents to communicate seamlessly.
    - Full protocol support for `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get`.
  - **Legacy Tool Aliases & Compatibility Layer (`packages/mcp/src/registry.js`)**:
    - Built-in `LEGACY_ALIASES` mapping (`doctor`, `probe_server_health`, `recall_memory`, `search_knowledge_base`, `extract_knowledge_item`, `contextual_firewall`, `get_skill_manifest`, `whoami`, etc.) for zero-breakage backward compatibility.
    - Argument normalizer (`normalizeArgs`) bridging schema variance (e.g. `top_k` -> `limit`, `skill_id` -> `id`).
    - Added `agent` and `run` MCP prompt templates for instant agent dispatch.
  - **Desktop & Web Parity**:
    - REST endpoints in `apps/web/server.js`: `/api/brain/doctor`, `/api/brain/search`, `/api/brain/extract`, `/api/brain/transcripts`, `/api/brain/hygiene`, `/api/brain/firewall`, `/api/brain/manifest/:id`.
    - Electron IPC in `apps/desktop`: `tidy:brain:*` handlers and typed `window.tidyApi.brain` bridge.
  - **Automated Test Suite (Suite 14)**:
    - Expanded test suite in `tests/run.js` achieving **56 passed, 0 failed** (100% pass rate).

## [1.4.5] - 2026-09-11

### Added
- **Knowledge Harvester & Agent Brain Extractor Studio (`@tidy/core`, `apps/desktop`, `apps/web`)**:
  - **Autonomous Knowledge Scanner (`packages/core/src/knowledge-harvester.js`)**: Scans agent knowledge bases and brains across `~/.gemini/knowledge/**`, `~/.gemini/antigravity-ide/brain/**/implementation_plan.md` & `walkthrough.md`, `.cursor/rules`, `~/.gemini/config/rules`, and `GEMINI.md`. Detects duplication and flags existing items with SQLite content fingerprints.
  - **On-Demand Full Document Streaming (`readHarvestItem`)**: High-performance lazy-loading of full markdown documents with YAML frontmatter parsing, line counts, and metadata inspection without slowing down initial directory scans.
  - **Standalone 2-Pane Master-Detail Studio (`data-tab="harvester"`)**:
    - Master list pane with live search, status chips (`all`, `new`, `imported`, `knowledge`, `brain`, `rules`), multi-select checkboxes, and atomic batch selection.
    - Detail inspector pane with real-time Markdown document rendering, inline metadata tuning (category, tier, importance), and copyable file paths.
  - **Cross-Studio Interoperability**: "Open in Studio" integration (`window.openItemInStudio`) that seamlessly routes discovered skills, agents, and rules directly into the Universal Skills & Agents Studio editor.
  - **Atomic Batch Memory Ingestion (`importBatchMemories`)**: Safe SQLite transactional import with FTS5 BM25 index synchronization and audit logging.
  - **Full IPC and Web REST Parity**: Added `tidy:memory:harvest-scan`, `tidy:memory:harvest-read`, `tidy:memory:harvest-import` to Electron IPC and `/api/memories/harvest/*` to Web Management Console.
  - **Bilingual Pure Dictionaries**: Clean, separate Arabic and English translations in `ar.json` and `en.json` without mixed parenthetical terms.
  - **Comprehensive Automated Tests**: Suite [12] expanded in `tests/run.js` verifying 46/46 passed tests (100% pass rate).

## [1.4.4] - 2026-09-11

### Added
- **Universal Skills & Agents Studio (`@tidy/core`, `apps/desktop`, `apps/web`)**:
  - **Multi-Tool Discovery Engine (`multi-tool-scanner.js`)**: Discovers skills and agents across Claude Code (`~/.claude/skills`), Cursor (`.cursor/rules`), Codex (`~/.codex/skills`), Windsurf (`.windsurf/rules`), Copilot (`.github/copilot-instructions.md`), Aider, Amp, Antigravity/Gemini (`.gemini/antigravity-ide/builtin/skills`, `~/.gemini/config/skills`), and custom workspace locations.
  - **Built-in Monospaced Editor**: Full-featured code editor with `Cmd+S` / `Ctrl+S` instant saving, dirty state indicators, line-counter metadata, and automatic YAML frontmatter synchronization.
  - **Non-Destructive SQLite SSOT Collections (`skill_collections`, `skill_collection_items`)**: Organize skills into custom workflows (e.g. Marketing, Design, Development) and star favorites without modifying or relocating source files on disk.
  - **Skills-LAB 15-Rule Compliance Auditor (`skills-validator.js`)**: Real-time linting of YAML budget (<= 1024 chars), description quality, memory freshness timestamps, and relative reference integrity.
  - **Universal Starter Generator (`boilerplate-generator.js`)**: Instant scaffolding for Claude Code, Cursor, Codex, Windsurf, and Skills-LAB compliant skills and subagents.
  - **Luxury 3-Pane Management UI**: Apple x Cartier aesthetic with sidebar tool/collection filtering, searchable FTS5 BM25 item list with status badges, split-view inspector/editor, and modal wizards for creation, validation, and tagging.
- **REST & IPC Parity**:
  - Stdio MCP, Web REST (`/api/studio/*`), and Electron typed IPC (`tidy:studio:*`) parity across all features.
- **Comprehensive Automated Tests**:
  - Added Suite [13] in `tests/run.js` with 100% pass rate (43/43 tests passing).

## [1.4.3] - 2026-09-08

### Added
- **Core Governance & Central Settings Engine (`@tidy/core/governance`)**:
  - Central configuration provider: `getConfig`, `setConfig`, `listConfig`, `deleteConfig` backed by SQLite `system_config`.
  - Granular Profile Management: `getUserProfile`, `updateUserProfile` supporting user display name, title/role, assistant persona, locale (ar/en), tone, theme (`dark`, `light`, `system`), currency (`USD`, `SAR`, `EGP`), time format (`12h`, `24h`), and custom JSON preferences.
  - Contextual Governance & Firewall Rules: `getGovernanceRules`, `setGovernanceRule` for runtime firewall policies, auto-extract switch, memory decay, and retention thresholds.
  - Idempotent SQLite migrations in `db.js` adding `theme`, `currency`, `time_format`, and `role` to `user_profile`.
- **Fast Developer One-Liners (`bin/tidy.js`)**:
  - `tidy govern` / `tidy gov`: Fast inspection of governance and context firewall rules, and policy updating via `tidy govern set <key> <value>`.
  - `tidy cfg`: Fast configuration provider management (`tidy cfg`, `tidy cfg get <key>`, `tidy cfg set <key> <value>`, `tidy cfg del <key>`).
  - `tidy who` / `tidy profile`: Granular identity inspector and updater (`--user`, `--assistant`, `--role`, `--theme`, `--currency`, `--locale`).
- **Stdio MCP Server v1.4.3 Protocol Integration (`packages/mcp`)**:
  - New MCP tools: `tidy_config_get`, `tidy_config_set`, `tidy_profile_update`, `tidy_govern_rules`.
  - New live MCP dynamic resources: `tidy://config` and `tidy://govern`.
- **Web Console REST & Desktop IPC Parity**:
  - REST endpoints: `/api/config`, `/api/profile`, `/api/govern` in `apps/web/server.js`.
  - Typed IPC channels: `tidy:config:*`, `tidy:profile:*`, `tidy:govern:*` with contextBridge bindings in `apps/desktop`.
- **Automated Verification Suite (Suite 12)**:
  - Added Suite [12] in `tests/run.js` expanding automated tests to 37 passed tests with 100% success rate.

## [1.4.2] - 2026-09-08

### Added
- **Mathematical Memory Decay & Ebbinghaus Ranking (`@tidy/core`)**:
  - Implemented dynamic decay scoring with tier half-lives (`core`: permanent, `project`: ~58d, `session`: ~3d, `ephemeral`: ~14h).
  - Added access frequency reinforcement ($1 + 0.35 \times \ln(1 + \text{access\_count})$) and category boosts.
  - Blended BM25 FTS5 rank with cognitive score for human-like recall.
  - Added `pruneDecayedMemories` for safe cognitive purge of decayed ephemeral records.
- **Contextual Domain Firewall**:
  - Enforced strict domain isolation in `recallMemory` (`dev`, `marketing`, `personal`, `ops`) with an explicit `--bypass` audit flag.
- **Autonomous Task-to-Memory Feedback Loop**:
  - Enhanced `completeTask` to automatically archive learned decisions and outcomes into `memory_nodes` and `memory_fts`.
- **Data Sovereignty & Portability Engine (`packages/core/src/portability.js`)**:
  - Added `exportToMarkdown` generating Obsidian PARA-compliant vaults (`Projects/`, `Areas/`, `Resources/`, `Archive/`) with YAML frontmatter.
  - Added `exportToJson` and `importFromJson` for atomic SSOT snapshots and restoration.
  - Added `importFromMarkdown` to ingest and index external markdown notes into SQLite FTS5.
- **Fast Developer CLI One-Liners (`bin/tidy.js`)**:
  - Added high-speed terminal subcommands: `tidy q`, `tidy m`, `tidy task`, `tidy tasks`, `tidy done`, `tidy who`, `tidy export`, `tidy import`, `tidy prune`.
- **Test Suite Expansion**:
  - Expanded test coverage from 24 to 33 automated tests in `tests/run.js` (100% pass rate).

## [1.4.1] - 2026-09-08

### Added
- **Cairo Design Atlas Theme Gallery (12 Canonical Themes)**:
  - Created interactive Theme Gallery in the Settings & Appearance tab supporting all 12 cultural neighborhood archetypes from Qahera UI Kit (`zeitoun`, `zamalek`, `downtown`, `heliopolis`, `gardencity`, `maadi`, `roxy`, `hussein`, `sakakini`, `shubra`, `marg`, `newcairo`).
  - Added real-time palette swatches (Primary, Accent, Surface), active indicator badges, and zero-reload CSS variable cascading.
  - Implemented persistent theme storage via `localStorage` with a 1-click restore default action (`btnResetThemeSettings`).
- **Dedicated Settings & System Health Tab (`pane-settings`)**:
  - Scaffolded and styled the complete Settings view integrating appearance preferences with live SQLite SSOT diagnostics (WAL Checkpoint, Integrity Check, DB Backup).

### Fixed & Refactored
- **Authoritative Qahera UI Kit Theme Specification**:
  - Implemented the official canonical specification for **الزيتون (zeitoun)** Day Mode (`[data-theme="zeitoun"][data-mode="light"]`) with strict token mapping and subtle elevation.
  - Resolved CSS comment syntax error (`//*`) that broke `.btn` rule inheritance; restored clean, modern button typography, padding, and subtle shadows.
  - Fixed native browser styling anomalies on form selectors; engineered custom `.workspace-select` and `.form-select` with dual-direction SVG chevrons and standardized 38px toolbar height.
  - Refactored `.stat-card` telemetry metrics into clean Cairo Studio v1.1 cards with top header labels, pill badges, and bold 28px values.

---

## [1.4.0] - 2026-09-08

### Added
- **Pluggable Microkernel Architecture (`@tidy/core`)**: Implemented zero domain pollution in the core sovereign assistant engine. Added `registerSchema(packName, ddlSql)` dynamic schema registration extension point in `db.js`.
- **Standalone Office Suite Domain Pack (`@tidy/office`)**: Built an independent, pure Node 22 + `node:sqlite` WAL business operations pack inheriting and superseding PocketOffice:
  - **CRM & Client Pipeline (`app_crm_clients`)**: Multi-stage deal tracking, budget management, and metadata.
  - **Product & Retainer Catalog (`app_products`)**: Service tiers, hourly rates, and recurring billing cycles.
  - **Itemized Invoicing Engine (`app_invoices`)**: Automated line-item subtotal, customizable tax rates, discount handling, and settlement lifecycle.
  - **Proposals & 1-Click Conversion (`app_proposals`)**: Commercial B2B proposals with instant conversion to pending invoices.
  - **Operational Expenses & Cashflow Telemetry (`app_expenses`)**: Category-wise expense tracking, net profit calculation, and profit margins.
  - **Deadline & Calendar Scheduler (`app_calendar_events`)**: Milestone tracking and urgent deadline retrieval.
  - **Evidence-Based AI Client Dossier Synthesizer (`evidence-compiler.js`)**: Real-time executive dossiers fusing CRM profiles, invoices, proposals, tasks, and institutional memory via Ring 2 FTS5 BM25.
  - **1-Click PocketOffice Migration Importer (`importer.js`)**: Legacy JSON-to-SQLite SSOT migration utility.
- **Dynamic CLI Command Suite (`bin/tidy.js` & `packages/cli`)**:
  - Added scriptable commands: `tidy crm`, `tidy invoice`, `tidy expense`, `tidy cashflow`, `tidy dossier`, `tidy import-pocketoffice`.
  - Integrated Office Suite options into interactive `@clack/prompts` wizard (`packages/cli/src/wizard.js`).
- **Dynamic MCP Stdio Server Integration (`packages/mcp`)**:
  - Automatically registers 6 high-level MCP tools (`tidy_crm_list`, `tidy_crm_add`, `tidy_invoice_list`, `tidy_invoice_create`, `tidy_cashflow_summary`, `tidy_client_dossier`) when `@tidy/office` is present.
  - Automatically exposes live dynamic resource `tidy://office/cashflow`.
- **Desktop Studio GUI & IPC Integration (`apps/desktop`)**:
  - Added typed IPC messaging channels (`tidy:office:*`) adhering to strict `contextIsolation: true` security.
  - Added new sidebar navigation and visual tabs for CRM Pipeline, Invoicing & Billing, and Cashflow Telemetry with modals for adding clients, issuing invoices, recording expenses, and viewing synthesized AI dossiers.
- **Comprehensive Automated Test Coverage (38 Tests Passing)**:
  - 14/14 unit & integration tests passing in `packages/office/tests/run.js`.
  - 24/24 unit & integration tests passing in root `tests/run.js`.
  - Verified zero sensitive environment path leaks via `tools/check-leaks.js`.

---

## [1.3.0] - 2026-09-08

### Added
- **Micro-Apps Full CRUD Parity**: Added `deleteSnippet(id)` and `deleteSecret(key)` across `@tidy/core`, Desktop IPC, Web REST APIs, and UI with safe deletion confirmation modals.
- **Web Console REST API Expansion**: Enriched `apps/web/server.js` with full REST routes for Snippets, Journal, Vault, Database maintenance, Contexts, and Memory deletion, binding strictly to `127.0.0.1` by default with optional `TIDY_WEB_TOKEN` guard.
- **Adaptive Live Telemetry & Heartbeat**: Implemented a 4-second adaptive polling engine that pauses when hidden, coupled with instant sync on window focus and optimistic post-mutation updates.
- **Bilingual (EN / AR) & Dynamic RTL Engine**: Integrated header language toggle switching between English (LTR) and Arabic (RTL) with localized typography, navigation tabs, and modal labels.
- **Vault Security & Credential Masking**: Masked secret credentials (`••••••••`) with on-demand eye reveal toggle, 1-click clipboard copy, and safe deletion confirmation.
- **Active SQLite Maintenance Panel**: Added 1-click Snapshot Backup (`VACUUM INTO`), WAL journal checkpoint (`PRAGMA wal_checkpoint(TRUNCATE)`), and integrity checks (`PRAGMA integrity_check`) in Settings & Health.
- **Windows Packaging & Branding Assets**: Generated high-resolution `assets/icon.png` and `assets/icon.ico` with zero dependencies, configuring electron-builder with dual targets (NSIS setup wizard + Portable standalone `.exe`).
- **Expanded Test Suite (20 Tests)**: Extended `tests/run.js` to 20 unit and integration tests covering snippet and secret deletion, WAL checkpoint, database integrity check, and atomic snapshot creation.

---

## [1.2.0] - 2026-09-08

### Added
- **Community Skills as Managed Subagents**: Added `skills-loader.js` to dynamically scan, parse, and bridge community skills (e.g. `tidyfactor-marketing`, `tidyfactor-design`, `tidyfactor-doc`, `tidyfactor-php`, `tidyfactor-next`) into first-class subagents under Tidy management.
- **Context-Rich Task Brief Generator**: Added `brief-generator.js` synthesizing self-contained, 3-ring context task briefs with explicit operational boundaries, goals, and verification gates.
- **Domain-Categorized Task Management**: Extended `app_tasks` and `app_journal` with multi-domain tags (`tech`, `marketing`, `business`, `design`, `docs`, `ops`) and assigned agent pointers.
- **Extended MCP Tools**: Added `tidy_list_skills` and `tidy_synthesize_brief` tools to the Stdio JSON-RPC 2.0 MCP server, and enriched `tidy_task_add` with domain & assigned agent support.
- **Interactive UI Skills & Brief Hub**: Enhanced Electron Windows and Web Console with Skills discovery cards, Brief Generator modal, and Task Domain filter badges.
- **Expanded Test Suite**: Extended `tests/run.js` to 15 unit and integration tests covering skill discovery, domain task filtering, and brief synthesis.

---

## [1.1.0] - 2026-09-08

### Added
- **Formal Machine-Readable JSON Schemas**: Added comprehensive JSON schema definitions in `references/schemas/` (`context.schema.json`, `db-stats.schema.json`, `memory-node.schema.json`, `memory-recall.schema.json`, `subagent-result.schema.json`, `task-item.schema.json`).
- **First-Class 8-Language Localization (Rule 13)**: Added full localized guides with universal language switcher bars (`README.es.md`, `README.de.md`, `README.fr.md`, `README.pt.md`, `README.zh.md`, `README.fa.md`).
- **Automated Zero-Dependency Test Suite**: Added `tests/run.js` executing 12 unit and integration tests across database bootstrap, FTS5 search, micro-apps, and subagent orchestration.
- **Enriched Runtime Manifest Contract**: Updated `manifest.json` with strict CLI invocation patterns, input/output schemas, and Contextual Decision Layer (CDL v2.0) gates.
- **Subagent Runtime Runner**: Added `runSubagent()` function with 3-ring context injection and automated memory persistence.

### Changed
- **Recall Memory API Resilience**: `recallMemory()` now natively accepts either direct string queries or options objects, preventing unwanted fallbacks when specific search queries yield zero results.

---

## [1.0.0] - 2026-09-08

### Added
- **Initial Release**: Sovereign Personal Assistant Agent with persistent SQLite memory, CLI engine, and local Stdio MCP Server.
- **Active Storage SQLite SSOT**: Auto-bootstrapping database (`~/.tidy/tidy.db`) with WAL mode, foreign keys, and 64MB memory cache.
- **FTS5 Bilingual Memory Engine**: Instant BM25-ranked full-text search across memory nodes with automatic synchronization triggers.
- **The 3-Ring Context Architecture**: Strict separation of Sovereign Profile (Ring 0), Active Workspace & Domain Firewall (Ring 1), and Dynamic Working Memory (Ring 2).
- **Sub-Agent Registry & Engine**: Built-in specialized roles (`planner`, `coder`, `researcher`, `scribe`) plus dynamic registration for custom subagents.
- **Micro-App Library**: Integrated support for `tasks`, `snippets`, `journal`, and `vault` apps backed by SQLite.
- **Local Stdio MCP Server**: Model Context Protocol JSON-RPC 2.0 interface exposing 6 tools and live resource URIs (`tidy://context/current`, `tidy://profile`, `tidy://tasks`).
- **Unified CLI Engine**: Complete terminal interface `bin/tidy.js` supporting `init`, `whoami`, `context`, `memory`, `agent`, `app`, `mcp`, and `db`.
- **TidyFactor 15 Structural Rules Compliance**: Disciplined dispatcher `SKILL.md`, declarative decision gates in `manifest.json`, and two-tier bilingual documentation.
