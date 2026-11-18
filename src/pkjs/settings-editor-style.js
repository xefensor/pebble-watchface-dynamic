'use strict';

// Both settings hosts render this CSS after Clay's component styles.
module.exports = function editorStyles() {
  return `
:root {
  --page: #faf9f5;
  --card: #fffefa;
  --field: #f2f1eb;
  --ink: #20231f;
  --muted: #565d55;
  --line: #d5d7cc;
  --accent: #145ca3;
  --accent-ink: #fff;
  --preview-bed: #eaece3;
  --preview-dot: #c9cdc0;
  --preview-rim: #6d716a;
  --card-radius: 6px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --page: #161917;
    --card: #1b1f1c;
    --field: #282d28;
    --ink: #eff2e9;
    --muted: #b7bdb1;
    --line: #42493f;
    --accent: #9bcbff;
    --accent-ink: #101b27;
    --preview-bed: #252b25;
    --preview-dot: #3b453b;
    --preview-rim: #6e776a;
  }
}
body {
  padding-top: max(14px, env(safe-area-inset-top));
  padding-bottom: calc(var(--dynamic-save-height, 0px) + 20px);
}
#main-form > .component-heading:first-child :is(h1, h2, h4) {
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 780;
  letter-spacing: -.065em;
}
#main-form > .dynamic-preview-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "title options"
    "watch watch"
    "scene scene"
    "controls controls"
    "note note";
  align-items: center;
  gap: 0 12px;
  padding: 0;
  margin: 8px 0 18px;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}
/* A single shared grid area centers either physical display shape on the mat. */
#main-form > .dynamic-preview-card::before {
  content: "";
  grid-area: watch;
  align-self: stretch;
  border: 1px solid var(--line);
  border-radius: 5px;
  background-color: var(--preview-bed);
  background-image: radial-gradient(circle at 1px 1px, var(--preview-dot) 1px, transparent 1.1px);
  background-size: 7px 7px;
}
#main-form .dynamic-preview-card .dynamic-preview-title {
  grid-area: title;
  align-self: center;
  margin: 0;
  color: var(--muted);
  font-size: .875rem;
  font-weight: 650;
}
#main-form .dynamic-preview-card .dynamic-preview-stage {
  grid-area: watch;
  justify-self: center;
  position: relative;
  width: 170px !important;
  max-width: calc(100% - 32px);
  margin: 12px 0;
  border: 6px solid #171a19;
  border-radius: 13px;
  background: #171a19;
  box-shadow: 0 0 0 1px var(--preview-rim), 0 3px 0 1px rgb(0 0 0 / 16%);
}
#main-form .dynamic-preview-stage canvas {
  width: 100% !important;
  height: auto;
}
#main-form .dynamic-preview-card .dynamic-preview-expand {
  grid-area: options;
  justify-self: end;
  justify-content: flex-end;
  min-width: 0;
  margin: 0;
  padding: 0 2px;
  font-size: .875rem;
}
#main-form .dynamic-preview-scene {
  grid-area: scene;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  margin: 4px 0 0;
  padding: 0;
  font-weight: 650;
}
#main-form .dynamic-preview-scene select {
  width: auto;
  max-width: 66%;
  margin: 0;
  padding: 5px 10px;
  min-height: 44px;
  border-radius: 4px;
}
#main-form .dynamic-preview-controls {
  grid-area: controls;
  margin: 4px 0 6px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--card);
}
#main-form .dynamic-preview-controls > label:last-child { margin-bottom: 0; }
#main-form .dynamic-preview-card > .dynamic-preview-note {
  grid-area: note;
  margin: 4px 0 0 !important;
  color: var(--muted);
  font-size: .8125rem !important;
  line-height: 1.4;
}
.dynamic-editor-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 5em), 1fr));
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--field);
}
#main-form .dynamic-editor-tab {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  margin: 0;
  padding: 7px 4px;
  border: 1px solid transparent;
  border-radius: 3px;
  box-shadow: none;
  background: transparent;
  color: var(--ink);
  font: 650 1rem/1.25 var(--font-family);
  text-transform: none;
  letter-spacing: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
#main-form .dynamic-editor-tab[aria-selected="true"] {
  background: var(--accent);
  color: var(--accent-ink);
}
#main-form > .section[data-screen] {
  margin: 8px 0 22px;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}
#main-form > .section[data-screen] > .component {
  padding: 12px 0;
}
#main-form > .section[data-screen] > .component::after {
  inset-inline: 0;
}
#main-form .component-toggle > label,
#main-form .component-color > label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--control-height);
}
#main-form .component-toggle label > .input {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-height);
}
#main-form .section [data-setting="TEXT_SIZE"] label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
}
#main-form .section [data-setting="TEXT_SIZE"] .label { flex: 1 1 6em; }
#main-form .section [data-setting="TEXT_SIZE"] .value {
  max-width: 100%;
  min-width: 8em;
  margin: 0;
}
#main-form .dynamic-reorder {
  float: inline-end;
  min-width: 0;
  margin: 0 0 8px 12px;
}
#main-form .dynamic-activity-list,
#main-form .dynamic-reordering > .description {
  clear: both;
}
#main-form .section[data-screen] :is(.dynamic-choice select, .component-select .value, .component-input input, .dynamic-app-entry input, .dynamic-presets button, .dynamic-palette-actions button, .dynamic-reorder) {
  border-radius: 4px;
}
#main-form .dynamic-appearance-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
}
#main-form .dynamic-appearance-summary > div { min-width: 0; }
#main-form #dynamic-appearance-title {
  display: block;
  color: var(--muted);
  font-size: .875rem;
}
#main-form #dynamic-appearance-saved { display: block; overflow-wrap: anywhere; }
#main-form #dynamic-appearance-change {
  width: auto;
  min-width: 44px;
  min-height: 44px;
  max-width: 100%;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: var(--accent);
  font: 650 1rem/1.25 var(--font-family);
  text-transform: none;
  white-space: normal;
  overflow-wrap: anywhere;
}
#main-form .dynamic-palette-buttons {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 8px;
  margin-top: 8px;
}
#main-form .dynamic-palette-buttons button {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  margin: 0;
  padding: 6px;
  border: 2px solid var(--line);
  border-radius: 4px;
  background: var(--card);
  color: var(--ink);
  box-shadow: none;
  font: 650 1rem/1.25 var(--font-family);
  text-transform: none;
  white-space: normal;
  overflow-wrap: anywhere;
}
#main-form .dynamic-palette-buttons [aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--field);
  color: var(--accent);
}
#main-form .dynamic-secondary-nav {
  display: grid;
  gap: 0;
  margin: 16px 0 0;
  padding: 0;
  border-top: 2px solid var(--ink);
}
#main-form .dynamic-secondary-nav .dynamic-category {
  min-height: 52px;
  padding: 10px 2px;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
}
.dynamic-secondary-nav .dynamic-category-arrow { font-weight: 400; }
.dynamic-route-header::after { display: none; }
.dynamic-route-header h2 { margin-top: 8px; }
#main-form .dynamic-action-status {
  padding-top: 6px;
  padding-bottom: max(6px, env(safe-area-inset-bottom));
}
#main-form .dynamic-action-status .dynamic-save-info { margin-bottom: 0 !important; }
#main-form .dynamic-action-draft { background: var(--card); }
#main-form .component-submit button { border-radius: 4px; }

#main-form .dynamic-font-list, #main-form .dynamic-font-options {
  display: grid;
  gap: 0;
  min-width: 0;
}
#main-form [data-font-panel] button {
  width: auto;
  min-width: 0;
  min-height: 44px;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 4px;
  box-shadow: none;
  background: var(--field);
  color: var(--ink);
  font: 650 1rem/1.35 var(--font-family);
  text-transform: none;
  letter-spacing: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
#main-form [data-font-panel] .dynamic-font-row,
#main-form [data-font-panel] .dynamic-font-option {
  display: flex;
  width: 100%;
  min-height: 50px;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 8px 2px;
  text-align: start;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
}
#main-form [data-font-panel] .dynamic-font-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "role arrow" "value arrow";
  gap: 2px 10px;
}
#main-form [data-font-panel] .dynamic-font-list > .dynamic-font-row {
  grid-template-columns: minmax(0, 1fr) minmax(64px, 34%) auto;
  grid-template-areas: "role sample arrow" "value sample arrow";
  min-height: 70px;
}
#main-form .dynamic-font-row strong {
  grid-area: role;
  font-weight: 720;
}
#main-form .dynamic-font-arrow {
  grid-area: arrow;
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--muted);
}
#main-form .dynamic-font-row .dynamic-font-value {
  grid-area: value;
  min-width: 0;
  color: var(--muted);
  font-size: .875rem;
  font-weight: 500;
}
#main-form .dynamic-font-specimen {
  grid-area: sample;
  display: block;
  width: 100%;
  max-width: 136px;
  height: auto;
  justify-self: end;
}
#main-form [data-font-panel] details[data-font-overrides] {
  margin: 4px 0;
  padding: 0;
  border: 0;
}
#main-form [data-font-panel] details[data-font-overrides] > summary { margin-bottom: 0; }
#main-form [data-font-panel] .dynamic-font-option[aria-pressed="true"],
#main-form [data-font-panel] .dynamic-font-option[aria-selected="true"] {
  color: var(--accent);
  font-weight: 750;
}
#main-form [data-font-panel] .dynamic-font-option > [aria-hidden="true"] {
  margin-inline: auto 2px;
}
#main-form [data-font-panel] :is([data-font-reset], [data-font-back]) {
  margin: 0;
  padding: 8px 1px;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: .875rem;
}
#main-form [data-font-panel] button:disabled { opacity: .5; }
#main-form .dynamic-font-picker :is(h3, h4) {
  margin: 12px 0 6px;
  font-weight: 720;
  text-transform: none;
  letter-spacing: 0;
}
#main-form .dynamic-font-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
#main-form .dynamic-font-sources button { flex: 1 1 105px; }
#main-form .dynamic-font-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin: 8px 0;
}
#main-form .dynamic-font-results > div {
  grid-column: 1 / -1;
  padding: 10px;
  border-inline-start: 2px solid var(--accent);
  background: var(--field);
}
#main-form .dynamic-font-results [data-font-download] {
  margin-top: 8px;
  background: var(--accent);
  color: var(--accent-ink);
}
#main-form .dynamic-font-results [data-font-family][aria-pressed="true"] {
  border-color: var(--accent);
  color: var(--accent);
}
#main-form [data-font-panel] input[type="search"] { padding-inline: 10px; }

@media (max-width: 340px) {
  #main-form .dynamic-preview-card .dynamic-preview-stage { width: 158px !important; }
  #main-form .dynamic-preview-card .dynamic-preview-expand { max-width: 12ch; }
}
@media (max-height: 540px) {
  #main-form .dynamic-preview-card .dynamic-preview-stage { width: 144px !important; }
}
`;
};
