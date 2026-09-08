/**
 * Tidy Ecosystem — Documentation Portal Theme Entry
 * Extends the VitePress default theme with custom styling, typography, and RTL support.
 *
 * @module docs/.vitepress/theme/index.mjs
 * @version 1.4.2
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
 */

import DefaultTheme from 'vitepress/theme';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Custom application enhancements if needed
  }
};
