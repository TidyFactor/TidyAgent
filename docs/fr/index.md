# 🤖 Tidy `v1.4.2`
### Agent Assistant Personnel Souverain avec Mémoire Persistante SQLite & Serveur MCP Stdio Local

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)

[ English ](/en/) • [ العربية ](/) • [ Español ](/es/) • [ Deutsch ](/de/) • [ Français ](/fr/) • [ Português ](/pt/) • [ 中文 ](/zh/) • [ فارسی ](/fa/)

---

## 🌟 Aperçu et Proposition de Valeur

**Tidy** est une couche d'assistant personnel souverain fonctionnant sur un fichier SQLite local unique en tant que Source Unique de Vérité (SSOT) permanente.

### Fonctionnalités Clés
1. **Démarrage Sans Configuration**: Utilise le moteur natif `node:sqlite` (Node.js >= 22). Sans dépendance C++ externe. Initialise automatiquement `~/.tidy/tidy.db` en mode WAL, clés étrangères et index FTS5.
2. **Architecture de Contexte à 3 Anneaux**:
   - **Ring 0 (Profil Souverain)**: Identité de l'utilisateur et tonalité de l'assistant (~150 tokens).
   - **Ring 1 (Pare-feu de Domaine)**: Cloisonnement strict entre les modes `dev`, `marketing` et `personal`.
   - **Ring 2 (Mémoire de Travail Dynamique)**: Recherche FTS5 BM25 des décisions et règles.
3. **Suite d'Affaires Souveraine**: Gestion CRM, facturation automatisée, devis et télémétrie financière.
4. **4 Micro-Applications Intégrées**: `tasks` (tâches), `snippets` (code et prompts), `journal` (réflexions), `vault` (secrets chiffrés).
5. **Serveur MCP Stdio Local**: JSON-RPC 2.0 avec 16 outils intelligents et 4 ressources en direct.

---

## 🚀 Démarrage Rapide

```bash
# Assistant interactif en terminal
tidy

# Mémoriser et rappeler
tidy m "Décision d'architecture"
tidy q "Next.js"
```

## 📄 Licence

Apache-2.0 © 2026 TidyFactor Team.
