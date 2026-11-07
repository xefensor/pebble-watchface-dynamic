# Pebble-native design trial

**Local, unpublished 0.18.0 on `design/pebble-native-redesign`, 7 November 2026.**
This is an aesthetic alternative for Xef to review. It does not replace the
canonical XOCE shared standard or change a published release.

## Watch

Keep the Fredoka clock and numbers, fixed two-reading homes, bottom-aligned
activity/footer group and exactly one static secondary. The trial introduces
Pebble's native Gothic 14 Bold for reading labels and Gothic 18 Bold for the date.
Their widths come from the actual system fonts. Multi-line activity body text
retains Roboto Condensed and its audited per-glyph metrics, protecting fitting,
essential values and the established layout. This is a selective native-font
trial, not a claim that one Gothic size fits every role.

Semantic directions and navigation use consistent 2px strokes, with filled
hourglass and music details for stronger small silhouettes. Supplied provider
images and artwork keep their own palette/meaning.

Real primary run/media-item replacements enter from the right over the existing
280ms interval, passing their target by at most 3px and settling. The 520ms clock
and reading morph remains. Ticks, leases, artist/art corrections and playback-only
updates keep the original identity gates. Covered views settle/cancel motion;
return reconciles without replay. Animation-off, expiry, privacy, presentation
receipts and navigation leases retain their existing contracts. Text never
marquees, pages or cycles.

## Phone

The real Clay page uses **Dynamic → brief localized intro → 48×4px accent line**,
neutral section headings, 16px body/14px hints, 16px insets and 24px section gaps.
It retains the three section shortcuts and 24 actual-native preview states.
Fields are at least 44px and Save 48px. Accent-filled primary buttons have
contrasting text; footer feedback is left aligned. Control feedback lasts 144ms;
disclosures enter by 3px over 160ms, respecting reduced motion. Saved remains
quiet and persistent. There is no watch-font imitation in phone body text.

All 17 languages, exact custom RGB values, activity ordering/privacy, confirmed
load/save receipts, uncertain drafts, local Discard and the legacy close fallback
remain. [Open the actual Clay review fixture](qa/0.18.0/phone-preview.html), adding
`?lang=cs` or another supported locale if desired. Its labelled mock bridge holds
sample saves in page memory only and has no phone/watch connection.

## Sources and evidence

The prior research reviewed [PebbleOS at 39a8ed3](https://github.com/coredevices/PebbleOS/tree/39a8ed3c2744c08404c3ee505dabcb082f41d998),
including native menu, Music, alarm-editor and ActionBar motion. Those examples
use role-specific timing and settling; they do not establish a universal short
duration limit. Dynamic's motion and spacing are our adaptation, not OS defaults.
The installed Emery SDK 4.33.1 exposes the public Gothic 14/18 Bold keys used here;
see [the public font API](https://developer.repebble.com/docs/c/Graphics/Fonts/)
and [animation API](https://developer.repebble.com/docs/c/User_Interface/Animation/).
Historical watchface/source references remain in [NATIVE-STYLE](NATIVE-STYLE.md).

[Validation](qa/0.18.0/VALIDATION.md) records passing portable/native tests,
the exact package audit, 24 fresh Emery captures and an
[actual-frame replacement GIF](qa/0.18.0/native-motion/incoming.gif).
Fresh Chromium/browser QA is blocked by crashpad `setsockopt` EPERM (exit 133).
Phone layout, large text, reduced motion and real-phone persistence still need
fresh browser/device review. Earlier 0.17.0 browser evidence stays historical.
Physical-watch motion, battery and live provider behaviour are unverified.
The existing 0.17.0 store kit and asset provenance remain historical; no store kit
or public release is prepared for this branch alternative.
