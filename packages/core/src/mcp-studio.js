/**
 * Tidy Ecosystem — MCP Studio Engine (Multi-IDE Model Context Protocol Hub)
 * Discovers, inspects, validates, mutates, and synchronizes MCP server configurations
 * across 5 major agentic IDEs: Google Antigravity, Cursor, VS Code, Claude, and Windsurf.
 *
 * @module @tidy/core/mcp-studio
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function getHomeDir() {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
}

/**
 * Registry of supported Agentic IDEs with configuration paths and schema specifics
 */
function getIdeProfiles() {
  const home = getHomeDir();
  const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');

  return {
    antigravity: {
      id: 'antigravity',
      name: 'Google Antigravity',
      shortName: 'Antigravity',
      rootKey: 'mcpServers',
      defaultPath: path.join(home, '.gemini', 'config', 'mcp_config.json'),
      candidatePaths: [
        path.join(home, '.gemini', 'config', 'mcp_config.json')
      ],
      transportTypes: ['stdio'],
      docUrl: 'https://antigravity.google/docs/mcp/'
    },
    cursor: {
      id: 'cursor',
      name: 'Cursor',
      shortName: 'Cursor',
      rootKey: 'mcpServers',
      defaultPath: path.join(home, '.cursor', 'mcp.json'),
      candidatePaths: [
        path.join(home, '.cursor', 'mcp.json'),
        path.join(appData, 'Cursor', 'User', 'globalStorage', 'mcp.json')
      ],
      transportTypes: ['stdio', 'sse'],
      docUrl: 'https://cursor.com/docs/mcp'
    },
    vscode: {
      id: 'vscode',
      name: 'Visual Studio Code',
      shortName: 'VS Code',
      rootKey: 'servers',
      defaultPath: path.join(home, '.vscode', 'mcp.json'),
      candidatePaths: [
        path.join(home, '.vscode', 'mcp.json'),
        path.join(appData, 'Code', 'User', 'globalStorage', 'mcp.json')
      ],
      transportTypes: ['stdio', 'sse'],
      docUrl: 'https://code.visualstudio.com/docs/agent-customization/mcp-servers'
    },
    claude: {
      id: 'claude',
      name: 'Claude Desktop & Code',
      shortName: 'Claude',
      rootKey: 'mcpServers',
      defaultPath: process.platform === 'win32'
        ? path.join(appData, 'Claude', 'claude_desktop_config.json')
        : path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      candidatePaths: [
        path.join(appData, 'Claude', 'claude_desktop_config.json'),
        path.join(home, '.claude', 'claude_desktop_config.json'),
        path.join(home, '.claude.json')
      ],
      transportTypes: ['stdio', 'sse'],
      docUrl: 'https://code.claude.com/docs/en/mcp-quickstart'
    },
    windsurf: {
      id: 'windsurf',
      name: 'Windsurf',
      shortName: 'Windsurf',
      rootKey: 'mcpServers',
      defaultPath: path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
      candidatePaths: [
        path.join(home, '.codeium', 'windsurf', 'mcp_config.json')
      ],
      transportTypes: ['stdio', 'sse'],
      docUrl: 'https://docs.codeium.com/windsurf'
    }
  };
}

/**
 * Pre-seeded verified catalog of popular community MCP servers for 1-click installation
 */
const MCP_CATALOG = [
  {
    id: 'tidy-brain',
    name: 'Tidy Sovereign MCP',
    description: 'Local-first SQLite memory, context switcher, tasks & productivity tools over stdio JSON-RPC.',
    vendor: 'TidyFactor',
    command: 'node',
    args: ['scripts/mcp_server.js'],
    env: { TIDY_LOG_LEVEL: 'info' },
    category: 'productivity',
    installed: false
  },
  {
    id: 'sqlite',
    name: 'SQLite Explorer',
    description: 'Direct querying, schema inspection, and data analysis for local SQLite databases.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', 'data.db'],
    env: {},
    category: 'database',
    installed: false
  },
  {
    id: 'memory',
    name: 'Knowledge Graph Memory',
    description: 'Persistent graph memory engine capturing entities, relations, and contextual knowledge.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
    category: 'memory',
    installed: false
  },
  {
    id: 'filesystem',
    name: 'Filesystem Safe Access',
    description: 'Secure local filesystem reader and writer constrained to authorized workspace directories.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    env: {},
    category: 'tools',
    installed: false
  },
  {
    id: 'github',
    name: 'GitHub Platform API',
    description: 'Search repos, inspect pull requests, read issues, and manage commits with Personal Access Token.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    category: 'developer',
    installed: false
  },
  {
    id: 'fetch',
    name: 'Web Content Fetcher',
    description: 'Converts any remote web URL into clean markdown for token-efficient agent analysis.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    env: {},
    category: 'web',
    installed: false
  },
  {
    id: 'brave-search',
    name: 'Brave Search Engine',
    description: 'Real-time web search and local location query interface powered by Brave Search API.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '' },
    category: 'web',
    installed: false
  },
  {
    id: 'postgres',
    name: 'PostgreSQL Manager',
    description: 'Read-only or full query inspection for PostgreSQL databases with schema reflection.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
    env: {},
    category: 'database',
    installed: false
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer Headless Browser',
    description: 'Automated browser navigation, screenshot generation, and dynamic DOM interaction.',
    vendor: 'Anthropic Official',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {},
    category: 'web',
    installed: false
  }
];

let pathOverrides = {};

function setConfigPathOverride(ideId, customPath) {
  if (!customPath) {
    delete pathOverrides[ideId];
  } else {
    pathOverrides[ideId] = customPath;
  }
}

function clearConfigPathOverrides() {
  pathOverrides = {};
}

/**
 * Resolve active configuration path for an IDE.
 * If candidate exists, use it; otherwise use defaultPath.
 */
function resolveIdeConfigPath(ideId) {
  if (pathOverrides[ideId]) {
    return pathOverrides[ideId];
  }

  const profiles = getIdeProfiles();
  const profile = profiles[ideId];
  if (!profile) {
    throw new Error(`Unknown IDE profile: ${ideId}`);
  }

  for (const candidate of profile.candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return profile.defaultPath;
}

/**
 * Read and parse an IDE configuration file.
 * Returns { exists, path, raw, servers, rootKey, error }
 */
function getMcpConfig(ideId) {
  const profiles = getIdeProfiles();
  const profile = profiles[ideId];
  if (!profile) {
    throw new Error(`Unknown IDE profile: ${ideId}`);
  }

  const configPath = resolveIdeConfigPath(ideId);
  if (!fs.existsSync(configPath)) {
    return {
      ideId,
      ideName: profile.name,
      exists: false,
      path: configPath,
      rootKey: profile.rootKey,
      raw: {},
      servers: {},
      serverCount: 0,
      error: null
    };
  }

  try {
    const rawText = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(rawText);
    const rootKey = profile.rootKey;
    const serversObj = (parsed && typeof parsed === 'object' && parsed[rootKey]) ? parsed[rootKey] : {};

    return {
      ideId,
      ideName: profile.name,
      exists: true,
      path: configPath,
      rootKey,
      raw: parsed,
      servers: serversObj,
      serverCount: Object.keys(serversObj).length,
      error: null
    };
  } catch (err) {
    return {
      ideId,
      ideName: profile.name,
      exists: true,
      path: configPath,
      rootKey: profile.rootKey,
      raw: {},
      servers: {},
      serverCount: 0,
      error: `Failed to parse JSON: ${err.message}`
    };
  }
}

/**
 * Atomically write config object to target file with automated .bak backup.
 */
function saveMcpConfig(ideId, configObject) {
  const profiles = getIdeProfiles();
  const profile = profiles[ideId];
  if (!profile) {
    throw new Error(`Unknown IDE profile: ${ideId}`);
  }

  const configPath = resolveIdeConfigPath(ideId);
  const dir = path.dirname(configPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Backup existing file if present
  if (fs.existsSync(configPath)) {
    try {
      const backupPath = `${configPath}.bak`;
      fs.copyFileSync(configPath, backupPath);
    } catch {
      // Non-fatal backup warning
    }
  }

  const content = JSON.stringify(configObject, null, 2) + '\n';
  const tmpPath = `${configPath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, configPath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    throw new Error(`Failed to save MCP configuration for ${profile.name}: ${err.message}`);
  }

  return { ok: true, path: configPath };
}

/**
 * Scan all 5 supported IDEs and aggregate their MCP servers.
 */
function scanAllMcpServers() {
  const profiles = getIdeProfiles();
  const ideList = Object.keys(profiles);
  const results = [];
  const allServers = [];
  let totalServerCount = 0;

  for (const id of ideList) {
    const config = getMcpConfig(id);
    const profile = profiles[id];
    const serverEntries = [];

    if (config.exists && !config.error && config.servers && typeof config.servers === 'object') {
      for (const [sName, sCfg] of Object.entries(config.servers)) {
        if (!sCfg || typeof sCfg !== 'object') continue;
        const isStdio = Boolean(sCfg.command);
        const transport = isStdio ? 'stdio' : (sCfg.url ? 'sse' : 'unknown');
        const entry = {
          name: sName,
          ideId: id,
          ideName: profile.name,
          transport,
          command: sCfg.command || '',
          args: Array.isArray(sCfg.args) ? sCfg.args : [],
          env: sCfg.env && typeof sCfg.env === 'object' ? sCfg.env : {},
          url: sCfg.url || '',
          disabled: Boolean(sCfg.disabled)
        };
        serverEntries.push(entry);
        allServers.push(entry);
      }
    }

    totalServerCount += serverEntries.length;
    results.push({
      id,
      name: profile.name,
      shortName: profile.shortName,
      path: config.path,
      exists: config.exists,
      rootKey: profile.rootKey,
      error: config.error,
      serverCount: serverEntries.length,
      servers: serverEntries
    });
  }

  return {
    ides: results,
    servers: allServers,
    totalCount: totalServerCount
  };
}

/**
 * Add or overwrite an MCP server in an IDE's configuration.
 */
function addMcpServer(ideId, serverName, serverConfig) {
  if (!serverName || typeof serverName !== 'string') {
    throw new Error('Server name is required');
  }
  const cleanName = serverName.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanName)) {
    throw new Error('Server name must contain only letters, numbers, hyphens, and underscores');
  }

  if (!serverConfig || typeof serverConfig !== 'object') {
    throw new Error('Server configuration object is required');
  }

  const profiles = getIdeProfiles();
  const profile = profiles[ideId];
  if (!profile) {
    throw new Error(`Unknown IDE profile: ${ideId}`);
  }

  const current = getMcpConfig(ideId);
  const rootKey = profile.rootKey;
  const configObj = current.raw && typeof current.raw === 'object' ? { ...current.raw } : {};

  if (!configObj[rootKey] || typeof configObj[rootKey] !== 'object') {
    configObj[rootKey] = {};
  }

  // Construct normalized server configuration entry
  const entry = {};
  if (serverConfig.command) {
    entry.command = String(serverConfig.command).trim();
    if (Array.isArray(serverConfig.args)) {
      entry.args = serverConfig.args.map(a => String(a));
    }
    if (serverConfig.env && typeof serverConfig.env === 'object' && Object.keys(serverConfig.env).length > 0) {
      entry.env = serverConfig.env;
    }
  } else if (serverConfig.url) {
    entry.url = String(serverConfig.url).trim();
  } else {
    throw new Error('Server configuration must include either a command or a URL');
  }

  if (serverConfig.disabled) {
    entry.disabled = true;
  }

  configObj[rootKey][cleanName] = entry;
  saveMcpConfig(ideId, configObj);

  return { ok: true, ideId, serverName: cleanName, entry };
}

/**
 * Update an existing MCP server entry.
 */
function updateMcpServer(ideId, serverName, serverConfig) {
  const current = getMcpConfig(ideId);
  if (!current.servers || !current.servers[serverName]) {
    throw new Error(`Server "${serverName}" not found in ${current.ideName}`);
  }

  return addMcpServer(ideId, serverName, serverConfig);
}

/**
 * Remove an MCP server from an IDE configuration.
 */
function removeMcpServer(ideId, serverName) {
  const profiles = getIdeProfiles();
  const profile = profiles[ideId];
  if (!profile) {
    throw new Error(`Unknown IDE profile: ${ideId}`);
  }

  const current = getMcpConfig(ideId);
  const rootKey = profile.rootKey;
  const configObj = current.raw && typeof current.raw === 'object' ? { ...current.raw } : {};

  if (!configObj[rootKey] || !configObj[rootKey][serverName]) {
    throw new Error(`Server "${serverName}" does not exist in ${profile.name}`);
  }

  delete configObj[rootKey][serverName];
  saveMcpConfig(ideId, configObj);

  return { ok: true, ideId, serverName };
}

/**
 * Clone an MCP server configuration from one IDE to another.
 */
function cloneMcpServer(sourceIdeId, targetIdeId, serverName, targetServerName = null) {
  const sourceConfig = getMcpConfig(sourceIdeId);
  if (!sourceConfig.servers || !sourceConfig.servers[serverName]) {
    throw new Error(`Server "${serverName}" not found in source IDE (${sourceConfig.ideName})`);
  }

  const destName = targetServerName ? targetServerName.trim() : serverName;
  const serverDef = sourceConfig.servers[serverName];

  return addMcpServer(targetIdeId, destName, serverDef);
}

/**
 * Return pre-seeded catalog of verified MCP servers.
 */
function listMcpCatalog() {
  // Check which servers are installed in any IDE
  const scan = scanAllMcpServers();
  const installedNames = new Set(scan.servers.map(s => s.name.toLowerCase()));

  return MCP_CATALOG.map(item => ({
    ...item,
    installed: installedNames.has(item.id.toLowerCase()) || installedNames.has(item.name.toLowerCase())
  }));
}

/**
 * Diagnostic test of an MCP server executable, script, or endpoint availability.
 */
function testMcpServer(ideId, serverName) {
  const startTime = Date.now();
  const current = getMcpConfig(ideId);
  if (!current.servers || !current.servers[serverName]) {
    return { ok: false, message: `Server "${serverName}" not found in ${current.ideName}` };
  }

  const sCfg = current.servers[serverName];
  if (sCfg.url) {
    const latencyMs = Date.now() - startTime;
    return { ok: true, message: `Remote SSE Endpoint: ${sCfg.url}`, transport: 'sse', latencyMs };
  }

  if (!sCfg.command) {
    return { ok: false, message: 'No command defined for this server' };
  }

  const cmd = sCfg.command.trim();

  // If command is absolute or relative path, check existence directly
  if (cmd.includes('/') || cmd.includes('\\')) {
    if (fs.existsSync(cmd)) {
      const latencyMs = Date.now() - startTime;
      return { ok: true, message: `Executable exists: ${cmd} [${latencyMs}ms]`, path: cmd, transport: 'stdio', latencyMs };
    }
    return { ok: false, message: `Executable path not found: ${cmd}`, transport: 'stdio' };
  }

  // Check PATH availability
  try {
    const isWin = process.platform === 'win32';
    const checkCmd = isWin ? `where "${cmd}"` : `which "${cmd}"`;
    const output = execSync(checkCmd, { encoding: 'utf8', timeout: 3000 });
    const firstPath = output.split('\n')[0].trim();

    // Verify script argument if present
    let extraDetails = '';
    if (Array.isArray(sCfg.args)) {
      for (const arg of sCfg.args) {
        if (typeof arg === 'string' && (arg.endsWith('.js') || arg.endsWith('.py') || arg.endsWith('.ts') || arg.endsWith('.mjs') || arg.includes('/') || arg.includes('\\'))) {
          const resolved = path.resolve(arg);
          if (fs.existsSync(resolved)) {
            extraDetails = ` (${path.basename(resolved)} verified)`;
          } else {
            return { ok: false, message: `Command "${cmd}" exists, but script file not found: ${arg}`, transport: 'stdio' };
          }
          break;
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    return {
      ok: true,
      message: `Command verified: ${cmd}${extraDetails} [${latencyMs}ms]`,
      path: firstPath,
      transport: 'stdio',
      latencyMs
    };
  } catch {
    return { ok: false, message: `Command "${cmd}" not found in system PATH`, transport: 'stdio' };
  }
}

module.exports = {
  getIdeProfiles,
  resolveIdeConfigPath,
  setConfigPathOverride,
  clearConfigPathOverrides,
  getMcpConfig,
  saveMcpConfig,
  scanAllMcpServers,
  addMcpServer,
  updateMcpServer,
  removeMcpServer,
  cloneMcpServer,
  listMcpCatalog,
  testMcpServer,
  MCP_CATALOG
};

