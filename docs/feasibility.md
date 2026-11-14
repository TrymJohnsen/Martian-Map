# Feasibility: Clean Approach

## Science question and sample context

The prototype is about preserving contamination provenance for a hypothetical Jezero sedimentary core intended for later organic-molecule and potential-biosignature analysis. Perseverance's Bright Angel / Cheyava Falls / Sapphire Canyon record motivates the kind of science, but that site is outside the existing CTX crop. The current target marker remains an illustrative scenario coordinate; it must not be described as the named sample/site.

This is distinct from preventing viable organisms from establishing on Mars. Human-associated organic residues and nonviable biological material could affect analytical interpretation without implying survival or growth; this app models neither life establishment nor planetary risk.

## Mechanism decision

Direct contact through glove → sample-contact interface → core is the best scoped mechanism. The literature documents source materials on suit surfaces, analog glove/soil microbial co-occurrence, and the care required for robotic sample transfer chains. It does not provide direct human Mars EVA glove-to-sample transfer values. Therefore the implementation is a qualitative graph-reachability check only.

Activity order is not itself a transport mechanism. Holding the same assumed glove/tool contacts constant yields the same possible contact path for collect-first and survey-first. A hypothetical isolation boundary (glove change plus protected dedicated sample interface) removes one assumed edge from the graph; this does not establish that the action is effective or a validated EVA procedure.

Airborne release and deposition are important but excluded. MIASMMA describes planned suit leakage measurements and model development; rover particle resuspension work and ISS exterior DNA are not human Mars surface deposition parameters. MEDA temporal point measurements do not automatically provide a local continuous crew-route wind field.

## Model and calculations

See [docs/model.md](model.md) for graph variables, Boolean reachability equation, assumptions, no-source/no-contact cases, and hand-verifiable checks. The calculated output is only “a directed source-to-sample path exists in this scenario” or “no path exists in this graph.” It is not a probability, dose, concentration, contamination risk, or efficacy estimate.

The existing CTX data remain useful for rendering Jezero relief, locating the illustrative activities, and calculating a map-derived straight-line distance and elevation profile. Its route geometry does not enter the contact graph. Footprint overlap is not interpreted as a glove touch, exposure, or transfer event.

## Mission data and challenge fit

- **MRO / CTX:** currently the only georeferenced map layer; exact 148×148 crop, CRS, grid, NoData and limits are preserved in `docs/data-sources.md`.
- **Mars 2020 / Perseverance:** sample catalogue and SHERLOC evidence support the science scenario; currently not spatially overlaid. No per-product Sol-1215 data was downloaded because host DNS from the shell failed.
- **MSL / Curiosity:** its published sample-transfer assays show how robotic hardware cleaning and contamination knowledge affect organic-analysis interpretation. Values are not reused as human parameters.
- **MEDA, MOLA/HRSC/THEMIS:** considered but do not parameterize direct contact. No gratuitous layers are added.

The app now contains two NASA mission contexts but still has only one mapped mission's data. The challenge requirement for an integrated georeferenced multi-mission map is therefore still open; don't claim it is satisfied.

## What remains unvalidated

- Whether the assumed source is present on a particular human EVA glove/tool.
- Whether the specified glove/tool/sample contact occurs in a real procedure.
- Transfer probability or mass, material dependence, pressure/environment effects, and efficacy of a glove-change or protected tool boundary.
- Any route-based effect, contamination reduction, safety benefit or biological establishment.

The graph tests only its own logic. Physical validation would require a defined, Mars-relevant glove/tool/sample material protocol with source assay, blanks, measured contact areas, controlled environmental conditions, measured transfer and an analytical detection method.
