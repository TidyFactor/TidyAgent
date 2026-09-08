# CHANGELOG — tidy

All notable changes to the `tidy` skill and CLI engine are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
