# @tidy/plugin — Universal Host Plugin & Adapters

Universal host plugin, adapters, and distribution layer mounting the **TidyAgent Sovereign Control Plane** across external AI hosts (**ChatGPT**, **Claude Code**, **OpenAI Codex**, **Cursor**, and **Google Antigravity**).

---

## 🏛️ Boundary Doctrine & Architecture

Following the **Tidy Platform Ecosystem Invariants**:
- **Host-Decoupled**: TidyAgent is never locked to ChatGPT or Claude. Hosts are treated strictly as interchangeable reasoning engines.
- **Zero Cognitive Logic in Plugin**: All cognitive intelligence, SQLite queries, memory taxonomy classification, and 5-tier context assembly live in `@tidy/core`.
- **Adapter Package**: `@tidy/plugin` acts strictly as an adapter, schema validator, and distribution package.

```text
                    TIDYFACTOR
                        │
              ┌─────────┴─────────┐
              │                   │
          TidyAgent          TidyFactor Skills
              │                   │
     ┌────────┼────────┐          │
     │        │        │          │
   Brain    Context   MCP       Registry
     │        │        │          │
     └────────┴────────┴──────────┘
                        │
                  Host Adapters (@tidy/plugin)
             ┌──────────┼──────────┐
          ChatGPT     Claude      Codex / Cursor
```

---

## 🚀 Supported Host Adapters

| Host | Adapter Class | Output Target | Mode |
|---|---|---|---|
| **ChatGPT** | `ChatGPTPluginAdapter` | System message & OpenAPI endpoints | Plugin Manifest / Custom GPT Action |
| **Claude Code** | `ClaudeCodeAdapter` | Markdown System Prompt + Stdio MCP | CLI & Desktop runner |
| **Cursor** | `CursorBridgeAdapter` | `.cursorrules` / `.cursor/rules/*.mdc` | Project Rules & MCP |
| **OpenAI Codex** | `OpenAICodexAdapter` | Developer Role Prompt + JSON Schemas | API & Stdio bridge |
| **Antigravity** | `AntigravityIdeAdapter` | Contextual Decision Layer (CDL) | Native Agent Customization |

---

## 📦 Usage

```javascript
const { getHostAdapter, listSupportedHosts, getPluginManifest } = require('@tidy/plugin');

// List supported hosts
console.log(listSupportedHosts());
// ['chatgpt', 'claude', 'cursor', 'codex', 'antigravity']

// Instantiate adapter
const claude = getHostAdapter('claude');

// Compile 5-Tier Context for Claude
const promptPayload = claude.formatPrompt('Implement user authentication', {
  tiers: {
    global: 'Persona: Principal Wael | Language: English',
    project: 'Workspace: TidyAgent Core | Domain: dev',
    task: 'Add JWT verification middleware',
    working: 'File: src/middleware/auth.js'
  }
});
```

---

## 📄 License

Apache-2.0 © 2026 TidyFactor Team
