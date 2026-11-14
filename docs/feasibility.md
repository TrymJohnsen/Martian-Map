# Feasibility and recommendation

## Data-test outcome

No NASA/USGS raster was downloaded or read in this workspace. The official USGS STAC collection metadata confirms a public MRO/CTX collection, Cloud Optimized GeoTIFF access, the Mars equirectangular CRS, approximately 20–36 m GSD across the collection, CC0-1.0, and DOI 10.5066/P9JKVWR3. The CTX product documentation describes paired orthorectified imagery and optional intersection-error / QA products. The live item query and COG range read could not run: DNS fails for the USGS host, its S3 host, and unrelated `example.com`. The runtime also has no pip/venv bootstrap package. Consequently, no specific item/product ID, actual asset URLs, raster dimensions, overlapping footprint, transform, NoData, acquisition time, full asset size, or quality values have been verified. The working collection page is not evidence that its data assets were fetched.

The next sample attempt should use one CTX STAC item advertising both DTM and orthophoto assets, so their footprints and transforms can be checked. An intersection-error asset may be present but is a processing diagnostic, not automatically measurement uncertainty. A detailed image paired with a coarser height grid demonstrates different sampling scales; that difference alone does not indicate error or unreliability. Jezero SIM 3464 geology and broad THEMIS data remain optional because local overlap, format and usefulness have not been tested.

## Preliminary idea candidate: compare what the layers resolve

Make a compact view of a single Jezero area that lets a user compare the CTX orthophoto with its coarser CTX-derived elevation grid. A third layer is optional and should be used only if an item-level product exists and its meaning is understood. If NoData appears, show those cells as “no elevation value in this product,” not as unsafe ground, low confidence, or a terrain feature. If an intersection-error raster is present, label it by its documented processing metric and do not rename it uncertainty.

**Example interaction:** the user selects a visible ridge and toggles between the image and elevation view. The prototype reports the actual source pixel spacing for each product and shows any DTM NoData separately. It makes no claim of error from the resolution difference. This interaction is contingent on the product sample actually covering the feature and matching geographically.

3D may help make a broad ridge or crater relief easier to understand, but it is not yet justified as essential. First compare the image and elevation sample in 2D; use 3D only if it clarifies the landform. State any vertical exaggeration, and do not imply extra measured detail by upscaling.

### Backup idea

If the paired terrain imagery is not a useful science story, revisit the return-time-budget hypothesis only after checking that the elevation data and coordinate units support the intended route calculation. Walking speed, stop duration, reserve time, and any slope penalty would be scenario assumptions, not measured Mars values; the result would not be a validated astronaut mobility or safety model.

## Evidence categories

- **Observed/source data:** CTX imagery and stereo-derived DTM, if and when actual item assets are fetched. DTM NoData masks describe cells with no stored elevation; an intersection-error/QA raster is a derived processing diagnostic whose exact semantics must be read in product documentation.
- **Derived calculations:** projected distances, local relief, slope, masks and a display mesh computed from source rasters. Check Mars CRS and units, NoData handling, and effective resolving scale. Do not turn posting/GSD or an intersection-error diagnostic into a measurement-uncertainty map without a defensible product method.
- **Scenario assumptions:** walking speed, rest/stops, time reserve, slope tolerance, route choice, and any future astronaut/habitat parameters. These are inputs, not observations.

## 30-second demo outline

1. **0–5 s:** locate the small Jezero area in the CTX orthophoto.
2. **5–12 s:** switch to the paired elevation surface and show its actual coarser grid scale.
3. **12–20 s:** compare a visible feature in both; show NoData separately only if the sample contains it.
4. **20–26 s:** display product IDs, units, and pixel spacing for the two layers.
5. **26–30 s:** close with a modest point: imagery and elevation answer different questions at different scales.

This storyboard remains provisional until a sample proves that both assets cover the same feature.

## Minimum viable prototype

- One small, verified CTX DTM/orthophoto footprint; an optional quality diagnostic only if present and interpretable.
- A single local scene with layer toggles, a click/readout for coordinates and source values, and a compact source/limitations panel.
- Begin in 2D; include a modest 3D terrain mesh only if it improves understanding, with truthful vertical scale and an optional clearly labelled exaggeration control.
- English captions and a recorded demo no longer than 30 seconds.
- No authentication, backend, live telemetry, or astronaut-safety claim.

## Main weakness and next gate

The chief weakness is that no raster sample has yet passed the gate. CTX documentation describes 20 m posting and typical 3–5 m vertical precision, but the selected product's actual transform, scale/offset, NoData and diagnostics are unknown. Resolution differences are not evidence of error; NoData, interpolation, processing diagnostics and measurement uncertainty are distinct concepts. Before selecting an idea, run the prepared script in a networked environment, inspect the item and asset metadata, verify geographic/bounds overlap, inspect pixel masks and values, and look at the generated preview. The agent runtime cannot resolve any tested domain, and the isolated Python environment could not be bootstrapped here.

## Three-person split

| Owner | Files | Responsibility |
|---|---|---|
| Data / science | `scripts/fetch_mars_samples.py`, `docs/data-sources.md`, `data/raw/` (ignored) | Run catalog query, confirm product IDs and footprints, inspect metadata and data quality; record source vs derived values. |
| Prototype / 3D | `src/` (to be chosen after checking repo app state), `data/processed/` (ignored) | Build the single-site layer view and 3D explanation after the sample passes the gate. |
| Story / integration | `docs/feasibility.md`, demo assets (outside repository until ready) | Keep labels and claims honest, integrate the interaction, prepare and time the English demo. |

Agree a minimal handoff format before integration: GeoJSON `FeatureCollection` in Mars west-positive/planetocentric coordinates for points/routes, with each feature carrying `id`, `label`, `source_product_id`, `kind`, and `value`; raster layers retain their GeoTIFF CRS/transform/NoData in a sidecar metadata JSON. Do not silently reproject, resample, or replace source metadata.
