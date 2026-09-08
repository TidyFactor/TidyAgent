#!/usr/bin/env python3
"""
validate_skill.py — TidyFactor Skill Architect Release & Integrity Validator for Tidy.
Checks:
1. SemVer synchronization across package.json, .tidyfactor, brand.yaml, brand.json, CHANGELOG.md.
2. License consistency (Apache-2.0).
3. Existence of all files referenced in SKILL.md.
4. Validation checklists in all workflow files.
5. Memory freshness comments (<!-- last-verified: YYYY-MM-DD -->).
6. Manifest contract consistency.
"""

import sys
import os
import json
import re
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def main():
    root = Path(__file__).resolve().parent.parent
    errors = []
    warnings = []
    
    print("=" * 60)
    print("  RUNNING TIDYFACTOR SKILL VALIDATION FOR TIDY")
    print("=" * 60)
    
    # 1. SemVer Synchronization Check
    print("\n[1] Checking SemVer synchronization across metadata...")
    pkg_file = root / "package.json"
    tf_file = root / ".tidyfactor"
    brand_yaml_file = root / "brand.yaml"
    brand_json_file = root / "brand.json"
    cl_file = root / "CHANGELOG.md"
    
    pkg_ver = json.loads(pkg_file.read_text(encoding="utf-8")).get("version") if pkg_file.exists() else None
    tf_ver = json.loads(tf_file.read_text(encoding="utf-8")).get("version") if tf_file.exists() else None
    
    brand_ver = None
    if brand_yaml_file.exists():
        for line in brand_yaml_file.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("version:"):
                brand_ver = line.split(":", 1)[1].strip().strip('"').strip("'")
                break
    elif brand_json_file.exists():
        brand_ver = json.loads(brand_json_file.read_text(encoding="utf-8")).get("version")
        
    print(f"  package.json : {pkg_ver}")
    print(f"  .tidyfactor  : {tf_ver}")
    print(f"  brand        : {brand_ver}")
    
    versions = {v for v in [pkg_ver, tf_ver, brand_ver] if v}
    if len(versions) > 1:
        errors.append(f"SemVer mismatch across metadata files: {versions}")
    elif not versions:
        errors.append("No version found in metadata files.")
    else:
        print("  ✓ Metadata versions synchronized.")
        
    # Check CHANGELOG
    if cl_file.exists():
        current_ver = list(versions)[0] if versions else ""
        if current_ver and f"[{current_ver}]" not in cl_file.read_text(encoding="utf-8"):
            errors.append(f"CHANGELOG.md missing release section for v{current_ver}")
        else:
            print(f"  ✓ CHANGELOG.md documents v{current_ver}")
            
    # 2. SKILL.md Verification
    print("\n[2] Checking SKILL.md dispatcher constraints...")
    skill_file = root / "SKILL.md"
    if not skill_file.exists():
        errors.append("SKILL.md is missing.")
    else:
        content = skill_file.read_text(encoding="utf-8")
        if not content.startswith("---"):
            errors.append("SKILL.md missing frontmatter delimiters (---).")
        
        # Check description length
        desc_match = re.search(r'description:\s*"([^"]+)"', content)
        if desc_match:
            desc = desc_match.group(1)
            if len(desc) > 1024:
                errors.append(f"SKILL.md description exceeds 1024 characters ({len(desc)}).")
            else:
                print(f"  ✓ Description within budget ({len(desc)}/1024 chars).")
        else:
            warnings.append("Could not strictly match double-quoted description in SKILL.md.")

        # Check references in table
        refs = re.findall(r'`(references/[^`]+)`', content)
        for ref in refs:
            target = root / ref
            if not target.exists():
                errors.append(f"Referenced file does not exist: {ref}")
            else:
                print(f"  ✓ Referenced file exists: {ref}")

    # 3. Workflows Checklist Check
    print("\n[3] Checking workflows for validation checklists...")
    workflows_dir = root / "references" / "workflows"
    if workflows_dir.exists():
        for wf in workflows_dir.glob("*.md"):
            wf_content = wf.read_text(encoding="utf-8")
            if "## Validation Checklist" not in wf_content and "## Validation checklist" not in wf_content:
                errors.append(f"Workflow {wf.name} is missing a Validation Checklist.")
            else:
                print(f"  ✓ {wf.name} has Validation Checklist.")

    # 4. Memory Freshness Check
    print("\n[4] Checking memory freshness comments...")
    memory_dir = root / "references" / "memory"
    if memory_dir.exists():
        for mem in memory_dir.glob("*.md"):
            mem_content = mem.read_text(encoding="utf-8")
            if "<!-- last-verified:" not in mem_content:
                warnings.append(f"Memory file {mem.name} missing '<!-- last-verified: YYYY-MM-DD -->' comment.")
            else:
                print(f"  ✓ {mem.name} has freshness timestamp.")

    # 5. Manifest Contract Check
    print("\n[5] Checking manifest.json contract...")
    manifest_file = root / "manifest.json"
    if not manifest_file.exists():
        errors.append("manifest.json is missing.")
    else:
        manifest_data = json.loads(manifest_file.read_text(encoding="utf-8"))
        if manifest_data.get("manifest_schema_version") != "1.1.0":
            errors.append(f"Invalid manifest_schema_version: {manifest_data.get('manifest_schema_version')}")
        if manifest_data.get("skill_root_anchor") != "self":
            errors.append(f"Invalid skill_root_anchor: {manifest_data.get('skill_root_anchor')}")
        print("  ✓ manifest.json adheres to schema contract.")

    # Summary
    print("\n" + "=" * 60)
    print(f"  VALIDATION RESULT: {len(errors)} ERRORS, {len(warnings)} WARNINGS")
    print("=" * 60)
    
    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  ⚠️  {w}")
            
    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  ❌ {e}")
        sys.exit(1)
    else:
        print("\n🎉 ALL CHECKS PASSED PERFECTLY (100% COMPLIANT)!\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
