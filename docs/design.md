# Clean Approach — visual direction studies

## Status

The previous Terrain First and Guided Field Story alternatives were rejected as a visual direction. Their composition is retired; the route calculations, observed rasters, layer controls and source material remain in the prototype. The current page offers two lightweight, same-content composition studies. They are not a final redesign. Choose one before further visual work.

Open the same app with `/?design=terrain` or `/?design=field-plate`. The alternatives share one HTML page, renderer, data, order selection, route metrics, elevation profile and expandable source detail. Both use the actual CTX orthophoto where available. The image is a one-band grayscale product with the same 20.16 m grid spacing as the DTM; there is no higher-resolution imagery in this crop. No synthetic lighting or uncertainty layer is being presented as observed data.

## Two composition studies

| Study | Composition and expression | Intended strength | Tradeoff to review |
|---|---|---|---|
| **A · Terrain / `?design=terrain`** | Dark neutral surround; broad, nearly full-height terrain image at left; compact activity comparison at right. Restrained sans-serif hierarchy, quiet controls, no nested cards. | Keeps the 3D surface as the largest object and leaves the two order choices beside it. | The route metrics and method note share a relatively narrow column. |
| **B · Field plate / `?design=field-plate`** | Light mineral-paper background; wide horizontal terrain plate above a full-width decision band. The choice and route profile read like a concise field report. | Gives the scene more horizontal breadth and gives comparison/results a clear row below it. | The choice is lower on the page; less of the map and the activity comparison fit together in a short viewport. |

**Provisional recommendation:** A, Terrain. The purpose is to inspect route order against the terrain, so keeping the options adjacent to a large map may make that relationship easiest to understand. This is a design hypothesis, not a research finding or a final decision. The user should compare actual renders before we continue.

## Shared content and interaction

- Compact project name: **Clean Approach**.
- One sentence frames the investigation without implying measured contamination or transfer.
- The user can select **Collect sample** or **Survey area** first. Selection has a neutral outline and pressed state only; no checkmark or approval cue.
- Explanatory copy sits directly under the activity choice. It distinguishes the illustrative path from physical contact and transfer.
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

## Visual review and next checkpoint

Both studies were started from the local static app, rendered in headless Chromium at 1440 × 900, and visually inspected. The ordinary sandbox denied socket binding. Port 4173 was occupied but unreachable; using an approved localhost server on port 4174 made the app available to Chromium without changing system security/network settings. The browser console was clean after fixing two obsolete element references from the removed NASA image card. The sequence control was clicked in the live browser: the selected state, explanation, route distances (3,300 m → 4,990 m; footprint overlap 140 m → 350 m) and profile all updated.

- A · Terrain: [Chromium screenshot](../output/playwright/proposal-a-terrain-1440x900.png). The terrain and activity comparison remain side by side; the visible hierarchy is concise but has more text in the right rail.
- B · Field plate: [Chromium screenshot](../output/playwright/proposal-b-field-plate-1440x900.png). The lighter horizontal composition shows the terrain first, then the two choices and concise explanation; route metrics continue below the initial 900 px viewport.

These are inspected design proposals, not final visual approval. The user should choose A, B or describe a hybrid before any full redesign or further polish.

## Prior art / project story to preserve

Keep the previously approved video idea for later: **“LIFE DETECTED. … It’s you.”**, closing with **“Find Mars. Not ourselves.”** No video is part of this design checkpoint.
