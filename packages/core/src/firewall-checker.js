/**
 * Tidy Ecosystem — Contextual Domain Firewall & Contamination Checker
 * Enforces zero context bleed between Software Engineering ([Dev Mode]) and Marketing/Ops.
 *
 * @module @tidy/core/firewall-checker
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const MARKETING_SIGNATURES = [
  'aida framework',
  'pas formula',
  'sostac',
  'call to action',
  'lead magnet',
  'conversion funnel',
  'sales hook',
  'fomo',
  'اشترِ الآن',
  'احصل على خصم',
  'عرض لفترة محدودة',
  'خصم خاص',
  'عملاء محتملون',
  'قمع المبيعات',
  'landing page copy',
  'click-through rate'
];

const DEV_SIGNATURES = [
  'select * from',
  'pragma journal_mode',
  'foreign key constraint',
  'segmentation fault',
  'nullpointerexception',
  'stack trace:',
  'node:sqlite',
  'database lock timeout',
  'uncaught referenceerror'
];

/**
 * Checks input text for domain contamination against the active operating mode.
 *
 * @param {object} params
 * @param {string} params.text Text or prompt to analyze
 * @param {string} [params.activeMode='dev'] Operating mode: 'dev', 'marketing', or 'ops'
 * @returns {object} Compliance verdict and detected contamination violations
 */
function checkContextualFirewall(params = {}) {
  const text = (params.text || '').trim();
  const activeMode = (params.activeMode || 'dev').toLowerCase();

  if (!text) {
    return {
      compliant: true,
      activeMode,
      violations: [],
      score: 100,
      recommendation: 'Text is empty. No contextual contamination detected.'
    };
  }

  const textLower = text.toLowerCase();
  const violations = [];

  if (activeMode === 'dev' || activeMode === 'tech') {
    for (const phrase of MARKETING_SIGNATURES) {
      if (textLower.includes(phrase)) {
        violations.push({
          type: 'marketing_bleed_in_dev',
          term: phrase,
          description: `Marketing copy phrase "${phrase}" detected inside technical engineering context.`
        });
      }
    }
  } else if (activeMode === 'marketing') {
    for (const phrase of DEV_SIGNATURES) {
      if (textLower.includes(phrase)) {
        violations.push({
          type: 'dev_bleed_in_marketing',
          term: phrase,
          description: `Low-level engineering signature "${phrase}" detected inside marketing domain context.`
        });
      }
    }
  }

  const compliant = violations.length === 0;
  const score = Math.max(0, 100 - violations.length * 25);

  let recommendation = 'Contextual firewall clean: Zero cross-domain bleed detected.';
  if (!compliant) {
    recommendation = activeMode === 'dev'
      ? 'Context contamination detected: Remove aggressive marketing frameworks (AIDA, sales hooks) from engineering artifacts.'
      : 'Context contamination detected: Remove raw code queries or stack traces from client-facing marketing materials.';
  }

  return {
    compliant,
    activeMode,
    score,
    violations: violations.map(v => v.term),
    details: violations,
    recommendation
  };
}

module.exports = {
  checkContextualFirewall,
  MARKETING_SIGNATURES,
  DEV_SIGNATURES
};
