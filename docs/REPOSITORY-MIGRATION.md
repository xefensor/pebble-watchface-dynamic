# XOCE repository names

The November 2026 naming change uses `pebble-<type>-<name>` under the XOCE
(Xef's Open Computing Ecosystem) umbrella.

| Component | Canonical GitHub repository | Stable package name |
| --- | --- | --- |
| Dynamic | [xefensor/pebble-watchface-dynamic](https://github.com/xefensor/pebble-watchface-dynamic) | `dynamic-watchface` |
| Core | [xefensor/pebble-lib-core](https://github.com/xefensor/pebble-lib-core) | `pebble-watchface-core` |
| Activities | [xefensor/pebble-lib-activities](https://github.com/xefensor/pebble-lib-activities) | `pebble-activities` |

Dynamic's watchface UUID, settings, native message keys and activity APIs keep
their existing identities. Imports, SDK header paths and vendored archive names
retain their package names; repository names are separate metadata.

## Published releases

Dynamic 0.16.2 remains the tested source snapshot at
`48a5aaec1aac4e2805bad2bb7e793b5da58b5165`. Its PBW, source ZIP, debugging ZIP,
checksums and tag stay unchanged. The release configuration points to the new
repository and validates those original assets using its preserved bootstrap
commit. This migration does not publish a rebuilt 0.16.2.

The current branch retains the same Core 0.5.1 and Activities 0.4.4 tarballs,
source commits and checksums. Their `vendor/*.json` repository locations point
to the new canonical repositories. Both tarballs are included in the source
archive, so installing the pinned libraries does not require the old repositories.

Repository URLs inside frozen source archives, required licence notices and
historical QA/provenance remain part of those original snapshots. Current
download and source links use the canonical repositories. Old GitHub Actions
run IDs describe historical runs and are not relabelled as runs in the new
repository.

## Building the renamed checkout

```sh
git clone https://github.com/xefensor/pebble-watchface-dynamic.git
cd pebble-watchface-dynamic
npm ci --ignore-scripts
npm test
python3 scripts/github-release.py prepare --output /tmp/dynamic-release
```

That checks the preserved release from its tested artifact commit. For a local
development build:

```sh
pebble build
python3 scripts/package-release.py
```

The SDK development bundle is named after the checkout directory, normally
`build/pebble-watchface-dynamic.pbw`. The npm name stays `dynamic-watchface` and
distribution filenames stay `Dynamic-VERSION.*`. The packaging, audit and native
preview tools resolve the development bundle using the actual checkout name.
Local rebuilds are development outputs; replacing any published asset requires
a new version.

## Migration checks — 6 November 2026

- Passed 127 JavaScript tests, the portable native suite and lifecycle check,
  19 release-helper tests and 23 dependency-pin tests.
- The published 0.16.2 PBW passed the strict native-style audit with the current
  repository metadata. All 68 tracked PBW/ZIP/tarball artifacts matched their
  pre-migration bytes.
- A separate checkout named `pebble-watchface-dynamic` built with SDK 4.33.1 and
  packaged successfully while retaining npm name `dynamic-watchface`.
  Its resources and phone scripts matched the published files exactly. Native
  program/relocation bytes after offset 168 also matched; only the native
  header CRC, resource timestamp and GNU build ID changed.
- The strict audit rejected that development build's new binary hash against
  the retained historical preview hashes. The historical evidence was kept;
  that development build was not published. A fresh release follows the full
  version/preview procedure in `AGENTS.md`.
- Offline `npm ci` in the temporary checkout could not find Terser in the npm
  cache. The SDK check used a separate copy of the existing locked installed
  dependencies and reverified both vendored library pins before building.

These are portable/SDK/package checks. No new phone or physical-watch test is
claimed for this repository-only migration.
