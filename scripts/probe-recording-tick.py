"""Diagnose native elapsed-clock screenshots with one synthetic fixture.

Supply a PBW and isolated output directory; --sequence replays the first five
activity presets. This executes no phone JavaScript or physical watch.
"""
from pathlib import Path
import importlib.util,sys,os,tempfile,time,threading,json,uuid,hashlib

root=Path(__file__).resolve().parents[1]
pbw=Path(sys.argv[1]).resolve();output=Path(sys.argv[2]).resolve();output.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(root.parent/'recovery-validation'))
import pipe_emulator
os.environ['PEBBLE_QA_STATE']=tempfile.mkdtemp(prefix='dynamic-tick-probe-')
s=importlib.util.spec_from_file_location('captures',root/'scripts/capture-native-previews.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
info,payload=m.native_candidate(pbw,output/'native.pbw');target=uuid.UUID(info['uuid']);keys=info['messageKeys']
from libpebble2.services.appmessage import AppMessageService,Uint32,ByteArray
from libpebble2.services.screenshot import Screenshot
from libpebble2.protocol.apps import AppRunState,AppRunStateStart
from libpebble2.protocol.system import TimeMessage,SetUTC
from libpebble2.communication.transports.qemu.protocol import QemuBluetoothConnection
from pebble_tool.commands.emucontrol import send_data_to_qemu
from pebble_tool.commands.install import ToolAppInstaller
from PIL import Image
p=pipe_emulator.connect();service=AppMessageService(p);condition=threading.Condition();sessions=[];acks={}
def receive(_tid,app,data):
 if app==target:
  token=data.get(keys['REQUEST_ACTIVITIES'],data.get(keys['REQUEST_CONTEXT'],0))
  if isinstance(token,int) and token>=2:
   with condition:sessions.append(token);condition.notify_all()
def ack(tid,app):
 if app==target:
  with condition:acks[tid]=True;condition.notify_all()
service.register_handler('appmessage',receive);service.register_handler('ack',ack)
send_data_to_qemu(p.transport,QemuBluetoothConnection(connected=True))
ToolAppInstaller(p,str(output/'native.pbw'),quiet=True).install();p.send_packet(AppRunState(data=AppRunStateStart(uuid=target)))
with condition:assert condition.wait_for(lambda:bool(sessions),timeout=8)
plan=m.fixture_plan(sessions[-1],now=m.SAMPLE_TIME,mode='activities',sequence=100)
fixtures=plan['presets'][:5] if '--sequence' in sys.argv else [x for x in plan['presets'] if x['name']=='recording-delivery-light']
results=[]
for preset in fixtures:
 p.send_packet(TimeMessage(message=SetUTC(unix_time=m.SAMPLE_TIME,utc_offset=0,tz_name='UTC')))
 values={keys[n]:Uint32(v) for n,v in preset['integers'].items()};values.update({keys[n]:ByteArray(bytes(v)) for n,v in preset['bytes'].items()})
 with condition:
  tid=service.send_message(target,values);assert condition.wait_for(lambda:tid in acks,timeout=10)
 time.sleep(.8);previous=None;frames=[]
 for index,delay in enumerate([0,1.15,1.2,1.2] if preset['name']=='recording-delivery-light' else [0,1.15] if preset.get('verifyClockTick') else [0]):
  time.sleep(delay);pixels=b''.join(Screenshot(p).grab_image());name=f'{preset["name"]}-{index}.png';Image.frombytes('RGB',(200,228),pixels).save(output/name)
  frames.append({'file':name,'fullSha256':hashlib.sha256(pixels).hexdigest(),'activitySha256':hashlib.sha256(pixels[200*92*3:]).hexdigest()})
 results.append({'fixture':preset,'frames':frames,'activityChanged':len({x['activitySha256'] for x in frames})>1})
report={'sourceVersion':info['versionLabel'],'pbwSha256':hashlib.sha256(pbw.read_bytes()).hexdigest(),'nativePayloadSha256':payload,'scope':'Isolated recording-delivery diagnostic (or first five activity fixtures with --sequence), real native Screenshot frames, synthetic data. No phone JavaScript.','results':results}
(output/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'version':info['versionLabel'],'changed':[r['activityChanged'] for r in results]}));service.shutdown()
