# GitWarriors handoff — 14 November 2026

## Works and was checked

- Local `.venv` has rasterio 1.5.2, pyproj 3.8.0, numpy 2.5.4 and matplotlib 3.11.2.
- The user's 148×148 Jezero CTX sample was opened and its preview inspected. DTM, ortho and `intersection_error` share the same 20.162955 m grid, Mars CRS, crop bounds and 295-cell NoData mask.
- DTM values are −2615.689 to −2515.562 m relative to the areoid. Ortho source units are not declared. Intersection error is ASP ray separation in metres, a relative stereo diagnostic rather than accuracy/uncertainty.
- `scripts/build_demo_data.py` generated `public/data/jezero-demo.json` (337,135 B), a small display derivative that masks NoData and keeps source citations/assumptions.
- The static frontend is implemented with browser-native Canvas 2D: 3D-style terrain rendering, ortho/elevation/intersection-error display, drag rotation, zoom, two activity orders, grid-derived distance/profile, and an 18-second camera motion.
- `node --check public/app.js` passes; rebuilding the display data with `.venv/bin/python scripts/build_demo_data.py` passes. A headless browser binary is not installed here, and the agent sandbox denies binding a local HTTP socket, so browser interaction has not been visually verified in this environment.
- `docs/science.md` documents the evidence ladder and limitations. NASA sources support concern and witness-tube precedent, not a quantified astronaut-to-sample transfer or mitigation.

## Open questions / constraints

- No human suit-to-Martian sample transfer rate or validated route-order mitigation is available in the reviewed sources.
- The CTX sample has identical DTM/ortho spacing, so it cannot show high-resolution imagery over a coarse height grid. A marker in this crop is a scenario target, not a science-selected outcrop.
- The exact image-band physical units are absent in the sampled metadata.
- The NASA Perseverance CacheCam reference image is fetched by the browser from the official NASA Photojournal; offline demo mode will show a fallback credit/link.
- Agent shell DNS still fails for unrelated domains as well as the NASA/USGS hosts; source assets were obtained by the user's Ubuntu run. Do not spend the demo session trying to repair agent networking.
- No operational safety, contamination probability, plume, or local wind-field claim is made.

## Next three priorities

1. Review the contact-sequence scenario and copy labels with Mads; decide whether the sample target/footprint story is compelling without implying validated transfer.
2. Open the static demo on the presentation machine, verify the two sequence choices change the route and traceability readout, and inspect the scene there.
3. Trim the English 30-second demo narration after the interaction is settled; check NASA image availability and labels on the presentation machine.

## Suggested parallel work blocks (proposal only)

| Block | Files | Depends on | Done when |
|---|---|---|---|
| Science/protocol review | `docs/science.md`, `docs/demo-script.md` | Read current UI copy | Claims distinguish evidence, analogy and hypothesis; no route-risk numbers. |
| Data/visual QA | `docs/data-sources.md`, `docs/data-contract.md`, `scripts/build_demo_data.py`, `public/data/` | Existing ignored source crops | Grid, NoData and source credit checked; route metrics marked as grid-scale derivations. |
| Prototype/presentation | `public/index.html`, `public/app.js`, `public/styles.css`, `README.md` | Data contract fixed | Local demo opens, route toggle responds, camera sequence can be manually interrupted, and 30-second story is understandable without audio. |

These are possible work divisions, not assigned tasks. Root agent owns integration and should check `git status` before staging anyone else's work.
