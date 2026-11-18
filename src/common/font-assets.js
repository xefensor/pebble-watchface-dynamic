'use strict';

var fields = ['FONT_WATCHFACE', 'FONT_CLOCK', 'FONT_DATE', 'FONT_READINGS', 'FONT_ACTIVITIES'];
var maxBytes = 65535;
var keyPrefix = 'dynamic-font-v1:';
var libraryKey = 'dynamic-font-library-v1';

function id(bytes) {
  var hash = 2166136261;
  for (var i = 0; i < bytes.length; ++i) hash = Math.imul(hash ^ bytes[i], 16777619);
  hash >>>= 0;
  return hash <= 3 ? hash + 4 : hash;
}

function allowed(value, field) {
  return Number.isInteger(value) && value >= 0 && value <= 0xffffffff &&
    (value !== 2 && value !== 3 || field === 'FONT_CLOCK');
}

function load(storage, fontId) {
  try {
    var raw = storage.getItem(keyPrefix + fontId);
    var asset = raw && JSON.parse(raw);
    return asset && asset.id === fontId && typeof asset.name === 'string' &&
      typeof asset.data === 'string' && asset.data.length <= Math.ceil(maxBytes / 3) * 4 ? asset : null;
  } catch (ignored) {
    return null;
  }
}

// PKJS and the plugin use different JS hosts. Decode without assuming a
// browser global or Node's Buffer exists in either one.
var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decode(input) {
  if (!input || input.length % 4 || input.length > Math.ceil(maxBytes / 3) * 4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(input)) return null;
  var length = input.length / 4 * 3 - (input.endsWith('==') ? 2 : input.endsWith('=') ? 1 : 0);
  if (length < 8 || length > maxBytes) return null;
  var bytes = new Uint8Array(length);
  for (var i = 0, at = 0; at < length; i += 4) {
    var a = alphabet.indexOf(input[i]), b = alphabet.indexOf(input[i + 1]);
    var c = alphabet.indexOf(input[i + 2]), d = alphabet.indexOf(input[i + 3]);
    bytes[at++] = a << 2 | b >> 4;
    if (at < length) bytes[at++] = b << 4 | c >> 2;
    if (at < length) bytes[at++] = c << 6 | d;
  }
  return bytes[0] === 68 && bytes[1] === 70 && bytes[2] === 1 ? bytes : null;
}

function library(storage) {
  try {
    var value = JSON.parse(storage.getItem(libraryKey) || '[]');
    return Array.isArray(value) ? value.filter(function(entry){
      return entry && Number.isInteger(entry.id) && entry.id > 3 && typeof entry.name === 'string';
    }) : [];
  } catch (ignored) { return []; }
}

function save(storage, asset) {
  if (!asset || typeof asset.name !== 'string' || !asset.name.trim() || asset.name.length > 80) return false;
  var bytes = decode(asset.data);
  if (!bytes || id(bytes) !== asset.id) return false;
  try {
    var previous = load(storage, asset.id);
    if (previous && previous.data !== asset.data) return false;
    if (!previous) {
      var raw = JSON.stringify({id:asset.id, name:asset.name, data:asset.data});
      storage.setItem(keyPrefix + asset.id, raw);
      if (storage.getItem(keyPrefix + asset.id) !== raw) return false;
    }
    var list = library(storage);
    if (list.some(function(entry){return entry.id === asset.id;})) return true;
    list.push({id:asset.id, name:previous ? previous.name : asset.name});
    var metadata = JSON.stringify(list);
    storage.setItem(libraryKey, metadata);
    return storage.getItem(libraryKey) === metadata;
  } catch (ignored) {
    return false;
  }
}

function selected(choices) {
  var result = [];
  choices.slice(1).forEach(function(override) {
    var value = override || choices[0];
    if (value > 3 && result.indexOf(value) === -1) result.push(value);
  });
  return result;
}

module.exports = {fields:fields, maxBytes:maxBytes, id:id, allowed:allowed,
  decode:decode, load:load, save:save, library:library, selected:selected};
