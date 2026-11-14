# Clean Approach — visual direction studies

## Status

The previous Terrain First and Guided Field Story alternatives were rejected as a visual direction. Their composition is retired; route calculations, observed rasters, layer controls and source material remain. Layout A is the current working surface as requested. The same page still exposes a lightweight field-plate composition at `/?design=field-plate`, but further visual redesign is outside the current implementation task.

Open the same app with `/?design=terrain` (default) or `/?design=field-plate`. Both use one HTML page, renderer and data. The working interface compares three event-based handling plans, a selectable activity timeline and per-sample provenance traces; the same MRO/CTX orthophoto remains the map substrate. The image is a one-band grayscale product with the same 20.16 m grid spacing as the DTM; there is no higher-resolution imagery in this crop. No synthetic lighting or uncertainty layer is presented as observed data.

## Two composition studies

| Study | Composition and expression | Intended strength | Tradeoff to review |
|---|---|---|---|
| **A · Terrain / `?design=terrain`** | Dark neutral surround; broad terrain image at left; compact plan comparison and timeline at right. | Keeps the scene and event comparison together on desktop. | Detailed provenance traces require scrolling within the page. |
| **B · Field plate / `?design=field-plate`** | Light field-paper surround; wider horizontal terrain plate above the history controls. | Gives the scene more horizontal breadth. | More vertical scrolling separates map and detailed trace. |

**Current working layout:** A, Terrain. It remains a prototype rather than a final visual direction; this implementation changed only what was needed to expose event history and plan comparisons.

## Shared content and interaction

- Compact project name: **Clean Approach**.
- One sentence frames the investigation without implying measured contamination or transfer.
- The user can select one of three handling plans: shared T1, separate T2 with glove contacts retained, or separate T2 with G1→T2 omitted.
- Previous/next and event rows move through ordered activities without inventing clock times; the current place is highlighted on the map.
- Selecting sample B shows source paths with event-linked explanations. B's own sample origin is visually distinct from external scenario source groups.
- The phrase **Illustrative activity plan** remains visible beside the terrain.
- **Data & assumptions** opens sources, raster properties, NoData handling, diagnostic meaning and scenario limitations in place.
- Surface image is the initial view. Elevation and ASP ray-separation remain optional analysis views. Their labels identify data type; ray separation is not measurement uncertainty.
- Drag, zoom, reset and optional camera tour remain available. Respect reduced-motion preference.
- The later video concept is retained for a future task: opening idea **“LIFE DETECTED. … It’s you.”**, ending **“Find Mars. Not ourselves.”** It is an imagined narrative frame, not a discovery claim, and must not be built in this phase.

## Terrain geometry and data checks

The checked-in demo derivative is a 148 × 148 crop in Mars 2015 ocentric equirectangular projected coordinates, with east/north axes in metres. Pixel spacing is 20.162955 m in both directions, so the footprint is approximately 2.984 km on each side. Raster columns advance east and rows advance south; the renderer reverses row direction in its north-up projected view. The orthophoto and DTM share the grid and valid-data mask.

Observed DTM heights range from −2615.689 m to −2515.562 m relative to the areoid (about 100.127 m relief). Of 21,904 cells, 295 (1.35%) are NoData. The mesh renderer skips every quad touching a masked corner and does not fill or interpolate missing cells. Raster neighbour differences reach 4.614 m east/west and 3.507 m north/south over a 20.163 m step; these are local sampled slopes, not evidence of large raster spikes.

Earlier code multiplied vertical displacement by 3. This increased the steepest displayed cell slopes from about 12.9° to 35.7° and made the oblique scene appear unusually spiky. The updated default is 1× vertical scale. A 3× option remains accessible and explicitly labelled **exaggerated**. Zoom, yaw and pitch change the camera view but do not alter data coordinates. Canvas fills are flat; there are no computed surface normals or synthetic hillshade. Bright/dark texture in the surface view comes from the observed grayscale CTX image itself.

The selected 20.16 m/cell spacing is shared by the DTM and orthoimage. Resolution alone is not a measure of terrain reliability. NoData means missing values; no interpolation is applied. The ASP ray-separation layer is a relative stereo-processing diagnostic, not absolute elevation error, measurement uncertainty or confidence. No uncertainty map is justified by the available evidence.

## Browser review and current checkpoint

The earlier composition studies were reviewed in Chromium at 1440×900; current plan states were also rendered with Playwright at a 1440×900 browser viewport. Changing the plan recomputed sample-B source groups and event traces; the browser console had no errors or warnings. Ordinary server binding is restricted in the agent sandbox; an approved localhost run on port 4175 made the app available without changing system settings.

- A · Terrain: [Chromium screenshot](../output/playwright/proposal-a-terrain-1440x900.png). The terrain and activity comparison remain side by side; the visible hierarchy is concise but has more text in the right rail.
- B · Field plate: [Chromium screenshot](../output/playwright/proposal-b-field-plate-1440x900.png). This earlier composition study predates the event-history panel.
- Plan B · Separate tool: [1440×900 browser screenshot](../output/playwright/plan-b-separate-tool-1440x900.png) · [full page](../output/playwright/plan-b-separate-tool-fullpage.png).
- Plan C · Omit G1→T2: [1440×900 browser screenshot](../output/playwright/plan-c-omit-glove-contact-1440x900.png) · [full page](../output/playwright/plan-c-omit-glove-contact-fullpage.png).

The plan screenshots show different event-model results, not design alternatives. Full visual refinement remains outside this implementation pass.

## Prior art / project story to preserve

Keep the previously approved video idea for later: **“LIFE DETECTED. … It’s you.”**, closing with **“Find Mars. Not ourselves.”** No video is part of this design checkpoint.
