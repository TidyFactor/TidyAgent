# خطة تنفيذ وتوثيق نظام Tidy (Personal Assistant Agent with Memory)

بناءً على التكامل المعماري بين **`tidyfactor-skill-architect`** (للانضباط الهيكلي وحوكمة المهارات) و **`tidyfactor-brain`** (للحوكمة الإدراكية وعزل المجالات وحفظ السياق):

تم صياغة وثيقة المواصفات الفنية الشاملة في: [architecture_spec.ar.md](../specs/architecture_spec.ar.md).

---

## 💡 ما نقترحه لتحقيق أفضل إدارة للسياق وقاعدة البيانات

### 1. أفضل إدارة للسياق (Context Management):
* **نموذج الحلقات الثلاث (3-Ring Context Window)**:
  - **الحلقة 0 (البروفايل الثابت)**: تحميل تلقائي لهوية المستخدم والمساعد وقواعد العمل الدائمة (~150 توكن).
  - **الحلقة 1 (سياق المشروع والجدار الناري)**: عزل المهام البرمجية عن المهام الشخصية أو التسويقية (`Contextual Firewall` من `tidyfactor-brain`).
  - **الحلقة 2 (الذاكرة الديناميكية المسترجعة)**: جلب الحقائق ذات الصلة اللحظية فقط عبر استعلامات FTS5 BM25 لمنع انتفاخ نافذة السياق (Context Bloat).
* **معادلة فرق السياق (Context Delta Formula)**: عدم استجواب المستخدم عن أي حقيقة مسجلة بالفعل في SQLite.

### 2. أفضل إدارة لقاعدة البيانات (SQLite SSOT Management):
* **ضبط عالي الأداء (High-Performance PRAGMAs)**: تفعيل نمط `WAL` لقراءة متوازية وكتابة سريعة، مع `foreign_keys`، وتخزين الذاكرة المؤقتة في الرام.
* **فهرسة FTS5 ثنائية اللغة**: جدول افتراضي يدعم البحث العربي والإنجليزي الفوري عبر `unicode61 remove_diacritics 2`.
* **مخطط مرن وشامل (8 جداول أساسية)**: لإدارة البروفايل، السياقات، العقد، FTS5، الوكلاء الفرعيين، التطبيقات، وسجل التدقيق.
* **التهيئة التلقائية الصامتة (Zero-Config First Run)**: فحص وجود ملف `tidy.db` وإنشاؤه تلقائياً بالهيكل والبيانات الأولية عند أول استدعاء.
* **جاهزية المزامنة المستقبلية**: عزل طبقة التخزين بـ Driver Interface يدعم الربط المستقبلي مع حلول المزامنة المحلية-أولاً (CRDTs / Litestream / LibSQL).

---

## 📋 خطة مراحل التنفيذ خطوة بخطوة (Execution Roadmap)

### المرحلة 1: إنشاء مجلد المهارة والهيكل التأسيسي (Scaffolding & Packaging)
- إنشاء المجلد الأساسي في حزمة المهارات: `Skills-LAB/tidyfactor-tidy/`
- إعداد ملفات التعريف والحوكمة:
  - `package.json` (معرّف الحزمة والأوامر التنفيذية)
  - `manifest.json` (ميثاق الأدوات وبوابات قرارات CDL v2.0 وخادم MCP)
  - `brand.yaml` (الهوية التأسيسية للمساعد)
  - `CHANGELOG.md` و `LICENSE`

### المرحلة 2: محرك الذاكرة وقاعدة البيانات (SQLite Engine & DDL Migrations)
- كتابة `scripts/bootstrap_db.js`: محرك التهيئة الذاتية، مخطط الجداول الـ 8، التريجرز الخاصة بـ FTS5، وبيانات التهيئة الافتراضية.
- كتابة `scripts/memory_engine.js`: دوال الاسترجاع بالكلمات المفتاحية (FTS5 BM25)، وحفظ الذاكرة، وتبديل السياقات، وحساب تضاؤل الذاكرة (Decay Score).

### المرحلة 3: محرك الـ CLI وواجهة الأوامر (CLI Engine & App Registry)
- كتابة `bin/tidy.js`: نقطة الدخول التنفيذية لجميع الأوامر:
  - `tidy init`, `tidy whoami`, `tidy context`, `tidy memory`, `tidy agent`, `tidy app`, `tidy mcp`, `tidy db`.
- كتابة `scripts/subagent_runner.js`: إدارة وتنفيذ مهام الوكلاء الفرعيين ومشاركتهم لسياق الذاكرة.

### المرحلة 4: خادم MCP المحلي (Local Stdio MCP Server)
- كتابة `scripts/mcp_server.js`: خادم متوافق مع بروتوكول Model Context Protocol (JSON-RPC 2.0) عبر `stdio`.
- تسجيل الأدوات الأساسية: `tidy_recall`, `tidy_memorize`, `tidy_get_context`, `tidy_switch_context`, `tidy_exec_subagent`, `tidy_db_stats`.

### المرحلة 5: صياغة المهارة وأوامرها (Skill Dispatcher & References)
- صياغة `SKILL.md` كمرسل توجيهي مقتضب ومطابق للـ 15 قاعدة هيكلية (~350 توكن).
- إنشاء مجلد `references/commands/`:
  - `init.md`, `memory.md`, `context.md`, `agent.md`, `app.md`, `mcp.md`
- إنشاء مجلد `references/workflows/`:
  - `bootstrap-database.md`, `manage-memory.md`, `orchestrate-subagents.md`, `launch-mcp.md`
- إنشاء مجلد `references/memory/`:
  - `schema.md`, `subagent-contract.md`, `cli-reference.md`, `context-rings.md`

### المرحلة 6: التوثيق والاختبارات والأدوات (Docs, Validation & Suite Build)
- إعداد التوثيق الكامل ثنائي اللغة: `README.md` و `README.ar.md`.
- إعداد أدوات التحقق: `tools/validate_skill.py` و `tools/build-skill.js`.
- فحص واختبار إنشاء قاعدة البيانات وعمليات الذاكرة واختبار استجابة الـ CLI.

---

## 🔒 خطة التحقق والاختبار (Verification Plan)
1. **اختبار التهيئة الذاتية الصامتة**: تشغيل `node bin/tidy.js init` والتحقق من إنشاء ملف `tidy.db` بكافة الجداول والتريجرز وفهرس FTS5 بنجاح.
2. **اختبار عمليات الذاكرة**: تجربة حفظ حقيقة (`tidy memory save`) ثم استرجاعها فورياً بالبحث النصي (`tidy memory recall`).
3. **اختبار بروتوكول MCP**: إرسال طلبات JSON-RPC محاكية والتأكد من إرجاع الأدوات بنجاح.
4. **تدقيق المهارة الآلي**: تشغيل `python tools/validate_skill.py` للتأكد من خلو المهارة من أي انتهاك للقواعد الـ 15.
