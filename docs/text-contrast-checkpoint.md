# Readable supporting text — 8 November 2026

Dynamic's supporting text now uses the normal foreground colour. This removes
the grey wash from explanatory/help text and secondary labels: black on white,
white on black and the saved text colour on a custom watchface palette.

The change affects text ink, including inverted selection text where applicable.
Font sizes, layout, saved appearance choices, artwork, decorative separators,
source validity and action availability remain unchanged.

Current candidate: `build/candidate/Dynamic-0.18.3.pbw`. SHA-256:
`72c5d1eab44252944397aec57db6a4f2e1ffe176787c2f3dbd851e566629502c`.

`npm test`, `npm run build`, `npm run check:artifact` and
`npm run check:config` passed. 24 native previews were recaptured at actual OS Medium, covering light/dark, both clock formats, music, timer, notification and Peek states.
Evidence: `build/qa/text-contrast/native-previews/previews.json`. Native runs used verified Emery 4.45.0 assets;
phone APIs/providers are simulated and no new physical-device test is claimed.

The phone preview assets were regenerated from those native captures, then
rebuilt and audited against the same native code/resources with SDK timestamp
normalization. Packaged settings passed the installed Chromium checks in
`build/qa/text-contrast-browser/report.json`. These use a simulated phone bridge.
The before/after comparison keeps the complete idle/Peek frames and the watch
clock in activity layouts unchanged. Supporting glyphs now use the configured
foreground instead of a blended grey.

Existing checkpoint hashes describe their original candidates; this is a new
local candidate. No version bump or release archive was created.
