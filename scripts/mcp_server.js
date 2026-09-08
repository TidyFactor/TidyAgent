/**
 * @file scripts/mcp_server.js
 * Root proxy to authoritative @tidy/mcp server.
 * Maintained for backwards compatibility with root entry points and npm scripts.
 */
const mcp = require('../packages/mcp/src/server');

if (require.main === module) {
  mcp.startServer();
}

module.exports = mcp;
