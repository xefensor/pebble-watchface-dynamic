# Historical REDESIGN.md

Retained before the2026-11-07 rework. Use current UI/maintenance/development
documentation for work on main; older evidence retains its original scope.

# Design branch — coherent readability revision

**Unpublished 0.18.2 on `design/pebble-native-redesign`.** Xef requires readable
text throughout, icons aligned with their adjacent text and comfortable clearance
inside each group. He rejected smaller top time/date in 0.18.0, then rejected the
header-only 0.18.1 correction because the remaining type and layout were out of
proportion. Those requirements take priority over copying Pebble's small utility
text. Main and earlier versioned artifacts remain unchanged.

## Current review proposal

Idle, compact activities and Peek now share a coherent hierarchy. Fredoka remains
the dominant clock/value family. Roboto Condensed Bold supplies date, labels,
secondary and captions: 26pt date (19px digit ink), 20pt labels/status (14–19px
ink including descenders), 22pt secondary (16–21px), and 24pt primary/media captions
(17–23px). Exact per-string ascent/descent determines fitting and centering;
point size alone never determines the visible box.

The compact header is one horizontal time/date group. Two readings sit below it,
with larger labels and values. Semantic graphics use the space when available;
a wide normal value or status text takes priority over the optional graphic.
The static secondary has a 26px band with a 24px icon frame. A divider separates
it from the primary. The complete primary block remains bottom aligned above
its contextual footer, which ends at y216 with 12px below it. Adjacent lines use
3px actual ink gaps; the primary/footer group uses an 8px gap. Ordinary captions
center within 28px image/icon frames, with icons centered by visible ink.

These are deliberate density choices for review:

- **Compact numeric date:** activity views retain the prominent numeric date;
  weekday and numeric date remain together on Idle and Peek. The compact weekday
  fades during the existing layout transition rather than competing for space.
- **Larger media text:** media keeps two primary title lines with a secondary,
  a 28px cover and one larger artist line. A long artist/name ellipsizes at its
  end; it does not scroll or shrink to tiny type.
- **Common structured content:** Paused becomes “Paused · Tea” in the footer;
  workout pace and navigation street precede optional identity. Required state
  and an atomic value/unit win over optional labels/app names. Long optional
  identity ellipsizes first. Two explicit footer lines are reserved for a
  required paused state/detail that cannot share one line.
- **Messages:** with a secondary, a readable title and one readable body line
  take priority. Remaining text truncates at the end. The footer keeps context
  without duplicating the message title/body.
- **Exceptional fit:** unusually long essential primary data may need the space
  otherwise used by a secondary. Native presentation receipts and Open Activity
  then report no Secondary. Ordinary Paused/Workout/Navigation/Message pairs keep
  the large static secondary; there is no automatic rotation or hidden role.

Normal body/status text uses at least 20pt Roboto. Existing unusually long
numeric stress values can still use the bounded smaller value sizes to preserve
all digits; this is not a fallback for ordinary captions or labels. No value
rounding, new scrolling or paging is introduced.

## Phone

The Clay page retains its 17 languages, 16px body/14px hints, neutral cards and
blue controls. The prior correction's centered button labels/chevrons and 14px
section/preview shortcuts remain. Confirmed load/save, persistent Saved,
uncertain drafts, local Discard, exact custom RGB and legacy closes retain their
existing controller. Native preview artwork-preservation rectangles now match
the 28px media cover at x10/y188.

[Open the actual new page with a local sample bridge](qa/0.18.2/phone-preview.html).
Its saves stay in page memory. Fresh browser pixels and real-phone integration
remain unverified because Chromium is blocked by the sandbox.

## Evidence

[Validation](qa/0.18.2/VALIDATION.md) distinguishes actual native captures with
synthetic source data, portable tests, exact packaged audit and device limits.
The new composition was reviewed in actual Idle/Timer/Music frames before the
expanded capture sweep. Older 0.18.1 evidence remains historical, including its
inconclusive first tick sample; it is not relabelled as verification here.
Logical identity, source validity, expiry, privacy, routing leases, animation-off
and covered-view behavior retain their existing contracts. No public release,
store submission, real phone, physical watch or battery measurement is claimed.
