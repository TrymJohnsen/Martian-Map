# Agent instructions

## Goal and scope

Build Clean Approach: a narrow, local planning prototype about sample-contact traceability during a Marswalk. The team has chosen this direction. Current implementation is a static prototype; do not add a backend, auth, or a new frontend framework without a concrete need. Preserve human changes and check `git status` before staging.

## Source of truth and commands

- Start at [README.md](README.md), then read [docs/STATUS.md](docs/STATUS.md) and [docs/data-contract.md](docs/data-contract.md).
- Start the demo: `python3 -m http.server 4173 --directory public` from repo root; open `http://localhost:4173`.
- Rebuild the compact checked-in crop from ignored source rasters: `MPLCONFIGDIR=/tmp/martian-map-mpl .venv/bin/python scripts/build_demo_data.py`.
- Check JavaScript syntax: `node --check public/app.js`.
- Reproduce the NASA/USGS crop only when network is available: `source .venv/bin/activate && python scripts/fetch_mars_samples.py --bbox 77.44 18.42 77.49 18.47`.

## Data and scientific claims

- Original GeoTIFFs and secrets stay out of Git. Keep the 337 KB, 148×148 display derivative in `public/data/` with its provenance and assumptions intact.
- Follow [docs/data-contract.md](docs/data-contract.md): Mars ocentric CRS in metres; array row/column order; independent observed/source values vs derived metrics vs scenario markers; preserve NoData.
- DTM/ortho are both 20.162955 m/pixel in this crop. Do not claim a high-resolution/coarse-resolution contrast.
- ASP `intersection_error` is ray separation in metres and only a relative stereo self-consistency diagnostic. It is not DTM accuracy, uncertainty, risk, or confidence.
- Do not invent contamination rates, probabilities, safe distances, local wind fields, or claim a route order prevents contamination. Contact paths and EVA protocol changes are hypotheses/scenarios.
- Perseverance witness tubes are a robotic sampling precedent, not a validated astronaut protocol. The NASA CacheCam image is not co-registered with the CTX scene.
- Read [docs/science.md](docs/science.md) before changing science copy.
- Follow [docs/design.md](docs/design.md) for the current unselected visual studies, accessible interaction, evidence labels and visual treatment. The earlier A/B layouts were rejected; do not treat them as approved direction. Wait for the user's choice between the two current rendered proposals before completing a redesign.

## Structure and handoffs

- `public/`: no-build web prototype; visual interactions and source labels.
- `public/data/`: compact processed demo subset only.
- `scripts/`: repeatable sample retrieval and derivative export.
- `docs/`: source evidence, assumptions, status, decisions, submission story.
- Keep status current in `docs/STATUS.md`; add only material decisions to `docs/decisions.md`.
- Coordinate shared edits. Do not overwrite an in-progress teammate change or stage files outside your task.

