/**
 * Tidy Ecosystem — Storage Hygiene & Safe Pruning Engine
 * Audits and purges session recordings, cache artifacts, and decayed ephemeral records.
 *
 * @module @tidy/core/storage-hygiene
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { pruneDecayedMemories } = require('./memory');

function getHomeDir() {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
}

function getBrainRootDir() {
  return path.join(getHomeDir(), '.gemini', 'antigravity-ide', 'brain');
}

/**
 * Audits disk consumption and optionally prunes aged temporary files.
 *
 * @param {object} [options]
 * @param {number} [options.daysThreshold=7] Minimum age in days for prunable items
 * @param {boolean} [options.dryRun=true] Safe dry-run mode (does not delete)
 * @param {boolean} [options.prune=false] Explicit flag to execute actual deletion
 * @returns {object} Audit and pruning telemetry
 */
function auditStorageHygiene(options = {}) {
  const daysThreshold = Math.max(1, options.daysThreshold || 7);
  const dryRun = options.prune === true ? false : (options.dryRun !== false);
  const brainRoot = getBrainRootDir();
  const nowMs = Date.now();
  const maxAgeMs = daysThreshold * 24 * 60 * 60 * 1000;

  const candidateFiles = [];
  let totalBytes = 0;

  if (fs.existsSync(brainRoot)) {
    try {
      const convDirs = fs.readdirSync(brainRoot, { withFileTypes: true });
      for (const convDir of convDirs) {
        if (!convDir.isDirectory()) continue;

        // 1. Recordings (.webp)
        const recDir = path.join(brainRoot, convDir.name, '.system_generated', 'recordings');
        if (fs.existsSync(recDir)) {
          try {
            const files = fs.readdirSync(recDir, { withFileTypes: true });
            for (const f of files) {
              if (f.isFile()) {
                const fullPath = path.join(recDir, f.name);
                const stat = fs.statSync(fullPath);
                if (nowMs - stat.mtimeMs >= maxAgeMs) {
                  candidateFiles.push({ path: fullPath, category: 'recording', size: stat.size, mtime: stat.mtime });
                  totalBytes += stat.size;
                }
              }
            }
          } catch {}
        }

        // 2. Scratch files
        const scratchDir = path.join(brainRoot, convDir.name, 'scratch');
        if (fs.existsSync(scratchDir)) {
          try {
            const files = fs.readdirSync(scratchDir, { withFileTypes: true });
            for (const f of files) {
              if (f.isFile()) {
                const fullPath = path.join(scratchDir, f.name);
                const stat = fs.statSync(fullPath);
                if (nowMs - stat.mtimeMs >= maxAgeMs) {
                  candidateFiles.push({ path: fullPath, category: 'scratch', size: stat.size, mtime: stat.mtime });
                  totalBytes += stat.size;
                }
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  let deletedCount = 0;
  let freedBytes = 0;

  if (!dryRun) {
    for (const item of candidateFiles) {
      try {
        fs.unlinkSync(item.path);
        deletedCount++;
        freedBytes += item.size;
      } catch {}
    }
  }

  // 3. Prune decayed ephemeral memory records from SQLite SSOT
  let memoryPruneStats = { pruned: 0 };
  if (!dryRun) {
    try {
      memoryPruneStats = pruneDecayedMemories({ threshold: 0.1 });
    } catch {}
  }

  const totalMb = Number((totalBytes / (1024 * 1024)).toFixed(2));
  const freedMb = Number((freedBytes / (1024 * 1024)).toFixed(2));

  return {
    dryRun,
    daysThreshold,
    action: dryRun ? 'audit_only' : 'pruned',
    candidateCount: candidateFiles.length,
    candidateMb: totalMb,
    deletedFilesCount: deletedCount,
    freedMb,
    memoryRecordsPruned: memoryPruneStats.pruned || 0,
    summary: dryRun
      ? `Audit complete: ${candidateFiles.length} files (${totalMb} MB) older than ${daysThreshold} days eligible for pruning.`
      : `Hygiene purge complete: Deleted ${deletedCount} files, freed ${freedMb} MB disk space and pruned ${memoryPruneStats.pruned || 0} decayed memories.`
  };
}

module.exports = {
  auditStorageHygiene,
  getBrainRootDir
};
