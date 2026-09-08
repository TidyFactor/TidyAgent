# @tidy/cli

Terminal management interface for the **Tidy** sovereign personal assistant platform.

## Features
- **Interactive Terminal Wizard**: Modern `@clack/prompts` navigation with animated spinners, styled notes, and radio menus.
- **Scriptable Automation**: Pipeable commands for CLI scripts, cron jobs, and background workers.
- **Cross-Platform Compatibility**: Clean English labels prevent RTL inversion glitches in Windows PowerShell while supporting full Arabic content in memories and queries.

## Usage
```bash
# Launch interactive wizard
tidy

# Or execute direct subcommands
tidy whoami
tidy memory recall "Next.js"
tidy memory save "Production rule: use strict tenant isolation"
tidy app task list
```
