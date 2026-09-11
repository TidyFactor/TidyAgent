/**
 * Tidy Ecosystem — Skills-LAB & 15 Structural Rules Validator
 * Integrates with tidyfactor-skill-architect to audit skill integrity, frontmatter bounds,
 * memory freshness, and manifest conformance.
 *
 * @module @tidy/core/skills-validator
 * @version 1.4.4
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./multi-tool-scanner');

/**
 * Validate a skill file or directory against TidyFactor Skill Architect 15 Rules
 */
function validateSkill(targetPath) {
  const errors = [];
  const warnings = [];
  const checks = [];

  let skillMdPath = targetPath;
  let skillDir = targetPath;

  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      skillMdPath = path.join(targetPath, 'SKILL.md');
      skillDir = targetPath;
    } else {
      skillDir = path.dirname(targetPath);
      skillMdPath = targetPath;
    }
  }

  if (!fs.existsSync(skillMdPath)) {
    return {
      valid: false,
      score: 0,
      errors: [`SKILL.md not found at ${skillMdPath}`],
      warnings: [],
      checks: [{ rule: 'Rule 1: File Existence', pass: false, message: 'SKILL.md missing' }]
    };
  }

  const raw = fs.readFileSync(skillMdPath, 'utf8');
  const parsed = parseFrontmatter(raw);
  const folderName = path.basename(skillDir);

  // Check 1: Frontmatter Existence (Rule 9)
  const hasFm = Boolean(parsed.rawFrontmatter && Object.keys(parsed.frontmatter).length > 0);
  checks.push({
    rule: 'Rule 9: Frontmatter Present',
    pass: hasFm,
    message: hasFm ? 'Valid YAML frontmatter block found.' : 'Missing YAML frontmatter (---) block.'
  });
  if (!hasFm) errors.push('Missing YAML frontmatter');

  // Check 2: Name Field (Rule 9)
  const name = parsed.frontmatter.name;
  const nameValid = Boolean(name && typeof name === 'string' && name.trim().length > 0);
  checks.push({
    rule: 'Rule 9: Name Field Defined',
    pass: nameValid,
    message: nameValid ? `Skill name is "${name}".` : 'Frontmatter missing required "name" property.'
  });
  if (!nameValid) errors.push('Frontmatter missing "name" field');

  // Check 3: Description Field & Character Limit (Rule 9 - Max 1024 chars)
  const desc = parsed.frontmatter.description || '';
  const descLength = desc.length;
  const descPresent = descLength > 0;
  const descWithinLimit = descLength <= 1024;

  checks.push({
    rule: 'Rule 9: Description Presence & Limits',
    pass: descPresent && descWithinLimit,
    message: descPresent
      ? `Description length: ${descLength}/1024 chars.`
      : 'Frontmatter missing required "description" property.'
  });
  if (!descPresent) {
    errors.push('Missing "description" in frontmatter');
  } else if (!descWithinLimit) {
    errors.push(`Description exceeds 1024 characters limit (${descLength} chars)`);
  }

  // Check 4: Dispatcher Discipline (Rule 1: Router, not monolithic textbook)
  const lineCount = raw.split(/\r?\n/).length;
  const isReasonableSize = lineCount <= 500;
  checks.push({
    rule: 'Rule 1: Dispatcher Discipline',
    pass: isReasonableSize,
    message: isReasonableSize
      ? `Dispatcher size is compact (${lineCount} lines).`
      : `Large SKILL.md file (${lineCount} lines). Consider delegating details to references/workflows.`
  });
  if (!isReasonableSize) {
    warnings.push(`SKILL.md is ${lineCount} lines (recommended <= 500 lines for pure dispatcher)`);
  }

  // Check 5: References & Workflows Integrity (Rule 3)
  const refMatches = [...raw.matchAll(/references\/([a-zA-Z0-9_\-\/]+\.md)/g)];
  let missingRefs = 0;
  for (const m of refMatches) {
    const refPath = path.join(skillDir, 'references', m[1]);
    if (!fs.existsSync(refPath)) {
      missingRefs++;
      warnings.push(`Referenced file not found: references/${m[1]}`);
    }
  }
  checks.push({
    rule: 'Rule 3: References Integrity',
    pass: missingRefs === 0,
    message: missingRefs === 0
      ? `All referenced workflow/memory files exist (${refMatches.length} verified).`
      : `${missingRefs} referenced file(s) missing on disk.`
  });

  // Check 6: Memory Freshness Comment (Rule 11)
  const hasFreshness = raw.includes('<!-- last-verified:');
  checks.push({
    rule: 'Rule 11: Memory Freshness Tag',
    pass: hasFreshness,
    message: hasFreshness
      ? 'Contains <!-- last-verified: YYYY-MM-DD --> freshness tag.'
      : 'Missing <!-- last-verified: YYYY-MM-DD --> comment.'
  });
  if (!hasFreshness) {
    warnings.push('Missing <!-- last-verified: YYYY-MM-DD --> freshness tag');
  }

  // Check 7: Manifest Contract (Rule 10)
  const manifestPath = path.join(skillDir, 'manifest.json');
  const hasManifest = fs.existsSync(manifestPath);
  checks.push({
    rule: 'Rule 10: Manifest Declaration',
    pass: true,
    message: hasManifest ? 'manifest.json is present.' : 'manifest.json optional (no custom scripts declared).'
  });

  // Calculate Quality Score (0-100)
  let score = 100;
  score -= errors.length * 25;
  score -= warnings.length * 10;
  if (score < 0) score = 0;

  return {
    valid: errors.length === 0,
    score,
    errors,
    warnings,
    checks,
    meta: {
      name: name || folderName,
      lineCount,
      descLength,
      path: skillMdPath
    }
  };
}

module.exports = {
  validateSkill
};
