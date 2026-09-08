<div align="center" dir="rtl">

# 🤖 مینی‌می Tidy `v1.1.0`
### عامل دستیار شخصی مستقل با حافظه پایدار SQLite و سرور محلی Stdio MCP

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • [ Deutsch ](README.de.md) • [ Français ](README.fr.md) • [ Português ](README.pt.md) • [ 中文 ](README.zh.md) • **[ فارسی ](README.fa.md)**

[![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/Agents-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](SKILL.md)

</div>

---

## 🌟 نمای کلی و ارزش بنیادین

**Tidy** لایه عامل دستیار هوشمند مستقل است که بر بستر یک پایگاه‌داده محلی SQLite به عنوان منبع یگانه حقیقت (SSOT) دائمی فعالیت می‌کند.

### ویژگی‌های اصلی
1. **راه‌اندازی بدون پیکربندی (Zero-Config)**: متکی بر درایور بومی `node:sqlite` در Node.js 22/24 بدون وابستگی به کامپایلرهای C++ یا node-gyp. ایجاد خودکار `~/.tidy/tidy.db` با حالت WAL، کلیدهای خارجی، ۸ جدول رابطه‌ای و نمایه متنی FTS5.
2. **معماری سه‌حلقه‌ای بافتار (3-Ring Context)**:
   - **حلقه ۰ (نمایه مستقل)**: تنظیمات پایدار هویت کاربر و دستیار (~۱۵۰ توکن).
   - **حلقه ۱ (دیواره آتشین دامنه‌ها)**: تفکیک دقیق دامنه‌های `dev`، `marketing` و `personal`.
   - **حلقه ۲ (حافظه کاری پویا)**: بازیابی سریع تصمیمات و قواعد با الگوریتم FTS5 BM25.
3. **موتور CLI دوگانه**: رابط تعاملی مدرن بر پایه `@clack/prompts` همراه با حالت دستوری برای خط‌لوله‌ها.
4. **۴ ابزارک کاربردی درونی**: مدیریت وظایف (`tasks`)، قطعه‌کدها (`snippets`)، یادداشت روزانه (`journal`)، و صندوق امن اطلاعات (`vault`).
5. **سرور محلی Stdio MCP**: پشتیبانی از پروتکل JSON-RPC 2.0 با ۸ ابزار و ۳ منبع داده زنده (`tidy://profile`, `tidy://context/current`, `tidy://tasks/pending`).

---

## 🚀 شروع سریع

```bash
# رابط تعاملی در ترمینال
node bin/tidy.js

# ذخیره و بازیابی حافظه
node bin/tidy.js memory save "پروژه بر پایه Next.js 16 و جداسازی مستأجران است"
node bin/tidy.js memory recall "Next.js"

# راه‌اندازی سرور MCP
node scripts/mcp_server.js
```

## 📄 مجوز

Apache-2.0 © 2026 TidyFactor Team.
