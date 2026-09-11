# Command: context

Runtime entry point for managing workspaces, switching operational domains, and enforcing contextual firewalls.

## Dispatch

1. Load `../workflows/manage-memory.md`
2. Load `../memory/context-rings.md`
3. Execute switch via CLI:
   - List: `node bin/tidy.js context list`
   - Switch: `node bin/tidy.js context switch <context_id>`

## Invariant

- When switching to `dev` mode, all personal journal and marketing records are firewalled out of active context.
