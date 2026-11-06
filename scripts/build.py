#!/usr/bin/env python3
"""Build and permission-package a local Dynamic candidate without publication."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
for command in (["node", "scripts/generate-config.cjs"], ["pebble", "clean"],
                ["pebble", "build"], ["python3", "scripts/package-release.py"]):
    subprocess.run(command, cwd=root, check=True)
