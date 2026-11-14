# GitWarriors handoff — 14 November 2026

## Current build

- Clean Approach retains the existing Canvas terrain renderer and default layout A. No framework migration or full redesign was made.
- The event-history implementation is in `public/scenario.js` and `public/contact-model.js`. It compares three plans with a stable set of source, object and place IDs, ordered events, explicit directional contact assumptions, and event-specific provenance traces. Each plan is freshly replayed; no state is carried over.
- Plan A uses T1 at both targets. Plan B switches to T2 at B but retains G1→T2. Plan C also uses T2 and omits only G1→T2. In the scenario replay, plan C removes the modeled human-associated and A-origin paths to B; B's own sample origin remains. This is a logical scenario result, not material-transfer evidence or an operational recommendation.
- A document-control event records a witness entry but does not remove any path. Sealing freezes sample history; an explicit reopen is required before a later contact can affect the sample. An empty initial tool history is explicitly not a sterility finding.
- The timeline has previous/next and selectable event rows; map buttons/markers focus the corresponding place. Contact provenance is shown in the timeline/history panel, separately from the solid walking route. All three plans use the same S→A→B route (about 4.99 km by grid geometry).

## Terrain correction

The inspected code had a confirmed units mismatch: horizontal position was divided by ~20.16 m/cell into cell units, while vertical displacement remained in metres. The renderer treated both values as the same unit, so a “1×” view exaggerated vertical scale by about 20×. `public/terrain-geometry.js` now uses metre-valued east, north and up coordinates before projection, subtracts a computed median valid elevation as a rendering origin, and applies vertical exaggeration only to z. Camera zoom remains a separate screen transform. The profile uses raster metadata dimensions and keeps NoData as gaps; terrain quads touching NoData remain omitted.

## Geographic and science status

- The actual 148×148 MRO/CTX crop covers about 77.43977–77.49012°E, 18.41999–18.47033°N. Its 20.162955 m posting, 100.127 m DTM range and 295-cell NoData mask are unchanged.
- NASA's Mars 2020 record verifies Sapphire Canyon as sample 25 from Cheyava Falls, Bright Angel, sealed Sol 1215. The current CTX crop does not contain a georeferenced sample position. The June 21 rover coordinate in a NASA map is outside the crop and predates collection; it is not used as the sample location. Start, A and B are still illustrative. MRO/CTX is the only mapped mission layer; Mars 2020 is context only.
- **MEDA data test retained:** actual PDS Sol 36 derived wind v2.0 and matching ancillary v3.0; 40,543/41,538 valid paired speed/direction rows, 0–16.24 m/s, with empty uncertainty and boom-use fields. It remains a separate historical figure and does not enter this contact model. See [data sources](data-sources.md).
- No human Mars-EVA source loading, glove/tool transfer measurement, contact frequency, airborne release, transport, deposition or risk/safety value is represented.

## Verification completed

```bash
node --check public/app.js
node --check public/contact-model.js
node --check public/scenario.js
node --check public/terrain-geometry.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
git diff --check
```

Both test files pass. They cover source-A→B reachability through shared T1, the remaining glove route with separate T2, removing only G1→T2, control records, seal/reopen behavior, fresh deterministic replay, invalid references/order, equal metre-scale synthetic axes before projection, explicit vertical exaggeration, metadata-based width, datum selection and NoData profile gaps. These tests do not validate physical transfer.

The local static app was inspected with the installed Playwright CLI and cached Chromium at a 1440×900 viewport. The plan selector was changed live from B to C, the resulting source sets and traces updated, two screenshots were captured, and the browser console had no errors or warnings. The server required an approved localhost run on port 4175 because ordinary sandbox binding is denied. See [`output/playwright/`](../output/playwright/).

## Open limitations and handoff

- A and B are illustrative positions on a 20 m/cell CTX crop, not two verified science targets. The actual Sapphire Canyon sample is not registered on this map. Georeferencing Mars 2020 context into the same scene is the largest spatial gap.
- Possible contact edges are scenario inputs. A path means only that a path exists in the declared graph; it is not transfer observed in any NASA dataset. Plan C is not a validated handling procedure.
- The map now adds geographic orientation to the event history, but it does not yet show a Mars 2020 target co-located with terrain. Its geographic contribution is currently location context and a same-route geometry check; contamination results come from the event assumptions, not terrain values.
- Existing `.venv`, raster assets, contact graph science framing and MEDA wind figure remain intact.

For the next implementation, select a CTX product whose verified footprint includes a Perseverance target and a coordinate-bearing Mars 2020 record, or keep A/B illustrative and present the multi-mission geospatial limitation prominently. Then review whether the scenario assumptions are useful for a human-EVA design discussion before adding operational guidance.
