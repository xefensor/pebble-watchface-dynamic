# Supporting type and Peek checkpoint

This 2026-11-08 development checkpoint retains package version 0.18.3. It is not
a published release. Manual preference overrides and appearance delivery remain
a separate task stage.

Dynamic reads the actual Pebble content-size preference at launch. Its own
Roboto supporting roles use Date/Body/Secondary sizes 22/22/20 for Small,
26/24/22 for Medium and 28/28/26 for Large. The Medium roles retain the established
design. The Fredoka clock, artwork, palette, two reading positions and animation
character remain. Measured text and inline units determine leading, row heights,
footer capacity and available Peek space. The same fonts measure and draw.

A required paused timer detail that needs more width now wraps over three footer
lines. The optional secondary activity yields first, and its navigation receipt
becomes absent. The complete value and final unit remain visible. Regression
checks execute the actual native formatter and the measured layout helper.

The exact final package is `build/candidate/Dynamic-0.18.3.pbw`:

| Payload | SHA-256 |
| --- | --- |
| PBW | `fa56610ff145b1119290269bc200f696d858cc676d4c8d62c3e1ae1fd5ea4cc0` |
| Native binary | `6997367b164b87559a6bc0b3dd1c85721dbd3eb16b107ec97d5e6e58b0f85170` |
| Resources | `db9ae1bc039026afe77bb1f0a775319c0aa00b5a46de706a9d410deaa209d520` |

`npm test`, the independent SDK build and `npm run check:artifact` pass. The
tests include 142 JavaScript cases, 15 portable native programs, three checks
executing actual native callback bodies, workflow, preview-provenance and release
guards. Two release-context workflow cases are intentionally skipped. The
packaged audit verifies every body font's full source repertoire, exact compiled
glyphs and baseline metrics, linked clock outlines, capture provenance,
permissions, licences and exact JavaScript minification.

The eight body resources now include 28-point Roboto; the unused 11-point
resource was removed. All 919 source glyphs and the visible wildcard remain in
every resource. The generated Fredoka clock header remains byte-identical.

Native execution used SDK 4.33.1, CLI 5.0.40 and actual Emery QEMU firmware 4.33.2
over isolated FIFOs. No phone JavaScript or physical device was used. Each size
change uses `QemuContentSize` followed by a fresh native launch: SDK values 1, 2
and 3 are actual Emery Small, Medium and Large, rather than injected type sizes.

| Suite, at each of the three actual OS sizes | Result |
| --- | --- |
| Normal presets | 24 settled native captures covering idle, music, timer, notification and native Peek, light/dark, 12/24-hour clocks |
| Activity layouts | 68 native compositions and 26 independent running-clock checks, including long values, paused state, units, media, notifications, expiry promotion and unfit compact rows |
| Public readings | 60 native captures covering ten cases in idle/active/Peek and light/dark: accented labels with units, feels-like, high/low, a long unit, unavailable/expired data, second slot alone and numeric overflow |
| Clock preservation | All 24 clock regions match the before-change native capture pixels exactly, at every size |
| Native Peek receipts | One unchanged Timer snapshot per size: opening Peek withdraws both visible indices, closing restores the original primary; receipt sequence advances and original expiry is unchanged |

The canonical evidence paths are `build/qa/native-size-1-final/`,
`native-size-2-final/` and `native-size-3-final/`. Each includes `size-checks.json`,
`native-previews/previews.json`, `native-activities/activities.json` and
`native-readings/complications.json`. The additional unchanged-snapshot Peek
check is `build/qa/native-peek-presentation/report.json` and installs the final
package's exact native payload, including its manifest.

The baseline before this renderer change was local PBW
`9852facc2e1d9a61a15ddb90f778204932cd6625dfd2d08fbc4886a6de2903b0`.
Its 24 screenshots were captured before editing. This comparison is distinct
from the later published-PBW upgrade checks.

The type matrix executed the final binary and resource bytes. After captures,
their generated settings previews were embedded with an incremental SDK build
and package step. Both native files remained byte-identical; only the SDK
manifest's `generatedAt`, application timestamp and resource timestamp changed.
`build/qa/native-type-payload-equivalence.json` records that comparison. The
final artifact audit verifies the refreshed preview's renderer fingerprint.

Czech and German lookup fixtures also pass all three sizes, with 24 normal
presets, 12 focused activity compositions, four clock checks and 12 reading
captures per size. They exercise a synthetic 31 December date, including `ČTV`
and the widest numeric date. These are explicit native lookup overrides, not
installed OS language-pack claims:

| Fixture | PBW SHA-256 | Evidence paths under `build/qa/` |
| --- | --- | --- |
| Czech | `8bbd59529c17e1140066af02fc9b2421cd19ee4b731999a843a49521deb7aa09` | `native-cs-size-1-final/`, `native-cs-size-2-final/`, `native-cs-size-3-final/` |
| German | `82ec76d1d47cb7ac3de839f21c3da11516d4e7cfca852df8ae684b05b8c2ed8e` | `native-de-size-1-final/`, `native-de-size-2-final-clock/`, `native-de-size-3-final-clock/` |

One earlier German run retained the emulator's startup clock in its first frame;
the clock-region comparison correctly rejected it. The runner now sets the
fixture UTC before native startup, matching the existing motion harness. The
two corrected German runs above pass without production clock changes.

The Medium motion sample contains 19 unchanged native frames. Both entry and
replacement endpoints settle; one intermediate replacement frame was observed.
Serial capture missed an intermediate entry frame in that run. The source still
uses its bounded 250ms quadratic entry and 231ms incoming replacement. No frames
or timing interpolation were invented.

Representative compositions were visually inspected at native resolution,
including all sizes, the complete three-line required footer, accented labels,
Peek and Czech/German date and paused wording. `build/qa/native-type-sizes.png`
is a labelled contact sheet of unchanged pixels. The native state is 15440 bytes;
the exact candidate logs 43532 bytes of free heap after initialization. Recorded
exits report a peak of 22604 bytes and zero outstanding allocations. The build
reports a 64930-byte static footprint and 260444 resource bytes.

For repeatable local runs after building, use:

```sh
python3 scripts/emulator-native-sizes.py --size 1 --activities \
  --output build/qa/native-small
python3 scripts/emulator-native-sizes.py --size 2 --activities --motion \
  --output build/qa/native-medium
python3 scripts/emulator-native-sizes.py --size 3 --activities \
  --readings accented-unit-caption negative-feels forecast-high-low wind-long-unit \
  --output build/qa/native-large
python3 scripts/emulator-peek-presentation.py
python3 scripts/build-native-reference.py
```

Current supported firmware and physical paired phone/Time 2 checks remain
pending. On a watch, relaunch at each text size, check both reading slots and
Peek, show a long paused Timer detail, change a media item, cover/uncover the face
and verify private content clears at its original lifecycle boundary. Touch
navigation is not enabled; Pebble's normal watchface gestures remain available.
