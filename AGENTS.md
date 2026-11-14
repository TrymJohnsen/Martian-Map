# Agent instructions

## Goal and scope

Build Clean Approach: a narrow local prototype about sample-contact provenance at Jezero's Bright Angel region. The map includes a nominal CTX cell marker derived from the PDS sample-report coordinate for Perseverance's Sapphire Canyon sample; the source does not state coordinate datum or horizontal accuracy. Site A and the route remain illustrative. Use [docs/model.md](docs/model.md) as the canonical calculation spec: qualitative directed contact-path reachability only, no transfer amount/probability/risk score. Preserve the working terrain app and avoid major visual redesign. Do not add a backend, auth, or a new frontend framework without a concrete need. Preserve human changes and check `git status` before staging.

## Source of truth and commands

- Start at [README.md](README.md), then read [docs/STATUS.md](docs/STATUS.md) and [docs/data-contract.md](docs/data-contract.md).
- Start the demo: `python3 -m http.server 4173 --directory public` from repo root; open `http://localhost:4173`.
- Rebuild the compact Bright Angel display derivative from ignored source rasters: `.venv/bin/python scripts/build_demo_data.py --input data/raw/bright-angel-n02 --output public/data/bright-angel-demo.json --scenario-config scripts/bright-angel-scenario.json`.
- Fetch the chosen public USGS/CTX COG crop only when network is available: `.venv/bin/python scripts/fetch_mars_samples.py --bbox 77.28 18.47 77.34 18.52 --item-id N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W --output-dir data/raw/bright-angel-n02`.
- Check JavaScript syntax: `node --check public/app.js`.
- Reproduce the NASA/USGS crop only when network is available: `source .venv/bin/activate && python scripts/fetch_mars_samples.py --bbox 77.44 18.42 77.49 18.47`.

## Data and scientific claims

- Original GeoTIFFs and secrets stay out of Git. Keep the compact Bright Angel display derivative in `public/data/` with its provenance and assumptions intact.
- Follow [docs/data-contract.md](docs/data-contract.md): Mars ocentric CRS in metres; array row/column order; independent observed/source values vs derived metrics vs scenario markers; preserve NoData.
- `public/contact-model.js` replays ordered scenario events and reports source-to-object reachability with event/place/assumption traces. Sealed sample history freezes until explicit reopening; control events do not remove paths.
- `public/terrain-geometry.js` converts east, north and up to metres before camera projection, uses a computed local elevation datum, and keeps camera zoom independent of explicit vertical exaggeration. NoData remains absent from mesh and profile.
- DTM/ortho are both 20.399228 m/pixel in this crop. Do not claim a high-resolution/coarse-resolution contrast.
- ASP `intersection_error` is ray separation in metres and only a relative stereo self-consistency diagnostic. It is not DTM accuracy, uncertainty, risk, or confidence.
- Do not invent contamination rates, probabilities, safe distances, local wind fields, or claim a route order prevents contamination. Contact paths and EVA protocol changes are hypotheses/scenarios.
- Perseverance sample-report coordinates are mapped nominally to the CTX grid; their accuracy/datum is not stated and the PDS elevation differs from the target CTX cell. Do not claim exact drill-hole resolution or vertical registration.
- Perseverance witness tubes are a robotic sampling precedent, not a validated astronaut protocol. The NASA CacheCam image is not co-registered with the CTX scene.
- Read [docs/science.md](docs/science.md) before changing science copy.
- Update [docs/model.md](docs/model.md) and [docs/data-contract.md](docs/data-contract.md) when changing graph variables, object/source IDs, events, sequence rules or edge meanings. Run `node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs` and `.venv/bin/python tests/test_geospatial_export.py`; these checks verify code/units and raster-cell conversion, not physical transfer.
- Follow [docs/design.md](docs/design.md) for prior visual decisions, accessible interaction, evidence labels and visual treatment. Layout A is the current working surface; keep this task's UI changes focused on the event history and do not begin a broad redesign.

## Structure and handoffs

- `public/`: no-build web prototype; visual interactions and source labels.
- `public/data/`: compact processed demo subset only.
- `scripts/`: repeatable sample retrieval and derivative export.
- `docs/`: source evidence, assumptions, status, decisions, submission story.
- Keep status current in `docs/STATUS.md`; add only material decisions to `docs/decisions.md`.
- Coordinate shared edits. Do not overwrite an in-progress teammate change or stage files outside your task.

