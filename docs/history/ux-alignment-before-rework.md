# Historical UX-ALIGNMENT.md

Retained before the2026-11-07 rework. Use current UI/maintenance/development
documentation for work on main; older evidence retains its original scope.

# Dynamic UI/UX implementation

Local design trial: **0.18.2**, 7 November 2026, on
`design/pebble-native-redesign`. Published 0.16.2 remains frozen. The tested
0.17.0 shared-UI baseline remains available unchanged.

The canonical standard lives in the local `xoce` checkout at
`src/pages/docs/design/pebble-ui-system.md`, available in its local preview at
[the shared Pebble UI/UX standard](http://127.0.0.1:4321/docs/design/pebble-ui-system/).
The website and this candidate have not been published. This branch is an
alternative for aesthetic review, not a replacement for that canonical standard.
See [the trial rationale and sources](REDESIGN.md).

## Xef’s readability correction

Xef requires every normal text role to be easy to read, with icons aligned to
actual text ink and comfortable internal clearance. The rejected 0.18.1 fix
made the header larger without balancing the rest. This revision redesigns
Idle, compact activity and Peek together: Roboto Condensed utility text,
Fredoka time/values, larger labels/captions/secondary, and newly allocated bands.
Compact views show a prominent numeric date; Idle and Peek retain the weekday.
A smaller media cover and one artist line reserve room for larger text. State
and structured detail lead non-media footers; optional identity truncates first.
See [the separate requirements and review proposals](REDESIGN.md).

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

The native identity remains a rounded Fredoka clock, two stable reading homes,
a bottom-aligned primary activity/footer and one static secondary above it.
Roboto Condensed utility roles now use 26pt date, 20pt reading labels/hints,
22pt secondary and 24pt primary/media captions. Actual glyph metrics determine
line spacing and optical centering. The static secondary occupies y106–132;
primary content uses the remaining band above the footer ending at y216.
Standard paused/workout/navigation/message pairs retain both roles. Optional
identity yields before required state/value/detail; an exceptional essential
value may take the primary space and the receipt then exports no secondary.
The 280ms incoming replacement and 520ms layout morph retain their lifecycle
gates. There is no marquee, new polling or shared theme service. Preview
appearance remains independent of saved watch colours and notification privacy.

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

[0.18.2 validation](qa/0.18.2/VALIDATION.md) links passing portable/native tests,
the exact artifact audit, 24 fresh Emery captures and actual replacement-motion
frames. Its standalone phone preview uses the actual generated Clay page with a
clearly labelled local mock bridge. The earlier Chromium start attempt exited 133 at crashpad
`setsockopt: Operation not permitted`; the two packaged browser checks have
not been rerun for this revision. New spacing/motion therefore still needs browser
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
