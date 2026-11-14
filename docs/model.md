# Clean Approach event-history model

## Purpose and boundary

The model records possible contact provenance for a hypothetical earlier sample site A and a sample at Perseverance's documented Sapphire Canyon site B. It answers: **under the listed scenario assumptions, which named source nodes have a directed contact path to sample B, and which events created each link?** It does not simulate material movement or determine whether a contact actually transfers anything.

The B marker is derived from the latitude/longitude in the PDS sample dossier for `M2020-1215-28 Sapphire Canyon`, then placed on the nearest valid cell of a CTX crop that covers the coordinate. The report gives no horizontal accuracy or coordinate datum, so this is a nominal map tie; the marker is not drill-hole precision. The CTX target-cell elevation also differs from the dossier's listed elevation by about 29.8 m; we do not treat the elevations as a precise vertical match. A and the traverse start remain illustrative. MRO/CTX supplies terrain; Mars 2020/Perseverance supplies an actual sample/science target coordinate and context.

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
| **A · Same tool** | T1 used at A and B; G1 also contacts T1 at both activities. | Possible human-associated material; possible material associated with hypothetical sample A; B's own sample origin. A's material reaches B along A surface → T1 → B. |
| **B · Separate tool** | T2 used at B, and the explicit G1 → T2 contact remains. | The same three groups. Possible human-associated and A-origin material reach T2 through G1. A separate tool by itself leaves the modeled glove connections. |
| **C · Omit one contact** | T2 used at B; only the G1 → T2 contact is omitted. | B's own sample origin remains. The human-associated and A-origin paths to B are absent in this graph. The result follows from the omitted edge, not from a general isolation state. |

These are logical reachability results from the event records. They are not a ranking, protocol recommendation, or evidence that any physical material moved. B's own material is shown separately in the UI from external scenario source groups.

## Mission checklist scenario

`CleanApproachScenario.buildMission(mapData, choices, assumptions)` builds a second kind of scenario for the "build your own sampling sequence" mode. It sits beside `build()`, which it does not change: the three example plans, their event IDs and their results are as before. The engine is the same `replay()`.

**One rule governs the whole mode: nothing protects a sample.** A source loses its path to B only when the chosen sequence contains no edge for it. Tongs, a glove change, a seal check, a witness tube, a bag and a log never remove an edge. The glove holds the tool and the tube, so those contacts are always stated.

### Records

- **Sources** (always all four, so the result list is stable): `human`, `fromA`, `fromB`, and `equipment` — possible material from the equipment itself, such as seals, coatings, lubricants or bag residue.
- **Objects**: outer gloves `glove` (G1) and `glove-2` (G2, not used at A); tools `tool-1`, `tool-2` and `tongs`; `tube-B`; `bag-used`; `witness-B`; the two surfaces and the two samples. Labels describe use ("not used at A", "sealed, unopened bag") and never a state such as clean or sterile.
- **Places**: `prep`, `A`, `B` as in the example plans, plus `zone-B`, the work-zone boundary. It is the first valid raster cell outside the zone radius when walking from B back toward A along the same rasterised line the route profile samples. With the Bright Angel derivative it is cell `(row 68, col 71)`, 58 m from B, and the drawn route length changes by less than a metre.
- **`route`**: `["prep", "A", "zone-B", "B"]`.
- **`zones`**: one work zone around B, radius 50 m. The radius is a planning rule chosen by the team, not an observation, and B itself is only a nominal placement. Each zone lists the places inside it (`placeIds`, here only `B`), so the engine needs no geometry.
- **`rules`**: one keep-out rule, "outer glove G1 and Tool T1, both used at A, stay out of the sample B work zone".

Events have IDs starting with `m-`. Two optional event fields are new: `integrity` (`"checked"` or `"unchecked"`, seal events only) and `tag` (a short label on any event, used on `document-control` records such as `photo`, `stow`, `glove-off`, `witness-open`, `log`). No new event type exists.

### Choices (what the astronaut does)

| Choice | Values (default first) | Effect on events |
|---|---|---|
| `gloveSwap` | `true`, `false` | `true`: G1 is recorded as bagged at the boundary and G2 is the active glove at B. `false`: G1 stays the active glove. |
| `sampler` | `tongs`, `tool-2`, `tool-1`, `hand` | A tool adds surface B → tool, active glove → tool, tool → sample B. `hand` adds surface B → active glove and active glove → sample B. Every option also adds active glove → tube B and tube B → sample B. |
| `sealSurfaceChecked` | `true`, `false` | Sets the seal event's `integrity`. No edge changes. |
| `witnessOpened` | `true`, `false` | Adds or omits one `document-control` record. No edge changes. |

### Assumptions (what the team supposes about objects)

| Assumption | Default | Effect |
|---|---|---|
| `g2CarriesHuman` | on | Putting on G2 adds human → G2. On by default because no data shows that an outer glove put on during an EVA is free of human-associated material. Off is a labelled what-if. |
| `swapContact` | off | Adds G1 → G2 at the glove change. Without it, a glove change removes the A path completely, which is a stronger result than any evidence supports, so the contact is offered as a switch. |
| `equipmentSource` | off | Declares the `equipment` source in the starting history of T1, T2, the tongs and tube B. |

### Recorded status and warnings

`replay()` returns three more fields. None of them adds or removes an edge, and each respects the replay prefix.

- `seals`: per sealed sample, the seal event and its `integrity` (`null` when the scenario records none). A reopen removes the entry.
- `records`: every `document-control` event with its `tag`, place and participants. A `witness-open` record means the equipment and surroundings can be characterized later; the contact paths stay.
- `ruleWarnings`: one entry per rule object taking part in a `contact` event at a place inside the rule's zone. A warning is advice about the plan. The path it points at remains in the history.

### Selected results

| Sequence and assumptions | Sources with a path to sample B | Warning |
|---|---|---|
| Defaults: glove change, tongs, G2 carries human | human (G2 → tongs → B), B's own | none |
| Same, `g2CarriesHuman` off | B's own only | none |
| Same, `g2CarriesHuman` off, `swapContact` on | human, A, B's own (through G1 → G2) | none |
| Keep G1 on, tongs | human, A, B's own | G1 in the work zone |
| Glove change, Tool T1 at B | human, A, B's own | T1 in the work zone |
| Any sequence with `equipmentSource` on | adds equipment (through the sampler or tube B) | unchanged |

These follow from the listed edges. They do not rank sequences, and the default result shows that following the whole checklist still leaves a human-associated path under the default assumption.

### Checklist steps and precedents

`public/mission.js` groups the events into eight steps for reading: check the sealed kit (start), document and collect sample A, bag the used tool, change the outer glove (zone boundary), open the witness tube, collect sample B, seal tube B, log the IDs. Every scenario event belongs to exactly one step, so a source path can be traced to the steps that created it. Seven steps name a documented practice from [docs/science.md](science.md#sampling-precedents) with a link; bagging the tool is marked as a scenario step with no precedent. The panel states that precedents are inspiration and not validated for Mars EVA.

### Not modeled

Leakage and venting from the suit, dust raised by walking, wind and lander exhaust are listed in the panel as not modeled, with the reason. They create no source, event or edge. Crewed-Mars planning expects suits to leak, but no data says what would reach a sample, and airborne transport stays excluded as explained in [docs/science.md](science.md).

## Map and terrain calculation

The activity route is geographic context; it does not create contact links. It is drawn as a solid line, while provenance appears only in the event/history panels. There are no particle trajectories, airborne paths, contamination fields, or contact lines drawn over the terrain.

`public/terrain-geometry.js` converts row/column spacing and elevation to metres before camera projection:

- east: `(col - (width - 1)/2) × spacing_x`,
- north: `((height - 1)/2 - row) × spacing_y`,
- up: `(elevation - datum) × verticalScale`, where `datum` is the median valid elevation and `verticalScale` is the explicit height-scale control.

Camera zoom is applied after those coordinates are formed. At 1×, horizontal and vertical world units are metres at equal scale. The camera's yaw/pitch can foreshorten screen distances; this is perspective, not a different data unit. NoData cells stay absent: terrain quads touching a missing corner are skipped, and profile samples with missing elevation break the line rather than joining around the gap. Raster dimensions and width come from the JSON metadata.

The 175×147 display derivative has 20.399228 m spacing, DTM heights −2376.467 to −1841.575 m relative to the areoid, and 921 NoData cells (3.58%). The PDS sample coordinate maps to cell `(row 66, col 73)`; its transformed coordinate is 6.67 m from the cell centre and the cell is valid. The local median is a rendering origin only; it does not change stored heights or the stated areoid reference. Optional 3× exaggeration multiplies only the vertical coordinate and is labelled.

## Verification and limits

Run:

```bash
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs tests/mission-model.test.cjs tests/mission-steps.test.cjs
```

The mission tests cover: unchanged example plans; default choices and assumptions; the glove change with each glove assumption; the equipment source on and off for every sampler; the edges of each sampler choice, including that tongs keep the glove contact; seal and witness status leaving the edge set identical; keep-out warnings that leave edges and histories identical with the rule removed; the zone-boundary cell being valid, on the A–B line and outside the radius; deterministic replay over all choice combinations; the step-to-event mapping; and that no label or checklist text claims a clean, sterile or safe state.

The earlier tests cover A-origin reachability through shared T1; the remaining glove path with separate T2; the effect of omitting only G1 → T2; control events; frozen sealed history and explicit reopening; deterministic fresh replay; invalid references/order; equal synthetic metre steps east/north/up before projection; explicit vertical exaggeration; metadata-driven raster width; local datum selection; and NoData gaps. These checks verify implementation logic and units, not physical contact transfer, terrain accuracy, astronaut operations, or sample safety.

## Scientific limits

- The possible human-associated source, the possible material at hypothetical A and all future crew contacts are illustrative scenario inputs, not observations on Mars.
- A graph path means possible connectivity under the stated assumptions; it is not a measured transfer, contamination rate, probability, risk score, viable organism, or biological-establishment claim.
- The sample-report coordinate for Sapphire Canyon is located in the CTX raster, but the report's coordinate accuracy/datum is unspecified and target-cell elevation does not match the report elevation. The ~20.4 m posting cannot resolve the drill hole or establish exact sub-cell alignment.
- The route is straight-line map geometry at CTX posting. It does not indicate traversability, mobility, risk, or mitigation efficacy.
- The profile uses rounded display elevations and retains NoData gaps; it is secondary context, not a precision navigation product.

For the product provenance, footprint, mission distinction and source URLs see [docs/data-sources.md](data-sources.md). For the machine-readable contract and complete compact example see [docs/data-contract.md](data-contract.md).
