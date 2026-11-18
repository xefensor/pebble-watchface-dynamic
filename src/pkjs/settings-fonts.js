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
  let editing = null, session = 0, busy = false;
  const rows = [];

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
        if (id === choice(0)) drawSpecimen();
        update();
      }
    });
  }
  function fontName(role, id) {
    if (!id && role) return t('Use whole-watchface font');
    return id <= 3 ? t(builtIn[id]) : library.get(id) || t('Font saved on watch');
  }
  function mark(node, attribute) {
    node.setAttribute(attribute,'');
    return node;
  }

  const overview = make('div');
  overview.className = 'dynamic-font-list';
  host.replaceChildren(overview);
  const overrides = mark(make('details'),'data-font-overrides');
  overrides.className = 'dynamic-details';
  overrides.append(make('summary','Font overrides'));
  function roleRow(parent, role) {
    const row = button(parent);
    row.className = 'dynamic-font-row';
    row.dataset.fontRole = assets.fields[role];
    row.setAttribute('aria-controls','dynamic-font-picker');
    const value = make('span');
    value.className = 'dynamic-font-value';
    const action = make('span','Change font');
    action.className = 'dynamic-control-action';
    row.append(make('strong',names[role]),value,action);
    row.addEventListener('click',() => openPicker(role));
    rows.push({row,value});
  }
  roleRow(overview,0);
  const specimen = make('canvas');
  specimen.className = 'dynamic-font-specimen';
  specimen.width = 172;
  specimen.height = 48;
  specimen.setAttribute('aria-hidden','true');
  rows[0].row.append(specimen);
  overview.append(overrides);
  names.slice(1).forEach((name,index) => roleRow(overrides,index+1));
  if (fields.slice(1).some(field => Number(field.get()))) overrides.open = true;
  const reset = mark(button(overview,'Reset fonts'),'data-font-reset');
  reset.addEventListener('click',() => {
    fields.forEach(field => field.set(0));
    refresh();
    if (options.onRole) options.onRole(0);
    update();
  });

  const picker = mark(make('section'),'data-font-picker');
  picker.id = 'dynamic-font-picker';
  picker.className = 'dynamic-font-picker';
  picker.setAttribute('aria-labelledby','dynamic-font-picker-title');
  picker.hidden = true;
  host.append(picker);
  const back = mark(button(picker,'Back to fonts'),'data-font-back');
  back.addEventListener('click',() => dismiss());
  const title = make('h3');
  title.id = 'dynamic-font-picker-title';
  title.tabIndex = -1;
  picker.append(title);
  const choices = make('div');
  choices.className = 'dynamic-font-options';
  picker.append(choices);
  const actions = make('div');
  actions.className = 'dynamic-font-sources';
  picker.append(actions);
  const browse = mark(button(actions,'Browse Google Fonts'),'data-font-google');
  const importButton = mark(button(actions,'Import font'),'data-font-import');
  const fileInput = make('input');
  fileInput.type = 'file';
  fileInput.accept = '.ttf,.otf,font/ttf,font/otf';
  fileInput.hidden = true;
  actions.append(fileInput);
  const browsePanel = make('div');
  browsePanel.id = 'dynamic-google-fonts';
  browsePanel.hidden = true;
  browse.setAttribute('aria-controls',browsePanel.id);
  browse.setAttribute('aria-expanded','false');
  const status = mark(make('p'),'data-font-status');
  status.setAttribute('role','status');
  picker.append(browsePanel,status);
  const searchLabel = make('label','Search Google Fonts');
  const search = mark(make('input'),'data-font-search');
  search.type = 'search';
  searchLabel.append(search);
  browsePanel.append(searchLabel);
  const families = make('div');
  families.className = 'dynamic-font-results';
  families.setAttribute('role','group');
  families.setAttribute('aria-label',t('Font family'));
  browsePanel.append(families);
  const more = button(browsePanel,'More results');
  more.hidden = true;
  const styles = make('div');
  styles.hidden = true;
  browsePanel.append(styles);
  const stylePicker = mark(select(styles,'Style'),'data-font-style');
  const download = mark(button(styles,'Add font'),'data-font-download');
  download.disabled = true;

  function drawSpecimen() {
    const ctx = specimen.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0,specimen.width,specimen.height);
    ctx.fillStyle = window.getComputedStyle(specimen).color;
    ctx.textAlign = 'left';
    preview(ctx,0,'12:34   Aa',34,true,2,36,specimen.width-4);
  }
  function refresh() {
    reset.hidden = !fields.some(field => Number(field.get()));
    rows.forEach(({row,value}, role) => {
      const id = Number(fields[role].get()) || 0;
      value.textContent = fontName(role,id);
      row.dataset.fontId = String(id);
      previewLoad(choice(role));
    });
    drawSpecimen();
  }
  function showChoices() {
    choices.replaceChildren();
    const current = Number(fields[editing].get());
    function add(id) {
      const btn = button(choices);
      btn.className = 'dynamic-font-option';
      btn.dataset.fontChoice = String(id);
      btn.textContent = fontName(editing,id);
      btn.setAttribute('aria-pressed',String(id === current));
      btn.addEventListener('click',() => choose(id));
    }
    choices.append(make('h4','Built-in fonts'));
    (editing === 1 ? [0,1,2,3] : [0,1]).forEach(add);
    if (library.size || current > 3) choices.append(make('h4','Saved fonts'));
    for (const id of library.keys()) add(id);
    if (current > 3 && !library.has(current)) add(current);
  }
  function openPicker(role) {
    ++session;
    editing = role;
    setBusy(false);
    title.textContent = t(names[role]);
    showChoices();
    overview.hidden = true;
    picker.hidden = false;
    if (options.onPickerChange) options.onPickerChange(true);
    status.textContent = '';
    browsePanel.hidden = true;
    browse.setAttribute('aria-expanded','false');
    browse.disabled = false;
    importButton.disabled = false;
    if (options.onRole) options.onRole(role);
    title.focus();
  }
  function dismiss(restoreFocus = true) {
    if (editing === null) return false;
    const role = editing;
    editing = null;
    ++session;
    ++familyRequest;
    picker.hidden = true;
    overview.hidden = false;
    if (options.onPickerChange) options.onPickerChange(false);
    if (restoreFocus) rows[role].row.focus({preventScroll:true});
    return true;
  }
  function choose(id) {
    if (editing === null) return;
    fields[editing].set(id);
    status.textContent = '';
    for (const btn of choices.querySelectorAll('[data-font-choice]')) {
      btn.setAttribute('aria-pressed',String(Number(btn.dataset.fontChoice) === id));
    }
    refresh();
    update();
  }
  function setBusy(value) {
    busy = value;
    picker.setAttribute('aria-busy',String(value));
    for (const group of [choices,actions,browsePanel]) group.inert = value;
  }
  if (window.matchMedia) {
    const theme = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme.addEventListener) theme.addEventListener('change', drawSpecimen);
  }

  function formatBytes(bytes) {
    let text = '';
    for (let start = 0; start < bytes.length; start += 8192) {
      text += String.fromCharCode.apply(null,bytes.subarray(start,start+8192));
    }
    return btoa(text);
  }
  async function addFont(bytes,name,weight,request) {
    if (request !== session) return;
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
    if (request === session) {
      showChoices();
      choose(asset.id);
      status.textContent = asset.name;
    }
  }
  async function importNative() {
    let grant;
    const request = session;
    status.textContent = '';
    setBusy(true);
    try {
      [grant] = await Pebble.showOpenFilePicker({types:[{accept:{'font/ttf':['.ttf'],'font/otf':['.otf']}}]});
      if (!grant || request !== session) return;
      let bytes;
      for (let offset = 0; !bytes || offset < bytes.length;) {
        const result = await message({type:'font_file',id:grant.id,offset});
        if (request !== session) return;
        if (!result || !result.ok || !Number.isInteger(result.size) || result.size > MAX_INPUT ||
            result.offset !== offset || !Array.isArray(result.bytes) || !result.bytes.length) throw Error('Font file');
        if (!bytes) bytes = new Uint8Array(result.size);
        if (result.size !== bytes.length || offset + result.bytes.length > bytes.length) throw Error('Font changed');
        bytes.set(result.bytes, offset);
        offset += result.bytes.length;
      }
      await addFont(bytes,null,0,request);
    } catch (error) {
      if (request === session && error.name !== 'AbortError') status.textContent = t('Could not import font');
    } finally {
      if (request === session) setBusy(false);
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
    const file = fileInput.files[0], request = session;
    if (!file || editing === null || busy) return;
    status.textContent = '';
    setBusy(true);
    try {
      if (file.size > MAX_INPUT || !/\.(ttf|otf)$/i.test(file.name)) throw Error('Font type or size');
      await addFont(new Uint8Array(await file.arrayBuffer()),null,0,request);
    } catch (ignored) {
      if (request === session) status.textContent = t('Could not import font');
    } finally {
      if (request === session) setBusy(false);
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
  const batchSize = 12;
  let results = [], shown = 0;
  function showMore() {
    const end = Math.min(shown + batchSize,results.length);
    for (const entry of results.slice(shown,end)) {
      const btn = button(families);
      btn.dataset.fontFamily = entry.slug;
      btn.textContent = entry.label;
      btn.setAttribute('aria-pressed','false');
      btn.addEventListener('click',() => selectFamily(entry,btn));
    }
    shown = end;
    more.hidden = shown >= results.length;
  }
  more.addEventListener('click',() => {
    const first = shown;
    showMore();
    const next = families.querySelectorAll('button[data-font-family]')[first];
    if (next) next.focus();
  });
  function catalogResults() {
    ++familyRequest;
    selectedFamily = null;
    styles.hidden = true;
    stylePicker.replaceChildren();
    download.disabled = true;
    const term = search.value.toLowerCase().replace(/[^a-z0-9]/g,'');
    results = (catalog || []).filter(family => family.slug.includes(term));
    families.replaceChildren();
    shown = 0;
    showMore();
    if (catalog) status.textContent = results.length ? '' : t('No matching fonts');
  }
  async function loadCatalog() {
    const tip = JSON.parse(new TextDecoder().decode(await fetchFile(repository+'commits/main')));
    const revision = tip.sha, rootId = tip.commit?.tree?.sha;
    if (!/^[a-f0-9]{40}$/.test(revision) || !/^[a-f0-9]{40}$/.test(rootId)) throw Error('Font catalog revision');
    const root = await tree(rootId);
    const groups = root.tree.filter(entry => entry.type === 'tree' && ['ofl','apache','ufl'].includes(entry.path) &&
        /^[a-f0-9]{40}$/.test(entry.sha));
    const folders = await Promise.all(groups.map(async group => {
      const list = await tree(group.sha);
      return list.tree.filter(entry => entry.type === 'tree' && /^[a-z0-9]+$/.test(entry.path)).map(entry => ({
        slug:entry.path, label:entry.path[0].toUpperCase()+entry.path.slice(1), path:group.path+'/'+entry.path, revision,
      }));
    }));
    const sorted = folders.flat().sort((a,b) => a.slug.localeCompare(b.slug));
    if (!sorted.length) throw Error('Empty font catalog');
    return sorted;
  }
  let catalogRequest = null;
  browse.addEventListener('click', async () => {
    const opening = browsePanel.hidden;
    browsePanel.hidden = !opening;
    browse.setAttribute('aria-expanded',String(opening));
    if (!opening) {
      ++familyRequest;
      status.textContent = '';
      return;
    }
    const request = session;
    search.value = '';
    catalogResults();
    search.focus();
    if (catalog) return;
    status.textContent = t('Loading Google Fonts…');
    try {
      if (!catalogRequest) catalogRequest = loadCatalog().finally(() => {catalogRequest = null;});
      catalog = await catalogRequest;
      if (request === session && !browsePanel.hidden) catalogResults();
    } catch (ignored) {
      if (request === session && !browsePanel.hidden) {
        browsePanel.hidden = true;
        browse.setAttribute('aria-expanded','false');
        status.textContent = t('Could not load Google Fonts');
        browse.focus();
      }
    }
  });
  search.addEventListener('input',catalogResults);
  async function selectFamily(entry,btn) {
    const request = ++familyRequest;
    selectedFamily = null;
    styles.hidden = true;
    stylePicker.replaceChildren();
    download.disabled = true;
    for (const other of families.querySelectorAll('button[data-font-family]')) {
      other.setAttribute('aria-pressed',String(other === btn));
    }
    status.textContent = t('Loading Google Fonts…');
    const url = rawBase + entry.revision + '/' + entry.path + '/';
    try {
      const detail = catalogDetails(new TextDecoder().decode(await fetchFile(url+'METADATA.pb')));
      if (request !== familyRequest) return;
      if (!detail.name || !detail.variants.length) throw Error('Missing font metadata');
      selectedFamily = {url,name:detail.name,variants:detail.variants};
      btn.textContent = entry.label = detail.name;
      stylePicker.replaceChildren(...detail.variants.map((variant,index) => {
        const weight = styleName(variant.weight,'normal');
        const label = weight === String(variant.weight) ? weight : t(variant.weight+' · '+weight);
        return option(index,variant.label.endsWith(' Italic') ? label+' · '+t('Italic') : label);
      }));
      const regular = detail.variants.findIndex(variant => variant.label === 'Regular');
      if (regular >= 0) stylePicker.value = regular;
      // Keep style and Add adjacent to the selected family, including when
      // the user has loaded several pages of results.
      btn.after(styles);
      styles.hidden = false;
      download.disabled = false;
      status.textContent = '';
    } catch (ignored) {
      if (request === familyRequest) status.textContent = t('Could not load Google Fonts');
    }
  }
  download.addEventListener('click', async () => {
    const family = selectedFamily, variant = family && family.variants[Number(stylePicker.value)];
    if (busy || !variant) return;
    const request = session;
    setBusy(true);
    download.disabled = true;
    status.textContent = t('Loading Google Fonts…');
    try {
      const bytes = new Uint8Array(await fetchFile(family.url+encodeURIComponent(variant.file)));
      if (request === session) await addFont(bytes,family.name+' '+variant.label,variant.variable ? variant.weight : 0,request);
    } catch (ignored) {
      if (request === session) status.textContent = t('Could not add Google Font');
    } finally {
      if (request === session) {
        setBusy(false);
        download.disabled = !selectedFamily;
      }
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
  function clearStatus() {
    if (!busy && status.textContent !== t('Loading Google Fonts…')) status.textContent = '';
  }
  return {refresh,preview,dismiss,clearStatus,custom:() => fields.some(field => Number(field.get()))};
}

module.exports = {install,catalogDetails};
