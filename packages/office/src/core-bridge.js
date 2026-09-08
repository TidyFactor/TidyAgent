/**
 * @file packages/office/src/core-bridge.js
 * Monorepo resolver for @tidy/core
 */

let core;
try {
  core = require('@tidy/core');
} catch {
  core = require('../../core/src/index');
}

module.exports = core;
