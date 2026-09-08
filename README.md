<div align="center">

# 🤖 Tidy `v1.4.2`
### Sovereign Personal Assistant & Office Suite with Persistent SQLite Memory & Local Stdio MCP Server

Give **Google Antigravity, Claude Code, Cursor, OpenAI Codex, or Windsurf** a dedicated sovereign assistant layer with zero-config persistent memory, subagent delegation, community skills discovery, full B2B CRM, automated itemized invoicing, expense & cashflow telemetry, and instant SQLite FTS5 search.

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](SKILL.md)
[![RTL Native Arabic](https://img.shields.io/badge/RTL-Native%20Arabic-emerald.svg?style=for-the-badge)](README.ar.md)
[![Architect Score](https://img.shields.io/badge/Architect%20Score-15%2F15%20Pass%20(100%25)-green.svg?style=for-the-badge)](#-architecture--governance)
[![AI Agents Compatible](https://img.shields.io/badge/AI%20Agents-Universal%20Compatibility-4285F4.svg?style=for-the-badge)](SKILL.md)

[ English ](README.md) • [ العربية ](README.ar.md) • [ User Manual ](docs/user_manual.ar.md) • [ Architecture Spec ](docs/specs/architecture_spec.ar.md)

</div>

---

## 🌟 Overview & Platform Topology

**Tidy** is an autonomous personal assistant and sovereign business operations ecosystem built on top of a single local SQLite database as its permanent Single Source of Truth (SSOT). Designed to eliminate cloud lock-in, Tidy unifies cognitive memory, subagents, business pipelines, and micro-apps across your terminal, code editors, and desktop.

### 📦 Ecosystem Monorepo Packages & Apps
- **`@tidy/core` (`packages/core`)**: Pure Node 22 + `node:sqlite` kernel. Houses dynamic schema registration (`registerSchema`), WAL concurrency tuning, bilingual FTS5 BM25 search, 3-Ring Context model, Community Skills Discovery (`skills-loader.js`), Task Brief Synthesizer (`brief-generator.js`), subagent dispatcher, and micro-apps (Tasks, Snippets, Journal, Vault).
- **`@tidy/office` (`packages/office`)**: Standalone business operations pack inheriting and superseding PocketOffice. Provides B2B CRM deal pipelines (`app_crm_clients`), automated itemized invoicing (`app_invoices`), commercial proposals (`app_proposals`), expense tracking & cashflow P&L (`app_expenses`), calendar scheduler, AI Client Dossier synthesizer, and 1-click PocketOffice migration importer.
- **`@tidy/cli` (`packages/cli`)**: Terminal command interface (`tidy` binary) with interactive `@clack/prompts` navigation wizard.
- **`@tidy/mcp` (`packages/mcp`)**: Stdio JSON-RPC 2.0 Model Context Protocol server exposing 16 intelligent tools and 4 dynamic live resources.
- **`@tidy/skill` (`packages/skill`)**: Official TidyFactor Skills-LAB Community Skill (Apache-2.0, 15 structural rules).
- **`@tidy/desktop` (`apps/desktop`)**: Native Windows x64 Desktop Application (Electron + secure typed IPC + global floating HUD summoned via `Alt+Space`) featuring dedicated visual tabs for CRM, Invoicing, and Cashflow.
- **`@tidy/web` (`apps/web`)**: Web Management Console running on local HTTP port `3840`.

### Core Capabilities
1. **Pluggable Microkernel Architecture**: Pure separation of concerns between core cognitive memory (`@tidy/core`) and business domains (`@tidy/office`). Allows custom enterprise deployments (DevOps, Agencies, Developers) without engine bloat.
2. **The 3-Ring Context Architecture**:
   - **Ring 0 (Sovereign Profile)**: Permanent user preferences and assistant persona (~150 tokens).
   - **Ring 1 (Domain Firewall)**: Context switching between `dev`, `marketing`, and `personal` modes without context bleed.
   - **Ring 2 (Dynamic Working Memory)**: BM25-ranked FTS5 recall of relevant decisions, rules, and patterns.
3. **Sovereign Business Suite**: Manage client pipelines, generate tax-calculated itemized invoices, record operational expenses, monitor real-time cashflow telemetry, and generate AI-powered client dossiers.
4. **Pluggable Sub-Agents & Skills Hub**: Built-in core roles (`planner`, `coder`, `researcher`, `scribe`) plus dynamic integration of TidyFactor Skills-LAB community skills (`@marketing`, `@design`, `@doc`, `@next`, `@php`, etc.) as sovereign subagents.
5. **Self-Contained Task Brief Generator**: Synthesizes autonomous task briefs combining Goal/Mission, 3-Ring Context, Skill Operational Rules, and Verification Gates.
6. **Multi-Surface Access**: CLI, Stdio MCP Server, Electron Windows Desktop App (`Alt+Space` HUD), and Web Dashboard.

---

## 🛠️ Quick Start & Usage

> 💡 **For the comprehensive command reference and end-to-end workflows, see the [📖 User Manual](docs/user_manual.ar.md).**

### 1. Interactive Terminal Wizard (Recommended)
Launch the modern, interactive `@clack/prompts` navigation interface:

```bash
tidy
# or explicitly:
tidy ui
```

### 2. Fast Developer One-Liners & Cognitive Memory
High-speed terminal commands for daily coding and agent collaboration:

```bash
# Instant memory search with mathematical decay & stars ranking
tidy q "WAL mode"
tidy q "auth" --bypass   # Bypass domain firewall for global search

# Instant memory capture in 1 second
tidy m "Use WAL mode for high concurrency" --cat decision --imp 5

# Quick task management with autonomous memory feedback loop
tidy task "Implement OAuth2" --priority urgent --domain dev --agent coder
tidy tasks --pending
tidy done tsk_xxx --result "Implemented with JWT verification"  # Auto-archives decision to memory!

# Quick status & firewall inspection
tidy who

# Obsidian PARA Markdown Vault Export & JSON SSOT
tidy export --out ./my_vault
tidy export --format json --out ./snapshot.json

# External Markdown notes ingestion
tidy import ./notes
```

### 3. Status Inspection
```bash
tidy init
tidy whoami
```

### 3. CRM & Client Pipeline
```bash
# List active clients
node bin/tidy.js crm list

# Add a new client
node bin/tidy.js crm add --name "Acme Corp" --budget 15000 --status prospect
```

### 4. Invoicing & Billing Engine
```bash
# List all invoices
node bin/tidy.js invoice list

# Create itemized invoice with 15% tax
node bin/tidy.js invoice create --client cli_xxxx --tax 15 --items '[{"name":"Backend API Migration","qty":1,"unitPrice":4500}]'

# Mark invoice as paid
node bin/tidy.js invoice pay inv_xxxx
```

### 5. Expenses & Live Cashflow Telemetry
```bash
# Record operational expense
node bin/tidy.js expense add --title "Cloud Server Hosting" --amount 240 --category hosting

# Audit live cashflow statement (Revenue, Expenses, Net Profit, Margin, Receivables)
node bin/tidy.js cashflow
```

### 6. AI Client Dossier Synthesizer
```bash
# Compile instant executive dossier combining CRM, Invoices, Proposals, and FTS5 Memory
node bin/tidy.js dossier cli_xxxx
```

### 7. PocketOffice 1-Click Migration
```bash
# Import existing PocketOffice data into Tidy SQLite SSOT
node bin/tidy.js import-pocketoffice --source ./path/to/PocketOffice-Data
```

### 8. Save & Recall Memories
```bash
# Save an architectural decision
node bin/tidy.js memory save "Project uses Next.js 16 and Supabase with strict tenant isolation"

# Instant BM25 search
node bin/tidy.js memory recall "Next.js"
```

### 9. Switch Contexts & Domains
```bash
node bin/tidy.js context list
node bin/tidy.js context switch ctx_dev
```

### 10. Delegate to Subagents & Synthesize Briefs
```bash
node bin/tidy.js agent run coder "Review database schema performance"
node bin/tidy.js brief "Build cashflow analytics dashboard"
```

---

## 🔌 Stdio MCP Server Configuration

Add to your IDE MCP configuration (`mcp_config.json`):

```json
{
  "mcpServers": {
    "tidy": {
      "command": "node",
      "args": ["packages/mcp/src/server.js"]
    }
  }
}
```

### Registered Tools (16 Tools)
- **Cognitive & Memory**: `tidy_recall`, `tidy_memorize`, `tidy_get_context`, `tidy_switch_context`.
- **Tasks & Agents**: `tidy_task_add`, `tidy_task_list`, `tidy_exec_subagent`, `tidy_list_skills`, `tidy_synthesize_brief`.
- **Database Telemetry**: `tidy_db_stats`.
- **Office Suite (`@tidy/office`)**:
  - `tidy_crm_list`: List CRM clients, deal pipelines, and budgets.
  - `tidy_crm_add`: Register a new B2B client.
  - `tidy_invoice_list`: Query invoices by status, client, or due date.
  - `tidy_invoice_create`: Generate itemized invoices with automated tax and discounts.
  - `tidy_cashflow_summary`: Live P&L financial statement.
  - `tidy_client_dossier`: Comprehensive AI client dossier fusing financial ledger and institutional memory.

### Dynamic Live Resources (4 Resources)
- `tidy://profile`: Sovereign user profile and operating tone.
- `tidy://context/current`: Active project context and domain firewall constraints.
- `tidy://tasks/pending`: Pending tasks queue.
- `tidy://office/cashflow`: Real-time financial cashflow statement.

---

## 🏛️ Architecture & Governance

Tidy adheres strictly to the **15 Structural Rules** of TidyFactor Skills:
- **Dispatcher Discipline**: `SKILL.md` is a clean router (~350 tokens) with explicit anti-triggers.
- **Contextual Decision Layer (CDL v2.0)**: Automatic Context Delta Resolution before prompting.
- **Operational Memory Isolation**: Clean separation between pure technical schemas and human documentation.
- **Pluggable Microkernel**: Core engine remains clean, fast, and unpolluted by domain-specific business rules.

---

## 📄 Documentation & License

- [📖 User Manual (العربية)](docs/user_manual.ar.md)
- [🏛️ Architecture Specification](docs/specs/architecture_spec.ar.md)
- [🗺️ TidyOffice Evolution Roadmap](docs/specs/tidyoffice_evolution_roadmap.ar.md)
- [📝 Release Changelog](CHANGELOG.md)

Apache-2.0 © 2026 TidyFactor Team.
