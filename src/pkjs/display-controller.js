'use strict';
var state=require('../common/display-state');
var assets=require('../common/font-assets');
var createFontDelivery=require('./font-delivery').create;
function create(options){
  var storage=options.storage,send=options.send,later=options.later||setTimeout,cancel=options.cancel||clearTimeout;
  // The bundled watch binary understands v3. An older native hello can still
  // negotiate its original display format.
  var typography=null,installed=[];
  var fonts=createFontDelivery(storage,send,later,cancel);
  var generation=0,timer=null,attempts=0,activeRevision=null,mismatch=false,revisionPending=false,invalidated=null;
  function stop(){if(timer!==null)cancel(timer);timer=null;fonts.stop();}
  function status(){var result=state.status(storage);if(result.ok&&(mismatch||revisionPending)){result.delivery.applied=false;result.delivery.pending=true;result.delivery.state='pending';}return result;}
  function retry(g){if(g!==generation||attempts>=3)return;stop();timer=later(function(){timer=null;deliver(g);},500*attempts);}
  function deliver(g){
    if(g!==generation||attempts>=3||!send||revisionPending)return;
    var value;try{value=state.read(storage);}catch(ignored){return;}
    if(!value||!value.stored||!mismatch&&state.matches(value.record.applied,value.record))return;
    ++attempts;
    if(value.record.values.length===26&&typography===false)return;
    var useTypography=typography===true||value.record.values.length===26||value.record.fontChanges===true;
    var ids=assets.selected(value.record.values.slice(state.fields.length)).filter(function(id){return installed.indexOf(id)<0;});
    fonts.stage(value.record.revision,ids,function(error){
      if(g!==generation)return;
      if(error){
        value.record.error=error;
        value.record.applied=null;
        state.commit(storage,value.record);
        return;
      }
      send({DISPLAY_PREFERENCES:state.encode(value.record.values,value.record.revision,0,false,useTypography)},
        function(){retry(g);},function(){retry(g);});
    });
  }
  function reconcile(force){
    if(force){mismatch=true;revisionPending=true;++generation;stop();activeRevision=null;}
    var value;try{
      var old=JSON.parse(storage.getItem(state.key)||'null');
      if(old&&old.version!==2&&(old.state==='pending'||old.state==='failed')&&old.payload){
        var selected={};state.fields.concat(['NIGHT_PALETTE','USE_12_HOUR']).forEach(function(key){var n=options.keys&&options.keys[key];var input=old.payload[key]!==undefined?old.payload[key]:old.payload[n===undefined?require('../common/settings-state').names.indexOf(key):n];if(input!==undefined)selected[key]=input;});
        var migrated=require('../common/settings-state').patch(storage,selected);if(!migrated.ok)return false;
        if(options.changed)options.changed();
      }
      if(!state.hasNative(storage))return false;value=state.read(storage);
    }catch(ignored){return false;}
    if(!value)return false;
    if(force||revisionPending||value.record.revision===invalidated){
      mismatch=true;invalidated=value.record.revision;value.record.revision=state.next(value.record.revision);value.record.applied=null;value.record.error=null;
      if(!state.commit(storage,value.record)){revisionPending=true;return false;}revisionPending=false;
    }else if(!value.stored&&!state.commit(storage,value.record))return false;
    // Source traffic and duplicate ready probes must not renew the retry budget.
    if(activeRevision===value.record.revision)return true;
    ++generation;stop();attempts=0;activeRevision=value.record.revision;deliver(generation);return true;
  }
  function receive(input){
    var received=state.decode(input);if(!received)return false;
    if(received.hello){
      typography=!!received.typography;
      installed=assets.selected(received.values.slice(state.fields.length));
    }
    try{
      if(received.hello&&!received.status&&!state.hasNative(storage)){
        if(!state.adopt(storage,received.values))return false;
        if(options.changed)options.changed();
      }
      var value=state.read(storage);if(!value)return false;
      if(!revisionPending&&value.stored&&value.record.revision!==invalidated&&received.revision===value.record.revision&&state.equal(received.values,value.record.values)&&
          (!typography&&!value.record.fontChanges||received.typography)){
        if(!received.status){
          installed=assets.selected(received.values.slice(state.fields.length));
          value.record.applied=state.encode(received.values,received.revision,0,false,received.typography);value.record.error=null;
          if(!state.commit(storage,value.record)){mismatch=true;return false;}
          mismatch=false;invalidated=null;stop();return true;
        }
        mismatch=true;value.record.applied=null;value.record.error='watch_save_unconfirmed';state.commit(storage,value.record);return false;
      }
      if(received.hello){mismatch=true;revisionPending=true;invalidated=value.record.revision;++generation;stop();activeRevision=null;reconcile(false);}
    }catch(ignored){}
    return false;
  }
  return {reconcile:reconcile,receive:receive,status:status,receiveFont:fonts.receive};
}
module.exports={create:create};
