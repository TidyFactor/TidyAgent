#!/usr/bin/env node
/**
 * Tidy Ecosystem — Stdio Model Context Protocol (MCP) Server
 * High-performance JSON-RPC 2.0 sovereign brain and assistant engine.
 *
 * @module @tidy/mcp/server
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

const readline = require('readline');
const { getDb } = require('@tidy/core');
const {
  TOOLS,
  RESOURCES,
  PROMPTS,
  executeTool,
  handleToolCall,
  handleResourceRead,
  handlePromptGet
} = require('./registry');

const SERVER_INFO = {
  name: 'tidy-mcp',
  version: '1.5.0'
};

function startServer() {
  // Ensure SQLite SSOT and WAL are primed
  getDb();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(response) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let request;
    try {
      request = JSON.parse(trimmed);
    } catch {
      sendResponse({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: invalid JSON' }
      });
      return;
    }

    const { id, method, params } = request;

    // In JSON-RPC 2.0, notifications do not have an id and MUST NOT receive a response
    if (id === undefined || id === null) {
      return;
    }

    switch (method) {
      case 'initialize':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: SERVER_INFO
          }
        });
        break;

      case 'ping':
        sendResponse({ jsonrpc: '2.0', id, result: {} });
        break;

      case 'tools/list':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: { tools: TOOLS }
        });
        break;

      case 'tools/call':
        try {
          const toolResult = await executeTool(params.name, params.arguments || {});
          sendResponse({ jsonrpc: '2.0', id, result: toolResult });
        } catch (toolErr) {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: toolErr.message }
          });
        }
        break;

      case 'resources/list':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: { resources: RESOURCES }
        });
        break;

      case 'resources/read':
        try {
          const resourceResult = await handleResourceRead(params.uri);
          sendResponse({ jsonrpc: '2.0', id, result: resourceResult });
        } catch (resErr) {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: resErr.message }
          });
        }
        break;

      case 'prompts/list':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: { prompts: PROMPTS }
        });
        break;

      case 'prompts/get':
        try {
          const promptResult = handlePromptGet(params.name, params.arguments || {});
          sendResponse({ jsonrpc: '2.0', id, result: promptResult });
        } catch (promptErr) {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: promptErr.message }
          });
        }
        break;

      default:
        sendResponse({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
    }
  });

  process.stderr.write(`[tidy-mcp] Sovereign Engine v${SERVER_INFO.version} online (Tools: ${TOOLS.length}, Resources: ${RESOURCES.length}, Prompts: ${PROMPTS.length})\n`);
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  TOOLS,
  RESOURCES,
  PROMPTS,
  executeTool,
  handleToolCall,
  handleResourceRead,
  handlePromptGet
};
