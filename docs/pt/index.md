# 🤖 Tidy `v1.4.2`
### Agente Assistente Pessoal Soberano com Memória Persistente SQLite e Servidor MCP Stdio Local

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)

[ English ](/en/) • [ العربية ](/) • [ Español ](/es/) • [ Deutsch ](/de/) • [ Français ](/fr/) • [ Português ](/pt/) • [ 中文 ](/zh/) • [ فارسی ](/fa/)

---

## 🌟 Visão Geral e Proposta de Valor

**Tidy** é uma camada de assistente pessoal soberano que opera diretamente sobre um arquivo SQLite local único como sua Fonte Única da Verdade (SSOT) permanente.

### Principais Recursos
1. **Inicialização Sem Configuração**: Usa o motor nativo `node:sqlite` (Node.js >= 22). Sem dependências C++ externas. Cria automaticamente `~/.tidy/tidy.db` com modo WAL, chaves estrangeiras e índice FTS5.
2. **Arquitetura de 3 Anéis de Contexto**:
   - **Ring 0 (Perfil Soberano)**: Identidade do usuário e tom do assistente (~150 tokens).
   - **Ring 1 (Firewall de Domínio)**: Isolamento estrito entre os modos `dev`, `marketing` e `personal`.
   - **Ring 2 (Memória de Trabalho Dinâmica)**: Busca FTS5 BM25 de decisões e regras.
3. **Suite Empresarial Soberana**: Gestão de clientes (CRM), faturamento automático e fluxo de caixa.
4. **4 Micro-Aplicações Integradas**: `tasks` (tarefas), `snippets` (código), `journal` (diário), `vault` (segredos locais).
5. **Servidor MCP Local via Stdio**: JSON-RPC 2.0 com 16 ferramentas inteligentes e 4 recursos dinâmicos.

---

## 🚀 Início Rápido

```bash
# Assistente interativo no terminal
tidy

# Salvar e recuperar
tidy m "Decisão de arquitetura"
tidy q "SQLite"
```

## 📄 Licença

Apache-2.0 © 2026 TidyFactor Team.
