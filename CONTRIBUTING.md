# Contributing to Tidy 🤖

Thank you for your interest in contributing to **Tidy — The Sovereign Personal Assistant Platform & Memory OS**!

---

## 🏛️ Architecture & Governance Invariants

Tidy is an autonomous, sovereign personal-assistant operating ecosystem built around an active, local-first SQLite database as its permanent Single Source of Truth (SSOT).

When contributing code, you MUST respect these core invariants:
1. **SQLite SSOT & Zero Drift**: All operational state lives exclusively in `~/.tidy/tidy.db`. Never write memory nodes or tasks to loose markdown, JSON sidecars, or chat histories instead of SQLite.
2. **Pure Node.js Kernel**: `@tidy/core` (`packages/core`) relies strictly on native `node:sqlite` (Node.js >= 22.0.0). It has zero UI dependencies and must never require native C++ build tools (no `node-gyp`).
3. **Electron Security Boundary**: In `apps/desktop`, `contextIsolation` MUST always be `true`, `nodeIntegration` MUST always be `false`, and all communication travels through typed IPC (`tidy:*`).
4. **Bilingual Parity**: Tidy treats Arabic and English as first-class citizens. When updating documentation or public command references, update both `README.md` and `README.ar.md`.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: >= 22.0.0 (required for native `node:sqlite`)
- **Python**: >= 3.10 (for the TidyFactor Skill Architect validator)
- **Git**

### Installation
```bash
# Clone the repository
git clone https://github.com/TidyFactor/TidyAgent.git
cd TidyAgent

# Install dependencies across all workspaces
npm install
```

---

## 🧪 Testing & Verification Gates

Before submitting any Pull Request, you must verify that all automated suites pass:

```bash
# 1. Run full 56-test unit & integration suite
npm test
# (or directly: node tests/run.js)

# 2. Validate Root Skill compliance with 15 Structural Rules
python tools/validate_skill.py

# 3. Validate @tidy/skill package compliance
python packages/skill/tools/validate_skill.py
```

All commands must exit with code `0` (0 errors, 0 warnings).

---

## 🌿 Branching & PR Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or for fixes:
   git checkout -b fix/issue-description
   ```
2. Commit with conventional commit messages:
   - `feat(core): add vector similarity scoring`
   - `fix(desktop): resolve window resize glitch on Windows`
   - `docs(readme): clarify MCP stdio configuration`
3. Push to your fork and open a Pull Request against `main`.
4. Complete the Pull Request template checklist.

---

## 📜 Code of Conduct
Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) during all community interactions.
