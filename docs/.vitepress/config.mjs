import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Tidy Ecosystem',
  description: 'Sovereign Personal Assistant Agent & Business Operating System',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800;900&family=Cairo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap' }]
  ],

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
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Arabic Hub', link: '/' },
          { text: 'User Manual', link: '/user_manual.ar' },
          { text: 'Architecture Spec', link: '/specs/architecture_spec.ar' },
          { text: 'GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    },
    es: {
      label: 'Español',
      lang: 'es',
      link: '/es/',
      themeConfig: {
        nav: [
          { text: 'Inicio', link: '/es/' },
          { text: 'Hub Principal (العربية)', link: '/' },
          { text: 'Manual de Usuario', link: '/user_manual.ar' },
          { text: 'GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    },
    de: {
      label: 'Deutsch',
      lang: 'de',
      link: '/de/',
      themeConfig: {
        nav: [
          { text: 'Startseite', link: '/de/' },
          { text: 'Haupt-Hub (العربية)', link: '/' },
          { text: 'Benutzerhandbuch', link: '/user_manual.ar' },
          { text: 'GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
      themeConfig: {
        nav: [
          { text: 'Accueil', link: '/fr/' },
          { text: 'Hub Principal (العربية)', link: '/' },
          { text: 'Manuel d\'utilisation', link: '/user_manual.ar' },
          { text: 'GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    },
    pt: {
      label: 'Português',
      lang: 'pt',
      link: '/pt/',
      themeConfig: {
        nav: [
          { text: 'Início', link: '/pt/' },
          { text: 'Hub Principal (العربية)', link: '/' },
          { text: 'Manual do Usuário', link: '/user_manual.ar' },
          { text: 'GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '主文档中心 (العربية)', link: '/' },
          { text: '使用手册', link: '/user_manual.ar' },
          { text: 'GitHub', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    },
    fa: {
      label: 'فارسی',
      lang: 'fa',
      dir: 'rtl',
      link: '/fa/',
      themeConfig: {
        nav: [
          { text: 'خانه', link: '/fa/' },
          { text: 'مرکز اسناد (العربية)', link: '/' },
          { text: 'راهنمای کاربر', link: '/user_manual.ar' },
          { text: 'گیت‌هاب', link: 'https://github.com/TidyFactor/Agent' }
        ]
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Tidy Ecosystem',

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
