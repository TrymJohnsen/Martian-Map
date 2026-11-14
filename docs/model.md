# Qualitative direct-contact pathway model

## Problem being represented

For a hypothetical Jezero sedimentary rock core reserved for later organic-molecule and potential-biosignature analysis, how can a crew preserve contact provenance when Earth-associated material on a glove or tool might reach the core through handling?

The science anchor is Perseverance's sedimentary Sapphire Canyon core from Bright Angel: SHERLOC detected organic compounds in its source rock, while the origin and significance of those compounds remain open scientific questions. The sample/site is outside the current CTX crop; the map's target marker is illustrative and is not Sapphire Canyon. The model therefore does not assign the observed SHERLOC product to the map location.

This concerns **scientific interpretation of a sample**. A nonliving organic film, shed cell, or DNA-bearing particle may complicate an organic/biosignature analysis. Forward planetary protection asks whether viable Earth organisms could survive, reproduce, or spread on Mars. This model does not estimate viability, establishment, or ecological effect.

## Mechanisms considered

| Mechanism | What supports it | Missing inputs for a quantitative Marswalk model | Map/model relevance | Decision supported now | Hackathon fit |
|---|---|---|---|---|---|
| **Direct contact / carry-over through glove, tool, or sample interface** | NASA suit sampling finds microbial material on suit exteriors; an Earth Mars-analog EVA study found human-associated taxa on nearby soils and overlap with post-EVA gloves; rover sample chains use measured cleanliness, witness materials, and blanks. | Human Mars EVA source loading, glove/tool/sample material-specific transfer fractions, pressure/force/contact area, cleaning efficacy, sample mass and exact contact events. None is a measured crewed-Mars set. | Activity locations can be shown on CTX. CTX does not provide contamination values. A directed graph can make an assumed contact chain inspectable. | Record which contacts may share a glove/interface, or inspect the effect of an explicitly assumed isolation boundary. | **Selected**, qualitatively; small, testable, no invented rates. |
| **Crew/equipment release → atmospheric transport → deposition** | Human-associated DNA has been detected on sampled ISS exterior surfaces; rover particle-resuspension research combined models with JPL experiments. MIASMMA is developing Mars-pressure suit measurements. A real MEDA Sol 36 derived-wind time series was fetched near the landing site, but it measures only wind at one rover point, not human particles or deposition. | Mars EVA release rate, viability/decay, particle-size distribution, wind at the relevant activity and target locations/time, deposition/adhesion and target interception. MIASMMA measurements are planned; preliminary model outputs use assumptions. | A point time series cannot define a spatial wind field or crew-route exposure model. The CTX raster cannot parameterize transport. The Sol 36 time/site also does not match the app's illustrative sample event. | Could eventually document observed atmospheric conditions or compare a carefully labelled geometric wind bearing if time/site are matched. | Rejected for this prototype: no locally supported particle/deposition parameter chain. |
| **Activity order / spatial separation** | It is a crew-operational choice; analog work reports spatial and temporal microbial patterns, but not a Mars route-order experiment. | An explicit causal link from order to changed source/contact/exposure state. A route crossing or distance alone supplies none. | It can order tasks on the scene, but route length/footprint overlap are only geometry. | Changes the timeline; supports contamination conclusions only if a mechanism edge changes. | Not a standalone physical mechanism. Kept as a comparison to show when order does **not** change the modeled pathway. |

Sources: [NASA EVA Swab Kit](https://ntrs.nasa.gov/citations/20220003128); [Danko et al., spacesuit microbial communities](https://ntrs.nasa.gov/citations/20210017721); [Ramon Crater analog study](https://doi.org/10.3389/fspas.2021.589147); [Mars 2020 sample-tube contamination controls](https://doi.org/10.1089/ast.2022.0049); [NASA MSL sample-transfer contamination study](https://pubmed.ncbi.nlm.nih.gov/25085177/); [NASA MIASMMA status](https://ntrs.nasa.gov/citations/20250006358); [PDS MEDA archive and product documentation](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html); [Newman et al. 2022 Jezero wind/aeolian study](https://doi.org/10.1126/sciadv.abn3783); [Mars 2020 particle-resuspension study](https://ntrs.nasa.gov/citations/20210005882).

## Model and variables

Use a directed contact graph \(G=(V,E)\). The nodes are:

- \(R\): possible Earth-associated material on an EVA glove (source **assumption**, not a local Mars observation),
- \(G\): EVA glove,
- \(I\): sample-contact interface/tool,
- \(S\): rock core.

The baseline edges are:

\[
R\to G,\quad G\to I,\quad I\to S.
\]

Each edge means “a source/contact link is assumed possible in this scenario.” It does **not** mean transfer has been observed or that an amount moved. The output is the Boolean reachability indicator

\[
\chi_{\mathrm{path}} = q\;c_{GI}\;c_{IS}\;(1-b),
\]

where:

- \(q\in\{0,1\}\): whether a possible source is included in the scenario,
- \(c_{GI}\in\{0,1\}\): whether glove-to-interface contact is assumed,
- \(c_{IS}\in\{0,1\}\): whether the interface contacts the sample,
- \(b\in\{0,1\}\): whether a hypothetical isolation boundary cuts the old-glove-to-interface link.

All inputs and \\(\\chi_{\\mathrm{path}}\\) are dimensionless logical states. They are not probabilities, contamination scores, concentrations, viable counts, or risk. The implementation uses graph reachability rather than a mass balance so the topology stays inspectable. Activity order is recorded separately as a two-event timeline; with the same contacts and no explicit mechanism edge changed by time, **both orders return the same source-to-sample path**.

The interface offers an optional illustrative boundary: “glove change and protected, dedicated sample-contact interface before collection.” In the graph this removes \(G\to I\). If enabled, the graph has no path along this modeled chain. This is a conditional logical result, not evidence that the boundary is effective, an approved protocol, or that all contamination routes are absent.

## Observed, derived and assumed

- **Observed, external source evidence:** NASA's EVA Swab Kit cultured 235 CFU from sampled suit exteriors across 26 bacterial species and one fungal species in its tested suits/handling conditions. A separate NASA spacesuit study reported cultivable counts ranging below detection to \(9\times10^2\) CFU per 25 cm², with assay/location dependence. These are Earth spacecraft/suit observations, not Mars sample transfer data. [EVA Swab Kit](https://ntrs.nasa.gov/citations/20220003128), [spacesuit study](https://ntrs.nasa.gov/citations/20210017721).
- **Observed, analogous contact evidence:** the 11-day Ramon Crater analog study sampled soils and nitrile gloves before/after EVA for six analog astronauts; taxa overlapped. The authors state their method could not quantify exact contamination. Co-occurrence does not establish transfer direction or a glove-to-sample rate. [Study](https://doi.org/10.3389/fspas.2021.589147).
- **Observed, robotic method evidence:** Curiosity's sampling chain was assayed and controlled; the team estimated hardware residues and bounded some sample contamination after a particular dilution-cleaning sequence. Those values depend on that rover's surfaces, instruments, procedure and assay; none is used as an astronaut parameter. [Blakkolb et al.](https://pubmed.ncbi.nlm.nih.gov/25085177/).
- **Derived by this prototype:** whether a directed graph path exists under the selected Boolean assumptions; and separately, CTX-derived route length/profile.
- **Scenario assumptions:** that Earth-associated material is present on a glove; that the glove and sample-contact interface touch; that the interface contacts the sample; and that the hypothetical isolation step removes the specified edge.

## Why there is no mass-balance or transport result

A contact mass balance could be written symbolically as

\[
m_S = L_G A_{GI}\eta_{GI}\eta_{IS},
\]

with glove surface loading \(L_G\) (mass/area), contacted area \(A_{GI}\) (area), and dimensionless transfer fractions \(\eta_{GI},\eta_{IS}\). We lack Mars-EVA values for all of these terms, as well as a defined contaminant and sample mass. Published rover transfer-chain values cannot fill those gaps. Assigning arbitrary ranges or distributions would create a quantitative answer without scientific basis, so this prototype does not do so.

Likewise, an airborne model would require source emission and size/composition, atmospheric transport, loss/viability, deposition and sampling times. MIASMMA's NTRS record describes planned suit leakage measurements and modeling, not a released empirical Mars EVA dataset. We do not use preliminary simulated dispersal as observed local exposure.

## Verification and limits

`node --test tests/contact-model.test.cjs` checks hand-verifiable logic:

1. Baseline path: \(R\to G\to I\to S\).
2. Changing only activity order changes the event order but not path reachability.
3. No source, no glove/interface contact, or no interface/sample contact yields no path.
4. Enabling the modeled isolation boundary removes the path.
5. Unknown activity labels are rejected.

These checks verify code against the graph definition; they are **numerical/logical verification**, not physical validation. Physical validation would require a defined Mars-relevant glove/tool/material protocol, blanks and controls, measured source loading, repeated transfer experiments at relevant pressure/environment, and a corresponding analytical assay. A witness/blank can document a background; it does not itself stop a contact path.
