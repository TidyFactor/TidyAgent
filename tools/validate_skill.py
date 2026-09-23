#!/usr/bin/env python3
"""
Root forwarder proxy for TidyFactor Skill Architect Validator.
Executes packages/skill/tools/validate_skill.py with full argument passing.
"""
import sys
import runpy
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def main():
    root = Path(__file__).resolve().parent.parent
    target_script = root / "packages" / "skill" / "tools" / "validate_skill.py"
    if not target_script.exists():
        sys.stderr.write(f"Error: Target validator not found at {target_script}\n")
        sys.exit(1)
    
    # Execute the target validator script in its native context
    runpy.run_path(str(target_script), run_name="__main__")

if __name__ == "__main__":
    main()
