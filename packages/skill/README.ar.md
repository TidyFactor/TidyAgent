<div align="center" dir="rtl">

# 🤖 تايدي Tidy `v1.1.0`
### نظام المساعد الشخصي السيادي المستقل بذاكرة SQLite دائمة وخادم MCP محلي

امنح وكلاء الذكاء الاصطناعي (**Google Antigravity, Claude Code, Cursor, OpenAI Codex, Windsurf**) طبقة مساعد شخصي سيادي يعمل باستقلالية تامة، مع ذاكرة دائمة عبر SQLite، وتفويض للوكلاء الفرعيين، ومكتبة تطبيقات مصغرة، وبحث فوري سريع بنصوص FTS5.

[![npm version](https://img.shields.io/badge/الإصدار-1.1.0-blue.svg?style=for-the-badge)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/الترخيص-Apache--2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Ecosystem](https://img.shields.io/badge/المنظومة-TidyFactor--Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/الوكلاء-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](SKILL.md)
[![Architect Score](https://img.shields.io/badge/مطابقة%20المعمارية-15%2F15%20نجاح%20(100%25)-green.svg?style=for-the-badge)](#-المعمارية-والحوكمة)

[ English ](README.md) • [ العربية ](README.ar.md) • [ Español ](README.es.md) • [ Deutsch ](README.de.md) • [ Français ](README.fr.md) • [ Português ](README.pt.md) • [ 中文 ](README.zh.md) • [ فارسی ](README.fa.md)

</div>

---

## 🌟 نظرة عامة والقيمة الجوهرية

نظام **Tidy** هو طبقة تشغيلية متكاملة لمساعد شخصي ذكي يستند إلى قاعدة بيانات SQLite محلية كـ Single Source of Truth (SSOT) دائمة الاتصال، ويعمل محلياً بالكامل دون أي اعتماديات سحابية إجبارية.

### المزايا المعمارية الأساسية
1. **التهيئة التلقائية الصامتة (Zero-Config Bootstrap)**: يقوم النظام بإنشاء ملف `~/.tidy/tidy.db` وتفعيل نمط WAL وتطبيق الجداول الـ 8 وفهرس نصوص FTS5 عند أول استدعاء دون تدخل يدوي.
2. **معمارية السياق ثلاثية الحلقات (3-Ring Context Architecture)**:
   - **الحلقة 0 (البروفايل الحاكم)**: الهوية الدائمة، لغة التخاطب، والنبرة (~150 توكن).
   - **الحلقة 1 (سياق العمل والجدار الناري)**: تبديل فوري بين أوضاع العمل (`dev`, `marketing`, `personal`) وعزل المجالات لمنع تشتت السياق.
   - **الحلقة 2 (الذاكرة الديناميكية المسترجعة)**: استدعاء لحظي بالكلمات المفتاحية عبر خوارزمية BM25 لجلب القرارات والأنماط المعمارية ذات الصلة فقط.
3. **وكلاء فرعيين مخصصين (Sub-Agents)**: أدوار مدمجة جاهزة (`planner`, `coder`, `researcher`, `scribe`) مع سياق محقون وصلاحيات أدوات محددة.
4. **مكتبة تطبيقات مصغرة (Micro-Apps)**: إدارة المهام (`tasks`)، قصاصات الأكواد (`snippets`)، اليوميات والملاحظات (`journal`)، والخزنة الآمنة (`vault`).
5. **خادم MCP محلي (Stdio JSON-RPC 2.0)**: تواصل فوري مع المحررات لاستدعاء الأدوات وقراءة السياق الحي.

---

## 🛠️ دليل الاستخدام السريع (Quick Start)

### 1. المعالج التفاعلي الحديث (Interactive Terminal UI - موصى به)
شغّل الأمر مباشرة بدون أي وسائط لفتح واجهة Clack التفاعلية الفورية مع قوائم الاختيار ومؤشرات التحميل المتحركة:

```bash
node bin/tidy.js
# أو بشكل صريح:
node bin/tidy.js ui
```

### 2. الفحص والتهيئة وحالة المساعد
```bash
node bin/tidy.js init
node bin/tidy.js whoami
```

### 3. حفظ واسترجاع الذاكرة
```bash
# حفظ قرار معماري أو معلومة هامة
node bin/tidy.js memory save "المشروع يعتمد Next.js 16 مع عزل صارم للمستأجرين"

# البحث بالكلمات المفتاحية عبر FTS5
node bin/tidy.js memory recall "Next.js"
```

### 4. تبديل سياق العمل والجدار الناري
```bash
node bin/tidy.js context list
node bin/tidy.js context switch ctx_dev
```

### 5. استدعاء وتفويض المهام للوكلاء الفرعيين
```bash
node bin/tidy.js agent run coder "مراجعة أداء مخطط قاعدة البيانات"
```

### 6. تشغيل التطبيقات المصغرة (المهام، القصاصات، الخزنة)
```bash
node bin/tidy.js app task add "تطبيق مراجعة الأمان"
node bin/tidy.js app task list
node bin/tidy.js app snippet add "sqlite_conn" "const { DatabaseSync } = require('node:sqlite');"
node bin/tidy.js app vault set API_KEY "sk-secret-key"
```

---

## 🔌 ربط خادم MCP مع محررات الذكاء الاصطناعي

أضف الإعداد التالي في ملف `mcp_config.json` الخاص بـ Antigravity IDE أو Cursor أو Claude:

```json
{
  "mcpServers": {
    "tidy": {
      "command": "node",
      "args": ["path/to/tidy/scripts/mcp_server.js"]
    }
  }
}
```

### الأدوات المتاحة (Tools):
- `tidy_recall`: البحث الفوري في الذاكرة بالكلمات المفتاحية عبر FTS5.
- `tidy_memorize`: حفظ القرارات والأنماط والمعلومات الجديدة.
- `tidy_get_context`: قراءة سياق العمل النشط والبروفايل الحاكم.
- `tidy_switch_context`: تبديل سياق العمل والمجال فورياً.
- `tidy_task_add` & `tidy_task_list`: إدارة ومتابعة المهام.
- `tidy_exec_subagent`: تفويض المهام للوكلاء الفرعيين المتخصصين.
- `tidy_db_stats`: فحص صحة قاعدة البيانات وإحصائيات التخزين.

---

## 🏛️ المعمارية والحوكمة

تلتزم مهارة Tidy التزاماً تاماً بـ **القواعد الهيكلية الـ 15** المعتمدة في TidyFactor Skills-LAB:
- **انضباط المرسل (Dispatcher Discipline)**: ملف `SKILL.md` لا يتجاوز ~350 توكن، مع مضادات استدعاء واضحة (Anti-triggers).
- **طبقة القرار السياقية (CDL v2.0)**: استخدام معادلة فرق السياق لعدم استجواب المستخدم عن أي بيانات مسجلة في SQLite.
- **عزل الذاكرة التشغيلية**: خلو ملفات الذاكرة من السرد التسويقي وحصرها في المخططات التقنية والجداول.

---

## 📄 الترخيص

مرخص تحت رخصة Apache-2.0 © 2026 فريق TidyFactor.
