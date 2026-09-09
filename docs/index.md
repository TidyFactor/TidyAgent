---
layout: home

hero:
  name: "Tidy Ecosystem"
  text: "منظومة المساعد الشخصي وإدارة الأعمال السيادية"
  tagline: "نواة مصغرة فائقة السرعة بـ SQLite WAL • محرك بحث فوري FTS5 BM25 • حزم مجالات مستقلة للأعمال وبناء التطبيقات"
  image:
    src: /logo.png
    alt: Tidy Ecosystem Logo
  actions:
    - theme: brand
      text: 🚀 دليل الاستخدام
      link: /user_manual.ar
    - theme: alt
      text: 🏛️ المواصفات المعمارية
      link: /specs/architecture_spec.ar
    - theme: alt
      text: 🗺️ خارطة الطريق
      link: /PROJECT_STATUS.ar

features:
  - icon: 🔒
    title: سيادة محلية كاملة
    details: قاعدة بيانات SQLite واحدة نشطة بنمط WAL عالي السرعة، مع صفر ارتهان بالسحابة وخزنة محلية مشفرة بالكامل.
  - icon: ⚡
    title: محرك بحث فوري FTS5
    details: استرجاع ذكي ثنائي اللغة يدعم العربية والإنجليزية بترميز unicode61 مع خوارزمية قياس الاضمحلال المعرفي BM25.
  - icon: 🧩
    title: معمارية النواة المصغرة
    details: نواة مجردة خفيفة فائقة الاستجابة تلتزم بالقواعد الهيكلية وتتمدد بحزم النطاقات المخصصة كإضافات معيارية.
  - icon: 💼
    title: حزمة إدارة الأعمال TidyOffice
    details: إدارة العملاء والصفقات CRM، فواتير وعروض أسعار آلية، وتوليد ملفات استخبارات العملاء الشاملة.
  - icon: 🎨
    title: باني التطبيقات TidyBuilder
    details: تكامل أصيل مع مكتبة Qahera UI Kit لتوليد واجهات ويب وتطبيقات SPA بدعم كامل للـ RTL دون أي تعقيدات.
  - icon: 🤖
    title: حوكمة سياق الحلقات الثلاث
    details: تجميع السياق الذري الفوري (Ring 0 للهوية، Ring 1 للمجالات، Ring 2 للمشروع) مع تفويض الوكلاء الفرعيين.
---

# 📚 مركز التوثيق الشامل لمنظومة تايدي (Tidy Ecosystem Hub)

مرحباً بك في مركز التوثيق الموحد لمنظومة **Tidy Platform Ecosystem**. صُمم هذا المركز ليكون المرجع التقني والتشغيلي الموثوق لكافة أدوات المنظومة، معماريتها النواتية، وخوارزميات الذاكرة وحوكمة الوكلاء.

---

## 🧭 جدول المحتويات والمسارات السريعة (Quick Navigation)

<div class="quick-nav-grid">

| 🚀 البدء والأدوات | 💼 التطبيقات وحزم العمل | 🏛️ المعمارية العميقة |
|---|---|---|
| • [دليل التثبيت والتهيئة](/guide/getting-started.ar)<br>• [مرجع أوامر الطرفية (CLI)](/tools/cli.ar)<br>• [خادم بروتوكول MCP](/tools/mcp-server.ar)<br>• [دليل الاستخدام الشامل](/user_manual.ar) | • [تطبيقات الإنتاجية الدقيقة](/apps/productivity.ar)<br>• [حزمة الأعمال (@tidy/office)](/apps/office-suite.ar)<br>• [تطبيق سطح المكتب (HUD)](/apps/desktop-hud.ar)<br>• [بوابة الويب المحلية (Port 3840)](/apps/productivity.ar) | • [بنية الذاكرة ومحرك البحث](/architecture/memory-and-search.ar)<br>• [معمارية الحلقات وجدار الحماية](/architecture/3-ring-context.ar)<br>• [الوكلاء ومحمل المهارات](/architecture/subagents-and-skills.ar)<br>• [المواصفة المعمارية الكاملة](/specs/architecture_spec.ar) |

</div>

---

## 🗺️ خريطة المستندات والمصادر (Documentation Topology)

```text
docs/
├── index.md                           <-- بوابة التوثيق التفاعلية الموحدة (أنت هنا)
├── guide/
│   └── getting-started.ar.md          <-- التثبيت، الضبط الصامت، وإعداد البيئة
├── tools/
│   ├── cli.ar.md                      <-- مرجع أوامر الطرفية السريعة (q, m, task, who, govern)
│   └── mcp-server.ar.md               <-- 16 أداة MCP و 4 موارد حية لبيئات IDE
├── apps/
│   ├── productivity.ar.md             <-- تطبيقات tasks, snippets, journal, vault
│   ├── office-suite.ar.md             <-- حزمة @tidy/office لإدارة CRM والفواتير والسيولة
│   └── desktop-hud.ar.md              <-- تطبيق Electron ونافذة HUD العائمة (Alt+Space)
├── architecture/
│   ├── memory-and-search.ar.md        <-- معمارية SQLite WAL، FTS5 BM25، ومعادلة النسيان
│   ├── 3-ring-context.ar.md           <-- نموذج الحلقات الثلاث وجدار الحماية السياقي
│   └── subagents-and-skills.ar.md     <-- تفويض الوكلاء الفرعيين ومولد ملخصات المهام
└── specs/
    ├── architecture_spec.ar.md        <-- المواصفات الفنية المعتمدة
    └── tidyoffice_evolution_roadmap.ar.md <-- خارطة تطور حزمة المكتب
```

---

## 🌐 التراجم العالمية المعتمدة (International Translations)

| اللغة | الرمز | رابط النسخة | الاتجاه |
|---|:---:|---|:---:|
| **العربية** (Native) | `ar` | [بوابة التوثيق الرئيسية](/) | RTL |
| **English** (Master) | `en` | [English Documentation Hub](/en/) | LTR |
| **Español** | `es` | [Centro de Documentación](/es/) | LTR |
| **Deutsch** | `de` | [Dokumentationszentrum](/de/) | LTR |
| **Français** | `fr` | [Portail de Documentation](/fr/) | LTR |
| **Português** | `pt` | [Centro de Documentação](/pt/) | LTR |
| **简体中文** | `zh` | [简体中文文档中心](/zh/) | LTR |
| **فارسی** | `fa` | [مرکز اسناد و مدارک](/fa/) | RTL |

