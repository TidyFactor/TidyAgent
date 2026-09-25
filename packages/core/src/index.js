/**
 * Tidy Ecosystem — Sovereign Personal Assistant Kernel Entry
 * Main module exporting Database, Memory, Apps, Subagents, Studio, and Portability APIs.
 *
 * @module @tidy/core
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/TidyAgent
 */

const db = require('./db');
const memory = require('./memory');
const apps = require('./apps');
const subagents = require('./subagents');
const skillsLoader = require('./skills-loader');
const briefGenerator = require('./brief-generator');
const portability = require('./portability');
const governance = require('./governance');
const multiToolScanner = require('./multi-tool-scanner');
const skillsValidator = require('./skills-validator');
const boilerplateGenerator = require('./boilerplate-generator');
const studio = require('./studio');
const knowledgeHarvester = require('./knowledge-harvester');
const mcpStudio = require('./mcp-studio');
const brainDoctor = require('./brain-doctor');
const hybridSearch = require('./hybrid-search');
const atomicKi = require('./atomic-ki');
const transcriptForensics = require('./transcript-forensics');
const storageHygiene = require('./storage-hygiene');
const firewallChecker = require('./firewall-checker');
const memoryTaxonomy = require('./memory-taxonomy');
const contextCompiler = require('./context-compiler');
const intentRouter = require('./intent-router');

module.exports = {
  // Database & Storage SSOT
  resolveDbPath: db.resolveDbPath,
  initDatabase: db.initDatabase,
  getDb: db.getDb,
  getStats: db.getStats,
  backupDatabase: db.backupDatabase,
  checkpointWal: db.checkpointWal,
  checkIntegrity: db.checkIntegrity,
  registerSchema: db.registerSchema,

  // Memory & FTS5 BM25 Engine with Mathematical Decay
  saveMemory: memory.saveMemory,
  updateMemory: memory.updateMemory,
  recallMemory: memory.recallMemory,
  forgetMemory: memory.forgetMemory,
  listMemories: memory.listMemories,
  pruneMemories: memory.pruneMemories,
  calculateCognitiveScore: memory.calculateCognitiveScore,
  pruneDecayedMemories: memory.pruneDecayedMemories,
  TIER_LAMBDAS: memory.TIER_LAMBDAS,
  CATEGORY_BOOSTS: memory.CATEGORY_BOOSTS,

  // Knowledge Harvester & Agent Memory Extractor
  scanKnowledgeSources: knowledgeHarvester.scanKnowledgeSources,
  readHarvestItem: knowledgeHarvester.readHarvestItem,
  importBatchMemories: knowledgeHarvester.importBatchMemories,
  getStandardHarvestLocations: knowledgeHarvester.getStandardHarvestLocations,

  // Micro-Apps
  addTask: apps.addTask,
  getTask: apps.getTask,
  listTasks: apps.listTasks,
  completeTask: apps.completeTask,
  deleteTask: apps.deleteTask,
  updateTaskBrief: apps.updateTaskBrief,
  addSnippet: apps.addSnippet,
  listSnippets: apps.listSnippets,
  deleteSnippet: apps.deleteSnippet,
  addJournalEntry: apps.addJournalEntry,
  listJournal: apps.listJournal,
  setSecret: apps.setSecret,
  getSecret: apps.getSecret,
  listVaultKeys: apps.listVaultKeys,
  deleteSecret: apps.deleteSecret,
  listInstalledApps: apps.listInstalledApps,

  // Subagents (Full CRUD & Delegation)
  listSubagents: subagents.listSubagents,
  getSubagent: subagents.getSubagent,
  registerSubagent: subagents.registerSubagent,
  updateSubagent: subagents.updateSubagent,
  toggleSubagent: subagents.toggleSubagent,
  deleteSubagent: subagents.deleteSubagent,
  prepareSubagentContext: subagents.prepareSubagentContext,
  runSubagent: subagents.runSubagent,

  // Community Skills as Managed Agents (Full CRUD)
  parseSkillMd: skillsLoader.parseSkillMd,
  inferDomain: skillsLoader.inferDomain,
  registerSkillFromPath: skillsLoader.registerSkillFromPath,
  discoverSkills: skillsLoader.discoverSkills,
  listRegisteredSkills: skillsLoader.listRegisteredSkills,
  getRegisteredSkill: skillsLoader.getRegisteredSkill,
  createSkill: skillsLoader.createSkill,
  updateSkill: skillsLoader.updateSkill,
  toggleSkill: skillsLoader.toggleSkill,
  deleteSkill: skillsLoader.deleteSkill,

  // Universal Studio: Multi-Tool Discovery & File I/O
  TOOL_DEFINITIONS: multiToolScanner.TOOL_DEFINITIONS,
  scanAllTools: multiToolScanner.scanAllTools,
  parseFrontmatter: multiToolScanner.parseFrontmatter,
  readStudioItem: multiToolScanner.readStudioItem,
  saveStudioItem: multiToolScanner.saveStudioItem,
  invalidateScanCache: multiToolScanner.invalidateScanCache,

  // Skills-LAB & 15 Rules Validator
  validateSkill: skillsValidator.validateSkill,

  // Tool-Specific Boilerplate Generator
  createBoilerplate: boilerplateGenerator.createBoilerplate,
  generateSkillMd: boilerplateGenerator.generateSkillMd,
  generateAgentPrompt: boilerplateGenerator.generateAgentPrompt,
  generateCursorRule: boilerplateGenerator.generateCursorRule,
  generateWindsurfMemory: boilerplateGenerator.generateWindsurfMemory,

  // Studio Collections & Favorites SSOT
  listCollections: studio.listCollections,
  createCollection: studio.createCollection,
  deleteCollection: studio.deleteCollection,
  assignItemToCollection: studio.assignItemToCollection,
  removeItemFromCollection: studio.removeItemFromCollection,
  toggleFavorite: studio.toggleFavorite,
  listFavorites: studio.listFavorites,
  listDiscoveryCatalog: studio.listDiscoveryCatalog,
  deleteStudioItem: studio.deleteStudioItem,

  // Self-Contained Task Briefs
  generateTaskBrief: briefGenerator.generateTaskBrief,

  // Data Sovereignty & Portability
  exportToMarkdown: portability.exportToMarkdown,
  exportToJson: portability.exportToJson,
  importFromJson: portability.importFromJson,
  importFromMarkdown: portability.importFromMarkdown,

  // Core Governance, Settings & Granular Profile
  getConfig: governance.getConfig,
  setConfig: governance.setConfig,
  listConfig: governance.listConfig,
  deleteConfig: governance.deleteConfig,
  getUserProfile: governance.getUserProfile,
  updateUserProfile: governance.updateUserProfile,
  getGovernanceRules: governance.getGovernanceRules,
  setGovernanceRule: governance.setGovernanceRule,
  DEFAULT_GOVERNANCE_RULES: governance.DEFAULT_GOVERNANCE_RULES,

  // MCP Studio: Multi-IDE Model Context Protocol Hub
  getIdeProfiles: mcpStudio.getIdeProfiles,
  resolveIdeConfigPath: mcpStudio.resolveIdeConfigPath,
  setConfigPathOverride: mcpStudio.setConfigPathOverride,
  clearConfigPathOverrides: mcpStudio.clearConfigPathOverrides,
  getMcpConfig: mcpStudio.getMcpConfig,
  saveMcpConfig: mcpStudio.saveMcpConfig,
  scanAllMcpServers: mcpStudio.scanAllMcpServers,
  addMcpServer: mcpStudio.addMcpServer,
  updateMcpServer: mcpStudio.updateMcpServer,
  removeMcpServer: mcpStudio.removeMcpServer,
  cloneMcpServer: mcpStudio.cloneMcpServer,
  listMcpCatalog: mcpStudio.listMcpCatalog,
  testMcpServer: mcpStudio.testMcpServer,
  MCP_CATALOG: mcpStudio.MCP_CATALOG,

  // Tidy Sovereign Brain MCP Engine Services
  runSystemDoctor: brainDoctor.runSystemDoctor,
  searchHybridKnowledge: hybridSearch.searchHybridKnowledge,
  extractAndPersistKi: atomicKi.extractAndPersistKi,
  recallSessionTranscripts: transcriptForensics.recallSessionTranscripts,
  auditStorageHygiene: storageHygiene.auditStorageHygiene,
  checkContextualFirewall: firewallChecker.checkContextualFirewall,
  getSkillManifest: skillsLoader.getSkillManifest,

  // TidyAgent Sovereign Control Plane Engine (v1.6.0)
  MEMORY_TAXONOMIES: memoryTaxonomy.MEMORY_TAXONOMIES,
  normalizeTaxonomy: memoryTaxonomy.normalizeTaxonomy,
  isValidTaxonomy: memoryTaxonomy.isValidTaxonomy,
  getTaxonomyMetadata: memoryTaxonomy.getTaxonomyMetadata,
  listTaxonomies: memoryTaxonomy.listTaxonomies,
  classifyMemoryTaxonomy: memoryTaxonomy.classifyMemoryTaxonomy,

  TIER_NAMES: contextCompiler.TIER_NAMES,
  DEFAULT_TIER_PERCENTAGES: contextCompiler.DEFAULT_TIER_PERCENTAGES,
  estimateTokenCount: contextCompiler.estimateTokenCount,
  truncateToTokenBudget: contextCompiler.truncateToTokenBudget,
  compileContext: contextCompiler.compileContext,

  INTENT_TYPES: intentRouter.INTENT_TYPES,
  CAPABILITY_DIRECTORY: intentRouter.CAPABILITY_DIRECTORY,
  routeIntent: intentRouter.routeIntent
};


