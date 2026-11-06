# Dynamic 0.17.0 — local shared UI candidate

Validated on 6 November 2026. This candidate is local and unpublished.

PBW SHA-256:
`1559f81ea3dafeac52c8e04a38dbb51e59b215212170d872c87cb6c44b6fc026`.

The shared phone design and confirmed Save-and-stay are implemented; native
watchface composition, activity contracts, UUID, message keys and library pins
are preserved. See [the implementation record](../../UX-ALIGNMENT.md).

## Automated and packaged checks

- 134 JavaScript tests, 13 strict portable C suites and the actual native
  callback lifecycle harness pass. Release automation's 19 Python tests pass.
- The SDK 4.33.1 Emery build and exact final package audit pass: native input,
  font/resource identity, Core/Activities pins, offline config generation,
  SDK module inventory, minified code/maps and licence bytes.
- Native footprint remains 62,574 bytes in the SDK report with 68,498 free heap
  and 246,928 resource bytes. The independent image audit reports 62,160 loaded
  bytes and 62,576 virtual bytes: 2,959 bytes below the legacy 65,535-byte limit.

The [audit](artifact-audit.json) and [summary](validation.json) identify the final
payload. No clean native rebuild was performed after capturing native previews;
incremental packaging preserves the captured executable/resources.

## Actual packaged browser workflows

[Modern settings](settings-stay-open/report.json): ten workflow groups, eleven
captures, no browser errors. Chromium executes the actual archived `config.html`,
`plugin.js` and PKJS against a simulated SDK bridge with independent Android
DOM/native preference snapshots. It checks:

- Initial confirmed load, no writes/autofocus, all 17 translation dictionaries,
  EN/CS at 320/360px in both phone themes.
- Save stays open, persistent ✓ Saved, edit/repeated Save, cold reopening,
  runtime restart/full reload and Android DOM teardown without lost changes.
- Arbitrary saved RGB preservation, deliberate colour edits, and edits/reverts
  made while a prior Save is in flight.
- Local Discard of colour, privacy/filter, order and visibility changes without
  backend calls or keyboard focus. Its preview anchor moves under 0.02px while
  browser scrollY adjusts to the restored controls' height.
- Known rejection versus lost/wrong/mismatched/6.5-second-timeout receipts,
  explicit retry/readback, corrupt load and Retry, plus plugin/PKJS handoffs.
- Short viewports and doubled computed text without horizontal overflow.

[Legacy compatibility](settings-legacy/validation.json): 24 captures cover the
actual minified PKJS-generated Clay page, EN/CS, priority controls, privacy,
64-provider bounds, save-and-close serialization and fresh-host restoration.
All twelve custom-colour state/format comparisons match the approved renderer;
there are no browser exceptions. This fallback still closes on Save.

## Native captures and preserved work

[Native preview evidence](native-previews/previews.json) contains 24 actual
Emery screenshots: six states × two time formats × two palettes, with synthetic
source fixtures. Final executable/resources match these captures; their earlier
whole-PBW hashes predate the final phone-only packaging. Selected idle, timer,
media and notification frames were visually reviewed. The full capture set has
not been claimed as a separate manual review.

Across the four app checkouts, a preservation audit found all 97 previously
tracked PBW/ZIP artifacts byte-identical to their original HEADs, with UUIDs,
old message-key prefixes and library pins preserved. Earlier evidence and
published tags/assets remain unchanged.

No live-phone WebView, physical watch, measured battery, end-to-end delivery or
real-device app-switching verification was performed. Browser bridge simulations,
native emulator rendering and real-device testing are separate evidence.
