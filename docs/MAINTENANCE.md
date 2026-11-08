# Dynamic maintenance contracts

These are current implementation constraints. They apply when changing the
relevant subsystem, not as a requirement to reread every document for every edit.

## Ownership and compatibility

Preserve UUID, appended message-key numbering, ACT3 source/run identity, observation and original validity. Private media/notification content is transient. Keep one native render plan, one static secondary row and one shared queue. Text starts at its beginning and truncates; no marquee, paging or silent rotation. Only genuinely painted original record indices may be confirmed/exported for navigation. Clock ticks never persist state or send messages. Covered views reconcile expiry without decorative work or fresh presentation claims.

## Current interaction and product boundaries

Readable Roboto Condensed utility roles and dominant Fredoka values are the accepted main UI. Compact numeric date and Idle/Peek weekday/date remain. Two readings keep their positions; the primary block is bottom-aligned above its footer, with the secondary above it. Structured values/units and Paused/pace/street precede optional identity. Supporting text follows its per-face override or the launch-time OS size through Dynamic’s own font roles; the main clock keeps its design. Required state/value/unit text can wrap and must yield optional secondary content first. A hidden secondary must not escape through the navigation source. Incoming motion is bounded and only starts on a genuine run/item replacement. Dynamic has no physical action rail.

## Source ownership

src/c/dynamic.c integrates the SDK; activity_presentation/watch_layout/music_layout define bounded rendering. src/pkjs owns host integration; src/common/settings-state.js owns atomic phone settings. vendor/ records independently pinned Core and Activities packages.

## Phone persistence and evidence

For apps with phone settings, keep active-writer selection, separate Android
DOM/native storage views, exact application acknowledgements and bounded handoffs.
Saving stays open where supported; uncertain writes retain the draft and explicit
readback/retry. Discard cannot undo a write already sent. Load errors must not
silently replace saved choices with editable defaults. Do not introduce unsolicited
focus or scroll changes. Historical browser/emulator results do not validate a
new build. Keep portable, packaged, simulated transport and real-device claims distinct.

Native display key **78** owns a versioned 60-byte snapshot: revision, both raw
RGB palettes, clock/status/animation/vibration choices, text size, appearance mode
and last manual palette. Validate the complete snapshot, verify persistence
readback, then apply and reply. Legacy integer/boolean keys remain compatible
mirrors. Keep raw RGB values before Pebble's GColor quantization. A profile change
invalidates measured activity layout and painted-role cache before repaint.
Display replies own their outbox callbacks and never acknowledge a Core session.

The existing `clay-settings` record remains the phone settings authority.
`dynamic-settings-delivery-v1` now stores version-2 delivery metadata; earlier
transport-only success cannot prove application. Valid older pending native
choices migrate through a verified settings save. Unknown saved keys survive;
source privacy/order choices never enter the native display frame. Numeric wire
keys use the preserved 10000-based SDK mapping; earlier index-style saved keys
remain readable. A fresh phone with no explicit native choices adopts the watch's
raw palette snapshot before attempting delivery.

New desired choices and fresh runtime/native mismatch retries use a new verified
wire revision. Old receipts and late callbacks cannot establish Applied after
invalidation. Failed revision storage leaves pending state without sending a
reusable revision. Source traffic cannot reset an exhausted bounded retry budget.
Plugin-only configuration reads/saves never start a watch queue or source lookup;
the active PKJS writer owns delivery and the existing Android handoff.

## Dependencies, identities and licences

Preserve public identifiers, message-key numbers, compatible storage formats,
licences and attribution. Pinned vendor archives/checksums remain independent of
sibling checkouts. Do not repin consumers or change published bytes as cleanup.

## History

[Earlier maintainer notes](history/maintainer-notes-before-rework.md) retain the
full rationale/history. Read them only when investigating an old decision.
