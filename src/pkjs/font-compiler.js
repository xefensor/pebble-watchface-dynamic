'use strict';

const assets = require('../common/font-assets');
const UNITS = 1024;
const TOLERANCE = 5;
const MAX_POINTS = 256;
const MAX_CONTOURS = 16;
const HEADER = 8;
const ENTRY = 16;

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function flat(point, from, to) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length <= TOLERANCE) return Math.hypot(point[0] - from[0], point[1] - from[1]) <= TOLERANCE;
  return Math.abs(dx * (from[1] - point[1]) - dy * (from[0] - point[0])) <= TOLERANCE * length;
}

function outline(commands, scale) {
  const contours = [];
  let points = [], last, total = 0;
  function append(point) {
    const next = point.map(Math.round);
    if (next.some(coordinate => !Number.isFinite(coordinate) || Math.abs(coordinate) > 4 * UNITS)) {
      throw new Error('Unsupported font bounds');
    }
    const previous = points[points.length - 1];
    if (!previous || previous[0] !== next[0] || previous[1] !== next[1]) points.push(next);
    if (total + points.length > MAX_POINTS || points.length > 255) throw new Error('Complex glyph');
    last = point;
  }
  function close() {
    if (points.length) {
      const a = points[0], b = points[points.length - 1];
      if (a[0] === b[0] && a[1] === b[1]) points.pop();
      if (points.length >= 3) {
        contours.push(points);
        total += points.length;
      }
    }
    if (contours.length > MAX_CONTOURS) throw new Error('Complex glyph');
    points = [];
  }
  function quadratic(a, b, c, depth) {
    if (depth >= 10 || flat(b, a, c)) { append(c); return; }
    const ab = midpoint(a, b), bc = midpoint(b, c), center = midpoint(ab, bc);
    quadratic(a, ab, center, depth + 1);
    quadratic(center, bc, c, depth + 1);
  }
  function cubic(a, b, c, d, depth) {
    if (depth >= 10 || flat(b, a, d) && flat(c, a, d)) { append(d); return; }
    const ab = midpoint(a, b), bc = midpoint(b, c), cd = midpoint(c, d);
    const left = midpoint(ab, bc), right = midpoint(bc, cd), center = midpoint(left, right);
    cubic(a, ab, left, center, depth + 1);
    cubic(center, right, cd, d, depth + 1);
  }
  for (const command of commands) {
    const args = command.args;
    const point = i => [args[i] * scale, args[i + 1] * scale];
    switch (command.command) {
      case 'moveTo': close(); append(point(0)); break;
      case 'lineTo': append(point(0)); break;
      case 'quadraticCurveTo': quadratic(last, point(0), point(2), 0); break;
      case 'bezierCurveTo': cubic(last, point(0), point(2), point(4), 0); break;
      case 'closePath': close(); break;
      default: throw new Error('Unknown font outline');
    }
  }
  close();
  return contours;
}

function encode(code, glyph, scale) {
  const advance = Math.round(glyph.advanceWidth * scale);
  if (!Number.isFinite(advance) || advance < 0 || advance > 4 * UNITS) return null;
  const contours = outline(glyph.path.commands, scale);
  if (!contours.length && code !== 32 && code !== 160) return null;
  const bounds = [Infinity, -Infinity, Infinity, -Infinity];
  let length = 0;
  for (const points of contours) {
    length += 1 + points.length * 4;
    for (const [x, y] of points) {
      bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.max(bounds[1], x);
      bounds[2] = Math.min(bounds[2], y); bounds[3] = Math.max(bounds[3], y);
    }
  }
  const path = new Uint8Array(length), view = new DataView(path.buffer);
  let at = 0;
  for (const points of contours) {
    path[at++] = points.length;
    for (const [x, y] of points) {
      view.setInt16(at, x, true);
      view.setInt16(at + 2, y, true);
      at += 4;
    }
  }
  return {code, advance, bounds: length ? bounds : [0, 0, 0, 0], path};
}

function compile(font, name) {
  if (!font || font.isCollection || !font.unitsPerEm || !font.glyphForCodePoint) throw new Error('Unsupported font file');
  const scale = UNITS / font.unitsPerEm, picked = new Map();
  const priority = 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽäöüÄÖÜß°…–—−’′″×';
  const coverage = new Set([...Array.from({length: 95}, (_, i) => 32 + i),
    ...Array.from(priority, character => character.codePointAt(0)),
    ...Array.from({length: 224}, (_, i) => 160 + i)]);
  let length = HEADER;
  for (const code of coverage) {
    if (!font.hasGlyphForCodePoint(code)) continue;
    try {
      const glyph = encode(code, font.glyphForCodePoint(code), scale);
      if (!glyph || length + ENTRY + glyph.path.length > assets.maxBytes) continue;
      picked.set(code, glyph);
      length += ENTRY + glyph.path.length;
    } catch (ignored) {
      // Very complex or unsupported glyphs use the watch's normal fallback.
    }
  }
  if (![...picked.values()].some(glyph => glyph.path.length)) throw new Error('No supported glyphs');
  const bytes = new Uint8Array(length), view = new DataView(bytes.buffer);
  bytes.set([68, 70, 1, 0]);
  view.setUint16(4, picked.size, true);
  let offset = HEADER + picked.size * ENTRY, i = HEADER;
  for (const glyph of [...picked.values()].sort((a, b) => a.code - b.code)) {
    view.setUint16(i, glyph.code, true);
    view.setUint16(i + 2, glyph.advance, true);
    glyph.bounds.forEach((bound, index) => view.setInt16(i + 4 + index * 2, bound, true));
    view.setUint16(i + 12, offset, true);
    view.setUint16(i + 14, glyph.path.length, true);
    bytes.set(glyph.path, offset);
    offset += glyph.path.length;
    i += ENTRY;
  }
  return {id: assets.id(bytes), name: String(name || font.fullName || font.familyName || 'Imported font').trim().slice(0, 80), bytes};
}

module.exports = {compile};
