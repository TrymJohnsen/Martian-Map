# Feasibility and recommendation

## Data-test outcome

No NASA/USGS raster was downloaded or read in this workspace. Official USGS Astrogeology documentation confirms a public STAC collection of MRO/CTX stereo terrain models with associated orthorectified images, and describes how their data and quality assets are produced. The live metadata request and COG range read could not run because shell DNS resolution fails here. Consequently, no specific product ID, actual raster dimensions, matching footprint, transform, NoData value, acquisition time, file size, or quality values have been verified. Do not treat the intended sample as data that already works.

The most promising layer pair is a single CTX STAC item containing its DTM, orthophoto, and quality assets. The two image-derived rasters should be geographically compatible by construction, but matching CRS, transforms and valid-data masks still need to be checked. A geological map of Jezero or broad THEMIS thermal context may add interpretation, but actual local overlap and scale have not been established. Do not force either into the prototype until its footprint and usefulness are demonstrated.

## Recommended idea: show where the map stops knowing

Make a small 3D terrain view that lets a user toggle the CTX orthophoto, elevation surface, and DTM quality/NoData mask for one short Jezero area. The surprising point is that a crisp, detailed-looking image can sit over terrain cells that are missing or weakly supported by stereo matching. Instead of presenting a uniformly certain surface, show where a height or slope reading should be treated cautiously.

**Example interaction:** the user clicks a visually interesting ridge and switches on the terrain-quality layer. The prototype shows the ridge shape from the DTM and the orthophoto, then reveals a gap or weak-quality region across part of the approach. It labels the gap as missing/low-confidence orbital terrain evidence, rather than claiming the route is blocked or unsafe. This interaction depends on the actual sample containing a useful quality feature; validate that before committing to it.

3D helps because the viewer can compare the visible image with the corresponding height surface and immediately see that visual detail and elevation support are different things. Use a stated vertical exaggeration, if any; do not imply extra measured detail by upscaling.

### Backup idea

If the chosen DTM has no meaningful quality variation, build a simple “return-time budget” comparison along a short drawn route using observed elevation only as terrain context. Distance, walking speed, stop duration, reserve time, and any slope penalty must be shown as user-set scenario assumptions. It would be an illustrative planning aid, not a validated astronaut mobility or safety model.

## Evidence categories

- **Observed/source data:** CTX optical measurements and stereo-derived DTM, if and when a product is actually fetched; source QA/intersection-error assets are processing diagnostics.
- **Derived calculations:** projected distances, local relief, slope, masks and visual terrain mesh computed from those files. Any calculation needs valid projected units, NoData handling, and a scale appropriate to the DTM's actual resolving power.
- **Scenario assumptions:** walking speed, rest/stops, time reserve, slope tolerance, route choice, and any future astronaut/habitat parameters. These are inputs, not observations.

## 30-second demo outline

1. **0–5 s:** show the crisp orbital image and locate the tiny Jezero test area.
2. **5–12 s:** tilt into 3D; switch on elevation and reveal the terrain shape.
3. **12–20 s:** activate the quality/NoData layer; highlight a place where the height surface is missing or weakly constrained.
4. **20–26 s:** click the ridge and show the evidence label: “visible image; terrain support limited here.”
5. **26–30 s:** close with the point: “A detailed map should show where its measurements run out.”

Do not use this storyboard unless the chosen sample really exhibits the shown gap/quality contrast.

## Minimum viable prototype

- One small, verified CTX DTM/orthophoto footprint and at most one useful quality layer.
- A single local scene with layer toggles, a click/readout for coordinates and source values, and a compact source/limitations panel.
- A modest 3D terrain mesh with truthful vertical scale and an optional clearly labelled exaggeration control.
- English captions and a recorded demo no longer than 30 seconds.
- No authentication, backend, live telemetry, or astronaut-safety claim.

## Main weakness and next gate

The chief technical/scientific weakness is that a stereo DTM's 20 m post spacing can look more precise than its true resolving power, and typical vertical precision around 3–5 m is consequential for local slope. Artifacts and holes can themselves be mistaken for terrain. Before building, successfully fetch one item, read its projection/units/NoData/quality metadata, compare its DTM against its orthophoto, and confirm that the intended feature is real in both. The current environment's DNS restriction prevents that gate from being completed here.

## Three-person split

| Owner | Files | Responsibility |
|---|---|---|
| Data / science | `scripts/fetch_mars_samples.py`, `docs/data-sources.md`, `data/raw/` (ignored) | Run catalog query, confirm product IDs and footprints, inspect metadata and data quality; record source vs derived values. |
| Prototype / 3D | `src/` (to be chosen after checking repo app state), `data/processed/` (ignored) | Build the single-site layer view and 3D explanation after the sample passes the gate. |
| Story / integration | `docs/feasibility.md`, demo assets (outside repository until ready) | Keep labels and claims honest, integrate the interaction, prepare and time the English demo. |

Agree a minimal handoff format before integration: GeoJSON `FeatureCollection` in Mars west-positive/planetocentric coordinates for points/routes, with each feature carrying `id`, `label`, `source_product_id`, `kind`, and `value`; raster layers retain their GeoTIFF CRS/transform/NoData in a sidecar metadata JSON. Do not silently reproject, resample, or replace source metadata.
