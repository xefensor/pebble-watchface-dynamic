'use strict';

var assets = require('../common/font-assets');
var frame = require('../common/display-state');
var CHUNK = 1024;
var BEGIN = 1;
var DATA = 2;

function create(storage, send, later, cancel) {
  var transfer = null, timer = null;
  function stop() {
    if (timer !== null) cancel(timer);
    timer = null;
    transfer = null;
  }
  function complete(error) {
    var callback = transfer.complete;
    stop();
    callback(error);
  }
  function beginNext() {
    var id = transfer.ids.shift();
    if (id === undefined) { complete(); return; }
    var asset = assets.load(storage, id);
    var bytes = asset && assets.decode(asset.data);
    if (!bytes || assets.id(bytes) !== id) { complete('watch_font_missing'); return; }
    transfer.id = id;
    transfer.bytes = bytes;
    request(BEGIN, bytes.length);
  }
  function request(op, position) {
    if (timer !== null) cancel(timer);
    var current = transfer;
    current.op = op;
    current.position = position;
    current.attempt = 0;
    var packet = [1, op, 0, 0];
    frame.put(packet, 4, current.revision);
    frame.put(packet, 8, current.id);
    frame.put(packet, 12, position);
    if (op === DATA) {
      var end = Math.min(position + CHUNK, current.bytes.length);
      for (var i = position; i < end; ++i) packet.push(current.bytes[i]);
    }
    function deliver() {
      if (transfer !== current || current.position !== position || current.op !== op) return;
      if (++current.attempt > 3) { complete('watch_font_transfer'); return; }
      timer = later(deliver, 18000);
      send({FONT_DATA:packet}, function() {}, function() {
        if (transfer !== current || current.position !== position || current.op !== op) return;
        cancel(timer);
        timer = later(deliver, 500);
      });
    }
    deliver();
  }
  function receive(reply) {
    if (!transfer || !reply || reply.length !== 16 || reply[0] !== 1 || reply[3] ||
        reply[1] !== transfer.op || frame.get(reply, 4) !== transfer.revision ||
        frame.get(reply, 8) !== transfer.id) return;
    if (reply[2]) {
      complete(reply[2] === 2 ? 'watch_font_space' : 'watch_font_transfer');
      return;
    }
    var next = frame.get(reply, 12), total = transfer.bytes.length;
    if (next > total || next !== total && next % 256 ||
        transfer.op === DATA && next <= transfer.position) return;
    if (next === total) beginNext();
    else request(DATA, next);
  }
  function stage(revision, ids, callback) {
    stop();
    if (!ids.length) { callback(); return; }
    transfer = {revision:revision, ids:ids.slice(), complete:callback};
    beginNext();
  }
  return {stage:stage, stop:stop, receive:receive};
}
module.exports = {create:create};
