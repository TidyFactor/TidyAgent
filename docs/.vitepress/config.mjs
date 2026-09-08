import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Tidy Ecosystem',
  description: 'Sovereign Personal Assistant Agent & Business Operating System',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  locales: {
    root: {
      label: 'العربية',
      lang: 'ar',
      dir: 'rtl',
      themeConfig: {
        nav: [
          { text: 'الرئيسية', link: '/' },
          { text: 'دليل الاستخدام', link: '/user_manual.ar' },
          { text: 'المواصفات الفنية', link: '/specs/architecture_spec.ar' },
          { text: 'خارطة الطريق', link: '/PROJECT_STATUS.ar' },
          { text: 'مستودع GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ],

        sidebar: [
          {
            text: '📖 التوثيق العام',
            collapsed: false,
            items: [
              { text: 'فهرس مركز التوثيق', link: '/' },
              { text: 'دليل الاستخدام الشامل', link: '/user_manual.ar' },
              { text: 'حالة المشروع ومسارات SemVer', link: '/PROJECT_STATUS.ar' }
            ]
          },
          {
            text: '🏛️ المواصفات الهندسية والمعمارية',
            collapsed: false,
            items: [
              { text: 'مواصفات المعمارية والنواة', link: '/specs/architecture_spec.ar' },
              { text: 'ميثاق تطور حزمة @tidy/office', link: '/specs/tidyoffice_evolution_roadmap.ar' },
              { text: 'ترقية PocketOffice ونظام التصميم', link: '/specs/pocketoffice_migration_and_design_system.ar' }
            ]
          },
          {
            text: '🌐 التراجم العالمية (i18n)',
            collapsed: true,
            items: [
              { text: 'العربية (README.ar)', link: '/i18n/README.ar' },
              { text: 'Deutsch', link: '/i18n/README.de' },
              { text: 'Español', link: '/i18n/README.es' },
              { text: 'Français', link: '/i18n/README.fr' },
              { text: 'Português', link: '/i18n/README.pt' },
              { text: '中文', link: '/i18n/README.zh' },
              { text: 'فارسی', link: '/i18n/README.fa' }
            ]
          }
        ],

        outline: {
          label: 'محتويات الصفحة',
          level: [2, 3]
        },

        docFooter: {
          prev: 'الصفحة السابقة',
          next: 'الصفحة التالية'
        },

        darkModeSwitchLabel: 'المظهر',
        sidebarMenuLabel: 'القائمة',
        returnToTopLabel: 'العودة للأعلى'
      }
    }
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/TidyFactor/Agent' }
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'بحث في التوثيق',
                buttonAriaLabel: 'بحث في التوثيق'
              },
              modal: {
                noResultsText: 'لم يتم العثور على نتائج لـ',
                resetButtonTitle: 'إعادة ضبط البحث',
                footer: {
                  selectText: 'للاختيار',
                  navigateText: 'للتنقل',
                  closeText: 'للإغلاق'
                }
              }
            }
          }
        }
      }
    },

    footer: {
      message: 'نظام تشغيل وإدارة المساعد الشخصي السيادي — مرخص تحت رخصة Apache-2.0',
      copyright: 'حقوق النشر © 2026 Tidy Ecosystem / TidyFactor'
    }
  }
});
