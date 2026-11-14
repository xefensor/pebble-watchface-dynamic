# Developing Dynamic

Follow the [XOCE contributor conventions](https://github.com/xefensor/xoce/blob/main/docs/contributor-conventions.md). Project-specific commands and exceptions are below.

## Select the development environment

This checkout selects **Node 22.23.4** in `.node-version` and **Python 3.12.15** in
`.python-version`; CI reads those same files. A Node version manager that reads
`.node-version` can select it automatically. With fnm and uv already installed:

```sh
fnm use --install-if-missing
uv venv --python "$(cat .python-version)" .venv
. .venv/bin/activate
npm run check:setup
```

The setup check reports missing or mismatched runtimes and installs nothing.
The virtual environment stays in ignored `.venv/`. Install locked dependencies
with `npm ci --ignore-scripts` after selecting the runtimes.


Use Node 22, Python 3.12 and a C99 compiler (`cc`, or set `CC`). Portable tests do not need a
phone, watch or Pebble SDK. For native SDK builds install [Pebble SDK
4.44](https://developer.repebble.com/sdk/) and make `pebble` available on PATH. This
repository builds independently from its own committed dependencies.

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run check:artifact
```

`npm test` runs source/native, workflow, release-fixture and documentation checks. CI uses Node
22 and Python 3.12, with a separate pinned SDK build job. Emulator and physical-device
coverage require separate runs.

`src/c` owns the render plan, layout and motion; `src/pkjs` owns readings, activity delivery and
privacy; `src/plugin` exposes recently presented destinations. Core, Activities and UI are
pinned under `vendor/`.

## Outputs and evidence

Active source lives in the directories above. Generated SDK and PBW/debug candidates live in
ignored `build/candidate/`. Disposable QA belongs in `build/qa/`. Candidate checks reject
changed source or altered build outputs. Frozen `dist/`, `releases/` belong to their original
release tags. Existing `docs/qa/` records and images are historical evidence; do not overwrite
or relabel them.

Read [maintenance contracts](docs/MAINTENANCE.md) before changing ownership, privacy or
compatibility. For visual changes, inspect the consuming app in the emulator; portable tests
establish no visual/device claim. Report source tests, packaged audits, emulator runs and
real-device tests separately.

## Release commands

`npm run release:prepare` validates committed frozen inputs and writes `build/release/`. It
never builds or publishes. `npm run release:publish` is restricted to the manually dispatched
GitHub release workflow on main. See [RELEASING](docs/RELEASING.md) for freezing a new version
and safe reruns. Finish authorized work in reviewable local commits; pushing or publication
needs explicit scope.

[History index](docs/history/index.md).

Development native audits compare the candidate with its captured renderer while allowing
only the SDK timestamp and ELF GNU build ID plus its verified derived CRC to differ.
Different checkout paths affect debug information and therefore the build ID; code, data,
resources and capture provenance still match exactly. Strict release checks are unchanged.
See [GNU linker build-ID semantics](https://sourceware.org/binutils/docs/ld/Options.html#index-_002d_002dbuild_002did)
and the SDK 4.44 `inject_metadata.py` process-info layout (CRC at 0x14, timestamp at 0x7c).


## Pinned native build checks

The native CI job uses Node/Python version files, `requirements-release.txt`,
`.github/sdk-lock.json` and the SDK npm lock to build every declared platform.
It downloads verified SDK 4.44 and matching Linux x86_64 toolchain archives into
ignored `.build-tools/`. It does not log in, upload, publish or deploy.
`python scripts/bootstrap-sdk.py --verify-only /path/to/SDKs/4.44` checks an
existing installation without changing it. A new isolated installation needs
a local venv with `requirements-release.txt` and its `bin` directory on PATH;
set `XDG_DATA_HOME` to this checkout's `.build-tools/data` for subsequent builds.
Historical root `dist.zip` files and released versions remain unchanged.

## Freeze a reviewed Store candidate

After current source, artifact, configuration and Store checks pass, run
`python3 scripts/freeze-release.py` to copy the exact checked PBW, debug and Store
kit bytes and make the standalone source ZIP. It refuses an existing version
and writes `releases/SHA256SUMS-VERSION.txt`; old root checksums and artifacts
remain untouched. Commit these files locally, then run `npm run release:prepare`
to validate committed HEAD. No build, tag, upload or publication happens during
freezing or preparation. The current candidate's physical-device and account
gates remain in `docs/RELEASE-READINESS.md`.

## Phone settings review

After generating `config.html` with `node scripts/generate-config.cjs`, run
`npm run check:settings-browser` with a locally installed Chromium (or set
`CHROMIUM` to its executable). It uses DevTools pipes and synthetic Pebble SDK
responses, writes evidence under ignored `build/qa/settings-ux/`, and downloads
nothing. The scenarios cover category drafts, palette isolation, reordering,
validation, failed/uncertain saves, confirmed reload, narrow translated layouts
and enlarged text. Browser simulation does not establish physical-phone coverage.
