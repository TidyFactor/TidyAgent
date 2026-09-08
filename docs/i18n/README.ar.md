<div align="center" dir="rtl">

# 🤖 تايدي Tidy `v1.4.2`
### نظام المساعد الشخصي وإدارة الأعمال السيادية المستقل بذاكرة SQLite دائمة وخادم MCP محلي

امنح وكلاء الذكاء الاصطناعي (**Google Antigravity, Claude Code, Cursor, OpenAI Codex, Windsurf**) طبقة مساعد شخصي سيادي يعمل باستقلالية تامة، مع ذاكرة دائمة عبر SQLite، واكتشاف المهارات المجتمعية وتحويلها إلى وكلاء متخصصين، وتوليد مهام ذاتية الاكتفاء (Self-Contained Task Briefs)، وإدارة كاملة لخط أنابيب العملاء (CRM) والفواتير والتدفقات المالية، وبحث فوري سريع بنصوص FTS5.

[![npm version](https://img.shields.io/badge/الإصدار-1.4.2-blue.svg?style=for-the-badge)](../../package.json)
[![License: Apache-2.0](https://img.shields.io/badge/الترخيص-Apache--2.0-blue.svg?style=for-the-badge)](../../LICENSE)
[![Ecosystem](https://img.shields.io/badge/المنظومة-TidyFactor--Skills--LAB-purple.svg?style=for-the-badge)](https://github.com/TidyFactor)
[![Compatibility](https://img.shields.io/badge/الوكلاء-Antigravity%20|%20Claude%20|%20Cursor%20|%20Codex-orange.svg?style=for-the-badge)](../../packages/skill/SKILL.md)
[![Architect Score](https://img.shields.io/badge/مطابقة%20المعمارية-15%2F15%20نجاح%20(100%25)-green.svg?style=for-the-badge)](#-المعمارية-والحوكمة)

[ English ](../../README.md) • [ العربية ](README.ar.md) • [ دليل الاستخدام الشامل ](../user_manual.ar.md) • [ مواصفات المعمارية ](../specs/architecture_spec.ar.md)

</div>

---

## 🌟 نظرة عامة وهيكلية المنظومة (Platform Topology)

نظام **Tidy** هو منظومة تشغيلية متكاملة لمساعد شخصي وإدارة أعمال سيادية تستند إلى قاعدة بيانات SQLite محلية كـ Single Source of Truth (SSOT) دائمة الاتصال، وتعمل محلياً بالكامل ومقسّمة وفق معمارية النواة المصغرة وحزم المجالات المستقلة (Pluggable Microkernel):

### 📦 حزم المنظومة والتطبيقات (Ecosystem Packages & Apps)
- **`@tidy/core` (`packages/core`)**: نواة المنظومة المعتمدة على `node:sqlite` المدمج بدون أي مجمّعات C++، توفر نقطة توسعة المخططات `registerSchema()`، وفهرسة FTS5 ثنائية اللغة، ونموذج الحلقات الثلاث، ومحرك اكتشاف المهارات المجتمعية (`skills-loader.js`)، ومولّد موجزات المهام ذاتية الاكتفاء (`brief-generator.js`)، والوكلاء والتطبيقات المصغرة (Tasks, Snippets, Journal, Vault).
- **`@tidy/office` (`packages/office`)**: حزمة إدارة الأعمال والمكتب المستقلة تماماً، ترث وتتفوق على منظومة PocketOffice السابقة؛ تدير خط أنابيب العملاء (CRM)، الفواتير المجزأة المحسوبة آلياً، عروض الأسعار، تتبع المصروفات، كشف التدفقات المالية (Cashflow)، وجدول المواعيد، مع تجميع ملف العميل الاستخباراتي بالذكاء الاصطناعي (AI Client Dossier) وأداة استيراد وترقية بيانات PocketOffice القديمة بضغطة زر.
- **`@tidy/cli` (`packages/cli`)**: محرك أوامر الطرفية المكتمل والمعالج التفاعلي المرئي `@clack/prompts`.
- **`@tidy/mcp` (`packages/mcp`)**: خادم Stdio JSON-RPC 2.0 MCP المتكامل (16 أداة ذكية + 4 موارد حية تشمل الذاكرة والمجالات والمهام والتدفق المالي اللحظي).
- **`@tidy/skill` (`packages/skill`)**: مهارة TidyFactor الرسمية المعتمدة وفق القواعد الـ 15 وميثاق CDL v2.0.
- **`@tidy/desktop` (`apps/desktop`)**: تطبيق سطح المكتب بنظام ويندوز مبني بتقنية Electron بأمان `contextIsolation: true` وشاشة HUD طافية مستدعاة بالاختصار العالمي `Alt+Space` مع تبويبات مخصصة للـ CRM والفواتير والتدفق النقدي.
- **`apps/web`**: واجهة ويب لإدارة المنظومة عبر المتصفح على المنفذ `3840`.

### المزايا المعمارية الأساسية
1. **التهيئة والترقية التلقائية الصامتة (Zero-Config Bootstrap & Migration)**: يقوم النظام بإنشاء ملف `~/.tidy/tidy.db` تلقائياً وتفعيل نمط WAL وبناء فهارس نصوص FTS5 وتطبيق جداول الحزم الممتدة.
2. **معمارية السياق ثلاثية الحلقات (3-Ring Context Architecture)**:
   - **الحلقة 0 (البروفايل الحاكم)**: الهوية الدائمة، لغة التخاطب، والنبرة (~150 توكن).
   - **الحلقة 1 (سياق العمل والجدار الناري)**: تبديل فوري بين أوضاع العمل (`dev`, `marketing`, `personal`) وعزل المجالات لمنع تشتت السياق.
   - **الحلقة 2 (الذاكرة الديناميكية المسترجعة)**: استدعاء لحظي بالكلمات المفتاحية عبر خوارزمية BM25 لجلب القرارات والأنماط المعمارية ذات الصلة فقط.
3. **مركز المهارات والوكلاء الفرعيين (Skills & Sub-Agents Hub)**: أدوار مدمجة جاهزة (`planner`, `coder`, `researcher`, `scribe`)، بالإضافة إلى دمج فوري وتلقائي لكافة مهارات مجتمع TidyFactor كوكلاء فرعيين مباشرين.
4. **توليد موجزات المهام المستقلة (Self-Contained Task Briefs)**: تركيب موجز مهام ماركداون متكامل يجمع الهدف، وسياق الحلقات الثلاث، وقواعد المهارة، ومصفوفة التحقق الذاتي.
5. **جناح إدارة الأعمال السيادي (Sovereign Business Suite)**: تتبع الصفقات، إصدار الفواتير الرسمية وحساب الضرائب والخصومات، كشف التدفقات النقدية اللحظي، وتجميع تقارير العملاء الشاملة.
6. **تعدد واجهات الاستخدام**: سطر الأوامر (CLI)، خادم MCP للوكلاء، تطبيق سطح المكتب (Electron مع شاشة HUD باختصار `Alt+Space`)، وواجهة الويب.

---

## 🛠️ دليل الاستخدام السريع (Quick Start)

> 💡 **للاطلاع على التوثيق التفصيلي الشامل لكافة الأوامر والواجهات، يرجى مراجعة [📖 دليل الاستخدام الشامل (User Manual)](docs/user_manual.ar.md).**

### 1. المعالج التفاعلي الحديث (Interactive Terminal UI - موصى به)
شغّل الأمر مباشرة بدون أي وسائط لفتح واجهة Clack التفاعلية الفورية مع قوائم الاختيار ومؤشرات التحميل المتحركة:

```bash
tidy
# أو بشكل صريح:
tidy ui
```

### 2. الأوامر السريعة المباشرة والذاكرة المعرفية (Fast One-Liners)
أوامر طرفية فائقة السرعة للاستخدام اليومي أثناء البرمجة وإدارة المشاريع:

```bash
# بحث فوري بالذاكرة المعرفية مع نسبة الصلاحية وتقييم النجوم
tidy q "WAL mode"
tidy q "auth" --bypass   # تجاوز جدار الحماية للبحث الشامل

# حفظ فوري لقرار معماري أو معلومة في ثانية واحدة
tidy m "استخدام وضع WAL للقراءة المتزامنة عالية الأداء" --cat decision --imp 5

# إدارة سريعة للمهام مع حلقة الأرشفة التلقائية في الذاكرة
tidy task "تأمين بوابة المصادقة OAuth2" --priority urgent --domain dev --agent coder
tidy tasks --pending
tidy done tsk_xxx --result "تم الربط وتأكيد التشفير"  # يؤرشف القرار في الذاكرة آلياً!

# فحص فوري للحالة وجدار الحماية السياقي
tidy who

# تصدير الخزينة السيادية بصيغة أوبسيديان (Obsidian PARA) أو JSON
tidy export --out ./my_vault
tidy export --format json --out ./snapshot.json

# استيراد ملاحظات Markdown خارجية وفهرستها فوراً
tidy import ./notes
```

### 3. الفحص والتهيئة وحالة المساعد
```bash
tidy init
tidy whoami
```

### 3. إدارة العملاء والمبيعات (B2B CRM)
```bash
# استعراض العملاء النشطين
node bin/tidy.js crm list

# إضافة عميل جديد في خط أنابيب المبيعات
node bin/tidy.js crm add --name "شركة التقنية المتقدمة" --company "Advanced Tech" --budget 15000 --status prospect
```

### 4. الفواتير والمدفوعات الآلية (Invoicing Engine)
```bash
# استعراض الفواتير وحالاتها
node bin/tidy.js invoice list

# إصدار فاتورة مجزأة مع ضريبة 15%
node bin/tidy.js invoice create --client cli_xxxx --tax 15 --items '[{"name":"تطوير بوابة دفع","qty":1,"unitPrice":4500}]'

# تسجيل سداد الفاتورة
node bin/tidy.js invoice pay inv_xxxx
```

### 5. المصروفات والتدفقات المالية (Expenses & Cashflow)
```bash
# تسجيل مصروف جديد
node bin/tidy.js expense add --title "اشتراك خادم سحابي" --amount 240 --category hosting

# عرض كشف التدفق النقدي وصافي الأرباح والمستحقات المعلقة
node bin/tidy.js cashflow
```

### 6. تجميع ملف العميل الاستخباراتي بالذكاء الاصطناعي (AI Dossier)
```bash
# توليد ملف استخباراتي شامل يربط العميل بفواتيره وملاحظاته وذاكرة FTS5
node bin/tidy.js dossier cli_xxxx
```

### 7. الترقية والاستيراد من PocketOffice
```bash
# استيراد تلقائي لقواعد وبيانات PocketOffice السابقة
node bin/tidy.js import-pocketoffice --source ./path/to/PocketOffice-Data
```

### 8. حفظ واسترجاع الذاكرة
```bash
# حفظ قرار معماري أو معلومة هامة
node bin/tidy.js memory save "المشروع يعتمد Next.js 16 مع عزل صارم للمستأجرين"

# البحث بالكلمات المفتاحية عبر FTS5
node bin/tidy.js memory recall "Next.js"
```

### 9. تبديل سياق العمل والجدار الناري
```bash
node bin/tidy.js context list
node bin/tidy.js context switch ctx_dev
```

### 10. استدعاء وتفويض المهام للوكلاء الفرعيين وموجز المهام
```bash
node bin/tidy.js agent run coder "مراجعة أداء مخطط قاعدة البيانات"
node bin/tidy.js brief "بناء واجهة لوحة تحكم للتدفقات المالية"
```

---

## 🔌 ربط خادم MCP مع محررات الذكاء الاصطناعي

أضف الإعداد التالي في ملف `mcp_config.json` الخاص بـ Antigravity IDE أو Cursor أو Claude:

```json
{
  "mcpServers": {
    "tidy": {
      "command": "node",
      "args": ["packages/mcp/src/server.js"]
    }
  }
}
```

### الأدوات المتاحة (16 أداة ذكية):
- **الذاكرة والسياق**: `tidy_recall`, `tidy_memorize`, `tidy_get_context`, `tidy_switch_context`.
- **المهام والوكلاء**: `tidy_task_add`, `tidy_task_list`, `tidy_exec_subagent`, `tidy_list_skills`, `tidy_synthesize_brief`.
- **صيانة النظام**: `tidy_db_stats`.
- **الأعمال والمكتب (`@tidy/office`)**:
  - `tidy_crm_list`: استعراض خط أنابيب العملاء وبيانات الاتصال.
  - `tidy_crm_add`: تسجيل عميل جديد بميزانيته ومرحلته البيعية.
  - `tidy_invoice_list`: استعراض الفواتير وحالات السداد والمستحقات.
  - `tidy_invoice_create`: إصدار فاتورة رسمية مجزأة محسوبة الضرائب والخصومات آلياً.
  - `tidy_cashflow_summary`: استدعاء كشف السيولة وصافي الأرباح لحظياً.
  - `tidy_client_dossier`: تجميع ملف تنفيذي استخباراتي فوري للعميل بالذكاء الاصطناعي.

### الموارد الديناميكية الحية (Live Resources):
- `tidy://profile`: بروفايل المستخدم ونبرة التخاطب المعتمدة.
- `tidy://context/current`: سياق العمل النشط وحدود العزل.
- `tidy://tasks/pending`: قائمة المهام المعلقة بالترتيب الزمني.
- `tidy://office/cashflow`: كشف التدفق المالي اللحظي (P&L Telemetry).

---

## 🏛️ المعمارية والحوكمة

تلتزم منظومة Tidy التزاماً تاماً بـ **القواعد الهيكلية الـ 15** المعتمدة في TidyFactor Skills-LAB:
- **انضباط المرسل (Dispatcher Discipline)**: ملف `SKILL.md` لا يتجاوز ~350 توكن، مع مضادات استدعاء واضحة (Anti-triggers).
- **طبقة القرار السياقية (CDL v2.0)**: استخدام معادلة فرق السياق لعدم استجواب المستخدم عن أي بيانات مسجلة في SQLite.
- **عزل الذاكرة التشغيلية**: خلو ملفات الذاكرة من السرد التسويقي وحصرها في المخططات التقنية والجداول.
- **معمارية الحزم المستقلة**: فصل النواة عن منطق الأعمال لتمكين تخصيص النظام للمطورين، مدراء السيرفرات، أو الوكالات.

---

## 📄 الوثائق والترخيص

- [📖 دليل الاستخدام الشامل (User Manual)](docs/user_manual.ar.md)
- [🏛️ مواصفات المعمارية السيادية (Architecture Spec)](docs/specs/architecture_spec.ar.md)
- [🗺️ خارطة طريق تطوير TidyOffice](docs/specs/tidyoffice_evolution_roadmap.ar.md)
- [📝 سجل التغييرات (CHANGELOG)](CHANGELOG.md)

مرخص تحت رخصة Apache-2.0 © 2026 فريق TidyFactor.
