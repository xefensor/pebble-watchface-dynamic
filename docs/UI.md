# Dynamic: current UI

The accepted UI is merged into main; implementation version 0.18.2 remains
unpublished. Published downloads retain their original versions and interfaces.

Readable Roboto Condensed utility roles and dominant Fredoka values are the accepted main UI. Compact numeric date and Idle/Peek weekday/date remain. Two readings keep their positions; the primary block is bottom-aligned above its footer, with the secondary above it. Structured values/units and Paused/pace/street precede optional identity. A hidden secondary must not escape through the navigation source. Animated layouts, Peek response and genuine item transitions are part of Dynamic's design. Dynamic has no physical action rail.

The shared `pebble-xoce-ui` package supplies the26px utility date/header,
24px body and22px secondary role definitions, common timer/music/navigation/
direction/battery/phone symbols and aspect-fit image geometry. Dynamic loads
its own fonts and keeps its Fredoka display/value composition, semantic weather
illustrations, palette and native Peek movement. Reading labels, textual states
and activity roles use the readable22px secondary role. Non-vector unit fallbacks
also use at least22px and are measured at the same size before choosing a layout.
Activity icon boxes remain centered beside measured glyph ink. Shared helpers
do not own activity selection, expiry, privacy, navigation or clock scheduling.

## Complications on the review branch

The two global Pebble complication choices retain their positions in equal
columns. Each reading combines a source symbol and its value/unit in one group.
The idle value targets 40px; activity and Peek values target 28px. Units and
meaningful captions use Roboto Condensed 22px. Clock/date geometry and the ACT3
activity composition remain independent of this reading layout.

Ordinary temperature and rain captions are omitted when their symbols and units
already identify the reading. Feels-like, high/low, forecast, custom labels and
needed public source names remain. Rain and humidity have different symbols.
The phone adapter passes public source context through the existing label field;
music and notification identity retain their transient privacy boundary.

Fit complete values and units before optional decoration. A long unit can use
the second line when that line is free. A meaningful caption keeps its own second line. Numeric overflow uses a clear localized fallback, rather than
silently cutting digits or reducing them to tiny text. Free text starts at its
beginning and can use bounded wrapping/ellipsis. Images preserve aspect ratio.

Complication icons use the active, contrast-aware accent colour. Numbers and
units keep the foreground colour, and provider images retain their source palette.
Complications have no progress underlines. Ordinary single-line readings let the
activity area start20px higher; qualifiers, second-line units and other reading
shapes retain their space. Loading, unavailable and expired states clear the old
value, retaining only permitted identity. Unconfigured positions stay empty; the
other reading does not move into their place.

Clock and reading groups animate between idle and activity layouts with bounded,
monotonic Pebble timing. Native Peek follows the available height rather than
snapping to another layout. The complete date moves/fades out before the clock
crosses its row, then the target date enters; measured ink bounds prevent overlap.
Genuine source/run or media-item replacements retain an incoming transition.
Ordinary ticks and repeated data do not replay it. Expiry/privacy still clear
immediately, and covered views do not schedule decorative work.

These animations are intentional. Improve their timing, paths and clipping;
removing them is a separate user decision, not a substitute for fixing them.

This branch uses the local unpublished Core 0.5.2-dev.0 candidate for its optional
public-label callback. The v4 wire, message-key numbering, saved preferences and
global complication picker are unchanged. Forecast-series charts and new native
health sources are separate features, not part of this layout change.

Animation endpoints preserve the large type roles and readable spacing. The
underline removal, accent icons and expanded activity area remain independent
of the motion correction.

Preserve UUID, appended message-key numbering, ACT3 source/run identity, observation and original validity. Private media/notification content is transient. Keep one native render plan, one static secondary row and one shared queue. Text starts at its beginning and truncates; no marquee, paging or silent rotation. Only genuinely painted original record indices may be confirmed/exported for navigation. Clock ticks never persist state or send messages. Covered views reconcile expiry without decorative work or fresh presentation claims.

## Native/phone verification

Inspect actual affected compositions, full text, glyph/icon alignment, edges,
light/dark and relevant critical states. Keep the actual packaged native payload
and report hashes bound together. Preserve the accepted complete UI rather than
reintroducing a historical trial. Phone palette is independent of watch appearance.
Read [maintenance contracts](MAINTENANCE.md) before changing persistence, routing
or source lifecycle. Current build/QA commands are in [CONTRIBUTING](../CONTRIBUTING.md).

## Frozen evidence

[Version 0.18.2 evidence](qa/0.18.2/VALIDATION.md) belongs to its original
frozen build at `4b2c01246c93d8235469b8fadee88c77242491a0`. Routine development uses build/candidate and build/qa;
that output does not overwrite these records. Physical phone/watch checks and
fresh browser checks remain explicitly separate.
