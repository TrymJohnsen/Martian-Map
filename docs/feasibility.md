# Feasibility: Clean Approach

## Data that actually works

The team fetched and read one Jezero CTX stereo product: DTM, matching orthorectified image, and intersection-error raster. All are 148×148 on the same Mars CRS/grid at 20.162955 m/pixel. The rasters share 295 NoData cells (1.35%). Heights are −2615.689 to −2515.562 m relative to the areoid. The original display preview is at `data/raw/jezero/*_preview.png`; the smaller, documented static derivative is `public/data/jezero-demo.json`.

The ortho and DTM have **the same** pixel spacing here. This sample cannot support a “sharp image over coarse terrain” story. The optional third raster is ASP camera-ray separation in metres. It is not true terrain accuracy or an uncertainty map. It can be shown only with that definition and limitation.

The second NASA mission context is the Perseverance/Mars 2020 CacheCam PIA24751 witness-tube record. It documents a real robotic sample-control/witness process but is from a different location and is not spatially aligned with the CTX raster. The app uses it as a method reference, not a map layer.

## Prototype mechanism

Let a user compare two manually defined activity orders around a scenario target: collect the sample before a later survey task, or survey first along a path that crosses the marked target footprint before sampling. The scene can report the route length and elevation profile sampled from CTX, and whether a drawn path geometrically intersects the marked footprint before the sample step.

The consequence is a **potential contact opportunity in the scenario** and a different traceability sequence. It is not a contamination prediction, probability, safety judgement, or claim that the alternative prevents transfer. A witness/check step is a proposed EVA adaptation inspired by Perseverance, not an established astronaut procedure.

## Minimum product and weakness

- One local 3D terrain scene, with NoData omitted rather than rendered as false relief.
- Two route/activity-order choices; changing choice updates path, terrain-derived length/profile and the contact/traceability explanation.
- One source/assumption panel, the separately labelled ASP diagnostic, and the NASA witness-tube reference.
- No backend, login, live weather, scientific risk score, or astronaut-safety claim.

The weakest part is validity: existing sources establish suit-surface biogenic material and the need for sample cleanliness, but do not measure astronaut-to-Martian-sample transfer or establish that route order reduces it. The improvement is to make the geometric overlap and evidence label explicit, show the robotic witness precedent honestly, and never quantify the hypothesized effect.

## Evidence categories

- **Observed:** CTX stereo topography and CTX imagery; the NASA Mars 2020 CacheCam witness-tube reference image; product NoData and ASP intersection-error values.
- **Derived:** 3D mesh, path length, sampled elevation profile, and geometric path/footprint intersection.
- **Scenario assumptions:** target coordinate/footprint, start and survey waypoint, routes, action order, contact interpretation, and the proposed EVA witness/check adaptation.

## Multiple-mission challenge fit

The current map layers are not multi-mission: the DTM, ortho and ray-separation image are one MRO/CTX stereo product. Perseverance/Mars 2020 contributes a linked witness-tube method image from a different location, not a second mapped raster. Mars Trek lists potentially relevant regional products from Mars Global Surveyor (MOLA), Mars Express (HRSC) and Mars Odyssey (THEMIS), but none has yet been downloaded, locally aligned or checked against this CTX crop. Curiosity/Mastcam imagery is from Gale and is not a Jezero map layer. Do not claim the challenge's multi-mission mapping element is met until a suitable second-mission spatial layer has been verified and integrated or the scope is explicitly accepted as incomplete.

The scenario's current derived values are approximately 3.30 km total straight-line route / 140 m in the marked footprint before collection for collect-first, and 4.99 km / 350 m for survey-first. They are calculated from manually selected grid positions and a 7-cell (~140 m) illustrative footprint; no terrain-following route or contact mechanism is modelled.

See [docs/science.md](science.md) for evidence and prior art, [docs/data-sources.md](data-sources.md) for product provenance, and [docs/data-contract.md](data-contract.md) for exact meanings.
