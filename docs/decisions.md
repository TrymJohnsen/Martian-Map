# Decisions

## 2026-11-14 — Project direction: Clean Approach

The team selected the question of astronaut-introduced contamination affecting a science sample. The implementation will focus on contact/activity sequence and traceability, not wind transport. Suit-surface biological material and robotic witness tubes are documented; astronaut-to-Mars-sample transfer and route-order mitigation are not established. The app must not report risk scores or quantitative contamination reduction.

## 2026-11-14 — Use Jezero CTX crop already fetched by the team

Use STAC item `P18_007925_1987_XN_18N282W__P19_008650_1987_XI_18N282W`, preserving raw rasters under ignored `data/raw/`. The crop covers 148×148 cells at 20.162955 m/cell and has exact matching DTM/ortho/intersection-error grids. Use it for broad terrain context and approximate scenario-route metrics only.

The DTM and orthoimage have the same pixel spacing in this sample; do not claim that this crop contrasts a fine image with a coarse DTM. The sample marker is illustrative, not a geologically selected or safety-certified sampling site.

## 2026-11-14 — Keep the stereo diagnostic distinct

`intersection_error` is ASP ray-separation in metres. It is a relative processing diagnostic, not DTM error, absolute accuracy, probability, or measurement uncertainty. Show it only with its full name and explanation; do not make it drive a “safe route” classification.

## 2026-11-14 — Use Perseverance witness-tube evidence as a labelled analogy

Reference NASA Mars 2020/Perseverance CacheCam PIA24751 and witness-tube description in a separate evidence card. It is a different mission and an actual sample-control precedent, but its image is not located at the CTX scenario site and its procedure is not a crewed-EVA protocol.

## 2026-11-14 — No app framework dependency for this time-boxed prototype

The repo has no existing frontend. Build a no-build static app using browser-native canvas/JavaScript and the small derived `public/data/jezero-demo.json`. Keep original GeoTIFFs and secrets out of Git; check in only the 148×148, documented display derivative so a teammate can open the demo without rerunning geospatial tooling.

## 2026-11-14 — Preserve the video concept for a later phase

Keep the proposed story framing **“LIFE DETECTED. … It’s you.”** and the ending **“Find Mars. Not ourselves.”** for a later video. The line is an imagined scenario, not a discovery claim. No video production is part of the current visual design checkpoint.
