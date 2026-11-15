# Dynamic 1.0.2 — published release

Dynamic 1.0.2 is published on [GitHub](https://github.com/xefensor/pebble-watchface-dynamic/releases/tag/v1.0.2) and [Pebble Store](https://apps.repebble.com/5db601a9303a4eb7baa90331), for Time 2 and Round 2. The public UUID and exact PBW identity are recorded in [publication.json](../store/publication.json), checked against the website’s fresh public-release gate on 2026-11-15.

The source tests, builds, package checks and native emulator scope remain recorded in [release-1.0.2 validation](qa/release-1.0.2/validation.json). Historical galleries keep their captured versions and explicit final-binary reuse proof. Physical phone/watch and live-provider results are not claimed. Xef’s recorded acceptance removed the former additional device-approval gate; it did not create unobserved test results.

Current sources include adaptive reading layouts, split clock/detail colours, optional shake switching and category-based phone settings. Those are shipped features, not an unpublished feedback candidate. Core 0.6.1-dev.1 is the app’s vendored opt-in four/five-slot snapshot, distinct from the standalone public Core release.

## Maintenance after publication

Documentation and portable tooling changes do not regenerate release files. Existing tags, PBWs, source/debug/Store ZIPs, checksums and QA images remain immutable. The release configuration pins published 1.0.2 to source commit `2254f08ac3a574df11ccb23ea6e3337e53bbe3b2`; prepare validates that original snapshot even after maintenance commits.

A newly prepared local Store kit uses current explanatory documents and a verified publication record. It is a reference kit, not a replacement for the published Store ZIP or permission to upload again. A future app change needs its own new version, validation, preparation state and separately authorized publication. Follow [RELEASING](RELEASING.md).

## Earlier preparation narrative

The [pre-publication source record](https://github.com/xefensor/pebble-watchface-dynamic/blob/2254f08ac3a574df11ccb23ea6e3337e53bbe3b2/docs/RELEASE-READINESS.md) retains the earlier 1.0.0/1.0.1 milestones, feedback review and submission steps. Those statements describe their original stage rather than current installation availability.
