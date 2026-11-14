# Clean Approach

**Clean Approach** is a local Marswalk scenario at Jezero's Bright Angel region. It places the documented Perseverance sample site Sapphire Canyon on an MRO/CTX terrain crop, then compares how assumed glove/tool contacts could connect a hypothetical earlier sample at A to sample B's history.

The mission in two sentences: **An astronaut collects a hypothetical sample at A, then visits the rock where Perseverance collected Sapphire Canyon at B. The comparison asks whether handling at A could matter when interpreting B; A has no claimed observation or mineral finding.**

## Run the demo

From the repository root:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>. Terrain and the linked source report are available locally/online respectively.

The B marker is based on the PDS sample dossier for **M2020-1215-28 Sapphire Canyon** (sample 25, Cheyava Falls, Bright Angel, Sol 1215). The report lists latitude north and longitude east, but gives no horizontal accuracy or coordinate datum; the marker is snapped to its nearest valid CTX cell and explicitly labelled with this limit. A and the traverse start remain illustrative.

Choose among three event plans:

- **A · Same tool:** use T1 at A and B.
- **B · Separate tool:** use T2 at B, retaining the assumed glove-to-T2 contact.
- **C · What if this contact could be avoided?** counterfactually omit only G1 → T2 at B. This is not a validated EVA procedure or a safe-plan recommendation.

All plans use the same S → A → B route. The solid map line is walking geometry; contact histories appear in the timeline and sample history, not as particle paths. Use the event controls to follow A's handling and then B. Select B to inspect its history, and click trace links to visit the events that created each connection. “Provenance” here means the sample's history.

## Data and limits

- **MRO/CTX:** actual DTM, orthorectified image and ASP ray-separation diagnostic from product `N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W`. The 175×147 crop is 20.399 m/pixel in Mars 2015 ocentric east-positive CRS (IAU:49910), with 3.58% NoData. DTM and ortho share the grid. NoData remains absent; no interpolation is done. Ray separation is a relative stereo diagnostic, not accuracy or uncertainty.
- **Mars 2020/Perseverance:** the PDS sample-report coordinate locates B nominally within a valid CTX cell. The report's horizontal accuracy/datum are unstated; its listed elevation differs by about 29.8 m from the CTX cell elevation, so the vertical values are not treated as a precise match. The map shows regional terrain, not a drill hole at 20 m detail.
- **Scenario:** A, the start, route and all future handling events are illustrative. The graph computes qualitative reachability only. Paths are assumed contacts, not measurements of material transfer, contamination, probability, risk or safety.

The DTM's east, north and up coordinates use metres before camera projection. The default height scale is 1×; the optional 3× setting is explicit exaggeration. The profile uses raster dimensions and leaves NoData gaps. Terrain does not decide contact paths or EVA safety.

## Reproduce the selected crop

The checked-in `public/data/bright-angel-demo.json` is a small display derivative; source rasters remain ignored under `data/raw/`. With the project's `.venv` and network access, fetch the selected product and build the display data:

```bash
.venv/bin/python scripts/fetch_mars_samples.py \
  --bbox 77.28 18.47 77.34 18.52 \
  --item-id N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W \
  --output-dir data/raw/bright-angel-n02

.venv/bin/python scripts/build_demo_data.py \
  --input data/raw/bright-angel-n02 \
  --output public/data/bright-angel-demo.json \
  --scenario-config scripts/bright-angel-scenario.json
```

## Checks

```bash
node --check public/app.js
node --check public/scenario.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
```

These checks validate event logic, sealing, map-cell conversion, meter-scale geometry and NoData behavior. They do not validate physical transfer, position accuracy or terrain accuracy. Playwright screenshots from the verified 1440×900 viewport and full-page plan comparisons are in [`output/playwright/`](output/playwright/).

## Project notes

- [Current status](docs/STATUS.md) · [Data products and mission evidence](docs/data-sources.md)
- [Event-history model](docs/model.md) · [Data contract](docs/data-contract.md)
- [Science basis](docs/science.md) · [Design](docs/design.md) · [Demo script](docs/demo-script.md)

No AI-generated contamination or terrain measurement is presented as observed data. The prototype is independent and is not NASA-endorsed.
