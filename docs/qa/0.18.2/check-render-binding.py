"""Bind final package to every native run, preserving original capture metadata."""
from pathlib import Path
import json,hashlib,zipfile
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
h=lambda b:hashlib.sha256(b).hexdigest()
p=ROOT/'dist/Dynamic-0.18.2.pbw'
with zipfile.ZipFile(p) as z:
    actual={n:h(z.read(n)) for n in ['emery/pebble-app.bin','emery/app_resources.pbpack','emery/manifest.json']}
    manifest=json.loads(z.read('emery/manifest.json'))
def normalized(m):
    m=json.loads(json.dumps(m));m.pop('generatedAt');m['application'].pop('timestamp');m['resources'].pop('timestamp');return m
reports={}
for rel,key,sub,archive in [
 ('native-previews/previews.json','native_payload_sha256',None,'native-previews/native-candidate.pbw'),
 ('native-activities/activities.json','nativePayloadSha256','source','native-previews/native-candidate.pbw'),
 ('native-long-date/previews.json','native_payload_sha256',None,'native-long-date/native-candidate.pbw'),
 ('native-motion/motion.json','nativePayloadSha256',None,'native-motion/native-candidate.pbw'),
 ('native-reading-states/report.json','nativePayloadSha256',None,'native-reading-states/native.pbw'),
 ('native-clock-proof/report.json','nativePayloadSha256',None,'native-clock-proof/native.pbw'),
 ('native-folded-clock-proof/report.json','nativePayloadSha256',None,'native-folded-clock-proof/native.pbw')]:
    r=json.loads((HERE/rel).read_text());r=r[sub] if sub else r;expected=r[key]
    assert all(expected[n]==actual[n] for n in ['emery/pebble-app.bin','emery/app_resources.pbpack']),rel
    with zipfile.ZipFile(HERE/archive) as z:
        captured_manifest=z.read('emery/manifest.json');assert h(captured_manifest)==expected['emery/manifest.json'],rel
        assert normalized(json.loads(captured_manifest))==normalized(manifest),rel
    reports[rel]={'nativeExecutableAndResourcesMatch':True,'originalNativePayloadSha256':expected,'manifestMatchesExceptSdkGenerationTimestamps':True}
r={'result':'PASS','finalPbwSha256':h(p.read_bytes()),'finalNativePayloadSha256':actual,'reports':reports,'scope':'Exact executable/resources identity after native preview rebundling. Manifest differences are independently limited to generatedAt and application/resources timestamp. Original capture metadata remains unchanged; no browser/phone or physical-watch inference.'}
(HERE/'render-binding.json').write_text(json.dumps(r,indent=2)+'\n');print('All seven native reports match final renderer/resources: PASS')
