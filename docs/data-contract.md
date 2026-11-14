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

## Module and event contract

The front end is a no-build set of classic scripts split by owner, so two people can work on separate branches without editing the same file. The modules share one namespace and three events; nothing else crosses the boundary.

| File | Owns | Mount points and styles |
|---|---|---|
| `public/map.js` | Terrain canvas, display layers, camera, route and place markers, route profile, planning zones drawn on the map | `#layer-panel`, `#context-cards`, everything inside `.terrain-card`; `public/map.css` |
| `public/panel.js` | Mission / Plan / Sample history steps, plan selection, event timeline, sample-B paths, walkthrough, mission checklist | `#mission-panel`, everything inside `.step-column`; `public/panel.css` |
| `public/app.js` | Loads `bright-angel-demo.json`, fills shared source/credit text, starts both modules | none |
| `scenario.js`, `contact-model.js` | Scenario and replay model (panel side) | none |
| `terrain-geometry.js` | Metre-scale terrain geometry and profile (map side) | none |

Scripts load in this order: model files, `map.js`, `panel.js`, `app.js`. `app.js` calls `map.init` before `panel.init`, so the map's listeners exist before the panel publishes the first scenario.

### Shared namespace `window.CleanApproach`

| Property | Written by | Meaning |
|---|---|---|
| `data` | `app.js` | The loaded display derivative. Read-only for every module. |
| `datumM` | `app.js` | Local elevation datum in metres (median valid elevation), a rendering origin only. |
| `scenario` | `panel.js` only | The current scenario from `CleanApproachScenario.build`. Replaced on every plan change; do not mutate it from the map. |
| `map`, `panel` | each module | `{ init(context) }`. Do not call another module's internals. |

### Events (dispatched as `CustomEvent` on `window`)

| Event | Sent by | `detail` | Receiver behaviour |
|---|---|---|---|
| `scenario:change` | panel | `{ planId }` | `CleanApproach.scenario` is already updated. The map recomputes route length and profile and redraws. |
| `mission:step` | panel | `{ stepId, placeId }` | Fired whenever the active event or step changes. `stepId` is the scenario event ID (`null` when only a place is focused); `placeId` is a key of `scenario.places`. The map highlights that place and may move an astronaut marker to it. |
| `map:place` | map | `{ placeId }` | A place marker or map-side place button was chosen. The panel stops the walkthrough and focuses that place, which answers with `mission:step`. |

### Scenario fields the map reads

- `places[id]`: `{ label, row, col, kind }`, as in the activity-history contract above. Place IDs are free; `prep`, `A` and `B` exist today.
- `route` (optional): ordered array of place IDs the map draws as the walking route. Absent uses place insertion order (currently prep, A, B). Add places such as a zone boundary by listing them here.
- `zones` (optional): array of `{ id, kind, centerPlaceId, radius_m, label, evidence }`. `kind: "work-zone"` with `evidence: "scenario"` is a planning rule chosen by the team, never an observation. A zone changes what the panel warns about; it removes no contact path.

### Layer and zone rules

- Every map layer is one of **Observed** (read from a source raster or product), **Derived** (computed from observed arrays, for example slope from the DTM, with method and resolution limits stated and kept apart from the observed arrays) or **Scenario** (a planning rule or illustrative marker).
- A hazard or planning zone must come from data in `public/data/` or be an explicit Scenario rule. A threshold the user can change is a planning threshold, not a validated suit or mobility limit. Never label a zone safe, unsafe or risky, and never attach a score.
- NoData stays visible as unknown terrain; it is never filled or smoothed.
- No wind, radiation, thermal or other environmental layer or card is part of the app until a documented dataset for Bright Angel (or an explicitly labelled context source) is checked in with its source, location, time and limits recorded in [data-sources.md](data-sources.md).

## Interactive terrain layers (2026-11-14)

`map.js` dynamically loads `layers.js` during `map.init`, keeping the HTML and panel-owned files unchanged. The layer module creates independent checkboxes and legends inside `#layer-panel`, moved into Terrain analysis. It returns map-local display state only; it neither writes `CleanApproach.scenario` nor changes the contact graph. Observed raster layers blend in fixed order ortho → elevation → ray separation (65% opacity for colour overlays); slope follows. All may be disabled. The raster, camera metre conversions and explicit vertical exaggeration remain unchanged. Colour endpoints use valid display-array extrema; ray separation centimetres are converted to metres for the legend. Raster dimensions and spacing come from metadata. Invalid dimensions, spacing or array lengths throw a descriptive terrain error.

`TerrainGeometry.slopes(raster, arrays)` returns a separate row-major array of degrees or `null`. Central differences use east `(z[r,c+1]-z[r,c-1])/(2*dx)` and north `(z[r-1,c]-z[r+1,c])/(2*dy)` in metres; slope is `atan(hypot(east,north))*180/pi`. The centre and all four neighbours must have valid finite elevations. Raster borders and missing neighbours return null; no interpolation or one-sided substitute is used. Integer-metre elevations imply approximately 1.4° quantization near zero for a one-metre difference over two 20 m cells, not a constant angular resolution. CTX posting smooths out local scarps; slope does not measure all astronaut obstacles.

`routeCells(points, raster)` intersects every polyline segment with closed, centre-based raster squares `[col-.5,col+.5] × [row-.5,row+.5]`. Corner and boundary touches count conservatively. An index set deduplicates cells across all segments, including retracing. Work is clipped to the raster extent; an `outside` flag reports endpoints outside the footprint (the footprint is convex). `routeTerrain` returns these indices plus counts `steep` (strictly greater than threshold), `noData`, and `unknownSlope` (includes borders/neighbours without computable slope). Outside portions have no inferred terrain. NoData-free does not mean slope is known everywhere or terrain is safe. The threshold is a user-selected planning rule, never a validated suit limit.

NoData hatching is drawn at the local reference datum solely as a schematic footprint overlay, explicitly labelled as having no measured height. It is never inserted into the terrain mesh, elevation arrays, slope or profile. Red steep-cell footprints use their cell elevation and are display markers, not interpolated terrain. Unknown terrain remains distinct from known slope. The astronaut symbol marks the focused scenario place in response to the existing `{stepId,placeId}` event; place controls emit the unchanged `{placeId}` contract.

All scenario places receive keyboard-accessible map buttons; valid raster positions also receive canvas markers. Off-raster places keep their buttons but have no in-raster canvas position. In-raster NoData places use an explicitly labelled schematic reference-plane marker, without assigning an observed elevation. Optional circular `scenario.zones` now render the existing `{id,kind,centerPlaceId,radius_m,label,evidence}` structure: radius is horizontal metres, centred at the named place, shown at the centre's elevation as a schematic planning footprint. Scenario evidence uses dashed outlines and “planlagt arbeidssone · scenario”. Missing/invalid centres or nonpositive radii are omitted. No default zones are invented. Absent `route` now uses scenario place insertion order, removing fixed place IDs; current prep/A/B insertion order preserves existing behaviour.

`public/data/meda-sol-0036-context.json` contains `schema_version`, source URL/input, location/time label, method/units/limits, `input_count`, `excluded_count`, `calm_count`, 24 `hours` records (`hour`, `count`, `mean_speed_m_s` or null), and eight `wind_rose_counts` centred on N/NE/E/SE/S/SW/W/NW. This historical point context is rendered only in `#context-cards`, never as map arrows or a wind field. The RAD context is sourced text, not a map layer. Rebuild MEDA context with `node scripts/build_meda_context.cjs`.

The map-side UI and MEDA context presentation strings are English. `layers.js` owns `.map-colour-legend`, inserted immediately after `.scene-wrap`, independently of the collapsed controls. It lists enabled layers only, with matching swatches, display ranges and the current slope threshold; it refreshes on checkbox and slider changes. Layer blending is stated explicitly. This is presentation state and adds no scenario, contact-model or raster fields.

Camera rendering caches composited surface colours by enabled-layer combination. Pointer/wheel draws are scheduled once per animation frame. The temporary interaction preview samples every second vertex, but omits any coarse patch containing a missing vertex anywhere in its covered grid. A visible English preview note identifies the reduced detail. Pointer release/cancel/lost capture restores full detail; wheel interaction restores it after 150 ms idle. No scientific arrays or route/slope calculations depend on this preview. Unknown/threshold overlays remain at full cell resolution.

NoData display correction: mask hatching is now rendered only in `.map-data-coverage`, a north-up 2D raster-coverage inset below the map, controlled by the Unknown terrain checkbox. This supersedes the earlier reference-plane hatching description. Grey denotes valid mask cells; pale hatching denotes NoData. The inset uses row/column positions only and assigns no heights. The 3D terrain retains empty gaps rather than floating hatched patches. Existing route counts and mask/height arrays are unchanged.

The standalone .map-data-coverage inset and its layer toggle were subsequently removed at the user's request. This supersedes the preceding inset-display description: NoData now remains visible as empty mesh gaps, explained in the map legend; route NoData and outside-raster warnings are retained. No source or derived numerical arrays changed.
