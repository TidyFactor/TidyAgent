# Test Scenarios — tidy

Test scenarios for validating the Tidy sovereign personal assistant skill.

---

## Scenario 1: Zero-Config SQLite Initialization (Happy Path)

- **Command**: `tidy init`
- **Expected Outcome**:
  - Automatically creates `~/.tidy/tidy.db` if missing.
  - Applies all 8 tables and FTS5 triggers.
  - Seeds `primary` user profile and default contexts (`general`, `dev`, `marketing`, `personal`).
  - Prints storage path and active domain.

---

## Scenario 2: BM25 Bilingual Memory Recall (Happy Path)

- **Command**:
  1. `tidy memory save "المشروع يستخدم مكتبة node:sqlite المدمجة في Node 24"`
  2. `tidy memory recall "node:sqlite"`
- **Expected Outcome**:
  - First command returns saved memory node ID.
  - Second command returns the saved node ranked via BM25 with importance level.

---

## Scenario 3: Contextual Domain Firewall (Edge Case)

- **Command**:
  1. `tidy context switch ctx_dev`
  2. `tidy whoami`
- **Expected Outcome**:
  - Context switched to `ctx_dev` (Software Engineering).
  - Mode reported as `[DEV MODE]`.
  - Non-dev memories firewalled from scoped subagent context.

---

## Scenario 4: Invalid Subagent or Empty Memory (Negative Test)

- **Command**:
  1. `tidy agent run nonexistent_agent "do task"`
  2. `tidy memory save ""`
- **Expected Outcome**:
  - Rejects empty memory with explicit error message: `"Memory content cannot be empty."`
  - Rejects unregistered agent with: `"Subagent \"nonexistent_agent\" is not registered in Tidy."`
