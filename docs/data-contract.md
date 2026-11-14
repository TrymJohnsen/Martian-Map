# Demo data contract

The frontend consumes `public/data/bright-angel-demo.json`, generated from ignored raw crops by `scripts/build_demo_data.py`. The checked-in file is a small display derivative; original GeoTIFFs, item metadata and full-resolution sources remain under ignored `data/raw/` or their cited NASA/USGS source URLs.

## Shape and coordinate convention

- Grid dimensions are `width` × `height`; arrays are row-major (`index = row * width + col`).
- `transform` uses the first six GDAL affine terms `[a,b,c,d,e,f]`: `x=a*col+b*row+c`, `y=d*col+e*row+f`.
- Coordinates are in the product CRS, Mars 2015 sphere / ocentric / equirectangular (IAU:49910), metres. `x` increases east and `y` increases north; raster rows increase south because `e` is negative.
- This is a local display grid, not an operational navigation frame. The B marker is converted from the PDS sample-report coordinate to the nearest valid grid cell; its source does not state accuracy or coordinate datum. S and A use manually selected valid cells and are illustrative.

## Arrays

- `elevation_m_rounded`: integers rounded to the nearest metre for the display asset; null mask is represented by `valid_mask=0`. Source heights are metres relative to the areoid; the approximate 3–5 m typical vertical precision means the integer encoding is a compact display choice, not added precision.
- `ortho_gray8_display_only`: 0–255 linear stretch of the actual one-band ortho values between the valid source minimum and maximum. The source product metadata in this sample does not identify band units; never label these bytes reflectance or calibrated radiance.
- `intersection_error_cm`: scalar ASP camera-ray separation encoded as centimetres for compact rendering (selected product values are 0.0229–8.5508 m). This is a relative stereo diagnostic, not DTM accuracy or uncertainty.
- `valid_mask`: 1 when all three source assets have a value, 0 for NoData. The source rasters had the same mask: 921/25,725 cells (3.58%). Rendering must omit triangles with any invalid vertex; do not substitute zero elevation.

## Provenance and assumptions

`product` includes collection, exact item ID, CTX input IDs, license, source COG URLs and credit. `sample_site` contains the PDS sample dossier's latitude north, longitude east, elevation and source/accuracy note; the reported coordinates are converted with the product's Mars ocentric CRS and placed at the nearest cell center. The PDS report does not identify a coordinate datum or horizontal uncertainty. Its elevation and the target-cell DTM value differ by about 29.8 m and are not asserted to be vertically co-registered precisely. `scenario_markers.start` and `.A` remain explicitly illustrative. Route waypoints and contact interpretations are scenario values. Route distance and elevation values derive from the raster at grid scale; no mobility or contamination model is implied.

Never:

- merge route or target markers into the observed raster arrays;
- fill or smooth NoData cells for display without explicitly disclosing it;
- treat the displayed intersection error as a contamination probability or terrain uncertainty;
- export the source ortho display stretch as a scientific measurement;
- report terrain route metrics at finer precision than the grid/product supports.

## Activity-history scenario contract

`public/scenario.js` supplies the event-history model with a fresh, deterministic scenario for the selected plan. Its B place uses the documented sample-report coordinate snapped to a valid raster cell; its A and start places remain illustrative raster `row`/`col` positions. B is a mapped sample-site reference, not a claim that the CTX image resolves the drill hole.

- `places`: stable ID, label, `row`, `col`, and scenario/evidence kind.
- `sources`: stable ID, label and kind. Current distinct kinds include possible human-associated material, possible material originating at A, and B's own sample origin.
- `objects`: stable ID, label, type, `startHistory`, and optional explanatory note. Each start-history item must identify a declared source and a written assumption. An empty array is only an empty scenario input; it is not a sterility statement.
- `events`: stable event ID; unique contiguous integer `order` starting at 1; `placeId`; type/action; listed participants; and `contacts`.
- Each contact has declared `from`/`to` node IDs, explicit `direction` (`forward` or `bidirectional`), and a non-empty assumption. Both directions are represented either by a bidirectional contact or by two separately stated forward links.
- Event types are `contact`, `seal`, `reopen`, and `document-control`. A seal freezes that sample's current history. A later contact to it requires a preceding explicit reopen. A document-control event records evidence and removes no path.

The event engine returns each object's current possible source histories plus the ordered edge trace (event ID, place, assumption). Histories are qualitative directed reachability. They contain no transfer quantity, probability, risk score, or physical observation.

### Complete minimal example

This small valid scenario shows one assumed source-to-sample chain. The live app scenario adds target A/B, the three tools/handling plans, a second sample and a documentation-only control event.

```json
{
  "id": "minimal-example",
  "sampleId": "sample-B",
  "places": {
    "prep": { "label": "Illustrative preparation point", "row": 1, "col": 1 },
    "B": { "label": "Illustrative target B", "row": 2, "col": 3 }
  },
  "sources": {
    "human": { "label": "Possible human-associated material", "kind": "human_associated_scenario_source" }
  },
  "objects": {
    "glove-1": { "label": "Glove G1", "kind": "glove", "startHistory": [] },
    "tool-1": { "label": "Tool T1", "kind": "tool", "startHistory": [] },
    "sample-B": { "label": "Sample B", "kind": "sample", "startHistory": [] }
  },
  "events": [
    {
      "id": "e1-source-on-glove", "order": 1, "placeId": "prep", "type": "contact",
      "action": "Include possible source on G1", "participants": ["human", "glove-1"],
      "contacts": [{ "from": "human", "to": "glove-1", "direction": "forward", "assumption": "Scenario input: a possible source is present on the glove." }]
    },
    {
      "id": "e2-glove-to-tool", "order": 2, "placeId": "B", "type": "contact",
      "action": "G1 contacts T1", "participants": ["glove-1", "tool-1"],
      "contacts": [{ "from": "glove-1", "to": "tool-1", "direction": "forward", "assumption": "Assume the contact could carry possible material to T1." }]
    },
    {
      "id": "e3-tool-to-sample", "order": 3, "placeId": "B", "type": "contact",
      "action": "T1 contacts sample B", "participants": ["tool-1", "sample-B"],
      "contacts": [{ "from": "tool-1", "to": "sample-B", "direction": "forward", "assumption": "Assume the sampling interface contacts sample B." }]
    },
    {
      "id": "e4-seal-b", "order": 4, "placeId": "B", "type": "seal",
      "action": "Seal sample B", "participants": ["sample-B"], "contacts": []
    }
  ]
}
```

The engine rejects unknown place/object/source IDs, missing or duplicate event IDs, non-contiguous/ambiguous order, undeclared contact direction, missing contact assumptions, contacts with a sealed sample, and invalid seal/reopen use. To reproduce tests: `node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs`.
