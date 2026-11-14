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
 window.__errors=[];window.addEventListener('error',e=>__errors.push(e.message));window.addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));
 window.__saved=JSON.parse(sessionStorage.getItem('__testSavedPacket')||JSON.stringify(initial));window.__saveMode='success';window.__writes=[];window.__target='plugin';
 window.Pebble={targets:()=>Promise.resolve([{id:__target}]),addEventListener:(name,callback)=>{if(name==='ready')document.addEventListener('DOMContentLoaded',()=>callback({target:'plugin'}));},sendMessage:async(target,m)=>{
  if(m.type==='load_settings')return __saved;
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
function helpers(){
 const $=selector=>document.querySelector(selector),visible=element=>!!element&&element.getClientRects().length>0;
 const pause=()=>new Promise(resolve=>setTimeout(resolve,150));
 const setting=key=>$('[data-setting="'+key+'"]');
 const change=async(selector,value)=>{const element=typeof selector==='string'?$(selector):selector;if(!element)throw Error('Missing '+selector);element.value=String(value);element.dispatchEvent(new Event('change',{bubbles:true}));await pause();};
 const choose=async(key,value)=>change(setting(key).querySelector('select'),value);
 const toggle=async key=>{const input=setting(key).querySelector('input');input.click();await pause();};
 const open=async id=>{if(!visible($('.dynamic-category[data-screen="'+id+'"]'))){$('#dynamic-back').click();await pause();}$('.dynamic-category[data-screen="'+id+'"]').click();await pause();if(!visible($('#dynamic-screen-'+id)))throw Error('Category did not open '+id);};
 const check=(value,message)=>{if(!value)throw Error(message);};
 const save=async()=>{check(!$('.dynamic-primary-save').disabled,'Save unavailable');$('.dynamic-primary-save').click();await new Promise(resolve=>setTimeout(resolve,350));};
 return {$,visible,pause,setting,change,choose,toggle,open,check,save};
}
const reports=[];
async function run(name,options,check){
 global.Pebble={getActiveWatchInfo:()=>options.platform?({platform:options.platform}):null};
 const state=require('../src/common/settings-state');
 const settings=Object.assign(state.read({getItem:()=>null}),{READING_LAYOUT:2,SCREEN_SPLIT:true},options.settings);
 const metadata={slots:[{label:'Temperature',value:'5°C',status:'ready'},{label:'Rain',value:'100%',status:'ready'},{label:'Phone',value:'78%',status:'ready'},{label:'Humidity',value:'68%',status:'ready'}],sources:{music:{state:'playing'},activities:{state:'ready'}},activityProviders:[{uuid:'50e9ef12-a5ab-4369-a3b5-3447bfba5151',name:'Timer',available:true}],save:{state:'saved',applied:true,pending:false}};
 const packet=require('../src/common/settings-config')(settings,options.language||'en',metadata,24);
 const html=fs.readFileSync(path.join(root,'config.html'),'utf8');
 const injection='<script>('+sdk.toString()+')('+JSON.stringify(packet).replace(/</g,'\\u003c')+');window.testHelpers='+helpers.toString()+';</script>';
 const file=path.join(out,name+'.html');fs.writeFileSync(file,html.replace('<script>',()=>injection+'<script>'));
 const {targetId}=await send('Target.createTarget',{url:'file://'+file});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 await send('Emulation.setDeviceMetricsOverride',{width:options.width||390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:options.dark?'dark':'light'}]},sessionId);
 const evaluate=expression=>send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId).then(r=>{if(r.exceptionDetails)throw Error(name+': '+JSON.stringify(r.exceptionDetails));return r.result.value;});
 const screenshot=async label=>{await wait(150);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(out,name+'-'+label+'.png'),Buffer.from(shot.data,'base64'));};
 try{
  for(let attempt=0;attempt<35;attempt++){if(await evaluate('!!document.querySelector(".dynamic-category")'))break;await wait(100);}
  await wait(350);assert.deepEqual(await evaluate('__errors'),[],name+' startup errors');
  await screenshot('overview');
  const result=await check({evaluate,screenshot,sessionId});
  assert.deepEqual(await evaluate('__errors'),[],name+' browser errors');
  assert.equal(await evaluate('document.documentElement.scrollWidth>window.innerWidth'),false,name+' horizontal overflow');
  reports.push({name,...result});console.log(name,JSON.stringify(result));
 }finally{await send('Target.closeTarget',{targetId});}
}
(async()=>{
 for(const platform of ['emery','gabbro'])await run(platform,{platform},async({evaluate,screenshot})=>{
  const result=await evaluate('('+async function(){
   const {$,visible,setting,open,change,choose,toggle,save,check}=testHelpers();
   check(document.querySelectorAll('.dynamic-category').length===4,'Four categories');check(!visible($('.section')),'Overview must hide categories');
   await open('layout');await choose('READING_LAYOUT',1);
   await open('colours');check(visible(setting('BACKGROUND_COLOR'))&&!visible(setting('NIGHT_BACKGROUND_COLOR')),'Only day palette');
   await change('#dynamic-edit-palette-select','night');check(!visible(setting('BACKGROUND_COLOR'))&&visible(setting('NIGHT_BACKGROUND_COLOR')),'Only night palette');
   $('[data-preset="light"]').click();await new Promise(resolve=>setTimeout(resolve,100));
   await save();check(__saved.settings.READING_LAYOUT===1,'Cross-category layout saved');check(__saved.settings.NIGHT_BACKGROUND_COLOR===0xffffff,'Night preset saved');check(__saved.settings.MANUAL_APPEARANCE===0&&__saved.settings.APPEARANCE_MODE===2,'Editing palette must not switch appearance');
   return {categories:4,save:true,paletteIsolation:true};
  }.toString()+')()');
  await screenshot('colours');return result;
 });
 await run('navigation-and-activities',{platform:'emery'},async({evaluate,screenshot})=>{
  const result=await evaluate('('+async function(){
   const {$,visible,pause,setting,open,choose,toggle,change,save,check}=testHelpers();
   const colourKeys=['BACKGROUND_COLOR','TEXT_COLOR','ACCENT_COLOR','LOWER_BACKGROUND_COLOR','LOWER_TEXT_COLOR'];
   await open('layout');check(!visible($('#dynamic-reading-page')),'Unused preview page hidden');
   $('#dynamic-preview-expand').click();await pause();check(visible($('#dynamic-preview-controls')),'Expanded preview');
   await toggle('SHAKE_READINGS');check(visible($('#dynamic-reading-page')),'Shake page available');
   $('#dynamic-reading-setup').open=true;check(document.querySelectorAll('.dynamic-reading').length===5,'Five setup slots');
   await choose('READING_LAYOUT',0);await open('colours');
   await toggle('SCREEN_SPLIT');check(!visible(setting('LOWER_BACKGROUND_COLOR')),'Solid hides day details');
   await change('#dynamic-edit-palette-select','night');check(!visible(setting('NIGHT_LOWER_BACKGROUND_COLOR')),'Solid hides night details');
   check(colourKeys.every(key=>!visible(setting(key))),'Inactive day palette hidden');
   await change('#dynamic-appearance-choice-select','quiet');
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
   await choose('READING_LAYOUT',2);await open('colours');await change('#dynamic-appearance-choice-select','night');
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
   await open('colours');await change('#dynamic-appearance-choice-select','night');$('#dynamic-appearance-choice-select').focus();window.scrollTo(0,120);const before={focus:document.activeElement.id,scroll:window.scrollY};__finishSave();await pause();check(document.activeElement.id===before.focus&&Math.abs(window.scrollY-before.scroll)<=1,'Async save preserves focus and scroll');
   check(!$('.dynamic-primary-save').disabled,'An older successful save cannot clear newer edits');
   __saveMode='success';await save();check(__saved.settings.MANUAL_APPEARANCE===1,'Newer edit is saved subsequently');
   return {failure:true,uncertain:true,pending:true,watchReceipt:true,newerDraft:true};
  }.toString()+')()');await screenshot('saved');return result;
 });
 await run('legacy-rgb',{platform:'emery',settings:{APPEARANCE_MODE:0,MANUAL_APPEARANCE:1,BACKGROUND_COLOR:0x123456,NIGHT_TEXT_COLOR:0xabcdef}},async({evaluate,screenshot})=>{
  const result=await evaluate('('+async function(){
   const {$,visible,open,choose,change,save,check}=testHelpers();
   await open('colours');const legacy=$('#dynamic-appearance-choice-select [value="legacy"]');check(legacy&&legacy.disabled&&legacy.selected,'Legacy mode retained and explained');
   await open('more');await choose('TEXT_SIZE',3);await save();
   check(__saved.settings.APPEARANCE_MODE===0&&__saved.settings.MANUAL_APPEARANCE===1,'Unrelated save preserves legacy fallback');
   check(__saved.settings.BACKGROUND_COLOR===0x123456&&__saved.settings.NIGHT_TEXT_COLOR===0xabcdef,'Untouched raw RGB values preserved');
   await open('colours');await change('#dynamic-edit-palette-select','day');
   $('.dynamic-palette-details').open=true;const input=$('#dynamic-palette-input');input.value='unfinished import';input.dispatchEvent(new Event('input',{bubbles:true}));
   await open('more');await open('colours');check(input.value==='unfinished import','Unapplied import draft survives navigation');
   await change('#dynamic-appearance-choice-select','day');await save();check(__saved.settings.APPEARANCE_MODE===2,'Explicit appearance choice replaces legacy mode');
   return {legacyPreserved:true,rawRgb:true,importDraft:true};
  }.toString()+')()');await screenshot('colours');return result;
 });
 await run('reload-saved',{platform:'emery'},async({evaluate,screenshot})=>{
  await evaluate('('+async function(){
   const {$,open,choose,save}=testHelpers();await open('layout');await choose('READING_LAYOUT',1);await save();
   await choose('READING_LAYOUT',0);__saveMode='uncertain';await save();await open('more');
   window.scrollTo(0,220);setTimeout(()=>$('.dynamic-reload-saved').click(),0);
  }.toString()+')()');
  await wait(1300);
  const result=await evaluate('('+function(){const {$,visible,setting,check}=testHelpers();check(visible($('#dynamic-screen-more')),'Reload restores category');check(setting('READING_LAYOUT').querySelector('select').value==='1','Reload reads confirmed saved value');check($('.dynamic-primary-save').disabled,'Reload has no unsaved draft');return {confirmedSettings:true,category:true};}.toString()+')()');
  await screenshot('more');return result;
 });
 for(const language of ['cs','de','fr','tr'])await run('narrow-'+language,{platform:language==='de'?null:'gabbro',width:320,language,dark:true},async({evaluate,screenshot,sessionId})=>{
  await evaluate('('+async function(){
   const {$,visible,pause,open,check}=testHelpers();
   check(document.documentElement.scrollWidth<=innerWidth,'Narrow overview overflow');
   for(const id of ['layout','colours','activities','more']){await open(id);check(document.documentElement.scrollWidth<=innerWidth,'Narrow '+id+' overflow');}
   await open('layout');$('#dynamic-preview-expand').click();await pause();
   check(document.documentElement.scrollWidth<=innerWidth,'Expanded narrow preview overflow');
   if($('#dynamic-preview-watch'))check(visible($('#dynamic-preview-watch')),'Unknown watch selector');
  }.toString()+')()');await screenshot('layout');
  await evaluate('testHelpers().open("colours")');await screenshot('colours');
  await evaluate('testHelpers().open("activities")');await screenshot('activities');
  await evaluate('('+async function(){
   const {check,pause,open}=testHelpers();const style=document.createElement('style');style.textContent='#main-form,#main-form input,#main-form select,#main-form button,#main-form label,#main-form .label,#main-form strong,#main-form small,#main-form p,#main-form summary,#main-form h3{font-size:32px!important}';document.head.appendChild(style);await pause();
   for(const id of ['layout','colours','activities','more']){await open(id);check(document.documentElement.scrollWidth<=innerWidth,'Large text '+id+' overflow');}
  }.toString()+')()');await screenshot('large-text');
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:360,deviceScaleFactor:1,mobile:true},sessionId);await wait(200);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".component-submit")).position'), 'static','Short viewport keeps footer in flow');
  return {width:320,dark:true,language,categories:4,largeText:true,shortViewport:true};
 });
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({result:'PASS',scope:'Actual generated configuration HTML in Chromium with a simulated Pebble bridge; no real phone or watch claim.',checks:reports},null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await send('Browser.close').catch(()=>{});browser.kill();fs.closeSync(log);});
