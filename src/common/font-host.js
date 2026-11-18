'use strict';

var assets = require('./font-assets');
var MAX_INPUT = 4 * 1024 * 1024;
var FILE_CHUNK = 32768;

function handle(storage, message, respond, files) {
  if (message.type === 'font_store') {
    respond({ok:assets.save(storage, message.asset)});
    return true;
  }
  if (message.type === 'font_get') {
    var asset = assets.load(storage, message.id);
    respond({ok:!!asset,asset:asset});
    return true;
  }
  if (message.type === 'font_file') {
    var offset = message.offset;
    if (!files || typeof message.id !== 'string' || !Number.isInteger(offset) ||
        offset < 0 || offset >= MAX_INPUT || offset % FILE_CHUNK) {
      respond({ok:false});
      return true;
    }
    Promise.resolve().then(function(){return files.getHandle(message.id);})
      .then(function(handle){return handle.getFile();})
      .then(function(file) {
        if (file.size < 12 || file.size > MAX_INPUT || offset >= file.size ||
            !/\.(ttf|otf)$/i.test(file.name)) return {ok:false};
        var end = Math.min(offset + FILE_CHUNK, file.size);
        return file.slice(offset,end).arrayBuffer().then(function(buffer){
          return {ok:true, size:file.size, offset:offset, bytes:Array.from(new Uint8Array(buffer))};
        });
      }).then(respond,function(){respond({ok:false});});
    return true;
  }
  return false;
}

module.exports = {handle:handle};
