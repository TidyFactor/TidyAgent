<div align="center">

# 🤖 Tidy `v1.1.0`
### Agente Asistente Personal Soberano con Memoria Persistente SQLite y Servidor MCP Stdio Local

[ English ](README.md) • [ العربية ](README.ar.md) • **[ Español ](README.es.md)** • [ Deutsch ](README.de.md) • [ Français ](README.fr.md) • [ Português ](README.pt.md) • [ 中文 ](README.zh.md) • [ فارسی ](README.fa.md)

[![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](../../packages/skill/SKILL.md)

</div>

---

## 🌟 Resumen y Propuesta de Valor

**Tidy** es un asistente personal soberano que opera directamente sobre un archivo SQLite local único como su Fuente Única de Verdad (SSOT) permanente.

### Características Principales
1. **Arranque Cero-Configuración**: Utiliza el motor nativo `node:sqlite` (Node.js >= 22). Sin dependencias de compiladores C++ externos ni node-gyp. Crea automáticamente `~/.tidy/tidy.db` con modo WAL, claves foráneas, 8 tablas relacionales e índice FTS5.
2. **Arquitectura de 3 Anillos de Contexto**:
   - **Ring 0 (Perfil Soberano)**: Identidad del usuario y tono del asistente (~150 tokens).
   - **Ring 1 (Cortafuegos de Dominio)**: Aislamiento estricto entre modos `dev`, `marketing` y `personal`.
   - **Ring 2 (Memoria de Trabajo Dinámica)**: Búsqueda FTS5 BM25 de decisiones y reglas.
3. **Asistente CLI Dual**: Interfaz interactiva y moderna con `@clack/prompts` y modo scriptable para tuberías (pipes).
4. **4 Micro-Aplicaciones Integradas**: `tasks` (gestor de tareas), `snippets` (código y prompts), `journal` (diario de trabajo), `vault` (secretos y claves).
5. **Servidor MCP Local por Stdio**: JSON-RPC 2.0 con 8 herramientas y 3 recursos en tiempo real (`tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`).

---

## 🚀 Uso Rápido

```bash
# Asistente interactivo en terminal
node bin/tidy.js

# Guardar y recordar
node bin/tidy.js memory save "El proyecto utiliza Next.js 16"
node bin/tidy.js memory recall "Next.js"

# Servidor MCP
node scripts/mcp_server.js
```

## 📄 Licencia

Apache-2.0 © 2026 TidyFactor Team.
