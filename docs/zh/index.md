# 🤖 Tidy `v1.4.2`
### 具有持久 SQLite 记忆与本地 Stdio MCP 服务器的独立个人助理智能体

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)

[ English ](/en/) • [ العربية ](/) • [ Español ](/es/) • [ Deutsch ](/de/) • [ Français ](/fr/) • [ Português ](/pt/) • [ 中文 ](/zh/) • [ فارسی ](/fa/)

---

## 🌟 概述与核心价值

**Tidy** 是一个独立的个人助理层，直接在单一本地 SQLite 数据库上运行，并将其作为永久的唯一真实可信来源（SSOT）。

### 核心特性
1. **零配置启动**：基于 Node.js 原生 `node:sqlite`（Node.js >= 22），无需外部 C++ 编译链。自动创建 `~/.tidy/tidy.db`，开启 WAL 模式、外键约束并建立 FTS5 双语全文索引。
2. **3环上下文架构 (3-Ring Context)**：
   - **Ring 0（主权配置）**：用户身份与助理语气（约 150 tokens）。
   - **Ring 1（领域防火墙）**：在 `dev`、`marketing`、`personal` 模式间严格隔离上下文。
   - **Ring 2（动态工作记忆）**：基于 FTS5 BM25 算法精准召回历史决策。
3. **独立商业管理套件**：B2B 客户管理 (CRM)、自动化发票、商业提案与实时现金流仪表板。
4. **4 款内置微型应用**：`tasks`（任务管理）、`snippets`（代码段）、`journal`（工作日志）、`vault`（加密密码库）。
5. **本地 Stdio MCP 服务器**：JSON-RPC 2.0 标准，提供 16 项智能工具与 4 项实时上下文资源。

---

## 🚀 快速上手

```bash
# 启动交互式终端向导
tidy

# 记录与搜索记忆
tidy m "架构决策记录"
tidy q "SQLite"
```

## 📄 开源许可

Apache-2.0 © 2026 TidyFactor Team.
