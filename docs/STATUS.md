# GitWarriors handoff — 14 November 2026

## Works and was checked

- Local `.venv` has rasterio 1.5.2, pyproj 3.8.0, numpy 2.5.4 and matplotlib 3.11.2.
- The user's 148×148 Jezero CTX sample was opened and its preview inspected. DTM, ortho and `intersection_error` share the same 20.162955 m grid, Mars CRS, crop bounds and 295-cell NoData mask.
- DTM values are −2615.689 to −2515.562 m relative to the areoid. Ortho source units are not declared. Intersection error is ASP ray separation in metres, a relative stereo diagnostic rather than accuracy/uncertainty.
- `scripts/build_demo_data.py` generated `public/data/jezero-demo.json` (337,135 B), a small display derivative that masks NoData and keeps source citations/assumptions.
- The static frontend offers two same-app layouts (A terrain-first / B guided field story), a collapsible source panel, observed/derived/scenario labels, layer descriptions and local manifest links. Coordinates derive from the raster transform; source pixel values are identified as display-only where appropriate.
- The previous zone-overlap length bug was corrected. Independent geometry gives approximately 3.30 km total straight-line route / 140 m inside the marked footprint before collection for collect-first, and 4.99 km / 350 m for survey-first. Values are rounded to ten metres. This is scenario geometry, not a navigable route or contact/contamination estimate.
- Camera has explicit reset, click/drag interruption and respects reduced-motion preference. Map letters have a text key; controls have focus styling and pressed states.
- `node --check public/app.js` and rebuilding the display data with `.venv/bin/python scripts/build_demo_data.py` pass. No browser binary/automation is installed and the agent sandbox denies local socket binding; therefore neither A/B layout nor interaction has been visually checked in a browser here. No screenshot is claimed.
- `docs/science.md` documents the evidence ladder and limitations. NASA sources support concern and witness-tube precedent, not a quantified astronaut-to-sample transfer or mitigation.

## Open questions / constraints

- No human suit-to-Martian sample transfer rate or validated route-order mitigation is available in the reviewed sources.
- The CTX sample has identical DTM/ortho spacing, so it cannot show high-resolution imagery over a coarse height grid. A marker in this crop is a scenario target, not a science-selected outcrop.
- The georeferenced scene currently contains one mapped mission/instrument family (MRO/CTX). Mars 2020 provides only a separate-site method reference. The multi-mission mapped-layer requirement remains open; see `docs/data-sources.md` and `docs/feasibility.md`.
- The exact image-band physical units are absent in the sampled metadata.
- The NASA Perseverance CacheCam reference image is fetched by the browser from the official NASA Photojournal; offline demo mode will show a fallback credit/link.
- Agent shell DNS still fails for unrelated domains as well as the NASA/USGS hosts; source assets were obtained by the user's Ubuntu run. Do not spend the demo session trying to repair agent networking.
- No operational safety, contamination probability, plume, or local wind-field claim is made.

## Next three priorities

1. **Human decision 1:** compare A (`/?layout=a`) and B (`/?layout=b`) and choose A, B or a concrete combination. Do not polish a single direction until this choice arrives.
2. Continue independent work: identify a usable, co-located second-mission product with usable metadata and test alignment before adding it; keep human transfer as an unvalidated hypothesis.
3. After the layout choice, revise the rough 30-second silent English walkthrough and ask for review before camera choreography. Finally, ask the team to try it cold and report what was unclear.

## Suggested parallel work blocks (proposal only)

| Block | Files | Depends on | Done when |
|---|---|---|---|
| Science/protocol review | `docs/science.md`, `docs/data-sources.md`, source panel | Inspect all claim labels | Map layers, reference precedent, evidence and scenario are distinguishable; no route-risk numbers. |
| Multi-mission data check | `docs/data-sources.md`, `docs/feasibility.md` | Choose a specific Jezero co-located product candidate | Product footprint, CRS, resolution, date, registration and use limitation are verified before integration. |
| Layout/story review | `public/?layout=a`, `public/?layout=b`, `docs/design.md` | Human design choice 1 | One layout is selected or concrete hybrid specified; no expensive polish before decision. |
| Prototype/browser QA | `public/index.html`, `public/app.js`, `public/design-overrides.css` | Open on presentation laptop | Toggles, route/profile changes, reset, reduced motion, loading/error, focus and laptop viewport are visually checked. |

These are collaboration blocks for the three-person team; agree owners in the team chat. Root agent owns integration and should check `git status` before staging others' work.
