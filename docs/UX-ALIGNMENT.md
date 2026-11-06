# Dynamic UI/UX implementation

Local candidate: **0.17.0**, 6 November 2026. Published 0.16.2 remains frozen.

The canonical standard lives in the local `xoce` checkout at
`src/pages/docs/design/pebble-ui-system.md`, available in its local preview at
[the shared Pebble UI/UX standard](http://127.0.0.1:4321/docs/design/pebble-ui-system/).
The website and this candidate have not been published.

## Implemented behaviour

The phone settings use neutral light/dark surfaces, a blue accent, readable
labels, 44px controls, and the existing Appearance, Content & priority, and
Connection & help sections. Section links wrap by available content width.
Activity order remains local to Dynamic, with visible move controls as well
as keyboard, touch and desktop dragging. All 17 language dictionaries remain.

The bundled `config.html` waits for a confirmed saved snapshot before creating
editable controls. Save stays open: Saving… becomes persistent ✓ Saved after
the phone acknowledges the exact snapshot; another edit shows Unsaved changes.
Unchanged Save is disabled. A known rejection differs from an uncertain outcome;
timeouts and wrong/missing acknowledgements retain the draft and permit explicit
retry or Reload saved. Phone persistence and watch delivery remain separate.

Discard restores the last confirmed form locally, including colours, activity
order/visibility, notification privacy and filter chips. It sends no SDK writes
and cannot undo an uncertain request. Browser scroll anchoring preserves the
visible context when restored controls change height. No field gains automatic
text focus, including when removing a filter chip. Short visual viewports and
large text put the action area into document flow when necessary.

Existing arbitrary RGB values survive unrelated saves even when Clay's palette
picker displays a nearest available colour. An explicit picker change still
saves normally. Edits made during an in-flight save stay dirty after its receipt.

The native watchface layout is unchanged: configurable colours, Fredoka clock,
bottom-aligned primary activity and contextual footer, dedicated media layout,
and one static secondary row above it. Either role may contain any supported
activity. No marquee, new native polling, shared theme service or library/API
redesign was introduced. Preview appearance remains independent of saved watch
colours and notification privacy.

## Storage and implementation boundaries

- `src/common/settings-state.js` validates a single atomic snapshot in the
  existing `clay-settings` record. Stable activity preferences are embedded as
  `__dynamicActivityPreferences`. The old separate key remains a read fallback
  and is not rewritten merely by opening settings. Existing retired fields and
  numeric legacy aliases survive; private activity content is never persisted.
- `src/pkjs/settings-bridge.js` owns the bundled page's confirmed-load/save
  transport. Current target lookup selects live PKJS as writer; a plugin receipt
  is followed by a topology recheck and synchronization of a newly started PKJS.
  Handoffs are bounded, and an ambiguous outcome never becomes false success.
- `src/pkjs/settings-page.js` retains the existing Clay composition and local
  controller. `scripts/generate-config.cjs` generates the declared offline page.
- `src/plugin/index.js` loads settings code only inside its configuration
  handler. The read-only navigation source and its leases remain unchanged.
- The legacy `showConfiguration`/close-URL fallback still saves and closes.
  It does not claim the modern stay-open acknowledgement.

## Validation and limits

[0.17.0 validation](qa/0.17.0/VALIDATION.md) links the exact artifact audit,
actual archived config/plugin/PKJS browser checks, legacy compatibility checks,
and 24 native Emery preview captures. Tests cover repeated Save, closing,
reopening, runtime restart and separate Android DOM/native storage snapshots;
known/uncertain failures; local Discard; custom colours; privacy/order; EN/CS
320/360px layouts; and doubled computed text with a short visual viewport.

The emulator uses sample data and browser SDK bridges are simulated. These
checks do not establish real-phone WebView behaviour, physical-watch delivery,
app switching or measured battery life. Older captures retain their original
provenance. Published artifacts and tags are unchanged.
