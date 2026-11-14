# Feasibility: Clean Approach

## Question and data boundary

The prototype explores provenance for a hypothetical Jezero sedimentary sample intended for later organic-molecule / potential-biosignature analysis. Perseverance's Bright Angel / Cheyava Falls / Sapphire Canyon record motivates the science question; its sample location is not co-registered to the current CTX crop. The route's start and A/B activity positions are illustrative, not observed rover positions or identified targets. The exact crop extent and mission-data status are in [docs/data-sources.md](data-sources.md).

Only MRO/CTX contributes mapped raster data. Mars 2020/Perseverance contributes sample/science context and a separately documented robotic sampling-control precedent. The prototype does not yet deliver a co-located multi-mission map.

## Mechanism decision

Direct contact is the bounded mechanism: a possible human-associated source may reach a sample through assumed glove/tool/surface contacts. Earth suit and analog evidence, plus rover sample-chain controls, motivate the question but provide no human Mars EVA glove-to-sample transfer measurement. The implementation is a deterministic qualitative event graph, not a physical contamination model.

It compares three plans over the same S→A→B route. A uses T1 at both places; B uses separate T2 at B but retains G1→T2; C uses T2 and omits that one assumed contact. Under the current event assumptions, A and B keep human-associated and A-origin paths to sample B; C removes those paths, with B's own material origin still recorded. This does not rank operational plans or validate the omitted contact as a control. The result is fully determined by the event links.

Airborne release and deposition remain excluded. MEDA Sol 36 is a real historical wind point series near the landing site, but it is not a local wind field at Bright Angel and supplies no human-source release or sample-deposition measurement. It remains a background figure only; no wind enters the event model. See [the wind feasibility evidence](data-sources.md#meda-wind-feasibility-sample).

## Implementation and calculations

See [docs/model.md](model.md) for the event schema, reachability, plan outcomes, unit-consistent terrain coordinates, NoData behavior and limitations. Each event updates per-object possible source histories and carries an explanation trace. Plans rebuild and replay independently. A sealed sample freezes its history until explicit reopening; a control event adds documentation without deleting any path.

The route and elevation profile are secondary geographic context; they do not change contact graph results. Route length is identical in all plans. The app shows the walking route as a solid line and contact provenance in the event/history panel, never as an airborne or particle path.

## Verification and limits

`node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs` verifies the implemented logical paths, seal/reopen and control behavior, invalid references/order, deterministic replay, synthetic equal metre scale, metadata-driven raster width and NoData gaps. The Playwright browser inspection is recorded in [docs/STATUS.md](STATUS.md), with screenshots under `output/playwright/`.

These tests are implementation checks, not physical validation. Still unmeasured are actual Mars-EVA source loading, glove/tool contact, interface transfer, airborne release/deposition, relevant material effects, and any contamination-reduction or safety benefit.
