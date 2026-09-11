# Command: app

Runtime entry point for interacting with Tidy micro-apps: Tasks, Snippets, Journal, and Vault.

## Dispatch

1. Load `../workflows/manage-memory.md`
2. Load `../memory/cli-reference.md`
3. Execute micro-app command:
   - Tasks: `node bin/tidy.js app task [add|list|done]`
   - Snippets: `node bin/tidy.js app snippet [add|list]`
   - Journal: `node bin/tidy.js app journal [add|list]`
   - Vault: `node bin/tidy.js app vault [set|get]`
