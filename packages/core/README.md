# @tidy/core

The sovereign personal assistant kernel engine powering **Tidy**.

## Features
- **Embedded SQLite SSOT**: Built entirely on Node.js native `node:sqlite` (`DatabaseSync`), requiring zero external build tools or C++ compilation.
- **High-Concurrency WAL Mode**: Multi-process concurrent reads without locking stalls.
- **FTS5 Bilingual Memory**: Real-time BM25 full-text ranking with diacritics removal and trigger synchronization.
- **3-Ring Context Model**: Ring 0 Profile, Ring 1 Workspace Firewall, Ring 2 Dynamic Memory.
- **Built-in Micro-Apps**: Tasks, Snippets, Journal, and Vault.
- **Subagent Dispatcher**: Role-based agents with context injection.

## Usage
```js
const { initDatabase, saveMemory, recallMemory, addTask, listTasks } = require('@tidy/core');

// Initialize SQLite SSOT
initDatabase();

// Save and search memory
saveMemory({ content: 'Architecture decision', category: 'decision' });
const results = recallMemory('decision');

// Manage tasks
addTask({ title: 'Build new feature', priority: 'high' });
```
