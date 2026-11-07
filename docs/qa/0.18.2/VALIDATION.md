# Dynamic 0.18.2 — coherent readability validation

Unpublished revision on `design/pebble-native-redesign`. Xef rejected the prior
header-only correction and requires readable sizes, balanced spacing and aligned
icons throughout. Earlier artifacts, published releases and main remain intact.
The [design notes](../../REDESIGN.md) distinguish his requirements from the
compact-date, media and footer density choices proposed for review.

## Passing checks

- **134 JavaScript tests, 13 strict portable C fixtures and 2 extracted actual
  production-callback tests:** [test log](portable-tests.log). The native checks
  cover the new bands, complete essential values, protected footer prefixes,
  glyph metrics, clock scheduling, covered-view lifecycle and presentation gating.
  The actual `prv_note_presentation` harness proves a candidate that was not
  painted cannot be exported as Secondary or cap the visible Primary's lease.
- **19 release automation and 8 minification/serialized-Clay tests:**
  [release](release-tests.log), [minification](minification-tests.log). Generated
  configuration matches source. No publication/release preparation is performed.
  [Final preview tests](final-preview-tests.log) repeat all 134 JS checks after
  the fresh native preview artwork is rebundled.
- **SDK 4.33.1 build and [exact packaged audit](artifact-audit.json):** loaded
  image 62,536 bytes, 2,999 bytes below the 65,535 limit; static virtual extent
  62,952 bytes; resources 235,648 bytes. SDK free RAM is a static build estimate,
  not measured runtime peak heap, stack use or battery consumption.
- **[24 ordinary presets](native-previews/previews.json),
  [68 expanded compositions](native-activities/activities.json) and
  [24 long-date states](native-long-date/previews.json):** actual unmodified
  200×228 Emery Screenshot-service frames, synthetic source data, no phone JS.
  Both palettes/formats, Idle/Peek, notification privacy, media/generic activity
  roles, empty/missing artwork, Paused, directions, long values and 31.12./23:59
  are covered. The expanded sweep is explicitly **layout-only**.
- **[Independent readability measurements](readability.json):** ordinary visible
  date ink is 19px, reading labels 14px, secondary 17px in the sampled mixed-case
  caption, primary caption 17px. Exact packaged capitals at utility sizes
  20/22/24/26 are 14/16/17/19px. Adjacent icon/caption ink centers differ by at most
  1px. All 116 static frames are checked; full-height ordinary/stress frames keep
  the last 12px clear. Peek's lower area belongs to the OS panel.
- The same check confirms every stored localized weekday fits the date column
  and has at least 5px top room using the **actual packaged Roboto glyphs**,
  including Czech accents. This is a font/source geometry proof, not a live
  Czech phone/watch screenshot. Compact deliberately omits the weekday.
- **[Actual incoming-motion frames](native-motion/motion.json)** and
  [frame-only GIF](native-motion/incoming.gif) preserve bounded incoming-only
  settle and the existing 280ms/520ms contracts. Screenshot acquisition timing
  does not measure physical watch frame rate or latency.
- **[Final render binding](render-binding.json)** compares the final native
  executable/resources against all seven current native capture/probe reports.
  They match exactly. The incremental phone-preview rebundle changes only SDK
  manifest generation timestamps; the check compares every other manifest field
  and preserves original report hashes.

[All 60 earlier tracked dist artifacts](earlier-artifact-identity.json) match
the committed baseline byte for byte. Source packaging excludes compiled PBWs,
including generated QA installation copies; older archives are not rewritten.

The complete ordinary/expanded/long-date composition sheets were visually
inspected, with individual review of Idle, Timer, Music, Paused, Workout,
Navigation, Message, notifications and long structured values. Ordinary paired
Paused/Workout/Navigation/Message retain the large static secondary. Required
state/pace/street precede optional identity, and footer wrapping protects an
atomic value/unit. A new paused-wide-detail fixture preserves all 13 digits
and its km unit on a second readable 22pt footer line. Exceptional unfit optional content yields and the receipt
exports no Secondary. There is no silent role rotation.

## Clock proof and diagnostic scope

The expanded sweep does not claim tick verification. Independent
[elapsed-primary](native-clock-proof/report.json) and
[folded-detail](native-folded-clock-proof/report.json) captures use stable
synthetic fixtures, advance time without resending data and compare unmodified
native frames. The corrected helper requires stable header/readings and bounds
changes to the activity; the folded-detail case additionally confines changes
to its visible footer at y188–216. This validates scheduling when a clock detail
moves out of the old support-text block.

The first attempt at those probes raced QEMU's startup RTC reset: its first
frame was expired Idle and later frames recovered the fixed clock. A broad
“pixels changed” flag was insufficient. That attempt is not tick evidence; the
helper was corrected to wait for SetUTC before injecting time-bound data and to
assert the changed region. The final report refers only to the corrected run.
The older 0.18.1 initial timing gap remains historical and inconclusive.

## Phone and device limits

The [phone preview](phone-preview.html) is the actual generated Clay page with
an explicitly labelled in-memory sample bridge. Its new native images use the
same geometry as production. Artwork preservation now uses the real 28px cover
at x10/y188; portable preview/palette/custom-RGB tests pass. Phone workflows,
17 languages, privacy, Save-and-stay, local Discard and the legacy close fallback
retain their existing automated coverage.

Chromium remains blocked by this environment, so no fresh browser-pixel,
large-text WebView or real-phone claim is made. No live provider, physical watch,
measured battery use, store submission or public release is verified here.
