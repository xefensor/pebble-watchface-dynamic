# Using Dynamic 1.0.2

Dynamic is a watchface for Time 2 and Round 2. [Install the published release](../README.md#install-dynamic-102), or use the [illustrated website setup](https://xefensor.github.io/xoce/docs/pebble/setup/#illustrated-first-setup). Older releases can have different settings; their original [usage guide](https://github.com/xefensor/pebble-watchface-dynamic/blob/2254f08ac3a574df11ccb23ea6e3337e53bbe3b2/docs/USAGE.md) remains part of that historical source snapshot.

## Set up

1. Pair the watch through the official Pebble phone app and enable plugin support where required by that app version.
2. Select Dynamic as the active watchface. Open its gear settings.
3. Under **Layout & complications**, choose Columns, Stacked rows or Four when idle. Configure global **Complications** choices in Pebble’s own settings: slots 1–2 normally, 1–4 for the idle grid, or 1–5 for optional shake switching. The same global choices can affect other watchfaces.
4. Under **Colours**, choose the watch appearance and edit its Day/Night palettes. Editing a palette does not switch the active one. Detail colours are used when **Split clock and details** is enabled.
5. Under **Activities**, choose the activity sources, visibility and order you want. Under **More & help**, choose text size, clock format or diagnostic help.
6. Choose **Save** and wait for **✓ Saved**. This confirms phone persistence. Keep the phone connected, check the separate watch-delivery state, and use **Retry watch delivery** if offered. Reopen settings to check confirmed saved choices.

The four categories share one mounted draft. Moving between them does not save or discard an edit. Discard restores the last confirmed phone choices; it cannot undo a write already sent. A failed or uncertain Save keeps the draft for recovery. Settings previews use examples rather than live readings, and viewing one does not enable a source or change privacy.

## Choose a reading layout

| Layout | Reading presentation |
| --- | --- |
| Columns | The selected pair in two columns |
| Stacked rows | The selected pair in rows |
| Four when idle | A compact 2×2 grid while idle; the selected pair when activities or native Timeline Peek need room |

Optional shake switching changes the selected pair among global slots 1–2, 3–4 and 5. It does not refresh sources or add touch control to the watchface. Clock and date are native watch functions and consume no reading slot.

Units and public qualifiers remain supplied by the provider. Missing or expired values do not become zero. Readings fit complete values and essential units before optional titles or decoration. Text starts at its beginning and truncates or wraps within the available area; it does not marquee or automatically page. [Current fitting and type roles](UI.md#complication-layout).

## Activities and priority

An activity is an ongoing update from a compatible source, such as a Timer countdown, music or a notification. In **Activities → Activity priority**, show the sources you want. Choose **Reorder**, use drag or the arrow buttons, then choose **Done**. The first eligible activity is Primary and the next can occupy the smaller Secondary row when it fits. Music, Timer and Notifications can each fill either role.

**Show activity plugins** affects compatible installed providers. Music and Notifications have their own visibility choices in the same list. Other apps keep independent orders. A hidden or unpainted Secondary is not exported as an app-opening destination.

Install Timer separately, start a countdown and press Back to its list, then Back again to Dynamic. The watchface displays its update; Timer still owns the countdown and alarm. A paused timer leaves shared activity views after five minutes but remains saved in Timer. A displayed zero is not proof of a native alarm or completion. Acknowledged results disappear when the owner’s update reaches the phone.

## Open Activity shortcut

Install the current [Open Activity helper](https://xefensor.github.io/xoce/projects/open-activity/). In its settings select **Watchface → Dynamic**, choose Primary and optional Secondary shortcuts, save, and assign the same helper to those shortcuts in Pebble’s Quick Launch settings. Allow Launch apps and keep one connected watch.

A Quick Launch opens Dynamic’s recent, valid, natively confirmed destination. It opens the whole app, not a particular timer or notification. Missing Secondary never substitutes Primary. A normal app-list launch opens the helper’s setup screen. Switching to Halftone requires changing the helper’s selected source manually; it cannot detect which watchface was previously active. An app-launch command already sent cannot reliably be recalled. [Detailed controls and limits](https://xefensor.github.io/xoce/docs/pebble/controls/#open-activity).

## Music, notifications and privacy

Built-in music and notification sources need Android and their Pebble permissions. Music is displayed here; use Pebble’s Music app for playback controls. Notifications start off, and message text is a separate opt-in. App-only omits sender/body from watch packets, while summary privacy omits the message body. The app filter changes Dynamic’s display, not PebbleOS forwarding.

Additional vibration starts off and respects Quiet Time. Enabling it can add feedback alongside PebbleOS’s own notification alert. Music and notification content stays transient; reconnect or notification reconfiguration does not replay history. A notification activity lasts at most eight seconds. The [privacy document](../PRIVACY.md) owns data and retention details.

## Text size and appearance

Supporting text offers Follow Pebble, Small, Medium or Large using Dynamic’s own Roboto roles; the Fredoka clock keeps its geometry. Per-face Day and Night palettes remain independent. Choose an explicit palette or Follow Quiet Time; Quiet Time selects Night only while active. Phone-page appearance follows the phone separately.

The pinned SDK has no supported automatic watch appearance API. A saved Follow Pebble appearance choice retains the last explicit Light/Dark fallback and is unavailable for new selection. Editing palette colours alone does not activate that palette.

## Timeline Peek, motion and connection

Timeline Peek remains Pebble’s native panel. Dynamic fits its clock/readings to the unobstructed area and retains the selected pair. Genuine activity/media replacements can have a short incoming transition. Ordinary timer ticks, metadata refreshes and late artwork do not replay it. Expiry and privacy clearing take priority over animation.

The clock and date work without the phone. Shared readings and activity updates need connectivity and valid source data. Permitted public readings can retain a bounded cache through original validity; cached receipt time is not a fresh observation. Private music/notification content clears on disconnection. [Troubleshooting](../SUPPORT.md).

## Evidence and earlier interfaces

[Native type](native-type-checkpoint.md), [preferences](ui-preferences-checkpoint.md), [compact layout](compact-layout-checkpoint.md) and other dated checkpoints retain their actual captured versions and test scope. The current release review is [release-1.0.2](qa/release-1.0.2/validation.json). Native captures with example data are not physical-watch or live-phone results.
