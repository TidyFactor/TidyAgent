# 🤖 Tidy `v1.4.2`
### Souveräner Persönlicher Assistenten-Agent mit persistentem SQLite-Speicher & lokalem Stdio-MCP-Server

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)

[ English ](/en/) • [ العربية ](/) • [ Español ](/es/) • [ Deutsch ](/de/) • [ Français ](/fr/) • [ Português ](/pt/) • [ 中文 ](/zh/) • [ فارسی ](/fa/)

---

## 🌟 Übersicht & Wertversprechen

**Tidy** ist eine souveräne persönliche Assistentenschicht, die auf einer einzigen lokalen SQLite-Datenbank als permanenter Single Source of Truth (SSOT) aufbaut.

### Kernfunktionen
1. **Zero-Config Bootstrap**: Nutzt die integrierte `node:sqlite`-Engine (Node.js >= 22). Keine externen C++-Build-Tools. Erstellt automatisch `~/.tidy/tidy.db` mit WAL-Modus, Foreign Keys und FTS5-Index.
2. **3-Ring-Kontextarchitektur**:
   - **Ring 0 (Souveränes Profil)**: Benutzeridentität und Assistententon (~150 Tokens).
   - **Ring 1 (Domain-Firewall)**: Strikte Trennung zwischen den Modi `dev`, `marketing` und `personal`.
   - **Ring 2 (Dynamisches Arbeitsgedächtnis)**: FTS5 BM25-Abfrage von Entscheidungen und Regeln.
3. **Souveräne Business Suite**: CRM, automatische Rechnungsstellung und Echtzeit-Finanzübersicht.
4. **4 integrierte Mikro-Apps**: `tasks` (Aufgaben), `snippets` (Code-Snippets), `journal` (Reflexionen), `vault` (lokale Secrets).
5. **Lokaler Stdio MCP Server**: JSON-RPC 2.0 mit 16 intelligenten Tools und 4 Live-Ressourcen.

---

## 🚀 Schnellstart

```bash
# Interaktiver Terminal-Assistent
tidy

# Speichern & Abrufen
tidy m "Architekturentscheidung"
tidy q "SQLite"
```

## 📄 Lizenz

Apache-2.0 © 2026 TidyFactor Team.
