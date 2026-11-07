# Dynamic 0.18.1 — readability correction validation

Unpublished `design/pebble-native-redesign` revision. Xef rejected smaller top
clock/date, high adjacent icons and text pressed against bounds. The old trial
and main are preserved; no publication or physical-device check is claimed.

## Passing checks

- 134 JS tests, 13 portable C fixtures and actual-production-callback lifecycle
  regressions: [portable-tests.log](portable-tests.log). These retain identity,
  leases, privacy, source expiry, animation-off/focus behavior and exact settings
  persistence contracts. Caption/secondary geometry has new centering checks;
  date/readings geometry accounts for actual accent bearings.
- 19 release automation and 8 minification/serialized-Clay tests pass. No release
  preparation/publication was run. The 0.17 store kit remains historical.
- SDK build and the [exact packaged audit](artifact-audit.json) pass. Loaded image
  is 62,600 bytes, with 2,935 bytes of headroom below the 65,535 limit. Static
  virtual extent is 63,016 bytes. Runtime heap/battery were not measured.
- [24 standard native states](native-previews/previews.json),
  [64 expanded layout states](native-activities/activities.json) and
  [24 long-date/time states](native-long-date/previews.json) are fresh real
  Emery screenshots with synthetic source data. Long-date captures use
  **31.12. and 23:59**, both clock formats and palettes. The expanded set covers
  primary/secondary, generic directions/values, paused/long values, notifications
  and absent-image/layout cases. It is explicitly **layout-only**.
- [Pixel readability checks](readability.json) independently measure visible ink:
  date grows from the trial's 11px to 18px; compact clock ink grows from 31px to
  34px. Timer/notification footer and secondary icon-caption centers differ by at
  most 0.5px; media artwork and its two-line caption share a center. All ordinary
  and expanded full-height captures keep the final 12px below y216 clear.
- Native stock-SDK [font probes](font-probe/README.md) establish accented Gothic
  glyph bearings. Source geometry retains 5px idle/Peek and 3px compact weekday
  top clearance, including ČTV/ÚTE/ŚRO-style accents; full descenders end before
  the numeric date. The larger reading labels also clear value ink. These are
  font-probe/geometry proofs, not Czech real-watch screenshots.
- [Incoming-motion frames](native-motion/motion.json) and
  [the actual-frame GIF](native-motion/incoming.gif) contain unmodified native
  screenshots. The same existing 280ms incoming/520ms layout contracts remain;
  screenshots do not establish physical-watch frame rate.
- [Final render binding](render-binding.json) verifies every current native
  capture/probe report against the final binary/resources. Original capture PBW
  and manifest hashes are preserved; the phone-only incremental rebundle is not
  relabelled as a new native run.

Visual inspection checked idle, compact Timer/Music, both notification modes,
Peek, generic navigation, long scalar and both long-date views. Native counters,
reading homes, essential content, static secondary and footer hierarchy remain.
Very long stress scalars retain their entire value at the existing smaller size;
this work does not round or silently remove data.

## Expanded tick diagnostic

The first expanded helper run observed no recording-clock pixel change after
one 1.15s sample. That result was not reproduced by isolated
[prior-build](tick-comparison/previous/report.json),
[current-native](tick-comparison/current/report.json) or the
[prior five-fixture sequence](tick-comparison/previous-sequence/report.json).
Each recording case changed after the first 1.15s wait. No production clock or
layout-hiding regression was established. The initial result stays
[inconclusive](initial-expanded-check.md); the full 64-case set does not claim
clock advancement. Portable clock/lifecycle tests and the independent exact
current-native clock proof pass.

## Phone and device limits

The [phone layout preview](phone-preview.html) contains the actual generated
Clay page with a labelled in-memory mock bridge. Buttons/chevrons are explicitly
centered and shortcut labels are larger. Generated config, packaged source/map
identity and portable form tests pass. Fresh browser rendering remains blocked
by the sandbox established during the initial trial; no new browser-pixel,
large-text or real WebView fit claim is made here. Historical browser evidence
remains historical. No real phone, physical watch, live providers or battery
measurement was used.
