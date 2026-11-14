# Current status — Clean Approach

## Demonstration

The prototype now uses one persistent terrain map through three steps: **Mission**, **Plan**, and **Sample history**. Mission distinguishes the PDS-derived nominal Sapphire Canyon target B from hypothetical work site A and gives a short science context. Plan compares T1 reuse with separate T2 use while showing Glove G1 at both activities. Sample history switches between plans and displays paths calculated by the same ordered-event model.

When the separate-tool model contains the path, the interface says **Different tool. Shared glove history.** It labels the result as possible contact history, not measured contamination. Plan C remains a counterfactual that omits only modeled G1 → T2 at B. The three-step walkthrough has Stop, Restart and manual previous/next controls and uses the live scenario.

- [Mission · 1440×900](../output/playwright/clean-approach-step-1-mission-1440x900.png)
- [Plan · 1440×900](../output/playwright/clean-approach-step-2-plan-1440x900.png)
- [Sample history · 1440×900](../output/playwright/clean-approach-step-3-history-1440x900.png)

## Front-end structure

The browser code is split by owner: `public/map.js` (terrain map, layers, route/markers, profile), `public/panel.js` (Mission / Plan / Sample history, event timeline, walkthrough) and a small `public/app.js` (data loading, shared source text). They communicate through `window.CleanApproach` and three events; empty mount points `#layer-panel`, `#context-cards` and `#mission-panel` are ready for new work. See [the module contract](data-contract.md#module-and-event-contract) and [decisions](decisions.md). The user-visible app is unchanged by the split.

## Data limits

- B is a nominal target-area placement from the PDS report associated with Sapphire Canyon, not a verified drill point. Coordinate datum and horizontal accuracy are not stated.
- The PDS and CTX elevations at B differ by about 29.8 m; the cause remains unresolved.
- A, the traverse and contact chain are illustrative. Reachability is not measured transfer, contamination, probability, safety or EVA guidance.
- CTX DTM/ortho posting is about 20.4 m. NoData remains blank. ASP ray separation is a relative stereo diagnostic, not terrain uncertainty.

## Verification

On 2026-11-14, Playwright/Chromium at 1440×900 verified keyboard access to all three steps, tool selection, back navigation with plan retained, plan comparison without stale paths, Plan C's modeled omission, and opening/closing Data & assumptions without losing the active step. The separate-tool result included Glove G1 → Tool T2 → Sample B. The walkthrough start/stop, manual next and restart were exercised. The map, selected markers and computed result were visible together in the history view. Browser console had no errors or warnings after the app loaded.

```bash
node --check public/app.js
node --check public/map.js
node --check public/panel.js
node --check public/scenario.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```

On 2026-11-14 the module split was checked in Edge (headless, 1440×900) before and after: 35 states covering all three steps, plan changes, event stepping, trace links, Plan C, canvas marker clicks, drag, zoom, layers, height scale, reset, walkthrough start/stop/auto-advance/manual, the assumptions panel and 820 px and 390 px widths produced identical text, map pixels and screenshots, with no console errors.

The agreed future video idea remains **“LIFE DETECTED. … It’s you.”** and closes with **“Find Mars. Not ourselves.”** Video production is not included.

## Map layers and terrain planning update — 2026-11-14

Implemented within the map workstream:

- Central-difference slope in degrees with independent derived storage, metre spacing, NoData-neighbour/border gaps, and quantization/posting caveats.
- Eight independent layer toggles with evidence groups and individual legends: ortho, elevation, ray separation, slope, threshold exceedance, unknown terrain, scenario route and work zones. Colour ranges come from valid raster values; the fixed ray-separation divisor is removed. Layer controls live in Terrain analysis; camera controls remain available.
- User-selected slope threshold with unique crossed-cell counts across the complete route polyline, explicit NoData/unknown-slope counts and outside-raster warning. No threshold is a validated suit limit. Unknown cells are hatched on a labelled schematic reference plane; no raster heights are filled.
- Generic scenario place rendering, optional circular zone rendering with dashed scenario labels, astronaut symbol following mission:step, unchanged map:place payload and keyboard place buttons. No scenario or contact-model file changed.
- MEDA historical point-context card, hourly sample-speed summaries and eight-sector wind rose, plus separate sourced Curiosity RAD text context. No environmental map layers. The unverified approximate distance to B is omitted.

Validation for this update:

- `node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs`: 21/21 passed, including flat/known two-axis slopes, metre spacing, invalid arrays, NoData, raster edges, segment-cell intersection, corner touches, repeated visits and off-raster geometry.
- `node --check` on map.js, layers.js, terrain-geometry.js and both new scripts: passed.
- `node scripts/check_map_browser.cjs`: actual headless Chrome smoke test passed, exercising eight layer toggles, 0°/90° threshold updates (143/0 crossed steep cells on the current route), place event payload, mission event dispatch, extra scenario place/zone and both context cards. No Runtime exceptions. The test uses locally installed Chrome (override CHROME_PATH); it does not replace a human visual/accessibility review.
- Geospatial Python check attempted with the installed Python 3.12 executable; blocked at import because numpy is missing. No source raster or georeferencing was changed. The expected .venv is absent in this checkout.

Handoff/limits: scenario.js currently supplies no zones, so no default work circles are invented; the panel/scenario owner can add the already documented zones array. No edits to mission/panel/HTML are required; map.js loads layers.js itself. Off-raster places retain accessible buttons; missing-height markers/unknown hatching are schematic, not a height estimate. Existing docs/science.md contains older statements about crop registration/resolution that conflict with the current data contract; this file is outside this task's scope and was preserved. The optional observed rover-route layer was not attempted; it is not part of this MVP. Visual review and the Python dependency setup remain follow-up work.

Final browser check also compared canvas output before/after raster-layer, route, NoData and injected-zone toggles, and before/after a mission focus change; the visible rendering changed. A synthetic route through NoData and beyond the raster produced both explicit warnings. A captured Chrome screenshot was inspected for the terrain/route/astronaut rendering. Full manual keyboard, screen-reader and desktop/mobile layout review remains outstanding.

## English copy and visible map legend — 2026-11-14

All map-workstream UI text, accessibility labels, route summaries and MEDA context strings are now English; the context builder reproduces the English JSON. An always-visible “Map colours and symbols” section sits directly beneath the map, outside the collapsed Terrain analysis controls. It lists enabled layers with colour/pattern swatches, elevation/ray-separation display ranges, the current red slope threshold and a blending explanation. Individual legends remain beside the controls. Chrome checks verified legend visibility, enabled-layer entries, threshold updates, English copy and existing map interactions; syntax checks and git diff --check passed. No changes to source observations, terrain calculations or contact semantics.

## Map interaction performance — 2026-11-14

Camera pointer/wheel events now coalesce through requestAnimationFrame, so a burst renders the latest camera state once per display frame. Raster-layer colours are composited once per layer combination and cached, instead of recalculating colours and repeatedly filling every quad on every move. Projection trigonometry is computed once per frame; the existing metre coordinates, vertical exaggeration and camera equations are retained. NoData hatching uses a reusable pattern.

While dragging or scrolling, a labelled preview samples every second terrain vertex. Each coarse patch is rejected if ANY underlying vertex is NoData, including skipped interior vertices. Full-resolution rendering returns on pointer release/cancel/lost capture or 150 ms after the last wheel event. Source arrays, slope, route intersections and full-resolution hazard overlays are unchanged. Temporary preview colour/elevation detail is lower; this is a display optimization, not a new terrain dataset.

Chrome's synthetic alternating-wheel benchmark measured median event-to-animation-frame time of 121.3 ms before changes and 28.5 ms after the preview/cache changes on this machine. This measures interaction in headless Chrome, not a guaranteed frame rate on other hardware. Existing browser layer/render/event/context checks and 21 unit tests passed. The browser regression check additionally verifies restoration of full detail and coalescing a 20-event wheel burst into one draw.

## NoData display correction — 2026-11-14

Removed reference-plane NoData hatching from the 3D terrain because camera tilt made it appear to float outside the surface. Unknown terrain now uses a separate, labelled north-up coverage inset below the map: grey valid cells and pale hatched NoData cells, directly from the unchanged mask. The Unknown terrain checkbox toggles this inset. The 3D mesh retains its NoData gaps; no missing height is interpolated or assigned for this display. Route NoData/outside warnings remain unchanged. Legends now explain the inset explicitly. Syntax checks and the Chrome regression check cover the change, including inset visibility and existing route warnings.

## Python verification unblocked — 2026-11-14

Created the ignored project-local Windows .venv using Python 3.12.5 and installed numpy 2.5.4, rasterio 1.5.2, pyproj 3.8.0 and affine 3.0.1 with their dependencies. `.\.venv\Scripts\python.exe tests/test_geospatial_export.py` now passes all 3 tests; `python -m pip check` reports no broken requirements. This resolves the missing-numpy/Python-environment blocker recorded above. No raster regeneration was performed.

## Remove standalone coverage figure — 2026-11-14

Removed the separate grey data-coverage inset at the user's request, together with its Unknown terrain checkbox and hatching legend. Missing data remain absent from the 3D mesh, and route NoData/outside-raster warnings remain active. The visible map legend explains terrain gaps. Browser regression coverage now expects seven layer controls and checks that the removed figure is absent while retaining the synthetic unknown-terrain route checks.
