"""Independent unmodified native pixel/font checks for the complete composition."""
from pathlib import Path
from PIL import Image
import importlib.util,json,sys,zipfile
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'scripts'))
spec=importlib.util.spec_from_file_location('audit',ROOT/'scripts/check-native-style.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
def frame(name,group='native-previews'):
    return Image.open(HERE/group/(name+'.png')).convert('RGB')
def box(im,rect,accent=False):
    background=im.getpixel((199,227))[0];points=[]
    for y in range(rect[1],rect[3]):
        for x in range(rect[0],rect[2]):
            rgb=im.getpixel((x,y));visible=max(rgb)-min(rgb)>30 if accent else max(rgb)-min(rgb)<10 and abs(rgb[0]-background)>35
            if visible:points.append((x,y))
    assert points,rect
    return [min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)]
def cy(b):return (b[1]+b[3])/2
roles={}
for name,rect in [('idleDate',(0,0,200,40)),('idleReadingLabel',(1,198,100,216)),('compactReadingLabel',(1,78,100,101)),('secondaryCaption',(42,106,190,132)),('primaryCaption',(46,188,190,216))]:
    im=frame(('idle' if name.startswith('idle') else 'timer')+'-24-light');b=box(im,rect);roles[name]={'inkBounds':b,'heightPx':b[3]-b[1]+1}
assert roles['idleDate']['heightPx']>=19
assert roles['idleReadingLabel']['heightPx']>=14
assert roles['compactReadingLabel']['heightPx']>=14
assert roles['secondaryCaption']['heightPx']>=16
assert roles['primaryCaption']['heightPx']>=17
centers=[]
for theme in ['light','dark']:
    for name in ['timer','music','notification','notification-summary']:
        im=frame(name+'-24-'+theme);i=box(im,(10,188,38,216),True);t=box(im,(46,188,190,216));delta=abs(cy(i)-cy(t));assert delta<=1,(name,delta)
        centers.append({'group':name,'theme':theme,'iconInk':i,'captionInk':t,'differencePx':delta})
    im=frame('timer-24-'+theme);i=box(im,(10,106,34,132),True);t=box(im,(42,106,190,132));delta=abs(cy(i)-cy(t));assert delta<=1,delta
    centers.append({'group':'secondary','theme':theme,'iconInk':i,'captionInk':t,'differencePx':delta})
    i=box(im,(10,52,40,78),True);t=box(im,(42,52,90,78));delta=abs(cy(i)-cy(t));assert delta<=1,delta
    centers.append({'group':'inline reading','theme':theme,'iconInk':i,'valueInk':t,'differencePx':delta})
checked=0
for group in ['native-previews','native-activities','native-long-date']:
    for path in (HERE/group).glob('*.png'):
        im=Image.open(path).convert('RGB');assert im.size==(200,228);checked+=1
        if path.name.startswith('timeline'):continue
        bg=im.getpixel((199,227));assert all(im.getpixel((x,y))==bg for y in range(216,228) for x in range(200)),path
with zipfile.ZipFile(ROOT/'dist/Dynamic-0.18.2.pbw') as z:resources=audit.read_resource_pack(z.read('emery/app_resources.pbpack'),8)
fonts={p:audit.read_pfo(resources[n+1]['data'])['metrics'] for n,p in enumerate(audit.BODY_SIZES)}
font_roles={}
for p in [20,22,24,26]:
    m=fonts[p];caps='TEMP SUN Paused Tea 31.12.';ink=[m[ord(c)] for c in caps if c!=' ']
    font_roles[str(p)]={'capDigitInkPx':m[ord('H')]['height'],'ascent':max(p-g['top'] for g in ink),'descent':max(g['top']+g['height']-p for g in ink)}
assert [font_roles[str(p)]['capDigitInkPx'] for p in [20,22,24,26]]==[14,16,17,19]
# Every actually supported localized weekday fits the 76px date column and
# retains >=5px top room at the Idle/Peek baseline31. Compact omits weekday.
weekdays=[]
for locale,days in audit.REVIEWED_WEEKDAYS.items():
    for day in days.split():
        m=fonts[26];width=sum(m[ord(c)]['advance'] for c in day);top=31-26+min(m[ord(c)]['top'] for c in day)
        assert width<=76 and top>=5,(locale,day,width,top)
        weekdays.append({'locale':locale,'text':day,'widthPx':width,'topPx':top})
for group in ['native-previews','native-long-date']:
    im=frame('timer-24-light',group);clock=box(im,(0,0,116,48));date=box(im,(120,0,200,48));assert date[0]-clock[2]>=6 and date[3]<=42,(group,clock,date)
report={'result':'PASS','scope':'Independent pixel measurements of unmodified native screenshots plus exact packaged font metrics. Not physical-watch readability or browser execution.','visibleTextRoles':roles,'packagedRobotoRoles':font_roles,'iconTextCenters':centers,'allStaticFramesChecked':checked,'normalFullHeightBottomClearancePx':12,'localizedWeekdayGeometry':weekdays,'localizedWeekdayScope':'Packaged glyph metrics and source geometry, not live locale screenshots.','phoneBrowserPixelsVerified':False}
(HERE/'readability.json').write_text(json.dumps(report,indent=2)+'\n');print('Whole-composition readability/centers/clearance: PASS')
