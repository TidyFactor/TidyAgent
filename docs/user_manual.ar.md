# 📖 دليل الاستخدام الشامل لمنظومة تايدي (Tidy Ecosystem User Manual)
### الإصدار: `v1.4.2` — المعمارية السيادية متعددة الحزم (Microkernel & Domain Packs)

---

## 📑 فهرس المحتويات
1. [نظرة عامة والمعمارية السيادية](#1-نظرة-عامة-والمعمارية-السيادية)
2. [متطلبات التشغيل والتثبيت السريع](#2-متطلبات-التشغيل-والتثبيت-السريع)
3. [المعالج التفاعلي الفوري (Interactive Terminal Wizard)](#3-المعالج-التفاعلي-الفوري-interactive-terminal-wizard)
4. [مرجع أوامر سطر الأوامر الشامل (CLI Reference)](#4-مرجع-أوامر-سطر-الأوامر-الشامل-cli-reference)
   - [أوامر النواة الأساسية (@tidy/core)](#-أوامر-النواة-الأساسية-tidycore)
   - [أوامر حزمة إدارة الأعمال المكتبية (@tidy/office)](#-أوامر-حزمة-إدارة-الأعمال-المكتبية-tidyoffice)
5. [تكامل خادم MCP مع بيئات وكلاء الذكاء الاصطناعي](#5-تكامل-خادم-mcp-مع-بيئات-وكلاء-الذكاء-الاصطناعي)
6. [تطبيق سطح المكتب المستقل (Tidy Desktop Studio)](#6-تطبيق-سطح-المكتب-المستقل-tidy-desktop-studio)
7. [سيناريوهات استخدام عملية واقعية (End-to-End Workflows)](#7-سيناريوهات-استخدام-عملية-واقعية-end-to-end-workflows)
8. [الحوكمة، الصيانة والنسخ الاحتياطي (Data Hygiene & SSOT)](#8-الحوكمة-الصيانة-والنسخ-الاحتياطي-data-hygiene--ssot)

---

## 1. نظرة عامة والمعمارية السيادية

نظام **تايدي (Tidy)** هو منظومة تشغيلية متكاملة للمساعد الشخصي وإدارة الأعمال السيادية، مصممة خصيصاً للمطورين، المستشارين، ورواد الأعمال الرقميين. تم بناء المنظومة حول مبدأ **السيادة التامة على البيانات (Data Sovereignty)** بدون أي اعتماد على سحابة خارجية أو خوادم وسيطة، بالاعتماد على قاعدة بيانات SQLite واحدة نشطة بنمط WAL عالي السرعة كـ **مصدر وحيد للحقيقة (Single Source of Truth - SSOT)**.

### معمارية النواة المصغرة المستقلة (Pluggable Microkernel)
بدءاً من الإصدار `v1.4.0`، تم اعتماد مبدأ الفصل التام بين نواة المساعد الذكي وحزم مجالات الأعمال:
- **`@tidy/core` (النواة الحاكمة)**: محرك خالص فائق السرعة، مسؤول عن إدارة قاعدة البيانات، البحث بالكلمات المفتاحية عبر نصوص FTS5 وخوارزمية BM25، إدارة معمارية السياق ثلاثية الحلقات (3-Ring Context)، تشغيل الوكلاء الفرعيين، وتطبيقات الإنتاجية الفردية (المهام، القصاصات، اليوميات، الخزنة).
- **`@tidy/office` (حزمة الأعمال المكتبية)**: حزمة مستقلة تماماً وقابلة للفصل، تضيف قدرات إدارة العملاء (CRM)، الفواتير المحسوبة آلياً، عروض الأسعار، إدارة المصروفات، جدول المواعيد، وتوليد ملفات العملاء الاستخباراتية (AI Dossier) مع أداة استيراد وترقية قواعد بيانات PocketOffice السابقة بضغطة زر.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tidy Surfaces & Interfaces                      │
│   CLI Engine (Terminal)  │  Desktop Studio (Electron)  │  Stdio MCP    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    @tidy/core (Sovereign Kernel)                       │
│  - 3-Ring Context Engine    - FTS5 BM25 Bilingual Semantic Search     │
│  - Subagents Scheduler      - Micro-Apps (Tasks, Snippets, Vault)     │
│  - Extension Hook: registerSchema(packName, ddlSql)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pluggable Extension
┌───────────────────────────────────▼────────────────────────────────────┐
│                   @tidy/office (Domain Pack Suite)                     │
│  - B2B CRM Pipeline         - Automated Itemized Invoicing            │
│  - Commercial Proposals     - Expense & Cashflow Telemetry            │
│  - AI Evidence Dossier      - PocketOffice Migration Bridge           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Single Source of Truth (SSOT): ~/.tidy/tidy.db             │
│            PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. متطلبات التشغيل والتثبيت السريع

### المتطلبات الأساسية
- **بيئة التشغيل**: Node.js بإصدار `>= 22.0.0` (حيث يعتمد النظام على `node:sqlite` المدمج دون الحاجة لأي مكتبات مجمعة عبر node-gyp أو برامج بناء C++).
- **نظام التشغيل**: Windows 10/11، macOS (x64 / Apple Silicon)، أو Linux.
- **مساحة القرص**: لا تتجاوز 50 ميغابايت للنظام بالكامل.

### التثبيت والإعداد في 3 خطوات
1. استنساخ المستودع والدخول للمجلد:
   ```bash
   git clone https://github.com/TidyFactor/tidy-agent.git
   cd tidy-agent
   ```
2. تثبيت الحزم التابعة للواجهات:
   ```bash
   npm install
   ```
3. تهيئة قاعدة البيانات المحلية:
   ```bash
   node bin/tidy.js init
   ```
   *سيقوم النظام آلياً بإنشاء المجلد `~/.tidy/` وقاعدة بيانات `tidy.db` مع تفعيل نمط WAL وبناء فهارس FTS5 بدون أي تدخل يدوي.*

---

## 3. المعالج التفاعلي الفوري (Interactive Terminal Wizard)

للحصول على أفضل تجربة استخدام موجهة وسريعة عبر الطرفية، شغّل المعالج المبني بمكتبة `@clack/prompts`:

```bash
node bin/tidy.js
# أو بشكل صريح:
node bin/tidy.js ui
```

### إمكانيات المعالج:
- **المؤشرات المرئية المتحركة (Spinners)**: متابعة فورية لعمليات الحفظ والبحث.
- **التنقل التفاعلي**: استخدام الأسهم لاختيار المهام، المجالات، وعمليات المكتب.
- **إدارة كاملة للنظام**: تسجيل ذاكرة جديدة، تصفح العملاء، إصدار الفواتير، وتبديل سياق العمل فوراً.

---

## 4. مرجع أوامر سطر الأوامر الشامل (CLI Reference)

يعمل الأمر الرئيسي عبر `node bin/tidy.js <command>` (أو اختصاراً `tidy` بعد تثبيت الحزمة عالمياً).

### 🔹 أوامر النواة الأساسية (`@tidy/core`)

#### 1. الاستعلام والتهيئة (`init`, `whoami`)
```bash
# تهيئة قاعدة البيانات أو التحقق من جاهزية الجداول
node bin/tidy.js init

# عرض بروفايل المستخدم النشط وإحصائيات الذاكرة والسياق الحالي
node bin/tidy.js whoami
```

#### 2. إدارة الذاكرة السيادية (`memory`)
تعتمد الذاكرة على محرك نصوص SQLite FTS5 مع خوارزمية ترتيب BM25 لدعم اللغتين العربية والإنجليزية:
```bash
# حفظ قرار معماري أو معلومة جديدة
node bin/tidy.js memory save "تم اعتماد Next.js 16 مع نظام العزل متعدد المستأجرين"

# حفظ معلومة مع تحديد التصنيف والأهمية ومستوى الطبقة (core, project, session)
node bin/tidy.js memory save "سياسة أمان الـ IPC تعتمد contextIsolation" --category decision --tier core --importance 5

# استرجاع وبحث فوري بالكلمات المفتاحية
node bin/tidy.js memory recall "Next.js"

# استعراض أحدث الذكريات المحفوظة
node bin/tidy.js memory list --limit 10

# حذف سجل ذاكرة محدد عبر المعرف
node bin/tidy.js memory forget mem_abc123
```

#### 3. تبديل سياق العمل والجدار الناري (`context`)
يمنع الجدار الناري السياقي (Contextual Firewall) تسرب المعلومات والتعليمات بين المشروعات البرمجية والتسويقية:
```bash
# عرض سياقات العمل المسجلة
node bin/tidy.js context list

# التبديل إلى سياق التطوير البرمجي
node bin/tidy.js context switch ctx_dev

# التبديل إلى سياق التسويق وإدارة النمو
node bin/tidy.js context switch ctx_marketing
```

#### 4. اكتشاف المهارات وتفويض الوكلاء الفرعيين (`skills`, `agent`, `brief`)
```bash
# فحص المهارات المجتمعية المتوفرة في بيئة العمل وتسجيلها كوكلاء
node bin/tidy.js skills scan

# عرض قائمة الوكلاء المتاحين (coder, planner, marketing, design, etc.)
node bin/tidy.js skills list

# تفويض وكيل متخصص لتنفيذ مهمة محددة
node bin/tidy.js agent run coder "مراجعة كفاءة الاستعلامات في SQLite WAL"

# توليد موجز مهام ذاتي الاكتفاء (Self-Contained Task Brief) بصيغة Markdown
node bin/tidy.js brief "بناء واجهة لوحة تحكم للتدفقات المالية"
```

#### 5. التطبيقات المصغرة الفردية (`app`)
```bash
# إدارة المهام
node bin/tidy.js app task add "مراجعة عقد العميل الجديد" --domain marketing --priority high
node bin/tidy.js app task list --status pending

# قصاصات الأكواد
node bin/tidy.js app snippet add "sqlite_wal" "PRAGMA journal_mode = WAL;"

# اليوميات والملاحظات
node bin/tidy.js app journal add "تم إطلاق الإصدار 1.4.0 بنجاح اليوم"

# الخزنة الآمنة للمفاتيح المحلية
node bin/tidy.js app vault set API_KEY "sk-local-secret"
node bin/tidy.js app vault get API_KEY
```

---

### 💼 أوامر حزمة إدارة الأعمال المكتبية (`@tidy/office`)

تتيح حزمة `@tidy/office` إدارة المنشأة أو العمل الحر بأسلوب احترافي متكامل:

#### 1. إدارة العملاء والمبيعات (`crm`)
```bash
# استعراض قائمة العملاء النشطين
node bin/tidy.js crm list

# تصفية العملاء حسب المرحلة البيعية (lead, prospect, active, inactive)
node bin/tidy.js crm list --status active

# إضافة عميل جديد مع تفاصيل الشركة والميزانية المقدرة
node bin/tidy.js crm add --name "شركة التقنية المتقدمة" --company "Advanced Tech Ltd" --email "info@adtech.example" --phone "+966500000000" --budget 15000 --status prospect
```

#### 2. الفواتير والمدفوعات الآلية (`invoice`)
محرك حسابي دقيق يقوم بحساب المجموع الفرعي، الضرائب، الخصومات، والمجموع النهائي تلقائياً:
```bash
# استعراض الفواتير
node bin/tidy.js invoice list

# إصدار فاتورة رسمية مجزأة للعميل (بصيغة عناصر JSON مفصلة)
node bin/tidy.js invoice create --client cli_xxxx --tax 15 --due 2026-10-01 --items '[{"name":"تطوير بوابة دفع","qty":1,"unitPrice":4500},{"name":"دعم فني شهري","qty":2,"unitPrice":500}]'

# تسجيل سداد فاتورة بالكامل
node bin/tidy.js invoice pay inv_xxxx

# إلغاء فاتورة
node bin/tidy.js invoice void inv_xxxx
```

#### 3. تسجيل المصروفات التشغيلية (`expense`)
```bash
# استعراض المصروفات المسجلة
node bin/tidy.js expense list

# تسجيل مصروف جديد وتصنيفه (software, marketing, hardware, hosting, legal, etc.)
node bin/tidy.js expense add --title "اشتراك خوادم سحابية" --amount 240 --category hosting --date 2026-09-08
```

#### 4. كشف التدفقات المالية والربحية (`cashflow`)
يعرض كشفاً فورياً بالوضع المالي للمنشأة:
```bash
node bin/tidy.js cashflow
```
*المخرجات تتضمن:*
- **إجمالي الإيرادات المحصلة (Total Revenue)**.
- **إجمالي المصروفات التشغيلية (Total Expenses)**.
- **صافي الأرباح التشغيلية (Net Profit)**.
- **هامش الربح التشغيلي (Profit Margin %)**.
- **المستحقات المعلقة لدى العملاء (Pending Receivables)**.

#### 5. تجميع ملف العميل الاستخباراتي بالذكاء الاصطناعي (`dossier`)
يقوم النظام بتجميع ودمج ملف متكامل للعميل في ثوانٍ معدودة يدمج: بيانات التواصل، سجل الفواتير والمبالغ المسددة، عروض الأسعار السابقة، المهام الجارية، وسجلات الذاكرة المؤسسية ذات الصلة عبر خوارزمية FTS5:
```bash
node bin/tidy.js dossier cli_xxxx
```

#### 6. الترقية والاستيراد من PocketOffice (`import-pocketoffice`)
استيراد تلقائي لكافة قواعد وتطبيقات PocketOffice السابقة (JSON) ودمجها بسلاسة داخل قاعدة SQLite السيادية دون أي تكرار:
```bash
# استيراد من مسار مخصص
node bin/tidy.js import-pocketoffice --source ./path/to/PocketOffice-Data
```

---

## 5. تكامل خادم MCP مع بيئات وكلاء الذكاء الاصطناعي

يوفر تايدي خادم Model Context Protocol مدمج يعمل عبر Stdio JSON-RPC 2.0، مما يسمح لوكلاء التطوير (**Google Antigravity, Claude Code, Cursor, Windsurf, Codex**) بالاستفادة المباشرة من الذاكرة والعملاء والفواتير.

### إعداد الربط في ملف `mcp_config.json`:
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

### الأدوات المتاحة لوكلاء الذكاء الاصطناعي (16 أداة):

| اسم الأداة | الغرض والوصف |
| :--- | :--- |
| `tidy_recall` | استرجاع فوري للذاكرة والقرارات المعمارية بالكلمات المفتاحية عبر FTS5 BM25. |
| `tidy_memorize` | حفظ المعارف والقرارات والأنماط المعمارية في قاعدة البيانات. |
| `tidy_get_context` | قراءة سياق العمل النشط، البروفايل الحاكم، وإعدادات الجدار الناري. |
| `tidy_switch_context` | تبديل سياق العمل والمجال بين البرمجة، التسويق، أو الإدارة العامة. |
| `tidy_task_add` | إنشاء مهمة جديدة وتوجيهها لمجال عمل ووكيل محدد. |
| `tidy_task_list` | استعراض المهام حسب الحالة، الأولوية، والمجال. |
| `tidy_exec_subagent` | تفويض مهمة لوكيل فرعي متخصص أو مهارة من مهارات TidyFactor. |
| `tidy_list_skills` | استعراض المهارات المجتمعية والوكلاء المتاحين. |
| `tidy_synthesize_brief`| توليد موجز مهام ذاتي الاكتفاء عالي الدقة يجمع السياق وقواعد التحقق. |
| `tidy_db_stats` | فحص مؤشرات صحة قاعدة البيانات وعدد السجلات ومساحة التخزين. |
| `tidy_crm_list` | استعراض قائمة عملاء الـ CRM ومراحل الصفقات وقيمها. |
| `tidy_crm_add` | تسجيل عميل جديد في خط أنابيب المبيعات مع الميزانية والبيانات. |
| `tidy_invoice_list` | استعراض الفواتير وحالات السداد والمبالغ المستحقة. |
| `tidy_invoice_create` | إصدار فاتورة تجارية مجزأة مع احتساب الضرائب والخصومات تلقائياً. |
| `tidy_cashflow_summary`| استدعاء كشف السيولة والتدفق النقدي وصافي الأرباح فورياً. |
| `tidy_client_dossier` | تجميع ملف استخباراتي تنفيذي فوري يربط كل ما يتعلق بالعميل بالذاكرة. |

### الموارد الديناميكية الحية (Live Resources):
- `tidy://profile`: بروفايل المستخدم ونبرة التخاطب المعتمدة.
- `tidy://context/current`: سياق العمل النشط وحدود العزل.
- `tidy://tasks/pending`: قائمة المهام المعلقة بالترتيب الزمني.
- `tidy://office/cashflow`: كشف التدفق المالي اللحظي (P&L Telemetry).

---

## 6. تطبيق سطح المكتب المستقل (Tidy Desktop Studio)

تطبيق مكتبي مخصص لنظام ويندوز والأنظمة المتوافقة مبني بإطار عمل Electron ومصمم وفق أعلى معايير الأمان المؤسسي:
- **أمان صارم**: تفعيل `contextIsolation: true` بالكامل وحظر `nodeIntegration` لمنع أي ثغرات أمنية.
- **قنوات اتصال موثوقة (Typed IPC)**: كافة الاتصالات تمر عبر جسر المعالجة الآمن `contextBridge` وبادئة موحدة `tidy:*` و `tidy:office:*`.
- **شاشة المساعد الطافية السريعة (Quick HUD)**: استدعاء لحظي لشاشة تايدي من أي مكان في النظام عبر الاختصار العالمي `Alt+Space`.
- **دعم اللغة العربية والاتجاه (RTL / LTR)**: تصميم داكن متناسق مع زر تبديل فوري للغة في الهيدر.

### تشغيل وبناء تطبيق سطح المكتب:
```bash
# تشغيل بيئة التطوير
npm run desktop

# بناء حزمة تثبيت ويندوز الرسمية (NSIS Setup)
npm --prefix apps/desktop run build:nsis

# بناء النسخة المحمولة القابلة للتشغيل المباشر دون تثبيت (Portable .exe)
npm --prefix apps/desktop run build:portable
```

---

## 7. سيناريوهات استخدام عملية واقعية (End-to-End Workflows)

### السيناريو الأول: دورة حياة عميل ومشروع بالكامل
1. **تسجيل العميل في الـ CRM**:
   ```bash
   node bin/tidy.js crm add --name "مجموعة الأفق الرقمي" --budget 20000 --status lead
   ```
2. **إصدار فاتورة الدفعة الأولى**:
   ```bash
   node bin/tidy.js invoice create --client cli_xxxx --tax 15 --items '[{"name":"دفعة مقدمة - تصميم هوية ونظام تصميم","qty":1,"unitPrice":8000}]'
   ```
3. **تسجيل السداد عند استلام الحوالة**:
   ```bash
   node bin/tidy.js invoice pay inv_xxxx
   ```
4. **توليد ملف العميل الاستخباراتي للاجتماع التنفيذي**:
   ```bash
   node bin/tidy.js dossier cli_xxxx
   ```

### السيناريو الثاني: تدقيق الأرباح والمصروفات الشهرية
1. **تسجيل مصاريف الحملة الإعلانية**:
   ```bash
   node bin/tidy.js expense add --title "إعلانات تويتر للمشروع" --amount 1200 --category marketing
   ```
2. **استخراج تقرير التدفقات اللحظي**:
   ```bash
   node bin/tidy.js cashflow
   ```
   *يظهر التقرير الفارق اللحظي بين الفواتير المسددة والمصروفات وهامش الربح بدقة تامة.*

### السيناريو الثالث: تفويض وكيل ذكي لحل مهمة برمجية
1. **إضافة مهمة في النظام وتوجيهها للمطور**:
   ```bash
   node bin/tidy.js app task add "كتابة اختبارات تكامل لنمط WAL" --domain tech --agent coder
   ```
2. **توليد موجز المهمة الشامل وتمريره لـ Antigravity أو Claude Code**:
   ```bash
   node bin/tidy.js brief 1
   ```
   *يقوم الوكيل بتنفيذ المطلوب بدقة متناهية لوجود معايير التحقق وسياق المشروع داخلياً دون الحاجة لشرح إضافي.*

---

## 8. الحوكمة، الصيانة والنسخ الاحتياطي (Data Hygiene & SSOT)

لضمان عمل النظام بكفاءة قصوى لسنوات متواصلة دون أي بطء أو تضخم في الملفات:

### 1. ضغط وتفريغ قاعدة البيانات (VACUUM & Optimization)
```bash
# تنفيذ صيانة شاملة وإعادة ترتيب الفهارس
node -e "const { getDb } = require('./packages/core'); getDb().exec('VACUUM;'); console.log('Database optimized successfully.');"
```

### 2. تفريغ سجل التعديلات الميداني (WAL Checkpoint)
يعمل SQLite بنمط Write-Ahead Logging. يمكنك تفريغ التغييرات إلى الملف الرئيسي دون قفل القراءة عبر:
```bash
node -e "const { getDb } = require('./packages/core'); getDb().exec('PRAGMA wal_checkpoint(TRUNCATE);'); console.log('WAL checkpoint complete.');"
```

### 3. النسخ الاحتياطي اللحظي الذري (Zero-Lock Atomic Snapshot)
يمكن أخذ نسخة احتياطية كاملة أثناء عمل النظام بدون أي إيقاف للمستخدم أو الوكلاء:
```bash
node -e "const { getDb } = require('./packages/core'); const backupPath = require('os').homedir() + '/tidy_backup_' + Date.now() + '.db'; getDb().exec(\`VACUUM INTO '\${backupPath}';\`); console.log('Backup created at: ' + backupPath);"
```

### 4. فحص النزاهة الهيكلية (Integrity Check)
```bash
node -e "const { getDb } = require('./packages/core'); const res = getDb().prepare('PRAGMA integrity_check;').get(); console.log(res);"
```

---

<div align="center">

**منظومة تايدي (Tidy Ecosystem)** — الحفاظ على سيادتك الرقمية واستقلاليتك المعرفية.  
مرخص بموجب رخصة **Apache-2.0** © 2026 فريق TidyFactor.

</div>
