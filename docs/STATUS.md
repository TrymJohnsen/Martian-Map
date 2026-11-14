# Current status — Clean Approach

## Demonstration

The prototype now uses one persistent terrain map through three steps: **Mission**, **Plan**, and **Sample history**. Mission distinguishes the PDS-derived nominal Sapphire Canyon target B from hypothetical work site A and gives a short science context. Plan compares T1 reuse with separate T2 use while showing Glove G1 at both activities. Sample history switches between plans and displays paths calculated by the same ordered-event model.

When the separate-tool model contains the path, the interface says **Different tool. Shared glove history.** It labels the result as possible contact history, not measured contamination. Plan C remains a counterfactual that omits only modeled G1 → T2 at B. The three-step walkthrough has Stop, Restart and manual previous/next controls and uses the live scenario.

- [Mission · 1440×900](../output/playwright/clean-approach-step-1-mission-1440x900.png)
- [Plan · 1440×900](../output/playwright/clean-approach-step-2-plan-1440x900.png)
- [Sample history · 1440×900](../output/playwright/clean-approach-step-3-history-1440x900.png)

## Mission checklist

Below the three steps, **Build your own sampling sequence** opens a checklist of eight steps: check the sealed kit, document and collect sample A, bag the used tool, change the outer glove at the work-zone boundary, open the witness tube, collect sample B, seal tube B, log the IDs. Four steps carry a choice (glove change, sampler: tongs / T2 / T1 / by hand, seal check, witness tube) and three assumptions can be switched (G2 carries human-associated material, G1 touches G2 during the change, the equipment itself is a source). After every change the scenario is rebuilt and replayed. The panel shows which of the four source groups have a modeled path to Sample B, the steps that created each path, which assumption a result depends on, seal and witness status, work-zone warnings, and a "Not modeled" list (suit leakage, raised dust, wind, lander exhaust). Each step links the documented practice it is inspired by; none is presented as validated for Mars EVA. The example plans and walkthrough are unchanged, and "Back to example plans" restores them.

With the default choices the human-associated path remains (G2 → tongs → Sample B), because G2 is assumed to carry it. That is intended: the model gives no step the power to protect a sample.

- [Entry below the steps · 1440×900](../output/playwright/mission-checklist-entry-1440x900.png)
- [Checklist, defaults · 1440×900](../output/playwright/mission-checklist-default-1440x900.png) · [full page](../output/playwright/mission-checklist-default-fullpage.png)
- [Keeping G1 on: work-zone warning · full page](../output/playwright/mission-checklist-keep-g1-warning-fullpage.png)
- [All three assumptions changed · full page](../output/playwright/mission-checklist-assumptions-fullpage.png)
- [Map with the zone-boundary place · 1440×900](../output/playwright/mission-checklist-map-zone-1440x900.png)

Open points for the next pass:

- The visual design is functional only. A redesign is planned; the hooks it must keep and the text that must stay visible are listed in [the markup contract](data-contract.md#mission-panel-markup-hooks).
- The checklist makes the right-hand column about four screens tall while the map stays at the top. A sticky map or a stepper would keep them together.
- On the map the new place is labelled with its ID, "zone-B", and overlaps the "B" label. That text is drawn by `map.js` (map workstream); the scenario's work zone is published but not drawn yet.
- `README.md` and `AGENTS.md` still list the earlier test command and script set; they are shared files and were left for a separate small commit.

## Front-end structure

The browser code is split by owner: `public/map.js` (terrain map, layers, route/markers, profile), `public/panel.js` (Mission / Plan / Sample history, event timeline, walkthrough) and a small `public/app.js` (data loading, shared source text). They communicate through `window.CleanApproach` and three events; `#mission-panel` holds the mission checklist, and the empty mount points `#layer-panel` and `#context-cards` are ready for map-side work. See [the module contract](data-contract.md#module-and-event-contract) and [decisions](decisions.md). The user-visible app is unchanged by the split.

## Data limits

- B is a nominal target-area placement from the PDS report associated with Sapphire Canyon, not a verified drill point. Coordinate datum and horizontal accuracy are not stated.
- The PDS and CTX elevations at B differ by about 29.8 m; the cause remains unresolved.
- A, the traverse and contact chain are illustrative. Reachability is not measured transfer, contamination, probability, safety or EVA guidance.
- CTX DTM/ortho posting is about 20.4 m. NoData remains blank. ASP ray separation is a relative stereo diagnostic, not terrain uncertainty.

## Verification

On 2026-11-14, Playwright/Chromium at 1440×900 verified keyboard access to all three steps, tool selection, back navigation with plan retained, plan comparison without stale paths, Plan C's modeled omission, and opening/closing Data & assumptions without losing the active step. The separate-tool result included Glove G1 → Tool T2 → Sample B. The walkthrough start/stop, manual next and restart were exercised. The map, selected markers and computed result were visible together in the history view. Browser console had no errors or warnings after the app loaded.

```bash
node --check public/app.js
node --check public/map.js
node --check public/panel.js
node --check public/scenario.js
node --check public/contact-model.js
node --check public/mission.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs tests/mission-model.test.cjs tests/mission-steps.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```

On 2026-11-14 the module split was checked in Edge (headless, 1440×900) before and after: 35 states covering all three steps, plan changes, event stepping, trace links, Plan C, canvas marker clicks, drag, zoom, layers, height scale, reset, walkthrough start/stop/auto-advance/manual, the assumptions panel and 820 px and 390 px widths produced identical text, map pixels and screenshots, with no console errors.

On 2026-11-14 the mission checklist was checked in Edge (headless, 1440×900): 43 checks with no console errors or warnings. They covered opening and closing the checklist, the eight steps and their precedent links, every choice and assumption with the expected source groups, focus kept on the control just used, the work-zone warning for G1 and for T1, `mission:step` and `scenario:change` events including the `zone-B` place, map-side place buttons selecting the matching step, the example plans giving the same headings before and after, and no horizontal overflow at 390 px. The 35 example-mode states from the module-split check gave identical map pixels and state; the only difference was the added entry text. `node --test` passes 36 tests (14 earlier, 22 new in `tests/mission-model.test.cjs` and `tests/mission-steps.test.cjs`). The Python geospatial test was not rerun; no Python or data file changed.

The agreed future video idea remains **“LIFE DETECTED. … It’s you.”** and closes with **“Find Mars. Not ourselves.”** Video production is not included.
