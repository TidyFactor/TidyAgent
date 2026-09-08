# Command: init

Runtime entry point for initializing Tidy, creating the SQLite database if missing, running migrations, and verifying storage health.

## Dispatch

1. Load `../workflows/bootstrap-database.md`
2. Load `../memory/schema.md`
3. Execute deterministic check via `node bin/tidy.js init`
4. Confirm Ring 0 and Ring 1 baseline state

## Do not load

- Do not load subagent details or app specifics during environment initialization.
