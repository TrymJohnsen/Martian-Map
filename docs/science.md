# Science basis: Clean Approach

## The bounded question

Can an astronaut team make a sample-contact plan easier to audit by recording a witness/check step and avoiding a scenario route that crosses the marked sample footprint before collection?

This is a planning and traceability question. The prototype does **not** estimate how much contamination moves, its probability, an airborne plume, or whether a Mars location is safe.

## What sources support

| Evidence | What the source says | What we use it for |
|---|---|---|
| Human suit surfaces can carry biological material | NASA's EVA Swab Kit report describes suit-surface sampling under typical handling. It reports 235 cultured CFU across 26 bacterial and one fungal species on sampled suit exteriors. Its stated next research questions include suit leakage and destination viability/spread. This is ISS/Orion suit evidence, not a Mars sample-transfer experiment. | Supports the documented concern that crew suit surfaces may carry biological material. Does not establish how much could reach a Mars sample. [NASA NTRS 20220003128](https://ntrs.nasa.gov/citations/20220003128) |
| Human contamination rates and spread remain research questions | MIASMMA describes planned empirical measurements of suit leakage and subsequent Mars GCM dispersal modelling. The record's preliminary model uses literature values; it is not a measured local Jezero plume or route-scale wind forecast. | Explains why the app avoids winds, emission rates, probabilities and distances. [NASA NTRS 20250006358](https://ntrs.nasa.gov/citations/20250006358) |
| Mars 2020 uses witness tubes and a known-material inventory | Perseverance's sample system uses clean hardware, tracks known residual materials, and carries witness tubes that record the environment within its sampling system. The CacheCam PIA24751 sequence shows a rover inspecting/sealing a witness tube before its first samples; the tube is opened on the surface to witness ambient conditions near sampling. | Provides a real robotic sample-documentation precedent for a clearly labelled illustrative “witness/check” step. It does not validate an astronaut EVA protocol or prove that task order reduces transfer. [JPL Mars 2020 Biological Cleanliness](https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/mission/spacecraft/biological_cleanliness/), [NASA PIA24751](https://science.nasa.gov/photojournal/witness-tube-in-perseverance-sample-caching-system/) |
| Orbital terrain shows broad landforms | The MRO/CTX crop is a real 148×148, 20.163 m/pixel DTM/orthophoto pair near the Perseverance landing point. It can show broad relief and let the demo calculate an illustrative route length/elevation profile. It is not detailed enough for small obstacles or operational EVA navigation. | Gives the scene a real Martian surface and makes manually placed route alternatives visibly respond to the terrain. [USGS CTX DTM docs](https://stac.astrogeology.usgs.gov/docs/data/mars/ctxdtms/) |
| Stereo intersection error has a limited interpretation | Ames Stereo Pipeline defines ray intersection error as the closest separation of rays from the two cameras, in metres. The ASP paper says it is a relative self-consistency diagnostic: low error does not prove DTM accuracy. | Show as a separately labelled processing diagnostic only; never call it a probability or uncertainty map. [ASP `point2dem`](https://stereopipeline.readthedocs.io/en/stable/tools/point2dem.html), [Beyer et al. 2018](https://doi.org/10.1029/2018EA000409) |

## Evidence levels in the prototype

1. **Documented problem:** suit exteriors can contain human-associated biological material; contamination can compromise life-detection or low-concentration organic measurements. The NASA sources establish the concern, not an astronaut-to-Martian-rock transfer event.
2. **Reasonable but simplified principle:** keep a clear contact history, use clean/dedicated sample-contact tools, and collect a witness/control record as a proposed protocol element. Mars 2020 demonstrates careful hardware cleanliness and witness tubes in a robotic sample-caching system.
3. **Hypothesis:** an astronaut route that crosses a marked sample footprint before collection could create additional direct contact opportunities or complicate interpreting a sample. No source here measures this transfer on Mars or quantifies the effect of changing route order.
4. **Scenario assumption:** the start, sample target, survey waypoint, target footprint radius, path sequence, and any imagined suit/tool contact are manually placed for the demonstration. The footprint is a visual scenario boundary, not a safe distance or microbial transport radius.

## Mechanisms deliberately left out

- No wind vector, MEDA station value, plume animation, particle transport field, contamination concentration, emission rate, or safe standoff distance. General airborne transport is plausible, but the retrieved sources do not support local route ranking at this site.
- No extrapolation from ISS suit swabs to Mars survival or transfer rates.
- No claim that collecting a witness tube before/after the sample prevents contamination. It changes only the order and what the illustrative checklist records.
- No inference that the DTM's NoData cells are terrain hazards, or that its intersection-error raster is measurement uncertainty.

## Prior art and differentiation

Generic Mars route planning, layered mapping, slope display and 3D walkthroughs already exist. The closest examples found in a bounded search were:

- [MOMAR](https://www.momar.si/): multi-layer Marswalk planning, route alternatives, science stops, terrain and 3D rover/astronaut playback; its authors describe it as a prototype, not a safety system.
- [Tour-de-Mars / MarsWalk](https://github.com/pengvil/Tour-de-Mars): Jezero route and science-stop planning with terrain-derived grid costs, activity and walk-back assumptions.
- [JMARS](https://jmars.mars.asu.edu/) and [ASTTRO/Mars 2020](https://doi.org/10.1029/2022EA002532): established planetary mapping and rover science/terrain planning tools.
- [Another 2026 Martian Map challenge project](https://github.com/RISHI-1453/NASA_Space-Apps_Challenge_Martian_Map): broad layered map and route/slope scenario features.

No close contamination-specific astronaut Marswalk planner surfaced in that search. This does not establish uniqueness. A modest possible contribution is to put a documented sample-integrity concern, a user-editable contact/activities sequence, and the provenance/assumption trail in one understandable scene.

## Judging criteria: current honest read

| Criterion | Current case | Weak point / action |
|---|---|---|
| Impact | Could help a team notice and document potential sample-contact pathways before an EVA. | No validated contamination reduction is shown. Keep the tool framed as protocol planning and traceability. |
| Creativity | Puts sample integrity at the centre of a Marswalk map, with a visible activity-order comparison. | Generic route/3D features are not novel by themselves. Keep them secondary. |
| Validity | Uses real CTX terrain and cited NASA suit/witness-tube evidence, with explicit scenario labels. | No direct Mars astronaut transfer measurements, no local wind model, manually selected route/target. The weakest criterion. Show evidence levels directly in the interface. |
| Relevance | Connects an approach sequence to a concrete sample-integrity question. | Ensure user choice changes a traceability/contact-path statement, not a made-up risk number. |
| Presentation | One question, one route-order toggle, one visible target, a source/assumption panel. | State in the opening that the route is illustrative and no contamination amount is predicted. |

