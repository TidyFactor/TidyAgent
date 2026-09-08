---
layout: home

hero:
  name: "Tidy Ecosystem"
  text: "Sovereign Personal Assistant & Business Operating Platform"
  tagline: "Ultra-fast Microkernel on SQLite WAL • Instant FTS5 BM25 Search • Autonomous Business Packs & AI Builder"
  image:
    src: /logo.svg
    alt: Tidy Ecosystem Logo
  actions:
    - theme: brand
      text: 🚀 User Manual
      link: /user_manual.ar
    - theme: alt
      text: 🏛️ Architecture Spec
      link: /specs/architecture_spec.ar
    - theme: alt
      text: 🗺️ Roadmap (SemVer)
      link: /PROJECT_STATUS.ar

features:
  - icon: 🔒
    title: Complete Data Sovereignty (Local-First)
    details: Single active SQLite database running high-performance WAL mode with zero cloud lock-in and fully encrypted local vault.
  - icon: ⚡
    title: Smart Bilingual Search (FTS5 BM25)
    details: Instant memory recall supporting Arabic and English via unicode61 tokenizer with mathematical decay scoring.
  - icon: 🧩
    title: Microkernel Architecture
    details: Lightweight engine adhering to 15 structural invariants, dynamically extensible with domain packs and community skills.
  - icon: 💼
    title: Sovereign Business Suite (TidyOffice)
    details: B2B CRM pipelines, tax-calculated itemized invoicing, expense telemetry, real-time cashflow, and AI client dossiers.
  - icon: 🎨
    title: Intelligent App Builder (TidyBuilder)
    details: Native integration with Qahera UI Kit for generating accessible, high-performance web interfaces and SPAs with full RTL parity.
  - icon: 🤖
    title: 3-Ring Context Governance
    details: Atomic 3-ring context assembly (Ring 0 identity, Ring 1 domain firewall, Ring 2 memory) with specialized subagent delegation.
---

# 🤖 Tidy Platform Ecosystem `v1.4.2`
### Sovereign Personal Assistant & Office Suite with Persistent SQLite Memory & Local Stdio MCP Server

Give **Google Antigravity, Claude Code, Cursor, OpenAI Codex, or Windsurf** a dedicated sovereign assistant layer with zero-config persistent memory, subagent delegation, community skills discovery, full B2B CRM, automated itemized invoicing, expense & cashflow telemetry, and instant SQLite FTS5 search.

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![Architect Score](https://img.shields.io/badge/Architect%20Score-15%2F15%20Pass%20(100%25)-green.svg?style=for-the-badge)](/specs/architecture_spec.ar)

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

---

## 🛠️ Quick Start

```bash
# Launch interactive terminal wizard
tidy

# Instant memory search with mathematical decay
tidy q "sqlite wal"

# Add a high-priority task linked to memory
tidy task "Review MCP contracts" --priority high
```
