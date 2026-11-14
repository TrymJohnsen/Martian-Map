# GitWarriors handoff — 14 November 2026

## Current scientific/technical direction

- Pause major visual redesign. Keep the working terrain prototype and its existing A/B design studies available, but do not spend time polishing those directions while validating the scientific core.
- The question is sample-science integrity: a hypothetical Jezero sedimentary core for later organic-molecule and potential-biosignature analysis, motivated by Perseverance's Bright Angel / Sapphire Canyon sample. The current CTX target is illustrative and is **not** that sample or site.
- Selected mechanism: possible direct contact/carry-over through an EVA glove, sample-contact interface and sample. Activity order is a timeline input, not a physical mechanism by itself.
- New `public/contact-model.js` reports only graph reachability under explicit assumptions. With identical contacts, both activity orders give the same pathway. A hypothetical glove-change/protected-tool boundary can remove one graph edge; it is not a validated EVA protocol. No transfer amount, probability, risk score, viability, or biological establishment is computed.
- `docs/model.md` is the canonical specification for variables, equation, assumptions, bounds, graph semantics and verification. `docs/science.md` compares mechanisms and documents the scientific distinction. `docs/data-sources.md` has the source-to-variable-to-calculation-to-decision audit.

## Data that works

- Local `.venv`: rasterio 1.5.2, pyproj 3.8.0, numpy 2.5.4, matplotlib 3.11.2.
- Existing 148×148 Jezero MRO/CTX DTM/ortho/ASP ray-separation crops remain unchanged. They share Mars CRS/grid, 20.162955 m spacing and 295-cell NoData mask. DTM range is −2615.689 to −2515.562 m relative to the areoid; ortho band units are unspecified.
- The CTX data supports terrain display and illustrative path geometry only. It supplies no contamination measurement. Bright Angel / Sapphire Canyon is outside this crop; no co-registration is claimed.
- Curiosity / MSL sample-transfer publications and Perseverance / Mars 2020 sample/SHERLOC records inform the contamination-control and science context. They are not human transfer coefficients. An individual Sol-1215 SHERLOC product has not been downloaded.
- **MEDA data test completed:** PDS Sol 36 derived wind v2.0 and matching ancillary v3.0 downloaded, validated, and plotted. 40,543/41,538 rows have valid paired speed+direction values, spanning LTST 01:06:50–22:40:04; speed is 0–16.24 m/s. The rover was 15.89 m from the landing site. The app's hypothetical target marker is about 0.91 km east of the landing point. The wind index does not include the motivating sample's Sol 1215. Source labels, checksums, minute-nearest sample and figure are under `docs/figures/`; reproduce with `scripts/fetch_meda_wind_sample.py`. Ordinary sandbox DNS is blocked, but a bounded HTTPS retrieval obtained these public PDS files.
- The direction is north-relative and interpreted as meteorological “from” by the MEDA study; it is plotted as individual points, with no directional mean. In this product all speed/direction uncertainty and booms-used fields are empty. No wind view is integrated in the app; no transport/deposition model is implied.

## Verification performed for the qualitative model

- `node --check public/app.js`
- `node --check public/contact-model.js`
- `node --test tests/contact-model.test.cjs`
- `MPLCONFIGDIR=/tmp/martian-map-mpl .venv/bin/python scripts/fetch_meda_wind_sample.py`
- `git diff --check`

The graph checks cover baseline path reachability, order invariance, no-source/no-contact cases, the hypothetical isolation boundary, and unknown sequence rejection; these verify implementation logic, not physical behavior. The MEDA script validated product IDs/versions, schema, valid-pair filtering, matching rover-position metadata and generated the linked figure. Browser QA remains incomplete for the prior app panel: localhost binding is denied in this agent environment, and the Playwright CLI package is cached but no browser executable is available. This task made no app changes, so no new browser visual claim is made.

## Open limitations

- No direct astronaut glove/tool-to-Mars-sample transfer data or validated human EVA protocol is available.
- A graph path denotes a scenario contact possibility, not actual transfer. The proposed isolation boundary is a model assumption, not a recommendation proved to reduce contamination.
- Airborne transport remains unmodeled: MEDA records wind at one rover point; it does not measure a human source, biological particle release, sample deposition or transfer. MIASMMA, ISS exterior DNA and rover resuspension evidence do not supply those missing links.
- The georeferenced map still has only MRO/CTX. Mars 2020 sample and instrument records contribute science context but are not a co-registered layer in this scene. The multi-mission mapped-layer challenge element remains incomplete.
- Route length and footprint overlap remain secondary geometric summaries and do not drive the contact graph.

## Next priorities

1. Complete live-browser review of the graph explanation, isolation control, source panel and retained map interactions; repair only material errors.
2. If the team wants a geologically specific mapped target, choose a CTX/HiRISE product whose footprint actually includes it and verify registration before changing the marker. Do not present Bright Angel metadata over the current crop.
3. Ask a science reviewer whether the hypothetical isolation boundary is a useful scenario to show. Keep it labelled as unvalidated; do not call it a protocol recommendation.
4. Only revisit quantitative transfer after a defined Mars-relevant material/contact assay provides source loading and interface transfer measurements.
5. Next prototype step: make the central promise of activity history concrete by recording scenario events with order, map position, time/source and explicit contact assumptions. Keep MEDA in the background unless a later event has a matching observation location/time; the derived-wind index inspected does not list Sol 1215.
