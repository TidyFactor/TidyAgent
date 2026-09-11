/**
 * Tidy Ecosystem — Transcript Forensics & Decision Scanner
 * On-demand stream scanner searching past agent conversation transcripts without active context bloat.
 *
 * @module @tidy/core/transcript-forensics
 * @version 1.5.0
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getHomeDir() {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
}

function getBrainRootDir() {
  return path.join(getHomeDir(), '.gemini', 'antigravity-ide', 'brain');
}

/**
 * Searches past session transcripts for decisions, rules, and facts matching a query.
 *
 * @param {object} params
 * @param {string} params.query Search terms or keywords
 * @param {number} [params.days=7] Age window in days
 * @param {number} [params.limit=10] Max snippets to return
 * @param {string} [params.conversationId] Target specific conversation ID
 * @returns {object} Ranked forensic matches
 */
function recallSessionTranscripts(params = {}) {
  const query = (params.query || '').trim();
  if (!query) {
    return { query: '', totalFound: 0, snippets: [] };
  }

  const days = Math.max(1, params.days || 7);
  const limit = Math.max(1, Math.min(params.limit || 10, 50));
  const targetConvId = params.conversationId || null;
  const brainRoot = getBrainRootDir();

  if (!fs.existsSync(brainRoot)) {
    return { query, days, totalFound: 0, snippets: [] };
  }

  const nowMs = Date.now();
  const maxAgeMs = days * 24 * 60 * 60 * 1000;
  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const candidateDirs = [];
  try {
    const entries = fs.readdirSync(brainRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (targetConvId && entry.name !== targetConvId) continue;

      const logPath = path.join(brainRoot, entry.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(logPath)) {
        try {
          const stat = fs.statSync(logPath);
          if (nowMs - stat.mtimeMs <= maxAgeMs) {
            candidateDirs.push({ convId: entry.name, logPath, mtime: stat.mtime });
          }
        } catch {}
      }
    }
  } catch {}

  // Sort candidate conversations by most recent first
  candidateDirs.sort((a, b) => b.mtime - a.mtime);

  const snippets = [];

  for (const { convId, logPath, mtime } of candidateDirs) {
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let entry = null;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }

        const rawText = (typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content || '')).toLowerCase();
        let matchCount = 0;
        for (const token of queryTokens) {
          if (rawText.includes(token)) matchCount++;
        }

        if (matchCount > 0) {
          const relevance = Number((matchCount / queryTokens.length).toFixed(2));
          let cleanContent = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);
          cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

          snippets.push({
            conversationId: convId,
            stepIndex: entry.step_index ?? i,
            source: entry.source || 'UNKNOWN',
            type: entry.type || 'STEP',
            timestamp: mtime.toISOString(),
            score: relevance,
            snippet: cleanContent.slice(0, 320),
            filePath: logPath
          });

          if (snippets.length >= limit * 2) break;
        }
      }
    } catch {}

    if (snippets.length >= limit * 2) break;
  }

  // Sort matches by relevance score
  snippets.sort((a, b) => (b.score || 0) - (a.score || 0));
  const finalResults = snippets.slice(0, limit);

  return {
    query,
    days,
    conversationsScanned: candidateDirs.length,
    totalFound: finalResults.length,
    snippets: finalResults
  };
}

module.exports = {
  recallSessionTranscripts,
  getBrainRootDir
};
