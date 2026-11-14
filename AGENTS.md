# Agent instructions

## Goal and scope

Build Clean Approach: a prototype of an astronaut sample-planning tool for Bright Angel on Mars. It combines observed terrain and documented sample context with an illustrative activity sequence, and shows how gloves and tools can connect earlier activities to a sample's contact history. Keep the three-step Mission → Plan → Sample history workflow described in [docs/design.md](docs/design.md). The map includes a nominal CTX cell marker derived from the PDS sample-report coordinate for Perseverance's Sapphire Canyon sample; the source does not state coordinate datum or horizontal accuracy. Site A and the route remain illustrative. Use [docs/model.md](docs/model.md) as the canonical calculation spec: qualitative directed contact-path reachability only, no transfer amount/probability/risk score. Do not add a backend, auth, or a new frontend framework without a concrete need. Preserve human changes and check `git status` before staging.

The Mission → Plan → Sample history workflow is the current baseline, not a freeze. Planned growth: map layers and planning zones (see [docs/data-contract.md](docs/data-contract.md), "Layer and zone rules"), and a mission checklist in the right-hand column that tells the astronaut what to do at each place. A visual redesign will be made later in Claude Design, so build semantic HTML with stable class names and do not spend time on visual polish. The scientific limits below apply to all of it.

## Source of truth and commands

- Start at [README.md](README.md), then read [docs/STATUS.md](docs/STATUS.md) and [docs/data-contract.md](docs/data-contract.md).
- Start the demo: `python3 -m http.server 4173 --directory public` from repo root; open `http://localhost:4173`.
- Rebuild the compact Bright Angel display derivative from ignored source rasters: `.venv/bin/python scripts/build_demo_data.py --input data/raw/bright-angel-n02 --output public/data/bright-angel-demo.json --scenario-config scripts/bright-angel-scenario.json`.
- Fetch the chosen public USGS/CTX COG crop only when network is available: `.venv/bin/python scripts/fetch_mars_samples.py --bbox 77.28 18.47 77.34 18.52 --item-id N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W --output-dir data/raw/bright-angel-n02`.
- Check JavaScript syntax with `node --check` on each changed file (`app.js`, `map.js`, `panel.js`, `scenario.js`, `contact-model.js`, `terrain-geometry.js` in `public/`); it takes one file per call.
- On Windows use `python` and `.venv\Scripts\python` where these commands say `python3` and `.venv/bin/python`.
- Use the Bright Angel fetch command above to reproduce the selected sample crop; do not use the superseded landing-area bbox.

## Data and scientific claims

- Original GeoTIFFs and secrets stay out of Git. Keep the compact Bright Angel display derivative in `public/data/` with its provenance and assumptions intact.
- Follow [docs/data-contract.md](docs/data-contract.md): Mars ocentric CRS in metres; array row/column order; independent observed/source values vs derived metrics vs scenario markers; preserve NoData.
- `public/contact-model.js` replays ordered scenario events and reports source-to-object reachability with event/place/assumption traces. Sealed sample history freezes until explicit reopening; control events do not remove paths.
- `public/terrain-geometry.js` converts east, north and up to metres before camera projection, uses a computed local elevation datum, and keeps camera zoom independent of explicit vertical exaggeration. NoData remains absent from mesh and profile.
- DTM/ortho are both 20.399228 m/pixel in this crop. Do not claim a high-resolution/coarse-resolution contrast.
- ASP `intersection_error` is ray separation in metres and only a relative stereo self-consistency diagnostic. It is not DTM accuracy, uncertainty, risk, or confidence.
- Do not invent contamination rates, probabilities, safe distances, local wind fields, or claim a route order prevents contamination. Contact paths and EVA protocol changes are hypotheses/scenarios.
- Do not add wind, radiation, thermal or other environmental layers or cards until a documented dataset for Bright Angel (or a clearly labelled context source) is in the repo with source, location, time and limits in [docs/data-sources.md](docs/data-sources.md). The MEDA Sol 36 sample stays background only.
- Planning zones are allowed only when they come from data in `public/data/` (for example slope derived from the DTM, or NoData as unknown terrain) or are explicit scenario rules, always labelled as such. A threshold the user can change is a planning threshold, not a validated suit or mobility limit. Never label terrain or a plan safe, unsafe or risky, and never attach a score.
- Perseverance sample-report coordinates are mapped nominally to the CTX grid; their accuracy/datum is not stated and the PDS elevation differs from the target CTX cell. Do not claim exact drill-hole resolution or vertical registration.
- Perseverance witness tubes are a robotic sampling precedent, not a validated astronaut protocol. The NASA CacheCam image is not co-registered with the CTX scene.
- Read [docs/science.md](docs/science.md) before changing science copy.
- Update [docs/model.md](docs/model.md) and [docs/data-contract.md](docs/data-contract.md) when changing graph variables, object/source IDs, events, sequence rules or edge meanings. Run `node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs` and `.venv/bin/python tests/test_geospatial_export.py`; these checks verify code/units and raster-cell conversion, not physical transfer.
- Follow [docs/design.md](docs/design.md) for the baseline three-step layout, accessible interaction and evidence labels. Keep keyboard access, visible focus, evidence labels and the caveats above when changing layout. Georeferencing, NoData handling and the metre-scale terrain geometry change only with a documented reason.

## Structure and handoffs

- `public/`: no-build web prototype, split by owner so parallel branches do not edit the same file:
  - `map.js` + `map.css` (map card, layers, zones, `#layer-panel`, `#context-cards`), with `terrain-geometry.js`, `scripts/` and `public/data/`.
  - `panel.js` + `panel.css` (right-hand column, `#mission-panel`), with `scenario.js` and `contact-model.js`.
  - `app.js`: loads data and starts both modules; keep it small.
  - The modules share only `window.CleanApproach` and the `scenario:change`, `mission:step` and `map:place` events. The contract is in [docs/data-contract.md](docs/data-contract.md) ("Module and event contract"); change it there when you change it in code.
- Work on one branch per workstream and edit only your own files. Merge one branch at a time into `main` and rerun the checks after each merge. Shared files (`index.html`, `design-overrides.css`, docs) need a small, separate commit.
- `public/data/`: compact processed demo subset only.
- `scripts/`: repeatable sample retrieval and derivative export.
- `docs/`: source evidence, assumptions, status, decisions, submission story.
- Keep status current in `docs/STATUS.md`; add only material decisions to `docs/decisions.md`.
- Coordinate shared edits. Do not overwrite an in-progress teammate change or stage files outside your task.

