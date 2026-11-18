'use strict';

const assets = require('../common/font-assets');
const compiler = require('./font-compiler');
const MAX_INPUT = 4 * 1024 * 1024;
const repository = 'https://api.github.com/repos/google/fonts/';
const rawBase = 'https://raw.githubusercontent.com/google/fonts/';

function styleName(weight, style) {
  const labels = {100:'Thin',200:'Extra Light',300:'Light',400:'Regular',500:'Medium',
    600:'SemiBold',700:'Bold',800:'Extra Bold',900:'Black'};
  return (labels[weight] || String(weight)) + (style === 'italic' ? ' Italic' : '');
}

function catalogDetails(metadata) {
  const family = metadata.match(/^name:\s*"([^"\r\n]+)"/m);
  const variants = new Map();
  const weightAxis = [...metadata.matchAll(/^axes\s*\{([^}]+)\}/gm)].find(axis => /tag:\s*"wght"/.test(axis[1]));
  const axisBound = (bound) => {
    const match = weightAxis && weightAxis[1].match(new RegExp(bound + '_value:\\s*([0-9.]+)'));
    return match ? Number(match[1]) : undefined;
  };
  for (const [, block] of metadata.matchAll(/^fonts\s*\{([^}]+)\}/gm)) {
    const file = block.match(/filename:\s*"([^"/\\]+\.(?:ttf|otf))"/i);
    const weight = block.match(/weight:\s*(\d+)/);
    const style = block.match(/style:\s*"(normal|italic)"/);
    if (!file || !weight || !style) continue;
    const min = axisBound('min'), max = axisBound('max');
    const variable = /\[.*wght.*\]/.test(file[1]) && min !== undefined && max !== undefined;
    const available = variable ? Array.from({length:9}, (_, i) => 100 * (i + 1)).filter(value => value >= min && value <= max) : [];
    for (const value of new Set([Number(weight[1]), ...available])) {
      variants.set(style[1] + value, {file:file[1], weight:value, variable, label:styleName(value, style[1])});
    }
  }
  return {name:family && family[1], variants:[...variants.values()]};
}

function parseAsset(asset) {
  const bytes = asset && assets.decode(asset.data);
  if (!bytes || assets.id(bytes) !== asset.id) return null;
  const data = new DataView(bytes.buffer);
  const count = data.getUint16(4, true);
  if (8 + count * 16 > bytes.length) return null;
  const glyphs = new Map();
  for (let i = 0, at = 8; i < count; ++i, at += 16) {
    glyphs.set(data.getUint16(at, true), {
      advance:data.getUint16(at + 2, true),
      ascent:data.getInt16(at + 10, true), descent:-data.getInt16(at + 8, true),
      at:data.getUint16(at + 12, true), end:data.getUint16(at + 12, true) + data.getUint16(at + 14, true),
    });
  }
  return {data,glyphs};
}

function install(options, createFont) {
  const {host, bridge, fields, update, translate:t} = options;
  const names = ['Whole watchface','Clock','Date','Readings','Activities'];
  const builtIn = ['Dynamic Default','Pebble Gothic','Pebble Bitham','Pebble LECO'];
  const cached = new Map(), requested = new Set();
  const library = new Map((options.library || []).map(font => [font.id,font.name]));
  let catalog, selectedFamily, familyRequest = 0;
  const pickers = [];

  function make(tag, value) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = t(value);
    return node;
  }
  function select(container, label) {
    const element = make('select'), wrapper = make('label', label);
    wrapper.append(element);
    const row = make('div');
    row.className = 'dynamic-choice';
    row.append(wrapper);
    container.append(row);
    return element;
  }
  function option(value, title) {
    const node = make('option');
    node.value = value;
    node.textContent = title;
    return node;
  }
  function button(parent, title) {
    const element = make('button', title);
    element.type = 'button';
    parent.append(element);
    return element;
  }
  function message(payload) {
    return new Promise(resolve => bridge && bridge.font ? bridge.font(payload,resolve) : resolve(null));
  }
  function choice(index) {
    return Number(fields[index].get()) || (index ? Number(fields[0].get()) : 0) || 0;
  }
  function previewLoad(id) {
    if (id <= 3 || cached.has(id) || requested.has(id)) return;
    requested.add(id);
    message({type:'font_get', id}).then(result => {
      const font = result && result.ok && parseAsset(result.asset);
      if (font) {
        cached.set(id, font);
        update();
      }
    });
  }
  function refresh() {
    reset.disabled = !fields.some(field => Number(field.get()));
    pickers.forEach((picker, index) => {
      const current = Number(fields[index].get());
      const items = [option(0,t(index ? 'Use whole-watchface font' : builtIn[0])), option(1,t(builtIn[1]))];
      if (index === 1) items.push(option(2,t(builtIn[2])),option(3,t(builtIn[3])));
      for (const [id, name] of library) items.push(option(id,name));
      if (current > 3 && !library.has(current)) items.push(option(current,t('Font saved on watch')));
      picker.replaceChildren(...items);
      picker.value = current;
      previewLoad(choice(index));
    });
  }
  const heading = make('h3','Fonts');
  host.replaceChildren(heading);
  const global = select(host,names[0]);
  const overrides = make('details');
  overrides.className = 'dynamic-details';
  overrides.append(make('summary','Font overrides'));
  host.append(overrides);
  pickers.push(global,...names.slice(1).map(name => select(overrides,name)));
  pickers.forEach((picker, index) => {
    picker.dataset.fontRole = assets.fields[index];
    picker.addEventListener('change', () => {
      fields[index].set(Number(picker.value));
      previewLoad(choice(index));
      reset.disabled = !fields.some(field => Number(field.get()));
      update();
    });
  });
  if (fields.slice(1).some(field => Number(field.get()))) overrides.open = true;

  const sources = make('details');
  sources.className = 'dynamic-details';
  sources.append(make('summary','Get more fonts'));
  const destination = select(sources,'Apply to');
  names.forEach((name,index) => destination.append(option(index,t(name))));
  const status = make('p');
  status.setAttribute('role','status');
  const actions = make('div');
  actions.className = 'dynamic-presets';
  sources.append(actions);
  const importButton = button(actions,'Import font');
  const fileInput = make('input');
  fileInput.type = 'file';
  fileInput.accept = '.ttf,.otf,font/ttf,font/otf';
  fileInput.hidden = true;
  sources.append(fileInput);
  const browse = button(actions,'Browse Google Fonts');
  const defaults = make('div');
  defaults.className = 'dynamic-presets';
  const reset = button(defaults,'Reset fonts');
  reset.addEventListener('click',() => {
    fields.forEach(field => field.set(0));
    refresh();
    update();
  });
  const browsePanel = make('div');
  browsePanel.hidden = true;
  sources.append(browsePanel,status);
  host.append(sources,defaults);
  const search = make('input');
  search.type = 'search';
  search.placeholder = t('Search Google Fonts');
  const searchLabel = make('label','Search Google Fonts');
  searchLabel.append(search);
  browsePanel.append(searchLabel);
  const familyPicker = select(browsePanel,'Font family');
  const stylePicker = select(browsePanel,'Style');
  const download = button(browsePanel,'Add font');
  download.disabled = true;

  function formatBytes(bytes) {
    let text = '';
    for (let start = 0; start < bytes.length; start += 8192) {
      text += String.fromCharCode.apply(null,bytes.subarray(start,start+8192));
    }
    return btoa(text);
  }
  async function addFont(bytes,name,weight,target) {
    if (bytes.length < 12 || bytes.length > MAX_INPUT) throw Error('Font size');
    const signature = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0);
    if (signature !== 0x00010000 && signature !== 0x4f54544f && signature !== 0x74727565) {
      throw Error('Expected a TrueType or OpenType font');
    }
    let font = createFont(bytes);
    if (weight && font.variationAxes && font.variationAxes.wght) font = font.getVariation({wght:weight});
    const compiled = compiler.compile(font,name);
    const asset = {id:compiled.id, name:compiled.name, data:formatBytes(compiled.bytes)};
    const saved = await message({type:'font_store',asset});
    if (!saved || !saved.ok) throw Error('Phone storage');
    cached.set(asset.id,parseAsset(asset));
    library.set(asset.id,asset.name);
    fields[target].set(asset.id);
    if (target) overrides.open = true;
    refresh();
    update();
    status.textContent = t('Font ready to save');
  }
  async function importNative() {
    let grant;
    const target = Number(destination.value);
    status.textContent = '';
    importButton.disabled = true;
    try {
      [grant] = await Pebble.showOpenFilePicker({types:[{accept:{'font/ttf':['.ttf'],'font/otf':['.otf']}}]});
      if (!grant) return;
      let bytes;
      for (let offset = 0; !bytes || offset < bytes.length;) {
        const result = await message({type:'font_file',id:grant.id,offset});
        if (!result || !result.ok || !Number.isInteger(result.size) || result.size > MAX_INPUT ||
            result.offset !== offset || !Array.isArray(result.bytes) || !result.bytes.length) throw Error('Font file');
        if (!bytes) bytes = new Uint8Array(result.size);
        if (result.size !== bytes.length || offset + result.bytes.length > bytes.length) throw Error('Font changed');
        bytes.set(result.bytes, offset);
        offset += result.bytes.length;
      }
      await addFont(bytes,null,0,target);
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = t('Could not import font');
    } finally {
      importButton.disabled = false;
      if (grant && Pebble.fileSystem && Pebble.fileSystem.revoke) {
        try { await Pebble.fileSystem.revoke(grant.id); } catch (ignored) {}
      }
    }
  }
  importButton.addEventListener('click',() => {
    if (typeof Pebble !== 'undefined' && typeof Pebble.showOpenFilePicker === 'function') {
      importNative();
    } else {
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0], target = Number(destination.value);
    if (!file) return;
    status.textContent = '';
    importButton.disabled = true;
    try {
      if (file.size > MAX_INPUT || !/\.(ttf|otf)$/i.test(file.name)) throw Error('Font type or size');
      await addFont(new Uint8Array(await file.arrayBuffer()),null,0,target);
    } catch (ignored) {
      status.textContent = t('Could not import font');
    } finally {
      importButton.disabled = false;
      fileInput.value = '';
    }
  });

  async function fetchFile(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),12000);
    try {
      const response = await fetch(url,{credentials:'omit',signal:controller.signal});
      if (!response.ok || Number(response.headers.get('content-length')) > MAX_INPUT) throw Error('Font network response');
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_INPUT) throw Error('Font response size');
      return buffer;
    } finally {
      clearTimeout(timer);
    }
  }
  async function tree(ref) {
    const data = JSON.parse(new TextDecoder().decode(await fetchFile(repository + 'git/trees/' + ref)));
    if (!Array.isArray(data.tree) || data.truncated || !/^[a-f0-9]{40}$/.test(data.sha)) throw Error('Font catalog');
    return data;
  }
  function catalogResults() {
    ++familyRequest;
    selectedFamily = null;
    stylePicker.replaceChildren();
    download.disabled = true;
    const term = search.value.toLowerCase().replace(/[^a-z0-9]/g,'');
    const found = (catalog || []).filter(family => family.slug.includes(term));
    familyPicker.replaceChildren(option('',t('Choose a family')),...found.map((font,index) => option(index,font.label)));
    familyPicker.disabled = !found.length;
    return found;
  }
  let visibleFamilies=[];
  browse.addEventListener('click', async () => {
    browsePanel.hidden = false;
    if (catalog) return;
    browse.disabled = true;
    status.textContent = t('Loading Google Fonts…');
    try {
      const tip = JSON.parse(new TextDecoder().decode(await fetchFile(repository+'commits/main')));
      const revision = tip.sha, rootId = tip.commit?.tree?.sha;
      if (!/^[a-f0-9]{40}$/.test(revision) || !/^[a-f0-9]{40}$/.test(rootId)) throw Error('Font catalog revision');
      const root = await tree(rootId);
      const groups = root.tree.filter(entry => entry.type === 'tree' && ['ofl','apache','ufl'].includes(entry.path) &&
          /^[a-f0-9]{40}$/.test(entry.sha));
      const families = await Promise.all(groups.map(async group => {
        const list = await tree(group.sha);
        return list.tree.filter(entry => entry.type === 'tree' && /^[a-z0-9]+$/.test(entry.path)).map(entry => ({
          slug:entry.path, label:entry.path[0].toUpperCase()+entry.path.slice(1), path:group.path+'/'+entry.path, revision,
        }));
      }));
      catalog = families.flat().sort((a,b) => a.slug.localeCompare(b.slug));
      if (!catalog.length) throw Error('Empty font catalog');
      visibleFamilies = catalogResults();
      status.textContent = '';
    } catch (ignored) {
      status.textContent = t('Could not load Google Fonts');
    } finally {
      browse.disabled = false;
    }
  });
  search.addEventListener('input',() => {visibleFamilies = catalogResults();});
  familyPicker.addEventListener('change', async () => {
    const request = ++familyRequest, entry = familyPicker.value === '' ? null : visibleFamilies[Number(familyPicker.value)];
    selectedFamily = null;
    stylePicker.replaceChildren();
    download.disabled = true;
    if (!entry) { status.textContent = ''; return; }
    status.textContent = t('Loading Google Fonts…');
    const url = rawBase + entry.revision + '/' + entry.path + '/';
    try {
      const detail = catalogDetails(new TextDecoder().decode(await fetchFile(url+'METADATA.pb')));
      if (request !== familyRequest) return;
      if (!detail.name || !detail.variants.length) throw Error('Missing font metadata');
      selectedFamily = {url,name:detail.name,variants:detail.variants};
      stylePicker.replaceChildren(...detail.variants.map((variant,index) => option(index,variant.label)));
      const regular = detail.variants.findIndex(variant => variant.label === 'Regular');
      if (regular >= 0) stylePicker.value = regular;
      download.disabled = false;
      status.textContent = detail.name;
    } catch (ignored) {
      if (request === familyRequest) status.textContent = t('Could not load Google Fonts');
    }
  });
  download.addEventListener('click', async () => {
    const family = selectedFamily, variant = family && family.variants[Number(stylePicker.value)];
    if (!variant) return;
    const target = Number(destination.value);
    download.disabled = true;
    status.textContent = t('Loading Google Fonts…');
    try {
      const bytes = new Uint8Array(await fetchFile(family.url+encodeURIComponent(variant.file)));
      await addFont(bytes,family.name+' '+variant.label,variant.variable ? variant.weight : 0,target);
    } catch (ignored) {
      status.textContent = t('Could not add Google Font');
    } finally {
      download.disabled = !selectedFamily;
    }
  });
  refresh();

  function preview(ctx, role, value, size, bold, x, y, width) {
    const id = choice(role), font = cached.get(id);
    const fallback = fields.slice(1).some(field => !Number(field.get())) && cached.get(choice(0));
    ctx.font = (bold || id ? 'bold ' : '') + size + 'px ' +
      (id === 3 ? 'monospace' : id === 2 ? 'serif' : 'sans-serif');
    if (!font) {
      if (x !== undefined) ctx.fillText(value,x,y,width);
      const metrics = ctx.measureText(value);
      return {ascent:metrics.actualBoundingBoxAscent || size*.75,descent:metrics.actualBoundingBoxDescent || 0};
    }
    const parts = [], scale = size/1024;
    let measured = 0, ascent = 0, descent = 0;
    for (const character of value) {
      const code = character.codePointAt(0), source = font.glyphs.has(code) ? font : fallback;
      const glyph = source && source.glyphs.get(code);
      const fallbackInk = !glyph && ctx.measureText(character);
      parts.push({character,glyph,source,offset:measured});
      measured += glyph ? glyph.advance*scale : fallbackInk.width;
      ascent = Math.max(ascent,glyph ? glyph.ascent*scale : fallbackInk.actualBoundingBoxAscent || 0);
      descent = Math.max(descent,glyph ? glyph.descent*scale : fallbackInk.actualBoundingBoxDescent || 0);
    }
    if (x === undefined) return {ascent,descent};
    const alignment = ctx.textAlign, fit = width && measured > width ? width/measured : 1;
    let start = x;
    if (alignment === 'center') start -= measured*fit/2;
    if (alignment === 'right') start -= measured*fit;
    ctx.save();
    ctx.translate(start,y);
    ctx.scale(fit,1);
    ctx.textAlign = 'left';
    for (const part of parts) {
      const {glyph,source,offset,character} = part;
      if (!glyph) { ctx.fillText(character,offset,0); continue; }
      if (glyph.end > source.data.byteLength) continue;
      let at = glyph.at;
      ctx.beginPath();
      while (at < glyph.end) {
        const points = source.data.getUint8(at++);
        if (points < 3 || at + points*4 > glyph.end) break;
        for (let i = 0; i < points; ++i) {
          const px = offset + source.data.getInt16(at,true)*scale;
          const py = -source.data.getInt16(at+2,true)*scale;
          if (i) ctx.lineTo(px,py); else ctx.moveTo(px,py);
          at += 4;
        }
        ctx.closePath();
      }
      ctx.fill();
    }
    ctx.restore();
    return {ascent,descent};
  }
  return {refresh,preview,custom:() => fields.some(field => Number(field.get()))};
}

module.exports = {install,catalogDetails};
