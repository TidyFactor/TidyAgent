---
layout: home

hero:
  name: "Tidy Ecosystem"
  text: "منظومة المساعد الشخصي وإدارة الأعمال السيادية"
  tagline: "نواة مصغرة فائقة السرعة بـ SQLite WAL وبحث FTS5 BM25 وحزم مجالات مستقلة"
  actions:
    - theme: brand
      text: 📖 دليل الاستخدام الشامل
      link: /user_manual.ar
    - theme: alt
      text: 🏛️ المواصفات الهندسية
      link: /specs/architecture_spec.ar
    - theme: alt
      text: 🚀 خارطة الطريق ومسار SemVer
      link: /PROJECT_STATUS.ar

features:
  - title: 🔒 سيادة تامة ومحلية (Local-First SSOT)
    details: قاعدة بيانات SQLite واحدة نشطة بنمط WAL عالي السرعة، مع صفر تبعيات سحابية وأمان مشفر للخزنة.
  - title: ⚡ بحث ذكي ثنائي اللغة (FTS5 BM25)
    details: فهرسة فورية تدعم العربية والإنجليزية عبر unicode61 وخوارزمية قياس الاضمحلال المعرفي (Decay Scoring).
  - title: 🧩 معمارية النواة المصغرة والحزم
    details: نواة مجردة خفيفة (@tidy/core) قابلة للتمديد بحزم النطاقات مثل حزمة الأعمال المكتبية (@tidy/office).
---

# 📚 مركز التوثيق الشامل لمنظومة تايدي — Documentation Hub
<!-- Status: Living Documentation Index -->
<!-- SemVer SSOT: v1.4.2 -->

مرحباً بك في مركز التوثيق الرسمي لمنظومة **Tidy Platform Ecosystem**. تم تنظيم هذا المجلد ليكون المرجع المركزي الشامل لكافة الجوانب المعمارية، التشغيلية، ومسارات التطوير القادمة.

---

## 🗺️ خريطة وثائق النظام (Documentation Map)

```text
docs/
├── index.md                           <-- (أنت هنا) بوابة التوثيق التفاعلية
├── README.md                          <-- الفهرس العام على المستودع
├── PROJECT_STATUS.ar.md               <-- تقرير الحالة الفنية الشامل ومسارات SemVer القادمة
├── user_manual.ar.md                  <-- دليل المستخدم والتشغيل الكامل (CLI, MCP, GUI, Micro-Apps)
├── specs/                             <-- المواصفات الفنية والمعمارية العميقة
│   ├── architecture_spec.ar.md        <-- المواصفات الهندسية للنواة ونموذج الحلقات الثلاث
│   ├── pocketoffice_migration_and_design_system.ar.md <-- دمج مكتسبات PocketOffice وثيمات Qahera
│   └── tidyoffice_evolution_roadmap.ar.md            <-- خارطة تطور حزمة إدارة الأعمال
├── i18n/                              <-- التراجم الرسمية لملف التعريف والبدء السريع
│   ├── README.ar.md                   <-- النسخة العربية الكاملة
│   ├── README.de.md                   <-- Deutsch
│   ├── README.es.md                   <-- Español
│   ├── README.fa.md                   <-- فارسی
│   ├── README.fr.md                   <-- Français
│   ├── README.pt.md                   <-- Português
│   └── README.zh.md                   <-- 中文
└── archive/                           <-- خطط العمل والمسودات السابقة المكتملة
    └── implementation_plan_v3.md      <-- خطة إطلاق الإصدار 1.3
```

---

## 🧭 مسارات القراءة الموصى بها (Reading Pathways)

### 1. لمطوري التطبيقات والمستخدمين اليوميين:
* ابدأ بـ [دليل الاستخدام الشامل](/user_manual.ar): يغطي كافة أوامر الطرفية السريعة (`tidy q`، `tidy m`، `tidy task`)، إعداد خادم الـ MCP مع IDEs، واستخدام شاشة الـ HUD الطافية.
* تصفح [النسخة العربية لملف التعريف](/i18n/README.ar) للاطلاع على الملخص العام.

### 2. للمهندسين المعماريين ومطوري النواة:
* اطلع على [المواصفات الهندسية للنواة](/specs/architecture_spec.ar) لمعرفة تفاصيل `node:sqlite` ووضع `WAL` وفهرسة FTS5 BM25.
* راجع [المواصفات المعمارية الجذرية](../ARCHITECTURE.md) لمعاينة تفويض الوكلاء وجدران الحماية السياقية.
* راجع [تعليمات وكلاء الذكاء الاصطناعي](../AGENTS.md) لفهم الحوكمة غير القابلة للتفاوض وميثاق العمل.

### 3. لإدارة الإصدارات ومتابعة التطوير:
* تفقد [تقرير حالة المشروع ومسارات SemVer](/PROJECT_STATUS.ar) للاطلاع على ما تم إنجازه والترتيب التسلسلي للإصدارات من `v1.4.3` إلى `v2.0.0`.
* تابع [خارطة الطريق الاستراتيجية](../ROADMAP.md) و [سجل التغييرات](../CHANGELOG.md).

---

## 🌐 التراجم العالمية (International Translations)

| اللغة | ملف التوثيق | الاتجاه |
|---|---|:---:|
| **العربية** (Native) | [docs/i18n/README.ar.md](/i18n/README.ar) | RTL |
| **English** (Master) | [README.md](../README.md) | LTR |
| **Español** | [docs/i18n/README.es.md](/i18n/README.es) | LTR |
| **Deutsch** | [docs/i18n/README.de.md](/i18n/README.de) | LTR |
| **Français** | [docs/i18n/README.fr.md](/i18n/README.fr) | LTR |
| **Português** | [docs/i18n/README.pt.md](/i18n/README.pt) | LTR |
| **中文** | [docs/i18n/README.zh.md](/i18n/README.zh) | LTR |
| **فارسی** | [docs/i18n/README.fa.md](/i18n/README.fa) | RTL |
