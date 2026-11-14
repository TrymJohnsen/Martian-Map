# Clean Approach

**Clean Approach** explores contact provenance for a hypothetical Jezero sedimentary core intended for organic-molecule and potential-biosignature analysis. The sample rationale is informed by Perseverance's Bright Angel / Sapphire Canyon work, which is a separate site from the current MRO/CTX crop. The core calculation is a qualitative directed contact graph: it shows whether a possible Earth-associated source is connected to the sample through assumed glove/tool contacts. It does not calculate transferred material, probability, planetary biological establishment or astronaut safety.

## Open the demo

From the repository root in a terminal:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>. The NASA Photojournal reference image requires browser internet access; the terrain demo data are local.

Two unselected composition studies share the same data and interaction:

- [A — Terrain](http://localhost:4173/?design=terrain): large terrain scene beside a compact activity comparison.
- [B — Field plate](http://localhost:4173/?design=field-plate): broad scene above a horizontal activity/results band.

The page opens in A by default. Open **Data & assumptions** to inspect mission data, the sample rationale, model limitations and assumptions. Compare sample-first and survey-first: with identical glove/tool contacts, the model's possible path is unchanged. The optional isolation step removes a graph edge under an explicit, unvalidated assumption; it is not a recommended or validated EVA procedure. Route distance/profile are available as secondary map context. Drag the map to rotate, scroll to zoom, **Reset view** to restore the camera, and use the tour button for optional camera motion. Dragging or clicking the tour button stops it; `R` while the map is focused resets the view. The browser's reduced-motion preference disables the camera tour.

The Playwright skill is installed in the agent's user environment. The two current studies were rendered and reviewed in Chromium at 1440×900; screenshots and the pending design checkpoint are recorded in [docs/design.md](docs/design.md).

## What is real, calculated, and illustrative

- **Real:** the 148×148 MRO/CTX DTM, orthorectified image and ASP intersection-error crop; the Perseverance CacheCam witness-tube image/reference.
- **Calculated:** route distance and elevation profile sampled from the CTX grid; rendered terrain mesh and display stretch.
- **Illustrative:** target/start/waypoints, target footprint, route order and assumed contact graph. The optional isolation boundary is a hypothetical graph change; Perseverance witness tubes are documented as a separate robotic precedent and do not establish a crewed EVA protocol.

The data crop's orthoimage and DTM both have 20.16 m/pixel spacing. The intersection-error image is a stereo ray-separation diagnostic, not terrain accuracy or uncertainty. No contamination score, amount, plume, probability, or safe distance is calculated. The existing map target is illustrative and is not the named Perseverance Bright Angel sample site.

## AI assistance

AI assistants were used to help inspect primary-source documentation, implement and revise the static interface and data-export code, and draft the project notes. The team must make the scientific/design decisions and review all citations, scenario markers and generated outputs; no AI-generated contamination or terrain measurement is presented as observed data.

## Rebuild the small demo data derivative

The original GeoTIFFs are ignored under `data/raw/jezero/`. With the existing environment:

```bash
MPLCONFIGDIR=/tmp/martian-map-mpl .venv/bin/python scripts/build_demo_data.py
```

## Project notes

- [Current status and suggested evening work blocks](docs/STATUS.md)
- [Current visual studies, geometry review and design checkpoint](docs/design.md)
- [Scientific mechanism comparison](docs/science.md)
- [Contact graph variables and verification](docs/model.md)
- [Science basis and closest prior art](docs/science.md)
- [Data products and actual sample results](docs/data-sources.md)
- [Data format](docs/data-contract.md)
- [Major decisions](docs/decisions.md)
- [Challenge and submission requirements](docs/challenge.md), [submission details](docs/submission.md)
- [30-second demo script](docs/demo-script.md)
