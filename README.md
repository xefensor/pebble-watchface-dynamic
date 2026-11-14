# Dynamic

A Pebble Time 2 watchface with an animated clock, two readings and compatible plugin activities.

## Activities: see what is happening now

Activities are live updates shown by compatible XOCE apps and watchfaces, such as a countdown, music or a new notification. This feature connects compatible XOCE products; support depends on the app or watchface you choose.

Start a countdown in Timer, then return to Dynamic to see the time remaining on your watchface. Enable activity plugins and show Timer in Dynamic’s activity list, then save. Timer keeps running the countdown and alarm. Open Timer to pause, resume or finish it.

Sharing needs plugin support in the official Pebble phone app, the required permissions and a connected phone. Weather and battery readings use separate reading settings. Music and notification integration requires Android. Open Activity is optional; you can always open Timer from the watch’s app list.

## Development reading options

The local feedback candidate adds an optional split clock/details palette,
stacked reading rows and hidden titles. Shake paging can cycle global Pebble
slots 1–2, 3–4 and 5; it is off by default. Units and unavailable states remain
visible. PebbleOS does not expose touch events to watchfaces. See [current
UI](docs/UI.md) for behaviour and verification scope.

## Download

[Version 0.18.3](https://github.com/xefensor/pebble-watchface-dynamic/releases/tag/v0.18.3) is a development prerelease.

[PBW](https://github.com/xefensor/pebble-watchface-dynamic/releases/download/v0.18.3/Dynamic-0.18.3.pbw),
[source](https://github.com/xefensor/pebble-watchface-dynamic/releases/download/v0.18.3/Dynamic-0.18.3-source.zip),
[debug files](https://github.com/xefensor/pebble-watchface-dynamic/releases/download/v0.18.3/Dynamic-0.18.3-debug.zip), and
[checksums](https://github.com/xefensor/pebble-watchface-dynamic/releases/download/v0.18.3/SHA256SUMS.txt).

Install the PBW through the Pebble phone app. No separate library installation is needed.

Install through the phone app and open settings to choose readings, activity sources, layout and
appearance. Activity features require plugin support; built-in Music/Notifications require
Android. Install Timer and Open Activity separately for their optional integrations.

[Usage and controls](docs/USAGE.md) · [Current UI](docs/UI.md).

## Compatibility

The release candidate targets **Pebble Time 2 / Emery** and **Round 2 / Gabbro**, using **Pebble SDK 4.44**. Duo is deferred. Portable and
emulator evidence is versioned; physical phone/watch checks retain their documented gaps.
Existing screenshots keep their original version and provenance.

## Setup and use

Install the PBW and configure the first two global Complications choices in the Pebble phone app. Open the face’s gear settings for its saved appearance and context choices. Readings retain the selected provider’s units. See [current UI](docs/UI.md).

The local development candidate adds per-face Text Size and Appearance choices,
including Manual Day/Night palettes and Follow Quiet Time. Follow Pebble Appearance
is unavailable on the pinned SDK and retains the last manual palette as fallback.
See [preferences verification](docs/ui-preferences-checkpoint.md) for evidence and limits.

The version notes below describe the published download. Development candidates
remain separate; use [CONTRIBUTING](CONTRIBUTING.md) for local builds.

## Version 0.18.3

- Adopt shared XOCE type roles, icons and phone settings styling while retaining the Fredoka clock and values.
- Combine each complication symbol, value and unit; retain meaningful public qualifiers and source labels while removing redundant weather captions.
- Restore animated layout changes, Peek response and genuine item transitions. Keep accent complication icons, readable values and the expanded activity area.
- Bundle Core 0.5.2 and UI 0.1.1. Preserve v1–v4 readings, ACT3 activity identity, preferences and private-content handling.

## Version 1.0.0 — stable release preparation

Add Time 2 and Round 2 SDK 4.44 builds. Match numeric complication sizes, apply saved text size immediately, and retain paired music slides and reserved loading artwork.

Xef accepted the reviewed implementation for stable release preparation on 2026-11-13. Actual test coverage remains recorded separately; no physical-device result is implied. Publication is a separate step.

## Development

Use Node 22, Python 3.12 and a C compiler. SDK builds additionally need Pebble SDK 4.44 on
PATH.

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run check:artifact
```

[Contributor guide](CONTRIBUTING.md) · [Release preparation](docs/RELEASING.md) · [History index](docs/history/index.md).
Development outputs belong in ignored `build/`; published archives stay frozen.

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE). Preserve bundled third-party notices and attribution.
