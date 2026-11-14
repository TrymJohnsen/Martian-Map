# Scientific basis: Clean Approach

## Problem formulation

**For a hypothetical Jezero sedimentary rock core reserved for later organic-molecule and potential-biosignature analysis, how can a crew preserve contact provenance when Earth-associated material on a glove or tool might reach the core through handling?**

The sample type and analysis are motivated by Perseverance's Sapphire Canyon sample, a 6.2 cm sedimentary core taken from the Cheyava Falls rock in Bright Angel. NASA reports that SHERLOC detected organic compounds there, and that organic compounds can also form through non-biological processes. The returned sample could support more detailed studies of its molecular and geological context. This is a *science-interpretation* problem: Earth-sourced organics or biological residues may complicate attribution or mask a Martian signal. The current CTX marker is elsewhere in the Jezero landing-area crop; it is a scenario marker, not Sapphire Canyon and not a selected rock. [NASA sample record](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/), [SHERLOC / Bright Angel research](https://doi.org/10.1038/s41586-025-09413-0).

This is distinct from **forward planetary protection**: preventing viable Earth organisms from surviving, establishing, or spreading on Mars. Nonviable cells, DNA or organic films can affect sample interpretation without establishing life; conversely, biological establishment is not inferred from the presence of an organic molecule. Mars 2020's biological cleanliness requirements and its returned-sample organic cleanliness requirements address related but distinct objectives. They are robotic mission requirements, not human EVA limits. [NASA Planetary Protection requirements](https://sma.nasa.gov/sma-disciplines/planetary-protection/), [Mars 2020 sample-tube controls](https://doi.org/10.1089/ast.2022.0049).

## Mechanisms compared

| Mechanism | Evidence and strength | Data/parameters available | Map relevance and decision | Feasibility |
|---|---|---|---|---|
| **Direct contact or carry-over through gloves, tools and a sample interface** | NASA's EVA Swab Kit report found human-associated organisms on tested ISS/Orion suit exteriors. An 11-day Ramon Crater analog study found taxa shared between post-EVA gloves and soils, and different microbial compositions at sites near the habitat. Perseverance and Curiosity used detailed hardware cleanliness assays, blanks/witnesses and sample-chain controls. This supports a plausible source/contact concern and careful provenance, but no cited study directly measures human glove-to-Mars-sample transfer. | Source observations exist for Earth suits/analogs; rover sample-chain residues and cleaning were characterized for robotic hardware. Human Mars-EVA transfer fraction, glove/tool material and pressure dependence, contact area, source loading and cleaning effectiveness are absent. | Map shows where a scenario activity occurs, not whether a glove touched the sampling interface. A contact graph can support a decision about documenting shared contacts or an assumed isolation boundary. | **Selected qualitatively.** It is the most bounded mechanism with explicit, testable assumptions. |
| **Crew/equipment release, transport and deposition** | Human-associated DNA has been detected on some ISS exterior surfaces; the 2026 NTRS presentation is preliminary DNA evidence from seven ISS surface swabs, not viability or Mars deposition. A rover particle-resuspension study combined models and JPL experiments. MIASMMA explicitly proposes Mars-pressure suit tests and later dispersal modeling. | MIASMMA's measurements are described as underway/planned in its public project record; its preliminary model is assumption-based. No measured Mars EVA emission, local deposition rate, or crew-scale Jezero exposure series was found. MEDA measures a rover-local time series; it cannot alone define a local spatial wind field. | Potentially relevant to exposure, but not computable from the CTX raster or by treating historical point measurements as a field. No location or route ranking is supported. | Rejected from this hackathon model; too many unsupported links. |
| **Activity order / spatial separation** | This is an operational choice, not a physical transfer mechanism. The Ramon Crater study observed temporal/spatial differences but did not test Mars route order or quantify exact transfer. | Without a specified shared object or source/contact state affected by the order, there is no parameter or equation connecting “survey first” to transfer. | Order may change a timeline. It changes a contamination pathway only if it changes an explicit contact/exposure edge. Route length and footprint overlap are geometric context, not transfer. | Keep as a comparison to test this assumption, not as the model itself. |

Primary sources: [NASA EVA Swab Kit](https://ntrs.nasa.gov/citations/20220003128); [Danko et al. 2021 spacesuit study](https://ntrs.nasa.gov/citations/20210017721); [Yair et al. 2021 Ramon Crater analog study](https://doi.org/10.3389/fspas.2021.589147); [Blakkolb et al. 2014 Curiosity sample transfer chain](https://pubmed.ncbi.nlm.nih.gov/25085177/); [Mars 2020 sample-tube contamination accounting](https://doi.org/10.1089/ast.2022.0049); [NASA MIASMMA project record](https://ntrs.nasa.gov/citations/20250006358); [NASA ISS exterior DNA preliminary report](https://ntrs.nasa.gov/citations/20260004204); [Mars 2020 rover particle-resuspension model and lab tests](https://ntrs.nasa.gov/citations/20210005882).

## Selected model and interpretation

We model the direct-contact chain as a qualitative directed graph:

**possible Earth-associated material → EVA glove → sample-contact interface/tool → rock core**

The output is only whether a path exists under the selected scenario assumptions. It has no units and is not a risk score, probability, transferred mass, viable-cell count or recommendation. The source and both contact links are assumptions for the scenario; the evidence supports the possibility of source material on suit/glove surfaces in other settings, not this specific Mars transfer. A hypothetical glove-change/protected-interface boundary removes one modeled edge, but is not a validated crewed-EVA procedure.

Changing the two activity orders while keeping the same glove/tool contacts leaves the modeled path unchanged. This is the main technical insight we can currently support: **order alone cannot be claimed to reduce transfer unless a physical pathway is specified and the order changes that pathway.** The map's route/footprint measurements remain secondary context and do not feed the contact graph.

Full variables, edge semantics, assumptions, code checks and the physical-validation gap are in [docs/model.md](model.md).

## Why not a quantitative contamination model?

A mass balance requires source loading, contacted area and transfer efficiencies for each interface, plus sample mass and an analytically defined contaminant. None is available for a Mars astronaut glove-to-core sequence. Rover values are hardware- and process-specific. No arbitrary transfer fractions or probability distributions are supplied. An airborne model would additionally require release rates, particle properties, local time/space winds, deposition and survival; MIASMMA is a research plan, not measured Mars EVA output. These omissions are material, not small uncertainty bars.

## Data-to-decision boundary

- **MRO/CTX DTM and orthoimage:** real 20.16 m/cell terrain and surface context; display the area and calculate illustrative route geometry only. They contain no glove contamination or biological transport measurement.
- **Mars 2020 Perseverance sample records / SHERLOC:** inform the sample type and why organic/biosignature interpretation matters. The referenced Bright Angel sample is not georegistered to the existing CTX crop and supplies no human transfer parameter.
- **Mars Science Laboratory / Curiosity SAM sample-chain work:** shows how spacecraft-contact residues and a cleaning sequence can affect organic measurements; its numeric values are not transplanted to EVA.
- **MEDA wind sample:** actual Sol 36 derived observations are now available as a historical point series near the Perseverance landing site. They show how recorded wind varied by LTST at that rover location, but the current sample marker is about 0.91 km away and the illustrative scenario has no matched date. The series is therefore background only; it does not feed the contact graph or determine transfer. Wind can move aeolian dust/sand at Jezero, but human-associated release, particle transport, deposition onto a sample, and sample impact require additional mechanisms and measured inputs. [Newman et al. 2022](https://doi.org/10.1126/sciadv.abn3783) documents aeolian observations, not astronaut contamination.
- **MEDA temperature and UV/visible/IR radiation products:** archived, but not used. Temperature would need a defined crew/sample thermal decision and a thermal response model. Optical radiometry would need exposure duration, shielding/dust and material-specific survival or degradation response. These are not RAD-like ionizing-radiation measurements.
- **MOLA/HRSC/THEMIS:** not included; their broad terrain/mineral context would not fix the missing contact or airborne-transfer parameters.

The source-level metadata and limitations are tracked in [docs/data-sources.md](data-sources.md). The existing CTX crop and derivative remain unchanged.

The MEDA data show a concrete thing that was not previously observable: the historical wind speed and wind-from direction change during actual local-time observation windows near the landing site; a steady or route-wide vector would conceal that variation. They do **not** tell the user whether a hypothetical astronaut source plume reaches the core. The derived-wind index has no listed product for the Sapphire Canyon sampling sol, the target is not co-located with Sol 36's rover point, MEDA uncertainty/booms-used fields are empty in this product, and no human-particle release/deposition model exists. Recommendation: keep this data test and figure as scientific background; do not add a wind toggle or arrow to the app yet.

MEDA temperature products include calibrated air temperature (ATS) and calibrated/derived thermal-infrared products (TIRS); radiation/dust records include optical UV-to-near-IR measurements (RDS). These could support thermal exposure or photochemical exposure questions only after defining a decision and the missing suit/sample/material response parameters. Curiosity RAD is a distinct energetic-particle instrument in Gale, not MEDA optical irradiance and not local Jezero data.

## Scientific limitations

1. No direct human Mars-EVA-to-sample transfer measurement is available here.
2. The qualitative graph says a path is *possible under assumed contacts*; it cannot validate that the path occurs or that the proposed isolation step prevents transfer.
3. The activity-order comparison does not change the direct-contact graph when the interfaces are held constant. This argues against claiming a route-order mitigation from current evidence.
4. A map route is not a contact record. The drawn target, start, survey activity and footprint are illustrative; no traversal, contact, exposure, deposition or safety model is present.
5. The Bright Angel/Sapphire Canyon science context and the current CTX scene are not co-located. The marker must not be presented as the named Perseverance sample.
6. Sample contamination control and preventing viable organisms from establishing on Mars are not interchangeable goals.
