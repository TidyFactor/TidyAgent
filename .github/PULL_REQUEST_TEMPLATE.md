## 📝 Description / وصف التعديل

<!-- Provide a concise summary of the changes and the rationale behind them. -->
<!-- قدم ملخصاً واضحاً وموجزاً للتعديلات والدافع البرمجي أو المعماري لها. -->

---

## 📦 Affected Components / المكونات المتأثرة

- [ ] `@tidy/core` (Kernel, SQLite SSOT, Memory, Subagents, Micro-Apps)
- [ ] `@tidy/office` (Business Suite, CRM, Invoicing, Cashflow Telemetry)
- [ ] `@tidy/cli` (Terminal Wizard, Commands, Picocolors)
- [ ] `@tidy/mcp` (Stdio JSON-RPC 2.0 Server, Tools, Live Resources)
- [ ] `@tidy/skill` (TidyFactor Certified Skill, References, Workflows)
- [ ] `apps/desktop` (Electron Management Studio, Preload, IPC, Renderer)
- [ ] `apps/web` (HTTP Server, REST APIs, Web Console)
- [ ] `.github` (CI/CD, Workflows, Governance, Templates)

---

## 🔒 Architectural Quality Checklist / معايير الجودة المعمارية

- [ ] **Automated Tests**: Ran `npm test` (`node tests/run.js`) and all tests passed (100%).
- [ ] **Skill Governance**: Ran `python tools/validate_skill.py` with 0 errors and 0 warnings.
- [ ] **Package Parity**: Ran `python packages/skill/tools/validate_skill.py` with 0 errors.
- [ ] **SQLite SSOT Integrity**: Ensured state lives strictly in `~/.tidy/tidy.db` with WAL mode and zero in-memory drift.
- [ ] **Electron Security**: Maintained strict `contextIsolation: true` and `nodeIntegration: false` in `apps/desktop`.
- [ ] **Documentation**: Updated both `README.md` and `README.ar.md` if public API or usage changed.
- [ ] **Changelog**: Logged changes under `[Unreleased]` or target version in `CHANGELOG.md`.
