/**
 * Tidy Theme & Qahera Neighborhood Presets Controller
 * Adheres strictly to Qahera UI Kit styling tokens and presets.
 */

let currentTheme = localStorage.getItem('tidy_theme') || 'light';
let currentNeighborhood = localStorage.getItem('tidy_qahera_neighborhood') || 'zeitoun';

const QAHERA_THEMES = [
  { id: 'zeitoun', nameAr: 'الزيتون', nameEn: 'El-Zeitoun', descAr: 'قصور الضواحي الأرستقراطية والتراث العريق', primary: '#1D4ED8', accent: '#D97706', base: '#F8FAFC' },
  { id: 'zamalek', nameAr: 'الزمالك', nameEn: 'Zamalek', descAr: 'القصور الدبلوماسية ولؤلؤ الشامبانيا الملكي', primary: '#18181B', accent: '#B88A3B', base: '#FBF9F5' },
  { id: 'downtown', nameAr: 'وسط البلد', nameEn: 'Downtown', descAr: 'العمارة الخديوية التراثية والباتينا الباريسية', primary: '#9E7728', accent: '#832729', base: '#F6F3EC' },
  { id: 'heliopolis', nameAr: 'مصر الجديدة', nameEn: 'Heliopolis', descAr: 'طراز البارون إمبان والأندلسي الصحراوي', primary: '#B45309', accent: '#C86D51', base: '#FAF6F0' },
  { id: 'gardencity', nameAr: 'جاردن سيتي', nameEn: 'Garden City', descAr: 'هدوء النيل والأفنية الشجرية الفكتورية', primary: '#047857', accent: '#D97706', base: '#F9FAF7' },
  { id: 'maadi', nameAr: 'المعادي', nameEn: 'Maadi', descAr: 'الضواحي الهادئة وأشجار الكافور التراثية', primary: '#15803D', accent: '#A16207', base: '#FAFBF8' },
  { id: 'roxy', nameAr: 'روكسي', nameEn: 'Roxy', descAr: 'حداثة الستينيات والتجارة الكلاسيكية الراقية', primary: '#0284C7', accent: '#E11D48', base: '#F8FAFC' },
  { id: 'hussein', nameAr: 'الحسين', nameEn: 'El-Hussein', descAr: 'العمارة الفاطمية والنحاسيات والمشكاوات', primary: '#D97706', accent: '#0D9488', base: '#FAF8F5' },
  { id: 'sakakini', nameAr: 'السكاكيني', nameEn: 'Sakakini', descAr: 'القصور الإيطالية والروكوكو وزخارف المرمر', primary: '#7C3AED', accent: '#DB2777', base: '#FAF7FC' },
  { id: 'shubra', nameAr: 'شبرا', nameEn: 'Shubra', descAr: 'حيوية المجتمع العريق والنسيج العمراني الأصيل', primary: '#C2410C', accent: '#2563EB', base: '#FAF7F5' },
  { id: 'marg', nameAr: 'المرج', nameEn: 'El-Marg', descAr: 'بساتين الأسرة العلوية والمروج الخديوية الخضراء', primary: '#059669', accent: '#D97706', base: '#F6FAF7' },
  { id: 'newcairo', nameAr: 'القاهرة الجديدة', nameEn: 'New Cairo', descAr: 'الحداثة التكنولوجية والـ Cyber Minimalist', primary: '#0284C7', accent: '#10B981', base: '#F8FAFC' }
];

function applyTheme(theme, neighborhood = currentNeighborhood) {
  currentTheme = theme;
  currentNeighborhood = neighborhood;
  localStorage.setItem('tidy_theme', theme);
  localStorage.setItem('tidy_qahera_neighborhood', neighborhood);
  document.body.setAttribute('data-theme', neighborhood);
  document.documentElement.setAttribute('data-theme', neighborhood);
  document.body.setAttribute('data-mode', theme);
  document.documentElement.setAttribute('data-mode', theme);

  const iconEl = document.getElementById('themeToggleIcon');
  if (iconEl) {
    if (theme === 'light') {
      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    } else {
      iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    }
  }

  const activeThemePill = document.getElementById('activeThemePill');
  if (activeThemePill) {
    const found = QAHERA_THEMES.find(t => t.id === neighborhood);
    const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';
    activeThemePill.textContent = lang === 'ar'
      ? `${found ? found.nameAr : neighborhood} (${neighborhood}) نشط`
      : `${found ? found.nameEn : neighborhood} Active`;
  }

  renderThemeGallery();
}

function renderThemeGallery() {
  const container = document.getElementById('themeGalleryGrid');
  if (!container) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : 'ar';

  container.innerHTML = QAHERA_THEMES.map(theme => {
    const isActive = theme.id === currentNeighborhood;
    const title = lang === 'ar' ? theme.nameAr : theme.nameEn;
    const desc = lang === 'ar' ? theme.descAr : theme.id;
    return `
      <div class="theme-card ${isActive ? 'active' : ''}" data-theme-id="${theme.id}" title="${escapeHtml(title)} — ${escapeHtml(desc)}">
        <div class="theme-card-header">
          <span class="theme-card-title">
            ${escapeHtml(title)}
            ${isActive ? '<svg class="qhr-icon qhr-icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: var(--qhr-color-primary, #1D4ED8);"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </span>
          <span class="theme-card-badge">${theme.id}</span>
        </div>
        <p class="theme-card-desc">${escapeHtml(desc)}</p>
        <div class="theme-swatches">
          <span class="swatch-dot" style="background-color: ${theme.primary};" title="Primary: ${theme.primary}"></span>
          <span class="swatch-dot" style="background-color: ${theme.accent};" title="Accent: ${theme.accent}"></span>
          <span class="swatch-dot" style="background-color: ${theme.base};" title="Surface: ${theme.base}"></span>
          <span class="swatch-label">${isActive ? (lang === 'ar' ? '● مفعّل' : '● Active') : (lang === 'ar' ? 'تطبيق' : 'Select')}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id');
      applyTheme(currentTheme, themeId);
    });
  });
}

function initThemeToggle() {
  const btn = document.getElementById('btnToggleTheme');
  btn?.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });
}

function initSettingsHandlers() {
  document.getElementById('btnResetThemeSettings')?.addEventListener('click', () => {
    applyTheme('light', 'zeitoun');
  });
}

// Global exports
window.QAHERA_THEMES = QAHERA_THEMES;
window.applyTheme = applyTheme;
window.renderThemeGallery = renderThemeGallery;
window.initThemeToggle = initThemeToggle;
window.initSettingsHandlers = initSettingsHandlers;
window.getCurrentTheme = () => currentTheme;
window.getCurrentNeighborhood = () => currentNeighborhood;
