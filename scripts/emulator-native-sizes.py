#!/usr/bin/env python3
"""Actual OS-size native captures, with optional activity/tick and motion checks."""
from pathlib import Path
import argparse,importlib.util,json,os,sys,tempfile,time,uuid
from repo_workflow import candidate

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pbw',type=Path,default=candidate(root,'Dynamic'))
parser.add_argument('--size',type=int,choices=(1,2,3),required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--activities',action='store_true')
parser.add_argument('--activity-cases',nargs='+')
parser.add_argument('--motion',action='store_true')
parser.add_argument('--readings',nargs='+',help='Focused public-reading scenario names')
parser.add_argument('--readings-only',action='store_true')
parser.add_argument('--language',default='en',help='Phone fixture formatting language; native lookup is unchanged')
parser.add_argument('--sample-time',type=int,help='Synthetic UTC seconds for clock/date boundary cases')
parser.add_argument('--baseline',type=Path,help='Previous native-previews directory for exact clock-pixel comparison')
args=parser.parse_args()
sys.path.insert(0,str(root.parent/'recovery-validation'))
os.environ.setdefault('PEBBLE_QA_STATE',tempfile.mkdtemp(prefix='dynamic-native-size-'))
from pipe_emulator import connect
from libpebble2.communication.transports.qemu.protocol import QemuContentSize
from pebble_tool.commands.emucontrol import send_data_to_qemu
from libpebble2.protocol.logs import AppLogMessage,AppLogShippingControl
from libpebble2.protocol.system import TimeMessage,SetUTC
from libpebble2.protocol.apps import AppRunState,AppRunStateStop
from PIL import Image
spec=importlib.util.spec_from_file_location('native_capture',root/'scripts/capture-native-previews.py')
capture=importlib.util.module_from_spec(spec);spec.loader.exec_module(capture)
if args.sample_time:capture.SAMPLE_TIME=args.sample_time
p=connect();logs=[]
p.register_endpoint(AppLogMessage,lambda packet:logs.append(packet.message))
p.send_packet(AppLogShippingControl(enable=True))
send_data_to_qemu(p.transport,QemuContentSize(size=args.size))
if os.environ.get('PEBBLE_QA_HOST_RTC')!='1':
    # Set the fixture clock before native startup, so its initial clock cache
    # cannot retain the host date while the first time-change event is pending.
    p.send_packet(TimeMessage(message=SetUTC(unix_time=capture.SAMPLE_TIME,utc_offset=0,tz_name='UTC')))
    time.sleep(.2)
report=None if args.readings_only else capture.capture(p,args.pbw,args.output/'native-previews')
if args.activities:
    assert report,'Activity suite requires the standard previews'
    activities=capture.capture_activities(p,report['session'],args.output/'native-activities',names=args.activity_cases)
    if args.size==3 and (not args.activity_cases or 'paused-primary-wide-detail' in args.activity_cases):
        wide=[entry for entry in activities['captures'] if entry['name'].startswith('paused-primary-wide-detail')]
        assert len(wide)==2 and all(entry['nativePresentation']['secondary']==255 for entry in wide),wide
if args.motion:capture.capture_motion(p,args.pbw,args.output/'native-motion')
if args.readings:capture.capture_complications(p,args.pbw,args.output/'native-readings',names=args.readings,language=args.language)
assert any('Text OS='+str(args.size)+' ' in line for line in logs),logs
comparisons=[]
if args.baseline:
    assert report,'Clock comparisons require the standard previews'
    for entry in report['captures']:
        name=entry['name'];box=(0,40,200,108) if name.startswith('timeline-') else (0,45,200,138) if name.startswith('idle-') else (0,0,116,52)
        old=Image.open(args.baseline/entry['file']).convert('RGB').crop(box)
        new=Image.open(args.output/'native-previews'/entry['file']).convert('RGB').crop(box)
        assert old.tobytes()==new.tobytes(),('Main clock pixels changed',name,box)
        comparisons.append({'name':name,'clockRegion':box,'unchanged':True})
p.send_packet(AppRunState(data=AppRunStateStop(uuid=uuid.UUID(json.loads((root/'package.json').read_text())['pebble']['uuid']))))
time.sleep(.3)
(args.output/'size-checks.json').write_text(json.dumps({'actualOsSize':args.size,'nativeLogs':logs,
    'clockPixelComparisons':comparisons,'physicalWatch':False,'phoneRuntime':False,
    'scope':'Exact packaged native payload in isolated Emery QEMU; synthetic source fixtures and actual OS content size'},indent=2)+'\n')
print('Actual native OS size',args.size,'PASS:',args.output)
