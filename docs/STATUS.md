# Current status — Clean Approach

## Demonstration

The prototype now uses one persistent terrain map through three steps: **Mission**, **Plan**, and **Sample history**. Mission distinguishes the PDS-derived nominal Sapphire Canyon target B from hypothetical work site A and gives a short science context. Plan compares T1 reuse with separate T2 use while showing Glove G1 at both activities. Sample history switches between plans and displays paths calculated by the same ordered-event model.

When the separate-tool model contains the path, the interface says **Different tool. Shared glove history.** It labels the result as possible contact history, not measured contamination. Plan C remains a counterfactual that omits only modeled G1 → T2 at B. The three-step walkthrough has Stop, Restart and manual previous/next controls and uses the live scenario.

- [Mission · 1440×900](../output/playwright/clean-approach-step-1-mission-1440x900.png)
- [Plan · 1440×900](../output/playwright/clean-approach-step-2-plan-1440x900.png)
- [Sample history · 1440×900](../output/playwright/clean-approach-step-3-history-1440x900.png)

## Front-end structure

The browser code is split by owner: `public/map.js` (terrain map, layers, route/markers, profile), `public/panel.js` (Mission / Plan / Sample history, event timeline, walkthrough) and a small `public/app.js` (data loading, shared source text). They communicate through `window.CleanApproach` and three events; empty mount points `#layer-panel`, `#context-cards` and `#mission-panel` are ready for new work. See [the module contract](data-contract.md#module-and-event-contract) and [decisions](decisions.md). The user-visible app is unchanged by the split.

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
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```

On 2026-11-14 the module split was checked in Edge (headless, 1440×900) before and after: 35 states covering all three steps, plan changes, event stepping, trace links, Plan C, canvas marker clicks, drag, zoom, layers, height scale, reset, walkthrough start/stop/auto-advance/manual, the assumptions panel and 820 px and 390 px widths produced identical text, map pixels and screenshots, with no console errors.

The agreed future video idea remains **“LIFE DETECTED. … It’s you.”** and closes with **“Find Mars. Not ourselves.”** Video production is not included.
