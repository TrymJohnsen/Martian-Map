# Clean Approach

Clean Approach is a prototype of an astronaut sample-planning tool for Bright Angel on Mars. It combines observed terrain and documented sample context with an illustrative activity plan, and shows how gloves and tools could connect earlier activities to a sample's contact history.

Sapphire Canyon is scientifically relevant because researchers reported organic compounds and mineral associations; this does not establish life. Sample target B is a nominal placement based on the PDS sample report, not a verified drill point. Work site A, the route and astronaut activity are hypothetical, not a real NASA operation.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>.

## Explore the three steps

1. **Mission** introduces Bright Angel, documented target area B, hypothetical site A, and the science context.
2. **Plan** compares reusing Tool T1 at A and B with using T1 at A and separate Tool T2 at B. Both scenarios model Glove G1. Choose **Trace sample history** to continue.
3. **Sample history** shows the paths calculated by the existing ordered-event model. If its scenario contains Glove G1 → Tool T2 → Sample B, the app explains **Different tool. Shared glove history.** Switch plans here to compare the computed result. **What if this contact is avoided?** is a counterfactual that omits only modeled G1 → T2 at B, not a validated procedure.

The solid map line is only the walking route. Contact paths appear in the history. These are possible paths under scenario assumptions, not measured material transfer or contamination, probability, risk, safety guidance or a crewed EVA procedure. Use **Data & assumptions** for sources and location limits; **Terrain analysis** contains optional layers and route diagnostics.

## Screenshots

- [Mission · 1440×900](output/playwright/clean-approach-step-1-mission-1440x900.png)
- [Plan · 1440×900](output/playwright/clean-approach-step-2-plan-1440x900.png)
- [Sample history · 1440×900](output/playwright/clean-approach-step-3-history-1440x900.png)

## Data limits

- MRO/CTX Bright Angel crop: 175×147 pixels at about 20.399 m/cell. Orthoimage, DTM and ASP ray-separation diagnostic share a grid; NoData remains blank.
- The PDS report does not state target-coordinate datum or horizontal accuracy. B is a nominal target-area placement, not a verified drill point. The PDS and CTX elevations differ by about 29.8 m; the cause is unresolved.
- Ray separation is a relative stereo diagnostic, not terrain accuracy or uncertainty. There are no contamination rates, transfer probabilities, risk rankings or astronaut procedures in the model.

## Verify

```bash
node --check public/app.js
node --check public/scenario.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
```

The later video idea remains **“LIFE DETECTED. … It’s you.”**, closing with **“Find Mars. Not ourselves.”** It is a fictional narrative frame, not a discovery claim; video production is later work. See [design notes](docs/design.md) and [current status](docs/STATUS.md).
