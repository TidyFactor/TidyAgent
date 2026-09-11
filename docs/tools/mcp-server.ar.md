# 🔌 خادم بروتوكول سياق النموذج (Stdio MCP Server)

يوفر **Tidy** خادم Stdio مدمج يعمل وفق معيار **Model Context Protocol (MCP)** الإصدار JSON-RPC 2.0، مما يمكن وكلاء الذكاء الاصطناعي (مثل Google Antigravity، Claude Code، Cursor، و Windsurf) من التفاعل المباشر مع ذاكرتك الدائمة، مهامك، وحزمة أعمالك المكتبية دون أي وسطاء سحابيين.

---

## ⚙️ إعداد الخادم في محررات الأكواد (IDE Setup)

أضف تكوين الخادم التالي إلى ملف إعدادات الـ MCP الخاص بمحررك (مثل `mcp_config.json` أو إعدادات Claude Desktop):

```json
{
  "mcpServers": {
    "tidy": {
      "command": "node",
      "args": ["/path/to/tidy-agent/packages/mcp/src/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

---

## 🛠️ قائمة الأدوات الذكية المتاحة (16 أداة MCP)

### 1. أدوات الذاكرة والسياق (Memory & Context Tools)
* **`tidy_recall`**: استرجاع الذكريات والقرارات المعمارية عبر محرك FTS5 BM25 وحساب الاضمحلال المعرفي.
  - *المعاملات*: `query` (نص البحث الإلزامي)، `limit` (العدد الأقصى، افتراضياً 5)، `bypassFirewall` (تجاوز الجدار الناري).
* **`tidy_memorize`**: تخزين عقدة ذاكرة دائمة جديدة في الـ SSOT.
  - *المعاملات*: `content` (المحتوى الإلزامي)، `category` (`decision`, `rule`, `pattern`, `fact`)، `importance` (1–5)، `tier` (`core`, `project`, `session`).
* **`tidy_get_context`**: قراءة السياق النشط حالياً وجدار الحماية المعرفي.
* **`tidy_switch_context`**: التبديل الذري بين سياقات العمل (`dev`, `marketing`, `personal`).

### 2. أدوات المهام وتفويض الوكلاء (Tasks & Agents Tools)
* **`tidy_task_add`**: إضافة مهمة جديدة إلى قائمة المهام المحلية مع تكليف وكيل متخصص.
* **`tidy_task_list`**: استعلام وتصفية المهام حسب الحالة (`pending`, `completed`) والمجال.
* **`tidy_exec_subagent`**: تفويض مهمة إلى أحد الوكلاء الفرعيين (`planner`, `coder`, `researcher`, `scribe`).
* **`tidy_list_skills`**: اكتشاف واستعراض مهارات مجتمع TidyFactor المثبتة.
* **`tidy_synthesize_brief`**: توليد موجز مهام ماركداون ذاتي الاكتفاء (Self-Contained Task Brief).

### 3. أدوات حزمة إدارة الأعمال المكتبية (`@tidy/office`)
* **`tidy_crm_list`**: استعلام خط أنابيب العملاء وحالات الصفقات والميزانيات.
* **`tidy_crm_add`**: تسجيل بطاقة عميل تجاري B2B جديد في المنظومة.
* **`tidy_invoice_list`**: استعلام كشف الفواتير حسب الحالة والعميل.
* **`tidy_invoice_create`**: إصدار فاتورة مجزأة مع احتساب الضريبة والخصومات آلياً.
* **`tidy_cashflow_summary`**: كشف لحظي للأرباح والخسائر والتدفق المالي (P&L Telemetry).
* **`tidy_client_dossier`**: تجميع ملف العميل الاستخباراتي الشامل من الفواتير والذاكرة المشتركة.

### 4. أدوات صيانة قاعدة البيانات
* **`tidy_db_stats`**: استعراض إحصائيات سعة التخزين، حجم ملف الـ WAL، وعدد السجلات.

---

## 📡 الموارد الحية الديناميكية (4 Dynamic MCP Resources)

تتيح الموارد الحية لوكلاء الذكاء الاصطناعي قراءة حالة النظام اللحظية باستمرار دون استدعاء أدوات:

| مسار المورد (URI) | الاسم | الوصف الفني |
|---|---|---|
| `tidy://profile` | **الملف الحاكم (Profile)** | هوية المستخدم، اللغة، ونبرة المساعد المستمرة (Ring 0). |
| `tidy://context/current` | **السياق النشط (Current Context)** | قيود الجدار الناري والمجال المعرفي النشط (Ring 1). |
| `tidy://tasks/pending` | **طابور المهام المعلقة (Pending Tasks)** | قائمة المهام ذات الأولوية التي تنتظر التنفيذ. |
| `tidy://office/cashflow` | **كشف السيولة المالي (Live Cashflow)** | ملخص السيولة المالية والأرباح المحققة لحظياً. |
