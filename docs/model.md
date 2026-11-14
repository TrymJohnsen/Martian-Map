# Clean Approach event-history model

## Purpose and boundary

The model records possible contact provenance for two illustrative work sites on the current Jezero MRO/CTX crop. It answers: **under the listed scenario assumptions, which named source nodes have a directed contact path to sample B, and which events created each link?** It does not simulate material movement or determine whether a contact actually transfers anything.

The map markers A and B are scenario positions selected on the available raster. Neither is a rover position, a named Perseverance sample, nor a verified geological target. Perseverance's Bright Angel / Cheyava Falls / Sapphire Canyon record motivates the organic-analysis context, but its sample site has not been georeferenced onto this CTX crop. MRO/CTX is the only mapped mission dataset; Mars 2020 contributes sample/science context only.

## Implemented records

`public/scenario.js` builds a fresh plan object. It contains:

- `places`: stable IDs, labels, grid row/column, and a scenario-location kind.
- `sources`: stable IDs and distinct source kinds, including possible human-associated material, possible material originating at A, and B's own sample origin.
- `objects`: stable IDs for glove G1, tools T1/T2, target surfaces, samples, and a witness-control record. Each object declares `startHistory`; an empty list means no source is assigned by this scenario, not that the item is sterile.
- `events`: stable IDs, unique contiguous integer `order`, place ID, type/action, participants, and directed contact assumptions. The app does not invent clock times.

`public/contact-model.js` validates references and sequence order, then replays events in order. A contact record is `from`, `to`, an explicit `direction` (`forward` or `bidirectional`), and a non-empty assumption. A bidirectional record adds both directed edges. The current plan data uses forward edges explicitly, including reciprocal edges when a contact is allowed to carry possible material either way.

At each step the engine traces source-to-object paths through event-created edges and snapshots the resulting histories. Every path edge retains its event ID, place, order and assumption. The timeline selects a replay prefix, so choosing an earlier event shows only history available by then. Choosing a new plan builds a new scenario and replay from its inputs; no state is carried over from the previous plan.

### Sealing and controls

A `seal` event stores the sample's then-current source paths. Later events cannot contact a sealed sample unless an explicit `reopen` event occurs first. A later change elsewhere cannot retroactively alter the frozen sample history. A `document-control` event adds a timeline record but no contact edge; it cannot erase a path. There is no global isolation toggle.

## Three same-route plans

Every plan visits the same mapped places in the same order, start → A → B, with the same drawn route length. Human activities and all material contacts remain scenario inputs.

| Plan | Event difference at B | Calculated source groups in B's history |
|---|---|---|
| **A · Same tool** | T1 used at A and B; G1 also contacts T1 at both activities. | Possible human-associated material; possible material originating at A; B's own sample origin. A's material reaches B along A surface → T1 → B. |
| **B · Separate tool** | T2 used at B, and the explicit G1 → T2 contact remains. | The same three groups. Possible human-associated and A-origin material reach T2 through G1. A separate tool by itself leaves the modeled glove connections. |
| **C · Omit one contact** | T2 used at B; only the G1 → T2 contact is omitted. | B's own sample origin remains. The human-associated and A-origin paths to B are absent in this graph. The result follows from the omitted edge, not from a general isolation state. |

These are logical reachability results from the event records. They are not a ranking, protocol recommendation, or evidence that any physical material moved. B's own material is shown separately in the UI from external scenario source groups.

## Map and terrain calculation

The activity route is geographic context; it does not create contact links. It is drawn as a solid line, while provenance appears only in the event/history panels. There are no particle trajectories, airborne paths, contamination fields, or contact lines drawn over the terrain.

`public/terrain-geometry.js` converts row/column spacing and elevation to metres before camera projection:

- east: `(col - (width - 1)/2) × spacing_x`,
- north: `((height - 1)/2 - row) × spacing_y`,
- up: `(elevation - datum) × verticalScale`, where `datum` is the median valid elevation and `verticalScale` is the explicit height-scale control.

Camera zoom is applied after those coordinates are formed. At 1×, horizontal and vertical world units are metres at equal scale. The camera's yaw/pitch can foreshorten screen distances; this is perspective, not a different data unit. NoData cells stay absent: terrain quads touching a missing corner are skipped, and profile samples with missing elevation break the line rather than joining around the gap. Raster dimensions and width come from the JSON metadata.

The 148×148 display derivative has 20.162955 m spacing, DTM heights −2615.689 to −2515.562 m relative to the areoid, and 295 NoData cells (1.35%). The local median is a rendering origin only; it does not change stored heights or the stated areoid reference. Optional 3× exaggeration multiplies only the vertical coordinate and is labelled.

## Verification and limits

Run:

```bash
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
```

The tests cover A-origin reachability through shared T1; the remaining glove path with separate T2; the effect of omitting only G1 → T2; control events; frozen sealed history and explicit reopening; deterministic fresh replay; invalid references/order; equal synthetic metre steps east/north/up before projection; explicit vertical exaggeration; metadata-driven raster width; local datum selection; and NoData gaps. These checks verify implementation logic and units, not physical contact transfer, terrain accuracy, astronaut operations, or sample safety.

## Scientific limits

- The possible human-associated source, target-associated availability and all future crew contacts are illustrative scenario inputs, not observations on Mars.
- A graph path means possible connectivity under the stated assumptions; it is not a measured transfer, contamination rate, probability, risk score, viable organism, or biological-establishment claim.
- The actual Perseverance Sapphire Canyon core is from Bright Angel, outside the verified footprint of the present lander-area crop. It is not the map's B marker.
- The route is straight-line map geometry at CTX posting. It does not indicate traversability, mobility, risk, or mitigation efficacy.
- The profile uses rounded display elevations and retains NoData gaps; it is secondary context, not a precision navigation product.

For the product provenance, footprint, mission distinction and source URLs see [docs/data-sources.md](data-sources.md). For the machine-readable contract and complete compact example see [docs/data-contract.md](data-contract.md).
