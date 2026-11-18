'use strict';

// Clay copies only this function to its offline page. Everything used below is
// supplied through Clay userData/transport components or declared inside it.
module.exports = function() {
  var clay = this;
  function setLiveText(element, text) {
    if (element && element.textContent !== text) { element.textContent = text; }
  }
  function watchRetryAvailable(bridge, saved) {
    return !!(bridge && typeof bridge.display === 'function' && saved && saved.state && saved.state !== 'none' && !saved.applied);
  }
  function installPaletteKeyboard(element, opener, doc) {
    var picker = element.querySelector('.picker-wrap');
    var swatches = Array.prototype.slice.call(element.querySelectorAll('.color-box.selectable'));
    if (!picker || !swatches.length) { return function() {}; }
    var active = 0;
    function selectedIndex() {
      for (var i = 0; i < swatches.length; ++i) { if (swatches[i].classList.contains('selected')) { return i; } }
      return -1;
    }
    function sync(focusSelected) {
      var open = picker.classList.contains('show'), selected = selectedIndex();
      var focused = swatches.indexOf(doc.activeElement);
      active = focusSelected || focused < 0 ? Math.max(0,selected) : focused;
      opener.setAttribute('aria-expanded',open ? 'true' : 'false');
      picker.setAttribute('aria-hidden',open ? 'false' : 'true');
      swatches.forEach(function(box,index) {
        box.tabIndex = open && index === active ? 0 : -1;
        box.setAttribute('aria-pressed',index === selected ? 'true' : 'false');
      });
      if (open && focusSelected) { swatches[active].focus(); }
      if (!open && focused >= 0) { opener.focus(); }
    }
    function close() { picker.classList.remove('show');sync(false);opener.focus(); }
    function neighbour(index, key) {
      var rect = swatches[index].getBoundingClientRect();
      var horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
      var sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
      var x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      var best = index, bestPrimary = Infinity, bestCross = Infinity;
      swatches.forEach(function(box,candidate) {
        if (candidate === index) { return; }
        var other = box.getBoundingClientRect();
        if (!other.width || !other.height) { return; }
        var dx = other.left + other.width / 2 - x, dy = other.top + other.height / 2 - y;
        var primary = (horizontal ? dx : dy) * sign, cross = Math.abs(horizontal ? dy : dx);
        if (primary < 1 || horizontal && cross > Math.max(1, Math.min(rect.height,other.height) / 3)) { return; }
        if (primary < bestPrimary - 1 || Math.abs(primary - bestPrimary) <= 1 && cross < bestCross) {
          best = candidate;bestPrimary = primary;bestCross = cross;
        }
      });
      return best;
    }
    opener.addEventListener('keydown',function(event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault();opener.click();sync(true); }
      else if (event.key === 'Escape') { event.preventDefault();close(); }
    });
    swatches.forEach(function(box,index) {
      box.setAttribute('role','button');
      var color = Number(box.getAttribute('data-value'));
      box.setAttribute('aria-label','#' + ('000000' + color.toString(16)).slice(-6));
      box.addEventListener('focus',function() {
        active = index;swatches.forEach(function(value,at) { value.tabIndex = at === active ? 0 : -1; });
      });
      box.addEventListener('keydown',function(event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault();box.click();sync(false);opener.focus();return; }
        if (event.key === 'Escape') { event.preventDefault();close();return; }
        var next = event.key === 'Home' ? 0 : event.key === 'End' ? swatches.length - 1 :
          ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(event.key) >= 0 ? neighbour(index,event.key) : -1;
        if (next < 0) { return; }
        event.preventDefault();active = next;
        swatches.forEach(function(value,at) { value.tabIndex = at === active ? 0 : -1; });
        swatches[active].focus();
      });
    });
    sync(false);return sync;
  }
  // Clay serializes this hook, so the common stylesheet is explicit userData.
  // Bundled config already needs it for the loading screen; legacy Clay adds it.
  if (!document.getElementById('xoce-settings-style')) {
    var sharedStyle = document.createElement('style');
    sharedStyle.id = 'xoce-settings-style';
    sharedStyle.textContent = clay.meta.userData.settingsStyle;
    document.head.appendChild(sharedStyle);
  }
  var style = document.createElement('style');
  style.id = 'dynamic-settings-style';
  style.textContent = [
    ':root{--on-accent:var(--accent-ink);--track:#cad0d6}@media(prefers-color-scheme:dark){:root{--track:#565f6a}}',
    'html{font-size:16px!important;height:auto;background:var(--page)!important;color:var(--ink)!important}',
    'body{height:auto;max-width:512px;margin:0 auto;padding:24px 16px calc(var(--dynamic-save-height,108px) + 24px)}',
    // Clay adds component styles after this hook. Scope colour rules to the
    // form so late defaults cannot reintroduce white inputs or orange text.
    'body{background:var(--page)!important;color:var(--ink)!important}',
    '#main-form{color:var(--ink);font:inherit}',
    '#main-form .section{background:var(--card);color:var(--ink)}',
    '#main-form label,#main-form .label,#main-form .component-select .value{color:var(--ink);font-family:inherit}',
    '#main-form strong{color:var(--ink);font-family:inherit}',
    '#main-form .description,#main-form .component-text p{color:var(--muted)}',
    '#main-form input,#main-form select,#main-form option{color:var(--ink);background-color:var(--field);font-family:inherit}',
    '#main-form input::placeholder{color:var(--muted);opacity:1}',
    '#main-form .component-select .value{background:var(--field)}',
    '#main-form .component-toggle input{background:none}',
    '#main-form .component-toggle .graphic .marker{background:#fff;border:1px solid #59636f}',
    '#main-form .component-toggle input:checked+.graphic .marker{background:#fff;border-color:#fff}',
    '#main-form .component-color .picker-wrap .picker{background:var(--card);color:var(--ink)}',
    '#main-form .dynamic-save-state p{color:var(--muted)}',
    '#main-form .dynamic-warning p{color:#934300}',
    '@media(prefers-color-scheme:dark){#main-form .dynamic-warning p{color:#ffbd77}}',
    '#main-form>.component-heading:first-child{padding:0}',
    '.component-heading h1,.component-heading h2,.component-heading h3,.component-heading h4{margin:0;color:var(--ink);font:700 var(--section-size)/1.3 var(--font-family);text-transform:none;letter-spacing:0}',
    '#main-form>.component-heading:first-child h1,#main-form>.component-heading:first-child h2,#main-form>.component-heading:first-child h4{font-size:var(--title-size);line-height:1.2;letter-spacing:-.6px}',
    '#main-form>.component-heading:first-child:after{display:none}',
    '#main-form>.dynamic-intro{margin:12px 0 24px;padding:0}',
    '#main-form>.dynamic-intro p{font-size:16px;line-height:1.5}',
    '#main-form>.dynamic-intro:after{content:"";position:static;display:block;width:48px;height:4px;border-radius:2px;margin-top:16px;background:var(--accent)}',
    '.section{margin:0 0 24px;border:1px solid var(--line);border-radius:var(--card-radius);background:var(--card);box-shadow:none;overflow:hidden}',
    '.section>.component{margin-top:0!important;padding:16px;position:relative}',
    '.section>.component-heading:first-child{padding:16px;background:none;border-radius:0}',
    '.section>.component-heading:first-child h1,.section>.component-heading:first-child h2,.section>.component-heading:first-child h4{color:var(--ink)}',
    '.section>.component:after{left:16px;right:16px;background:var(--line)}',
    '.component-text p{margin:0;font-size:14px;line-height:1.5;color:var(--muted);overflow-wrap:break-word;word-wrap:break-word}',
    'label{min-height:28px;margin:0;padding:0;gap:14px;color:var(--ink);font-size:16px;line-height:1.5}',
    'label>.label{min-width:0;flex:1;overflow-wrap:break-word;word-wrap:break-word}',
    'label>.input{flex-shrink:0;margin-left:0}',
    '.description{padding:0;margin-top:7px;color:var(--muted);font-size:14px;line-height:1.5;overflow-wrap:break-word;word-wrap:break-word}',
    '.component-toggle label{min-height:var(--control-height)}',
    '.component-toggle input{display:block;position:absolute;opacity:0;width:44px;height:44px;right:12px;top:13px;margin:0}',
    '.component-toggle input:focus-visible+.graphic{outline:var(--focus-width) solid var(--accent);outline-offset:3px;border-radius:16px}',
    '.component-select:focus-within .value,.component-color label:focus-visible{outline:var(--focus-width) solid var(--accent);outline-offset:3px}',
    '.color-box.selectable:focus-visible{outline:var(--focus-width) solid var(--ink);outline-offset:-3px}',
    '.component-toggle .graphic .slide{background:var(--track)}',
    '.component-toggle .graphic .marker{box-shadow:0 1px 3px #0003}',
    '.component-toggle input:checked+.graphic .slide{background:var(--accent)}',
    '#main-form .component-toggle input:checked+.graphic .marker{background:var(--on-accent);border-color:var(--on-accent)}',
    '.component-toggle .graphic .slide,.component-toggle .graphic .marker{transition:background-color var(--control-motion) ease-out,left var(--control-motion) ease-out,transform var(--control-motion) ease-out}',
    '.component-color .value{flex-shrink:0;border:1px solid #8886;box-shadow:none}',
    '.component-color .picker-wrap .picker{max-width:416px;background:var(--card);border:1px solid var(--line);border-radius:var(--card-radius)}',
    '.component-input label{display:block}',
    '.component-input label>.label{display:block;padding:0}',
    '.component-input .input{display:block;min-width:100%;max-width:none;margin:9px 0 0}',
    '.component-input input{min-height:var(--control-height);padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--ink);font-size:15px}',
    '.component-input input:focus{outline:var(--focus-width) solid var(--accent);outline-offset:3px;border:1px solid var(--line)}',
    '.component-select label,.dynamic-choice label{display:block}',
    '.component-select .value{margin-top:9px;padding:9px 28px 9px 12px;min-height:var(--control-height);border:1px solid var(--line);border-radius:8px;background:var(--field);font-size:15px}',
    '.component-select .value:after{right:12px;top:50%;margin-top:0;transform:translateY(-50%);border-top-color:var(--accent)}',
    '[data-font-panel] h3{margin:0 0 8px;font-size:17px}[data-font-panel]>.dynamic-details{margin-top:12px}[data-font-panel] button:disabled{opacity:.65}',
    '.dynamic-choice select{display:block;width:100%;margin-top:9px;min-height:var(--control-height);padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--ink);font:inherit;font-size:15px}',
    '.dynamic-choice select:focus-visible,button:focus-visible,summary:focus-visible{outline:var(--focus-width) solid var(--accent);outline-offset:3px}',
    '.dynamic-preview-stage{width:212px;max-width:100%;margin:0 auto 14px;border:6px solid #101216;border-radius:var(--card-radius);overflow:hidden;background:#fff;line-height:0}',
    '.dynamic-preview-stage canvas{display:block;width:200px;height:228px;max-width:100%;image-rendering:pixelated}',
    '.dynamic-preview-note{margin:7px 0 0!important;font-size:12px!important}',
    '.dynamic-preview-title{margin:0 0 12px;color:var(--ink);font-size:15px;text-transform:none!important}',
    '.dynamic-preview-palette{display:block;margin:0 0 14px}',
    '.dynamic-preview-palette>.description{display:block;margin-top:7px}',
    '.dynamic-example-disabled{padding:7px 9px;border-radius:7px;background:var(--field);color:var(--muted)}',
    '.dynamic-save-state{padding:0!important;margin:0 auto 12px;min-height:21px;color:var(--muted);font-size:14px;line-height:1.5;text-align:left}',
    '.dynamic-save-state p{margin:0;font-size:14px;line-height:1.5;text-align:left}',
    '.dynamic-save-state:after{display:none!important}',
    '.dynamic-palette-code label{display:block;margin-bottom:7px}',
    '.dynamic-palette-details summary{font-size:16px}',
    '.dynamic-palette-code input{display:block;width:100%;min-height:var(--control-height);padding:9px 12px;border:1px solid var(--line);border-radius:8px;font:16px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}',
    '.dynamic-palette-actions{display:flex;gap:8px;margin-top:9px}',
    '.dynamic-palette-actions button{flex:1;min-width:0;width:auto;margin:0;min-height:var(--control-height);padding:9px 12px;border:1px solid var(--line);border-radius:8px;box-shadow:none;background:var(--field);color:var(--ink);font:650 16px/1.5 var(--font-family);text-transform:none;letter-spacing:0}',
    '#main-form .dynamic-palette-code input:focus-visible{outline:var(--focus-width) solid var(--accent);outline-offset:3px}',
    '.dynamic-palette-code p{margin:7px 0 0!important}',
    '.dynamic-app-filter label{display:block;min-height:0;margin-bottom:7px}',
    '.dynamic-app-entry{display:flex;gap:7px;align-items:stretch}',
    '.dynamic-app-entry input{flex:1;min-width:0;width:0;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--ink);font:inherit;font-size:15px}',
    '.dynamic-app-entry button,.dynamic-app-chip button{width:auto;margin:0;min-width:0;box-shadow:none;text-transform:none;letter-spacing:0;font:inherit}',
    '.dynamic-app-entry button{min-height:var(--control-height);padding:9px 13px;border:0;border-radius:8px;background:var(--accent);color:var(--on-accent)}',
    '.dynamic-app-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;padding:0;list-style:none}',
    '.dynamic-app-chip{display:flex;align-items:center;max-width:100%;padding:3px 3px 3px 10px;border:1px solid var(--line);border-radius:9px;background:var(--field);font-size:14px}',
    '.dynamic-app-chip span{min-width:0;overflow-wrap:anywhere}',
    '.dynamic-app-chip button{flex-shrink:0;min-height:var(--control-height);min-width:44px;padding:3px;border:0;background:none;color:var(--ink);font-size:20px}',
    '.dynamic-app-filter .dynamic-app-error{margin:7px 0 0;color:var(--ink);font-size:14px}',
    '.dynamic-activity-list{padding:0;margin:12px 0 0;list-style:none}',
    '.dynamic-activity-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:6px 8px;padding:10px 0;border-top:1px solid var(--line)}',
    '.dynamic-activity-row[data-hidden=true] .dynamic-activity-name,.dynamic-activity-row[data-disabled=true] .dynamic-activity-name{color:var(--muted)}',
    '.dynamic-activity-name{min-width:0;overflow-wrap:anywhere;font-size:15px;font-weight:650}',
    '.dynamic-activity-name small{display:block;font-size:12px;font-weight:400;color:var(--muted)}',
    '.dynamic-activity-row button{width:auto;min-width:44px;min-height:var(--control-height);margin:0;padding:7px;box-shadow:none;border:1px solid var(--line);border-radius:7px;background:var(--field);color:var(--ink);font:inherit;text-transform:none;letter-spacing:0}',
    '.dynamic-activity-row button:disabled{opacity:.45}',
    '.dynamic-activity-handle{touch-action:none;cursor:grab;font-size:21px!important}',
    '.dynamic-activity-move{grid-column:2/4;display:flex;gap:8px}',
    '.dynamic-activity-move button{flex:1;min-width:0}',
    '.dynamic-activity-visible{display:flex!important;align-items:center;gap:8px;min-height:var(--control-height)!important;font-size:16px}',
    '.dynamic-activity-visible input{position:static!important;width:22px!important;height:22px!important;opacity:1!important;margin:0!important}',
    '.dynamic-activity-announcement{font-size:12px!important;min-height:18px;margin-top:7px!important}',
    '.dynamic-reading-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}',
    '.dynamic-reading{padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--field);min-width:0}',
    '.dynamic-reading small,.dynamic-health small{display:block;font-size:12px;color:var(--muted)}',
    '.dynamic-reading strong{display:block;margin:4px 0;font-size:15px;color:var(--ink);overflow-wrap:anywhere}',
    '.dynamic-reading .dynamic-example{font-size:19px;line-height:1.2;color:var(--ink);margin:8px 0}',
    '.dynamic-state{display:block;font-size:12px;color:var(--muted)}',
    '.dynamic-health{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:10px 0;color:var(--ink);font-size:14px}',
    '.dynamic-health+.dynamic-health{border-top:1px solid var(--line)}',
    '.dynamic-health .dynamic-state{text-align:right;max-width:60%}',
    '.dynamic-health-help{font-size:12px!important;margin-top:4px!important}',
    '.dynamic-details{padding:13px 16px;border-top:1px solid var(--line)}',
    '.dynamic-details summary{font-size:16px}',
    '.dynamic-details .component{padding:10px 0!important}',
    '.dynamic-details p{font-size:12px;line-height:1.5;color:var(--muted);overflow-wrap:anywhere}',
    '.dynamic-warning p{color:#a84d00}',
    '@media(prefers-color-scheme:dark){.dynamic-warning p{color:#ffbd77}}',
    '.component-submit{position:fixed;left:0;right:0;bottom:0;max-width:none;margin:0;padding:12px 16px max(16px,env(safe-area-inset-bottom));z-index:20;background:var(--page);border-top:1px solid var(--line);box-shadow:none}.component-submit>*{max-width:480px;margin-left:auto;margin-right:auto}',
    'body.dynamic-picker-open .component-submit{visibility:hidden}',
    '.component-input input,.dynamic-app-entry input,select{scroll-margin-bottom:calc(var(--dynamic-save-height,108px) + 16px)}',
    '.component-submit button{display:block;width:100%;min-width:0;min-height:var(--save-height);margin:0;padding:12px 16px;border:0;border-radius:8px;background:var(--accent);color:var(--on-accent);font:650 16px/1.5 var(--font-family);text-transform:none;letter-spacing:0}',
    '.component-submit button:disabled{opacity:.45}',
    '@media(max-height:420px){.component-submit{position:static;max-width:none;margin:16px 0 0;padding:12px 0;box-shadow:none}body{padding-bottom:24px}}',
    'body.dynamic-actions-flow{padding-bottom:24px}.dynamic-actions-flow .component-submit{position:static;max-width:none;margin:16px 0 0;padding:12px 0;box-shadow:none}',
    '.component-submit .dynamic-reload-saved{margin-top:8px;border:1px solid var(--line);background:var(--field);color:var(--ink);font-weight:650}',
    '.dynamic-save-buttons{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}',
    '.component-submit .dynamic-discard{border:1px solid var(--line);background:var(--field);color:var(--ink);font-weight:650}',
    '#main-form input,#main-form select,.component-select .value,.dynamic-preview-title,.dynamic-activity-name{font-size:16px}',
    '#main-form .dynamic-preview-note,#main-form .dynamic-health-help,.dynamic-details p,.dynamic-state,.dynamic-reading small,.dynamic-health small,.dynamic-activity-name small,.dynamic-activity-announcement{font-size:14px!important}',
    '#main-form button{display:inline-flex;align-items:center;justify-content:center;text-align:center}#main-form .component-submit button{display:flex}.component-select .value{display:flex;align-items:center;line-height:1.5}',
    '@media(max-width:340px){body{padding-left:12px;padding-right:12px}.section>.component{padding-left:12px;padding-right:12px}.dynamic-reading-grid{gap:6px}.dynamic-reading{padding:9px}.component-submit{padding-left:12px;padding-right:12px}}',
    '#main-form [hidden]{display:none!important}',
    '#main-form .dynamic-category{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;margin:0;padding:15px 16px;text-align:left;white-space:normal;text-transform:none;letter-spacing:0;font:inherit;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:var(--card-radius);box-shadow:none}',
    '.dynamic-category-arrow{font-size:24px;flex:none}',
    '.dynamic-route-header{margin-bottom:16px}.dynamic-route-header h2:after{display:none!important}.dynamic-route-header h2{font:700 24px/1.2 var(--font-family);text-transform:none;letter-spacing:0;line-height:1.2;margin:14px 0 0;color:var(--ink)}',
    '#main-form .dynamic-back{width:auto;min-width:0;justify-content:flex-start;min-height:44px;margin:0;padding:8px 0;border:0;box-shadow:none;background:none;color:var(--accent);font:650 16px/1.4 var(--font-family);text-transform:none;letter-spacing:0}',
    '#main-form>.section>.component-heading:first-child{display:none}',
    '#main-form>.dynamic-preview-card{border:1px solid var(--line);border-radius:var(--card-radius);background:var(--card);padding:16px;margin:18px 0}',
    '.dynamic-preview-card:after{display:none!important}',
    '#main-form .dynamic-preview-expand{width:auto;min-height:44px;margin:0;padding:8px 0;border:0;background:none;box-shadow:none;color:var(--accent);font:650 15px/1.4 var(--font-family);text-transform:none;letter-spacing:0;text-align:left;justify-content:flex-start}',
    '.dynamic-preview-controls{width:100%}.dynamic-preview-controls>label{display:block;margin-bottom:12px}',
    '.dynamic-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.dynamic-presets button{flex:1;width:auto;min-width:0;min-height:44px;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--ink);font:inherit;text-transform:none;letter-spacing:0;box-shadow:none;margin:0;padding:8px}',
    '.dynamic-activity-row{grid-template-columns:24px minmax(0,1fr) auto}.dynamic-activity-rank{color:var(--muted);font-size:14px}.dynamic-activity-row .dynamic-activity-handle,.dynamic-activity-row .dynamic-activity-move{display:none!important}',
    '.dynamic-reordering .dynamic-activity-row{grid-template-columns:44px minmax(0,1fr) auto}.dynamic-reordering .dynamic-activity-handle{display:block!important}.dynamic-reordering .dynamic-activity-move{display:flex!important}.dynamic-reordering .dynamic-activity-rank{display:none}',
    '#main-form .dynamic-reorder{margin:8px 0 0;padding:8px 12px;width:auto;min-height:44px;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--ink);font:inherit;text-transform:none;letter-spacing:0;box-shadow:none}',
    '.dynamic-setup{border-top:1px solid var(--line);padding:16px}.dynamic-setup summary{min-height:28px;cursor:pointer;font-weight:650}.dynamic-setup .component{padding:12px 0!important}.dynamic-setup .component:after{display:none}',
    '#main-form .component-submit .dynamic-watch-delivery{padding:0;margin:0 0 8px;font-size:13px}.dynamic-watch-delivery:after{display:none!important}.dynamic-watch-delivery p{display:inline;font-size:13px!important}.dynamic-watch-delivery button{display:inline-flex!important;width:auto!important;min-height:32px!important;margin:0 0 0 8px!important;padding:4px!important;background:none!important;color:var(--accent)!important;font-size:13px!important}',
    '.dynamic-save-info{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:2px 12px;margin-bottom:8px!important}.dynamic-save-info .dynamic-save-state{margin:0!important;min-height:0}.dynamic-save-info .dynamic-watch-delivery{margin:0!important}.dynamic-save-info .dynamic-watch-delivery button{min-height:44px!important}',
    '#main-form .dynamic-preview-card .dynamic-preview-title{overflow-wrap:anywhere;font:650 16px/1.35 var(--font-family);text-transform:none;letter-spacing:0}',
    '.dynamic-health>span{min-width:0;overflow-wrap:anywhere}',
    '.dynamic-preview-stage:focus-visible{outline:var(--focus-width) solid var(--accent);outline-offset:3px}',
  ].join('\n') + (clay.meta.userData.editorStyle || '');
  document.head.appendChild(style);
  var viewport = document.querySelector('meta[name=viewport]');
  if (viewport) { viewport.setAttribute('content','width=device-width,initial-scale=1'); }

  clay.on(clay.EVENTS.AFTER_BUILD, function() {
    function item(id) { return clay.getItemById(id); }
    function field(key) { return clay.getItemByMessageKey(key); }
    function node(value) { return value && value.$element && value.$element[0]; }
    function annotate(items){(items||[]).forEach(function(value){if(value.messageKey){var element=node(clay.getItemByMessageKey(value.messageKey));if(element)element.setAttribute('data-setting',value.messageKey);}if(value.items)annotate(value.items);});}
    annotate(window.clayConfig);
    function clear(element) { while (element.firstChild) { element.removeChild(element.firstChild); } }
    function make(tag, text, className) {
      var element = document.createElement(tag);
      if (text !== undefined && text !== null) { element.textContent = String(text); }
      if (className) { element.className = className; }
      return element;
    }
    function transport(id) {
      var element = node(item(id)), value = {};
      if (element) {
        try { value = JSON.parse(element.textContent || '{}'); } catch (ignored) {}
        element.hidden = true;
      }
      return value && typeof value === 'object' ? value : {};
    }
    var data = transport('dynamic-settings-data');
    var fontKeys=['FONT_WATCHFACE','FONT_CLOCK','FONT_DATE','FONT_READINGS','FONT_ACTIVITIES'];
    var fontPanel;
    var words = transport('dynamic-settings-strings');
    if (window.DynamicFonts) {
      fontKeys.forEach(function(key){show(field(key),false);});
    } else {
      show(item('dynamic-fonts'),false);
      var overrides=make('details',null,'dynamic-details');
      overrides.appendChild(make('summary',t('Font overrides')));
      node(field(fontKeys[0])).after(overrides);
      fontKeys.forEach(function(key,role){
        var row=node(field(key)),select=row.querySelector('select');
        if (select) {
          Array.prototype.forEach.call(select.options,function(option){
            if(Number(option.value)>3)option.textContent=decodeURIComponent(option.textContent);
          });
          if(select.selectedIndex>=0)row.querySelector('.value').textContent=select.options[select.selectedIndex].textContent;
        }
        if (role) {
          overrides.appendChild(row);
          if(Number(field(key).get()))overrides.open=true;
        }
      });
    }
    if (typeof data.language === 'string') { document.documentElement.lang = data.language; }
    var assets = transport('dynamic-preview-assets');
    var watchPlatform = assets.platform;
    try {
      var watchInfo = clay.meta && clay.meta.activeWatchInfo;
      if (!watchInfo && typeof Pebble !== 'undefined' && typeof Pebble.getActiveWatchInfo === 'function') watchInfo = Pebble.getActiveWatchInfo();
      if (watchInfo && watchInfo.platform) watchPlatform = watchInfo.platform;
    } catch (ignored) {}
    var previewAssets = assets;
    var roundPreview = watchPlatform === 'gabbro';
    if (roundPreview && previewAssets.round) assets = Object.assign({},previewAssets,previewAssets.round);
    var previewWidth=roundPreview?260:200,previewHeight=roundPreview?260:228;
    var intro=node(item('dynamic-intro'));if(intro)intro.className+=' dynamic-intro';
    function t(key,params) {
      var text = typeof words[key] === 'string' ? words[key] : key;
      return text.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g,function(match,name) { return params && params[name] !== undefined ? String(params[name]) : match; });
    }
    function show(value, visible) { var element = node(value); if (element) { element.hidden = !visible; } }
    var currentScreen='fonts', lastEditor='fonts', screenScroll={}, previewExpanded=false;
    var sharedPreview=node(item('dynamic-preview'));
    var rootHeading=document.querySelector('#main-form > .component-heading');
    var editorTabs=make('div',null,'dynamic-editor-tabs');
    editorTabs.setAttribute('role','tablist');
    editorTabs.setAttribute('aria-label',t('Settings'));
    sharedPreview.after(editorTabs);
    var secondaryNav=make('nav',null,'dynamic-secondary-nav');
    secondaryNav.setAttribute('aria-label',t('Settings'));
    node(item('dynamic-save-status')).before(secondaryNav);
    var routeHeader=make('header',null,'dynamic-route-header');
    var backButton=make('button','‹ '+t('Watchface editor'),'dynamic-back');
    backButton.type='button';backButton.id='dynamic-back';
    var routeTitle=make('h2');routeTitle.id='dynamic-screen-title';routeTitle.tabIndex=-1;
    routeHeader.appendChild(backButton);routeHeader.appendChild(routeTitle);
    sharedPreview.before(routeHeader);

    var editors=['fonts','colours','layout'];
    var screens={},screenButtons={};
    var routes=[
      ['fonts','Fonts','dynamic-fonts'],
      ['colours','Colours','dynamic-appearance-choice'],
      ['layout','Layout','dynamic-readings'],
      ['activities','Activities','dynamic-activity-order'],
      ['more','Help & status','dynamic-source-status']
    ];
    routes.forEach(function(route){
      var id=route[0],editor=editors.indexOf(id)>=0;
      var section=node(item(route[2])).closest('.section');
      section.id='dynamic-screen-'+id;section.dataset.screen=id;screens[id]=section;
      var button=make('button',t(route[1]),editor?'dynamic-editor-tab':'dynamic-category');
      button.type='button';button.dataset.screen=id;button.id='dynamic-open-'+id;
      button.setAttribute('aria-controls',section.id);
      screenButtons[id]=button;
      if(editor){
        button.setAttribute('role','tab');
        section.setAttribute('role','tabpanel');section.setAttribute('aria-labelledby',button.id);
        editorTabs.appendChild(button);
        button.addEventListener('keydown',function(event){
          var index=editors.indexOf(id);
          if(event.key==='ArrowRight')index=(index+1)%editors.length;
          else if(event.key==='ArrowLeft')index=(index+editors.length-1)%editors.length;
          else if(event.key==='Home')index=0;
          else if(event.key==='End')index=editors.length-1;
          else return;
          event.preventDefault();navigate(editors[index]);
        });
      }else{
        section.setAttribute('aria-labelledby',routeTitle.id);
        var arrow=make('span','›','dynamic-category-arrow');arrow.setAttribute('aria-hidden','true');
        button.appendChild(arrow);secondaryNav.appendChild(button);
      }
      button.addEventListener('click',function(){navigate(id);});
    });

    function navigate(id,focusTarget,initial){
      if(!Object.prototype.hasOwnProperty.call(screens,id))id='fonts';
      var previous=currentScreen,editor=editors.indexOf(id)>=0;
      if(previous==='fonts'&&id!=='fonts'&&fontPanel&&fontPanel.dismiss)fontPanel.dismiss(false);
      if(!initial)screenScroll[previous]=window.scrollY;
      currentScreen=id;
      if(editor)lastEditor=id;
      rootHeading.hidden=!editor;sharedPreview.hidden=!editor;
      editorTabs.hidden=!editor;secondaryNav.hidden=!editor;routeHeader.hidden=editor;
      if(!editor)routeTitle.textContent=t(id==='activities'?'Activities':'Help & status');
      Object.keys(screens).forEach(function(key){screens[key].hidden=key!==id;});
      editors.forEach(function(key){
        screenButtons[key].setAttribute('aria-selected',String(key===id));
        screenButtons[key].tabIndex=key===id?0:-1;
      });
      updateColors();
      requestAnimationFrame(function(){
        if(currentScreen!==id)return;
        var target=focusTarget||(editor?screenButtons[id]:routeTitle);
        if(!initial)target.focus({preventScroll:true});
        window.scrollTo(0,screenScroll[id]||0);
        if(focusTarget)focusTarget.scrollIntoView({block:'nearest'});
      });
    }
    backButton.addEventListener('click',function(){navigate(lastEditor,screenButtons[currentScreen]);});
    function revealField(element){
      var section=element.closest('[data-screen]'),details=element.closest('details');
      if(details)details.open=true;
      if(section)navigate(section.getAttribute('data-screen'),element);
    }
    function choice(id, label, options, value) {
      var host = node(item(id));
      if (!host) { return null; }
      clear(host); host.className += ' dynamic-choice';
      var wrapper = make('label'), title = make('span', label), select = make('select');
      select.id = id + '-select';
      wrapper.setAttribute('for', select.id);
      options.forEach(function(option) {
        var child = make('option', option[1]); child.value = option[0]; select.appendChild(child);
      });
      select.value = String(value); wrapper.appendChild(title); wrapper.appendChild(select); host.appendChild(wrapper);
      return select;
    }
    function state(value) {
      var names = {empty:'sourceEmpty',loading:'sourceLoading',ready:'sourceReady',unavailable:'sourceUnavailable',
        expired:'sourceExpired',denied:'sourceDenied',unsupported:'sourceUnsupported',disabled:'sourceDisabled',playing:'sourcePlaying',
        idle:'sourceIdle',paused:'sourcePaused',off:'sourceOff',waiting:'sourceWaiting',permission:'sourcePermission'};
      return t(names[value] || 'sourceWaiting');
    }
    function nativeColor(value) {
      var number = typeof value === 'number' ? value : parseInt(String(value).replace(/^#|^0x/i,''),16);
      if (!isFinite(number)) { return 0; }
      return [16,8,0].reduce(function(result,shift) {
        return result | (Math.max(0,Math.min(3,Math.round(((number >> shift) & 255) / 85))) * 85 << shift);
      },0);
    }
    function color(key) { return nativeColor(field(key).get()); }
    function css(value) { return '#' + ('000000' + value.toString(16)).slice(-6); }
    var paletteControllers = [];
    clay.getItemsByType('color').forEach(function(value) {
      var element = node(value), opener = element && element.querySelector('label');
      if (!opener) { return; }
      opener.tabIndex = 0;opener.setAttribute('role','button');opener.setAttribute('aria-haspopup','true');
      paletteControllers.push(installPaletteKeyboard(element,opener,document));
    });
    var initialSnapshot = '', appEntry;
    var bridge = window.DynamicSettingsBridge, phonePhase = 'ready', phoneConfirmed = false, reloadSaved, discard, confirmedForm, restoring = false;
    function updateDirty() {}
    var activityHost = node(item('dynamic-activity-order'));
    var activityPreferences = data.activityPreferences || {}, activityOrder = [], activityHidden = [];
    var activityProviders = Object.create(null), activityList, activityAnnouncement;
    var activityPluginSwitch=field('SHOW_ACTIVITIES');
    function providerKey(value) { return typeof value === 'string' &&
      (value === 'builtin:music' || value === 'builtin:notifications' || /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)); }
    (data.activityProviders || []).forEach(function(provider) {
      if (!provider || !providerKey(provider.uuid)) { return; }
      activityProviders[provider.uuid] = {name:String(provider.name || provider.uuid).slice(0,96),available:provider.available !== false};
    });
    activityProviders['builtin:notifications'] = {name:t('notificationsSource'),available:true};
    activityProviders['builtin:music'] = {name:t('musicSource'),available:true};
    var visibleProviderKeys=['builtin:notifications'].concat(Object.keys(activityProviders).filter(function(id) {
      return id !== 'builtin:notifications' && id !== 'builtin:music';
    }),['builtin:music']);
    var unavailableBudget=Math.max(0,64-visibleProviderKeys.length),unavailableCount=0;
    (Array.isArray(activityPreferences.order) ? activityPreferences.order : []).concat(visibleProviderKeys).forEach(function(id) {
      if (!providerKey(id) || activityOrder.indexOf(id) >= 0) { return; }
      // Reserve room for installed apps and built-ins before remembering absent
      // apps. A full old preference list must never hide current controls.
      if (!activityProviders[id] && unavailableCount++ >= unavailableBudget) { return; }
      activityOrder.push(id);
    });
    (Array.isArray(activityPreferences.hidden) ? activityPreferences.hidden : []).forEach(function(id) {
      if (providerKey(id) && activityHidden.indexOf(id) < 0) { activityHidden.push(id); }
    });
    function activityVisibility(id,visible) {
      activityHidden=activityHidden.filter(function(value) { return value !== id; });
      if (!visible) { activityHidden.push(id); }
    }
    activityVisibility('builtin:music',!!field('SHOW_MUSIC').get());
    activityVisibility('builtin:notifications',!!field('SHOW_NOTIFICATIONS').get());
    function activityValue() { return {order:activityOrder.slice(),hidden:activityHidden.slice()}; }
    // A hidden Clay field carries phone-only ordering through its serializer.
    // PKJS removes it before numeric AppMessage conversion; no native key exists.
    var activityPreferenceField = field('__dynamicActivityPreferences');
    show(activityPreferenceField,false);
    function syncActivityValue() { activityPreferenceField.set(JSON.stringify(activityValue())); }
    syncActivityValue();
    function activityName(id) { return activityProviders[id] ? activityProviders[id].name : t('activityUnavailableApp'); }
    function moveActivity(id, target, focusAction) {
      var from = activityOrder.indexOf(id);
      target = Math.max(0,Math.min(activityOrder.length - 1,target));
      if (from < 0 || from === target) { return; }
      activityOrder.splice(from,1); activityOrder.splice(target,0,id); syncActivityValue(); renderActivities(); updateDirty();
      if (activityAnnouncement) { activityAnnouncement.textContent = t('activityMoved',{name:activityName(id),position:target+1}); }
      if (focusAction && activityList) {
        var row = activityList.children[target], button = row && row.querySelector('[data-action="' + focusAction + '"]');
        if (button && !button.disabled) { button.focus(); }
        else if (row) { row.querySelector('.dynamic-activity-handle').focus(); }
      }
    }
    function activityAt(target) {
      while (target && target !== activityList) {
        if (target.getAttribute && target.getAttribute('data-provider')) { return target.getAttribute('data-provider'); }
        target = target.parentNode;
      }
      return null;
    }
    var draggingActivity = null, touchActivityTarget = null;
    function renderActivities() {
      if (!activityList) { return; }
      var focused=document.activeElement,focusedProvider=activityAt(focused);
      var focusedAction=focused && focused.getAttribute && focused.getAttribute('data-action');
      clear(activityList);
      activityOrder.forEach(function(id,index) {
        var provider = activityProviders[id], row = make('li',null,'dynamic-activity-row');
        row.setAttribute('data-provider',id); row.setAttribute('data-hidden',activityHidden.indexOf(id) >= 0 ? 'true' : 'false');
        var disabled=id!=='builtin:music' && id!=='builtin:notifications' && !activityPluginSwitch.get();
        row.setAttribute('data-disabled',disabled?'true':'false');
        var handle = make('button','≡','dynamic-activity-handle'); handle.type = 'button'; handle.draggable = true;
        handle.setAttribute('aria-label',t('activityMove',{name:activityName(id)})); handle.setAttribute('data-action','handle');
        handle.addEventListener('keydown',function(event) {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault(); moveActivity(id,index + (event.key === 'ArrowUp' ? -1 : 1),'handle');
          }
        });
        handle.addEventListener('dragstart',function(event) {
          draggingActivity = id; if (event.dataTransfer) { event.dataTransfer.effectAllowed='move'; event.dataTransfer.setData('text/plain',id); }
        });
        handle.addEventListener('dragend',function() { draggingActivity=null; });
        function moveTouch(x,y) {
          var target = activityAt(document.elementFromPoint(x,y));
          if (target && target !== id) { touchActivityTarget=target; }
          Array.prototype.forEach.call(activityList.children,function(child) {
            child.style.outline=child.getAttribute('data-provider') === touchActivityTarget ? '2px solid var(--accent)' : '';
          });
        }
        function finishTouch() {
          var target=touchActivityTarget; touchActivityTarget=null; draggingActivity=null;
          if (target) { moveActivity(id,activityOrder.indexOf(target),'handle'); }
          else { renderActivities(); }
        }
        if (typeof PointerEvent !== 'undefined') {
          handle.addEventListener('pointerdown',function(event) {
            if (event.pointerType === 'mouse') { return; }
            draggingActivity=id; touchActivityTarget=null; if (handle.setPointerCapture) { handle.setPointerCapture(event.pointerId); }
          });
          handle.addEventListener('pointermove',function(event) {
            if (draggingActivity === id) { event.preventDefault(); moveTouch(event.clientX,event.clientY); }
          });
          handle.addEventListener('pointerup',function() { if (draggingActivity === id) { finishTouch(); } });
          handle.addEventListener('pointercancel',function() { draggingActivity=null; touchActivityTarget=null; renderActivities(); });
        } else {
          handle.addEventListener('touchstart',function() { draggingActivity=id; touchActivityTarget=null; },{passive:true});
          handle.addEventListener('touchmove',function(event) {
            if (draggingActivity !== id || !event.touches.length) { return; }
            event.preventDefault(); moveTouch(event.touches[0].clientX,event.touches[0].clientY);
          },{passive:false});
          handle.addEventListener('touchend',finishTouch);
          handle.addEventListener('touchcancel',function() { draggingActivity=null; touchActivityTarget=null; renderActivities(); });
        }
        row.addEventListener('dragover',function(event) { if (draggingActivity) { event.preventDefault(); } });
        row.addEventListener('drop',function(event) { event.preventDefault(); if (draggingActivity) {
          var moving=draggingActivity; draggingActivity=null; moveActivity(moving,activityOrder.indexOf(id),'handle');
        } });
        row.appendChild(make('span',String(index+1),'dynamic-activity-rank'));row.appendChild(handle);
        var title = make('span',activityName(id),'dynamic-activity-name');
        if (!provider || !provider.available) { title.appendChild(make('small',t('activityUnavailable'))); }
        if (disabled) { title.appendChild(make('small',t('activityPluginsOffHelp'))); }
        row.appendChild(title);
        var label = make('label',null,'dynamic-activity-visible'), toggle = make('input'); toggle.type='checkbox';
        toggle.checked=activityHidden.indexOf(id)<0; toggle.disabled=disabled;
        toggle.setAttribute('data-action','visible'); toggle.setAttribute('aria-label',t('activityShow',{name:activityName(id)}));
        label.appendChild(toggle); label.appendChild(make('span',t('activityVisible'))); row.appendChild(label);
        toggle.addEventListener('change',function() {
          activityVisibility(id,toggle.checked);
          if (id === 'builtin:music') { field('SHOW_MUSIC').set(toggle.checked); }
          if (id === 'builtin:notifications') {
            field('SHOW_NOTIFICATIONS').set(toggle.checked);
            updateNotifications();
          }
          syncActivityValue(); row.setAttribute('data-hidden',toggle.checked?'false':'true'); updateDirty(); renderPreview();
        });
        var moves = make('div',null,'dynamic-activity-move');
        [['up',-1,'activityUp'],['down',1,'activityDown']].forEach(function(action) {
          var button = make('button',t(action[2])); button.type='button'; button.disabled=index+action[1]<0||index+action[1]>=activityOrder.length;
          button.setAttribute('data-action',action[0]); button.setAttribute('aria-label',t(action[2]) + ': ' + activityName(id));
          button.addEventListener('click',function() { moveActivity(id,index+action[1],action[0]); }); moves.appendChild(button);
        });
        row.appendChild(moves); activityList.appendChild(row);
      });
      if (focusedProvider && focusedAction) {
        var replacement=activityList.querySelector('[data-provider="'+focusedProvider+'"] [data-action="'+focusedAction+'"]');
        if (replacement && !replacement.disabled) { replacement.focus(); }
      }
    }
    if (activityHost) {
      clear(activityHost); activityHost.appendChild(make('strong',t('activityPriority')));
      var reorder=make('button',t('Reorder'),'dynamic-reorder');reorder.type='button';reorder.id='dynamic-reorder';reorder.setAttribute('aria-pressed','false');
      reorder.addEventListener('click',function(){var active=activityHost.classList.toggle('dynamic-reordering');reorder.setAttribute('aria-pressed',String(active));reorder.textContent=t(active?'Done':'Reorder');});
      activityHost.appendChild(reorder);
      var orderHelp=make('p',t('activityPriorityHelp'),'description');activityHost.appendChild(orderHelp);orderHelp.hidden=true;
      reorder.addEventListener('click',function(){orderHelp.hidden=!activityHost.classList.contains('dynamic-reordering');});
      activityList=make('ol',null,'dynamic-activity-list'); activityList.setAttribute('aria-label',t('activityPriority')); activityHost.appendChild(activityList);
      activityAnnouncement=make('p','','dynamic-activity-announcement'); activityAnnouncement.setAttribute('aria-live','polite'); activityHost.appendChild(activityAnnouncement);
      renderActivities(); show(field('SHOW_MUSIC'),false);
    }
    activityPluginSwitch.on('change',function() { renderActivities(); renderPreview(); updateDirty(); });
    var bg=field('BACKGROUND_COLOR'),fg=field('TEXT_COLOR'),accent=field('ACCENT_COLOR');
    var paletteInput,paletteStatus,lastPaletteCode;
    var night=field('NIGHT_PALETTE'),appearanceMode=field('APPEARANCE_MODE'),manualAppearance=field('MANUAL_APPEARANCE');
    show(night,false);show(appearanceMode,false);show(manualAppearance,false);
    function nightSelected(){return Number(appearanceMode.get())!==1&&Number(manualAppearance.get())===1;}
    function appearanceValue(){return Number(appearanceMode.get())===0?'legacy':Number(appearanceMode.get())===1?'quiet':nightSelected()?'night':'day';}
    var appearanceOptions=[['day',t('Day palette')],['night',t('Night palette')],['quiet',t('followQuietTime')]];
    if(Number(appearanceMode.get())===0)appearanceOptions.push(['legacy',t('followPebble')]);
    var appearanceChoice=choice('dynamic-appearance-choice',t('Watch appearance'),appearanceOptions,appearanceValue());
    if(appearanceChoice.querySelector('[value="legacy"]'))appearanceChoice.querySelector('[value="legacy"]').disabled=true;
    var editingPalette=choice('dynamic-edit-palette',t('Editing palette'),[['day',t('Day palette')],['night',t('Night palette')]],nightSelected()?'night':'day');
    var previewPalette;
    function previewNight(){
      return currentScreen==='colours'?editingPalette.value==='night':previewPalette?previewPalette.value==='quiet':nightSelected();
    }
    var presetHost=node(item('dynamic-theme'));clear(presetHost);presetHost.appendChild(make('strong',t('Colour presets')));
    var presets=make('div',null,'dynamic-presets');presetHost.appendChild(presets);
    ['light','dark'].forEach(function(preset){
      var button=make('button',t(preset==='light'?'themeLight':'themeDark'));button.type='button';button.setAttribute('data-preset',preset);
      button.addEventListener('click',function(){
        var prefix=editingPalette.value==='night'?'NIGHT_':'';
        field(prefix+'BACKGROUND_COLOR').set(preset==='light'?0xffffff:0);
        field(prefix+'TEXT_COLOR').set(preset==='light'?0:0xffffff);
        updateColors();updateDirty();
      });presets.appendChild(button);
    });
    var paletteRoles=['BACKGROUND_COLOR','TEXT_COLOR','ACCENT_COLOR','LOWER_BACKGROUND_COLOR','LOWER_TEXT_COLOR'];
    paletteRoles.forEach(function(key){
      var day=node(field(key)).querySelector('.label'),dark=node(field('NIGHT_'+key)).querySelector('.label');
      if(day&&dark)dark.textContent=day.textContent;
      field(key).on('change',updateColors);field('NIGHT_'+key).on('change',updateColors);
    });
    function updateColors(){
      var editingNight=editingPalette.value==='night',split=!!field('SCREEN_SPLIT').get();
      paletteRoles.forEach(function(key,index){show(field(key),!editingNight&&(index<3||split));show(field('NIGHT_'+key),editingNight&&(index<3||split));});
      show(item('dynamic-palette-code'),!editingNight);
      var contrast=node(item('dynamic-contrast'));
      function luminance(value){return [16,8,0].map(function(shift){var channel=((value>>shift)&255)/255;return channel<=.04045?channel/12.92:Math.pow((channel+.055)/1.055,2.4);}).reduce(function(sum,channel,index){return sum+channel*[.2126,.7152,.0722][index];},0);}
      function ratio(first,second){var a=luminance(first),b=luminance(second);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
      var prefix=editingNight?'NIGHT_':'',background=color(prefix+'BACKGROUND_COLOR'),foreground=color(prefix+'TEXT_COLOR');
      var low=ratio(background,foreground)<4.5||split&&ratio(color(editingNight?'NIGHT_LOWER_BACKGROUND_COLOR':'LOWER_BACKGROUND_COLOR'),color(editingNight?'NIGHT_LOWER_TEXT_COLOR':'LOWER_TEXT_COLOR'))<4.5;
      var adjusted=ratio(background,color(prefix+'ACCENT_COLOR'))<2;
      if(contrast){contrast.classList.add('dynamic-warning');contrast.hidden=!low&&!adjusted;clear(contrast);contrast.appendChild(make('p',t(low?'contrastHelp':'accentContrastHelp')));}
      updatePaletteCode();renderPreview();
    }
    appearanceChoice.addEventListener('change',function(){
      if(appearanceChoice.value==='quiet')appearanceMode.set(1);
      else if(appearanceChoice.value!=='legacy'){manualAppearance.set(appearanceChoice.value==='night'?1:0);appearanceMode.set(2);}
      updateNight();updateDirty();
    });
    editingPalette.addEventListener('change',updateColors);

    function paletteCode() {
      return 'DYN1-' + ['BACKGROUND_COLOR','TEXT_COLOR','ACCENT_COLOR'].map(function(key) { return css(color(key)).slice(1).toUpperCase(); }).join('-');
    }
    function updatePaletteCode(force){
      var code=paletteCode(),changed=lastPaletteCode!==code;
      if(paletteInput&&(force||!paletteInput.value||paletteInput.value===lastPaletteCode)){paletteInput.value=code;paletteInput.setCustomValidity('');}
      lastPaletteCode=code;
      if(changed&&paletteStatus)paletteStatus.textContent='';
    }
    var paletteHost = node(item('dynamic-palette-code'));
    if (paletteHost) {
      clear(paletteHost); paletteHost.className += ' dynamic-palette-code';
      var paletteDetails=make('details',null,'dynamic-palette-details');
      paletteDetails.appendChild(make('summary',t('Share day colours')));paletteHost.appendChild(paletteDetails);
      paletteHost=paletteDetails;
      var paletteLabel = make('label',t('paletteInput')); paletteLabel.setAttribute('for','dynamic-palette-input'); paletteHost.appendChild(paletteLabel);
      paletteInput = make('input'); paletteInput.id = 'dynamic-palette-input'; paletteInput.type = 'text'; paletteInput.maxLength = 32;
      paletteInput.autocomplete = 'off'; paletteInput.spellcheck = false; paletteInput.setAttribute('autocapitalize','characters');
      paletteInput.setAttribute('aria-label',t('paletteInput')); paletteInput.setAttribute('aria-describedby','dynamic-palette-help dynamic-palette-status');
      paletteHost.appendChild(paletteInput);
      var paletteActions = make('div',null,'dynamic-palette-actions');
      var copyPalette = make('button',t('paletteCopy')), applyPalette = make('button',t('paletteApply'));
      copyPalette.type = applyPalette.type = 'button'; copyPalette.id = 'dynamic-palette-copy'; applyPalette.id = 'dynamic-palette-apply';
      paletteActions.appendChild(copyPalette); paletteActions.appendChild(applyPalette); paletteHost.appendChild(paletteActions);
      var paletteHelp = make('p',t('paletteCodeHelp'),'description'); paletteHelp.id = 'dynamic-palette-help'; paletteHost.appendChild(paletteHelp);
      paletteStatus = make('p','','description'); paletteStatus.id = 'dynamic-palette-status'; paletteStatus.setAttribute('role','status'); paletteStatus.setAttribute('aria-live','polite'); paletteHost.appendChild(paletteStatus);
      paletteInput.addEventListener('input',function() { paletteInput.setCustomValidity(''); paletteStatus.textContent = ''; });
      applyPalette.addEventListener('click',function() {
        var match = /^DYN1-([0-9A-F]{6})-([0-9A-F]{6})-([0-9A-F]{6})$/i.exec(paletteInput.value.trim());
        if (!match) { paletteStatus.textContent = t('paletteInvalid'); paletteInput.focus(); return; }
        [bg,fg,accent].forEach(function(value,index) { value.set(nativeColor(parseInt(match[index+1],16))); });
        updateColors(); updateDirty(); paletteStatus.textContent = t('paletteApplied');
      });
      copyPalette.addEventListener('click',function() {
        updatePaletteCode(true); paletteInput.focus(); paletteInput.select();
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(paletteInput.value).then(function() { paletteStatus.textContent = t('paletteCopied'); },function() { paletteStatus.textContent = t('paletteSelectCopy'); });
        } else {
          var copied = false; try { copied = document.execCommand('copy'); } catch (ignored) {}
          paletteStatus.textContent = t(copied ? 'paletteCopied' : 'paletteSelectCopy');
        }
      });
      updatePaletteCode();
    }
    function updateNight(){
      var mode=Number(appearanceMode.get());
      if(!!night.get()!==(mode===1))night.set(mode===1);
      appearanceChoice.value=appearanceValue();show(item('dynamic-appearance-unavailable'),mode===0);
      if(previewPalette)previewPalette.value=nightSelected()?'quiet':'day';
      updateColors();updateDirty();
    }
    night.on('change',updateNight);appearanceMode.on('change',updateNight);manualAppearance.on('change',updateNight);
    updateNight();

    var notification = field('SHOW_NOTIFICATIONS'), preview = field('NOTIFICATION_PREVIEW'), appOnly = field('NOTIFICATION_APP_ONLY'), vibration = field('NOTIFICATION_VIBRATION'), apps = field('NOTIFICATION_APPS');
    var noticeMode = choice('dynamic-notification-mode',t('notificationDetails'),[
      ['app',t('notificationAppOnly')],['summary',t('notificationSummary')],['preview',t('notificationPreview')]
    ],appOnly.get() ? 'app' : preview.get() ? 'preview' : 'summary');
    var appMode = choice('dynamic-app-mode',t('notificationAppsMode'),[
      ['all',t('allApps')],['selected',t('selectedApps')]
    ],String(apps.get() || '').trim() ? 'selected' : 'all');
    function parsedApps(value) {
      var seen = Object.create(null); return String(value || '').split(',').map(function(name) { return name.trim(); }).filter(function(name) {
        if (!name || seen[name.toLowerCase()]) { return false; } seen[name.toLowerCase()] = true; return true;
      });
    }
    var entries = parsedApps(apps.get()), appHost = make('div',null,'component dynamic-app-filter');
    var appLabel = make('label',t('appEntryLabel')); appLabel.setAttribute('for','dynamic-app-entry'); appHost.appendChild(appLabel);
    var entryRow = make('div',null,'dynamic-app-entry');
    appEntry = make('input'); appEntry.id = 'dynamic-app-entry'; appEntry.type = 'text'; appEntry.maxLength = 160;
    appEntry.autocomplete = 'off'; appEntry.setAttribute('autocapitalize','none'); appEntry.spellcheck = false;
    var addApp = make('button',t('appAdd')); addApp.type = 'button'; addApp.id = 'dynamic-app-add';
    entryRow.appendChild(appEntry); entryRow.appendChild(addApp); appHost.appendChild(entryRow);
    var chips = make('ul',null,'dynamic-app-chips'); chips.setAttribute('aria-label',t('selectedApps')); appHost.appendChild(chips);
    var appHelp = make('p',t('appEntryHelp'),'description'); appHelp.id='dynamic-app-help';appHost.appendChild(appHelp);
    appEntry.setAttribute('aria-describedby','dynamic-app-help dynamic-app-error');
    var appError = make('p','','dynamic-app-error'); appError.id='dynamic-app-error';appError.setAttribute('aria-live','polite');appHost.appendChild(appError);
    var canonicalInput = apps.$manipulatorTarget && apps.$manipulatorTarget[0];
    if (canonicalInput) { canonicalInput.required = false; canonicalInput.setCustomValidity(''); }
    var appNode = node(apps); appNode.parentNode.insertBefore(appHost,appNode);
    show(notification,false); show(preview,false); show(appOnly,false); show(apps,false);
    function appValidity(message) {
      var enabled = notification.get() && appMode.value === 'selected';
      appEntry.required = enabled && !entries.length;
      if (enabled && !entries.length && !appEntry.value.trim() && !message) { message = t('appFilterRequired'); }
      appEntry.setCustomValidity(enabled ? message || '' : '');
      appError.textContent = enabled ? message || '' : '';
    }
    function draftAppError() {
      var value = appEntry.value.trim();
      if (value && /[,\x00-\x1f\x7f]/.test(value)) { return t('appInvalid'); }
      if (value && entries.some(function(name) { return name.toLowerCase() === value.toLowerCase(); })) { return t('appDuplicate'); }
      if (entries.concat(value ? [value] : []).join(', ').length > 160) { return t('appLimit'); }
      return '';
    }
    function renderApps() {
      clear(chips);
      entries.forEach(function(name,index) {
        var chip = make('li',null,'dynamic-app-chip'), text = make('span',name), remove = make('button','×');
        remove.type='button'; remove.setAttribute('aria-label',t('appRemove',{app:name}));
        remove.addEventListener('click',function() {
          entries.splice(index,1); renderApps();
          var remaining = chips.querySelectorAll('button');
          (remaining[Math.min(index,remaining.length-1)] || addApp).focus();
          updateDirty();
        });
        chip.appendChild(text);chip.appendChild(remove);chips.appendChild(chip);
      });
      apps.set(appMode.value === 'selected' ? entries.join(', ') : '');
      appValidity(draftAppError()); updateDirty();
    }
    function commitApp(report) {
      var value = appEntry.value.trim(), error = draftAppError();
      if (error) { appValidity(error); if (report) { appEntry.reportValidity(); } return false; }
      if (!value) { appValidity(''); if (report && !entries.length) { appEntry.reportValidity(); } return entries.length > 0; }
      entries.push(value);appEntry.value='';renderApps();return true;
    }
    addApp.addEventListener('click',function() { commitApp(true); });
    appEntry.addEventListener('keydown',function(event) { if (event.key === 'Enter') { event.preventDefault();commitApp(true); } });
    appEntry.addEventListener('input',function() { appValidity(draftAppError()); updateDirty(); });
    function updateNotifications() {
      var enabled = !!notification.get();
      activityVisibility('builtin:notifications',enabled);
      syncActivityValue(); renderActivities();
      if (enabled) {
        appOnly.set(noticeMode.value === 'app');
        if (noticeMode.value !== 'app') { preview.set(noticeMode.value === 'preview'); }
      }
      show(vibration,enabled);
      show(item('dynamic-notification-mode'),enabled);
      show(item('dynamic-notification-disabled'),!enabled);
      show(item('dynamic-notification-help'),enabled);
      var privacy = node(item('dynamic-notification-help'));
      if (privacy) { clear(privacy); privacy.appendChild(make('p',t('notificationsHelp')));
        if (noticeMode.value === 'summary') { privacy.appendChild(make('p',t('notificationSummaryHelp'))); }
        if (noticeMode.value === 'app') { privacy.appendChild(make('p',t('notificationAppOnlyHelp'))); }
      }
      show(item('dynamic-app-mode'),enabled); appHost.hidden = !enabled || appMode.value !== 'selected';
      appValidity(draftAppError()); renderPreview(); updateDirty();
    }
    noticeMode.addEventListener('change',updateNotifications);
    appMode.addEventListener('change',function() { renderApps(); updateNotifications(); });
    renderApps();

    var readings = node(item('dynamic-readings'));
    function renderReadings(){
      if(!readings)return;
      var description=node(field('READING_LAYOUT')).querySelector('.description');if(description)description.hidden=Number(field('READING_LAYOUT').get())!==2;
      var paging=!!field('SHAKE_READINGS').get(),four=Number(field('READING_LAYOUT').get())===2;
      clear(readings); readings.appendChild(make('strong',t(paging?'Shake to switch readings':four?'Four when idle':'twoReadings')));
      var grid = make('div',null,'dynamic-reading-grid');
      (paging?[0,1,2,3,4]:four?[0,1,2,3]:[0,1]).forEach(function(index) {
        var slot = (data.slots || [])[index] || {}, card = make('div',null,'dynamic-reading');
        card.appendChild(make('small',paging||Number(field('READING_LAYOUT').get())!==0?t('readingSlot',{slot:index+1}):t(index ? 'rightReading' : 'leftReading')));
        var propertyKeys = {temperature:'readingTemperature',feels_like:'readingFeelsLike',high:'readingHigh',low:'readingLow',condition:'readingCondition',condition_code:'readingCondition',humidity:'readingHumidity',wind_speed:'readingWindSpeed',wind_direction:'readingWindDirection',precipitation:'readingRain',uv_index:'readingUv',battery_level:'readingBattery',title:'readingTitle',artist:'readingArtist',name:'readingName'};
        var property = slot.category === 'phone' && slot.property === 'battery_level' ? t('phoneSource') : propertyKeys[slot.property] ? t(propertyKeys[slot.property]) : '';
        var label = slot.label && String(slot.label).toLowerCase() !== String(slot.property || '').toLowerCase() ? slot.label : property || slot.label;
        card.appendChild(make('strong',label || state(slot.status || 'empty')));
        if (property && property !== label) { card.appendChild(make('small',property)); }
        if (slot.value !== undefined && slot.value !== '') { card.appendChild(make('div',slot.value,'dynamic-example')); }
        if (label) { card.appendChild(make('span',state(slot.status || 'empty'),'dynamic-state')); }
        var age = typeof slot.observationAgeSec === 'number' && isFinite(slot.observationAgeSec) && slot.observationAgeSec >= 0 ? ['observedAge',slot.observationAgeSec] :
          typeof slot.receivedAgeSec === 'number' && isFinite(slot.receivedAgeSec) && slot.receivedAgeSec >= 0 ? ['receivedAge',slot.receivedAgeSec] : null;
        if (age) { card.appendChild(make('small',age[1] < 60 ? t(age[0] === 'observedAge' ? 'justObserved' : 'justReceived') : t(age[0],{age:Math.floor(age[1]/60)}))); }
        var recovery = slot.status === 'denied' || slot.status === 'permission' ? 'permissionHelp' :
          slot.status === 'empty' || !slot.status ? 'readingSetupHelp' :
          ['expired','unavailable','unsupported','disabled'].indexOf(slot.status) >= 0 ? 'sourceNoUpdateHelp' : '';
        if (recovery) { card.appendChild(make('small',t(recovery))); }
        grid.appendChild(card);
      }); readings.appendChild(grid);
      var help=node(item('dynamic-reading-help'));if(help){clear(help);var guidance=t('complicationsHelp');if(paging||four)guidance=guidance.replace(/\b1\b.*?\b2\b/,paging?'1–5':'1–4');help.appendChild(make('p',guidance));help.appendChild(make('p',t('sharedReadingsHelp'),'description'));}
    }
    var readingHelp=node(item('dynamic-reading-help'));
    var readingDetails=make('details',null,'dynamic-setup');readingDetails.id='dynamic-reading-setup';
    readingDetails.appendChild(make('summary',t('Choose complications')));
    readings.parentNode.insertBefore(readingDetails,readings);readingDetails.appendChild(readings);readingDetails.appendChild(readingHelp);
    renderReadings();
    field('SHAKE_READINGS').on('change',renderReadings);field('READING_LAYOUT').on('change',renderReadings);
    [['dynamic-repository','https://github.com/xefensor/pebble-watchface-dynamic'],['dynamic-issues','https://github.com/xefensor/pebble-watchface-dynamic/issues']].forEach(function(pair){
      var host=node(item(pair[0]));if(!host)return;
      var label=host.textContent.replace(pair[1],'').trim(),link=make('a',label);
      link.href=pair[1];link.target='_blank';link.rel='noopener noreferrer';
      clear(host);host.appendChild(link);
    });
    var health = node(item('dynamic-source-status'));
    if (health) {
      clear(health);
      [['music','musicSource'],['notifications','notificationsSource'],['phone','phoneSource'],['activities','activitiesSource']].forEach(function(pair) {
        var source = data.sources && data.sources[pair[0]] || {}, row = make('div',null,'dynamic-health');
        row.appendChild(make('span',t(pair[1]))); row.appendChild(make('span',state(pair[0] !== 'music' && source.state === 'idle' ? 'ready' : source.state),'dynamic-state'));
        health.appendChild(row);
        var recovery = source.message === 'DISCONNECTED' ? 'connectionHelp' : source.state === 'denied' || source.state === 'permission' ? 'permissionHelp' :
          source.state === 'disabled' || source.state === 'unavailable' ? 'pluginHelp' : '';
        if (recovery) { health.appendChild(make('p',t(recovery),'dynamic-health-help')); }
      });
    }
    var saveStatus = node(item('dynamic-save-status')), saveMessage;
    var submitHost = document.querySelector('.component-submit');
    var saveButton = submitHost.querySelector('button');
    function visibleViewport() {
      var view=window.visualViewport,top=view?view.offsetTop:0;
      return {top:top,bottom:top+(view?view.height:window.innerHeight),height:view?view.height:window.innerHeight};
    }
    var saveFrame=false,lastSaveHeight,lastSaveFlow;
    function saveSpace() {
      if(saveFrame)return;
      saveFrame=true;
      (window.requestAnimationFrame||function(callback){return window.setTimeout(callback,16);})(function(){
        saveFrame=false;measureSaveSpace();
      });
    }
    function measureSaveSpace() {
      if (!submitHost) { return; }
      var flow=visibleViewport().height<=420;
      if(flow!==lastSaveFlow){document.body.classList.toggle('dynamic-actions-flow',flow);lastSaveFlow=flow;}
      var fixed=window.getComputedStyle(submitHost).position==='fixed';
      var height=fixed?Math.ceil(submitHost.getBoundingClientRect().height)+'px':'0px';
      if(height!==lastSaveHeight){document.documentElement.style.setProperty('--dynamic-save-height',height);lastSaveHeight=height;}
    }
    function focusedVisible(target) {
      target=target||document.activeElement;
      if(!target||['INPUT','SELECT'].indexOf(target.tagName)<0||target.type==='checkbox'||target.type==='hidden')return;
      var viewport=visibleViewport(),rect=target.getBoundingClientRect();
      var fixed=submitHost&&window.getComputedStyle(submitHost).position==='fixed'&&!document.body.classList.contains('dynamic-picker-open');
      var bottom=(fixed?Math.min(viewport.bottom,submitHost.getBoundingClientRect().top):viewport.bottom)-12;
      if(rect.bottom>bottom)window.scrollBy(0,rect.bottom-bottom);
      else if(rect.top<viewport.top+8)window.scrollBy(0,rect.top-viewport.top-8);
    }
    if (saveStatus && submitHost) {
      saveStatus.className += ' dynamic-save-state'; saveStatus.setAttribute('role','status'); saveStatus.setAttribute('aria-live','polite');
      clear(saveStatus);saveMessage=make('p');saveStatus.appendChild(saveMessage);
      submitHost.insertBefore(saveStatus,submitHost.firstChild);
    }
    if (bridge && submitHost) {
      saveButton.classList.add('dynamic-primary-save');
      var actions = make('div',null,'dynamic-save-buttons');
      discard = make('button',t('phoneDiscard'),'dynamic-discard'); discard.type = 'button';
      discard.addEventListener('click',function() {
        if (phonePhase === 'saving' || phonePhase === 'uncertain' || !confirmedForm) return;
        restoring = true;
        function previous(name) { var value = confirmedForm[name]; return value && typeof value === 'object' ? value.value : value; }
        noticeMode.value = previous('NOTIFICATION_APP_ONLY') ? 'app' : previous('NOTIFICATION_PREVIEW') ? 'preview' : 'summary';
        appMode.value = previous('NOTIFICATION_APPS') ? 'selected' : 'all';
        entries = String(previous('NOTIFICATION_APPS') || '').split(',').map(function(value){return value.trim();}).filter(Boolean);
        appEntry.value = '';
        Object.keys(confirmedForm).forEach(function(name) { var value = field(name); if (value) value.set(previous(name)); });
        var preferences = JSON.parse(previous('__dynamicActivityPreferences') || '{}');
        activityOrder = (preferences.order || []).slice(); activityHidden = (preferences.hidden || []).slice();
        syncActivityValue();
        if(fontPanel){fontPanel.dismiss(false);fontPanel.refresh();}
        renderApps(); updateNotifications(); updateColors(); renderActivities();
        phonePhase = 'ready'; restoring = false; updateDirty();
      });
      saveButton.parentNode.insertBefore(actions,saveButton); actions.appendChild(discard); actions.appendChild(saveButton);
      reloadSaved = make('button',t('phoneReload'),'dynamic-reload-saved');
      reloadSaved.type = 'button'; reloadSaved.hidden = true;
      reloadSaved.addEventListener('click',function(){bridge.reload({screen:currentScreen,editor:lastEditor,scroll:window.scrollY});});
      submitHost.appendChild(reloadSaved);
    }
    function signature() {
      return JSON.stringify(['SCREEN_SPLIT','READING_LAYOUT','HIDE_READING_TITLES','SHAKE_READINGS','LOWER_BACKGROUND_COLOR','LOWER_TEXT_COLOR','NIGHT_LOWER_BACKGROUND_COLOR','NIGHT_LOWER_TEXT_COLOR','BACKGROUND_COLOR','TEXT_COLOR','ACCENT_COLOR','CLOCK_FORMAT','ANIMATIONS','SHOW_STATUS','SHOW_ACTIVITIES','SHOW_MUSIC','SHOW_NOTIFICATIONS','NOTIFICATION_PREVIEW','NOTIFICATION_APP_ONLY','NOTIFICATION_VIBRATION','NOTIFICATION_APPS','NIGHT_PALETTE','NIGHT_BACKGROUND_COLOR','NIGHT_TEXT_COLOR','NIGHT_ACCENT_COLOR','TEXT_SIZE','APPEARANCE_MODE','MANUAL_APPEARANCE'].concat(fontKeys).map(function(key) { return field(key).get(); }).concat([notification.get() && appMode.value === 'selected' ? appEntry.value.trim() : '',activityValue()]));
    }
    updateDirty = function() {
      if (!initialSnapshot || restoring) { return; }
      var dirty = signature() !== initialSnapshot;
      var saved = data.save && data.save.state || 'none';
      var key = bridge ? phonePhase === 'saving' ? 'saveSending' : phonePhase === 'uncertain' ? 'phoneSaveUncertain' :
        phonePhase === 'failed' ? 'phoneSaveFailed' : dirty ? 'saveUnsaved' : phoneConfirmed ? 'phoneSaved' : 'phoneNoChanges' :
        dirty ? 'saveUnsaved' : saved === 'saved' ? 'saveLastDelivered' : saved === 'pending' || saved === 'failed' ? 'savePhoneWaiting' : 'saveNone';
      setLiveText(saveMessage,t(key));
      saveButton.disabled=bridge ? phonePhase==='saving'||!dirty&&phonePhase!=='uncertain'&&phonePhase!=='failed' : !dirty;
      if (reloadSaved) { reloadSaved.hidden = phonePhase !== 'uncertain'; reloadSaved.disabled = phonePhase === 'saving'; }
      if (discard) discard.disabled = !dirty || phonePhase === 'saving' || phonePhase === 'uncertain';
      var editable=phonePhase!=='saving'&&(dirty||phonePhase==='failed'||phonePhase==='uncertain');
      if(actions)actions.hidden=!editable;
      else saveButton.hidden=!editable;
      if(discard)discard.hidden=phonePhase==='uncertain';
      submitHost.classList.toggle('dynamic-action-draft',editable);
      submitHost.classList.toggle('dynamic-action-status',!editable);
      updateDisplay();saveSpace();
    };
    var activityHelp=node(item('dynamic-activity-help')),activitySetup=make('details',null,'dynamic-setup');
    activitySetup.appendChild(make('summary',t('Activity setup')));activityHelp.parentNode.insertBefore(activitySetup,activityHelp);activityHelp.hidden=true;
    for(var helpIndex=0;helpIndex<5;++helpIndex){var helpNode=node(item('dynamic-activity-help-'+helpIndex));if(helpNode){if(helpIndex===0)helpNode.hidden=true;activitySetup.appendChild(helpNode);}}
    var technical = node(item('complications-status')), context = node(item('context-status'));
    if (technical && context) {
      var details = make('details',null,'dynamic-details'); details.appendChild(make('summary',t('technicalDetails')));
      technical.parentNode.insertBefore(details,technical); details.appendChild(technical); context.hidden=true;
      [['music','musicSource'],['notifications','notificationsSource'],['phone','phoneSource'],['activities','activitiesSource']].forEach(function(pair) {
        var source = data.sources && data.sources[pair[0]];
        if (source && source.message) { details.appendChild(make('p',t(pair[1]) + ': ' + source.message)); }
      });
      (data.slots || []).forEach(function(slot,index) {
        var lines = [t('readingSlot',{slot:index+1}) + ': ' + [slot.category,slot.item,slot.property].filter(Boolean).join('/')];
        [['receivedAge','receivedAgeSec'],['observedAge','observationAgeSec']].forEach(function(pair) {
          var age = slot[pair[1]]; if (typeof age === 'number' && isFinite(age) && age >= 0) { lines.push(t(pair[0],{age:Math.floor(age/60)})); }
        });
        if (slot.help) { lines.push(slot.help); }
        details.appendChild(make('p',lines.join(' · ')));
      });
    }

    var previewHost = sharedPreview, canvas, previewCaption, timelineCaption, disabledCaption, formatCaption, previewState = 'idle', request = 0, imageCache = {};
    if (previewHost) {
      clear(previewHost);
      previewHost.appendChild(make('h3',t('Watch preview'),'dynamic-preview-title'));
      var sceneLabel=make('label',null,'dynamic-preview-scene');
      sceneLabel.appendChild(make('span',t('Scene')));
      var sceneSelect=make('select');sceneSelect.id='dynamic-preview-scene';
      [['idle','previewIdle'],['music','previewMusic'],['timer','previewTimer'],['notification-summary','previewBanner'],['notification','previewMessage'],['timeline','previewTimeline']].forEach(function(pair){
        var option=make('option',t(pair[1]));option.value=pair[0];sceneSelect.appendChild(option);
      });
      sceneLabel.appendChild(sceneSelect);previewHost.appendChild(sceneLabel);
      sceneSelect.addEventListener('change',function(){previewState=sceneSelect.value;renderPreview();});
      var pageLabel=make('label',t('readingPage'),'dynamic-choice'),pageChoice=make('select');
      pageChoice.setAttribute('aria-label',t('readingPage'));pageChoice.id='dynamic-reading-page';
      ['1–2','3–4','5'].forEach(function(text,index){var option=make('option',text);option.value=String(index);pageChoice.appendChild(option);});
      pageLabel.appendChild(pageChoice);previewHost.appendChild(pageLabel);pageChoice.addEventListener('change',renderPreview);
      var stage = make('div',null,'dynamic-preview-stage');
      stage.id='dynamic-preview-panel';
      var paletteChoice = make('label',null,'dynamic-choice dynamic-preview-palette');
      paletteChoice.setAttribute('for','dynamic-preview-palette-select');
      paletteChoice.appendChild(make('span',t('previewPalette')));
      previewPalette = make('select'); previewPalette.id = 'dynamic-preview-palette-select';
      [['day','Day palette'],['quiet','Night palette']].forEach(function(pair) {
        var option = make('option',t(pair[1])); option.value = pair[0]; previewPalette.appendChild(option);
      });
      previewPalette.setAttribute('aria-describedby','dynamic-preview-palette-help');
      paletteChoice.appendChild(previewPalette);
      var paletteHelp = make('span',t('Preview only; this does not change the active palette.'),'description'); paletteHelp.id = 'dynamic-preview-palette-help';
      paletteChoice.appendChild(paletteHelp); paletteChoice.hidden = currentScreen==='colours';
      previewHost.appendChild(paletteChoice); previewPalette.addEventListener('change',renderPreview);
      if (watchPlatform !== 'gabbro' && watchPlatform !== 'emery') {
        var watchChoice = make('label',null,'dynamic-choice dynamic-preview-palette');
        watchChoice.setAttribute('for','dynamic-preview-watch');watchChoice.appendChild(make('span',t('previewWatch')));
        var watchSelect = make('select');watchSelect.id='dynamic-preview-watch';
        [['emery','Time 2'],['gabbro','Round 2']].forEach(function(pair){var option=make('option',pair[1]);option.value=pair[0];watchSelect.appendChild(option);});
        watchChoice.appendChild(watchSelect);
        var watchHelp=make('span',t('previewWatchHelp'),'description');watchHelp.id='dynamic-preview-watch-help';watchChoice.appendChild(watchHelp);
        watchSelect.setAttribute('aria-describedby',watchHelp.id);previewHost.appendChild(watchChoice);
        watchSelect.addEventListener('change',function(){
          roundPreview=watchSelect.value==='gabbro';assets=roundPreview?Object.assign({},previewAssets,previewAssets.round):previewAssets;
          previewWidth=roundPreview?260:200;previewHeight=roundPreview?260:228;
          canvas.width=previewWidth;canvas.height=previewHeight;canvas.style.width=previewWidth+'px';canvas.style.aspectRatio=previewWidth+'/'+previewHeight;
          stage.style.width=(previewWidth+12)+'px';stage.style.borderRadius=roundPreview?'50%':'';imageCache={};renderPreview();
        });
      }
      canvas = make('canvas'); canvas.id = 'dynamic-preview-canvas'; canvas.width = previewWidth; canvas.height = previewHeight;
      canvas.style.width=previewWidth+'px';canvas.style.height='auto';canvas.style.aspectRatio=previewWidth+'/'+previewHeight;
      stage.style.width=(previewWidth+12)+'px';
      if(roundPreview)stage.style.borderRadius='50%'; canvas.setAttribute('role','img');
      stage.appendChild(canvas); previewHost.appendChild(stage);
      disabledCaption = make('p',t('previewDisabled'),'dynamic-preview-note dynamic-example-disabled'); previewHost.appendChild(disabledCaption);
      formatCaption = make('p',t('previewUnknownFormat'),'dynamic-preview-note'); previewHost.appendChild(formatCaption);
      previewCaption = make('p',t('previewSettingsNote'),'dynamic-preview-note'); previewHost.appendChild(previewCaption);
      timelineCaption = make('p',t('previewTimelineHelp'),'dynamic-preview-note'); timelineCaption.hidden = true; previewHost.appendChild(timelineCaption);
    }
    // One mounted preview follows the active screen; expanding never edits settings.
    var previewControls=make('div',null,'dynamic-preview-controls');previewControls.id='dynamic-preview-controls';
    var previewExpand=make('button',t('Preview options'),'dynamic-preview-expand');
    previewExpand.id='dynamic-preview-expand';previewExpand.type='button';previewExpand.setAttribute('aria-controls',previewControls.id);
    [pageLabel,paletteChoice,watchChoice,disabledCaption,formatCaption,timelineCaption].forEach(function(element){
      if(element)previewControls.appendChild(element);
    });
    previewHost.classList.add('dynamic-preview-card');
    previewHost.appendChild(previewExpand);previewHost.appendChild(previewControls);
    function updatePreviewMode(){
      pageLabel.hidden=!field('SHAKE_READINGS').get();
      paletteChoice.hidden=currentScreen==='colours';
      previewExpand.hidden=!previewControls.querySelector(':scope > :not([hidden])');
      previewControls.hidden=previewExpand.hidden||!previewExpanded;
      previewExpand.setAttribute('aria-expanded',String(!previewControls.hidden));
    }
    previewExpand.addEventListener('click',function(){previewExpanded=!previewExpanded;updatePreviewMode();renderPreview();});
    function previewFontRole(role){
      if(role===0)return;
      previewState=role===4?'music':'idle';
      sceneSelect.value=previewState;
      renderPreview();
    }
    function previewDescription(key){return key==='layoutApproximation'||key==='noExample'?t(key):t('sampleHelp')+(previewExpanded?' '+t(key):'');}
    function drawLayoutPreview(){
      var ctx=canvas.getContext('2d'),nightMode=previewNight();
      var bg=color(nightMode?'NIGHT_BACKGROUND_COLOR':'BACKGROUND_COLOR'),ink=color(nightMode?'NIGHT_TEXT_COLOR':'TEXT_COLOR');
      var lowBg=field('SCREEN_SPLIT').get()?color(nightMode?'NIGHT_LOWER_BACKGROUND_COLOR':'LOWER_BACKGROUND_COLOR'):bg;
      var lowInk=field('SCREEN_SPLIT').get()?color(nightMode?'NIGHT_LOWER_TEXT_COLOR':'LOWER_TEXT_COLOR'):ink;
      var layout=Number(field('READING_LAYOUT').get()),rows=layout===1,active=previewState!=='idle'&&previewState!=='timeline',page=pageChoice?Number(pageChoice.value):0;
      var four=layout===2&&previewState==='idle',peek=previewState==='timeline';
      var profile=Number(field('TEXT_SIZE').get());
      var supportScale=profile===1 ? 0.86 : profile===3 ? 1.15 : 1;
      var clock=active?45:four?100:roundPreview?110:106,point=active?38:64,reading=active?72:roundPreview?160:159;
      if(peek){clock=roundPreview?85:68;point=48;reading=roundPreview?117:110;}
      var examples=[['Temperature','5°C'],['Rain','40%'],['Phone','78%'],['Humidity','68%'],['UV','2']],samples=[];
      for(var home=0;home<(four?4:2);home++){
        var selected=home<2?page*2+home:((page+1)%3)*2+home-2;if(selected>=5)continue;
        var source=(data.slots||[])[selected];
        samples.push({home:home,text:source&&source.value?[source.label,source.value]:examples[selected]});
      }
      function sampleSize(size,bold,role){
        return role===1||role===3&&bold?size:Math.round(size*supportScale);
      }
      function previewTextInk(text,size,bold,role){
        size=sampleSize(size,bold,role);
        if(fontPanel&&fontPanel.custom())return fontPanel.preview(ctx,role,text,size,bold);
        ctx.font=(bold?'bold ':'')+size+'px sans-serif';var measured=ctx.measureText(text);
        return {ascent:typeof measured.actualBoundingBoxAscent==='number'?measured.actualBoundingBoxAscent:size*.75,
          descent:typeof measured.actualBoundingBoxDescent==='number'?measured.actualBoundingBoxDescent:size*.2};
      }
      function paintText(text,size,bold,role,x,y,width){
        size=sampleSize(size,bold,role);
        if(fontPanel&&fontPanel.custom())fontPanel.preview(ctx,role,text,size,bold,x,y,width);
        else{ctx.font=(bold?'bold ':'')+size+'px sans-serif';ctx.fillText(text,x,y,width);}
      }
      var clockBottom=clock+previewTextInk('13:05',point,true,1).descent,readingTop=previewHeight;
      samples.forEach(function(sample){
        var y=reading+(rows?sample.home*34:four?Math.floor(sample.home/2)*52-20:0);
        readingTop=Math.min(readingTop,y-previewTextInk(sample.text[1],rows?23:28,true,3).ascent);
        if(rows&&!field('HIDE_READING_TITLES').get())readingTop=Math.min(readingTop,y-previewTextInk(sample.text[0],14,false,3).ascent);
      });
      if(!samples.length)readingTop=reading;
      var divider=Math.max(0,Math.min(previewHeight,Math.round((clockBottom+readingTop)/2)));
      ctx.clearRect(0,0,previewWidth,previewHeight);ctx.save();
      if(roundPreview){ctx.beginPath();ctx.arc(130,130,130,0,Math.PI*2);ctx.clip();}
      ctx.fillStyle=css(bg);ctx.fillRect(0,0,previewWidth,previewHeight);ctx.fillStyle=css(lowBg);ctx.fillRect(0,divider,previewWidth,previewHeight-divider);
      ctx.fillStyle=css(ink);ctx.textAlign='center';
      var time=Number(field('CLOCK_FORMAT').get())||Number(assets.systemFormat)||24;
      paintText(time===12?'1:05':'13:05',point,true,1,previewWidth/2,clock,previewWidth-24);
      paintText('SUN · 1.11.',16,false,2,previewWidth/2,active?16:31);
      samples.forEach(function(item){
        var i=item.home,sample=item.text;
        ctx.fillStyle=css(lowInk);
        if(rows){
          var y=reading+i*34;
          ctx.textAlign='left';
          if(!field('HIDE_READING_TITLES').get())paintText(sample[0],14,false,3,roundPreview?60:12,y,previewWidth*.42);
          ctx.textAlign='right';paintText(sample[1],23,true,3,previewWidth-(roundPreview?45:12),y,previewWidth*.46);
        }else{
          var x=previewWidth*(i%2?0.75:0.25),line=reading+(four?Math.floor(i/2)*52-20:0);
          ctx.textAlign='center';paintText(sample[1],28,true,3,x,line,previewWidth*.43);
          if(!field('HIDE_READING_TITLES').get())paintText(sample[0],13,false,3,x,line+23,previewWidth*.43);
        }
      });
      if(active){
        ctx.fillStyle=css(lowInk);ctx.textAlign='center';
        var title=previewState==='timer'?'02:30':previewState==='music'?'Midnight Drive':t('previewNotification');
        paintText(title,
          22,true,4,previewWidth/2,previewHeight-37,previewWidth-40);
        if(previewState!=='notification-summary'){
          var subtitle=previewState==='music'?'The Satellites':previewState==='timer'?t('previewTimer'):t('previewMessage');
          paintText(subtitle,13,false,4,previewWidth/2,previewHeight-15,previewWidth-64);
        }
      }
      ctx.restore();previewCaption.textContent=previewDescription('layoutApproximation');timelineCaption.hidden=previewState!=='timeline';disabledCaption.hidden=true;formatCaption.hidden=true;
      canvas.setAttribute('aria-label',sceneSelect.selectedOptions[0].textContent+' · '+t('layoutApproximation'));
      if(peek){
        var key='timeline-'+time+'-'+(nightMode?'dark':'light');
        var frame=assets.frames[key];
        if(frame)withFrame(key,frame,function(image){
          frame.preserve.forEach(function(box){
            ctx.drawImage(image,box.x,box.y,box.width,box.height,box.x,box.y,box.width,box.height);
          });
        });
      }
    }
    function withFrame(key,frame,draw){
      var serial=request,image=imageCache[key];
      function ready(){
        if(serial!==request)return;
        if(image.naturalWidth===previewWidth&&image.naturalHeight===previewHeight)draw(image);
        else previewCaption.textContent=t('noExample');
      }
      if(image&&image.complete){ready();return;}
      if(!image){image=new Image();imageCache[key]=image;}
      image.onload=ready;image.onerror=ready;
      if(!image.src)image.src=frame.src;
    }
    var previewPending=false;
    function renderPreview() {
      ++request;
      if(previewPending)return;
      previewPending=true;
      (window.requestAnimationFrame||function(callback){return window.setTimeout(callback,16);})(function(){
        previewPending=false;drawPreview();updatePreviewMode();
      });
    }
    function drawPreview() {
      if (!canvas) { return; }
      var enhanced=!!field('SCREEN_SPLIT').get()||Number(field('READING_LAYOUT').get())!==0||!!field('HIDE_READING_TITLES').get()||!!field('SHAKE_READINGS').get();
      if(pageChoice){pageChoice.disabled=!field('SHAKE_READINGS').get();if(pageChoice.disabled)pageChoice.value='0';}
      if(enhanced||Number(field('TEXT_SIZE').get())||fontPanel&&fontPanel.custom()){drawLayoutPreview();return;}

      var format = Number(field('CLOCK_FORMAT').get());
      if (format !== 12 && format !== 24) { format = Number(assets.systemFormat) === 12 ? 12 : 24; }
      var quietPreview = previewNight();
      var background = color(quietPreview ? 'NIGHT_BACKGROUND_COLOR' : 'BACKGROUND_COLOR');
      var foreground = color(quietPreview ? 'NIGHT_TEXT_COLOR' : 'TEXT_COLOR');
      var highlight = color(quietPreview ? 'NIGHT_ACCENT_COLOR' : 'ACCENT_COLOR');
      var exactTheme = highlight === 0x55AAFF && background === 0xFFFFFF && foreground === 0 ? 'light' :
        highlight === 0x55AAFF && background === 0 && foreground === 0xFFFFFF ? 'dark' : '';
      var sampleState = previewState;
      var key = sampleState + '-' + format + '-' + (exactTheme || 'light');
      var frame = (assets.frames || {})[key];
      var ctx = canvas.getContext('2d');
      canvas.setAttribute('aria-label',t('samplePreview') + ': ' + t({idle:'previewIdle',music:'previewMusic',timer:'previewTimer','notification-summary':'previewBanner',notification:'previewMessage',timeline:'previewTimeline'}[previewState]) +
        (night.get() ? ' · ' + t(quietPreview ? 'previewQuietTime' : 'previewDay') : ''));
      previewCaption.textContent = previewDescription(exactTheme ? 'previewSettingsNote' : 'previewCustomHelp');
      timelineCaption.hidden = previewState !== 'timeline';
      disabledCaption.hidden = !(previewState === 'music' && !field('SHOW_MUSIC').get() ||
        previewState === 'timer' && (!field('SHOW_ACTIVITIES').get() || !field('SHOW_MUSIC').get()) ||
        previewState === 'notification' && (!notification.get() || noticeMode.value !== 'preview') || previewState === 'notification-summary' && (!notification.get() || noticeMode.value === 'app'));
      formatCaption.hidden = Number(field('CLOCK_FORMAT').get()) !== 0 || Number(assets.systemFormat) === 12 || Number(assets.systemFormat) === 24;
      ctx.fillStyle = css(background); ctx.fillRect(0,0,previewWidth,previewHeight);
      if (!frame) { previewCaption.textContent = t('noExample'); return; }
      if (typeof frame === 'string') { frame = {src:frame}; }
      function draw(image) {
        ctx.drawImage(image,0,0,previewWidth,previewHeight);
        if (exactTheme) { return; }
        // Custom colours reuse the actual native geometry. Reverse-mapping a
        // quantised capture cannot recover every coverage sample: the page
        // explicitly identifies these colours as approximate. Provider images
        // and the OS-owned Timeline card retain their captured pixels.
        var pixels = ctx.getImageData(0,0,previewWidth,previewHeight), keep = frame.preserve || [],colorMap={};
        function blend(front, back, amount) {
          var result = 0;
          for(var shift=16;shift>=0;shift-=8) {
            var a = ((front >> shift) & 255) / 85, b = ((back >> shift) & 255) / 85;
            result |= Math.max(0,Math.min(3,Math.floor((a * amount + b * (16-amount) + 8) / 16))) * 85 << shift;
          }
          return result;
        }
        for (var y=0;y<previewHeight;y++) { for (var x=0;x<previewWidth;x++) {
          var preserve=false;
          for(var rectangle=0;rectangle<keep.length;rectangle++) {
            var rect=keep[rectangle];
            if(x>=rect.x&&x<rect.x+rect.width&&y>=rect.y&&y<rect.y+rect.height){preserve=true;break;}
          }
          if (preserve) { continue; }
          var i=(y*previewWidth+x)*4, r=pixels.data[i]/85, g=pixels.data[i+1]/85, b=pixels.data[i+2]/85, mapped;
          var source=(pixels.data[i]<<16)|(pixels.data[i+1]<<8)|pixels.data[i+2];
          mapped=colorMap[source];
          if(mapped===undefined) {
            if (r === g && g === b) { mapped = blend(foreground,background,Math.round((3-r)*16/3)); }
            else if (b === 3 && r < g && g <= b) { mapped = blend(highlight,background,Math.round((3-r)*8)); }
            else if (r === 3 && g === 3 && b < 3) { mapped = blend(0xFFFF00,background,Math.round((3-b)*16/3)); }
            else mapped=-1;
            colorMap[source]=mapped;
          }
          if(mapped===-1)continue;
          pixels.data[i]=(mapped>>16)&255; pixels.data[i+1]=(mapped>>8)&255; pixels.data[i+2]=mapped&255;
        } }
        ctx.putImageData(pixels,0,0);
      }
      withFrame(key,frame,draw);
    }
    ['SCREEN_SPLIT','READING_LAYOUT','HIDE_READING_TITLES','SHAKE_READINGS','LOWER_BACKGROUND_COLOR','LOWER_TEXT_COLOR','NIGHT_LOWER_BACKGROUND_COLOR','NIGHT_LOWER_TEXT_COLOR'].forEach(function(key){field(key).on('input change',updateColors);});
    field('CLOCK_FORMAT').on('change',renderPreview);
    field('TEXT_SIZE').on('change',renderPreview);
    field('SHOW_MUSIC').on('change',renderPreview);
    if (!window.DynamicFonts) fontKeys.forEach(function(key,role){
      field(key).on('change',function(){previewFontRole(role);updateDirty();});
    });
    var fontsHost=node(item('dynamic-fonts'));
    if(fontsHost)fontsHost.setAttribute('data-font-panel','');
    if(fontsHost&&window.DynamicFonts)fontPanel=window.DynamicFonts({host:fontsHost,bridge:bridge,
      fields:fontKeys.map(field),library:data.fontLibrary,translate:t,onRole:previewFontRole,
      onPickerChange:function(open){show(field('TEXT_SIZE'),!open);},
      update:function(){renderPreview();updateDirty();}});
    updateNotifications(); updateColors();
    initialSnapshot = signature();
    confirmedForm = JSON.parse(JSON.stringify(clay.serialize()));
    if (bridge) bridge.remember(clay.serialize());
    ['SCREEN_SPLIT','READING_LAYOUT','HIDE_READING_TITLES','SHAKE_READINGS','LOWER_BACKGROUND_COLOR','LOWER_TEXT_COLOR','NIGHT_LOWER_BACKGROUND_COLOR','NIGHT_LOWER_TEXT_COLOR','BACKGROUND_COLOR','TEXT_COLOR','ACCENT_COLOR','CLOCK_FORMAT','ANIMATIONS','SHOW_STATUS','SHOW_ACTIVITIES','SHOW_MUSIC','SHOW_NOTIFICATIONS','NOTIFICATION_PREVIEW','NOTIFICATION_APP_ONLY','NOTIFICATION_VIBRATION','NOTIFICATION_APPS','NIGHT_PALETTE','NIGHT_BACKGROUND_COLOR','NIGHT_TEXT_COLOR','NIGHT_ACCENT_COLOR','TEXT_SIZE','APPEARANCE_MODE','MANUAL_APPEARANCE'].forEach(function(key) { field(key).on('input change',updateDirty); });
    updateDirty();
    var displayHost=node(item('dynamic-display-status')),displayLabel,displayRetry,displayBusy=false;
    if(displayHost){
      submitHost.insertBefore(displayHost,submitHost.firstChild);displayHost.classList.add('dynamic-watch-delivery');
      clear(displayHost);displayLabel=make('p');displayLabel.setAttribute('aria-live','polite');displayHost.appendChild(displayLabel);
      displayRetry=make('button',t('displayRetry'));displayRetry.type='button';displayHost.appendChild(displayRetry);
      displayRetry.addEventListener('click',function(){pollDisplay(true);});
    }
    function updateDisplay(){
      if(!displayLabel)return;
      var dirty=signature()!==initialSnapshot, saved=data.save||{};
      var hasDelivery=saved.state&&saved.state!=='none';
      var showDelivery=!dirty&&phonePhase==='ready'&&hasDelivery&&(!saved.applied||phoneConfirmed);
      displayHost.hidden=!showDelivery;
      saveStatus.hidden=showDelivery||!dirty&&phonePhase==='ready'&&!phoneConfirmed;
      submitHost.hidden=displayHost.hidden&&saveStatus.hidden;
      saveSpace();
      var fontError={watch_font_missing:'Reimport this font on the phone',watch_font_space:'Not enough space for the new fonts',
        watch_font_transfer:'Could not send fonts to the watch'};
      setLiveText(displayLabel,t(saved.applied?'Watch updated':fontError[saved.error]||
        (saved.error?'Watch update failed':'displayPending')));
      displayRetry.hidden=!watchRetryAvailable(bridge,saved);
      displayRetry.disabled=dirty||displayBusy||phonePhase==='saving'||phonePhase==='uncertain';
    }
    function pollDisplay(retryDelivery){
      if(!bridge||!bridge.display||displayBusy)return;
      if(phonePhase==='saving'||phonePhase==='uncertain'||signature()!==initialSnapshot){updateDisplay();return;}
      displayBusy=true;updateDisplay();
      bridge.display(retryDelivery,function(delivery){displayBusy=false;if(delivery)data.save=delivery;updateDisplay();});
    }
    var saveInfo=make('div',null,'dynamic-save-info');submitHost.insertBefore(saveInfo,submitHost.firstChild);saveInfo.appendChild(saveStatus);saveInfo.appendChild(displayHost);
    updateNight();updateDisplay();
    if(bridge&&bridge.display){pollDisplay(false);setInterval(function(){pollDisplay(false);},3000);}
    var form = document.getElementById('main-form');
    if (form) {
      form.noValidate=true;
      function resized() {saveSpace();requestAnimationFrame(function(){focusedVisible();});}
      saveSpace();window.addEventListener('resize',resized);
      if(window.visualViewport)window.visualViewport.addEventListener('resize',resized);
      if(typeof ResizeObserver!=='undefined'&&submitHost)new ResizeObserver(saveSpace).observe(submitHost);
      function saveVisibility() {
        document.body.classList.toggle('dynamic-picker-open',!!document.querySelector('.picker-wrap.show'));
        paletteControllers.forEach(function(sync) { sync(false); });
      }
      saveVisibility();
      if (typeof MutationObserver !== 'undefined') { new MutationObserver(saveVisibility).observe(form,{subtree:true,attributes:true,attributeFilter:['class']}); }
      else { document.addEventListener('click',function() { setTimeout(saveVisibility,0); }); }
      form.addEventListener('focusin',function(event) {
        if (['INPUT','SELECT'].indexOf(event.target.tagName)<0 || event.target.type === 'checkbox' || event.target.type === 'hidden') { return; }
        setTimeout(function() {focusedVisible(event.target);},0);
      });
      form.addEventListener('submit',function(event) {
      if(notification.get()&&appMode.value==='selected'&&(draftAppError()||!entries.length&&!appEntry.value.trim()))revealField(appEntry);
      if (notification.get() && appMode.value === 'selected' && !commitApp(true)) { revealField(appEntry); event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (!form.checkValidity()) { var invalid=form.querySelector(':invalid');if(invalid){revealField(invalid);requestAnimationFrame(function(){invalid.reportValidity();});}event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (bridge) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (phonePhase==='saving'||saveButton.disabled) return;
        var candidate, sentForm = clay.serialize(), sentSignature = signature();
        try { candidate = bridge.snapshot(sentForm); } catch (ignored) { phonePhase = 'failed'; updateDirty(); return; }
        phonePhase = 'saving'; updateDirty();
        bridge.save(candidate,function(result) {
          if (result && result.ok) {
            if(result.delivery)data.save=result.delivery;
            bridge.remember(sentForm,result.settings);
            confirmedForm=JSON.parse(JSON.stringify(sentForm));
            initialSnapshot=sentSignature;
            phoneConfirmed=true;phonePhase='ready';
            if(fontPanel)fontPanel.clearStatus();
          } else phonePhase=result&&result.notSaved?'failed':'uncertain';
          updateDirty();
        });
      } else { saveButton.textContent=t('saveSending');saveButton.disabled=true; }
    },true); }
    var initialScreen='fonts';
    try{var restoredView=JSON.parse(sessionStorage.getItem('dynamic-settings-view'));sessionStorage.removeItem('dynamic-settings-view');if(restoredView&&Object.prototype.hasOwnProperty.call(screens,restoredView.screen)){initialScreen=restoredView.screen;if(editors.indexOf(restoredView.editor)>=0)lastEditor=restoredView.editor;screenScroll[initialScreen]=Math.max(0,Number(restoredView.scroll)||0);}}catch(ignored){}
    navigate(initialScreen,null,true);
  });
};
