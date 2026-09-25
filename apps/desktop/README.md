# 🖥️ Tidy Studio (`@tidy/desktop`)
### Sovereign Desktop Management Studio & Floating Assistant HUD for Windows x64

**Tidy Studio** is the flagship native desktop management application for the **Tidy Platform Ecosystem**. Built with modern **Electron** and wrapped around an embedded SQLite SSOT kernel (`@tidy/core` + `@tidy/office`), it delivers a sovereign, privacy-first management console with a luxury dark-mode interface, sub-millisecond local search, and a zero-latency global floating HUD.

---

## 🌟 Visual Showcase & Screenshot Gallery

<div align="center">

### 1. Unified Management Overview & Health Telemetry
*Real-time system health, SQLite storage telemetry, domain firewall status, and quick memory action tiles.*

![Tidy Studio Overview](../../docs/public/screenshots/desktop/overview.png)

</div>

<div align="center">

### 2. Universal Skills & Agents Studio
*Monospaced code editor, AST syntax tree synchronization, 15-rule Skills-LAB compliance validator, and live Markdown split preview.*

![Skills & Agents Studio](../../docs/public/screenshots/desktop/skills-studio.png)

</div>

<div align="center">

### 3. FTS5 BM25 Memory Explorer & 3-Ring Context
*Instant local BM25 full-text recall with mathematical decay ranking, importance stars, and multi-tier filtering.*

![Memory Explorer](../../docs/public/screenshots/desktop/memory-explorer.png)

</div>

<div align="center">

### 4. Knowledge Harvester & Agent Brain Extractor
*2-Pane master-detail harvester scanning agent knowledge bases, sessions, and atomic rules.*

![Knowledge Harvester Studio](../../docs/public/screenshots/desktop/harvester.png)

</div>

<div align="center">

### 5. Sovereign B2B CRM & Itemized Invoicing
*Manage client deal stages, itemized tax-calculated billing, and real-time cashflow statements.*

| CRM Deal Pipelines | Itemized Invoicing & Billing |
|:---:|:---:|
| ![CRM Pipeline](../../docs/public/screenshots/desktop/crm-pipeline.png) | ![Invoices & Billing](../../docs/public/screenshots/desktop/invoices-billing.png) |

</div>

<div align="center">

### 6. Zero-Latency Global Floating HUD (`Alt + Space`)
*Frameless floating assistant summoned from anywhere in Windows to capture memories, search facts, or run agents.*

![Global Floating HUD](../../docs/public/screenshots/desktop/hud-floating.png)

</div>

---

## 🏛️ Comprehensive Feature Breakdown (14 Integrated Views)

| View / Tab | Key Capabilities | Underlying Core Module |
|---|---|---|
| **1. Overview** | Live SQLite WAL stats, memory counts, pending tasks, quick capture | `@tidy/core` |
| **2. Skills & Agents Studio** | Universal IDE scanner (Claude, Cursor, Antigravity, Windsurf), AST editor, 15-rule compliance audit | `skills-loader.js` + `skills-validator.js` |
| **3. Memory Explorer** | FTS5 BM25 search, mathematical decay, importance rating, 3-ring context inspector | `memory.js` |
| **4. Knowledge Harvester** | Scan `~/.gemini/knowledge/**` and IDE sessions, atomic KI ingestion, negative constraint validator | `knowledge-harvester.js` |
| **5. Agent Runner** | Autonomous subagent dispatcher (`@coder`, `@planner`, `@marketing`, `@doc`), 3-ring task brief synthesis | `brief-generator.js` |
| **6. MCP Studio** | 29 tools inspector, 9 live dynamic resources, JSON-RPC 2.0 tester | `@tidy/mcp` |
| **7. Tasks Board** | Kanban triage board (Pending, In Progress, Completed), domain & subagent filters | `tasks.js` |
| **8. Code Snippets** | Syntax-highlighted snippet vault, language filters, copy-to-clipboard | `snippets.js` |
| **9. Daily Journal** | Private developer thoughts, daily logs, structured changelogs | `journal.js` |
| **10. Vault & Secrets** | Local encrypted credential locker with zero cloud leakage | `vault.js` |
| **11. CRM Pipeline** | B2B clients, contact management, deal stages, and proposal budgets | `@tidy/office` (`app_crm_clients`) |
| **12. Invoices & Billing** | Itemized invoice creator, automated tax & discount calculator, PDF-ready print | `@tidy/office` (`app_invoices`) |
| **13. Cashflow & P&L** | Revenue, operational expenses, gross profit, margin telemetry | `@tidy/office` (`app_expenses`) |
| **14. Settings & Health** | Database optimization (`VACUUM`, `PRAGMA optimize`), WAL checkpoint, domain switching | System Kernel |

---

## ⚡ Global Floating HUD (`Alt + Space`)

The **Tidy HUD** (Heads-Up Display) is a lightweight, frameless floating overlay designed for immediate developer access without breaking your active coding workflow:

- **Global Shortcut**: Press `Alt + Space` (configurable) anywhere on Windows to summon the HUD.
- **Smart Auto-Hide**: Automatically slides away upon losing focus (`blur`) so your screen remains clear.
- **Rapid Memory Capture**: Type and press Enter to commit decisions or snippets directly to SQLite SSOT in under 10ms.
- **System Tray Integration**: Resides unobtrusively in the Windows Taskbar Notification Area with a 1-click context menu.

---

## 🔒 Security Architecture & Zero-Trust IPC Contract

Tidy Studio adheres to strict enterprise desktop security principles:

```text
┌─────────────────────────────────────────────────────────────┐
│                       Renderer Process                      │
│     (Isolated DOM / Vanilla JS / Zero Node.js Access)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                  Typed IPC (`window.tidyApi`)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Preload Context Bridge                   │
│             `contextIsolation: true, sandbox: true`          │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Direct function dispatch (`tidy:*`)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                        Main Process                         │
│     (Electron Lifecycle + Direct Embedded @tidy/core SQLite) │
└─────────────────────────────────────────────────────────────┘
```

1. **`nodeIntegration: false`**: The renderer UI has **zero access** to `require()`, `process`, or native Node.js APIs, completely preventing Remote Code Execution (RCE) via web payloads.
2. **`contextIsolation: true`**: All bridges are strongly typed and strictly gated through `contextBridge.exposeInMainWorld('tidyApi', ...)`.
3. **Local-First SQLite SSOT**: No remote API servers, no telemetry beacons, no cloud subscriptions. All data lives in `~/.tidy/tidy.db`.

---

## 🛠️ Development, Building & Distribution

### Run Locally (Development)
```bash
# From workspace root:
npm run desktop

# Or from apps/desktop:
cd apps/desktop
npm start
```

### Build Windows x64 Native Installers
```bash
# Build complete Windows NSIS Setup (.exe) + Portable executable:
npm run build:win

# Build specifically NSIS installer:
npm run build:nsis

# Build standalone zero-install Portable executable:
npm run build:portable
```

Generated production binaries are stored under `apps/desktop/dist/`:
- `Tidy-Studio-Setup-1.4.5.exe` (NSIS Wizard with Start Menu & Desktop Shortcuts)
- `Tidy-Studio-Portable-1.4.5.exe` (Standalone single-file executable for USB or isolated environments)

---

## 📄 License

Apache-2.0 © 2026 TidyFactor Team.
