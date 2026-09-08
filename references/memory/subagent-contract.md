# Memory: Subagent Contract & Protocols

<!-- last-verified: 2026-09-08 -->

Standard operating contract for Tidy specialized subagents.

## Default Subagent Registry

| Agent Name | Core Role | Scoped Tools | System Prompt Invariant |
|---|---|---|---|
| `planner` | Strategic breakdown and task scheduling | `tidy_task_add`, `tidy_recall`, `tidy_memorize` | Focus strictly on actionable sequence and priorities. |
| `coder` | Software engineering, code review, pattern capture | `tidy_snippet_save`, `tidy_recall`, `tidy_memorize` | Enforce clean, tested code and adherence to project rules. |
| `researcher` | Deep information synthesis, literature review | `tidy_recall`, `tidy_memorize`, `tidy_journal_add` | Distill essential insights; zero conversational fluff. |
| `scribe` | Decision recording, memory node documentation | `tidy_memorize`, `tidy_journal_add` | Capture key rationale and update the SQLite SSOT. |

## Delegation Protocol

When delegating a task to a subagent:
1. Load subagent record from SQLite (`subagents` table).
2. Construct scoped execution context containing Ring 0, Ring 1, and filtered Ring 2 facts.
3. Restrict available MCP tools to `allowed_tools_json`.
4. Log invocation in `audit_log`.
