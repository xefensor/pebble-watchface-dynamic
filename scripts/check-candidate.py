#!/usr/bin/env python3
"""Audit the current development candidate, not a historical release."""
from pathlib import Path
import subprocess
from repo_workflow import candidate, check_build
root=Path(__file__).resolve().parents[1]
pbw=candidate(root,'Dynamic')
check_build(root,pbw)
subprocess.run(['python3',str(root/'scripts/check-native-style.py'),'--pbw',str(pbw),'--allow-sdk-timestamp'],cwd=root,check=True)
