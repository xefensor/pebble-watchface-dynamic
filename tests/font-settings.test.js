'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const assets = require('../src/common/font-assets');
const compiler = require('../src/pkjs/font-compiler');
const state = require('../src/common/settings-state');
const display = require('../src/common/display-state');
const {catalogDetails} = require('../src/pkjs/settings-fonts');
const {create} = require('../src/pkjs/display-controller');

function storage() {
  const data = new Map();
  return {getItem:key => data.get(key) || null, setItem:(key,value) => data.set(key,value)};
}

async function importRoboto() {
  const fontkit = await import('fontkitten');
  const file = readFileSync(require.resolve('../resources/fonts/RobotoCondensed-Bold.ttf'));
  const pack = compiler.compile(fontkit.create(file));
  return {id:pack.id,name:pack.name,data:Buffer.from(pack.bytes).toString('base64')};
}

test('Google Fonts metadata exposes static faces and variable weights', () => {
  const parsed = catalogDetails(`name: "Example"
fonts {
  filename: "Example[wght].ttf"
  style: "normal"
  weight: 400
}
fonts {
  filename: "Example-Italic.otf"
  style: "italic"
  weight: 400
}
axes {
  tag: "wght"
  min_value: 300
  max_value: 700
}
`);
  assert.equal(parsed.name,'Example');
  assert.equal(parsed.variants.find(v => v.label === 'Bold').weight,700);
  assert.equal(parsed.variants.find(v => v.label === 'Regular Italic').file,'Example-Italic.otf');
  assert.equal(parsed.variants.some(v => v.weight === 900),false);
});

test('a phone import contains scalable outlines for Latin and accented text', async () => {
  const font = await importRoboto(), local = storage(), bytes = assets.decode(font.data);
  assert.ok(bytes.length <= assets.maxBytes);
  assert.equal(assets.id(bytes),font.id);
  const data = new DataView(bytes.buffer), entries = new Map();
  for (let i=0; i<data.getUint16(4,true); i++) {
    const at=8+i*16;
    entries.set(data.getUint16(at,true),data.getUint16(at+14,true));
  }
  for (const character of '12:34Čt. ěöß…') {
    assert.ok(entries.has(character.charCodeAt(0)),character);
    if (character!==' ') assert.ok(entries.get(character.charCodeAt(0))>0);
  }
  assert.equal(assets.save(local,font),true);
  assert.equal(assets.save(local,font),true);
  assert.deepEqual(assets.library(local),[{id:font.id,name:font.name}]);
  assert.equal(assets.save(local,{...font,id:font.id^1}),false);
});

test('a shared font is staged once and only a verified settings receipt confirms it', async () => {
  const font=await importRoboto(), local=storage(), sent=[];
  assets.save(local,font);
  const chosen={...state.read(local),FONT_WATCHFACE:font.id,FONT_READINGS:font.id,FONT_CLOCK:2};
  assert.ok(state.save(local,chosen).ok);
  const controller=create({storage:local,send:(payload,ok)=>{sent.push(payload);ok();},later:()=>0,cancel:()=>{}});
  controller.reconcile(false);
  const length=assets.decode(font.data).length;
  let chunks=0, begins=0;
  while(sent.at(-1).FONT_DATA){
    const request=sent.at(-1).FONT_DATA, reply=request.slice(0,16);
    const begin=request[1]===1;
    if(begin)begins++;else chunks++;
    display.put(reply,12,begin?0:display.get(request,12)+request.length-16);
    controller.receiveFont(reply);
  }
  assert.equal(begins,1);
  assert.equal(chunks,Math.ceil(length/1024));
  assert.equal(controller.status().delivery.applied,false);
  const receipt=sent.at(-1).DISPLAY_PREFERENCES;
  assert.equal(receipt.length,112);
  assert.deepEqual(display.decode(receipt).values.slice(21),[font.id,2,0,font.id,0]);
  assert.equal(controller.receive(receipt),true);
  assert.equal(controller.status().delivery.applied,true);

  const reset={...chosen,FONT_WATCHFACE:0,FONT_CLOCK:0,FONT_READINGS:0};
  assert.ok(state.save(local,reset).ok);
  const restarted=create({storage:local,send:(payload,ok)=>{sent.push(payload);ok();},later:()=>0,cancel:()=>{}});
  restarted.reconcile(false);
  assert.equal(sent.at(-1).DISPLAY_PREFERENCES.length,112);
  assert.equal(restarted.receive(receipt),false);
  assert.equal(restarted.receive(sent.at(-1).DISPLAY_PREFERENCES),true);
});

test('font transfer failures preserve the requested selection and do not send a display commit', async () => {
  const font=await importRoboto(), local=storage(), sent=[];
  assets.save(local,font);
  assert.equal(state.save(local,{...state.read(local),FONT_DATE:font.id}).ok,true);
  const controller=create({storage:local,send:payload=>sent.push(payload),later:()=>0,cancel:()=>{}});
  controller.reconcile(false);
  const reply=sent[0].FONT_DATA.slice();
  reply[2]=2;
  controller.receiveFont(reply);
  assert.equal(sent.length,1);
  assert.equal(state.read(local).FONT_DATE,font.id);
  assert.equal(controller.status().delivery.error,'watch_font_space');
});

test('a whole-watchface font is sent only when a role inherits it', () => {
  const local=storage(), sent=[];
  const chosen={...state.read(local),FONT_WATCHFACE:42,FONT_CLOCK:2,FONT_DATE:1,FONT_READINGS:1,FONT_ACTIVITIES:1};
  assert.ok(state.save(local,chosen).ok);
  const controller=create({storage:local,send:(payload,ok)=>{sent.push(payload);ok();},later:()=>0,cancel:()=>{}});
  controller.reconcile(false);
  const receipt=sent[0].DISPLAY_PREFERENCES;
  assert.ok(receipt);
  assert.deepEqual(display.decode(receipt).values.slice(21),[42,2,1,1,1]);
  assert.equal(controller.receive(receipt),true);
  assert.ok(state.save(local,{...chosen,FONT_DATE:0}).ok);
  controller.reconcile(false);
  assert.equal(sent.length,1);
  assert.equal(controller.status().delivery.error,'watch_font_missing');
});
