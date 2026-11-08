# Dynamic

A Pebble Time 2 watchface with an animated clock, two readings and compatible plugin activities.

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

The current SDK target is **Pebble Time 2 / Emery**, using **Pebble SDK 4.33.1**. Portable and
emulator evidence is versioned; physical phone/watch checks retain their documented gaps.
Existing screenshots keep their original version and provenance.

## Setup and use

Install the PBW and configure the first two global Complications choices in the Pebble phone app. Open the face’s gear settings for its saved appearance and context choices. Readings retain the selected provider’s units. See [current UI](docs/UI.md).

The version notes below describe the published download. Development candidates
remain separate; use [CONTRIBUTING](CONTRIBUTING.md) for local builds.

## Version 0.18.3

- Adopt shared XOCE type roles, icons and phone settings styling while retaining the Fredoka clock and values.
- Combine each complication symbol, value and unit; retain meaningful public qualifiers and source labels while removing redundant weather captions.
- Restore animated layout changes, Peek response and genuine item transitions. Keep accent complication icons, readable values and the expanded activity area.
- Bundle Core 0.5.2 and UI 0.1.1. Preserve v1–v4 readings, ACT3 activity identity, preferences and private-content handling.

## Development

Use Node 22, Python 3.12 and a C compiler. SDK builds additionally need Pebble SDK 4.33.1 on
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
