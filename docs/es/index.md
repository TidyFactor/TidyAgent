# 🤖 Tidy `v1.4.2`
### Agente Asistente Personal Soberano con Memoria Persistente SQLite y Servidor MCP Stdio Local

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)

[ English ](/en/) • [ العربية ](/) • [ Español ](/es/) • [ Deutsch ](/de/) • [ Français ](/fr/) • [ Português ](/pt/) • [ 中文 ](/zh/) • [ فارسی ](/fa/)

---

## 🌟 Resumen y Propuesta de Valor

**Tidy** es un asistente personal soberano que opera directamente sobre un archivo SQLite local único como su Fuente Única de Verdad (SSOT) permanente.

### Características Principales
1. **Arranque Cero-Configuración**: Utiliza el motor nativo `node:sqlite` (Node.js >= 22). Sin dependencias de compiladores C++ externos ni node-gyp. Crea automáticamente `~/.tidy/tidy.db` con modo WAL, claves foráneas, tablas relacionales e índice FTS5.
2. **Arquitectura de 3 Anillos de Contexto**:
   - **Ring 0 (Perfil Soberano)**: Identidad del usuario y tono del asistente (~150 tokens).
   - **Ring 1 (Cortafuegos de Dominio)**: Aislamiento estricto entre modos `dev`, `marketing` y `personal`.
   - **Ring 2 (Memoria de Trabajo Dinámica)**: Búsqueda FTS5 BM25 de decisiones y reglas.
3. **Suite de Negocios Soberana**: Gestión de clientes (CRM), facturación automática, propuestas comerciales y telemetría financiera.
4. **4 Micro-Aplicaciones Integradas**: `tasks` (gestor de tareas), `snippets` (código y prompts), `journal` (diario de trabajo), `vault` (secretos y claves).
5. **Servidor MCP Local por Stdio**: JSON-RPC 2.0 con 16 herramientas y 4 recursos en tiempo real.

---

## 🚀 Uso Rápido

```bash
# Asistente interactivo en terminal
tidy

# Guardar y recordar
tidy m "Decisión de arquitectura"
tidy q "Next.js"
```

## 📄 Licencia

Apache-2.0 © 2026 TidyFactor Team.
