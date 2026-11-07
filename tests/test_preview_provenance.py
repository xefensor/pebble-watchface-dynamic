"""A development timestamp exception must never conceal a renderer change."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('native_style', ROOT / 'scripts/check-native-style.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class PreviewProvenanceTests(unittest.TestCase):
    def test_current_capture_provenance_needs_no_frozen_release(self):
        binary = bytes(range(160))
        resources = b'font and image resources'
        normalized = binary[:124] + b'\0' * 4 + binary[128:]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'src/pkjs').mkdir(parents=True)
            preview = {'version': '1.0.0', 'frames': {str(i): {} for i in range(24)},
                       'source': {'normalizedNativeBinarySha256': hashlib.sha256(normalized).hexdigest(),
                                  'nativePayloadSha256': {
                                      name: hashlib.sha256(data).hexdigest() for name, data in
                                      [('emery/pebble-app.bin', binary), ('emery/app_resources.pbpack', resources)]}}}
            path = root / 'src/pkjs/settings-preview.js'
            path.write_text('module.exports = ' + json.dumps(preview) + ';')
            self.assertFalse((root / 'dist').exists())
            self.assertTrue(audit.audit_preview_identity(root, '1.0.0', binary, resources)['nativeBinaryAndResourcesMatch'])
            rebuilt = binary[:124] + b'new!' + binary[128:]
            with self.assertRaises(ValueError):
                audit.audit_preview_identity(root, '1.0.0', rebuilt, resources)
            result = audit.audit_preview_identity(root, '1.0.0', rebuilt, resources, True)
            self.assertTrue(result['rendererMatchesExceptSdkResourceTimestamp'])
            self.assertFalse(result['freshCaptureClaimed'])
            for changed in [b'X' + rebuilt[1:], rebuilt[:128] + b'X' + rebuilt[129:],
                            rebuilt[:-1], rebuilt + b'X']:
                with self.subTest(changed=changed), self.assertRaises(ValueError):
                    audit.audit_preview_identity(root, '1.0.0', changed, resources, True)
            with self.assertRaises(ValueError):
                audit.audit_preview_identity(root, '1.0.0', rebuilt, resources + b'X', True)
            preview['source']['normalizedNativeBinarySha256'] = '0' * 64
            path.write_text('module.exports = ' + json.dumps(preview) + ';')
            with self.assertRaises(ValueError):
                audit.audit_preview_identity(root, '1.0.0', rebuilt, resources, True)

    def test_only_the_sdk_timestamp_can_differ_in_development(self):
        binary = bytes(range(160))
        resources = b'font and image resources'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'src/pkjs').mkdir(parents=True)
            (root / 'dist').mkdir()
            preview = {'version': '1.0.0', 'frames': {str(i): {} for i in range(24)},
                       'source': {'nativePayloadSha256': {
                           name: hashlib.sha256(data).hexdigest() for name, data in
                           [('emery/pebble-app.bin', binary), ('emery/app_resources.pbpack', resources)]}}}
            (root / 'src/pkjs/settings-preview.js').write_text('module.exports = ' + json.dumps(preview) + ';')
            with zipfile.ZipFile(root / 'dist/Dynamic-1.0.0.pbw', 'w') as frozen:
                frozen.writestr('emery/pebble-app.bin', binary)
            rebuilt = binary[:124] + b'new!' + binary[128:]
            with self.assertRaises(ValueError):
                audit.audit_preview_identity(root, '1.0.0', rebuilt, resources)
            result = audit.audit_preview_identity(root, '1.0.0', rebuilt, resources, True)
            self.assertTrue(result['rendererMatchesExceptSdkResourceTimestamp'])
            self.assertFalse(result['freshCaptureClaimed'])
            for changed in [b'X' + rebuilt[1:], rebuilt[:-1], rebuilt + b'X']:
                with self.assertRaises(ValueError):
                    audit.audit_preview_identity(root, '1.0.0', changed, resources, True)
            with self.assertRaises(ValueError):
                audit.audit_preview_identity(root, '1.0.0', rebuilt, resources + b'X', True)
