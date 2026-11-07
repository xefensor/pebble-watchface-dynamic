# Dynamic 0.18.0 design trial validation

Local branch `design/pebble-native-redesign`, 7 November 2026. No commit, push,
public release or store submission was made by this implementation task.

## Passing checks

- `npm test`: 134 JS tests, 13 native C fixtures and the production-callback
  lifecycle regression. This includes unchanged identity/no replay, an incoming
  overshoot remaining active through settle, animation-off/covered-view handling,
  expiry, source/privacy/navigation contracts and settings snapshot semantics.
  See [portable-tests.log](portable-tests.log).
- 19 release-automation tests and 8 minification/serialized-Clay regressions:
  [release-tests.log](release-tests.log), [minification-tests.log](minification-tests.log).
- SDK 4.33.1 Emery build, then incremental JS-only rebundling after captures.
  The exact [artifact/font/source audit](artifact-audit.json) passes for
  `dist/Dynamic-0.18.0.pbw` and its debug archive. All 46 keys, UUID, Core 0.5.1,
  Activities 0.4.4, licensed fonts and packaged payload/source identity remain.
- Loaded native image is 62,464 bytes, leaving 3,071 below the 65,535 limit.
  Static virtual extent is 62,880 bytes. The SDK reports 68,194 bytes available
  for heap; this is not a runtime/battery measurement.
- [24 fresh static Emery captures](native-previews/previews.json) cover six
  states, two clock formats and light/dark palettes. Their binary/resources
  hashes match the final package and embedded phone preview. Visual review
  inspected idle light/dark, Music, Timer+Music, notification, summary and Peek
  states; Fredoka hierarchy, reading homes, static secondary and footer remain.
  [Final render binding](render-binding.json) compares the final PBW against
  both original capture reports. Incremental phone-only rebundling changed SDK
  manifest metadata, while native binary/resources remain identical. Original
  capture PBW/manifest hashes are retained; no capture was relabelled as a rerun.
- [Actual replacement frames](native-motion/motion.json) and
  [GIF](native-motion/incoming.gif) show Music replaced by a notification. The
  settled Music baseline matches the fresh static Music capture. Twelve native
  screenshots produce four distinct decoded GIF frames, each checked against
  original capture RGB; no interpolated frames. Screenshot acquisition takes
  around 100–130ms per sample, so it does not capture every 50ms animation step.
  The frame sequence shows entry, overshoot and settled position while the clock
  and reading region remain fixed. Host timing does not measure watch latency.
- `node scripts/generate-config.cjs --check` and `git diff --check` pass.

## Browser and real-device limits

The fresh Chromium attempt exits **133**, with crashpad
`setsockopt: Operation not permitted`; see [browser-attempt.log](browser-attempt.log).
The actual packaged browser workflows (`check-settings-activities.cjs` and
`check-settings-stay-open.cjs`) could not run for this candidate. In particular,
the new spacing, 14px hints, narrow/short viewports, enlarged text, contrast and
reduced motion have not been freshly rendered/checked in a browser.

[phone-preview.html](phone-preview.html) is the real generated Clay page with a
labelled sample bridge. Open it directly; `?lang=cs` and the other 17 supported
locale values select sample translations. Its saves affect only page memory.
It proves neither phone persistence nor SDK delivery.

The settings controller, bridge and storage contracts are preserved and covered
by portable tests. Historical [0.17.0 browser checks](../0.17.0/VALIDATION.md)
remain historical; they are not reruns on the new CSS or artifact. Save → close
→ reopen/restart still requires fresh browser and real-phone verification for
this trial. No physical watch or Android WebView was used. Physical readability,
motion feel, vibration, provider delivery and measured battery remain unverified.

The existing 0.17.0 store kit and top-level asset provenance remain historical.
Older PBW/source/debug files and published tags/links were not rewritten.
