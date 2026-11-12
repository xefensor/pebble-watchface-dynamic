#!/usr/bin/env python3
"""Audit the current development candidate, not a historical release."""
from pathlib import Path
import subprocess
import json
import zipfile
from repo_workflow import candidate, check_build
root=Path(__file__).resolve().parents[1]
pbw=candidate(root,'Dynamic')
check_build(root,pbw)
subprocess.run(['python3',str(root/'scripts/check-native-style.py'),'--pbw',str(pbw),'--allow-sdk-timestamp','--allow-sdk-build-id'],cwd=root,check=True)

from platform_audit import audit_platforms
print(audit_platforms(root,pbw))

# Round previews have independent source identity; Emery pixels cannot stand in
# for Gabbro even when both targets share the same application version.
round_preview=json.loads((root/'src/pkjs/settings-preview-round.js').read_text().split('module.exports = ',1)[1].strip().removesuffix(';'))
from native_identity import renderer_identity as round_renderer_identity
with zipfile.ZipFile(pbw) as round_built:
    actual_round=round_renderer_identity(round_built.read('gabbro/pebble-app.bin'),round_built.read('gabbro/app_resources.pbpack'))
assert round_preview['source']['nativeRendererIdentity']==actual_round,'Round preview renderer/resources differ'
assert len(round_preview['frames'])==24 and round_preview['version']==json.loads((root/'package.json').read_text())['version']
print('Round 2 preview renderer identity: PASS')
