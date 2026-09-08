<div align="center">

# 🤖 Tidy `v1.1.0`
### Agent Assistant Personnel Souverain avec Mémoire Persistante SQLite et Serveur MCP Stdio Local

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • [ Deutsch ](README.de.md) • **[ Français ](README.fr.md)** • [ Português ](README.pt.md) • [ 中文 ](README.zh.md) • [ فارسی ](README.fa.md)

[![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](SKILL.md)

</div>

---

## 🌟 Présentation & Proposition de Valeur

**Tidy** est une couche d'assistance personnelle souveraine basée sur une base de données SQLite locale unique servant de Source Unique de Vérité (SSOT) permanente.

### Fonctionnalités Clés
1. **Démarrage Zéro-Configuration**: Utilise le moteur natif `node:sqlite` (Node.js >= 22). Zéro dépendance C++ externe, zéro compilation node-gyp. Création automatique de `~/.tidy/tidy.db` avec mode WAL, clés étrangères, 8 tables et index FTS5.
2. **Architecture de Contexte à 3 Anneaux**:
   - **Ring 0 (Profil Souverain)**: Identité de l'utilisateur et posture de l'assistant (~150 tokens).
   - **Ring 1 (Pare-feu de Domaine)**: Isolation stricte entre les contextes `dev`, `marketing` et `personal`.
   - **Ring 2 (Mémoire de Travail Dynamique)**: Recherche FTS5 BM25 pour les décisions et règles.
3. **CLI Hybride à Double Mode**: Assistant interactif élégant avec `@clack/prompts` et mode scriptable pour l'automatisation.
4. **4 Micro-Applications Intégrées**: `tasks` (gestionnaire de tâches), `snippets` (extraits de code), `journal` (journal de bord), `vault` (coffre-fort de secrets).
5. **Serveur MCP Stdio Local**: Protocole JSON-RPC 2.0 avec 8 outils et 3 ressources en direct (`tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`).

---

## 🚀 Démarrage Rapide

```bash
# Interface interactive dans le terminal
node bin/tidy.js

# Mémoriser et rappeler
node bin/tidy.js memory save "Le projet utilise Next.js 16"
node bin/tidy.js memory recall "Next.js"

# Lancer le serveur MCP
node scripts/mcp_server.js
```

## 📄 Licence

Apache-2.0 © 2026 TidyFactor Team.
