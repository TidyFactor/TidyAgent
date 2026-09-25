<div align="center">

# 🤖 Tidy `v1.8.0`
### 具备持久化 SQLite 记忆与本地 Stdio MCP 服务的自主个人助手智能体

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • [ Deutsch ](README.de.md) • [ Français ](README.fr.md) • [ Português ](README.pt.md) • **[ 中文 ](README.zh.md)** • [ فارسی ](README.fa.md)

[![npm version](https://img.shields.io/badge/version-1.8.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](../../packages/skill/SKILL.md)

</div>

---

## 🌟 概述与核心价值

**Tidy** 是一个运行于单个本地 SQLite 数据库之上的自主个人助手操作系统，该数据库作为其永久的单一事实来源 (SSOT)。

### 核心特性
1. **零配置自启动 (Zero-Config)**：基于原生 `node:sqlite` 驱动（Node.js >= 22），无需外部 C++ 编译器和 node-gyp 构建。首次运行时自动创建 `~/.tidy/tidy.db`，开启 WAL 模式、外键约束、业务数据表以及双语 FTS5 全文索引。
2. **三环上下文架构 (3-Ring Context Architecture)**：
   - **环 0 (自主身份画像)**：永久存储用户身份偏好与助手设定 (~150 tokens)。
   - **环 1 (领域上下文防火墙)**：严格隔离 `dev`、`marketing` 与 `personal` 工作模式。
   - **环 2 (动态工作记忆)**：基于 BM25 算法快速召回关键架构决策与模式。
3. **双模 CLI 引擎**：配备 `@clack/prompts` 交互式终端向导与适用于脚本管道的非交互模式。
4. **内置 4 款实用微应用**：`tasks` (任务看板)、`snippets` (代码与提示词片段)、`journal` (工作日志)、`vault` (安全凭据保管)。
5. **并行多智能体集群与冲突调解 (v1.7.0)**：在隔离沙箱中并发执行专业子智能体，自动化仲裁分歧并合并成果 (`tidy_parallel_dispatch`)。
6. **主权商业与办公套件 (v1.8.0 - `@tidy/office`)**：完整的本地 B2B CRM、商业提案、明细账单、实时现金流分析 (P&L Telemetry)，以及具备 4 款高端主题（Modern, Minimal, Luxury, Corporate）的独立 PDF 导出引擎。
7. **本地 Stdio MCP 生产工具集 (40 工具)**：完整支持 JSON-RPC 2.0 协议，提供 40 个核心生产力工具、9 个实时动态资源，零云端遥测泄露。

---

## 🚀 快速上手

```bash
# 启动终端交互式向导
node bin/tidy.js

# 记忆与召回
node bin/tidy.js memory save "项目采用 Next.js 16 与严格多租户隔离"
node bin/tidy.js memory recall "Next.js"

# 启动 MCP 服务
node scripts/mcp_server.js
```

## 📄 许可证

Apache-2.0 © 2026 TidyFactor Team.
