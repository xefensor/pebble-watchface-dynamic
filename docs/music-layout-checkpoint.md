# Music layout checkpoint — 2026-11-12

Dynamic's primary music activity now follows the reference video's composition:
a full-width title above 40×40 px artwork and up to two smaller artist lines.
The artwork is at x=10, bottom y=216; the artist starts at x=58 with 132 px of
width. Artist roles are Roboto Condensed Bold 16/20/22 for Small/Medium/Large.
Both elements share the bottom anchor, measured artist ink reserves its full
height, and the title keeps its font and an 8 px gap. Useful comma breaks retain
punctuation; the final artist line ellipsizes. Paused remains first. An optional
secondary yields before the primary title disappears.

The music-note placeholder reserves the same 40 px home as loaded artwork.
The existing paired outgoing/incoming slide uses the same measured layout and
owning transient snapshots. Provider data, playback/source validity, privacy,
navigation, persistence, UUID and message keys are unchanged. Halftone is unchanged.

Only music receives the new geometry/font role. Font profile fields and resource
IDs use bounded byte storage; font handles and date/time buffers move into the
existing once-allocated native state. Window unload still releases fonts before
that state is freed. Comma fitting reuses its output buffers. These internal
storage/code reductions keep the native virtual size at **65,524 bytes**, below
the SDK's 65,535-byte process-info limit, without changing the clock or other UI.

## Candidate and automated checks

Candidate: `build/candidate/Dynamic-0.18.3.pbw`.

SHA-256: `2664db89d989ed3056ba37b2a3cf20fdb14bc8907dec3a5c2a0347e75231a276`.

`npm test`, `npm run build`, `npm run check:artifact` and
`npm run check:config` passed. Portable regressions cover all artist roles,
exact/below/above width boundaries, two-line ellipsis, commas, missing artists,
accented text, Paused, secondary yielding, and identical loading/loaded geometry.
The existing lifecycle, navigation, settings and non-music layout tests pass.

## Native emulator checks

- 72 fresh standard preview frames across actual OS Small/Medium/Large, light/dark,
  12/24-hour and native Peek. All 60 non-music frames match fresh captures of the
  previous candidate. Live Timer countdown pixels at x10..189/y124..183 were
  excluded; all other compared pixels match. Main clock comparisons also pass.
- 144 music frames: 3 sizes × 6 artist/title cases × 2 themes × secondary
  provided/absent × normal/Peek. Cases include a single artist, Justice/Tame
  Impala, long titles/artists, Czech/German accents, missing artist and Paused.
  Unobstructed primary/secondary presentation receipts are checked. Peek captures
  record actual native clipping/visibility; they do not claim hidden music painted.
- 88 loading/transition frames across three sizes and Large Peek. Artwork changes
  only the reserved image home. Observed normal-layout intermediate frames match
  translated outgoing/incoming pixels, and the secondary remains fixed. Captured
  GIF cadence does not establish hardware animation latency.
- Direct saved Text Size choices Small/Large/Medium/Follow Pebble receive immediate
  native application receipts and retain their pixels through relaunch (8 frames).

Evidence is under `build/qa/music-layout/`, `build/qa/music-layout-checkpoint/`
and `build/qa/font-size-direct/music-layout/`. The checkpoint includes a consolidated
`summary.json`, per-frame comparisons and `repack-provenance.json`. The 24 Medium
phone preview assets were refreshed from native screenshots; their 40 px artwork
region remains excluded from palette recoloring. Final packaged native binary
and resource bytes are identical to the emulator-tested candidate. Only the
native manifest's SDK `generatedAt` metadata changes during repacking.

The matrix is reproducible with `scripts/emulator-native-sizes.py`,
`scripts/emulator-music-layout.py --size 1` (also 2/3),
`scripts/emulator-media-motion.py --size 1` (also 2/3 and `--peek`), and
`scripts/emulator-font-size-direct.py --label music-layout`.
Set `PEBBLE_QA_OUTPUT_ROOT=build/qa/music-layout-checkpoint` for motion evidence.

SDK 4.33.1 / CLI 5.0.40 and Emery firmware v4.33.2; synthetic sources use production
Music/Activities adapters and encoders. SDK/toolchain archives were restored from
the local cache and checked against `recovery-validation/toolchain.json` hashes.
The build reused verified installed dependencies without npm lifecycle scripts.
Local validation sourced `recovery-validation/env.sh` with
`PEBBLE_RECOVERY_SKIP_NPM=1` and `PEBBLE_RECOVERY_TIMESTAMP=1794470400` for the
restored workspace-local CLI and reproducible native resource timestamps.
Available Node 26.12.0 / Python 3.13.16 differ from the contributor runtime pins.
No physical watch, real paired phone/provider, release or publication is claimed.
