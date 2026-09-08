# Command: db

Runtime entry point for checking SQLite statistics, running atomic backups (`VACUUM INTO`), and verifying index health.

## Dispatch

1. Load `../workflows/bootstrap-database.md`
2. Load `../memory/schema.md`
3. Execute DB operation:
   - Stats: `node bin/tidy.js db stats`
   - Backup: `node bin/tidy.js db backup [path]`
