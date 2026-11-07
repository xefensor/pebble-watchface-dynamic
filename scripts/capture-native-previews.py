#!/usr/bin/env python3
"""Capture all 24 Clay presets from an explicitly selected Emery emulator.

Example (run with the Python environment used by the Pebble CLI):
  python3 scripts/capture-native-previews.py --emulator emery --pbw build/pebble-watchface-dynamic.pbw

A native-only copy of the candidate is installed through the phone bridge so
its PKJS cannot replace injected fixture states. Native payload bytes remain
identical. The actual installed copy and source candidate both receive hashes.

For an already initialized persistent shell, import this file and call
capture(pebble, pbw, output, appmessage=existing_appmessage_service). No emulator
is selected or opened merely by importing this module or using --plan.
"""
from __future__ import annotations
import argparse
import base64
import datetime
import hashlib
import json
import os
from pathlib import Path
from repo_workflow import candidate as candidate_pbw, qa_output
import subprocess
import threading
import time
import uuid
import zipfile

ROOT=Path(__file__).resolve().parents[1]
NATIVE_FILES=('emery/pebble-app.bin','emery/app_resources.pbpack','emery/manifest.json')
SAMPLE_TIME=int(datetime.datetime(2026,11,1,13,5,tzinfo=datetime.timezone.utc).timestamp())

def sha256(value):
    return hashlib.sha256(value).hexdigest()

def fixture_plan(session,now=SAMPLE_TIME-1,mode=None,sequence=None):
    options={'session':session,'now':now,'mode':mode}
    if sequence is not None:options['sequence']=sequence
    result=subprocess.run(['node',str(ROOT/'scripts/native-preview-fixtures.js')],
        input=json.dumps(options),capture_output=True,text=True,check=True,cwd=ROOT)
    return json.loads(result.stdout)

def native_candidate(pbw,output):
    """Omit phone JS while retaining exact candidate native bytes and metadata."""
    with zipfile.ZipFile(pbw) as source:
        appinfo=json.loads(source.read('appinfo.json'))
        native={name:source.read(name) for name in NATIVE_FILES}
        with zipfile.ZipFile(output,'w') as target:
            for info in source.infolist():
                if info.filename=='appinfo.json' or info.filename.startswith('emery/'):
                    target.writestr(info,source.read(info.filename))
    with zipfile.ZipFile(output) as target:
        assert 'pebble-js-app.js' not in target.namelist()
        assert all(target.read(name)==data for name,data in native.items())
    return appinfo,{name:sha256(data) for name,data in native.items()}

def capture(pebble,pbw,output,preview=None,appmessage=None):
    """Install a native-only candidate, inject fixtures, capture and embed PNGs.

    `pebble` must be a connected, asynchronously running libpebble2 connection
    to Emery/QEMU. An optional existing AppMessageService avoids registering a
    second service on a persistent shell's same endpoint. Other fixture senders
    should be stopped before calling this function.
    """
    from libpebble2.services.appmessage import AppMessageService,Uint32,ByteArray
    from libpebble2.services.screenshot import Screenshot
    from libpebble2.protocol.system import TimeMessage,SetUTC
    from libpebble2.protocol.apps import AppRunState,AppRunStateStart
    from libpebble2.communication.transports.qemu.protocol import QemuTimelinePeek,QemuTimeFormat,QemuBattery,QemuBluetoothConnection
    from pebble_tool.commands.emucontrol import send_data_to_qemu
    from pebble_tool.commands.install import ToolAppInstaller
    from PIL import Image

    pbw=Path(pbw).resolve();output=Path(output).resolve();output.mkdir(parents=True,exist_ok=True)
    preview=Path(preview or output/'settings-preview.js')
    preview.parent.mkdir(parents=True,exist_ok=True)
    native_pbw=output/'native-candidate.pbw'
    if native_pbw==pbw:raise ValueError('Source PBW must differ from the native-only output')
    appinfo,native_hashes=native_candidate(pbw,native_pbw)
    with zipfile.ZipFile(native_pbw) as captured:
        captured_binary=captured.read('emery/pebble-app.bin')
    # SDK4.33.1 injects only this four-byte resource timestamp. Preserve every
    # other byte and the binary length in an independently reproducible hash.
    if len(captured_binary)<128:raise ValueError('Truncated captured native binary')
    normalized_binary_sha256=sha256(captured_binary[:124]+b'\0'*4+captured_binary[128:])
    target=uuid.UUID(appinfo['uuid']);keys=appinfo['messageKeys']
    package=json.loads((ROOT/'package.json').read_text());version=package['version']
    if appinfo.get('versionLabel')!=version or appinfo['uuid']!=package['pebble']['uuid']:
        raise ValueError('Capture requires the current Dynamic version and UUID')
    service=appmessage or AppMessageService(pebble)
    owned=appmessage is None
    condition=threading.Condition();receipts={};sessions=[]
    def receive(_tid,app_uuid,data):
        if app_uuid!=target:return
        token=data.get(keys['REQUEST_ACTIVITIES'],data.get(keys['REQUEST_CONTEXT'],0))
        if isinstance(token,int) and token>=2:
            with condition:
                sessions.append(token);condition.notify_all()
    def receipt(success):
        def callback(tid,app_uuid):
            if app_uuid==target:
                with condition:receipts[tid]=success;condition.notify_all()
        return callback
    handles=[service.register_handler('appmessage',receive),
        service.register_handler('ack',receipt(True)),service.register_handler('nack',receipt(False))]
    def send(dictionary):
        with condition:
            tid=service.send_message(target,dictionary)
            if not condition.wait_for(lambda:tid in receipts,timeout=10):raise RuntimeError('AppMessage ACK timed out')
            if not receipts.pop(tid):raise RuntimeError('Watch rejected capture fixture')
    host_rtc=os.environ.get('PEBBLE_QA_HOST_RTC')=='1'
    def set_time():
        if host_rtc:return
        pebble.send_packet(TimeMessage(message=SetUTC(unix_time=SAMPLE_TIME,utc_offset=0,tz_name='UTC')))
    def screenshot(path):
        rows=Screenshot(pebble).grab_image()
        if len(rows)!=228 or any(len(row)!=600 for row in rows):raise RuntimeError('Expected native 200×228 Screenshot-service RGB')
        pixels=b''.join(rows);Image.frombytes('RGB',(200,228),pixels).save(path)
        return pixels
    try:
        # The phone bridge replaces cached JS with a PBW whose JS source is
        # absent. Loading it stops the old JS runtime before native startup.
        send_data_to_qemu(pebble.transport,QemuBluetoothConnection(connected=True))
        ToolAppInstaller(pebble,str(native_pbw),quiet=True).install()
        # Some SDK bridge installs complete while the launcher/previous face
        # remains visible. Explicitly start this exact installed native UUID.
        pebble.send_packet(AppRunState(data=AppRunStateStart(uuid=target)))
        with condition:
            if not condition.wait_for(lambda:bool(sessions),timeout=8):
                raise RuntimeError('Native session request not received after install')
            session=sessions[-1]
        plan=fixture_plan(session,now=int(time.time()) if host_rtc else SAMPLE_TIME-1)
        (output/'fixtures.json').write_text(json.dumps(plan,indent=2)+'\n')
        send_data_to_qemu(pebble.transport,QemuBattery(percent=100,charging=False))
        frames={};captures=[]
        actual_presets=[]
        for preset_index,preset in enumerate(plan['presets']):
            if host_rtc:preset=fixture_plan(session,now=int(time.time()))['presets'][preset_index]
            actual_presets.append(preset)
            if any(token!=session for token in sessions):raise RuntimeError('Native session changed during capture')
            set_time()
            send_data_to_qemu(pebble.transport,QemuTimeFormat(is_24_hour=preset['format']==24))
            send_data_to_qemu(pebble.transport,QemuTimelinePeek(enabled=preset['state']=='timeline'))
            dictionary={keys[name]:Uint32(value) for name,value in preset['integers'].items()}
            dictionary.update({keys[name]:ByteArray(bytes(value)) for name,value in preset['bytes'].items()})
            send(dictionary)
            time.sleep(.8)
            path=output/(preset['name']+'.png');previous=None
            for attempt in range(3):
                pixels=screenshot(path)
                if previous==pixels:break
                previous=pixels;time.sleep(.15)
            else:raise RuntimeError('Native screenshot did not settle: '+preset['name'])
            png=path.read_bytes()
            frames[preset['name']]={'src':'data:image/png;base64,'+base64.b64encode(png).decode(),
                'sha256':sha256(png),'preserve':preset['preserve']}
            captures.append({'name':preset['name'],'file':path.name,'fixture_now_utc':preset.get('fixtureNow',plan['now']),'sha256':sha256(png),
                'rgb_sha256':sha256(pixels),'pixels':[200,228],'native_pixels_modified':False,
                'settled_native_rgb_equal':True})
            print('Captured '+preset['name'],flush=True)
        if len({row['rgb_sha256'] for row in captures})!=24:
            raise RuntimeError('Expected 24 distinct native state/clock/theme images; inspect captures before embedding')
        plan['presets']=actual_presets
        (output/'fixtures.json').write_text(json.dumps(plan,indent=2)+'\n')
        result={'version':version,'source':{'capturedFromCandidatePbwSha256':sha256(native_pbw.read_bytes()),
            'candidateSourcePbwSha256':sha256(pbw.read_bytes()),'nativePayloadSha256':native_hashes,
            'normalizedNativeBinarySha256':normalized_binary_sha256,
            'timelineSample':'Actual native unobstructed geometry; reserved OS panel, no event payload.'},'frames':frames}
        report={'version':version,'pbw_sha256':sha256(native_pbw.read_bytes()),
            'candidate_source_pbw_sha256':sha256(pbw.read_bytes()),'native_payload_sha256':native_hashes,
            'phone_javascript_executed':False,'fixture_encoder':{'core':plan['coreVersion'],
                'activities':plan['activitiesVersion'],'core_wire_version':4,'activity_wire_version':plan['activityWireVersion']},
            'fixture_time_utc':plan['now'],'fixture_time_mode':'host-rtc' if host_rtc else 'fixed-utc','session':session,'captures':captures,
            'scope':'24 actual native Screenshot-service presets; sample data, not live phone/provider verification.',
            'visual_review':{'reviewed':False}}
        # Write assets only after all twenty-four native captures settle successfully.
        preview.write_text("'use strict';\n\n// Actual native "+version+" samples; generated by scripts/capture-native-previews.py.\nmodule.exports = "+json.dumps(result,separators=(',',':'))+";\n")
        (output/'previews.json').write_text(json.dumps(report,indent=2)+'\n')
        return report
    finally:
        send_data_to_qemu(pebble.transport,QemuTimelinePeek(enabled=False))
        for handle in handles:service.unregister_handler(handle)
        if owned:service.shutdown()


def capture_activities(pebble,session,output,appmessage=None,verify_ticks=True):
    """Capture affected generic layouts on the existing native candidate.

    Call after capture() in the same emulator session. This function does not
    reinstall, launch, reconnect or modify the twenty-four Clay preview frames.
    """
    from libpebble2.services.appmessage import AppMessageService,Uint32,ByteArray
    from libpebble2.services.screenshot import Screenshot
    from libpebble2.protocol.system import TimeMessage,SetUTC
    from libpebble2.communication.transports.qemu.protocol import QemuTimelinePeek,QemuTimeFormat
    from pebble_tool.commands.emucontrol import send_data_to_qemu
    from PIL import Image

    host_rtc=os.environ.get('PEBBLE_QA_HOST_RTC')=='1'
    output=Path(output).resolve();output.mkdir(parents=True,exist_ok=True)
    exported=(output.parent/'native-previews/settings-preview.js').read_text().split('module.exports = ',1)[1].strip().removesuffix(';')
    preview=json.loads(exported)
    with zipfile.ZipFile(output.parent/'native-previews/native-candidate.pbw') if (output.parent/'native-previews/native-candidate.pbw').is_file() else zipfile.ZipFile(ROOT/'build'/(ROOT.name+'.pbw')) as archive:
        appinfo=json.loads(archive.read('appinfo.json'))
    target=uuid.UUID(appinfo['uuid']);keys=appinfo['messageKeys']
    if preview['version']!=json.loads((ROOT/'package.json').read_text())['version']:
        raise ValueError('Capture the current twenty-four native presets first')
    service=appmessage or AppMessageService(pebble);owned=appmessage is None
    condition=threading.Condition();receipts={};changed=[]
    def receipt(success):
        def callback(tid,app_uuid):
            if app_uuid==target:
                with condition:receipts[tid]=success;condition.notify_all()
        return callback
    def receive(_tid,app_uuid,data):
        if app_uuid!=target:return
        token=data.get(keys['REQUEST_ACTIVITIES'],data.get(keys['REQUEST_CONTEXT'],0))
        if isinstance(token,int) and token>=2 and token!=session:changed.append(token)
    handles=[service.register_handler('ack',receipt(True)),service.register_handler('nack',receipt(False)),
        service.register_handler('appmessage',receive)]
    sequence=100
    previous_plan=output/'fixtures.json'
    if previous_plan.is_file():
        previous=json.loads(previous_plan.read_text())
        if previous.get('session')==session:
            sequence=max([sequence]+[int.from_bytes(bytes(p['bytes']['ACTIVITY_DATA'])[16:20],'little') for p in previous['presets']])
    plan=fixture_plan(session,now=SAMPLE_TIME,mode='activities',sequence=sequence)
    (output/'fixtures.json').write_text(json.dumps(plan,indent=2)+'\n')
    captures=[]
    try:
        actual_presets=[]
        for preset_index,preset in enumerate(plan['presets']):
            if host_rtc:preset=fixture_plan(session,now=int(time.time()))['presets'][preset_index]
            actual_presets.append(preset)
            if changed:raise RuntimeError('Native session changed; repeat the twenty-four-preview capture first')
            pebble.send_packet(TimeMessage(message=SetUTC(unix_time=SAMPLE_TIME,utc_offset=0,tz_name='UTC')))
            send_data_to_qemu(pebble.transport,QemuTimeFormat(is_24_hour=True))
            send_data_to_qemu(pebble.transport,QemuTimelinePeek(enabled=preset['state']=='timeline'))
            dictionary={keys[name]:Uint32(value) for name,value in preset['integers'].items()}
            dictionary.update({keys[name]:ByteArray(bytes(value)) for name,value in preset['bytes'].items()})
            with condition:
                tid=service.send_message(target,dictionary)
                if not condition.wait_for(lambda:tid in receipts,timeout=10):raise RuntimeError('Activity fixture ACK timed out')
                if not receipts.pop(tid):raise RuntimeError('Watch rejected activity capture fixture')
            time.sleep(preset.get('captureDelaySeconds',.8))
            previous=None;path=output/(preset['name']+'.png')
            for attempt in range(3):
                rows=Screenshot(pebble).grab_image()
                if len(rows)!=228 or any(len(row)!=600 for row in rows):raise RuntimeError('Expected native 200×228 RGB')
                pixels=b''.join(rows)
                # ACT2 may have clocks in both item and activity positions.
                # Compare only the settled OS clock/date/readings region;
                # the entire activity area is allowed to change locally.
                stable=pixels[:200*106*3]
                if previous==stable:break
                previous=stable;time.sleep(.15)
            else:raise RuntimeError('Activity header/readings did not settle: '+preset['name'])
            Image.frombytes('RGB',(200,228),pixels).save(path)
            background=bytes.fromhex(f"{preset['integers']['BACKGROUND_COLOR']:06x}")
            region_checks=[]
            for setting,expect_ink in [('expectInk',True),('expectBlank',False)]:
                for box in preset.get(setting,[]):
                    region=b''.join(pixels[(row*200+box['x'])*3:(row*200+box['x']+box['width'])*3]
                        for row in range(box['y'],box['y']+box['height']))
                    has_ink=any(region[at:at+3]!=background for at in range(0,len(region),3))
                    if has_ink!=expect_ink:raise RuntimeError('Native activity region expectation failed: '+preset['name']+' '+setting)
                    region_checks.append({'region':box,'has_ink':has_ink})
            captured={'name':preset['name'],'file':path.name,'sha256':sha256(path.read_bytes()),
                'rgb_sha256':sha256(pixels),'pixels':[200,228],'native_pixels_modified':False,
                'settled_header_readings_rgb_equal':True,'running_clock_changes_allowed':True,
                'capture_delay_seconds':preset.get('captureDelaySeconds',.8),
                'two_configured_readings':True,'region_checks':region_checks}
            if preset.get('verifyClockTick') and not verify_ticks:
                captured['clock_tick_check']='Not run: this is a layout-only capture'
            if preset.get('verifyClockTick') and verify_ticks:
                # Guest execution can trail host wall time while other build
                # jobs are busy. Observe one unchanged fixture for a bounded
                # interval; never resend it to manufacture a clock update.
                tick_started=time.monotonic()
                time.sleep(1.15)
                while True:
                    later=b''.join(Screenshot(pebble).grab_image())
                    if pixels[200*106*3:]!=later[200*106*3:]:break
                    remaining=3.0-(time.monotonic()-tick_started)
                    if remaining<=0:raise RuntimeError('Visible native clock did not advance within 3s: '+preset['name'])
                    time.sleep(min(.25,remaining))
                tick_wait=time.monotonic()-tick_started
                tick_path=output/(preset['name']+'-tick.png')
                Image.frombytes('RGB',(200,228),later).save(tick_path)
                captured['clock_tick']={'file':tick_path.name,'sha256':sha256(tick_path.read_bytes()),
                    'activity_rgb_changed':True,'fixture_resent':False,'wait_seconds':round(tick_wait,3),
                    'observation_limit_seconds':3,
                    'native_pixels_modified':False}
            captures.append(captured)
            print('Captured '+preset['name'],flush=True)
        # Native Peek hides the activity area, so different clock values must
        # intentionally produce the same unobstructed face above its OS panel.
        # Equivalent layouts are valid: retired LARGE_TEXT has no effect, and
        # native Peek intentionally hides differing activity content. Functional
        # regions and local tick proofs above establish the affected behavior.
        report={'version':preview['version'],'session':session,'source':preview['source'],
            'phone_javascript_executed':False,'candidate_install_unchanged':True,
            'fixture_encoder':{'core':plan['coreVersion'],'activities':plan['activitiesVersion'],
                'core_wire_version':4,'activity_wire_version':plan['activityWireVersion']},'captures':captures,
            'scope':str(len(captures))+' actual activity compositions with two configured sample readings and timed expiry. All source data is synthetic; elapsed workout is not native Workout integration.',
            'local_clock_checks_requested':verify_ticks,
            'visual_review':{'reviewed':False}}
        (output/'activities.json').write_text(json.dumps(report,indent=2)+'\n')
        return report
    finally:
        send_data_to_qemu(pebble.transport,QemuTimelinePeek(enabled=False))
        for handle in handles:service.unregister_handler(handle)
        if owned:service.shutdown()


def capture_motion(pebble,pbw,output):
    """Record actual incoming replacement frames; no interpolated artwork.

    The sample bridge supplies Music followed by a new notification. Timestamps
    describe screenshot acquisition on the host, not physical display latency.
    """
    from libpebble2.services.appmessage import AppMessageService,Uint32,ByteArray
    from libpebble2.services.screenshot import Screenshot
    from libpebble2.protocol.system import TimeMessage,SetUTC
    from libpebble2.protocol.apps import AppRunState,AppRunStateStart
    from libpebble2.communication.transports.qemu.protocol import QemuBluetoothConnection
    from pebble_tool.commands.emucontrol import send_data_to_qemu
    from pebble_tool.commands.install import ToolAppInstaller
    from PIL import Image
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    native=output/'native-candidate.pbw';info,payload=native_candidate(pbw,native)
    target=uuid.UUID(info['uuid']);keys=info['messageKeys']
    service=AppMessageService(pebble);condition=threading.Condition();sessions=[];receipts={}
    def receive(_tid,app_uuid,data):
        token=data.get(keys['REQUEST_ACTIVITIES'],data.get(keys['REQUEST_CONTEXT'],0))
        if app_uuid==target and isinstance(token,int) and token>=2:
            with condition:sessions.append(token);condition.notify_all()
    def receipt(tid,app_uuid):
        if app_uuid==target:
            with condition:receipts[tid]=True;condition.notify_all()
    handles=[service.register_handler('appmessage',receive),service.register_handler('ack',receipt)]
    try:
        send_data_to_qemu(pebble.transport,QemuBluetoothConnection(connected=True))
        ToolAppInstaller(pebble,str(native),quiet=True).install()
        pebble.send_packet(AppRunState(data=AppRunStateStart(uuid=target)))
        with condition:
            if not condition.wait_for(lambda:bool(sessions),timeout=8):raise RuntimeError('No native session')
        plan=fixture_plan(sessions[-1]);presets={p['name']:p for p in plan['presets']}
        def send(preset):
            values=dict(preset['integers']);values['ANIMATIONS']=1
            dictionary={keys[name]:Uint32(value) for name,value in values.items()}
            dictionary.update({keys[name]:ByteArray(bytes(value)) for name,value in preset['bytes'].items()})
            with condition:
                tid=service.send_message(target,dictionary)
                if not condition.wait_for(lambda:tid in receipts,timeout=8):raise RuntimeError('No fixture ACK')
        pebble.send_packet(TimeMessage(message=SetUTC(unix_time=SAMPLE_TIME,utc_offset=0,tz_name='UTC')))
        # Let the RTC correction settle before accepting source validity. A
        # first frame received against the host date would correctly expire.
        send(presets['idle-24-light']);time.sleep(1.1)
        send(presets['music-24-light']);time.sleep(1)
        before=b''.join(Screenshot(pebble).grab_image())
        Image.frombytes('RGB',(200,228),before).save(output/'before.png')
        reference=qa_output(ROOT, '')/'native-previews/music-24-light.png'
        if reference.exists() and Image.open(reference).convert('RGB').tobytes()!=before:
            raise RuntimeError('Replacement baseline differs from the settled Music preview')
        frames=[];captures=[]
        send(presets['notification-24-light']);started=time.monotonic()
        for index,offset in enumerate([0,.04,.08,.12,.16,.20,.24,.28,.34,.42,.55,.70]):
            time.sleep(max(0,started+offset-time.monotonic()))
            rows=Screenshot(pebble).grab_image();pixels=b''.join(rows)
            image=Image.frombytes('RGB',(200,228),pixels)
            path=output/('incoming-%02d.png'%index);image.save(path);frames.append(image)
            captures.append({'file':path.name,'elapsedMs':round((time.monotonic()-started)*1000),
                'sha256':sha256(path.read_bytes()),'rgbSha256':sha256(pixels)})
        if len({row['rgbSha256'] for row in captures})<3:raise RuntimeError('No actual intermediate motion frames')
        if captures[-1]['rgbSha256']!=captures[-2]['rgbSha256']:raise RuntimeError('Motion did not settle')
        durations=[max(20,round((b['elapsedMs']-a['elapsedMs'])/10)*10) for a,b in zip(captures,captures[1:])]+[700]
        frames[0].save(output/'incoming.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2)
        report={'version':info['versionLabel'],'nativePayloadSha256':payload,'captures':captures,
            'scope':'Actual native Screenshot-service frames with synthetic Music/notification fixtures. GIF uses only these frames; no interpolation. Host acquisition timing is not physical-watch latency.'}
        (output/'motion.json').write_text(json.dumps(report,indent=2)+'\n')
        return report
    finally:
        for handle in handles:service.unregister_handler(handle)
        service.shutdown()


def main():
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--emulator',choices=['emery'],help='Explicit emulator selection; never inferred')
    parser.add_argument('--pbw',type=Path,default=candidate_pbw(ROOT, 'Dynamic'))
    parser.add_argument('--output',type=Path)
    parser.add_argument('--preview',type=Path,help='Explicit asset destination; defaults to the QA output directory')
    parser.add_argument('--plan',action='store_true',help='Print fixture plan only; no connection, installation or images')
    parser.add_argument('--motion',action='store_true',help='Capture incoming replacement frames instead of static presets')
    args=parser.parse_args()
    if args.plan:
        print(json.dumps(fixture_plan(42),indent=2));return
    if not args.emulator:parser.error('Capture requires explicit --emulator emery')
    from pebble_tool.commands.base import PebbleCommand
    class PreviewConnection(PebbleCommand):
        valid_connections={'emulator'}
    command=PreviewConnection();command._set_debugging(0)
    connection=command._connect(argparse.Namespace(v=0,emulator=args.emulator,sdk=None,vnc=False,sunlight=False))
    version=json.loads((ROOT/'package.json').read_text())['version']
    if args.motion:capture_motion(connection,args.pbw,args.output or qa_output(ROOT, '')/'native-motion')
    else:capture(connection,args.pbw,args.output or qa_output(ROOT, '')/'native-previews',args.preview)

if __name__=='__main__':main()
