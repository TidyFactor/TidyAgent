/**
 * Build script to generate apps/desktop/src/renderer/js/icons.js from SVGs
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'assets', 'icons');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

const iconMap = {};
for (const file of files) {
  const key = file.replace('.svg', '');
  let svg = fs.readFileSync(path.join(dir, file), 'utf8');
  svg = svg.replace(/<\?xml[\s\S]*?\?>/g, '')
           .replace(/<!--[\s\S]*?-->/g, '')
           .replace(/\r?\n\s*/g, ' ')
           .trim();
  iconMap[key] = svg;
}

// Override aider with crisp 24x24 terminal AI icon
iconMap['aider'] = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="20" height="15" rx="3" fill="#14B014" fill-opacity="0.14" stroke="#14B014" stroke-width="1.8"/><polyline points="6 8 9.5 10.5 6 13" stroke="#14B014" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="13" x2="16.5" y2="13" stroke="#14B014" stroke-width="2" stroke-linecap="round"/><path d="M8 21h8M12 18v3" stroke="#14B014" stroke-width="1.8" stroke-linecap="round"/></svg>';

// Global & Custom
iconMap['global'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
iconMap['custom'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';

const jsContent = `/**
 * Tidy Ecosystem — Lobe Icons Vector System
 * Powered by @lobehub/lobe-icons (https://lobehub.com/icons)
 * Provides high-DPI vector icons for AI models, developer tools, and agents.
 */

const LOBE_ICONS = ${JSON.stringify(iconMap, null, 2)};

// Brand accent colors for tools and models
const BRAND_COLORS = {
  claude: '#D97706',
  cursor: '#3B82F6',
  codex: '#10B981',
  copilot: '#6366F1',
  windsurf: '#06B6D4',
  amp: '#EC4899',
  antigravity: '#8B5CF6',
  openclaw: '#EF4444',
  aider: '#14B014',
  openai: '#10A37F',
  gemini: '#4285F4',
  deepseek: '#0066FF',
  mistral: '#FF7000',
  meta: '#0081FB',
  ollama: '#FFFFFF',
  groq: '#F55036',
  qwen: '#615CED',
  perplexity: '#20B2AA',
  huggingface: '#FFD21E',
  deepmind: '#1A73E8',
  global: '#d4a373'
};

/**
 * Retrieve a vector SVG icon by brand/tool key
 * @param {string} name - The tool or model identifier
 * @param {object} options - Sizing, class, and color preferences
 * @returns {string} HTML string containing the SVG icon wrapper
 */
function getLobeIcon(name, options = {}) {
  if (!name) return '';
  const key = String(name).toLowerCase().trim();
  const size = options.size || 16;
  const className = options.className || '';
  const preferColor = options.color !== false;

  let svg = null;
  if (preferColor && LOBE_ICONS[key + '-color']) {
    svg = LOBE_ICONS[key + '-color'];
  } else if (LOBE_ICONS[key]) {
    svg = LOBE_ICONS[key];
  } else {
    if (key.includes('claude') || key.includes('anthropic')) {
      svg = preferColor && LOBE_ICONS['claude-color'] ? LOBE_ICONS['claude-color'] : LOBE_ICONS['claude'];
    } else if (key.includes('gpt') || key.includes('openai')) {
      svg = LOBE_ICONS['openai'];
    } else if (key.includes('gemini') || key.includes('google')) {
      svg = preferColor && LOBE_ICONS['gemini-color'] ? LOBE_ICONS['gemini-color'] : LOBE_ICONS['gemini'];
    } else if (key.includes('deepseek')) {
      svg = preferColor && LOBE_ICONS['deepseek-color'] ? LOBE_ICONS['deepseek-color'] : LOBE_ICONS['deepseek'];
    } else if (key.includes('mistral')) {
      svg = preferColor && LOBE_ICONS['mistral-color'] ? LOBE_ICONS['mistral-color'] : LOBE_ICONS['mistral'];
    } else if (key.includes('llama') || key.includes('meta')) {
      svg = preferColor && LOBE_ICONS['meta-color'] ? LOBE_ICONS['meta-color'] : LOBE_ICONS['meta'];
    } else if (key.includes('qwen')) {
      svg = preferColor && LOBE_ICONS['qwen-color'] ? LOBE_ICONS['qwen-color'] : LOBE_ICONS['qwen'];
    } else {
      svg = LOBE_ICONS['global'];
    }
  }

  return '<span class="lobe-icon ' + className + '" style="width:' + size + 'px; height:' + size + 'px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; line-height:1;" data-icon="' + key + '">' + svg + '</span>';
}

/**
 * Render a luxury tool badge with the official Lobe Icon
 */
function getToolBadge(toolId, options = {}) {
  const key = String(toolId || 'global').toLowerCase().trim();
  const size = options.size || 14;
  const showLabel = options.showLabel !== false;
  const icon = getLobeIcon(key, { size, color: true });
  const brandColor = BRAND_COLORS[key] || '#d4a373';

  const labels = {
    claude: 'Claude Code',
    cursor: 'Cursor',
    copilot: 'Copilot',
    windsurf: 'Windsurf',
    codex: 'Codex',
    antigravity: 'Antigravity',
    amp: 'Amp',
    aider: 'Aider',
    openclaw: 'OpenClaw',
    global: 'Global',
    custom: 'Custom'
  };
  const labelText = labels[key] || key.toUpperCase();

  if (!showLabel) {
    return '<span class="lobe-badge-compact" title="' + labelText + '" style="display:inline-flex; align-items:center; justify-content:center; width:' + (size + 8) + 'px; height:' + (size + 8) + 'px; border-radius:6px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">' + icon + '</span>';
  }

  return '<span class="lobe-tool-badge" data-tool="' + key + '" style="--tool-brand:' + brandColor + ';">' + icon + '<span class="lobe-tool-badge-label">' + labelText + '</span></span>';
}

/**
 * Render model badge with brand icon
 */
function getModelBadge(modelId, options = {}) {
  const key = String(modelId || '').toLowerCase().trim();
  const size = options.size || 14;
  const icon = getLobeIcon(key, { size, color: true });
  return '<span class="lobe-model-badge">' + icon + '<span class="lobe-model-name">' + modelId + '</span></span>';
}

// Global exports
window.LOBE_ICONS = LOBE_ICONS;
window.BRAND_COLORS = BRAND_COLORS;
window.getLobeIcon = getLobeIcon;
window.getToolBadge = getToolBadge;
window.getModelBadge = getModelBadge;
`;

const dest = path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'js', 'icons.js');
fs.writeFileSync(dest, jsContent, 'utf8');
console.log('Successfully generated ' + dest + ' (' + jsContent.length + ' bytes)');
