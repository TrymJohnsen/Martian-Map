# Feasibility: Clean Approach

## Question and data boundary

The prototype places the PDS-reported Sapphire Canyon / Cheyava Falls sample site in a valid cell of a local MRO/CTX crop at Bright Angel. The report gives latitude north and longitude east but no horizontal accuracy or datum; the point is a nominal cell-level map tie. Site A and the traverse start are illustrative. The crop, marker offset, coordinate conversion and product status are documented in [docs/data-sources.md](data-sources.md).

MRO/CTX supplies terrain and the orthorectified surface image. Mars 2020/Perseverance supplies the scientific sample target and its sample-report coordinate, not an additional raster. A is an explicitly hypothetical earlier sample site; its possible source is part of the scenario, with no geological finding assigned to it. The geographic contribution is now meaningful target context plus route placement, although it does not affect contamination calculations.

## Mechanism decision

Direct contact is the bounded mechanism: a possible human-associated source may reach a sample through assumed glove/tool/surface contacts. Earth suit and analog evidence, plus rover sample-chain controls, motivate the question but provide no human Mars EVA glove-to-sample transfer measurement. The implementation is a deterministic qualitative event graph, not a physical contamination model.

It compares three plans over the same S→A→B route. A uses T1 at both places; B uses separate T2 at B but retains G1→T2; C asks “What if this contact could be avoided?” and omits only that assumed link. No cited evidence validates this as an EVA action, so C remains counterfactual. Under the current event assumptions, A and B keep human-associated and A-origin paths to sample B; C removes those paths, with B's own geological origin still recorded. This does not rank operational plans or validate the omitted contact as a control. The result follows from the event links.

Airborne release and deposition remain excluded. MEDA Sol 36 is a real historical wind point series near the landing site, but it is not a local wind field at Bright Angel and supplies no human-source release or sample-deposition measurement. It remains a background figure only; no wind enters the event model. See [the wind feasibility evidence](data-sources.md#meda-wind-feasibility-sample).

## Implementation and calculations

See [docs/model.md](model.md) for the event schema, reachability, plan outcomes, unit-consistent terrain coordinates, NoData behavior and limitations. Each event updates per-object possible source histories and carries an explanation trace. Plans rebuild and replay independently. A sealed sample freezes its history until explicit reopening; a control event adds documentation without deleting any path.

The route and elevation profile are secondary geographic context; they do not change contact graph results. Route length is identical in all plans. The app shows the walking route as a solid line and contact provenance in the event/history panel, never as an airborne or particle path.

## Verification and limits

`node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs` verifies the implemented logical paths, seal/reopen and control behavior, invalid references/order, deterministic replay, synthetic equal metre scale, metadata-driven raster width and NoData gaps. The Playwright browser inspection is recorded in [docs/STATUS.md](STATUS.md), with screenshots under `output/playwright/`.

These tests are implementation checks, not physical validation. Still unmeasured are actual Mars-EVA source loading, glove/tool contact, interface transfer, airborne release/deposition, relevant material effects, and any contamination-reduction or safety benefit.
