# Clean Approach

**Clean Approach** is a local Marswalk demonstration about how earlier activities could become part of a sample's contact history. Sapphire Canyon at Bright Angel is scientifically interesting because researchers reported organic compounds and mineral associations; these findings do not establish life.

The map uses an MRO/CTX surface image and DTM. B is a nominal target-area placement based on the PDS report associated with Sapphire Canyon, sample 25; it is not a verified drill point. A, the route and the astronaut activity are illustrative.

## Run the demo

From the repository root:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>.

## Explore the contact histories

The two main choices replay the same ordered scenario and route:

- **Reuse the tool:** Glove G1 contacts Tool T1 at A and B. The model can connect possible A-surface and human-associated sources to Sample B through T1.
- **Use a separate tool:** Glove G1 contacts T1 at A and T2 at B. The model still includes a possible path through the shared glove: **Different tool. Shared glove history.**

The shorter **What if this contact is avoided?** exploration omits only the modeled G1 → T2 contact at B. It is a counterfactual, not a clean, safe or validated EVA procedure. The guided walkthrough replays these same events and can be stopped, restarted or stepped manually.

Paths show reachability under scenario assumptions, not measured contamination or material transfer. The solid line on the map shows only the walking route. Select A or B on the terrain, or select a source trace, to follow the corresponding event.

## Data and limits

- **MRO/CTX:** a 175×147 Bright Angel crop at 20.399 m/pixel, with a co-gridded orthoimage, DTM and ASP ray-separation diagnostic. NoData remains blank. Ray separation is a relative stereo diagnostic, not elevation accuracy or uncertainty.
- **Mars 2020 / Perseverance:** the PDS report coordinate maps nominally to a valid CTX cell. The report does not state coordinate datum or horizontal accuracy. B is not represented as a precise drill point.
- **Vertical comparison:** the CTX target-cell elevation and PDS report elevation differ by about 29.8 m; the cause is unresolved. The map does not claim precise vertical registration.
- **Scenario:** A, the start, route and contacts are illustrative. There are no rates, probabilities, safety rankings or astronaut procedures in the model.

The optional elevation and ray-separation views are analysis layers. The default vertical scale is 1×; any 3× exaggeration is labelled. See [Data & assumptions](docs/data-sources.md) for sources and [Current status](docs/STATUS.md) for tested behavior.

## Verify

```bash
node --check public/app.js
node --check public/scenario.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
```

Chromium screenshots at 1440×900: [Reuse the tool](output/playwright/clean-approach-reuse-tool-1440x900.png) · [Use a separate tool](output/playwright/clean-approach-separate-tool-1440x900.png).

## 30-second demo script

> At Bright Angel, Sapphire Canyon is a science target because researchers reported organic compounds and mineral associations. Its map position comes from the sample report and is approximate. In this illustrative EVA, reusing Tool T1 connects possible contacts from A to Sample B. A separate Tool T2 still shares Glove G1 in the model. These are possible contact paths, not measured contamination.

The later video concept remains **“LIFE DETECTED. … It’s you.”** and ends **“Find Mars. Not ourselves.”** It is an imagined narrative idea, not a discovery claim; video production is not part of this prototype task. See [design notes](docs/design.md).
