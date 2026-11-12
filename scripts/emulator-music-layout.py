#!/usr/bin/env python3
"""Capture Dynamic's music composition at a real OS size, including native Peek.

Music and secondary fixtures use the production adapters and ACT3 encoder.
This is native Emery execution with synthetic sources, not a paired phone test.
"""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,sys,tempfile,threading,time,uuid,zipfile
from repo_workflow import candidate
from pebble_tool.commands.install import ToolAppInstaller
from pebble_tool.commands.emucontrol import send_data_to_qemu
from libpebble2.protocol.apps import AppRunState,AppRunStateStart
from libpebble2.protocol.system import TimeMessage,SetUTC
from libpebble2.communication.transports.qemu.protocol import QemuContentSize,QemuBluetoothConnection,QemuTimelinePeek
from libpebble2.services.appmessage import AppMessageService,Uint32,ByteArray
from libpebble2.services.screenshot import Screenshot
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--size',type=int,choices=(1,2,3),required=True)
args=parser.parse_args()
PBW=candidate(ROOT,'Dynamic');OUT=ROOT/'build/qa/music-layout'/f's{args.size}'
OUT.mkdir(parents=True,exist_ok=True)
os.environ['PEBBLE_QA_STATE']=tempfile.mkdtemp(prefix='dynamic-music-layout-')
sys.path.insert(0,str(ROOT.parent/'recovery-validation'))
from pipe_emulator import connect
with zipfile.ZipFile(PBW)as source,zipfile.ZipFile(OUT/'native.pbw','w')as native:
    info=json.loads(source.read('appinfo.json'))
    payload={n:hashlib.sha256(source.read(n)).hexdigest()for n in source.namelist()if n.startswith('emery/')}
    for n in source.namelist():
        if n=='appinfo.json'or n.startswith('emery/'):native.writestr(n,source.read(n))
p=connect();target=uuid.UUID(info['uuid']);keys=info['messageKeys']
service=AppMessageService(p);condition=threading.Condition();sessions=[];acks={};presentations=[]
def receive(tid,app,data):
    if app!=target:return
    with condition:
        token=data.get(keys['REQUEST_ACTIVITIES'],0)
        if token>=2:sessions.append(token)
        painted=data.get(keys['ACTIVITY_PRESENTED'])
        if isinstance(painted,(bytes,bytearray))and len(painted)==24:
            presentations.append({'primary':painted[1],'secondary':painted[2],
                'view':int.from_bytes(painted[8:12],'little')})
        condition.notify_all()
def receipt(success):
    def callback(tid,app):
        if app==target:
            with condition:acks[tid]=success;condition.notify_all()
    return callback
service.register_handler('appmessage',receive)
service.register_handler('ack',receipt(True));service.register_handler('nack',receipt(False))
send_data_to_qemu(p.transport,QemuBluetoothConnection(connected=True))
send_data_to_qemu(p.transport,QemuContentSize(size=args.size))
now=1704112410
p.send_packet(TimeMessage(message=SetUTC(unix_time=now,utc_offset=0,tz_name='UTC')))
ToolAppInstaller(p,str(OUT/'native.pbw'),quiet=True).install()
p.send_packet(AppRunState(data=AppRunStateStart(uuid=target)))
with condition:assert condition.wait_for(lambda:bool(sessions),timeout=8),'No native session'
captures=[];plans=[]
try:
    for peek in (False,True):
        options={'mode':'music-layout','session':sessions[-1],'now':now,'sequence':20000+1000*peek}
        plan=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/native-preview-fixtures.js')],
            input=json.dumps(options),text=True,cwd=ROOT));plans.append(plan)
        for preset in plan['presets']:
            p.send_packet(TimeMessage(message=SetUTC(unix_time=now,utc_offset=0,tz_name='UTC')))
            send_data_to_qemu(p.transport,QemuTimelinePeek(enabled=peek))
            values={keys[k]:Uint32(v)for k,v in preset['integers'].items()}
            values.update({keys[k]:ByteArray(bytes(v))for k,v in preset['bytes'].items()})
            with condition:
                tid=service.send_message(target,values)
                assert condition.wait_for(lambda:tid in acks,timeout=8),'No fixture ACK'
                assert acks.pop(tid),'Fixture rejected'
            time.sleep(.3);previous=None
            for attempt in range(4):
                pixels=b''.join(Screenshot(p).grab_image())
                assert len(pixels)==200*228*3,'Expected native Emery RGB'
                if pixels==previous:break
                previous=pixels;time.sleep(.1)
            else:raise AssertionError('Music did not settle: '+preset['name'])
            name=('peek-'if peek else'')+preset['name']+'.png'
            Image.frombytes('RGB',(200,228),pixels).save(OUT/name)
            view=int.from_bytes(bytes(preset['bytes']['ACTIVITY_DATA'])[16:20],'little')
            painted=next((x for x in reversed(presentations)if x['view']==view),None)
            if not peek:
                assert painted and painted['primary']==0,('Missing primary presentation',preset['name'],painted)
                if not preset['secondary']:assert painted['secondary']==255,'Absent secondary exported'
            captures.append({'file':name,'peek':peek,'case':preset['case'],'theme':preset['theme'],
                'secondaryProvided':preset['secondary'],'nativePresentation':painted,
                'rgbSha256':hashlib.sha256(pixels).hexdigest()})
            print('Captured '+name,flush=True)
    report={'result':'PASS','osSize':args.size,'pbwSha256':hashlib.sha256(PBW.read_bytes()).hexdigest(),
        'nativePayloadSha256':payload,'captures':captures,'scope':__doc__}
    (OUT/'fixtures.json').write_text(json.dumps(plans,indent=2)+'\n')
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'result':'PASS','path':str(OUT/'report.json')}))
finally:
    send_data_to_qemu(p.transport,QemuTimelinePeek(enabled=False));service.shutdown()
