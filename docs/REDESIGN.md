# Design branch — readability correction

**Unpublished 0.18.1 on `design/pebble-native-redesign`.** Xef rejected the
smaller top time/date and icons sitting above adjacent text in the first trial.
Readability and comfortable internal alignment take priority over copying
Pebble's small utility text. This correction keeps those requirements separate
from the original styling proposal. Main and earlier versioned artifacts stay
unchanged; the shared standard has not been replaced.

## Watch

The date now uses Gothic **28 Bold**, with 18px visible capitals/numerals,
instead of the first trial's 11px ink. The compact Fredoka time grows from 42
to 46, with a wider 108px fitting allowance. The idle Fredoka clock remains
large. Reading labels use Gothic 18 Bold and their widths are measured in that
actual font. `31.12.` and `23:59` fit together without reducing the date.
The date group leaves room above accented weekdays such as ČTV and ÚTE;
its geometry accounts for actual native font accent bearings.

Caption/icon groups use actual visible ascent and descent. The primary footer's
caption centers inside its existing icon/image frame; the secondary caption
centers around its 16px icon. Direction symbols center against main-value ink,
excluding the layout's own icon padding. This preserves the bottom-aligned
primary composition, fixed reading homes, one static secondary and the footer's
y216 boundary, with 12px below it. Media artwork and multiline artist text retain
their established composition. Content, not a point-size box, determines fit.

Measured native centers differ by at most half a pixel for the Timer footer,
notification footer and secondary row; media artwork and its caption block have
the same center. There is no new scrolling, paging or value rounding. Existing
stress cases still preserve an entire unusually long essential scalar at a
smaller size; ordinary values retain their larger hierarchy.

The first trial's stronger semantic icons and bounded incoming settle remain.
Logical identity, source validity, expiry, privacy, routing leases, animation-off
and covered-view behavior are unchanged.

## Phone

The Clay page retains its 17 languages, 16px body/14px hints, neutral cards and
blue controls. Section/preview shortcuts now use 14px labels. Buttons explicitly
center their labels, and select chevrons use their own visual center instead of
an inherited negative margin. Form loading, exact RGB values, persistent Saved,
uncertain drafts, local Discard and legacy closes keep their existing controller.

[Open the actual new page with a local sample bridge](qa/0.18.1/phone-preview.html).
Its saves stay in page memory. Fresh browser pixels and real-phone integration
remain unverified because Chromium is blocked by the sandbox.

## Evidence

[Validation](qa/0.18.1/VALIDATION.md) separates current evidence from the old
trial: 24 normal native states, 64 expanded layout cases, 24 long-date/time
states, actual motion frames and independent clock probes. The expanded set is
layout-only; an initial tick-timing check was inconclusive. Independent old and
current recording-clock probes show advancing pixels. Neither that gap nor
portable tests establish physical-watch performance or battery use.

The corrected build has passing portable/native tests and an exact packaged
font/source audit. No public release, store submission, real-phone or physical
watch testing was performed. Historical 0.17 store material remains unchanged.
