# Current status — Clean Approach

## Demonstration

The app follows the "Clean Approach · redesign" canvas and has four views behind one header:

- **Mission intro** (entry page): the question, the primary action **Open the mission checklist**, why Sapphire Canyon matters, the three places with their evidence labels, and the terrain map.
- **Checklist**: eight steps from the start to sealing. One step is open at a time; four steps carry a choice (glove change, witness tube, sampler, seal check). The map and **What connects to Sample B** stay visible beside the steps, and three assumptions can be switched in the side column next to a "Not a result" status card and the "Not modeled" list. After every change the scenario is rebuilt and replayed.
- **Example plans**: the three prepared sequences compared in a table, an event timeline for all nine events of each plan, and a walkthrough with Previous, Next, Walk me through it, Stop and Restart.
- **Data & assumptions**: what is Observed, Derived or Scenario, the coordinate caveats, the cells with no data, the route profile, sources and credits.

With the default choices the human-associated path remains (G2 → tongs → Sample B), because G2 is assumed to carry it. That is intended: the model gives no step the power to protect a sample. A note in the result explains this and links to the assumption.

Screenshots: [intro](../output/playwright/redesign-intro-1440.png) · [checklist](../output/playwright/redesign-checklist-1440.png) · [example plans](../output/playwright/redesign-examples-1440.png) · [data](../output/playwright/redesign-data-1440.png) · tablet [intro](../output/playwright/redesign-intro-820.png), [checklist](../output/playwright/redesign-checklist-820.png) · phone [intro](../output/playwright/redesign-intro-390.png), [checklist](../output/playwright/redesign-checklist-390.png)

## Open points

- **Map markers are not redesigned.** `map.js` was left untouched for the map workstream. The canvas still draws round coloured markers, labels the boundary place with its ID ("zone-B", overlapping "B"), and draws no work-zone ring or step highlight. The legend describes what is drawn today, using the tokens `--map-s`, `--map-a` and `--map-route`.
- **Phone result.** The design opens the result as a bottom sheet. Here the bottom bar shows the four source groups and "Details" moves to the full result further down the page.
- **Copy to review.** The two explanation notes in the result, the example-plan intro sentence, and the Data & assumptions notes were written during the build.
- **Fonts** load from Google Fonts; offline the page falls back to system fonts.
- `README.md` and `AGENTS.md` still describe the three-step flow and the earlier test command. `public/styles.css` and `public/design-overrides.css` are no longer linked and can be removed once the map branch is merged.
- The earlier screenshots under `output/playwright/` (`clean-approach-step-*`, `bright-angel-*`, `plan-*`, `proposal-*`) show superseded layouts.

## Front-end structure

`public/tokens.css` and `public/components.css` hold the design system. `public/panel.js` owns the views, the checklist and the example plans; `public/map.js` owns the terrain canvas inside the shared map card; `public/app.js` loads the data and starts both. They communicate through `window.CleanApproach` and three events. See [the module contract and markup hooks](data-contract.md#module-and-event-contract) and [decisions](decisions.md).

## Data limits

- B is a nominal target-area placement from the PDS report associated with Sapphire Canyon, not a verified drill point. Coordinate datum and horizontal accuracy are not stated.
- The PDS and CTX elevations at B differ by about 29.8 m; the cause remains unresolved.
- A, the traverse and contact chain are illustrative. Reachability is not measured transfer, contamination, probability, safety or EVA guidance.
- CTX DTM/ortho posting is about 20.4 m. NoData remains blank. ASP ray separation is a relative stereo diagnostic, not terrain uncertainty.

## Verification

```bash
node --check public/app.js
node --check public/map.js
node --check public/panel.js
node --check public/mission.js
node --check public/scenario.js
node --check public/contact-model.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs tests/mission-model.test.cjs tests/mission-steps.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```

On 2026-11-14 the redesigned app was checked in Edge (headless): 52 checks, no console errors or warnings. They covered the intro as entry with one primary action above the fold; every choice and assumption with the expected source groups, chains and "Created at" links; focus kept on the control just used and moved to the step title when a step opens; the work-zone warning and its link; the explanation note and its hidden state; `mission:step` and `scenario:change` including the `zone-B` place; the example-plan table matching the model; the walkthrough advancing, stopping and stepping manually; opening a plan in the checklist; deep links; the skip link first in the tab order and every control named; no text under 12 px; and no horizontal overflow in any view at 1440, 820 and 390 px. `node --test` passes 36 tests. Token contrast was calculated for 22 text and background pairs; the lowest is 5.2:1 (disabled text). The Python geospatial test was not rerun; no Python or data file changed.

The agreed future video idea remains **“LIFE DETECTED. … It’s you.”** and closes with **“Find Mars. Not ourselves.”** Video production is not included.
