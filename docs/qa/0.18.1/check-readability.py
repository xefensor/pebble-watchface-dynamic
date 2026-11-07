"""Check unmodified native screenshot ink, independent of layout point sizes."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent

def frame(version,name):
    return Image.open(ROOT/'docs/qa'/version/'native-previews'/(name+'.png')).convert('RGB')

def box(im,rect,accent=False):
    background=im.getpixel((199,227))[0]
    points=[]
    for y in range(rect[1],rect[3]):
        for x in range(rect[0],rect[2]):
            rgb=im.getpixel((x,y))
            visible=max(rgb)-min(rgb)>30 if accent else max(rgb)-min(rgb)<10 and abs(rgb[0]-background)>35
            if visible:points.append((x,y))
    assert points,rect
    return [min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)]

def center_y(bounds):return (bounds[1]+bounds[3])/2

measurements={}
for version in ('0.17.0','0.18.0','0.18.1'):
    idle=frame(version,'idle-24-light');active=frame(version,'timer-24-light')
    date=box(idle,(0,0,200,34));clock=box(active,(0,0,118,49))
    measurements[version]={'idleDateInk':date,'idleDateInkHeight':date[3]-date[1]+1,
                           'compactClockInk':clock,'compactClockInkHeight':clock[3]-clock[1]+1}
assert measurements['0.18.1']['idleDateInkHeight']>=18
assert measurements['0.18.1']['idleDateInkHeight']>measurements['0.18.0']['idleDateInkHeight']
assert measurements['0.18.1']['compactClockInkHeight']>=measurements['0.17.0']['compactClockInkHeight']

groups=[]
for name,icon_rect,text_rect in (
    ('timer',(10,192,34,216),(44,192,190,216)),
    ('notification',(10,200,26,216),(36,200,190,216)),
    ('notification-summary',(10,200,26,216),(36,200,190,216)),
    ('music',(10,176,50,216),(60,176,190,216))):
    for theme in ('light','dark'):
        im=frame('0.18.1',name+'-24-'+theme)
        icon=box(im,icon_rect,accent=True);text=box(im,text_rect)
        delta=abs(center_y(icon)-center_y(text));assert delta<=1,(name,theme,delta)
        groups.append({'group':name,'theme':theme,'iconInk':icon,'captionInk':text,'centerDifferencePx':delta})
im=frame('0.18.1','timer-24-light')
icon=box(im,(10,96,26,114),True);text=box(im,(32,96,190,114))
assert abs(center_y(icon)-center_y(text))<=1
groups.append({'group':'secondary','iconInk':icon,'captionInk':text,'centerDifferencePx':abs(center_y(icon)-center_y(text))})

for name in ('native-previews','native-activities','native-long-date'):
    for path in (HERE/name).glob('*.png'):
        assert Image.open(path).size==(200,228),path
        if path.name.startswith('timeline'):continue
        im=Image.open(path).convert('RGB');background=im.getpixel((199,227))
        assert all(im.getpixel((x,y))==background for y in range(216,228) for x in range(200)),path

report={'result':'PASS','scope':'Pixel measurements of unmodified native emulator captures, not physical-watch readability.',
        'dateAndClock':measurements,'iconCaptionGroups':groups,'activityBottomClearancePx':12,
        'accentBounds':'Shared native Gothic28 accent probe: top4/bottom31; Dynamic idle/Peek frame y1 and compact weekday frame y-1 leave5/3px top margins. Compact next date begins33 after weekday full ink ends30.',
        'phoneBrowserPixelsVerified':False}
(HERE/'readability.json').write_text(json.dumps(report,indent=2)+'\n')
print('Readability, ink centering and bottom clearance: PASS')
