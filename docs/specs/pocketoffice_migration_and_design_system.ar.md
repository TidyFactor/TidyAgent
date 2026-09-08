# 🏛️ وثيقة التحول المعماري: دمج مكتسبات PocketOffice وتوحيد معايير Qahera UI Kit

<!-- Status: Approved Architectural Blueprint -->
<!-- Target: Tidy Ecosystem (Desktop & Web Console) -->
<!-- Date: 2026-09-08 -->

---

## 📌 1. السياق والغرض الاستراتيجي (Context & Purpose)

يمثل مشروع **Tidy** التطور المعماري والسيادي لمنظومة الأعمال **PocketOffice**. 
تجمع المنظومة الجديدة بين:
1. **النواة السيادية (`@tidy/core`)**: محرك SQLite محلي فائق السرعة يعمل بنمط WAL، بحث فوري بالنصوص الكاملة FTS5 BM25، حوكمة سياق الحلقات الثلاثية، وخادم Stdio MCP أصيل.
2. **العمق التشغيلي التخصصي (`PocketOffice Heritage`)**: استيعاب وإعادة بناء التطبيقات الحقيقية الناضجة من PocketOffice (محرك الفواتير المطور `Invoice Pro`، كتالوج المنتجات والخدمات `Products Catalog`، ملف الشركات المصدرة `Company Profiles`، عروض الأسعار `Proposals`، وتتبع النفقات `Expenses`).
3. **نظام التصميم الموحد (`Qahera UI Kit`)**: الانتقال الكامل والممنهج إلى معايير مكتبة التصميم الخاصة بنا بأسلوب حتمي وخالي من الإيموجيات العشوائية، مع دعم أصيل للوضعين المظلم والفاتح وثنائية اللغة.

---

## 🔍 2. تحليل الفجوة ومصفوفة المقارنة المرجعية (Gap Analysis)

| المكون / التطبيق | معمارية PocketOffice المرجعية (PHP/JSON) | الحالة الحالية في Tidy | المعمارية المستهدفة في التحديث الجديد (SQLite/Node) |
| :--- | :--- | :--- | :--- |
| **محرك الفواتير** | `invoice-pro` و `invoice-builder` مع قوالب زجاجية للطباعة، ضرائب مخصصة، خصومات، وسجل سداد جزئي. | جدول بسيط وحقول يدوية أساسية بدون قوالب طباعة. | **Invoice Pro v3**: قوالب فاخرة للطباعة، تعدد عملات حي، ربط بالكتالوج وسجل سداد كامل في SQLite. |
| **كتالوج الخدمات** | `products` مع تفاصيل الحزم، المخرجات (`deliverables`)، والبنود المشمولة والمستثناة. | غير موجود ككتالوج منفصل. | **`app_products`**: جدول SQLite وواجهة كتالوج متكاملة لاختيار البنود فوراً في الفواتير والعروض. |
| **ملف الشركة المصدرة** | بيانات الشركة، الشعار، السجل التجاري، الرقم الضريبي، الحسابات البنكية. | غير موجود. | **`app_company_profiles`**: تخزين بيانات الشركة المصدرة وتطبيقها تلقائياً على كل الفواتير والعروض. |
| **إدارة العملاء CRM** | حسابات العملاء، سجل التعاملات، القيمة المتوقعة، والملف التنفيذي. | جدول عملاء أولي مع ملخص مبدئي. | **CRM Pipeline Pro**: سجل زمني للملاحظات، ربط مباشر بالفواتير الصادرة، وملف ذكاء اصطناعي شامل. |
| **نظام المظهر (Theming)** | داكن وفاتح مبني على إعدادات الجلسة. | داكن فقط (`data-mode="dark"`). | **تبديل حي للوضعين (Dark/Light)** مع حفظ التفضيل بالمتصفح ودعم متغيرات `Qahera`. |
| **اللغات والاتجاه** | عربي / إنجليزي عبر متغيرات الجلسة. | ثنائي عبر تبديل كلاسات. | **محرك ترجمة معياري قابل للتوسع (Extensible i18n Engine)**. |

---

## 🗄️ 3. مخطط البيانات المستهدف في SQLite (`@tidy/office`)

لتطابق القوة الوظيفية لنظام `PocketOffice`، تضاف الجداول التالية إلى حزمة `@tidy/office`:

```sql
-- 1. ملفات الشركات المصدرة (My Companies)
CREATE TABLE IF NOT EXISTS app_company_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_number TEXT,
  cr_number TEXT, -- السجل التجاري
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  bank_name TEXT,
  bank_iban TEXT,
  bank_swift TEXT,
  logo_url TEXT,
  default_currency TEXT DEFAULT 'EGP',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. كتالوج المنتجات والخدمات (Products & Services)
CREATE TABLE IF NOT EXISTS app_products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  category TEXT, -- 'service', 'retainer', 'product', 'license'
  unit_price REAL NOT NULL DEFAULT 0.0,
  currency TEXT DEFAULT 'EGP',
  billing_cycle TEXT DEFAULT 'one-time', -- 'one-time', 'monthly', 'yearly'
  deliverables_json TEXT, -- قائمة المخرجات بصيغة JSON
  features_json TEXT,     -- الميزات المشمولة والمستثناة
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. ترقية جدول الفواتير ليدعم الربط الكامل
-- إضافة حقول: company_id, currency, exchange_rate, payment_terms, printable_template, notes_ar
```

---

## 🎨 4. معايير التكامل مع Qahera UI Kit

1. **الالتزام بالثيمات الرسمية**:
   - في الوضع المظلم: `[data-theme="new-cairo"][data-mode="dark"]`.
   - في الوضع الفاتح: `[data-theme="new-cairo"][data-mode="light"]`.
2. **منع الإيموجيات العشوائية (`QAHERA-VISUAL-001`)**:
   - استخدام أيقونات Inline SVG المتجهة فقط.
3. **التدرج في نقل الكلاسات إلى BEM**:
   - الأزرار: `.qhr-btn`, `.qhr-btn--primary`, `.qhr-btn--secondary`, `.qhr-btn--outline`.
   - الكروت والحاويات: `.qhr-card`, `.qhr-card-header`, `.qhr-card-body`.
   - الجداول: `.qhr-table`.
4. **تغذية مستودع المكتبة**:
   - أي نمط أو مكون مخصص يتم استحداثه واختباره في Tidy يتم إدراجه في سجل مقترحات تطوير `Qahera-UI-Kit`.
