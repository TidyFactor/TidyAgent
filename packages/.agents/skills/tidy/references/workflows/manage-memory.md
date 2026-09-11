# Workflow: manage-memory

One outcome: A memory node or working context accurately captured, indexed in FTS5, and reflected in the active session.

---

## Steps

1. **Step 0: Context Auto-Sensing**:
   - Check active context via `node bin/tidy.js whoami`.
   - Before prompting, scan working directory and SQLite for existing facts to avoid duplicate recording.

2. **Categorize Memory**:
   - Classify item into tier: `core` (permanent rules), `project` (project specific), `session` (current task), or `ephemeral` (scratch).
   - Classify category: `fact`, `decision`, `pattern`, `preference`, `task`, or `rule`.

3. **Execute Storage or Recall**:
   - To save: `node bin/tidy.js memory save "<content>"`
   - To recall: `node bin/tidy.js memory recall "<query>"`
   - Verify FTS5 triggers updated `memory_fts` automatically.

4. **Verify Context Isolation**:
   - Confirm domain firewall mode (`dev`, `marketing`, `personal`) is respected.

---

## Validation Checklist

- [ ] New memory node has valid ID, tier, and category
- [ ] Record is searchable immediately via FTS5 BM25 search
- [ ] No context bleed between isolated domains
- [ ] Action recorded in `audit_log`
