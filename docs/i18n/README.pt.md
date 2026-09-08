<div align="center">

# 🤖 Tidy `v1.1.0`
### Agente Assistente Pessoal Soberano com Memória Persistente SQLite e Servidor MCP Stdio Local

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • [ Deutsch ](README.de.md) • [ Français ](README.fr.md) • **[ Português ](README.pt.md)** • [ 中文 ](README.zh.md) • [ فارسی ](README.fa.md)

[![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](../../packages/skill/SKILL.md)

</div>

---

## 🌟 Visão Geral e Proposta de Valor

O **Tidy** é uma camada operacional de assistência pessoal soberana baseada em um único banco de dados SQLite local como sua Fonte Única da Verdade (SSOT) permanente.

### Recursos Principais
1. **Inicialização Zero-Configuração**: Desenvolvido sobre o driver nativo `node:sqlite` (Node.js >= 22). Zero dependências de compilação C++ externa. Criação automática de `~/.tidy/tidy.db` com modo WAL, chaves estrangeiras, 8 tabelas e índice FTS5.
2. **Arquitetura de Contexto de 3 Anéis**:
   - **Ring 0 (Perfil Soberano)**: Identidade do usuário e postura do assistente (~150 tokens).
   - **Ring 1 (Firewall de Domínio)**: Isolamento rígido entre contextos `dev`, `marketing` e `personal`.
   - **Ring 2 (Memória de Trabalho Dinâmica)**: Recuperação rápida de fatos e decisões via FTS5 BM25.
3. **CLI Interativo e Scriptable**: Interface de terminal elegante via `@clack/prompts` e suporte a automação.
4. **4 Micro-Aplicações Embutidas**: `tasks` (gestão de tarefas), `snippets` (biblioteca de código), `journal` (diário de trabalho), `vault` (cofre seguro de chaves).
5. **Servidor MCP Stdio Local**: JSON-RPC 2.0 com 8 ferramentas e 3 recursos ao vivo (`tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`).

---

## 🚀 Início Rápido

```bash
# Assistente interativo no terminal
node bin/tidy.js

# Salvar e recuperar memórias
node bin/tidy.js memory save "Projeto utiliza Next.js 16"
node bin/tidy.js memory recall "Next.js"

# Iniciar servidor MCP
node scripts/mcp_server.js
```

## 📄 Licença

Apache-2.0 © 2026 TidyFactor Team.
