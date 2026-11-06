# Dynamic UI/UX alignment handoff

Reviewed baseline: Dynamic 0.16.2; repository HEAD
`7b5daced6a8c7974425e1b3fb927071d1501df3d` on 2026-11-06.

## Canonical design and status

The agreed standard is maintained in the local `xoce` website checkout at
`src/pages/docs/design/pebble-ui-system.md`. When that checkout's preview is
running, read [the unified Pebble UI/UX standard](http://127.0.0.1:4321/docs/design/pebble-ui-system/).
The website has no public repository or deployment yet; this is a local reference.

This handoff records **approved design targets, with implementation pending**.
It does not claim that a released app follows the complete standard. Shared
visual roles use neutral light/dark surfaces and a restrained accent per app.
Exact accent colours and final pixel metrics still need reviewed native and
phone previews. Website colours and web fonts are a separate identity.

## Current implementation

- The watchface already uses Fredoka numbers and Roboto Condensed interface
  text, bottom-aligned primary activity content, a contextual footer, and one
  static secondary row above it. Either role can contain any supported source.
- Media has its own title and optional cover/artist footer. Native animations
  are bounded and stop under covering windows. Text never marquees or cycles.
- Phone settings use offline Clay with Appearance, Content & priority, and
  Connection & help. Preview examples and phone appearance are independent of
  saved watch colours and notification privacy. Settings are translated into
  17 languages.
- Saving currently returns through Clay's close flow and the
  `webviewclosed` handler. Reopened settings can show the last watch-delivery
  state. This is not the new in-page confirmation of phone persistence.

See [native style](NATIVE-STYLE.md), `src/pkjs/settings-page.js`,
`src/pkjs/config.js`, and `src/pkjs/index.js`.

## Pending work

- Keep Dynamic's configurable watch palettes and distinctive clock. The
  watchapp title/clock header rule does not add a second header to this
  watchface. Preserve activity geometry, static compact content, privacy,
  app destinations, source identity and original expiry.
- Align the phone shell, controls, spacing and activity-order rows with the
  shared pattern. Keep visible move buttons alongside optional dragging and
  retain Dynamic-local activity ordering and visibility.
- Adapt the settings controller so Save keeps the page open and confirms
  actual phone persistence. A CSS change cannot make Clay's existing
  save-and-close transport provide that acknowledgement. Verify the supported
  embedded-page route before selecting the smallest implementation; no
  firmware or phone-app fork is part of this design.
- Use the agreed inline states: Saving…; ✓ Saved; Unsaved changes; and, for a known failed write,
  Couldn’t save. Try again. Keep Saved visible until another edit and disable
  unchanged Save. Preserve the draft, focus and scroll position. An uncertain
  write must say Save not confirmed and offer explicit Reload saved or retry;
  do not turn a timeout into a known failed write or retry it silently.
- Reserve watch-delivery messages for relevant delivery problems. A confirmed
  phone write is not proof that the watch applied the new configuration.
- Keep all preference keys, translations and sample-preview independence.
  Shared styling does not merge privacy settings or activity order with
  Dashboard. No Activities/Core contract redesign is implied.

## Acceptance checks for the implementation

- Check the actual packaged, serialized/minified settings page, including
  Clay function boundaries and supported English/Czech layouts.
- Save, remain on the page, edit and save again; then close, reopen and restart
  the phone runtime. Confirm the exact choices survive every step. Test watch
  disconnection separately from phone persistence.
- Exercise load failure, invalid input, timeout, late responses and a newer
  draft. Never overwrite edits with defaults or an old response, and never
  describe Discard as undoing a save already sent.
- Check 320/360px widths, large text and the keyboard/short visual viewport.
  Save and the last field remain reachable without automatic text-field focus
  or an unsolicited scroll jump.
- If native styling changes, capture affected normal/media/notification,
  primary/secondary, theme, long-text and Timeline Peek states. Preserve the
  bounded motion and covered-window work rules.
- Follow the existing package, font/resource and release checks. Keep browser,
  emulator and physical-watch evidence separate; do not rewrite published
  0.16.2 artifacts or tags to record documentation work.
