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

### Phase 3: Sovereign Multi-Device Sync (Cloud MCP & LibSQL) ⏳ (Q4 2026)
- [ ] **Local-First Sync Protocol**:
  - LibSQL / Litestream replication or CRDT changeset log for multi-device sync without third-party vendor lock-in.
  - End-to-end encrypted sync payloads stored on self-hosted S3/WebDAV or Cloudflare D1.
- [ ] **Cloud Companion MCP Server**:
  - Remote MCP endpoint allowing remote AI agents (e.g. cloud IDEs) to securely query the user's sovereign memory with token-based authorization.
- [ ] **Automated Backup & Pruning Schedules**:
  - Configurable snapshot rotation (`tidy db backup`) with automatic compression.

---

### Phase 4: Cross-Platform & Mobile Expansion 🔮 (2027)
- [ ] **Native macOS & Linux Desktop Builds**:
  - Apple Silicon universal `.dmg` binaries and Linux `.AppImage` / `.deb` packages.
- [ ] **Mobile Companion Apps (iOS & Android)**:
  - Capacitor / React Native client for on-the-go memory capture, voice memos, and task tracking.
- [ ] **Voice & Speech Interface**:
  - Local Whisper STT integration for hands-free memory dictation.
