# @tidy/desktop

Official **Tidy** Windows and Cross-Platform Desktop Management Application built with Electron.

## Architecture
- **Main Process** (`src/main/index.js`): Bridges directly into `@tidy/core` embedded SQLite SSOT with non-blocking WAL mode.
- **Preload API** (`src/preload/index.js`): Context-isolated IPC gateway (`window.tidyApi`).
- **Renderer Dashboard** (`src/renderer/`): Luxury dark-mode interface for Memory exploration (FTS5 BM25), Task Kanban triage, Subagent execution, and SQLite diagnostics.

## Development & Run
```bash
# Run Electron App locally
npm start

# Build Windows NSIS installer
npm run build:win
```
