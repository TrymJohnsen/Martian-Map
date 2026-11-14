# GitWarriors handoff — Bright Angel target integration

## Current result

- The existing Canvas terrain renderer and default layout A remain in use. The corrected metre world scale, ordered contact engine, seal/reopen behavior, NoData gaps and test suite are preserved.
- The previous MRO/CTX landing-area crop did not cover the actual sample coordinate. A bounded USGS STAC search found several footprints; one overlapping product had NoData at the target. The selected product is `N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W`.
- The map now uses the PDS Sample Dossier coordinate associated with `M2020-1215-28 Sapphire Canyon` (sample 25; Cheyava Falls, Bright Angel; Sol 1215) for marker B. It transforms to a valid cell `(row 66, col 73)` in the selected raster and lies 6.67 m from its cell centre. The report gives no horizontal accuracy or coordinate datum; the UI calls the map tie nominal and does not imply drill-hole precision.
- The PDS report lists elevation −2354.236 m; the target CTX cell is −2324.475 m, a 29.76 m difference. Cause is unresolved. The values are not presented as precisely vertically registered, and the discrepancy is not used as an accuracy estimate.
- DTM, orthoimage and ASP ray-separation diagnostic share a 175×147 grid at 20.399228 m/pixel. NoData is 921/25,725 cells (3.58%) and remains blank. The reported sample coordinate is valid in all three layers. A and start remain illustrative, on valid cells; same S→A→B route is used in all plans.
- The story is: an astronaut collects a hypothetical sample at A, then visits documented target B; possible A-origin material matters only as an explicit history assumption. No observation or mineral finding is assigned to A.
- Plan A uses T1 at A and B. B uses T2 but retains G1→T2. C asks “What if this contact could be avoided?” and omits only that assumed G1→T2 link. C is a counterfactual, not a supported or validated EVA action. All outcomes are reachability results, not material transfer or a plan ranking.
- UI source distinction remains explicit: possible human-associated material, possible material associated with hypothetical A, and B's own geological origin. Sample B's source chain follows linked events. Route is drawn separately from contact paths. PDS sample context appears beside the map marker.

## Mission contribution and limits

- MRO/CTX gives an actual Bright Angel vicinity surface image, DTM and a relative stereo diagnostic. It supplies geographic orientation and broad terrain context, but does not calculate contact transfer.
- Mars 2020/Perseverance gives the named science target and sample-report location, not a second raster. The scene is a focused MRO terrain map with a geospatial Mars 2020 target, not a multi-mission raster stack.
- The PDS coordinate and STAC product bounds are independently sourced records that overlap. No high-resolution comparison resolves the drill hole. CTX's ~20.4 m posting and the unspecified target accuracy limit exact co-registration.
- The DTM target-cell elevation differs from the PDS elevation by ~29.8 m. This remains a visible data discrepancy; no cause or uncertainty is inferred.
- The human source and contact edges remain hypothetical. No transfer rate, probability, particle path, risk value, safe plan or EVA protocol is modeled. MEDA Sol 36 remains separate historical landing-area context and is not used.

## Verification

The Python geospatial-export check covers Mars lon/lat conversion, valid-cell selection and NoData rejection, alongside the existing model/geometry checks. JavaScript checks, all three Python tests and the browser run passed on 2026-11-14. Playwright rendered the bundled 175×147 terrain crop at a 1440×900 laptop viewport, loaded the selected product ID, exercised A and C and reported no console errors. Screenshots:

- [Overview, 1440×900](../output/playwright/bright-angel-overview-1440x900.png)
- [Plan A, 1440×900](../output/playwright/bright-angel-plan-a-1440x900.png) · [full page with B history](../output/playwright/bright-angel-plan-a-sample-history-fullpage.png)
- [Plan C, 1440×900](../output/playwright/bright-angel-plan-c-1440x900.png) · [full page with B history](../output/playwright/bright-angel-plan-c-sample-history-fullpage.png)

These checks verify software behavior and presentation, not physical transfer, position accuracy, absolute terrain accuracy or operational suitability. Run:

```bash
node --check public/app.js
node --check public/scenario.js
node --check public/contact-model.js
node --check public/terrain-geometry.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```


## Next useful work

Review whether the nominal PDS-to-CTX point placement and the 29.8 m vertical discrepancy need additional source-level investigation before describing the map as precisely georeferenced. The smallest supported improvement is to retain the coordinate uncertainty/elevation caveats beside the visible marker, as this build does. Do not infer a precise drill coordinate or use the contact scenario as operational guidance.
