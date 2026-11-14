# Clean Approach

**Clean Approach** is a local Marswalk scenario for inspecting contact provenance around a hypothetical Jezero sedimentary sample. Its event history answers which possible source labels can be traced to sample B through explicitly assumed glove/tool contacts, and which event created each link. It does not model actual material transfer, probability, contamination amount, viability, risk, or astronaut safety.

## Run the demo

From the repository root:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>. The local terrain data work offline; the separate NASA sample reference links need internet access.

The map uses an actual MRO/CTX DTM and its co-gridded orthoimage. Activity start, target A and target B are explicitly illustrative positions on that crop. They are not rover locations or named sample sites. Perseverance's Bright Angel / Cheyava Falls / Sapphire Canyon record informs the science context, but the sample site has not been georeferenced onto this lander-area raster.

Choose among three event plans:

- **A · Same tool:** T1 is used at A and B.
- **B · Separate tool:** T2 is used at B, while G1 contacts remain.
- **C · Omit one contact:** T2 is used at B and the assumed G1 → T2 contact is omitted.

All plans use the same S → A → B map route. The solid map line represents walking geometry; contact histories appear in the event and sample panels, not as airborne/particle paths. Use **Previous / Next** or select an event to inspect source history as it develops. Select B to focus its history. The optional terrain route profile is secondary context and shows missing elevation as gaps.

## Terrain and model limits

The DTM and orthoimage share a 148×148 grid at 20.162955 m/pixel. Terrain uses metres for east, north and up before camera projection, a computed local height origin, and 1× vertical scale by default. The optional 3× control is explicitly labelled exaggeration. NoData cells are not filled; terrain quads crossing NoData and profile segments across missing samples are omitted.

MRO is the only mission with a mapped raster in this scene. Mars 2020/Perseverance contributes a documented sample-science record, not a registered map layer. MEDA Sol 36 wind remains a separate historical background test and does not enter these contact histories.

## Tests

```bash
node --check public/app.js
node --check public/contact-model.js
node --check public/scenario.js
node --check public/terrain-geometry.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
```

The checks verify software logic, references, order, source paths, sealed-history rules, metre-scale geometry, raster metadata use and NoData gaps. They do not validate physical contamination or terrain accuracy. Browser screenshots from the current plan comparisons are in [`output/playwright/`](output/playwright/).

## Project notes

- [Current status and handoff](docs/STATUS.md)
- [Event-history model](docs/model.md)
- [Data sources, product status and geographic coverage](docs/data-sources.md)
- [Data and scenario contract, including a complete example](docs/data-contract.md)
- [Science basis](docs/science.md)
- [Decisions](docs/decisions.md)
- [Visual direction checkpoint](docs/design.md)
- [Challenge and submission](docs/challenge.md) · [demo script](docs/demo-script.md)

## AI assistance

AI tools helped inspect source documentation, implement the static prototype, and draft notes. The contact assumptions, location labels, model boundaries and scientific conclusions remain team decisions for review. No AI-generated contamination or terrain measurement is presented as observed data.
