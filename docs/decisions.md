# Decisions

## 2026-11-14 — Project direction: Clean Approach

The team selected the question of preserving a science sample's interpretive integrity when Earth-associated material may contact it. The implementation will focus on contact/activity sequence and traceability, not wind transport. Suit-surface biological material and robotic witness tubes are documented; astronaut-to-Mars-sample transfer and route-order mitigation are not established. The app must not report risk scores or quantitative contamination reduction.

## 2026-11-14 — Model direct-contact reachability qualitatively

The prototype represents a possible Earth-associated source → EVA glove → sample-contact interface → rock core chain as a directed graph. It reports only whether that path exists under explicit scenario assumptions. It does not estimate amount, probability, viability, or efficacy. Activity order is retained as a timeline comparison; with the same contacts it does not change graph reachability. An optional isolation boundary is a hypothetical graph edit, not a crewed-EVA recommendation or validated control. See [the model specification](model.md).

## 2026-11-14 — Replace fixed chain with ordered contact history

The working prototype computes object histories from stable-ID places, sources, objects and ordered events. Compare the same route with a shared tool, a separate B tool retaining the glove contact, and a separate tool with the explicit G1→T2 contact omitted. The event trace determines possible-source paths; no plan is hardcoded as best. Sealing freezes sample history and controls only record evidence. The Bright Angel target is now nominally placed from its PDS sample-report coordinate in an overlapping CTX product; A and the route remain illustrative. See [docs/model.md](model.md), [docs/data-contract.md](data-contract.md), and [docs/data-sources.md](data-sources.md).

## 2026-11-14 — Keep MEDA wind as background, not an app layer

A reproducible Sol 36 derived wind sample near the Perseverance landing point was downloaded and plotted. It is 2021 landing-site history, while Sapphire Canyon was collected on Sol 1215. The current target is a nominal PDS report coordinate mapped into a CTX cell; the report does not specify its datum or horizontal accuracy. Empty uncertainty/booms-used fields and the absence of a human-release/deposition model prevent a defensible contamination or target-exposure inference. Keep the dataset and figure as context; do not add a wind overlay or alter the direct-contact graph.

## 2026-11-14 — Use Jezero CTX crop already fetched by the team

Use STAC item `N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W`, preserving raw rasters under ignored `data/raw/`. The Bright Angel crop covers 175×147 cells at 20.399228 m/cell with matching DTM/ortho/ray-separation grids. The reported target coordinate falls in valid cells; its accuracy/datum are unspecified, and its DTM elevation differs from the PDS elevation by 29.76 m. Use the raster for broad terrain context and approximate scenario-route metrics only.

The DTM and orthoimage have the same pixel spacing in the original landing-area crop; do not claim that it contrasts a fine image with a coarse DTM. That early crop and its illustrative sample marker were superseded by the Bright Angel data selection documented below and in [data sources](data-sources.md). The map remains context, not a safety-certified sampling site.

## 2026-11-14 — Keep the stereo diagnostic distinct

`intersection_error` is ASP ray-separation in metres. It is a relative processing diagnostic, not DTM error, absolute accuracy, probability, or measurement uncertainty. Show it only with its full name and explanation; do not make it drive a “safe route” classification.

## 2026-11-14 — Use Perseverance witness-tube evidence as a labelled analogy

Reference NASA Mars 2020/Perseverance CacheCam PIA24751 and witness-tube description in a separate evidence card. It is a different mission and an actual sample-control precedent, but its image is not located at the CTX scenario site and its procedure is not a crewed-EVA protocol.

## 2026-11-14 — No app framework dependency for this time-boxed prototype

The repo uses a no-build static app with browser-native canvas/JavaScript and the documented derived `public/data/bright-angel-demo.json`. Keep original GeoTIFFs and secrets out of Git; check in only the compact display derivative so a teammate can open the demo without rerunning geospatial tooling.

## 2026-11-14 — Preserve the video concept for a later phase

Keep the proposed story framing **“LIFE DETECTED. … It’s you.”** and the ending **“Find Mars. Not ourselves.”** for a later video. The line is an imagined scenario, not a discovery claim. No video production is part of the current visual design checkpoint.
