# Dynamic UI/UX implementation

Local design trial: **0.18.1**, 7 November 2026, on
`design/pebble-native-redesign`. Published 0.16.2 remains frozen. The tested
0.17.0 shared-UI baseline remains available unchanged.

The canonical standard lives in the local `xoce` checkout at
`src/pages/docs/design/pebble-ui-system.md`, available in its local preview at
[the shared Pebble UI/UX standard](http://127.0.0.1:4321/docs/design/pebble-ui-system/).
The website and this candidate have not been published. This branch is an
alternative for aesthetic review, not a replacement for that canonical standard.
See [the trial rationale and sources](REDESIGN.md).

## Xef’s readability correction

Small Pebble-style utility text is not a goal. The revised branch enlarges the
date and compact clock, uses larger reading labels, and centers adjacent caption
ink within its fixed icon frame. Existing composition anchors remain; internal
centering and breathing room take priority over copying OS font sizes.
See [the correction and fresh evidence](REDESIGN.md).

## Implemented behaviour

The phone settings use neutral light/dark surfaces, a blue accent, readable
labels, an app-name heading and brief localized introduction, one short identity
line, neutral section headings, 16px body/14px hints, 16px card insets and 24px
section spacing, 44px controls, and the existing Appearance, Content & priority, and
Connection & help sections. Section links wrap by available content width.
Activity order remains local to Dynamic, with visible move controls as well
as keyboard, touch and desktop dragging. All 17 language dictionaries remain.
Primary controls use the page accent with contrasting text; footer feedback is
left aligned. Short 144ms control/160ms disclosure motion respects reduced motion.
Saved never gets a repeating animation.

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

The native watchface layout is preserved: configurable colours, Fredoka clock,
bottom-aligned primary activity and contextual footer, dedicated media layout,
and one static secondary row above it. Either role may contain any supported
activity. Native Gothic 14 Bold reading labels and Gothic 18 Bold date provide
compact utility roles; activity text keeps its exact custom-font metrics. Semantic
symbols use 2px strokes with filled hourglass/music details. The existing 280ms
incoming replacement moves from the right and settles back from a bounded 3px
overshoot. The 520ms layout morph remains. Ordinary ticks, metadata/art corrections,
animation-off and covered-view lifecycle gates remain unchanged.
No marquee, new native polling, shared theme service or library/API
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

[0.18.0 validation](qa/0.18.0/VALIDATION.md) links passing portable/native tests,
the exact artifact audit, 24 fresh Emery captures and actual replacement-motion
frames. Its standalone phone preview uses the actual generated Clay page with a
clearly labelled local mock bridge. A fresh Chromium run exits 133 at crashpad
`setsockopt: Operation not permitted`, so the two packaged browser checks have
not been rerun for this trial. New spacing/motion therefore still needs browser
and real-phone review.

Historical [0.17.0 validation](qa/0.17.0/VALIDATION.md) links its exact artifact audit,
actual archived config/plugin/PKJS browser checks, legacy compatibility checks,
and 24 native Emery preview captures. Tests cover repeated Save, closing,
reopening, runtime restart and separate Android DOM/native storage snapshots;
known/uncertain failures; local Discard; custom colours; privacy/order; EN/CS
320/360px layouts; and doubled computed text with a short visual viewport.

The emulator uses sample data and browser SDK bridges are simulated. These
checks do not establish real-phone WebView behaviour, physical-watch delivery,
app switching or measured battery life. Older captures retain their original
provenance. Published artifacts and tags are unchanged.
