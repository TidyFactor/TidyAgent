/**
 * Tidy Ecosystem — Sovereign Personal Assistant Kernel Entry
 * Main module exporting Database, Memory, Apps, Subagents, and Portability APIs.
 *
 * @module @tidy/core
 * @version 1.4.2
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 * @see https://github.com/TidyFactor/Agent
 */


const db = require('./db');
const memory = require('./memory');
const apps = require('./apps');
const subagents = require('./subagents');
const skillsLoader = require('./skills-loader');
const briefGenerator = require('./brief-generator');
const portability = require('./portability');
const governance = require('./governance');

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
  recallMemory: memory.recallMemory,
  forgetMemory: memory.forgetMemory,
  listMemories: memory.listMemories,
  pruneMemories: memory.pruneMemories,
  calculateCognitiveScore: memory.calculateCognitiveScore,
  pruneDecayedMemories: memory.pruneDecayedMemories,
  TIER_LAMBDAS: memory.TIER_LAMBDAS,
  CATEGORY_BOOSTS: memory.CATEGORY_BOOSTS,

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

  // Subagents
  listSubagents: subagents.listSubagents,
  getSubagent: subagents.getSubagent,
  registerSubagent: subagents.registerSubagent,
  prepareSubagentContext: subagents.prepareSubagentContext,
  runSubagent: subagents.runSubagent,

  // Community Skills as Managed Agents
  parseSkillMd: skillsLoader.parseSkillMd,
  inferDomain: skillsLoader.inferDomain,
  registerSkillFromPath: skillsLoader.registerSkillFromPath,
  discoverSkills: skillsLoader.discoverSkills,
  listRegisteredSkills: skillsLoader.listRegisteredSkills,
  getRegisteredSkill: skillsLoader.getRegisteredSkill,

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
  DEFAULT_GOVERNANCE_RULES: governance.DEFAULT_GOVERNANCE_RULES
};
