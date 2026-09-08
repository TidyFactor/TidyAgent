# 🖥️ تطبيق سطح المكتب ونافذة المساعد الشفافة (Desktop HUD)

يقدم تطبيق **Tidy Desktop** واجهة تشغيل أصلية لأنظمة التشغيل (Windows x64، مع دعم جاهز لـ macOS و Linux) مبنية بواسطة **Electron** لتوفر تجربة مساعدة سريعة وخفيفة على الذاكرة مع أعلى درجات العزل الأمني.

---

## ⚡ نافذة المساعد العائمة السريعة (The HUD)

الـ HUD (Heads-Up Display) هي نافذة شفافة عائمة وخفيفة للغاية، صُممت لتكون حاضرة دائماً رهن إشارتك دون تشويش على بيئة عملك أو استهلاك موارد جهازك:

- **اختصار الاستدعاء العالمي**: اضغط `Alt + Space` (أو `Cmd + Space` على macOS) في أي مكان على جهازك لتظهر النافذة فوراً.
- **إخفاء تلقائي عند فقد التركيز (Blur Auto-Hide)**: بمجرد النقر خارج النافذة، تتوارى النافذة بسلاسة لتستكمل كتابة كودك.
- **بحث نصي فوري**: استعلام سريع في الذاكرة الدائمة، المهام، القصاصات البرمجية، أو الخزينة دون تشغيل طرفية جديدة.
- **أيقونة شريط المهام (System Tray Integration)**: أيقونة خفيفة في شريط المهام بجوار الساعة لإدارة الحالة وتشغيل الـ HUD بنقرة واحدة.

---

## 🔒 الميثاق الأمني الصارم لعزل Electron

لحماية جهازك ومفاتيحك وبياناتك الخاصة من أي ثغرات أو هجمات حقن المحتوى (XSS)، تم تصميم معمارية تطبيق سطح المكتب وفقاً لأعلى معايير أمان Electron القياسية:

### 1. إغلاق كامل للوصول إلى Node.js في الواجهة
```javascript
// BrowserWindow Configuration
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // حظر تام لوصول الواجهة لمكتبات Node.js ومسارات النظام
    contextIsolation: true,     // عزل كامل لسياق الجافاسكريبت للواجهة عن سياق النظام
    sandbox: true,              // تشغيل الواجهة في وضع الصندوق المعزول
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### 2. واجهة برمجية آمنة ومحددة عبر `contextBridge`
تتواصل الواجهة الرسومية مع النواة حصراً عبر بوابة آمنة ومعرّفة بأنواع محددة في `preload.js`:

```javascript
// preload.js
contextBridge.exposeInMainWorld('tidyApi', {
  stats: () => ipcRenderer.invoke('tidy:stats'),
  recall: (query) => ipcRenderer.invoke('tidy:memory:recall', query),
  addTask: (task) => ipcRenderer.invoke('tidy:tasks:add', task),
  switchContext: (domain) => ipcRenderer.invoke('tidy:context:switch', domain)
});
```

### 3. قنوات اتصال IPC موحدة ومفحوصة
جميع قنوات الاتصال تبدأ بالبادئة `tidy:` ويتم التحقق من معطياتها قبل معالجتها في الـ Main Process بواسطة استدعاء مباشر لوظائف `@tidy/core`.

---

## 🚀 تشغيل وبناء تطبيق سطح المكتب

### وضع التطوير المحلي
لتشغيل تطبيق سطح المكتب في بيئة التطوير مع التحديث الحي:

```bash
# من المجلد الرئيسي للمشروع
npm run desktop:dev
```

### البناء والتحزيم للإنتاج
لإنشاء حزمة تثبيت تنفيذية أصلية (`.exe` لنظام ويندوز مع حزم MSI أو ZIP):

```bash
npm run desktop:build
```
يتم إنشاء الحزم التنفيذية الجاهزة للتوزيع تحت مجلد `apps/desktop/dist/`.
