/**
 * Tidy Ecosystem — Intent Router & Capability Matching Engine
 * Intent Deconstruction, Semantic Capability Discovery, and Dynamic MCP Tool Routing.
 *
 * @module @tidy/core/intent-router
 * @version 1.6.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

'use strict';

/**
 * Known Intent Classifications
 */
const INTENT_TYPES = {
  CODE_IMPLEMENTATION: 'code_implementation',
  UI_DESIGN: 'ui_design',
  MARKETING_COPY: 'marketing_copy',
  SEO_OPTIMIZATION: 'seo_optimization',
  DOCUMENTATION: 'documentation',
  SYSADMIN_OPS: 'sysadmin_ops',
  INVOICING_COMMERCE: 'invoicing_commerce',
  KNOWLEDGE_RECALL: 'knowledge_recall',
  GENERAL_QUERY: 'general_query'
};

/**
 * Ecosystem Skill Capability Directory
 * Maps skills to domains, primary keywords, and required MCP tools.
 */
const CAPABILITY_DIRECTORY = [
  {
    skill: 'tidyfactor-cinematic',
    domain: 'dev',
    keywords: ['cinematic', 'luxury', 'landing page', 'gsap', 'lenis', 'film', 'cartier', 'apple', 'scroll-driven', 'animation'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-design',
    domain: 'dev',
    keywords: ['design', 'tokens', 'palette', 'figma', 'ui design', 'colors', 'typography', 'components'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-styler',
    domain: 'dev',
    keywords: ['styler', 'rtl', 'css', 'polish', 'arabic ui', 'layout', 'tailwind', 'microcopy'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'qahera-ui',
    domain: 'dev',
    keywords: ['qahera', 'ui kit', 'egyptian', 'design system', 'scaffold', 'renderer'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-doc',
    domain: 'general',
    keywords: ['doc', 'documentation', 'vitepress', 'adr', 'llms.txt', 'api reference', 'readme', 'changelog', 'توثيق'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-marketing',
    domain: 'marketing',
    keywords: ['marketing', 'campaign', 'ad copy', 'social media', 'launch', 'brand voice', 'تسويق', 'إعلان', 'كوبي'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-seo',
    domain: 'marketing',
    keywords: ['seo', 'json-ld', 'schema', 'sitemap', 'meta tags', 'search engine', 'hreflang', 'سيو'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-php',
    domain: 'dev',
    keywords: ['php', 'flight', 'medoo', 'modular monolith', 'plates', 'backend', 'api'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-next',
    domain: 'dev',
    keywords: ['next.js', 'react', 'typescript', 'saas', 'multi-tenant', 'supabase', 'frontend'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-html',
    domain: 'dev',
    keywords: ['html', 'static', 'web components', 'vanilla', 'css'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-htmx',
    domain: 'dev',
    keywords: ['htmx', 'hypermedia', 'fragments', 'server-rendered', 'swap'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'tidyfactor-js',
    domain: 'dev',
    keywords: ['vanilla js', 'spa', 'reactive', 'proxy', 'framework-free'],
    recommendedTools: ['tidy_recall', 'tidy_memorize']
  },
  {
    skill: 'ops-cpanel',
    domain: 'ops',
    keywords: ['cpanel', 'whm', 'server', 'csf', 'autossl', 'firewall', 'linux', 'sso', 'سيرفر'],
    recommendedTools: ['tidy_doctor', 'tidy_recall']
  },
  {
    skill: 'ops-lamp',
    domain: 'ops',
    keywords: ['lamp', 'apache', 'event mpm', 'php-fpm', 'mariadb', 'mysql', 'performance'],
    recommendedTools: ['tidy_doctor', 'tidy_recall']
  },
  {
    skill: 'ops-mail',
    domain: 'ops',
    keywords: ['mail.baby', 'exim', 'smtp', 'smarthost', 'spf', 'dkim', 'dmarc', 'بريد'],
    recommendedTools: ['tidy_recall', 'tidy_doctor']
  }
];

/**
 * Deconstruct user prompt and route intent to matching capabilities
 * Enforces the Capability-First Invariant: returns at most 2 to 3 target skills.
 *
 * @param {string} requestText - User prompt or task description
 * @param {object} [options={}] - Routing configuration
 * @param {number} [options.maxSkills=3] - Maximum skills to return (defaults to 3)
 * @returns {object} Intent routing outcome
 */
function routeIntent(requestText, options = {}) {
  const { maxSkills = 3 } = options;

  if (!requestText || typeof requestText !== 'string' || !requestText.trim()) {
    return {
      intentType: INTENT_TYPES.GENERAL_QUERY,
      domain: 'general',
      confidence: 0.5,
      targetSkills: [],
      recommendedTools: ['tidy_recall', 'tidy_memorize'],
      contextHints: {}
    };
  }

  const text = requestText.toLowerCase();

  // 1. Invoicing & Commerce check
  if (
    text.includes('invoice') ||
    text.includes('فاتورة') ||
    text.includes('فواتير') ||
    text.includes('crm') ||
    text.includes('عميل') ||
    text.includes('cashflow') ||
    text.includes('dossier')
  ) {
    return {
      intentType: INTENT_TYPES.INVOICING_COMMERCE,
      domain: 'general',
      confidence: 0.95,
      targetSkills: [],
      recommendedTools: [
        'tidy_invoice_create',
        'tidy_invoice_list',
        'tidy_crm_list',
        'tidy_crm_add',
        'tidy_cashflow_summary'
      ],
      contextHints: { category: 'commerce', requiresOfficePack: true }
    };
  }

  // 2. Classify primary intent and domain
  let intentType = INTENT_TYPES.GENERAL_QUERY;
  let domain = 'general';
  let confidence = 0.70;

  if (
    text.includes('إعلان') ||
    text.includes('تسويق') ||
    text.includes('marketing') ||
    text.includes('campaign') ||
    text.includes('copywriting') ||
    text.includes('social media')
  ) {
    intentType = INTENT_TYPES.MARKETING_COPY;
    domain = 'marketing';
    confidence = 0.90;
  } else if (text.includes('seo') || text.includes('سيو') || text.includes('sitemap') || text.includes('schema.org')) {
    intentType = INTENT_TYPES.SEO_OPTIMIZATION;
    domain = 'marketing';
    confidence = 0.90;
  } else if (text.includes('تصميم') || text.includes('ui') || text.includes('palette') || text.includes('landing page')) {
    intentType = INTENT_TYPES.UI_DESIGN;
    domain = 'dev';
    confidence = 0.85;
  } else if (text.includes('توثيق') || text.includes('document') || text.includes('vitepress') || text.includes('adr')) {
    intentType = INTENT_TYPES.DOCUMENTATION;
    domain = 'general';
    confidence = 0.85;
  } else if (
    text.includes('سيرفر') ||
    text.includes('server') ||
    text.includes('cpanel') ||
    text.includes('apache') ||
    text.includes('firewall') ||
    text.includes('whm')
  ) {
    intentType = INTENT_TYPES.SYSADMIN_OPS;
    domain = 'ops';
    confidence = 0.90;
  } else if (
    text.includes('code') ||
    text.includes('function') ||
    text.includes('class') ||
    text.includes('api') ||
    text.includes('refactor') ||
    text.includes('bug') ||
    text.includes('كود')
  ) {
    intentType = INTENT_TYPES.CODE_IMPLEMENTATION;
    domain = 'dev';
    confidence = 0.85;
  }

  // 3. Score capabilities based on keyword matching
  const scoredSkills = [];
  for (const cap of CAPABILITY_DIRECTORY) {
    let score = 0;
    for (const kw of cap.keywords) {
      if (text.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    if (cap.domain === domain) {
      score += 1;
    }
    if (score > 1) {
      scoredSkills.push({ skill: cap.skill, score, recommendedTools: cap.recommendedTools });
    }
  }

  // Sort descending by score and pick top N (maximum 2-3 skills)
  scoredSkills.sort((a, b) => b.score - a.score);
  const targetSkills = scoredSkills.slice(0, maxSkills).map(s => s.skill);

  // 4. Synthesize recommended MCP tools
  const toolsSet = new Set(['tidy_recall', 'tidy_memorize']);
  for (const s of scoredSkills.slice(0, maxSkills)) {
    for (const tool of s.recommendedTools || []) {
      toolsSet.add(tool);
    }
  }

  // 5. Context Hints extraction
  const contextHints = {
    detectedDomain: domain,
    skillCount: targetSkills.length,
    isMultiSkill: targetSkills.length > 1
  };

  return {
    intentType,
    domain,
    confidence,
    targetSkills,
    recommendedTools: Array.from(toolsSet),
    contextHints
  };
}

module.exports = {
  INTENT_TYPES,
  CAPABILITY_DIRECTORY,
  routeIntent
};
