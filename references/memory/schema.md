# Memory: SQLite Database Schema

<!-- last-verified: 2026-09-08 -->

Canonical DDL and database configuration for the Tidy persistent SQLite storage engine (`~/.tidy/tidy.db`).

## Engine PRAGMAs

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -64000;
```

## Tables & Indexes

| Table | Purpose | Primary Key | Key Columns |
|---|---|---|---|
| `system_config` | Engine metadata and versions | `key` | `value`, `updated_at` |
| `user_profile` | Sovereign profile (Ring 0) | `id` | `user_name`, `assistant_name`, `locale`, `tone` |
| `contexts` | Workspaces and domain modes (Ring 1) | `id` | `name`, `domain`, `is_active`, `metadata_yaml` |
| `memory_nodes` | Tiered memory records (Ring 2) | `id` | `context_id`, `tier`, `category`, `content`, `importance` |
| `memory_fts` | FTS5 virtual table for full-text search | `rowid` | `node_id`, `content`, `summary` (tokenize = unicode61) |
| `subagents` | Registered subagent profiles | `id` | `name`, `role`, `system_prompt`, `allowed_tools_json` |
| `installed_apps` | Micro-apps registry | `id` | `name`, `version`, `entry_point`, `config_json` |
| `app_tasks` | Tasks micro-app storage | `id` | `title`, `priority`, `status`, `due_date` |
| `app_snippets` | Snippets micro-app storage | `id` | `title`, `language`, `code` |
| `app_journal` | Journal micro-app storage | `id` | `title`, `entry`, `mood` |
| `app_vault` | Encrypted/secure key-value store | `key` | `value`, `is_secret` |
| `audit_log` | System mutation history | `id` (AUTOINCREMENT) | `action`, `component`, `details_json`, `timestamp` |

## Memory Tiers & Categories

- **Tiers**: `core` (permanent baseline), `project` (workspace bound), `session` (current goal), `ephemeral` (transient scratch).
- **Categories**: `fact` (discovered truth), `decision` (confirmed architectural choice), `pattern` (reusable technical recipe), `preference` (user preference), `task` (action item), `rule` (invariable constraint).
