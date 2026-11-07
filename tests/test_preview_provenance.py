"""A development timestamp exception must never conceal a renderer change."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys
import tempfile
import struct
from unittest.mock import patch
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('native_style', ROOT / 'scripts/check-native-style.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class PreviewProvenanceTests(unittest.TestCase):

    def test_checkout_build_id_drift_preserves_code_resources_and_native_crc(self):
        reference = bytearray(range(200))
        struct.pack_into('<H', reference, 14, len(reference))
        signature = struct.pack('<III', 4, 20, 3) + b'GNU\0'
        reference[132:168] = signature + b'A' * 20
        struct.pack_into('<I', reference, 20, audit.sdk_app_crc(reference[130:]))
        rebuilt = bytearray(reference)
        rebuilt[124:128] = b'new!'
        rebuilt[148:168] = b'B' * 20
        struct.pack_into('<I', rebuilt, 20, audit.sdk_app_crc(rebuilt[130:]))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            elf_path = root / 'build/emery/pebble-app.elf'
            elf_path.parent.mkdir(parents=True)
            elf_path.write_bytes(b'ELF fixture' + rebuilt[130:168])
            note = {'.note.gnu.build-id': {'type': 7, 'flags': 2, 'size': 38,
                    'address': 130, 'offset': len(b'ELF fixture')}}
            with patch.object(audit, 'read_elf_sections', return_value=note):
                audit.same_renderer_with_sdk_metadata(root, rebuilt, reference)
                corrupted = bytearray(rebuilt)
                corrupted[20] ^= 1
                with self.assertRaisesRegex(ValueError, 'native CRC'):
                    audit.same_renderer_with_sdk_metadata(root, corrupted, reference)
                changed_code = bytearray(rebuilt)
                changed_code[180] ^= 1
                struct.pack_into('<I', changed_code, 20, audit.sdk_app_crc(changed_code[130:]))
                with self.assertRaisesRegex(ValueError, 'renderer differs'):
                    audit.same_renderer_with_sdk_metadata(root, changed_code, reference)
                changed_note = bytearray(rebuilt)
                changed_note[148] ^= 1
                struct.pack_into('<I', changed_note, 20, audit.sdk_app_crc(changed_note[130:]))
                with self.assertRaisesRegex(ValueError, 'linked ELF'):
                    audit.same_renderer_with_sdk_metadata(root, changed_note, reference)
            with patch.object(audit, 'read_elf_sections', return_value={}):
                with self.assertRaisesRegex(ValueError, 'GNU SHA1'):
                    audit.same_renderer_with_sdk_metadata(root, rebuilt, reference)

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
