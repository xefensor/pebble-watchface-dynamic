'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),pkg=require(root+'/package.json');
const keys=Object.fromEntries(pkg.pebble.messageKeys.map((name,index)=>[name,index]));
// Clean npm installs retain Clay in its SDK archive. Read that locked bundle
// directly, just as the settings serializer tests do, without changing it.
const installed=path.join(root,'node_modules/@rebble/clay/dist.zip');
const source=require('node:child_process').execFileSync('python3',['-c',
  'import sys, zipfile; sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("js/index.js"))',
  installed],{encoding:'utf8'});
const box={module:{exports:{}},exports:{},require:name=>{if(name==='message_keys')return keys;throw Error(name);},Pebble:{platform:'config',addEventListener:()=>{}},localStorage:{getItem:()=>null},console};
vm.runInNewContext(source,box,{filename:'clay.js'});
const state=require('../src/common/settings-state');
const page=require('../src/common/settings-config')(state.read({getItem:()=>null}),'en');
const settingsStyle=require('pebble-xoce-ui/settings-style');
const preview=require('../src/pkjs/settings-preview');
page.config.forEach(item=>{if(item.id==='dynamic-preview-assets')item.defaultValue=JSON.stringify(preview);});
const clay=new box.module.exports(page.config,require('../src/pkjs/settings-page'),{autoHandleEvents:false,userData:{settingsStyle}});
// No Pebble ready event is emitted by this offline generator.
clay.meta.userData.settingsStyle=settingsStyle;
let html=decodeURIComponent(clay.generateUrl().split(',').slice(1).join(','));
const start=html.lastIndexOf('<script>'),end=html.indexOf('</script>',start);
if(start<0||end<start)throw Error('Clay bootstrap script missing');
const client=html.slice(start+8,end).replace(/\/\/# sourceMappingURL=[^\r\n]+/g,'');
const bootstrap="window.__dynamicStartClay=function(page){var assets;window.clayConfig.forEach(function(item){if(item.id==='dynamic-preview-assets')assets=item.defaultValue;});window.clayConfig=page.config;window.clayConfig.forEach(function(item){if(item.id==='dynamic-preview-assets'){var parsed=JSON.parse(assets);parsed.systemFormat=page.systemFormat;item.defaultValue=JSON.stringify(parsed);}});window.claySettings=page.values;"+client+'};';
const localization=require('../src/pkjs/localization'),words={};
localization.languages.forEach(language=>{words[language]=localization.settingsStrings(language);});
const bridge='('+require('../src/pkjs/settings-bridge').toString()+')('+JSON.stringify(words)+','+JSON.stringify(state.defaults)+','+JSON.stringify(state.preferencesKey)+');';
html=html.slice(0,start)+'<script>'+bootstrap+'\n'+bridge+'</script>'+html.slice(end+9);
html=html.replace('<form id="main-form"','<section id="dynamic-bootstrap"><h1>Dynamic</h1><p id="dynamic-bootstrap-status" role="status">Loading settings…</p><button type="button" id="dynamic-bootstrap-retry" hidden>Retry</button></section><form id="main-form"');
// The inactive form contains no editable defaults; only a successful read starts Clay.
html=html.replace('</head>','<meta name="color-scheme" content="light dark"><style id="xoce-settings-style">'+settingsStyle+'</style><style>#dynamic-bootstrap{max-width:512px;margin:0 auto;padding:24px 16px}#dynamic-bootstrap h1{margin-bottom:12px}#dynamic-bootstrap button{min-height:48px;background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}</style></head>');
const target=path.join(root,'config.html');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==html)throw Error('config.html is stale');console.log('Bundled stay-open Clay configuration: PASS');}
else fs.writeFileSync(target,html);
