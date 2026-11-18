'use strict';
// Exercise the actual generated Clay page with a simulated Pebble SDK bridge.
// Requires a local Chromium executable; no npm/browser download or real account.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/qa/settings-ux');fs.mkdirSync(out,{recursive:true});
const log=fs.openSync(path.join(out,'chromium.log'),'w');
const browser=cp.spawn(process.env.CHROMIUM||'chromium',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(out,'profile'),'--remote-debugging-pipe'],{stdio:['ignore','ignore',log,'pipe','pipe']});
let id=0,buffer=Buffer.alloc(0);const pending=new Map();
browser.stdio[4].on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);let end;while((end=buffer.indexOf(0))>=0){const raw=buffer.subarray(0,end).toString();buffer=buffer.subarray(end+1);if(!raw)continue;const m=JSON.parse(raw);if(m.id&&pending.has(m.id)){const [ok,fail]=pending.get(m.id);pending.delete(m.id);m.error?fail(Error(JSON.stringify(m.error))):ok(m.result);}}});
browser.on('error',error=>{for(const [,fail]of pending.values())fail(error);});
const send=(method,params={},sessionId)=>new Promise((ok,fail)=>{const n=++id;pending.set(n,[ok,fail]);browser.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
function sdk(initial){
 window.__saved=JSON.parse(sessionStorage.getItem('__testSavedPacket')||JSON.stringify(initial));window.__saveMode='success';window.__writes=[];window.__target='plugin';window.__fontAssets={};
 window.Pebble={targets:()=>Promise.resolve([{id:__target}]),addEventListener:(name,callback)=>{if(name==='ready')document.addEventListener('DOMContentLoaded',()=>callback({target:'plugin'}));},sendMessage:async(target,m)=>{
  if(m.type==='load_settings')return __saved;
  if(m.type==='font_store'){__fontAssets[m.asset.id]=m.asset;return {ok:true};}
  if(m.type==='font_get')return {ok:!!__fontAssets[m.id],asset:__fontAssets[m.id]};
  if(m.type==='save_settings'){
   __writes.push(m.settings);
   if(__saveMode==='failure')return {ok:false,notSaved:true};
   if(__saveMode==='uncertain')throw Error('simulated uncertain storage');
   const finish=()=>{__saved.settings=m.settings;__saved.values=m.settings;__saved.save={state:'pending',applied:false,pending:true};sessionStorage.setItem('__testSavedPacket',JSON.stringify(__saved));return {ok:true,settings:m.settings,delivery:__saved.save};};
   if(__saveMode==='delayed')return new Promise(resolve=>{window.__finishSave=()=>resolve(finish());});
   return finish();
  }
  if(m.type==='retry_display')__saved.save={state:'saved',applied:true,pending:false};
  if(m.type==='display_status'||m.type==='retry_display')return {ok:true,settings:__saved.settings,delivery:__saved.save};
  return {ok:true};
 }};
}
function legacyPage(response){
 const vm=require('node:vm');
 const entry=require.resolve('../src/pkjs/index'),companionRequire=require('node:module').createRequire(entry);
 const keys=Object.fromEntries(require('../package.json').pebble.messageKeys.map((name,index)=>[name,index]));
 const stored={'dynamic-font-library-v1':JSON.stringify([{id:120077,name:'Saved <Bold> 25%'}])};
 const localStorage={getItem:key=>stored[key]||null,setItem:(key,value)=>{stored[key]=value;}};
 const handlers={};
 let url;
 const Pebble={getActiveWatchInfo:()=>({language:'cs',platform:'emery'}),addEventListener:(name,fn)=>{handlers[name]=fn;},sendAppMessage(){},openURL:value=>{url=value;}};
 const box={module:{exports:{}},exports:{},require:()=>keys,Pebble,localStorage,console};
 const archive=path.join(path.dirname(require.resolve('@rebble/clay/package.json')),'dist.zip');
 const source=cp.execFileSync('python3',['-c','import sys, zipfile; sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("js/index.js"))',archive],{encoding:'utf8'});
 vm.runInNewContext(source,box);
 vm.runInNewContext(fs.readFileSync(entry,'utf8'),{Pebble,localStorage,console,setTimeout:()=>0,clearTimeout(){},require(name){
  if(name==='message_keys')return keys;
  if(name==='@rebble/clay')return box.module.exports;
  return companionRequire(name);
 }});
 if(response)handlers.webviewclosed({response});
 handlers.showConfiguration();
 assert.ok(url.startsWith('data:text/html'));
 // Give the standalone browser a same-page destination for Clay's submitted payload.
 return decodeURIComponent(url.slice(url.indexOf(',')+1)).replace('window.returnTo="pebblejs://close#"','window.returnTo="#"');
}
function helpers(){
 const $=selector=>document.querySelector(selector),visible=element=>!!element&&element.getClientRects().length>0;
 const pause=()=>new Promise(resolve=>setTimeout(resolve,150));
 const setting=key=>$('[data-setting="'+key+'"]');
 const change=async(selector,value)=>{const element=typeof selector==='string'?$(selector):selector;if(!visible(element)||element.disabled)throw Error('Unavailable '+selector);element.value=String(value);element.dispatchEvent(new Event('change',{bubbles:true}));await pause();};
 const choose=async(key,value)=>change(setting(key).querySelector('select'),value);
 const toggle=async key=>{const input=setting(key).querySelector('input');input.click();await pause();};
 const click=async selector=>{
  const element=$(selector);
  if(!visible(element)||element.disabled)throw Error('Unavailable control '+selector);
  element.scrollIntoView({block:'nearest'});
  element.click();
  await pause();
 };
 const palette=id=>click('[data-edit-palette="'+id+'"]');
 const appearance=async value=>{
  if(!visible($('#dynamic-appearance-choice-select')))await click('#dynamic-appearance-change');
  await change('#dynamic-appearance-choice-select',value);
 };
 const open=async id=>{
  const panel='#dynamic-screen-'+id;
  if(visible($(panel)))return;
  const route='button[data-screen="'+id+'"]';
  if(!visible($(route)))await click('.dynamic-back');
  if(!visible($(panel)))await click(route);
  if(!visible($(panel)))throw Error('Screen did not open '+id);
 };
 const check=(value,message)=>{if(!value)throw Error(message);};
 const save=async()=>{await click('.dynamic-primary-save');await new Promise(resolve=>setTimeout(resolve,250));};
 return {$,visible,pause,setting,change,choose,toggle,click,open,check,save,palette,appearance};
}
const reports=[];
async function verifyDisconnected(evaluate){
 const native=fs.readFileSync(path.join(root,'src/c/dynamic.c'),'utf8');
 const mask=native.match(/disconnected_glyph\[16\]\s*=\s*\{([^}]+)\}/);
 assert.ok(mask,'Native disconnected badge mask');
 const rows=mask[1].split(',').map(Number);
 assert.equal(rows.length,16);
 await evaluate('('+async function(rows){
  const {$,open,change,check,toggle,palette,visible}=testHelpers();
  const canvas=$('#dynamic-preview-canvas'),ctx=canvas.getContext('2d');
  const pixels=()=>new Uint32Array(ctx.getImageData(0,0,canvas.width,canvas.height).data.buffer);
  await open('colours');
  for(const key of ['day','night']){
   await palette(key);
   await change('#dynamic-preview-scene','idle');const idle=pixels();
   await change('#dynamic-preview-scene','disconnected');const lost=pixels();
   let changed=0;
   for(let i=0;i<idle.length;i++)if(idle[i]!==lost[i])changed++;
   check(changed>=150&&changed<=400,'Disconnected scene paints a distinct badge on '+key);
   const glyphX=canvas.width===200?178:236,glyphY=113;
   const backing=lost[(glyphY-1)*canvas.width+glyphX+8];
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const pixel=lost[(glyphY+y)*canvas.width+glyphX+x];
    check((pixel!==backing)===!!(rows[y]&(1<<x)),'Disconnected preview matches the native glyph at '+x+', '+y);
   }
   check(canvas.getAttribute('aria-label').includes('Phone disconnected'),'Preview announces the disconnected scene');
  }
  await open('layout');await toggle('SHOW_STATUS');await open('colours');
  const description=document.getElementById(canvas.getAttribute('aria-describedby'));
  check(visible(description)&&description.textContent.includes('Status indicators are off.'),'Preview explains the hidden indicator');
  const disabled=pixels();await change('#dynamic-preview-scene','idle');
  check(pixels().every((pixel,i)=>pixel===disabled[i]),'Disabled badge leaves the idle face intact');
  await open('layout');await toggle('SHOW_STATUS');await open('colours');await palette('day');
  check(!visible($('.dynamic-save-buttons')),'Previewing either palette and scene leaves the draft clean');
  await open('fonts');
 }.toString()+')('+JSON.stringify(rows)+')');
}
async function verifyTimeline(evaluate,platform){
 const assets=require('../src/pkjs/settings-preview-all');
 const frame=(platform==='gabbro'?assets.round:assets).frames['timeline-24-light'];
 await evaluate('('+async function(frame){
  const {$,change,check,open}=testHelpers();
  await open('fonts');
  const source=new Image();
  source.src=frame.src;
  await source.decode();
  await change('#dynamic-preview-scene','timeline');
  const reference=document.createElement('canvas');
  reference.width=source.naturalWidth;reference.height=source.naturalHeight;
  const expected=reference.getContext('2d');
  expected.drawImage(source,0,0);
  const actual=$('#dynamic-preview-canvas').getContext('2d');
  for(const {x,y,width,height} of frame.preserve){
   const rect=[x,y,width,height];
   const pixels=actual.getImageData(...rect).data;
   check(expected.getImageData(...rect).data.every((channel,i)=>pixels[i]===channel),'Custom preview preserves all OS-owned Timeline pixels');
  }
 }.toString()+')('+JSON.stringify(frame)+')');
}
async function run(name,options,check){
 global.Pebble={getActiveWatchInfo:()=>options.platform?({platform:options.platform}):null};
 const state=require('../src/common/settings-state');
 const settings=Object.assign(state.read({getItem:()=>null}),options.settings);
 const metadata={slots:[{label:'Temperature',value:'5°C',status:'ready'},{label:'Rain',value:'100%',status:'ready'},{label:'Phone',value:'78%',status:'ready'},{label:'Humidity',value:'68%',status:'ready'}],sources:{music:{state:'playing'},activities:{state:'ready'}},activityProviders:[{uuid:'50e9ef12-a5ab-4369-a3b5-3447bfba5151',name:'Timer',available:true}],save:{state:'saved',applied:true,pending:false}};
 const packet=require('../src/common/settings-config')(settings,options.language||'en',metadata,24);
 const html=options.legacy?legacyPage(options.response):fs.readFileSync(path.join(root,'config.html'),'utf8');
 const setup=options.legacy?'document.addEventListener("submit",event=>event.preventDefault(),true);':'('+sdk.toString()+')('+JSON.stringify(packet).replace(/</g,'\\u003c')+');';
 const injection='<script>window.__errors=[];addEventListener("error",e=>__errors.push(e.message));addEventListener("unhandledrejection",e=>__errors.push(String(e.reason)));'+setup+'window.testHelpers='+helpers.toString()+';</script>';
 const file=path.join(out,name+'.html');fs.writeFileSync(file,html.replace('<script>',()=>injection+'<script>'));
 const {targetId}=await send('Target.createTarget',{url:'file://'+file});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 await send('Emulation.setDeviceMetricsOverride',{width:options.width||390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:options.dark?'dark':'light'}]},sessionId);
 const evaluate=expression=>send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId).then(r=>{if(r.exceptionDetails)throw Error(name+': '+JSON.stringify(r.exceptionDetails));return r.result.value;});
 const screenshot=async label=>{
  await wait(150);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);
  fs.writeFileSync(path.join(out,name+'-'+label+'.png'),Buffer.from(shot.data,'base64'));
 };
 try{
  for(let attempt=0;attempt<35;attempt++){if(await evaluate('!!document.querySelector(".dynamic-editor-tab")'))break;await wait(100);}
  await wait(350);assert.deepEqual(await evaluate('__errors'),[],name+' startup errors');
  await screenshot('initial');
  const result=await check({evaluate,screenshot,sessionId});
  assert.deepEqual(await evaluate('__errors'),[],name+' browser errors');
  assert.equal(await evaluate('document.documentElement.scrollWidth>window.innerWidth'),false,name+' horizontal overflow');
  reports.push({name,...result});console.log(name,JSON.stringify(result));
 }finally{await send('Target.closeTarget',{targetId});}
}
(async()=>{
 for(const platform of ['emery','gabbro'])await run(platform,{platform},async({evaluate,screenshot})=>{
  await verifyDisconnected(evaluate);
  const result=await evaluate('('+async function(){
   const {$,visible,setting,open,change,choose,save,pause,check}=testHelpers();
   check(visible($('#dynamic-screen-fonts')),'Fresh install opens the font editor');
   const scene=$('#dynamic-preview-scene');
   check(visible($('.dynamic-preview-card'))&&visible(scene)&&scene.tagName==='SELECT','Preview and sample scene visible on arrival');
   check((scene.labels.length||scene.getAttribute('aria-label'))&&visible($('.dynamic-preview-card canvas[role=img]')),'Preview controls and watch image have accessible roles');
   await change(scene,'timer');
   check(scene.value==='timer'&&!visible($('.dynamic-save-buttons')),'Exploring preview scenes keeps the draft clean');
   await choose('TEXT_SIZE',1);
   const small=$('#dynamic-preview-canvas').toDataURL();
   await choose('TEXT_SIZE',3);
   check($('#dynamic-preview-canvas').toDataURL()!==small,'Changing explicit text size redraws the preview');
   check(visible($('#dynamic-screen-fonts'))&&scene.value==='timer','Changing text size keeps the active editor and scene');
   check(visible($('.dynamic-save-buttons')),'Changing text size exposes draft actions');
   const tabs=[...document.querySelectorAll('.dynamic-editor-tab')];
   check(tabs.length===3&&tabs.every(tab=>tab.getAttribute('role')==='tab'&&tab.closest('[role=tablist]')),'Three accessible editor tabs');
   const selected=tabs.find(tab=>tab.getAttribute('aria-selected')==='true');
   check(selected&&selected.dataset.screen==='fonts'&&selected.tabIndex===0,'Fonts is the selected keyboard tab');
   selected.focus();
   selected.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
   await pause();
   const next=tabs[(tabs.indexOf(selected)+1)%tabs.length];
   check(document.activeElement===next&&next.getAttribute('aria-selected')==='true','Arrow selects and focuses the next editor tab');
   check(visible(document.getElementById(next.getAttribute('aria-controls'))),'Editor tab names its visible panel');
   await open('layout');await choose('READING_LAYOUT',1);
   await open('colours');check(visible(setting('BACKGROUND_COLOR'))&&!visible(setting('NIGHT_BACKGROUND_COLOR')),'Only day palette');
   await testHelpers().palette('night');check(!visible(setting('BACKGROUND_COLOR'))&&visible(setting('NIGHT_BACKGROUND_COLOR')),'Only night palette');
   $('[data-preset="light"]').click();await new Promise(resolve=>setTimeout(resolve,100));
   await save();check(__saved.settings.READING_LAYOUT===1,'Cross-category layout saved');check(__saved.settings.NIGHT_BACKGROUND_COLOR===0xffffff,'Night preset saved');check(__saved.settings.MANUAL_APPEARANCE===0&&__saved.settings.APPEARANCE_MODE===2,'Editing palette must not switch appearance');
   return {fontEditor:true,keyboardTabs:true,save:true,paletteIsolation:true};
  }.toString()+')()');
  await screenshot('colours');
  await verifyDisconnected(evaluate);
  await verifyTimeline(evaluate,platform);
  return {...result,textSizePreview:true,timelinePixels:true,disconnectedBadge:true};
 });
 await run('fonts',{platform:'emery'},async({evaluate,screenshot,sessionId})=>{
  const fixture=fs.readFileSync(path.join(root,'resources/fonts/RobotoCondensed-Bold.ttf')).toString('base64');
  await send('Emulation.setTouchEmulationEnabled',{enabled:true},sessionId);
  async function tap(selector,scroll=true){
   const touch=await evaluate('('+function(selector,scroll){
    const button=document.querySelector(selector);
    if(!testHelpers().visible(button))throw Error('Missing touch target '+selector);
    if(scroll)button.scrollIntoView({block:'center'});
    const {left,top,width,height}=button.getBoundingClientRect();
    const point={x:left+width/2,y:top+height/2};
    if(!button.contains(document.elementFromPoint(point.x,point.y)))throw Error('Unreachable touch target '+selector);
    return point;
   }.toString()+')('+JSON.stringify(selector)+','+scroll+')');
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]},sessionId);
   await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},sessionId);
   await wait(200);
  }
  await tap('[data-font-role="FONT_WATCHFACE"]',false);
  assert.ok(await evaluate('testHelpers().visible(document.querySelector("[data-font-picker]"))'),'Tapping the whole-face row opens its picker');
  for(const id of [1,0]){
   await tap('[data-font-choice="'+id+'"]');
   await evaluate('('+function(id){
    const {$,visible,check}=testHelpers();
    check(visible($('[data-font-picker]')),'Selecting a font keeps the picker open for the next choice');
    const selected=document.querySelectorAll('[data-font-choice][aria-pressed="true"]');
    check(selected.length===1&&selected[0].dataset.fontChoice===String(id),'Only the latest choice is marked selected');
    check(Number($('[data-font-role="FONT_WATCHFACE"]').dataset.fontId)===id,'The draft uses the tapped font');
   }.toString()+')('+id+')');
   if(id===1)await screenshot('picker');
  }
  await evaluate('document.querySelector(\'[data-font-choice="1"]\').focus()');
  const enterKey={key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13};
  await send('Input.dispatchKeyEvent',{...enterKey,type:'keyDown',text:'\r',unmodifiedText:'\r'},sessionId);
  await send('Input.dispatchKeyEvent',{...enterKey,type:'keyUp'},sessionId);
  await wait(150);
  assert.equal(await evaluate('document.activeElement.matches(\'[data-font-choice="1"][aria-pressed="true"]\')'),true,'Keyboard selection retains focus on the activated choice');
  await tap('[data-font-choice="0"]');
  await evaluate('('+async function(sample){
   const {$,click,check,visible,pause}=testHelpers();
   const file=$('[data-font-panel] input[type=file]');
   async function loadFile(bytes){
    const files=new DataTransfer();
    files.items.add(new File([bytes],'Font.ttf',{type:'font/ttf'}));
    file.files=files.files;
    file.dispatchEvent(new Event('change',{bubbles:true}));
    await pause();
   }
   check(visible($('button[data-font-import]')),'The import action is reachable inside the role picker');
   check(!visible($('[data-setting="TEXT_SIZE"]')),'Role picker hides editor text size');
   await loadFile(new Uint8Array(24));
   check($('[data-font-status]').textContent==='Could not import font','Invalid import stays actionable');
   check(visible($('[data-font-picker]'))&&!visible($('.dynamic-save-buttons')),'A failed import leaves the prior selection intact');
   await loadFile(Uint8Array.from(atob(sample),letter=>letter.charCodeAt(0)));
   const chosen=Number($('button[data-font-role="FONT_WATCHFACE"]').dataset.fontId);
   check(chosen>3&&__fontAssets[chosen]&&visible($('[data-font-choice="'+chosen+'"][aria-pressed="true"]')),'An import leaves the selected font visible in the picker');
   await click('button[data-font-back]');
   check(!visible($('[data-font-picker]'))&&document.activeElement===$('[data-font-role="FONT_WATCHFACE"]'),'Back closes the picker and restores focus to its role');
   check(visible($('[data-setting="TEXT_SIZE"]')),'The main font editor restores text size');
   await click('details[data-font-overrides] summary');
   await click('button[data-font-role="FONT_CLOCK"]');
   await click('button[data-font-choice="2"]');
   await click('button[data-font-back]');
   await click('button[data-font-role="FONT_DATE"]');
   check(!visible($('button[data-font-choice="2"]')),'The date excludes clock-only built-ins');
   await click('button[data-font-choice="1"]');
   await click('button[data-font-choice="0"]');
   check(visible($('.dynamic-save-buttons'))&&Number($('button[data-font-role="FONT_DATE"]').dataset.fontId)===0,'Inheritance restores the whole-face choice');
   await click('button[data-font-back]');
   await click('button[data-font-role="FONT_CLOCK"]');
   await click('button[data-font-back]');
   check(Number($('button[data-font-role="FONT_CLOCK"]').dataset.fontId)===2,'Back leaves the clock override intact');
   await testHelpers().save();
   check(__saved.settings.FONT_WATCHFACE===chosen&&__saved.settings.FONT_CLOCK===2&&__saved.settings.FONT_DATE===0,'The global font and override save together');
   check(!visible($('.dynamic-save-buttons')),'Clean draft releases the action bar');
  }.toString()+')('+JSON.stringify(fixture)+')');
  await screenshot('saved-fonts');
  await verifyTimeline(evaluate,'emery');
  await evaluate('('+async function(){
   const {$,click,save,check}=testHelpers();
   await click('button[data-font-reset]');
   await save();
   check(Object.keys(__saved.settings).filter(key=>key.startsWith('FONT_')).every(key=>!__saved.settings[key]),'Reset clears all font roles');
   check(!$('[data-font-status]').textContent.includes('ready to save'),'Reset clears obsolete import feedback');
  }.toString()+')()');
  return {touchPicker:true,successiveFontChoices:true,keyboardChoice:true,invalidImport:true,fontImport:true,independentOverride:true,inherit:true,reset:true};
 });
 let clayResponse;
 await run('legacy-fonts',{legacy:true,platform:'emery'},async({evaluate,screenshot})=>{
  await evaluate('('+async function(){
   const {$,click,visible,check}=testHelpers();
   const row='[data-setting="FONT_WATCHFACE"]';
   await click(row+' summary');
   const select=$(row+' select'),picker=$(row+' details');
   check(picker.open&&!visible(select),'Legacy font choices open inline');
   for(const id of ['1','120077']){
    const selector=row+' [data-font-choice="'+id+'"]';
    await click(selector);
    check(picker.open&&visible($(selector)),'Choosing a legacy font keeps its menu open');
    check(select.value===id&&$(row+' [aria-pressed="true"]')===$(selector),'Visible choice agrees with the serialized Clay field');
   }
   check($(row+' summary').textContent.includes('Saved <Bold> 25%'),'Saved font name is decoded in the current selection');
  }.toString()+')()');
  await screenshot('selected');
  await evaluate('('+async function(){
   const {$,open,palette,click,appearance,check,visible,change}=testHelpers();
   await open('colours');await palette('day');await click('[data-preset="dark"]');
   await palette('night');await change('#dynamic-preview-scene','disconnected');await palette('day');
   await appearance('quiet');check(visible($('#dynamic-appearance-pending')),'Legacy rule stays pending before Save');
  }.toString()+')()');
  await evaluate('testHelpers().click(".component-submit button[type=submit]")');
  clayResponse=await evaluate('decodeURIComponent(location.hash.slice(1))');
  assert.equal(Number(JSON.parse(clayResponse).FONT_WATCHFACE.value),120077,'Legacy Save submits the last choice');
  return {successiveFontChoices:true,savedFontLabel:true,serializedSave:true};
 });
 await run('legacy-colours-reopened',{legacy:true,response:clayResponse,platform:'emery'},async({evaluate})=>{
  await evaluate('('+async function(){
   const {$,open,palette,check,visible}=testHelpers();
   await open('colours');await palette('day');
   check($('#dynamic-appearance-choice-select').value==='quiet'&&!visible($('#dynamic-appearance-pending')),'Reopened Clay form reads the saved Quiet Time rule');
   check($('#dynamic-palette-input').value.startsWith('DYN1-000000-FFFFFF'),'Reopened Clay form retains the Day colours');
   check($('.component-submit button[type=submit]').disabled,'Preview opens with a clean saved draft');
  }.toString()+')()');
  return {paletteAndRulePersist:true};
 });
 await run('catalog',{platform:'gabbro'},async({evaluate,screenshot})=>{
  const sample=fs.readFileSync(path.join(root,'resources/fonts/RobotoCondensed-Bold.ttf')).toString('base64');
  await evaluate('('+async function(sample){
   const {$,click,check,pause,visible}=testHelpers();
   const commit='1'.repeat(40),tree='2'.repeat(40),ofl='3'.repeat(40);
   const api='https://api.github.com/repos/google/fonts/';
   const raw='https://raw.githubusercontent.com/google/fonts/'+commit+'/ofl/roboto/';
   const metadata='name: "Roboto"\nfonts {\n filename: "Roboto-Bold.ttf"\n style: "normal"\n weight: 700\n}';
   const replies=new Map([
    [api+'commits/main',JSON.stringify({sha:commit,commit:{tree:{sha:tree}}})],
    [api+'git/trees/'+tree,JSON.stringify({sha:tree,tree:[{type:'tree',path:'ofl',sha:ofl}]})],
    [api+'git/trees/'+ofl,JSON.stringify({sha:ofl,tree:[{type:'tree',path:'roboto',sha:'4'.repeat(40)}]})],
    [raw+'METADATA.pb',metadata],
    [raw+'Roboto-Bold.ttf',Uint8Array.from(atob(sample),c=>c.charCodeAt(0))]
   ]);
   let online=false;
   window.fetch=async url=>{
    if(!online||!replies.has(url))return new Response(null,{status:503});
    if(url.endsWith('.ttf')&&window.holdTestDownload)await new Promise(resolve=>{window.finishTestDownload=resolve;});
    return new Response(replies.get(url));
   };
   await click('details[data-font-overrides] summary');
   await click('button[data-font-role="FONT_ACTIVITIES"]');
   await click('button[data-font-google]');
   check($('[data-font-status]').textContent==='Could not load Google Fonts','Offline catalog reports a recoverable error');
   check(!visible($('.dynamic-save-buttons')),'A catalog failure leaves the draft clean');
   await click('button[data-font-back]');
   await click('button[data-font-role="FONT_ACTIVITIES"]');
   online=true;
   await click('button[data-font-google]');
   const search=$('[data-font-search]');
   search.value='missing';
   search.dispatchEvent(new Event('input',{bubbles:true}));
   await pause();
   check(!visible($('[data-font-family]'))&&$('[data-font-status]').textContent==='No matching fonts','Empty search announces no matching families');
   search.value='roboto';
   search.dispatchEvent(new Event('input',{bubbles:true}));
   await click('button[data-font-family="roboto"]');
   check(visible($('[data-font-style]'))&&$('[data-font-style]').selectedOptions[0].textContent==='700 · Bold','The selected family exposes its available weight and style');
  }.toString()+')('+JSON.stringify(sample)+')');
  await screenshot('style');
  await evaluate('('+async function(){
   const {$,click,open,save,pause,visible,check}=testHelpers();
   window.holdTestDownload=true;
   await click('button[data-font-download]');
   await open('colours');
   const focus=document.activeElement;
   window.holdTestDownload=false;
   window.finishTestDownload();
   await pause();
   check(document.activeElement===focus&&!visible($('.dynamic-save-buttons')),'Leaving a pending font download preserves the current editor and clean draft');
   await open('fonts');
   check(!visible($('[data-font-picker]')),'Switching tabs exits the font picker');
   check(Number($('[data-font-role="FONT_ACTIVITIES"]').dataset.fontId)===0,'An abandoned download cannot change the role');
   await click('button[data-font-role="FONT_ACTIVITIES"]');
   await click('button[data-font-google]');
   await click('button[data-font-family="roboto"]');
   await click('button[data-font-download]');
   const role=$('[data-font-role="FONT_ACTIVITIES"]'),id=Number(role.dataset.fontId);
   check(id>3&&__fontAssets[id]&&visible($('[data-font-choice="'+id+'"][aria-pressed="true"]')),'A download marks the selection and keeps the role picker open');
   check(visible($('[data-font-family="roboto"]'))&&visible($('[data-font-style]')),'The catalog stays open to try another font');
   await save();
   check(__saved.settings.FONT_ACTIVITIES===id&&__saved.settings.FONT_WATCHFACE===0,'Download updates the selected role only');
  }.toString()+')()');
  return {offlineRetry:true,emptySearch:true,abandonedDownload:true,catalogDownload:true,target:'activities'};
 });
 await run('navigation-and-activities',{platform:'emery',settings:{READING_LAYOUT:2,SCREEN_SPLIT:true}},async({evaluate,screenshot})=>{
  const result=await evaluate('('+async function(){
   const {$,visible,pause,setting,open,choose,toggle,change,save,click,check}=testHelpers();
   const colourKeys=['BACKGROUND_COLOR','TEXT_COLOR','ACCENT_COLOR','LOWER_BACKGROUND_COLOR','LOWER_TEXT_COLOR'];
   await open('layout');check(!visible($('#dynamic-reading-page')),'Unused preview page hidden');
   $('#dynamic-preview-expand').click();await pause();check(visible($('#dynamic-preview-controls')),'Expanded preview');
   await toggle('SHAKE_READINGS');check(visible($('#dynamic-reading-page')),'Shake page available');
   $('#dynamic-reading-setup').open=true;check(document.querySelectorAll('.dynamic-reading').length===5,'Five setup slots');
   await choose('READING_LAYOUT',0);await open('colours');
   await toggle('SCREEN_SPLIT');check(!visible(setting('LOWER_BACKGROUND_COLOR')),'Solid hides day details');
   await testHelpers().palette('night');check(!visible(setting('NIGHT_LOWER_BACKGROUND_COLOR')),'Solid hides night details');
   check(colourKeys.every(key=>!visible(setting(key))),'Inactive day palette hidden');
   await testHelpers().appearance('quiet');
   await open('activities');await click('.dynamic-back');check(visible($('#dynamic-screen-colours')),'Back restores the previous editor tab');
   await open('activities');check(!visible($('.dynamic-preview-card')),'No irrelevant activity preview');
   check(!visible($('.dynamic-activity-handle'))&&!visible($('.dynamic-activity-move')),'Normal list is compact');
   const first=$('.dynamic-activity-row').getAttribute('data-provider');
   $('#dynamic-reorder').click();check(visible($('.dynamic-activity-handle')),'Reorder exposes handles');
   $('.dynamic-activity-row [data-action="down"]').click();await pause();
   check(document.querySelectorAll('.dynamic-activity-row')[1].getAttribute('data-provider')===first,'Move button changes priority');
   const handle=document.querySelectorAll('.dynamic-activity-row')[1].querySelector('[data-action="handle"]');handle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));await pause();
   check($('.dynamic-activity-row').getAttribute('data-provider')===first,'Keyboard restores priority');$('#dynamic-reorder').click();
   $('[data-provider="builtin:notifications"] input').click();await pause();
   check(visible($('#dynamic-notification-mode-select'))&&visible(setting('NOTIFICATION_VIBRATION')),'Notification controls together');
   await change('#dynamic-app-mode-select','selected');$('#dynamic-app-entry').value='bad,entry';$('#dynamic-app-entry').dispatchEvent(new Event('input',{bubbles:true}));
   await open('more');await save();check(visible($('#dynamic-screen-activities')),'Save reveals invalid category');check(document.activeElement.id==='dynamic-app-entry','Invalid app focused');check(__writes.length===0,'Invalid save sends nothing');
   $('#dynamic-app-entry').value='Signal';$('#dynamic-app-entry').dispatchEvent(new Event('input',{bubbles:true}));await save();
   check(__saved.settings.NOTIFICATION_APPS==='Signal','Draft app committed by global Save');check(__saved.settings.APPEARANCE_MODE===1,'Appearance saved');
   check(__saved.settings.READING_LAYOUT===0&&__saved.settings.SHAKE_READINGS===true,'Layout draft retained across all categories');
   await open('layout');check($('#dynamic-reading-setup').open,'Disclosure state retained');
   await choose('READING_LAYOUT',2);await open('colours');await testHelpers().appearance('night');
   $('.dynamic-discard').click();await pause();check($('#dynamic-appearance-choice-select').value==='quiet','Discard restores appearance adapter');
   await open('layout');check(setting('READING_LAYOUT').querySelector('select').value==='0','Discard restores another category');
   return {navigation:true,preview:true,conditionalControls:true,reorder:true,hiddenValidation:true,discard:true};
  }.toString()+')()');
  await screenshot('layout');await evaluate('testHelpers().open("activities")');await screenshot('activities');await evaluate('testHelpers().open("more")');await screenshot('more');return result;
 });
 await run('save-recovery',{platform:'gabbro'},async({evaluate,screenshot})=>{
  const result=await evaluate('('+async function(){
   const {$,visible,pause,setting,open,choose,change,save,check}=testHelpers();
   await open('layout');await choose('READING_LAYOUT',1);__saveMode='failure';await save();
   check(!$('.dynamic-primary-save').disabled&&!$('.dynamic-discard').disabled,'Failure remains retryable');check(setting('READING_LAYOUT').querySelector('select').value==='1','Failed draft retained');
   __saveMode='success';await save();check(__saved.settings.READING_LAYOUT===1,'Retry saves the draft');
   check(visible($('.dynamic-watch-delivery'))&&visible($('.dynamic-watch-delivery button')),'Watch delivery separate from phone save');
   $('.dynamic-watch-delivery button').click();await pause();check(__saved.save.applied,'Delivery retry');
   await choose('READING_LAYOUT',0);__saveMode='uncertain';await save();
   check($('.dynamic-discard').disabled&&visible($('.dynamic-reload-saved')),'Uncertain save cannot discard sent write');
   await open('colours');check(visible($('#dynamic-screen-colours')),'Can navigate with uncertain draft');
   __saveMode='success';await save();check(__saved.settings.READING_LAYOUT===0,'Uncertain retry retains cross-category draft');
   await open('layout');await choose('READING_LAYOUT',2);__saveMode='delayed';await save();
   check($('.dynamic-primary-save').disabled,'Pending save cannot submit twice');
   await open('colours');await testHelpers().appearance('night');$('#dynamic-appearance-choice-select').focus();window.scrollTo(0,120);const before={focus:document.activeElement.id,scroll:window.scrollY};__finishSave();await pause();check(document.activeElement.id===before.focus&&Math.abs(window.scrollY-before.scroll)<=1,'Async save preserves focus and scroll');
   check(!$('.dynamic-primary-save').disabled,'An older successful save cannot clear newer edits');
   check($('#dynamic-appearance-saved').textContent==='Always Day'&&$('#dynamic-appearance-pending').textContent.includes('Always Night'),'Rule summary distinguishes the saved snapshot from newer edits');
   __saveMode='success';await save();check(__saved.settings.MANUAL_APPEARANCE===1,'Newer edit is saved subsequently');
   check($('#dynamic-appearance-saved').textContent==='Always Night'&&!visible($('#dynamic-appearance-pending')),'Rule summary advances only after confirmation');
   return {failure:true,uncertain:true,pending:true,watchReceipt:true,newerDraft:true};
  }.toString()+')()');await screenshot('saved');return result;
 });
 await run('legacy-rgb',{platform:'emery',settings:{APPEARANCE_MODE:0,MANUAL_APPEARANCE:1,BACKGROUND_COLOR:0x123456,NIGHT_TEXT_COLOR:0xabcdef}},async({evaluate,screenshot})=>{
  const result=await evaluate('('+async function(){
   const {$,visible,open,choose,change,save,check}=testHelpers();
   await open('colours');const legacy=$('#dynamic-appearance-choice-select [value="legacy"]');check(legacy&&legacy.disabled&&legacy.selected,'Legacy mode retained and explained');
   await open('fonts');await choose('TEXT_SIZE',3);await save();
   check(__saved.settings.APPEARANCE_MODE===0&&__saved.settings.MANUAL_APPEARANCE===1,'Unrelated save preserves legacy fallback');
   check(__saved.settings.BACKGROUND_COLOR===0x123456&&__saved.settings.NIGHT_TEXT_COLOR===0xabcdef,'Untouched raw RGB values preserved');
   await open('colours');await testHelpers().palette('day');
   $('.dynamic-palette-details').open=true;const input=$('#dynamic-palette-input');input.value='unfinished import';input.dispatchEvent(new Event('input',{bubbles:true}));
   await open('more');await open('colours');check(input.value==='unfinished import','Unapplied import draft survives navigation');
   await testHelpers().appearance('day');await save();check(__saved.settings.APPEARANCE_MODE===2,'Explicit appearance choice replaces legacy mode');
   return {legacyPreserved:true,rawRgb:true,importDraft:true};
  }.toString()+')()');await screenshot('colours');return result;
 });
 await run('reload-saved',{platform:'emery'},async({evaluate,screenshot})=>{
  await evaluate('('+async function(){
   const {$,open,choose,save,palette,appearance,click,check,visible}=testHelpers();
   await open('colours');await palette('day');await click('[data-preset="dark"]');
   await palette('night');await click('[data-preset="light"]');await palette('day');
   check($('#dynamic-palette-input').value.startsWith('DYN1-000000-FFFFFF'),'Day edit survives a trip to Night and back');
   await appearance('quiet');await open('layout');await choose('READING_LAYOUT',1);await save();
   check(__saved.settings.BACKGROUND_COLOR===0&&__saved.settings.NIGHT_BACKGROUND_COLOR===0xffffff,'Both edited palettes are saved');
   await open('colours');
   check(!visible($('#dynamic-appearance-pending'))&&$('#dynamic-appearance-saved').textContent==='Follow Quiet Time','Saved summary confirms the selected rule');
   await open('layout');
   await choose('READING_LAYOUT',0);__saveMode='uncertain';await save();await open('more');
   window.scrollTo(0,220);setTimeout(()=>$('.dynamic-reload-saved').click(),0);
  }.toString()+')()');
  await wait(1300);
  const result=await evaluate('('+function(){const {$,visible,setting,check}=testHelpers();check(visible($('#dynamic-screen-more')),'Reload restores category');check(setting('READING_LAYOUT').querySelector('select').value==='1','Reload reads confirmed saved value');check($('.dynamic-primary-save').disabled,'Reload has no unsaved draft');return {confirmedSettings:true,category:true};}.toString()+')()');
  await screenshot('more');
  await evaluate('('+async function(){
   const {$,open,palette,check}=testHelpers();
   await open('colours');await palette('day');
   check($('#dynamic-palette-input').value.startsWith('DYN1-000000-FFFFFF'),'Reload keeps the saved Day colours');
   check($('#dynamic-appearance-saved').textContent==='Follow Quiet Time'&&$('#dynamic-screen-colours').innerText.includes('Day normally, Night during Quiet Time.'),'Reload explains the confirmed automatic rule');
  }.toString()+')()');return result;
 });
 for(const language of ['cs','de','fr','tr'])await run('narrow-'+language,{platform:language==='de'?null:'gabbro',width:320,language,dark:true},async({evaluate,screenshot,sessionId})=>{
  await evaluate('('+async function(){
   const {$,visible,pause,open,check}=testHelpers();
   check(document.documentElement.scrollWidth<=innerWidth,'Narrow Fonts landing overflow');
   for(const id of ['fonts','colours','layout','activities','more']){await open(id);check(document.documentElement.scrollWidth<=innerWidth,'Narrow '+id+' overflow');}
   await open('layout');$('#dynamic-preview-expand').click();await pause();
   check(document.documentElement.scrollWidth<=innerWidth,'Expanded narrow preview overflow');
   if($('#dynamic-preview-watch'))check(visible($('#dynamic-preview-watch')),'Unknown watch selector');
  }.toString()+')()');await screenshot('layout');
  await evaluate('('+async function(){
   const {$,open,check,palette,change}=testHelpers();await open('colours');
   await palette('night');await change('#dynamic-preview-scene','disconnected');
   for(const target of ['#dynamic-appearance-change','[data-edit-palette="day"]','[data-edit-palette="night"]']){
    const rect=$(target).getBoundingClientRect();check(rect.height>=44&&rect.width>=44,'Palette editor has reachable touch targets');
   }
   $('#dynamic-appearance-change').scrollIntoView({block:'start'});
  }.toString()+')()');await screenshot('colours');
  await evaluate('testHelpers().open("activities")');await screenshot('activities');
  await evaluate('('+async function(){
   const {check,pause,open,click}=testHelpers();const style=document.createElement('style');style.textContent='#main-form,#main-form input,#main-form select,#main-form button,#main-form label,#main-form .label,#main-form strong,#main-form small,#main-form p,#main-form summary,#main-form h3{font-size:32px!important}';document.head.appendChild(style);await pause();
   for(const id of ['fonts','colours','layout','activities','more']){await open(id);check(document.documentElement.scrollWidth<=innerWidth,'Large text '+id+' overflow');}
   await open('fonts');
   for(const tab of document.querySelectorAll('.dynamic-editor-tab')){
    const node=tab.firstChild;
    for(const match of node.textContent.matchAll(/\S+/g)){
     const word=document.createRange();word.setStart(node,match.index);word.setEnd(node,match.index+match[0].length);
     check(word.getClientRects().length===1,'Large text splits a word in the '+tab.textContent+' tab');
    }
   }
   await click('button[data-font-role="FONT_WATCHFACE"]');
   check(document.documentElement.scrollWidth<=innerWidth,'Large text font picker overflow');
  }.toString()+')()');await screenshot('large-text');
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:360,deviceScaleFactor:1,mobile:true},sessionId);await wait(200);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".component-submit")).position'), 'static','Short viewport keeps footer in flow');
  return {width:320,dark:true,language,editorTabs:3,secondaryScreens:2,largeText:true,shortViewport:true};
 });
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({result:'PASS',scope:'Actual generated configuration HTML in Chromium with a simulated Pebble bridge; no real phone or watch claim.',checks:reports},null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await send('Browser.close').catch(()=>{});browser.kill();fs.closeSync(log);});
