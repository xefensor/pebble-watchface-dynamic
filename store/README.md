# Dynamic Store artwork and published identity

Dynamic **1.0.2** is published for Time 2 and Round 2. [publication.json](publication.json) records the verified Store/GitHub URLs and exact PBW SHA-256; [listing.json](listing.json) owns current fields. Local kit preparation does not upload, authorize another submission or replace frozen release files.

## Current artwork

Blue modular bands reflect adaptable readings and activity space. The XOCE family shares Fira typography, graphite/silver device treatment, clear margins and a small endorsement; each product retains its own meaningful composition.

The checked-in masters are `emery-family-banner.svg` and `gabbro-family-banner.svg`; their corresponding PNGs are 720×320. `artwork-provenance.json` binds their hashes and the native source captures. Standalone Store screenshots remain raw, unframed and platform-sized; `listing.json` and `upload-map.json` identify the files. Historical filenames/capture versions and provenance bytes stay unchanged.

Website marks, Store assets and 25×25 native launcher glyphs are separate exports. Dynamic is a watchface, so watchapp 80/144px Store icon fields do not apply. The refreshed native launcher is already included in 1.0.2; changing it again would be a future app release, not a documentation edit.

## Reproduce a candidate safely

The maintained [XOCE artwork sources and instructions](https://github.com/xefensor/xoce/tree/main/artwork) provide the original generators, dependency notes and explicit hero selections. Generate into a disposable candidate folder, compare against these checked-in masters and review any difference before adopting new artwork. A generator run does not overwrite or revalidate a historical release. [ARTWORK-LICENSES.txt](ARTWORK-LICENSES.txt) retains the original font and illustration credits.

With the exact published PBW, a current local reference kit can be checked without an SDK rebuild:

```sh
npm run store:prepare
npm run store:check
```

Published listings default to the exact frozen PBW under `releases/`. Preparation listings default to the freshly built candidate and retain strict ELF binding. The generated `build/store/` kit includes current explanatory documents and the publication record. It remains distinct from `releases/Dynamic-1.0.2-store-package.zip`, whose original bytes must not change. Future versions return to preparation state and follow [the release procedure](../docs/RELEASING.md).
