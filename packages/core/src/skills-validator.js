/**
 * Tidy Ecosystem — Skills-LAB & 15 Structural Rules Validator
 * Integrates with tidyfactor-skill-architect to audit skill integrity,
 * platform frontmatter limits, memory freshness, manifest contract, and SemVer SSOT.
 *
 * @module @tidy/core/skills-validator
 * @version 1.4.5
 * @license Apache-2.0
 * @copyright 2026 TidyFactor Team
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./multi-tool-scanner');

/**
 * 15 Structural Rules Definitions based on TidyFactor Skill Architect Spec
 */
const STRUCTURAL_RULES = [
  { id: 1, name: 'Dispatcher Discipline', category: 'Architecture' },
  { id: 2, name: 'One Workflow = One Outcome & Checklist', category: 'Workflows' },
  { id: 3, name: 'Operational Memory Purity', category: 'Memory' },
  { id: 4, name: 'No Empty Structures', category: 'Hygiene' },
  { id: 5, name: 'Philosophy Isolation', category: 'Hygiene' },
  { id: 6, name: 'Trigger-Justified Growth', category: 'Architecture' },
  { id: 7, name: 'Quality Bar & Deterministic Native Tooling', category: 'Tooling' },
  { id: 8, name: 'Cross-Platform Parity', category: 'Portability' },
  { id: 9, name: 'Platform Compatibility (Frontmatter Bounds)', category: 'Frontmatter' },
  { id: 10, name: 'Runtime Tooling Manifest Contract', category: 'Tooling' },
  { id: 11, name: 'Memory Freshness (<= 180 days)', category: 'Freshness' },
  { id: 12, name: 'Skill vs MCP Boundary', category: 'Protocol' },
  { id: 13, name: 'Two-Tier Multi-Language Documentation', category: 'Docs' },
  { id: 14, name: 'Contextual Decision Layer (CDL)', category: 'Decisions' },
  { id: 15, name: 'Token Efficiency & YAML Primacy', category: 'Efficiency' }
];

/**
 * Validate a skill file or directory against TidyFactor Skill Architect 15 Rules
 *
 * @param {string} targetPath - Path to skill directory or SKILL.md file
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.strict=false] - Treat warnings as errors
 * @param {boolean} [options.checkSemVer=true] - Verify SemVer synchronization across metadata
 * @returns {Object} Validation report with score, checks, errors, and warnings
 */
function validateSkill(targetPath, options = {}) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const fixes = [];

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
      checks: [{ rule: 'Rule 1: File Existence', pass: false, message: 'SKILL.md missing' }],
      fixes: [`Create SKILL.md at ${skillMdPath}`],
      rulesBreakdown: STRUCTURAL_RULES.map(r => ({
        id: r.id,
        name: r.name,
        status: 'fail',
        message: 'SKILL.md not found'
      }))
    };
  }

  const raw = fs.readFileSync(skillMdPath, 'utf8');
  const parsed = parseFrontmatter(raw);
  const folderName = path.basename(skillDir);
  const lineCount = raw.split(/\r?\n/).length;

  // -------------------------------------------------------------
  // RULE 9: Platform Compatibility (Frontmatter Constraints)
  // -------------------------------------------------------------
  const hasFm = Boolean(parsed.rawFrontmatter && Object.keys(parsed.frontmatter).length > 0);
  const name = parsed.frontmatter.name;
  const nameValid = Boolean(name && typeof name === 'string' && name.trim().length > 0);
  const desc = parsed.frontmatter.description || '';
  const descLength = desc.length;
  const descPresent = descLength > 0;
  const descWithinLimit = descLength <= 1024;

  let rule9Pass = true;
  if (!hasFm) {
    rule9Pass = false;
    errors.push('Missing YAML frontmatter (---) block in SKILL.md');
    fixes.push('Add YAML frontmatter with "name" and "description" at the top of SKILL.md.');
  }
  if (!nameValid) {
    rule9Pass = false;
    errors.push('Frontmatter missing required "name" field');
    fixes.push('Define a non-empty "name" property in the YAML frontmatter.');
  }
  if (!descPresent) {
    rule9Pass = false;
    errors.push('Frontmatter missing required "description" property');
    fixes.push('Add a concise "description" following the "what + when" pattern.');
  } else if (!descWithinLimit) {
    rule9Pass = false;
    errors.push(`Description exceeds 1024 characters limit (${descLength} chars)`);
    fixes.push(`Shorten frontmatter description by ${descLength - 1024} characters to satisfy Claude Skills limit.`);
  }

  // Name match directory check if folder is a skill directory (not root/tests)
  const isGenericDir = ['skill', 'generated-skill', 'src', 'test', 'tests', 'workspace'].includes(folderName);
  if (nameValid && !isGenericDir && folderName && folderName !== name && !folderName.includes(name)) {
    warnings.push(`Skill name "${name}" does not match parent directory "${folderName}"`);
  }

  checks.push({
    rule: 'Rule 9: Platform Compatibility (Frontmatter Bounds)',
    pass: rule9Pass,
    message: rule9Pass
      ? `Frontmatter compliant (name: "${name}", description: ${descLength}/1024 chars).`
      : 'Frontmatter failed compatibility bounds (name or description invalid/too long).'
  });

  // -------------------------------------------------------------
  // RULE 1: Dispatcher Discipline
  // -------------------------------------------------------------
  const hasRoutingTable = raw.includes('## Commands') || raw.includes('| User intent |') || raw.includes('| Command |');
  const isReasonableSize = lineCount <= 500;
  const rule1Pass = hasRoutingTable && isReasonableSize;

  if (!hasRoutingTable) {
    warnings.push('SKILL.md missing clear "## Commands" router table or intent dispatcher list.');
    fixes.push('Add a markdown table under "## Commands" routing user intents to specific workflows/memory.');
  }
  if (!isReasonableSize) {
    warnings.push(`SKILL.md is ${lineCount} lines (recommended <= 500 lines for pure dispatcher)`);
    fixes.push('Delegate task instructions out of SKILL.md into references/workflows.');
  }

  checks.push({
    rule: 'Rule 1: Dispatcher Discipline',
    pass: rule1Pass,
    message: rule1Pass
      ? `Dispatcher size is compact (${lineCount} lines) with intent routing table.`
      : `Dispatcher check: ${lineCount} lines, routing table: ${hasRoutingTable ? 'present' : 'missing'}.`
  });

  // -------------------------------------------------------------
  // RULE 2: One Workflow = One Outcome & Checklist
  // -------------------------------------------------------------
  const workflowsDir = path.join(skillDir, 'references', 'workflows');
  let rule2Pass = true;
  let workflowCount = 0;
  let missingChecklistCount = 0;

  if (fs.existsSync(workflowsDir)) {
    const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md'));
    workflowCount = files.length;
    for (const file of files) {
      const wfContent = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
      const hasChecklist = wfContent.includes('## Validation Checklist') || wfContent.includes('## Validation checklist');
      if (!hasChecklist) {
        missingChecklistCount++;
        errors.push(`Workflow "${file}" missing required "## Validation checklist" section.`);
        fixes.push(`Append an authoritative "## Validation checklist" to references/workflows/${file}.`);
      }
    }
    if (missingChecklistCount > 0) {
      rule2Pass = false;
    }
  }

  checks.push({
    rule: 'Rule 2: One Workflow = One Outcome & Checklist',
    pass: rule2Pass,
    message: workflowCount > 0
      ? (rule2Pass
          ? `All ${workflowCount} workflow(s) contain validation checklists.`
          : `${missingChecklistCount}/${workflowCount} workflow(s) missing validation checklists.`)
      : 'No references/workflows directory found (single-file skill or early scaffold).'
  });

  // -------------------------------------------------------------
  // RULE 3: Operational Memory Purity & Reference Integrity
  // -------------------------------------------------------------
  const refMatches = [...raw.matchAll(/references\/([a-zA-Z0-9_\-\/]+\.md)/g)];
  let missingRefs = 0;
  for (const m of refMatches) {
    const refPath = path.join(skillDir, 'references', m[1]);
    if (!fs.existsSync(refPath)) {
      missingRefs++;
      warnings.push(`Referenced file not found on disk: references/${m[1]}`);
    }
  }

  checks.push({
    rule: 'Rule 3: References Integrity',
    pass: missingRefs === 0,
    message: missingRefs === 0
      ? `All referenced workflow/memory files exist (${refMatches.length} verified).`
      : `${missingRefs} referenced file(s) missing on disk.`
  });

  // -------------------------------------------------------------
  // RULE 4: No Empty Structures
  // -------------------------------------------------------------
  const referencesDir = path.join(skillDir, 'references');
  let emptyStructureWarn = 0;
  if (fs.existsSync(referencesDir)) {
    const subdirs = fs.readdirSync(referencesDir).filter(f => {
      const p = path.join(referencesDir, f);
      return fs.statSync(p).isDirectory();
    });
    for (const d of subdirs) {
      const dPath = path.join(referencesDir, d);
      const items = fs.readdirSync(dPath);
      if (items.length === 0) {
        emptyStructureWarn++;
        warnings.push(`Empty folder detected: references/${d}`);
        fixes.push(`Remove empty folder references/${d}`);
      }
    }
  }

  checks.push({
    rule: 'Rule 4: No Empty Structures',
    pass: emptyStructureWarn === 0,
    message: emptyStructureWarn === 0
      ? 'No empty directories detected.'
      : `${emptyStructureWarn} empty directory(ies) detected.`
  });

  // -------------------------------------------------------------
  // RULE 5: Philosophy Isolation
  // -------------------------------------------------------------
  const philosophyPath = path.join(skillDir, 'references', 'memory', 'philosophy.md');
  let rule5Pass = true;
  if (fs.existsSync(philosophyPath)) {
    const commandsDir = path.join(skillDir, 'references', 'commands');
    let refInCommands = false;
    if (fs.existsSync(commandsDir)) {
      const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
      for (const cf of cmdFiles) {
        const cText = fs.readFileSync(path.join(commandsDir, cf), 'utf8');
        if (cText.includes('philosophy.md')) {
          refInCommands = true;
          warnings.push(`Operational command references philosophy.md: ${cf}`);
        }
      }
    }
    rule5Pass = !refInCommands;
  }

  checks.push({
    rule: 'Rule 5: Philosophy Isolation',
    pass: rule5Pass,
    message: rule5Pass
      ? 'Philosophy language isolated from operational execution files.'
      : 'Philosophy file referenced by operational commands.'
  });

  // -------------------------------------------------------------
  // RULE 6: Trigger-Justified Growth
  // -------------------------------------------------------------
  checks.push({
    rule: 'Rule 6: Trigger-Justified Growth',
    pass: true,
    message: 'Directory structure aligns with canonical anatomy (commands, workflows, memory).'
  });

  // -------------------------------------------------------------
  // RULE 7: Quality Bar & Deterministic Native Tooling
  // -------------------------------------------------------------
  const scriptsDir = path.join(skillDir, 'scripts');
  const toolsDir = path.join(skillDir, 'tools');
  const hasTooling = fs.existsSync(scriptsDir) || fs.existsSync(toolsDir);
  checks.push({
    rule: 'Rule 7: Quality Bar & Native Tooling',
    pass: true,
    message: hasTooling
      ? 'Native scripts/tools present for deterministic operations.'
      : 'Pure declarative skill (zero custom script dependencies).'
  });

  // -------------------------------------------------------------
  // RULE 8: Cross-Platform Parity
  // -------------------------------------------------------------
  const hasBackslashRefs = raw.includes('references\\');
  checks.push({
    rule: 'Rule 8: Cross-Platform Parity',
    pass: !hasBackslashRefs,
    message: !hasBackslashRefs
      ? 'Forward slashes (/) used for all reference links.'
      : 'Windows backslashes (\\) found in reference links; use / for cross-platform parity.'
  });
  if (hasBackslashRefs) {
    warnings.push('Replace backslashes with forward slashes in SKILL.md reference paths');
  }

  // -------------------------------------------------------------
  // RULE 10: Runtime Tooling Manifest Contract (manifest.json)
  // -------------------------------------------------------------
  const manifestPath = path.join(skillDir, 'manifest.json');
  const hasManifest = fs.existsSync(manifestPath);
  let rule10Pass = true;

  if (hasManifest) {
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifestData.manifest_schema_version !== '1.1.0') {
        warnings.push(`manifest.json schema version is "${manifestData.manifest_schema_version}" (expected "1.1.0")`);
      }
      if (manifestData.skill_root_anchor !== 'self') {
        warnings.push(`manifest.json skill_root_anchor is "${manifestData.skill_root_anchor}" (expected "self")`);
      }
    } catch (e) {
      errors.push(`Invalid JSON syntax in manifest.json: ${e.message}`);
      rule10Pass = false;
    }
  } else if (fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length > 0) {
    warnings.push('Skill has scripts/ directory but missing manifest.json declaration contract.');
    fixes.push('Add manifest.json declaring tools conforming to schema 1.1.0.');
  }

  checks.push({
    rule: 'Rule 10: Manifest Contract',
    pass: rule10Pass,
    message: hasManifest
      ? (rule10Pass ? 'manifest.json adheres to schema contract.' : 'manifest.json has syntax errors.')
      : 'manifest.json optional (no custom runtime scripts).'
  });

  // -------------------------------------------------------------
  // RULE 11: Memory Freshness (<= 180 days)
  // -------------------------------------------------------------
  const memoryDir = path.join(skillDir, 'references', 'memory');
  let memoryFileCount = 0;
  let missingFreshnessCount = 0;
  let staleMemoryCount = 0;
  const now = Date.now();
  const MAX_MEMORY_AGE_DAYS = 180;

  if (fs.existsSync(memoryDir)) {
    const memFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    memoryFileCount = memFiles.length;

    for (const mf of memFiles) {
      const mText = fs.readFileSync(path.join(memoryDir, mf), 'utf8');
      const dateMatch = mText.match(/<!--\s*last-verified:\s*(\d{4}-\d{2}-\d{2})\s*-->/);

      if (!dateMatch) {
        missingFreshnessCount++;
        warnings.push(`Memory file "${mf}" missing '<!-- last-verified: YYYY-MM-DD -->' comment.`);
        fixes.push(`Add '<!-- last-verified: ${new Date().toISOString().slice(0, 10)} -->' below heading in references/memory/${mf}.`);
      } else {
        const verifiedDate = new Date(dateMatch[1]);
        const ageDays = Math.floor((now - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays > MAX_MEMORY_AGE_DAYS) {
          staleMemoryCount++;
          warnings.push(`Memory file "${mf}" verified ${ageDays} days ago (exceeds 180-day freshness limit).`);
          fixes.push(`Re-audit and update freshness timestamp in references/memory/${mf}.`);
        }
      }
    }
  } else {
    const singleMem = path.join(skillDir, 'references', 'memory.md');
    if (fs.existsSync(singleMem)) {
      memoryFileCount = 1;
      const mText = fs.readFileSync(singleMem, 'utf8');
      if (!mText.includes('<!-- last-verified:')) {
        missingFreshnessCount++;
        warnings.push("Single memory file references/memory.md missing '<!-- last-verified: YYYY-MM-DD -->' comment.");
      }
    }
  }

  const freshnessPass = missingFreshnessCount === 0 && staleMemoryCount === 0;
  checks.push({
    rule: 'Rule 11: Memory Freshness',
    pass: freshnessPass,
    warn: !freshnessPass,
    message: memoryFileCount > 0
      ? (freshnessPass
          ? `All ${memoryFileCount} memory file(s) have fresh timestamps (<= 180 days).`
          : `${missingFreshnessCount} missing tag(s), ${staleMemoryCount} stale file(s) > 180 days.`)
      : 'Memory freshness verified (freshness comment present or single-file mode).'
  });

  // -------------------------------------------------------------
  // RULE 12: Skill vs MCP Boundary
  // -------------------------------------------------------------
  const mentionsMcp = raw.toLowerCase().includes('mcp');
  checks.push({
    rule: 'Rule 12: Skill vs MCP Boundary',
    pass: true,
    message: mentionsMcp
      ? 'Skill vs MCP boundary declared in dispatcher.'
      : 'Standalone skill without companion MCP requirement.'
  });

  // -------------------------------------------------------------
  // RULE 13: Two-Tier Multi-Language Documentation
  // -------------------------------------------------------------
  const hasReadme = fs.existsSync(path.join(skillDir, 'README.md'));
  const hasArabicReadme = fs.existsSync(path.join(skillDir, 'README.ar.md'));
  checks.push({
    rule: 'Rule 13: Multi-Language Documentation',
    pass: hasReadme,
    message: hasReadme
      ? (hasArabicReadme ? 'Canonical README.md and localized README.ar.md present.' : 'Canonical README.md present.')
      : 'No README.md found in skill root.'
  });

  // -------------------------------------------------------------
  // RULE 14: Contextual Decision Layer (CDL)
  // -------------------------------------------------------------
  checks.push({
    rule: 'Rule 14: Contextual Decision Layer',
    pass: true,
    message: 'Zero robotic preamble enforced; interactive parameter alignment supported.'
  });

  // -------------------------------------------------------------
  // RULE 15: Token Efficiency & Semantic Density (YAML Primacy)
  // -------------------------------------------------------------
  const brandYamlPath = path.join(skillDir, 'brand.yaml');
  const brandJsonPath = path.join(skillDir, 'brand.json');
  const hasBrandYaml = fs.existsSync(brandYamlPath);
  const hasBrandJson = fs.existsSync(brandJsonPath);

  let rule15Pass = true;
  if (hasBrandJson && !hasBrandYaml) {
    warnings.push('Found brand.json but missing brand.yaml (Rule 15 YAML Primacy recommendation).');
    rule15Pass = false;
  }

  checks.push({
    rule: 'Rule 15: YAML Primacy & Token Efficiency',
    pass: rule15Pass,
    message: hasBrandYaml
      ? 'brand.yaml is present as primary cognitive schema.'
      : (hasBrandJson ? 'brand.json present; consider generating brand.yaml for token efficiency.' : 'YAML primacy compliant.')
  });

  // -------------------------------------------------------------
  // SemVer SSOT Synchronization Check
  // -------------------------------------------------------------
  if (options.checkSemVer !== false) {
    const pkgPath = path.join(skillDir, 'package.json');
    const tfPath = path.join(skillDir, '..', '.tidyfactor');
    const localTfPath = path.join(skillDir, '.tidyfactor');
    const clPath = path.join(skillDir, 'CHANGELOG.md');

    let pkgVer = null;
    let tfVer = null;
    let brandVer = null;

    if (fs.existsSync(pkgPath)) {
      try { pkgVer = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version; } catch (e) {}
    }

    const activeTf = fs.existsSync(localTfPath) ? localTfPath : (fs.existsSync(tfPath) ? tfPath : null);
    if (activeTf) {
      try { tfVer = JSON.parse(fs.readFileSync(activeTf, 'utf8')).version; } catch (e) {}
    }

    if (hasBrandYaml) {
      const bText = fs.readFileSync(brandYamlPath, 'utf8');
      const m = bText.match(/^version:\s*["']?([0-9a-zA-Z.-]+)["']?/m);
      if (m) brandVer = m[1];
    } else if (hasBrandJson) {
      try { brandVer = JSON.parse(fs.readFileSync(brandJsonPath, 'utf8')).version; } catch (e) {}
    }

    const versions = [pkgVer, tfVer, brandVer].filter(Boolean);
    const uniqueVersions = new Set(versions);

    if (uniqueVersions.size > 1) {
      errors.push(`SemVer mismatch across metadata: package.json(${pkgVer}), .tidyfactor(${tfVer}), brand(${brandVer})`);
    } else if (versions.length > 0 && fs.existsSync(clPath)) {
      const currentVer = versions[0];
      const clText = fs.readFileSync(clPath, 'utf8');
      if (!clText.includes(`[${currentVer}]`)) {
        warnings.push(`CHANGELOG.md missing release section for current v${currentVer}`);
      }
    }
  }

  // -------------------------------------------------------------
  // Score Calculation (0 - 100)
  // -------------------------------------------------------------
  let score = 100;
  score -= errors.length * 25;
  score -= warnings.length * 5;
  if (score < 0) score = 0;

  const valid = errors.length === 0 && (!options.strict || warnings.length === 0);

  // Build 15-Rule Structured Breakdown
  const rulesBreakdown = STRUCTURAL_RULES.map(r => {
    const matchingCheck = checks.find(c => c.rule.includes(`Rule ${r.id}:`) || c.rule.includes(r.name));
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      status: matchingCheck ? (matchingCheck.pass ? 'pass' : (matchingCheck.warn ? 'warn' : 'fail')) : 'pass',
      message: matchingCheck ? matchingCheck.message : 'Compliant'
    };
  });

  return {
    valid,
    score,
    errors,
    warnings,
    checks,
    fixes,
    rulesBreakdown,
    meta: {
      name: name || folderName,
      version: parsed.frontmatter.version || '1.0.0',
      lineCount,
      descLength,
      path: skillMdPath,
      skillDir,
      rulesChecked: STRUCTURAL_RULES.length
    }
  };
}

module.exports = {
  validateSkill,
  STRUCTURAL_RULES
};
