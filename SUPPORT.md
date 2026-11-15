# Dynamic support

[Report a problem or request a change](https://github.com/xefensor/pebble-watchface-dynamic/issues). Include Dynamic’s version, watch model/firmware, phone/Pebble app versions, expected result, actual result and reproduction steps. For a missing reading, include the selected source and the bounded status shown under **More & help**. Remove private notification, music and location content from reports.

## Install and verify

Dynamic **1.0.2** is published for Time 2 and Round 2. Use [Pebble Store](https://apps.repebble.com/5db601a9303a4eb7baa90331), the [current product page](https://xefensor.github.io/xoce/projects/dynamic/), or the exact [GitHub release](https://github.com/xefensor/pebble-watchface-dynamic/releases/tag/v1.0.2).

For manual installation, download the PBW and `SHA256SUMS.txt` from the same release, then run `sha256sum --ignore-missing -c SHA256SUMS.txt`. Open the PBW with the Pebble phone app. Source/debug ZIPs are for development. Older releases and their original source archives remain unchanged.

## Missing readings or activities

Use a connected Time 2 or Round 2 and the official phone app’s plugin support. Grant permissions required by the sources you select. Built-in music and notification integration requires Android. Other watch models, including Duo, are not included.

Configure global Complications slots 1–2 normally, 1–4 for Four when idle, or 1–5 for optional shake switching. In Dynamic’s gear settings, **Layout & complications** selects the layout, and **More & help** shows source status.

For a Timer countdown, open **Activities**, enable **Show activity plugins**, and show Timer in **Activity priority**. Choose **Reorder**, move Timer above competing sources, then choose **Done** and **Save**. Timer still owns its countdown and alarm. Music and Notifications have independent visibility choices in the same list. [Illustrated setup](https://xefensor.github.io/xoce/docs/pebble/setup/#illustrated-first-setup).

## Save and watch delivery

**✓ Saved** confirms phone persistence. Watch application has a separate Pending/Applied/failure state. Keep the phone connected and use **Retry watch delivery** when offered. Failed or uncertain writes keep the draft; use the visible retry/readback controls rather than clearing app data. [Settings troubleshooting](https://xefensor.github.io/xoce/docs/pebble/troubleshooting/#settings-seem-not-to-save).

The four settings categories share a draft. Phone appearance and watch palettes are independent; editing colours does not activate that palette. Follow Pebble appearance retains the last explicit palette because the pinned SDK has no supported automatic appearance API.

## Open Activity and notifications

Choose Dynamic as Open Activity’s source and match its configured shortcut to Pebble’s Quick Launch shortcut. A normal app-list launch opens the helper’s setup; a missing or expired destination cannot open an app. It opens the whole associated app, not a particular saved item. [Shortcut help](https://xefensor.github.io/xoce/docs/pebble/troubleshooting/#open-activity-immediately-closes).

Dynamic’s optional notification activity and additional vibration do not replace PebbleOS notifications. Leave additional vibration off if you only want the system alert. Dynamic’s app filter does not change PebbleOS forwarding.

## Publication and evidence

[store/publication.json](store/publication.json) records the verified published version and exact PBW identity. The former blanket plugin-preview publication restriction is historical; current plugin publishing has its own [official guide](https://developer.repebble.com/guides/plugins/publishing-plugins/).

[Release readiness](docs/RELEASE-READINESS.md) links actual validation. Physical phone/watch and live-provider testing are not claimed; publication does not turn emulator/browser evidence into device coverage. [Privacy](PRIVACY.md) and [usage](docs/USAGE.md) describe the shipped behaviour.
