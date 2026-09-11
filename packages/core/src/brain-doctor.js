/**
 * Tidy Ecosystem — Brain Doctor & System Health Diagnostics
 * Comprehensive health audit of SQLite SSOT, 4-tier knowledge taxonomy, storage footprint, and skills.
 *
 * @module @tidy/core/brain-doctor
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDb, resolveDbPath } = require('./db');
const { listRegisteredSkills } = require('./skills-loader');

function getHomeDir() {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
}

function getKnowledgeRootDir() {
  return path.join(getHomeDir(), '.gemini', 'knowledge');
}

function getBrainRootDir() {
  return path.join(getHomeDir(), '.gemini', 'antigravity-ide', 'brain');
}

/**
 * Recursively counts files and total size in bytes for a directory.
 */
function getDirMetrics(dirPath) {
  let fileCount = 0;
  let totalBytes = 0;

  if (!fs.existsSync(dirPath)) {
    return { fileCount, totalBytes };
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const sub = getDirMetrics(fullPath);
        fileCount += sub.fileCount;
        totalBytes += sub.totalBytes;
      } else if (entry.isFile()) {
        fileCount++;
        try {
          const stat = fs.statSync(fullPath);
          totalBytes += stat.size;
        } catch {}
      }
    }
  } catch {}

  return { fileCount, totalBytes };
}

/**
 * Runs a comprehensive system and brain diagnostic audit.
 * @returns {object} Health status, metrics, and markdown diagnostic report.
 */
function runSystemDoctor() {
  const issues = [];
  const dbPath = resolveDbPath();
  const dbExists = fs.existsSync(dbPath);

  let dbSizeMb = 0;
  let walMode = 'unknown';
  let integrityOk = false;
  let memoryCount = 0;
  let taskCount = 0;
  let snippetCount = 0;
  let journalCount = 0;

  if (dbExists) {
    try {
      const stat = fs.statSync(dbPath);
      dbSizeMb = Number((stat.size / (1024 * 1024)).toFixed(2));
    } catch {}

    try {
      const db = getDb();
      const walRow = db.prepare('PRAGMA journal_mode;').get();
      walMode = (walRow?.journal_mode || '').toLowerCase();
      if (walMode !== 'wal') {
        issues.push(`SQLite journal mode is "${walMode}", expected "wal" for concurrency.`);
      }

      const integrityRow = db.prepare('PRAGMA quick_check;').get();
      integrityOk = integrityRow?.quick_check === 'ok';
      if (!integrityOk) {
        issues.push('SQLite quick_check reported integrity errors.');
      }

      const memRow = db.prepare('SELECT COUNT(*) as count FROM memory_nodes').get();
      memoryCount = memRow?.count || 0;

      const tskRow = db.prepare('SELECT COUNT(*) as count FROM app_tasks').get();
      taskCount = tskRow?.count || 0;

      const snpRow = db.prepare('SELECT COUNT(*) as count FROM app_snippets').get();
      snippetCount = snpRow?.count || 0;

      const jrnRow = db.prepare('SELECT COUNT(*) as count FROM app_journal').get();
      journalCount = jrnRow?.count || 0;
    } catch (err) {
      issues.push(`Database query error: ${err.message}`);
    }
  } else {
    issues.push(`SQLite database does not exist at ${dbPath}`);
  }

  // 4-Tier Knowledge Base metrics on disk
  const knowledgeRoot = getKnowledgeRootDir();
  const taxonomy = {
    global: getDirMetrics(path.join(knowledgeRoot, 'global')),
    tech: getDirMetrics(path.join(knowledgeRoot, 'tech')),
    projects: getDirMetrics(path.join(knowledgeRoot, 'projects')),
    session: getDirMetrics(path.join(knowledgeRoot, 'session'))
  };
  const totalKiFiles = taxonomy.global.fileCount + taxonomy.tech.fileCount + taxonomy.projects.fileCount + taxonomy.session.fileCount;
  const totalKiBytes = taxonomy.global.totalBytes + taxonomy.tech.totalBytes + taxonomy.projects.totalBytes + taxonomy.session.totalBytes;
  const totalKiMb = Number((totalKiBytes / (1024 * 1024)).toFixed(2));

  // Brain sessions & recordings storage footprint
  const brainRoot = getBrainRootDir();
  const brainMetrics = getDirMetrics(brainRoot);
  const brainMb = Number((brainMetrics.totalBytes / (1024 * 1024)).toFixed(2));

  // Registered Skills
  let skillsCount = 0;
  try {
    const skills = listRegisteredSkills();
    skillsCount = Array.isArray(skills) ? skills.length : 0;
  } catch {}

  const status = issues.length === 0 ? 'HEALTHY' : (integrityOk ? 'WARNING' : 'CRITICAL');

  const report = [
    `# 🩺 Tidy Brain Doctor Report — ${status}`,
    `**Status**: ${status === 'HEALTHY' ? '🟢 Operational' : status === 'WARNING' ? '🟡 Warning' : '🔴 Critical'}`,
    `**Timestamp**: ${new Date().toISOString()}`,
    '',
    '## 💾 SQLite Single Source of Truth',
    `- **Path**: \`${dbPath}\``,
    `- **Size**: ${dbSizeMb} MB`,
    `- **Journal Mode**: \`${walMode}\` (Target: WAL)`,
    `- **Integrity Check**: ${integrityOk ? '✅ OK' : '❌ Failed'}`,
    `- **Memories**: ${memoryCount} items`,
    `- **Tasks**: ${taskCount} | **Snippets**: ${snippetCount} | **Journal**: ${journalCount}`,
    '',
    '## 🧠 4-Tier Knowledge Taxonomy (~/.gemini/knowledge/)',
    `- **Global**: ${taxonomy.global.fileCount} KIs`,
    `- **Tech**: ${taxonomy.tech.fileCount} KIs`,
    `- **Projects**: ${taxonomy.projects.fileCount} KIs`,
    `- **Session**: ${taxonomy.session.fileCount} KIs`,
    `- **Total KIs**: ${totalKiFiles} files (${totalKiMb} MB)`,
    '',
    '## 📦 Agent Storage & Skills',
    `- **Brain Sessions & Artifacts**: ${brainMetrics.fileCount} files (${brainMb} MB)`,
    `- **Registered Skills**: ${skillsCount} skills active`,
    ''
  ];

  if (issues.length > 0) {
    report.push('## ⚠️ Detected Issues & Recommendations');
    for (const issue of issues) {
      report.push(`- ${issue}`);
    }
    report.push('');
  }

  return {
    status,
    healthy: status === 'HEALTHY',
    issues,
    db: {
      path: dbPath,
      sizeMb: dbSizeMb,
      walMode,
      integrityOk,
      memoryCount,
      taskCount,
      snippetCount,
      journalCount
    },
    taxonomy: {
      root: knowledgeRoot,
      totalFiles: totalKiFiles,
      totalMb: totalKiMb,
      tiers: taxonomy
    },
    brainStorage: {
      root: brainRoot,
      fileCount: brainMetrics.fileCount,
      sizeMb: brainMb
    },
    skillsCount,
    markdownReport: report.join('\n')
  };
}

module.exports = {
  runSystemDoctor,
  getKnowledgeRootDir,
  getBrainRootDir,
  getDirMetrics
};
