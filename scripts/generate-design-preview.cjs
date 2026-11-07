'use strict';
// Review-only copy of the real offline Clay page. This bridge has no SDK or
// device connection; it only confirms a sample snapshot held in page memory.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),version=require(root+'/package.json').version;
const state=require(root+'/src/common/settings-state');
const page=require(root+'/src/common/settings-config');
const localization=require(root+'/src/pkjs/localization');
const pages={};
localization.languages.forEach(language=>{
  pages[language]=page(state.read({getItem:()=>null}),language,{
    slots:[{slot:1,label:'Temperature',value:'19°C',status:'ready'},{slot:2,label:'Rain',value:'25%',status:'ready'}],
    sources:{music:{state:'ready'},notifications:{state:'off'},phone:{state:'ready'},activities:{state:'ready'}},
    activityProviders:[{uuid:'50e9ef12-a5ab-4369-a3b5-3447bfba5151',name:'Timer',available:true}],save:{state:'none'}
  },24);
});
function reviewBridge(pages){
  var language=new URLSearchParams(location.search).get('lang')||'en';
  var sample=pages[language]||pages.en;
  window.Pebble={
    targets:function(){return Promise.resolve([{id:'plugin'}]);},
    addEventListener:function(name,callback){if(name==='ready')document.addEventListener('DOMContentLoaded',callback);},
    sendMessage:function(target,message){
      if(message.type==='load_settings')return Promise.resolve(sample);
      if(message.type==='save_settings'){
        sample.settings=JSON.parse(JSON.stringify(message.settings));
        return Promise.resolve({ok:true,settings:sample.settings});
      }
      return Promise.reject(Error('Review fixture has no SDK connection'));
    }
  };
}
const injection='<script>('+reviewBridge.toString()+')('+JSON.stringify(pages).replace(/<\/script/gi,'<\\/script')+');</script>';
let html=fs.readFileSync(root+'/config.html','utf8').replace('<script>',()=>injection+'<script>');
html=html.replace('<body>','<body><aside role="note" style="margin:0 0 24px;padding:12px 16px;border:1px solid currentColor;border-radius:8px;font:14px/1.5 system-ui,sans-serif">Design preview · sample data · saves stay in this page only.</aside>');
const output=path.join(process.env.PEBBLE_QA_OUTPUT_ROOT||path.join(root,'build/qa'),'phone-preview.html');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
console.log(output);
