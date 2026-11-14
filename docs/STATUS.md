# Current status — Clean Approach

## Simplified interface with the merged map layers (2026-11-14, latest)

`origin/main` (terrain layers, slope, work zones) is merged into this branch and the page was simplified. The map card now has five layer switches (Image, Elevation, Slope, Steep ground, Work zone), one slope threshold and one route line; the work zone is drawn as a dashed ring and steep ground in amber. In the checklist each step shows its instruction and choice, with the reason and the precedent behind "Why, and where this comes from". The result is one sentence and three source rows. Assumptions are three switches; their explanations remain for screen readers. Example plans show the table first and all events behind a disclosure.

Removed from the interface on purpose: the wind and radiation context cards from the map branch (no dataset for Bright Angel; `loadContext` in `map.js` is no longer called), the long layer legends, the evidence-label key, the explanation notes, "Created at" links, and most of the Data page. Sections below that describe those parts are older. `scripts/check_map_browser.cjs` from the map branch targets the earlier page structure and was not updated. Checked in Edge: 50 behaviour checks, no console errors, no horizontal overflow at 1440, 820 and 390 px; `node --test tests/*.cjs` passes 43 tests.

## Demonstration

The app follows the "Clean Approach · redesign" canvas and has four views behind one header:

- **Mission intro** (entry page): the question, the primary action **Open the mission checklist**, why Sapphire Canyon matters, the three places with their evidence labels, and the terrain map.
- **Checklist**: eight steps from the start to sealing. One step is open at a time; four steps carry a choice (glove change, witness tube, sampler, seal check). The map and **What connects to Sample B** stay visible beside the steps, and three assumptions can be switched in the side column next to a "Not a result" status card and the "Not modeled" list. After every change the scenario is rebuilt and replayed.
- **Example plans**: the three prepared sequences compared in a table, an event timeline for all nine events of each plan, and a walkthrough with Previous, Next, Walk me through it, Stop and Restart.
- **Data & assumptions**: what is Observed, Derived or Scenario, the coordinate caveats, the cells with no data, the route profile, sources and credits.

With the default choices the human-associated path remains (G2 → tongs → Sample B), because G2 is assumed to carry it. That is intended: the model gives no step the power to protect a sample. A note in the result explains this and links to the assumption.

Screenshots: [intro](../output/playwright/redesign-intro-1440.png) · [checklist](../output/playwright/redesign-checklist-1440.png) · [example plans](../output/playwright/redesign-examples-1440.png) · [data](../output/playwright/redesign-data-1440.png) · tablet [intro](../output/playwright/redesign-intro-820.png), [checklist](../output/playwright/redesign-checklist-820.png) · phone [intro](../output/playwright/redesign-intro-390.png), [checklist](../output/playwright/redesign-checklist-390.png)

## Open points

- **Map markers are not redesigned.** `map.js` was left untouched for the map workstream. The canvas still draws round coloured markers, labels the boundary place with its ID ("zone-B", overlapping "B"), and draws no work-zone ring or step highlight. The legend describes what is drawn today, using the tokens `--map-s`, `--map-a` and `--map-route`.
- **Phone result.** The design opens the result as a bottom sheet. Here the bottom bar shows the four source groups and "Details" moves to the full result further down the page.
- **Copy to review.** The two explanation notes in the result, the example-plan intro sentence, and the Data & assumptions notes were written during the build.
- **Fonts** load from Google Fonts; offline the page falls back to system fonts.
- `README.md` and `AGENTS.md` still describe the three-step flow and the earlier test command. `public/styles.css` and `public/design-overrides.css` are no longer linked and can be removed once the map branch is merged.
- The earlier screenshots under `output/playwright/` (`clean-approach-step-*`, `bright-angel-*`, `plan-*`, `proposal-*`) show superseded layouts.

## Front-end structure

`public/tokens.css` and `public/components.css` hold the design system. `public/panel.js` owns the views, the checklist and the example plans; `public/map.js` owns the terrain canvas inside the shared map card; `public/app.js` loads the data and starts both. They communicate through `window.CleanApproach` and three events. See [the module contract and markup hooks](data-contract.md#module-and-event-contract) and [decisions](decisions.md).

## Data limits

- B is a nominal target-area placement from the PDS report associated with Sapphire Canyon, not a verified drill point. Coordinate datum and horizontal accuracy are not stated.
- The PDS and CTX elevations at B differ by about 29.8 m; the cause remains unresolved.
- A, the traverse and contact chain are illustrative. Reachability is not measured transfer, contamination, probability, safety or EVA guidance.
- CTX DTM/ortho posting is about 20.4 m. NoData remains blank. ASP ray separation is a relative stereo diagnostic, not terrain uncertainty.

## Verification

```bash
node --check public/app.js
node --check public/map.js
node --check public/panel.js
node --check public/mission.js
node --check public/scenario.js
node --check public/contact-model.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs tests/mission-model.test.cjs tests/mission-steps.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```

On 2026-11-14 the redesigned app was checked in Edge (headless): 52 checks, no console errors or warnings. They covered the intro as entry with one primary action above the fold; every choice and assumption with the expected source groups, chains and "Created at" links; focus kept on the control just used and moved to the step title when a step opens; the work-zone warning and its link; the explanation note and its hidden state; `mission:step` and `scenario:change` including the `zone-B` place; the example-plan table matching the model; the walkthrough advancing, stopping and stepping manually; opening a plan in the checklist; deep links; the skip link first in the tab order and every control named; no text under 12 px; and no horizontal overflow in any view at 1440, 820 and 390 px. `node --test` passes 36 tests. Token contrast was calculated for 22 text and background pairs; the lowest is 5.2:1 (disabled text). The Python geospatial test was not rerun; no Python or data file changed.

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
