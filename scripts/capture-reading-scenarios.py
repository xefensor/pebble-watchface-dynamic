"""Capture readable unavailable/text and wide-value reading compositions.

Supply a PBW and output directory. This executes no phone JavaScript or physical watch.
"""
from pathlib import Path
import importlib.util,sys,os,tempfile,time,threading,json,uuid,hashlib,subprocess

root=Path(__file__).resolve().parents[1]
pbw=Path(sys.argv[1]).resolve();output=Path(sys.argv[2]).resolve();output.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(root.parent/'recovery-validation'))
import pipe_emulator
os.environ['PEBBLE_QA_STATE']=tempfile.mkdtemp(prefix='dynamic-reading-probe-')
s=importlib.util.spec_from_file_location('captures',root/'scripts/capture-native-previews.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
info,payload=m.native_candidate(pbw,output/'native.pbw');target=uuid.UUID(info['uuid']);keys=info['messageKeys']
from libpebble2.services.appmessage import AppMessageService,Uint32,ByteArray
from libpebble2.services.screenshot import Screenshot
from libpebble2.protocol.apps import AppRunState,AppRunStateStart
from libpebble2.protocol.system import TimeMessage,SetUTC
from libpebble2.communication.transports.qemu.protocol import QemuBluetoothConnection,QemuTimelinePeek,QemuTimeFormat
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
plan=m.fixture_plan(sessions[-1],now=m.SAMPLE_TIME)
fixtures=[x for x in plan['presets'] if x['name'] in ['idle-24-light','timer-24-light','timeline-24-light']]
code="""const c=require('pebble-watchface-core').wire,fs=require('fs');const n=JSON.parse(fs.readFileSync(0,'utf8')).now;
const a={status:3,confirmedAt:n,validUntil:n+7200,semantic:{kind:c.SEMANTIC_KIND.TEMPERATURE,source:c.SOURCE_KIND.WEATHER,value:5,unit:'°C',label:'TEMP',observedAt:n}};
const b={status:2,text:'Partly cloudy',confirmedAt:n,validUntil:n+7200,semantic:{kind:c.SEMANTIC_KIND.CONDITION,source:c.SOURCE_KIND.WEATHER,label:'SKY',observedAt:n}};
console.log(JSON.stringify(c.packComplications([a,b],n)));"""
slots=json.loads(subprocess.check_output(['node','-e',code],input=json.dumps({'now':m.SAMPLE_TIME}),cwd=root,text=True))
for fixture in fixtures:fixture['bytes']['COMPLICATION_DATA']=slots
results=[]
for preset in fixtures:
 send_data_to_qemu(p.transport,QemuTimelinePeek(enabled=preset['state']=='timeline'));send_data_to_qemu(p.transport,QemuTimeFormat(is_24_hour=True))
 p.send_packet(TimeMessage(message=SetUTC(unix_time=m.SAMPLE_TIME,utc_offset=0,tz_name='UTC')))
 time.sleep(1.1)
 values={keys[n]:Uint32(v) for n,v in preset['integers'].items()};values.update({keys[n]:ByteArray(bytes(v)) for n,v in preset['bytes'].items()})
 with condition:
  tid=service.send_message(target,values);assert condition.wait_for(lambda:tid in acks,timeout=10)
 time.sleep(.8);previous=None;frames=[]
 for index,delay in enumerate([0]):
  time.sleep(delay);pixels=b''.join(Screenshot(p).grab_image());name=f'{preset["name"]}-{index}.png';Image.frombytes('RGB',(200,228),pixels).save(output/name)
  frames.append({'file':name,'fullSha256':hashlib.sha256(pixels).hexdigest(),'activitySha256':hashlib.sha256(pixels[200*106*3:]).hexdigest()})
 results.append({'fixture':preset,'frames':frames,'activityChanged':len({x['activitySha256'] for x in frames})>1})
report={'sourceVersion':info['versionLabel'],'pbwSha256':hashlib.sha256(pbw.read_bytes()).hexdigest(),'nativePayloadSha256':payload,'scope':'Unavailable/text reading compositions with actual native renderer and synthetic source data. No phone JavaScript or physical device.','results':results}
(output/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'version':info['versionLabel'],'changed':[r['activityChanged'] for r in results]}));send_data_to_qemu(p.transport,QemuTimelinePeek(enabled=False));service.shutdown()
