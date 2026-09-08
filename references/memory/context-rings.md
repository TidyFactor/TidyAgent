# Memory: The 3-Ring Context Architecture

<!-- last-verified: 2026-09-08 -->

Mathematical model for context window allocation and domain firewall isolation in Tidy.

## Context Allocation Budget

$$\text{Active Context} = \text{Ring 0 (Profile)} + \text{Ring 1 (Domain)} + \text{Ring 2 (Retrieved Facts)}$$

| Ring | Layer Name | Token Budget | Retention | Persistence Source |
|---|---|---|---|---|
| **Ring 0** | Sovereign User Profile | ~150 tokens | Permanent | `user_profile` table |
| **Ring 1** | Active Workspace & Domain | ~250 tokens | Session / Project | `contexts` table |
| **Ring 2** | Dynamic Working Memory | ~500-1000 tokens | On-Demand FTS5 | `memory_nodes` & `memory_fts` |

## Contextual Firewalls

To prevent context bleed between unrelated domains:

| Operational Mode | Permitted Domains | Forbidden Data |
|---|---|---|
| `[Dev Mode]` | Code, Architecture, Schema, Tests | Personal journal, Marketing campaigns, Sales copy |
| `[Marketing Mode]` | Brand, Copy, Campaigns, CRO | Unrelated backend schemas, Personal journal |
| `[Personal Mode]` | Habits, Journal, Schedule, Life | Client source code, Secret keys |
| `[General Mode]` | Tasks, Reminders, Vault | None |

## Context Delta Resolution Formula

$$\text{Unknowns} = \text{Required Decisions} - (\text{Discovered Facts} \cup \text{SQLite KIs})$$

The assistant must compute this difference before presenting questions to the user. Zero questions are asked for facts already resolved in SQLite.
