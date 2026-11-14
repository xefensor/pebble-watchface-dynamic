# Dynamic: current UI

The development candidate retains version 0.18.3. Published downloads and frozen
evidence retain their original typography and interfaces.

Readable Roboto Condensed utility roles and dominant Fredoka values are the accepted main UI. Compact numeric date and Idle/Peek weekday/date remain. Two readings keep their positions; the primary block is bottom-aligned above its footer, with the secondary above it. Structured values/units and Paused/pace/street precede optional identity. A hidden secondary must not escape through the navigation source. Animated layouts, Peek response and genuine item transitions are part of Dynamic's design. Dynamic has no physical action rail.

Dynamic has an independent Text Size choice: Follow Pebble, Small, Medium or
Large. Follow Pebble reads the system size on launch; manual choices use the same
profiles. All apply only to supporting Roboto typography. Medium retains the established roles; the main Fredoka clock
keeps its original numerals, sizes, position, proportions and rasterization.

| Effective size | Date | Text body | Roboto labels, captions and units | Music artist |
| --- | --- | --- | --- | --- |
| Small | 22 | 22 | 20 | 16 |
| Medium | 26 | 24 | 22 | 20 |
| Large | 28 | 28 | 26 | 22 |

These are Dynamic's face-specific roles. Native watch apps use PebbleOS's native
font table. The independently pinned UI library supplies the common OS-choice
mapping, symbols and aspect-fit image geometry; the face owns font resources,
measurements, state, expiry and layout. Emery's OS Small/Medium/Large correspond
to SDK content-size values 1/2/3, read again after relaunch.

Activity values retain Fredoka's numeric fitting, with corresponding vector-unit
sizes; the main clock is independent of all supporting roles.

The same selected fonts measure and draw text. Secondary row height follows its
actual glyph ink. Primary blocks, footer heights, units and line counts fit the
remaining area. Optional secondary activities yield before required state, value
or units; a long required footer can wrap over three lines. An unfit secondary
remains absent from both native paint and Open Activity navigation. The eight
bundled Roboto sizes now include 28; the unused 11-point resource was removed.
The complete source glyph repertoire and visible missing-glyph fallback remain.

## Complication layout

The two global Pebble complication choices retain their positions in equal
columns. Each reading combines a source symbol and its value/unit in one group.
The idle value targets 40px; activity and Peek values target 28px. Units and
meaningful captions use the effective secondary Roboto role. Clock/date geometry and the ACT3
activity composition remain independent of this reading layout.

Ordinary temperature and rain captions are omitted when their symbols and units
already identify the reading. Feels-like, high/low, forecast, custom labels and
needed public source names remain. Rain and humidity have different symbols.
The phone adapter passes public source context through the existing label field;
music and notification identity retain their transient privacy boundary.

Fit complete values and units before optional decoration. A long unit can use
the second line when that line is free. Percent stays beside its number,
including `100%`; the paired numeric size reduces within its existing range
when needed to fit the complete percentage and symbol. A meaningful caption keeps its own second line. Numeric overflow uses a clear localized fallback, rather than
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
snapping to another layout. Reading groups derive second-line leading from their
actual text metrics and move upward when the unobstructed area requires it. The
clock keeps its existing Peek endpoint and motion. The complete date moves/fades out before the clock
crosses its row, then the target date enters; measured ink bounds prevent overlap.
Genuine source/run or media-item replacements retain an incoming transition.
Ordinary ticks and repeated data do not replay it. Expiry/privacy still clear
immediately, and covered views do not schedule decorative work.

These animations are intentional. Improve their timing, paths and clipping;
removing them is a separate user decision, not a substitute for fixing them.

This candidate keeps Core 0.5.2 for its optional
public-label callback. The v4 wire, message-key numbering, saved preferences and
global complication picker are unchanged. Forecast-series charts and new native
health sources are separate features, not part of this layout change.

Animation endpoints preserve the large type roles and readable spacing. The
underline removal, accent icons and expanded activity area remain independent
of the motion correction.

Preserve UUID, appended message-key numbering, ACT3 source/run identity, observation and original validity. Private media/notification content is transient. Keep one native render plan, one static secondary row and one shared queue. Text starts at its beginning and truncates; no marquee, activity/text paging or silent rotation. Optional explicit shake paging changes only the selected reading pair. Only genuinely painted original record indices may be confirmed/exported for navigation. Clock ticks never persist state or send messages. Covered views reconcile expiry without decorative work or fresh presentation claims.

## Per-face display settings

The phone page retains both Day and Night palettes independently. Appearance
selects Day palette, Night palette or Follow Quiet Time. Palette editing is a
separate choice and never switches the active appearance. Quiet Time selects
Night only while Quiet Time is active. Switching modes never overwrites either
palette. Background, text and accent editors always belong to the selected
palette; its detail editors appear only with split background enabled.
The previous Quiet Time toggle migrates to Follow Quiet Time; other existing
palettes migrate to Manual Light without changing their RGB values.

The pinned SDK has no supported system appearance API. An existing Follow Pebble
Appearance choice stays saved and uses the last Manual Light/Dark fallback. Its
legacy option is disabled for new selection; the page explains the limit. An
unrelated Save retains it until the user explicitly chooses another mode.
Global watch settings and Dynamic's main Fredoka clock remain independent.
The page distinguishes a verified phone save from Applied on watch. A complete
native snapshot, persisted and read back with the exact revision, confirms the
latter. Transport ACKs and previous revisions do not. A phone-only save remains
pending across reopening; Retry and reconnect use the same transport queue.
Polling preserves unsaved drafts and never starts activity/source work.

## Native/phone verification

The [native type checkpoint](native-type-checkpoint.md) records actual OS-size captures, locale lookup
fixtures, clock-pixel comparisons and their verification limits. The
[preferences checkpoint](ui-preferences-checkpoint.md) covers manual overrides,
palette migration and native application receipts.

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


## Supporting text contrast

Supporting/help text uses the normal foreground colour rather than blended grey.
This keeps black text on white and white text on black readable without changing
type sizes or layouts. See the [contrast checkpoint](text-contrast-checkpoint.md)
for the current candidate and verification scope.

## Matching reading values

Both visible numeric reading homes use one shared size. Before measuring row
heights, the renderer chooses the largest point size within the face's existing
range that fits both complete values, units and required symbols. Measurement
and painting reuse the same per-slot fit, including optional-icon removal and
second-line units where captions allow them. Required captions retain their line.
Unfittable values use the existing overflow label rather than partial digits.
Empty, unavailable, text-only and bitmap-only homes do not reduce the other
home's numeric size. A single numeric home fits normally. The plan recomputes
with each value, text-size, activity and Peek layout. Supporting values, units and captions keep their existing respective roles;
the clock, face typography, palette and artwork remain unchanged.

The compact-layout implementation and current verification scope are recorded in
[the compact layout checkpoint](compact-layout-checkpoint.md).

## Music loading and saved Text Size

Music reserves its artwork home before the cover arrives and shows a music-note
symbol there. The image replaces that symbol without reflowing the title/artist.
Saved Text Size updates repaint the date, reading/supporting text and activity
text immediately; individual appearance keys and atomic settings both apply.
Track changes slide the painted old primary out left while the new primary
enters from the right. The secondary stays fixed. Old paint is bounded to the
existing transition and clears on expiry, privacy/focus changes and Peek.

See [music and Text Size verification](music-font-checkpoint.md) for candidate
hashes, regression checks, actual emulator frames and remaining device scope.

## Music artwork and artist wrapping

The primary music activity keeps its full-width song title above a 40×40 px
artwork home at x=10, bottom-aligned at y=216. Artist text starts at x=58 in the
remaining 132 px and uses the smaller music-artist role in the table above.
Follow Pebble and manual text sizes select the same profiles. Up to two artist
lines wrap from the beginning; useful comma breaks preserve provider punctuation,
and only the final line ellipsizes. The artist block shares the artwork's bottom
anchor, and measured accents/descenders can make its reserved row taller.

The title retains its font and an 8 px gap above the measured footer. A secondary
activity yields if necessary to keep the primary title visible. Music-note and
artwork states reserve identical geometry, and both painted music blocks retain
their existing outgoing/incoming slide. Other activity layouts and fonts keep
their existing 28 px icon composition. Provider text, playback state, source
validity, privacy and navigation contracts are unchanged.

See the [music layout checkpoint](music-layout-checkpoint.md) for the candidate,
non-music pixel comparisons and native verification scope.


## Optional reading layouts and shake paging

The default remains the existing two-column face. Split clock/details adds an
independent lower background and text palette for day and night. Its boundary
sits halfway between the bottom of the clock ink and the top of the visible
reading ink, including symbols and images. It follows the current animated pose,
reading page, text size and Peek height. Empty homes do not reserve ink; with no
visible readings, the expected reading home supplies the fallback. Stacked rows put
identity/symbols on the left and complete numeric values and units on the right;
optional titles may yield space, required qualifiers and unavailable states may
not. Hiding reading titles does not hide Activities, units or state labels.

Shake paging is off by default. When enabled, global Pebble slots 1–2, 3–4 and 5
form three pages. Skip only pages with no selected slot; unavailable selections
remain visible. A page stays until the next gesture and resets on app restart.
The SDK tap/shake event is debounced for one second and ignored while covered or
in Peek. Changing pages reads the native cache, performs no source request or
persistence write, and invalidates measured/painted Activity roles before layout.
The five-slot host subscription is enabled only with this preference. Activity
text and cards never rotate. PebbleOS excludes watchfaces from its touch API.

Phone previews for these optional layouts are labelled approximate example-data
previews. The default 24 presets per shape are actual native captures. Source
and issue URLs are available in Help & connection.

The split renderer collects reading ink bounds during the ordinary paint pass,
then fills the clear upper panel and paints the clock/date on its own palette.
The phone example uses the same visual-gap rule with Canvas text ink metrics
([HTML TextMetrics](https://html.spec.whatwg.org/multipage/canvas.html#textmetrics));
older engines without ink bounds use font-size estimates. Phone examples remain
labelled approximate because they use browser fonts and example data.

The third Reading layout choice, **Four when idle**, opts into a compact 2×2
idle grid on Time 2 and Round 2. It keeps the selected pair in the first row;
activities and Timeline Peek use the ordinary two-reading composition. The extra
row returns after the idle transition settles. Columns remains the default and
Stacked rows remains selectable. Required qualifiers, source identity and
unavailable states retain measured space; the optional title setting still
applies. Grid supporting type uses 16/20/22 px for Small/Medium/Large, and values
fit at up to 28 px. The main clock retains its 80 px role and moves up 6 px.

Without shake, the grid reads global slots 1–4, collapsing to 1–2. With shake,
the selected pair stays first and the next configured pair fills the second row;
slot 5 keeps its empty partner. A single configured pair is never duplicated.
Transitions use native cached data, with no source refresh or persistence write.
The same midpoint rule measures all visible reading ink in the idle grid.

## Phone settings navigation

The overview links to Layout & complications, Colours, Activities and More & help.
All four screens share one mounted Clay form, one draft and one Save/Discard bar.
Back navigation retains scroll and disclosure state. Reload saved restores the
current screen and reads confirmed settings; it intentionally replaces the draft.
Save reveals and focuses an invalid field's category before reporting validity.
Phone storage and native application receipts remain distinct in the shared bar.

Overview, Layout and Colours reuse one compact idle preview. Expand preview
exposes synthetic scenarios, palette selection, shake pages only when enabled,
and the watch selector only when WatchInfo is unavailable. On Colours the preview
always follows the edited palette. Preview controls never change settings.
Day-only DYN1 import/export stays in its own disclosure and retains its format.

Activity priority has a compact numbered list. Reorder exposes existing drag,
keyboard and move-button controls. Notification controls appear together only
when enabled. Setup guidance and snapshot connection diagnostics live in More &
help; background status updates never navigate or steal focus.

`npm run check:settings-browser` runs the actual generated page in an installed
Chromium with a simulated Pebble bridge. Reports and screenshots are written to
ignored `build/qa/settings-ux/`; they do not establish real Android coverage.
