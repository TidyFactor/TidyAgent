# TidyFactor GitHub Baseline Brief — Tidy Ecosystem

<!-- last-verified: 2026-09-08 -->

## 1. Project Topology & Architecture
- **Project Type**: monorepo
- **Scope Tier**: repo-private
- **Governance Level**: standard
- **Primary Language**: javascript / polyglot (Node.js >= 22.0.0, native `node:sqlite`, Python 3.11 validator)
- **Bilingual Mode**: bilingual-ar-en (Native Arabic RTL & English)
- **Default Branch**: main
- **CI Runner**: ubuntu-latest
- **Signed Commits Required**: false
- **Min PR Approvals**: 1

## 2. Monorepo Package Registry
- **Engine Kernel**: `@tidy/core` (`packages/core`)
- **Terminal CLI**: `@tidy/cli` (`packages/cli`)
- **Protocol Server**: `@tidy/mcp` (`packages/mcp`)
- **Certified Skill**: `@tidy/skill` (`packages/skill`)
- **Desktop Studio**: `@tidy/desktop` (`apps/desktop`)
- **Web Console**: `@tidy/web` (`apps/web`)

## 3. GitHub Operations Strategy
- **Supply Chain Security**: All GitHub Actions references MUST be pinned to full commit SHAs (`@sha256`).
- **Permissions Baseline**: `permissions: contents: read` minimum privilege by default.
- **Dependency Hygiene**: Dependabot weekly updates for npm and github-actions.
- **Verification Gates**: Automated execution of 20 unit tests (`npm test`) and 100% compliance with `tools/validate_skill.py`.
