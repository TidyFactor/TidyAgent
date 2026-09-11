/**
 * Tidy Studio — Central Settings & Governance Controller
 * Manages Settings subtabs, Contextual Firewall, Cognitive Decay, Granular Persona, and SQLite Portability.
 */

(function () {
  'use strict';

  const isAr = () => document.documentElement.getAttribute('lang') === 'ar';

  // ----------------- Sub-Tabs Navigation -----------------
  function initSettingsSubtabs() {
    const navButtons = document.querySelectorAll('.settings-subtab-btn');
    const panes = document.querySelectorAll('.settings-subtab-pane');

    const switchSubtab = (targetTab) => {
      navButtons.forEach(btn => {
        const isActive = btn.getAttribute('data-settings-tab') === targetTab;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `subtab-${targetTab}`);
      });

      try {
        localStorage.setItem('tidy_settings_subtab', targetTab);
      } catch (e) {}

      // Tab specific refresh
      if (targetTab === 'governance') {
        loadGovernanceSettings();
      } else if (targetTab === 'profile') {
        loadUserProfile();
      } else if (targetTab === 'appearance') {
        if (window.renderThemeGallery) window.renderThemeGallery();
      }
    };

    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-settings-tab');
        if (tab) switchSubtab(tab);
      });
    });

    // Default to profile or restore last active subtab
    try {
      const saved = localStorage.getItem('tidy_settings_subtab') || 'profile';
      if (document.getElementById(`subtab-${saved}`)) {
        switchSubtab(saved);
      } else {
        switchSubtab('profile');
      }
    } catch (e) {
      switchSubtab('profile');
    }
  }

  // ----------------- Governance & Rules Controller -----------------
  async function loadGovernanceSettings() {
    const banner = document.getElementById('govStatusBanner');
    try {
      const res = await window.api.getGovernanceRules();
      if (!res || !res.ok || !res.data) return;

      const rules = res.data;
      const firewallSelect = document.getElementById('govFirewallPolicy');
      const autoExtractBox = document.getElementById('govAutoExtract');
      const decaySelect = document.getElementById('govMemoryDecay');
      const ephemeralInput = document.getElementById('govEphemeralRetention');
      const sessionInput = document.getElementById('govSessionRetention');
      const maxRecallInput = document.getElementById('govMaxRecall');

      if (firewallSelect && rules.firewall_policy) firewallSelect.value = rules.firewall_policy;
      if (autoExtractBox) autoExtractBox.checked = rules.auto_extract === 'true' || rules.auto_extract === true;
      if (decaySelect && rules.memory_decay) decaySelect.value = rules.memory_decay;
      if (ephemeralInput && rules.ephemeral_retention_days) ephemeralInput.value = rules.ephemeral_retention_days;
      if (sessionInput && rules.session_retention_days) sessionInput.value = rules.session_retention_days;
      if (maxRecallInput && rules.max_recall_limit) maxRecallInput.value = rules.max_recall_limit;

      if (banner) banner.textContent = isAr() ? 'قواعد الحوكمة محملة من قاعدة البيانات.' : 'Governance rules loaded from database.';
    } catch (err) {
      console.error('Error loading governance settings:', err);
      if (banner) banner.textContent = isAr() ? `✗ تعذر تحميل الحوكمة: ${err.message}` : `✗ Failed to load governance: ${err.message}`;
    }
  }

  async function saveGovernanceSettings() {
    const btn = document.getElementById('btnSaveGovernance');
    const banner = document.getElementById('govStatusBanner');
    if (!btn) return;

    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>${isAr() ? 'جاري الحفظ...' : 'Saving...'}</span>`;

    try {
      const firewallPolicy = document.getElementById('govFirewallPolicy')?.value || 'strict';
      const autoExtract = document.getElementById('govAutoExtract')?.checked ? 'true' : 'false';
      const memoryDecay = document.getElementById('govMemoryDecay')?.value || 'enabled';
      const ephemeralDays = document.getElementById('govEphemeralRetention')?.value || '7';
      const sessionDays = document.getElementById('govSessionRetention')?.value || '30';
      const maxRecall = document.getElementById('govMaxRecall')?.value || '5';

      await Promise.all([
        window.api.setGovernanceRule('firewall_policy', firewallPolicy),
        window.api.setGovernanceRule('auto_extract', autoExtract),
        window.api.setGovernanceRule('memory_decay', memoryDecay),
        window.api.setGovernanceRule('ephemeral_retention_days', ephemeralDays),
        window.api.setGovernanceRule('session_retention_days', sessionDays),
        window.api.setGovernanceRule('max_recall_limit', maxRecall)
      ]);

      if (banner) {
        banner.textContent = isAr() ? '✓ تم حفظ قواعد الحوكمة بنجاح.' : '✓ Governance rules saved successfully.';
        banner.style.color = 'var(--accent-green, #10b981)';
      }
    } catch (err) {
      console.error('Error saving governance rules:', err);
      if (banner) {
        banner.textContent = isAr() ? `✗ فشل حفظ الحوكمة: ${err.message}` : `✗ Failed to save governance: ${err.message}`;
        banner.style.color = '#ef4444';
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }

  // ----------------- User Profile & Persona Controller -----------------
  async function loadUserProfile() {
    const banner = document.getElementById('profileStatusBanner');
    try {
      const res = await window.api.getUserProfile();
      if (!res || !res.ok || !res.data) return;

      const prof = res.data;
      const userNameInput = document.getElementById('inputProfileUserName');
      const assistantNameInput = document.getElementById('inputProfileAssistantName');
      const roleInput = document.getElementById('inputProfileRole');
      const toneSelect = document.getElementById('inputProfileTone');
      const localeSelect = document.getElementById('inputProfileLocale');
      const currencySelect = document.getElementById('inputProfileCurrency');

      if (userNameInput) userNameInput.value = prof.user_name || '';
      if (assistantNameInput) assistantNameInput.value = prof.assistant_name || 'Tidy';
      if (roleInput) roleInput.value = prof.role || 'Owner & Lead Engineer';
      if (toneSelect && prof.tone) toneSelect.value = prof.tone;
      if (localeSelect && prof.locale) localeSelect.value = prof.locale;
      if (currencySelect && prof.currency) currencySelect.value = prof.currency;

      if (banner) banner.textContent = isAr() ? 'الهوية محملة بالكامل من قاعدة البيانات.' : 'Identity loaded from database.';
    } catch (err) {
      console.error('Error loading user profile:', err);
      if (banner) banner.textContent = isAr() ? `✗ تعذر تحميل الهوية: ${err.message}` : `✗ Failed to load profile: ${err.message}`;
    }
  }

  async function saveUserProfile() {
    const btn = document.getElementById('btnSaveProfile');
    const banner = document.getElementById('profileStatusBanner');
    if (!btn) return;

    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>${isAr() ? 'جاري الحفظ...' : 'Saving...'}</span>`;

    try {
      const updates = {
        userName: document.getElementById('inputProfileUserName')?.value.trim() || 'User',
        assistantName: document.getElementById('inputProfileAssistantName')?.value.trim() || 'Tidy',
        role: document.getElementById('inputProfileRole')?.value.trim() || 'Owner & Lead Engineer',
        tone: document.getElementById('inputProfileTone')?.value || 'concise_expert',
        locale: document.getElementById('inputProfileLocale')?.value || 'ar',
        currency: document.getElementById('inputProfileCurrency')?.value || 'USD'
      };

      const res = await window.api.updateUserProfile(updates);
      if (res && res.ok) {
        if (banner) {
          banner.textContent = isAr() ? '✓ تم حفظ الهوية بنجاح.' : '✓ Identity saved successfully.';
          banner.style.color = 'var(--accent-green, #10b981)';
        }
        // If locale changed, apply it
        if (updates.locale && window.applyLanguage) {
          window.applyLanguage(updates.locale);
        }
      } else {
        throw new Error(res?.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      if (banner) {
        banner.textContent = isAr() ? `✗ فشل حفظ الهوية: ${err.message}` : `✗ Failed to save profile: ${err.message}`;
        banner.style.color = '#ef4444';
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }

  // ----------------- Data Sovereignty & Portability Actions -----------------
  function initPortabilityActions() {
    const resBox = document.getElementById('portabilityActionResult');

    const showResult = (msg, success = true) => {
      if (!resBox) return;
      resBox.style.display = 'block';
      resBox.style.color = success ? 'var(--accent-green, #10b981)' : '#ef4444';
      resBox.textContent = msg;
    };

    // Export to Markdown
    document.getElementById('btnExportMarkdown')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnExportMarkdown');
      btn.disabled = true;
      const origText = btn.innerHTML;
      btn.innerHTML = `<span>Exporting...</span>`;

      try {
        const res = await window.api.exportMarkdown();
        if (res && (res.ok || res.data?.exportedFiles !== undefined)) {
          const files = res.data?.exportedFiles ?? res.exportedFiles ?? 0;
          const outDir = res.data?.outputDir ?? res.outputDir ?? 'exports/markdown';
          showResult(`✓ تم تصدير مستودع Markdown بنجاح: ${files} ملفاً في المجلد ${outDir}`);
        } else {
          showResult(`✗ فشل التصدير: ${res?.error || 'Unknown error'}`, false);
        }
      } catch (err) {
        showResult(`✗ خطأ أثناء التصدير: ${err.message}`, false);
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    });

    // Export to JSON
    document.getElementById('btnExportJson')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnExportJson');
      btn.disabled = true;
      const origText = btn.innerHTML;
      btn.innerHTML = `<span>Exporting...</span>`;

      try {
        const res = await window.api.exportJson();
        if (res && (res.ok || res.data?.filePath !== undefined)) {
          const path = res.data?.filePath ?? res.filePath ?? 'tidy_backup.json';
          const recs = res.data?.totalRecords ?? res.totalRecords ?? 0;
          showResult(`✓ تم تصدير اللقطة الذرية JSON بنجاح: ${recs} سجلاً في ${path}`);
        } else {
          showResult(`✗ فشل التصدير: ${res?.error || 'Unknown error'}`, false);
        }
      } catch (err) {
        showResult(`✗ خطأ أثناء التصدير: ${err.message}`, false);
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    });
  }

  // ----------------- Master Settings Initializer -----------------
  function initSettings() {
    initSettingsSubtabs();
    loadGovernanceSettings();
    loadUserProfile();
    initPortabilityActions();

    document.getElementById('btnSaveGovernance')?.addEventListener('click', saveGovernanceSettings);
    document.getElementById('btnSaveProfile')?.addEventListener('click', saveUserProfile);
  }

  // Hook into DOM lifecycle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }

  // Export to global scope
  window.loadGovernanceSettings = loadGovernanceSettings;
  window.loadUserProfile = loadUserProfile;
})();
