#!/usr/bin/env node
/**
 * Tidy Leak & Hygiene Auditor
 * Pre-push / pre-publish audit to prevent accidental commits of local machine paths,
 * private credentials, or internal environment details into public repositories.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Directories and files to strictly ignore
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.learning',
  'dist',
  'build',
  '.vscode',
  '.idea'
]);

const IGNORED_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.pdf',
  '.db',
  '.db-wal',
  '.db-shm',
  '.sqlite',
  '.skill'
]);

// Leak patterns to flag
const SUSPICIOUS_PATTERNS = [
  { pattern: /wamp64/i, label: 'Local WAMP Path (wamp64)' },
  { pattern: /[a-zA-Z]:\\(?:Users|home)\\[^\s"'`<>]+/i, label: 'Absolute User Directory Path' },
  { pattern: /192\.168\.\d+\.\d+/, label: 'Private Local IP (192.168.x.x)' },
  { pattern: /10\.\d+\.\d+\.\d+/, label: 'Private Subnet IP (10.x.x.x)' },
  { pattern: /(?:api_key|secret_key|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i, label: 'Hardcoded Secret/Key' }
];

// Allowlist for legitimate pattern references in documentation or tests
const ALLOWLIST_FILES = new Set([
  'check-leaks.js',
  'AGENTS.md'
]);

let totalFilesScanned = 0;
const violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IGNORED_EXTS.has(ext)) continue;
      if (ALLOWLIST_FILES.has(entry.name)) continue;

      totalFilesScanned++;
      checkFile(fullPath, relPath);
    }
  }
}

function checkFile(filePath, relPath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      for (const rule of SUSPICIOUS_PATTERNS) {
        if (rule.pattern.test(line)) {
          // Check if line is a comment or rule mentioning the check itself
          if (line.includes('check-leaks') || line.includes('ZERO Leakage Policy')) {
            continue;
          }
          violations.push({
            file: relPath,
            lineNum: idx + 1,
            label: rule.label,
            snippet: line.trim().substring(0, 100)
          });
        }
      }
    });
  } catch {
    // Skip binary or unreadable files
  }
}

console.log(`\n🔍 Scanning workspace for sensitive local environment data...`);
scanDirectory(ROOT_DIR);

console.log(`📊 Scanned ${totalFilesScanned} file(s).`);

if (violations.length === 0) {
  console.log(`\n✅ [PASSED] Zero sensitive local paths or credentials found. Repository is public-safe.\n`);
  process.exit(0);
} else {
  console.log(`\n❌ [FAILED] Found ${violations.length} potential leak(s):\n`);
  violations.forEach(v => {
    console.log(`  - [${v.file}:${v.lineNum}] ${v.label}`);
    console.log(`    Snippet: ${v.snippet}\n`);
  });
  process.exit(1);
}
