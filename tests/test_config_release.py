"""A fresh npm install must generate the same settings before SDK expansion."""
from pathlib import Path
import os,shutil,subprocess,tempfile,unittest
ROOT=Path(__file__).resolve().parents[1]
class FreshClay(unittest.TestCase):
    def test_config_uses_the_locked_archive_without_extracted_clay(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'scripts').mkdir();(root/'src').mkdir()
            for name in ('common','pkjs'):shutil.copytree(ROOT/'src'/name,root/'src'/name)
            for name in ('package.json','config.html'):shutil.copyfile(ROOT/name,root/name)
            shutil.copyfile(ROOT/'scripts/generate-config.cjs',root/'scripts/generate-config.cjs')
            clay=root/'node_modules/@rebble/clay';clay.mkdir(parents=True)
            shutil.copyfile(ROOT/'node_modules/@rebble/clay/dist.zip',clay/'dist.zip')
            for name in ('pebble-xoce-ui','pebble-activities','pebble-watchface-core'):
                os.symlink(ROOT/'node_modules'/name,root/'node_modules'/name,target_is_directory=True)
            subprocess.run(['node','scripts/generate-config.cjs','--check'],cwd=root,check=True)
            self.assertFalse((clay/'dist').exists())
