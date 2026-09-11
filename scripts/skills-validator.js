#!/usr/bin/env node
/**
 * Tidy Ecosystem — Skills-LAB 15 Structural Rules Validator CLI
 * Powered by @tidy/core/skills-validator & tidyfactor-skill-architect
 *
 * Usage:
 *   node scripts/skills-validator.js [path-to-skill] [options]
 *
 * Options:
 *   --json       Output report as formatted JSON
 *   --strict     Fail (exit 1) if any compliance warnings exist
 *   --verbose    Display comprehensive check messages for each rule
 *   --rules      Display definitions of all 15 Structural Rules
 *   -h, --help   Show usage instructions
 */

const path = require('path');
const fs = require('fs');
const { validateSkill, STRUCTURAL_RULES } = require('../packages/core/src/skills-validator');

function printUsage() {
  console.log(`
TidyFactor Skills-LAB 15 Structural Rules Validator
==================================================

Usage:
  node scripts/skills-validator.js [skill-path] [options]

Options:
  --json       Output validation report in raw JSON format
  --strict     Exit with code 1 if warnings are detected
  --verbose    Show full messages for every check
  --rules      List all 15 Structural Rules from tidyfactor-skill-architect
  -h, --help   Show this help screen

Examples:
  node scripts/skills-validator.js packages/skill
  node scripts/skills-validator.js ~/.gemini/config/skills/tidy --verbose
  node scripts/skills-validator.js . --strict
`);
}

function printRulesCatalog() {
  console.log('\n============================================================');
  console.log('  TIDYFACTOR SKILL ARCHITECT — 15 STRUCTURAL RULES');
  console.log('============================================================\n');
  STRUCTURAL_RULES.forEach(r => {
    console.log(`  Rule ${r.id.toString().padStart(2, ' ')}: [${r.category.padEnd(12, ' ')}] ${r.name}`);
  });
  console.log('\nReference: references/memory/spec.md\n');
}

function runCli() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (args.includes('--rules')) {
    printRulesCatalog();
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const isStrict = args.includes('--strict');
  const isVerbose = args.includes('--verbose');

  // Find target path (first non-flag argument)
  let targetArg = args.find(a => !a.startsWith('--') && !a.startsWith('-'));
  if (!targetArg) {
    if (fs.existsSync(path.join(process.cwd(), 'SKILL.md'))) {
      targetArg = process.cwd();
    } else if (fs.existsSync(path.join(process.cwd(), 'packages', 'skill'))) {
      targetArg = path.join(process.cwd(), 'packages', 'skill');
    } else {
      targetArg = process.cwd();
    }
  }

  const targetPath = path.resolve(process.cwd(), targetArg);

  const report = validateSkill(targetPath, { strict: isStrict });

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.valid ? 0 : 1);
  }

  // Terminal Formatted Output
  const cReset = '\x1b[0m';
  const cBold = '\x1b[1m';
  const cGreen = '\x1b[32m';
  const cYellow = '\x1b[33m';
  const cRed = '\x1b[31m';
  const cCyan = '\x1b[36m';
  const cDim = '\x1b[2m';

  console.log('\n' + cBold + '='.repeat(64) + cReset);
  console.log(`  ${cBold}TIDYFACTOR SKILL ARCHITECT VALIDATION REPORT${cReset}`);
  console.log('='.repeat(64));

  console.log(`\n  ${cDim}Target Path:${cReset}  ${report.meta?.path || targetPath}`);
  console.log(`  ${cDim}Skill Name:${cReset}   ${cBold}${report.meta?.name || 'Unknown'}${cReset}`);
  console.log(`  ${cDim}Lines Count:${cReset}  ${report.meta?.lineCount || 0} lines`);
  console.log(`  ${cDim}Description:${cReset}  ${report.meta?.descLength || 0}/1024 chars`);

  const scoreColor = report.score >= 80 ? cGreen : (report.score >= 50 ? cYellow : cRed);
  const statusBadge = report.valid
    ? `${cGreen}${cBold}PASS${cReset}`
    : `${cRed}${cBold}FAIL${cReset}`;

  console.log(`\n  ${cDim}Compliance Score:${cReset} ${scoreColor}${cBold}${report.score}/100${cReset}  [${statusBadge}]`);

  console.log('\n' + '-'.repeat(64));
  console.log(`  ${cBold}15 Structural Rules Breakdown:${cReset}`);
  console.log('-'.repeat(64));

  if (report.rulesBreakdown && report.rulesBreakdown.length > 0) {
    report.rulesBreakdown.forEach(rule => {
      let icon = `${cGreen}✓ PASS${cReset}`;
      if (rule.status === 'fail') icon = `${cRed}❌ FAIL${cReset}`;
      else if (rule.status === 'warn') icon = `${cYellow}⚠️ WARN${cReset}`;

      const ruleNum = `Rule ${rule.id.toString().padStart(2, '0')}`;
      console.log(`  ${icon}  ${cBold}${ruleNum}:${cReset} ${rule.name}`);
      if (isVerbose || rule.status !== 'pass') {
        console.log(`         ${cDim}↳ ${rule.message}${cReset}`);
      }
    });
  }

  if (report.warnings && report.warnings.length > 0) {
    console.log('\n' + cYellow + cBold + `  Compliance Warnings (${report.warnings.length}):` + cReset);
    report.warnings.forEach(w => console.log(`    ${cYellow}⚠️ ${w}${cReset}`));
  }

  if (report.errors && report.errors.length > 0) {
    console.log('\n' + cRed + cBold + `  Structural Errors (${report.errors.length}):` + cReset);
    report.errors.forEach(e => console.log(`    ${cRed}❌ ${e}${cReset}`));
  }

  if (report.fixes && report.fixes.length > 0) {
    console.log('\n' + cCyan + cBold + '  Recommended Actionable Fixes:' + cReset);
    report.fixes.forEach((f, idx) => console.log(`    ${idx + 1}. ${f}`));
  }

  console.log('\n' + '='.repeat(64));
  if (report.valid) {
    console.log(`  ${cGreen}${cBold}🎉 ALL CHECKS PASSED (COMPLIANT WITH TIDYFACTOR SKILLS-LAB)${cReset}\n`);
    process.exit(0);
  } else {
    console.log(`  ${cRed}${cBold}⛔ VALIDATION FAILED — PLEASE RESOLVE THE ERRORS ABOVE${cReset}\n`);
    process.exit(1);
  }
}

// Module export & CLI hook
module.exports = require('../packages/core/src/skills-validator');

if (require.main === module) {
  runCli();
}
