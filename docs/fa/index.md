<div dir="rtl">

# 🤖 تايدى Tidy `v1.4.2`
### عامل دستیار شخصی مستقل با حافظه پایدار SQLite و سرور محلی Stdio MCP

[![npm version](https://img.shields.io/badge/version-1.4.2-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge)](https://github.com/TidyFactor/Agent/blob/main/LICENSE)
[![Ecosystem](https://img.shields.io/badge/TidyFactor-Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)

[ English ](/en/) • [ العربية ](/) • [ Español ](/es/) • [ Deutsch ](/de/) • [ Français ](/fr/) • [ Português ](/pt/) • [ 中文 ](/zh/) • [ فارسی ](/fa/)

---

## 🌟 نمای کلی و ارزش بنیادین

**Tidy** لایه عامل دستیار هوشمند مستقل است که بر بستر یک پایگاه‌داده محلی SQLite به عنوان منبع یگانه حقیقت (SSOT) دائمی فعالیت می‌کند.

### قابلیت‌های کلیدی
1. **راه‌اندازی بدون پیکربندی (Zero-Config)**: استفاده از موتور پیش‌فرض `node:sqlite` (Node.js >= 22). ایجاد خودکار `~/.tidy/tidy.db` با حالت WAL، کلیدهای خارجی و ایندکس FTS5.
2. **معماری سه‌حلقه‌ای زمینه (3-Ring Context)**:
   - **حلقه ۰ (پروفایل مستقل)**: هویت کاربر و لحن دستیار (~۱۵۰ توکن).
   - **حلقه ۱ (فایروال حوزه)**: تفکیک دقیق بین حالت‌های توسعه، بازاریابی و شخصی.
   - **حلقه ۲ (حافظه کاری پویا)**: بازیابی سریع تصمیم‌ها و الگوها با FTS5 BM25.
3. **بسته ابزار تجاری یکپارچه**: مدیریت مشتریان (CRM)، صدور فاکتور و تحلیل جریان نقدینگی.
4. **۴ میکرو-برنامه یکپارچه**: `tasks` (مدیریت وظایف)، `snippets` (تکه‌کدها)، `journal` (یادداشت‌ها)، `vault` (کلیدهای رمزگذاری‌شده).
5. **سرور محلی Stdio MCP**: استاندارد JSON-RPC 2.0 با ۱۶ ابزار هوشمند و ۴ منبع زنده.

---

## 🚀 شروع سریع

```bash
# دستیار تعاملی در ترمینال
tidy

# ثبت و بازیابی حافظه
tidy m "تصمیم معماری"
tidy q "SQLite"
```

## 📄 مجوز

Apache-2.0 © 2026 TidyFactor Team.

</div>
