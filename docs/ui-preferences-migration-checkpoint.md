# Dynamic legacy Quiet Time checkpoint — 2026-11-08

This candidate supersedes the [original preference candidate](ui-preferences-checkpoint.md).
Local only; no version change, push or publication.

Older saved booleans may be true/false, 1/0 or their string forms. Missing appearance
mode now derives from the normalized Quiet Time value, preserving every supported
encoding. Existing explicit modes and both raw RGB palettes stay unchanged.

Candidate `build/candidate/Dynamic-0.18.3.pbw` SHA-256:
`bef04b85929a78f2dbe51769b53ecea980045471e49941673c06bc23220ad869`.

- `npm test`, build, configuration and artifact audits pass, including the new
  source regression for all eight old boolean encodings.
- `node scripts/check-display-migration.cjs` executes the exact packaged plugin
  and PKJS. All eight encodings load without rewriting the old settings, preserve
  raw colours, emit the correct native-bound mode and accept only the simulated
  exact receipt. Evidence: `build/qa/display-migration/report.json`. Transport and
  native receipts are simulated in this focused check.
- The exact final package passes the real native preference bridge on Emery
  4.45.0: `build/qa/preferences-bridge/1794168228529854518/report.json`.
  All three corresponding OS/manual profiles and conflicting-size relaunch pass.
  Native persistence/application run in QEMU; phone SDK/storage are simulated.
- `build/qa/display-migration-equivalence.json` proves native code, data, resources
  and configuration HTML unchanged from the earlier checkpoint; native differences
  are limited to the SDK resource timestamp. The earlier 4.33.2 native and browser
  layout evidence covers those same bytes, with the earlier package hash retained.

The preview capture metadata now distinguishes a live timer from an all-pixel
stable scene. Its raw PNGs are unchanged; static pixels outside the reported
running value region must settle. This corrects the scope of the QA flag without
claiming another capture. Physical watch/phone, published upgrades and weather
integration retain the earlier checkpoint's explicit pending scope.
