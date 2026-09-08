#!/usr/bin/env node
/**
 * build-skill.js — packages the distributable .skill file for tidy
 * and synchronizes across target agent locations.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SKILL_NAME = "tidy";
const DIST_DIR = path.join(ROOT, "dist");
const STAGE_DIR = path.join(DIST_DIR, SKILL_NAME);

const HOME = process.env.USERPROFILE || process.env.HOME;
const AGENTS_SKILL = path.resolve(ROOT, "..", ".agents", "skills", SKILL_NAME);
const GLOBAL_CONFIG_SKILL = path.join(HOME, ".gemini", "config", "skills", SKILL_NAME);

const OUT_FILE = path.join(DIST_DIR, `${SKILL_NAME}.skill`);

const ROOT_COPIES = [
  "SKILL.md",
  "manifest.json",
  "references",
  "scripts",
  "tools",
  "bin",
  "tests",
  "brand.yaml",
  "brand.json",
  ".tidyfactor",
  "package.json",
  "README.md",
  "docs",
  "LICENSE",
  "CHANGELOG.md"
];

function log(msg) {
  console.log(`[build-skill] ${msg}`);
}

function cpR(src, dst) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      cpR(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function main() {
  log(`Starting build for ${SKILL_NAME}...`);

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Stage files
  if (fs.existsSync(STAGE_DIR)) {
    fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGE_DIR, { recursive: true });

  for (const item of ROOT_COPIES) {
    const src = path.join(ROOT, item);
    const dst = path.join(STAGE_DIR, item);
    if (fs.existsSync(src)) {
      cpR(src, dst);
    }
  }

  // Create zip (.skill archive) using PowerShell on Windows
  log(`Creating archive ${OUT_FILE}...`);
  if (fs.existsSync(OUT_FILE)) {
    fs.unlinkSync(OUT_FILE);
  }

  try {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${STAGE_DIR}\\*' -DestinationPath '${OUT_FILE}' -Force"`,
      { stdio: "inherit" }
    );
    log(`✓ Packaged: ${OUT_FILE}`);
  } catch (err) {
    log(`⚠️  Warning: Compress-Archive failed: ${err.message}`);
  }

  // Copy to versioned .skill
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const versionedSkill = path.join(DIST_DIR, `${SKILL_NAME}-v${pkg.version}.skill`);
    if (fs.existsSync(OUT_FILE)) {
      fs.copyFileSync(OUT_FILE, versionedSkill);
      log(`✓ Created versioned archive: ${versionedSkill}`);
    }
  } catch (e) {
    // ignore
  }

  // Copy to root canonical .skill
  const canonicalSkill = path.resolve(ROOT, "..", `${SKILL_NAME}.skill`);
  if (fs.existsSync(OUT_FILE)) {
    fs.copyFileSync(OUT_FILE, canonicalSkill);
    log(`✓ Synced canonical: ${canonicalSkill}`);
  }

  // Sync to local .agents wrapper
  log(`Syncing to ${AGENTS_SKILL}...`);
  cpR(STAGE_DIR, AGENTS_SKILL);
  log(`✓ Synced to .agents/skills/${SKILL_NAME}`);

  // Sync to global Gemini config
  log(`Syncing to ${GLOBAL_CONFIG_SKILL}...`);
  cpR(STAGE_DIR, GLOBAL_CONFIG_SKILL);
  log(`✓ Synced to global Gemini config`);

  log(`🎉 Build & Multi-Location Synchronization complete!`);
}

main();
