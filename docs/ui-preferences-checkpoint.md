# Dynamic preferences checkpoint — 2026-11-08

The latest candidate is in the [legacy Quiet Time checkpoint](ui-preferences-migration-checkpoint.md). The evidence below describes the original preference candidate.

Local candidate only. No version change, push or publication. The earlier
[native type checkpoint](native-type-checkpoint.md) records the original
supporting-type, clock/Peek and locale checks.

## Result

Text Size independently selects Follow Pebble, Small, Medium or Large. Manual
choices use the same supporting font/layout profiles as the corresponding
launch-time OS preference. The Fredoka clock and its geometry remain unchanged.

Appearance independently selects Follow Pebble, Follow Quiet Time or Manual.
Manual Light/Dark selects the saved Day/Night palette; both remain independently
customizable. Legacy Quiet Time users migrate to Follow Quiet Time; other saved
palettes migrate to Manual Light without changing their RGB values. The complete
snapshot preserves original RGBs before GColor quantization. A fresh phone with
no explicit native preferences adopts the watch snapshot before delivering.

SDK 4.33.1 has no supported system appearance API. Follow Pebble Appearance stays
saved, uses the last Manual Light/Dark fallback and explains its unavailability.
System/scheduled appearance switching remains pending for a supported SDK/API.
Quiet Time and its saved palettes remain independent of that mode.

The existing verified phone Save and Android writer handoff remain. Only an exact
native revision/13-field receipt after persistence readback permits Applied on
watch. Transport ACKs, old revisions, failed writes and unrelated source traffic
cannot establish it. Metadata storage failure prevents a reusable revision from
being sent. Pending state survives reopening; explicit Retry and fresh native
reconciliation have bounded attempts through the existing queue. Status polling
preserves drafts and cannot retain Applied after a contradictory settings read.

## Candidate and checks

`build/candidate/Dynamic-0.18.3.pbw` SHA-256:
`7c74d435e723c122accb1d833df3471148b3ed8442a750c5843afbbec73ed489`.

SDK 4.33.1 / CLI 5.0.40. Validation used Node 26.12.0 / Python 3.13.16; the
repository's documented Node 22 / Python 3.12 pair was unavailable locally.

- `npm test`, `npm run build`, `npm run check:artifact` and `npm run check:config`
  pass. Source checks include 151 JS cases, 15 portable native C programs, actual
  lifecycle callbacks, the production display codec/store and the actual native
  palette/type application routines. Cases cover all size mappings, both Quiet
  Time states, Manual/unsupported Follow independence, cache invalidation on type
  change, exact RGB migration, failed/readback-corrupt persistence, stale receipts,
  retry exhaustion, late callbacks and both older numeric-key storage forms.
- `python3 scripts/emulator-preferences-bridge.py` runs the exact optimized packaged
  PKJS/plugin against the candidate native payload. On actual OS sizes 1/2/3, the date
  and seeded activity layouts use the corresponding native profile.
  Manual profiles match the corresponding Follow Pebble pixels, including after
  changing from a different live profile, and survive relaunch with a conflicting
  OS size. Both palettes, unsupported Follow with Night fallback and stored Quiet
  Time/raw RGB values survive relaunch. Native transport ACK and save/readback
  receipt remain distinct. The seeded music observation stays at its original
  timestamp; settings do not refresh it.
  Firmware 4.33.2: `build/qa/preferences-bridge/1794166187170562382/report.json`.
  Firmware 4.45.0: `build/qa/preferences-bridge/1794166061081405907/report.json`.
  Each has twelve raw native captures. The phone SDK/storage bridge is simulated;
  the watch rendering, protocol and persistence run in QEMU. The first 4.33.2 run
  stalled; send/ACK bookkeeping is now serialized in the harness and the final
  rerun passes with the same PBW. Transport diagnostics contain keys/IDs only.
- `node scripts/check-settings-stay-open.cjs` passes 11 checks with 13 raw Chromium
  captures of the exact packaged HTML/PKJS/plugin. It covers 320/360px Light/Dark,
  English/Czech and all 17 dictionaries, save/reopen, raw palettes, independent
  Android stores, writer handoff/failure, Discard, enlarged text, manual Night,
  unavailable Follow fallback, Quiet Time, pending/applied metadata, contradictory
  status reads and preservation of unsaved drafts. Evidence:
  `build/qa/settings-stay-open/report.json`.
- Twenty-four fresh actual native preview scenes from the changed renderer live
  in `build/qa/preferences-previews-cache-fix/native-previews/previews.json` and
  the active settings preview assets. The final package differs from that native
  capture only at the verified SDK resource timestamp; resources match exactly.
  The development audit does not claim a fresh capture of the final timestamp.
  Running timer seconds may change between transfers; every pixel outside its
  exact value region must settle and the raw PNG is unchanged. A regression test
  rejects differences beyond that region. Other scenes require identical pixels.
- Body metric lookup now uses contiguous codepoint ranges, freeing native space.
  Every codepoint lookup from 0 through 0x10FFFF matches the complete glyph
  manifest. All 7,360 ascent and 7,360 descent entries match the packaged PFOs.
  The eight fonts, 920-entry repertoire and fallback remain. Fredoka outlines
  regenerate exactly from their original licensed source. Resources stay 260,444
  bytes; native virtual/static extent is 64,388 bytes within the 65,535-byte limit.
- `python3 scripts/emulator-display-heap.py` measures startup after loading all
  eight body fonts on 4.45.0: native state 15,576 bytes, free heap 43,876 bytes.
  Evidence: `build/qa/preferences-heap/report.json`. This is a startup measurement,
  not a repeated-settings peak/leak measurement.

## Remaining cross-project and physical checks

No physical phone or Time 2 was available. Published-PBW upgrades, mixed-version
Timer delivery and provider-to-face weather verification remain in the final
cross-project stage. Earlier native locale/Peek evidence is separate from this
preference-stage bridge; this checkpoint does not claim a new full Peek matrix.

On hardware, keep custom Day/Night colours and an activity with its original
expiry. Disconnect, save a manual size/Manual Dark, reopen the page, reconnect and
check pending becomes applied. Relaunch against another OS size and check the
saved override. Restore Follow Pebble text. Toggle actual Quiet Time in Follow
Quiet Time, then Manual and unavailable Follow, checking that only the selected
mode controls switching and both palettes survive. The portable tests exercise
both Quiet Time boolean states; the emulator bridge stores/reloads the mode and
does not claim a system Quiet Time toggle run. Finally open/close Peek and check
current painted roles, source identity and the original expiry.
