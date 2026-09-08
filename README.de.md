<div align="center">

# 🤖 Tidy `v1.1.0`
### Souveräner Persönlicher Assistenz-Agent mit persistentem SQLite-Gedächtnis & lokalem Stdio-MCP-Server

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • **[ Deutsch ](README.de.md)** • [ Français ](README.fr.md) • [ Português ](README.pt.md) • [ 中文 ](README.zh.md) • [ فارسی ](README.fa.md)

[![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](SKILL.md)

</div>

---

## 🌟 Übersicht & Kernvorteile

**Tidy** ist eine Betriebsschicht für persönliche KI-Assistenten, die auf einer einzigen lokalen SQLite-Datenbank als permanenter Single Source of Truth (SSOT) aufbaut.

### Hauptmerkmale
1. **Konfigurationsfreier Start (Zero-Config)**: Basiert auf dem nativen `node:sqlite`-Treiber (Node.js >= 22). Keine C++-Compiler, kein node-gyp. Automatische Erstellung von `~/.tidy/tidy.db` mit WAL-Modus, Foreign Keys, 8 relationalen Tabellen und FTS5-Index.
2. **3-Ring-Kontextarchitektur**:
   - **Ring 0 (Souveränes Profil)**: Benutzeridentität und Assistenten-Persona (~150 Tokens).
   - **Ring 1 (Domänen-Firewall)**: Strikte Trennung zwischen `dev`-, `marketing`- und `personal`-Modus.
   - **Ring 2 (Dynamisches Arbeitsgedächtnis)**: BM25-bewertete FTS5-Volltextsuche nach Fakten und Architekturentscheidungen.
3. **Duale CLI-Schnittstelle**: Moderner interaktiver Assistent via `@clack/prompts` und skriptfähiger Modus für Pipelines.
4. **4 integrierte Mikro-Apps**: `tasks` (Aufgabenverwaltung), `snippets` (Code-Bibliothek), `journal` (Arbeitstagebuch), `vault` (sichere Schlüsselverwaltung).
5. **Lokaler Stdio-MCP-Server**: JSON-RPC 2.0 mit 8 Tools und 3 Live-Ressourcen (`tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`).

---

## 🚀 Schnellstart

```bash
# Interaktiver Terminal-Assistent
node bin/tidy.js

# Speichern und Abrufen
node bin/tidy.js memory save "Projekt nutzt Next.js 16"
node bin/tidy.js memory recall "Next.js"

# MCP-Server starten
node scripts/mcp_server.js
```

## 📄 Lizenz

Apache-2.0 © 2026 TidyFactor Team.
