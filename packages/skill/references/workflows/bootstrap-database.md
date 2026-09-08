# Workflow: bootstrap-database

One outcome: An active, verified, WAL-enabled SQLite database with FTS5 search and seed data ready for operation.

---

## Steps

1. **Step 0: Context Auto-Sensing**:
   - Check if `~/.tidy/tidy.db` exists.
   - If not, check if local project database `.tidyfactor/tidy.db` exists.
   - Do NOT prompt the user if database exists and validates cleanly.

2. **Run Initialization**:
   - Execute: `node bin/tidy.js init`
   - Verify table creation: `user_profile`, `contexts`, `memory_nodes`, `memory_fts`, `subagents`, `installed_apps`, `app_tasks`.

3. **Verify Integrity & PRAGMAs**:
   - Verify WAL mode is active: `PRAGMA journal_mode;` returns `wal`.
   - Verify foreign keys enabled: `PRAGMA foreign_keys;` returns `1`.

4. **Output Summary**:
   - Print active context and storage path to session.

---

## Validation Checklist

- [ ] SQLite database file exists at resolved location
- [ ] PRAGMA journal_mode is WAL
- [ ] FTS5 virtual table `memory_fts` is initialized and responsive
- [ ] Core tables and seed data present
- [ ] No manual input requested for existing database parameters
