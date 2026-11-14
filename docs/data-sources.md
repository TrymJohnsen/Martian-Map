# Data sources and sample status

## Verified Perseverance target

**Sapphire Canyon**, sample 25 (`M2020-1215-28`), is a 6.2 cm sedimentary rock core collected from the rock named **Cheyava Falls** in the **Bright Angel** region of **Neretva Vallis**, Jezero. NASA records collection/sealing on 21 July 2024, Sol 1215. Perseverance's SHERLOC observations and later analysis of organic and mineral associations make the sample's origin and handling history relevant to scientific interpretation; these observations do not prove past life. See [NASA's sample record](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/), the [PDS Mars 2020 Sample Dossier, initial report page 120](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume4.pdf#page=120), and [Murphy et al. (2025)](https://doi.org/10.1038/s41586-025-09413-0).

The PDS report lists `Latitude (N), Longitude (E), Elevation` for the sample report as **18.49747434°N, 77.30514915°E, −2354.235808 m**. It associates these coordinates with sample designation `M2020-1215-28`; this is used as the sample-site position, not a later rover waypoint. The page does **not** specify a coordinate datum, horizontal accuracy, or positional uncertainty. Decimal places are not evidence of location accuracy. The map assumes the report's north/east values correspond to the CTX product's Mars 2015 ocentric, east-positive coordinate frame and marks that relationship as nominal. USGS describes planetocentric/east-positive as the adopted modern Mars mapping convention; the original sample report itself does not spell out that convention ([USGS Mars coordinate systems](https://planetarynames.wr.usgs.gov/Page/MARS/system)).

## CTX coverage and selected product

The earlier 148×148 crop around the landing site did not cover Bright Angel. A USGS STAC search for **77.28–77.34°E, 18.47–18.52°N** returned several overlapping MRO/CTX stereo products. Three bounded candidates were inspected at the exact report coordinate. Product `P18_007925_1987_XN_18N282W__P19_008650_1987_XI_18N282W` has NoData at that point, so its broad footprint overlap was insufficient. `P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W` and the selected `N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W` both have valid terrain at the sample coordinate and route cells. At the mapped S/A/B cells, N02 ray separation is lower at S and B but slightly higher at illustrative A than P02; this diagnostic is only relative stereo self-consistency, not proof of absolute accuracy. P02 has fewer NoData pixels overall (1.25% versus 3.58% for N02), so the selection does not imply that every N02 cell is better.

The selected stereo item is in the [USGS Astrogeology MRO CTX controlled-DTM STAC collection](https://stac.astrogeology.usgs.gov/api/collections/mro_ctx_controlled_usgs_dtms). Its two source observation IDs are `N02_063242_1988_XN_18N283W` and `N03_063532_1988_XN_18N283W`. The STAC license is CC0-1.0; collection DOI is [10.5066/P9JKVWR3](https://doi.org/10.5066/P9JKVWR3). The STAC `datetime` is a catalog timestamp, not verified acquisition time; acquisition dates are not asserted here. Credit MRO/CTX, NASA and USGS Astrogeology; cite Laura et al. (2023) and both source image IDs.

| Layer | Actual selected COG | Verified crop result |
|---|---|---|
| DTM | [N02/N03 DTM COG](https://astrogeo-ard.s3-us-west-2.amazonaws.com/mars/mro/ctx/controlled/usgs/N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W/N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W_dtm.tif) | 175×147 cells, 20.399228 m/pixel. Mars 2015 sphere/ocentric equirectangular CRS (IAU:49910), metres, east-positive longitude; heights relative to the areoid. Valid values −2376.467 to −1841.575 m. |
| Orthoimage | [N02/N03 orthoimage COG](https://astrogeo-ard.s3-us-west-2.amazonaws.com/mars/mro/ctx/controlled/usgs/N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W/N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W_orthoimage.tif) | Same shape, transform, CRS and NoData mask as DTM. One band; source band units are not provided in the available metadata. The app applies a display-only grayscale stretch. |
| Stereo diagnostic | [N02/N03 intersection-error COG](https://astrogeo-ard.s3-us-west-2.amazonaws.com/mars/mro/ctx/controlled/usgs/N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W/N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W_intersection_error.tif) | Same crop/grid/mask. Valid values 0.022932–8.550796 m. ASP defines this as separation of stereo camera rays; it is not DTM accuracy or an uncertainty map. |

The shared crop contains **921 NoData cells of 25,725 (3.58%)**. NoData stays blank; the mesh and profile do not bridge missing cells. The PDS coordinate converts to cell `(row 66, col 73)`, which has a valid value in all three layers. The projected coordinate lies **6.67 m** from the cell centre; this is a raster snap distance, not positional uncertainty. The CTX cell elevation there is **−2324.475 m**, 29.76 m above the PDS report's **−2354.236 m** value. The reason for this vertical discrepancy is unresolved; we do not treat the values as a precise vertical registration or use their difference as a quality estimate. The ~20.4 m posting gives regional surface context, not the drill hole or sample texture. No product-specific quality flag was present in the crop.

The map footprint and PDS sample report provide independent product/sample records that overlap in Mars coordinates. The marker lands in valid cells, but no independent high-resolution image comparison resolves the drill location; local registration accuracy is not established. The former landing-area product's STAC footprint overlapped the coordinate while its target pixel was NoData, illustrating why footprint overlap alone is insufficient.

## Scenario and contribution by mission

The map uses the observed CTX surface and DTM around Sapphire Canyon as broad location/terrain context. **B** is the nominal sample-report coordinate snapped to a valid cell. **A** is a hypothetical earlier sampling site on valid terrain with no assigned rover observation, outcrop name, mineral result, or precise field coordinate. The astronaut traverse and handling events are illustrative; they are not historical Perseverance events. The same S→A→B route is used in every plan.

The scenario can be summarized in two sentences: *An astronaut collects a hypothetical sample at A, then visits the rock where Perseverance collected Sapphire Canyon at B. The comparison asks whether handling at A could matter when interpreting B; A has no claimed geological observation.*

- **MRO/CTX** contributes the registered surface image, DTM and a stereo-processing diagnostic, all from one MRO/CTX product. Terrain displays location and broad relief; it does not create contact edges.
- **Mars 2020/Perseverance** contributes a named, documented science target and sample-report coordinate. It is not a separate raster layer. The PDS witness-tube/CacheCam material remains a robotic sample-control precedent, not an astronaut procedure.
- **MEDA** provides a separate Sol 36 wind example near the landing site. It is not a Bright Angel wind field and does not enter the contact model.

The user can investigate one concrete question: **under the stated contact assumptions, which possible source histories remain connected to sample B under each handling plan?** Without the Mars map, the event graph could still be replayed, but the sample target, regional setting, shared terrain footprint and route context would be lost. Geography adds scientific location context; it does not predict material transfer or change the modeled path result. The scene remains a focused MRO terrain map with a Mars 2020 geospatial target, not a multi-mission raster stack.

### Reproduce the local derivative

```bash
.venv/bin/python scripts/fetch_mars_samples.py \
  --bbox 77.28 18.47 77.34 18.52 \
  --item-id N02_063242_1988_XN_18N283W__N03_063532_1988_XN_18N283W \
  --output-dir data/raw/bright-angel-n02
.venv/bin/python scripts/build_demo_data.py \
  --input data/raw/bright-angel-n02 \
  --output public/data/bright-angel-demo.json \
  --scenario-config scripts/bright-angel-scenario.json
```

Original GeoTIFFs and metadata remain ignored under `data/raw/`. The checked-in JSON is a display derivative; it checks CRS/transform/grid and shared NoData mask, rounds DTM values to metres for display, contrast-stretches the ortho for display, and retains ray separation as a diagnostic layer.

## MEDA wind feasibility sample

The official [PDS Atmospheres MEDA page](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html) recommends derived products when a sensor has them; its [RDR SIS](https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/document/meda_env_rdr_sis.pdf) describes derived wind fields, units and ancillary metadata. The downloadable [derived-wind index](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/logs/mars2020_meda_derived_wind.csv) lists wind products through Sol 315 and has no entry for the Perseverance Sapphire Canyon collection on Sol 1215.

| Check | Actual result |
|---|---|
| Wind product | `urn:nasa:pds:mars2020_meda:data_derived_env:we__0036___________der_ws__________________p`, version 2.0 (`WE__0036___________DER_WS__________________P02.CSV` + PDS4 label). Direct [CSV](https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_derived_env/sol_0000_0089/sol_0036/WE__0036___________DER_WS__________________P02.CSV) and [label](https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_derived_env/sol_0000_0089/sol_0036/WE__0036___________DER_WS__________________P02.xml). |
| Time / sol | Label UTC span `2021-03-27T05:42:18.038Z`–`2021-03-28T03:52:34.167Z`, Sol 36. Paired valid rows span LTST `0036 01:06:50`–`0036 22:40:04`, with unsampled intervals. |
| Measurement | `HORIZONTAL_WIND_SPEED`, m/s; 0.00–16.24 among valid pairs. `WIND_DIRECTION`, degrees clockwise from north; 0.57–355.57°. The field is north-relative and is not converted into a CTX vector. [Newman et al. 2022](https://doi.org/10.1126/sciadv.abn3783). |
| Position | Matching ancillary product reports rover position `(13.94, −7.63, 0.53) m` relative to the landing site (M2020_TOPO frame), 15.89 m away horizontally. This is landing-region context, not a Bright Angel sample observation. |
| Missingness / quality metadata | 40,543 of 41,538 rows have paired valid speed/direction; 995 are excluded. Speed uncertainty, direction uncertainty and `BOTH_BOOMS_USED_FOR_RETRIEVAL` are empty in all rows. No uncertainty bars or boom-agreement check are implied. |
| Figure / reproducibility | [Observation plot](figures/meda-sol-0036-wind.png); [minute-nearest subset](figures/meda-sol-0036-minute-observations.csv); [metadata/checksums](figures/meda-sol-0036-summary.json). Rebuild with `.venv/bin/python scripts/fetch_meda_wind_sample.py`. No interpolation or direction average is used. |

MEDA's sensor measures near the rover and the sample is Sol 36 (2021), while Sapphire Canyon was collected on Sol 1215 (2024). Neither site nor time matches; the plot is a historical context input only. No wind field, contamination transport estimate, contact probability, safety threshold, or contamination-reduction result is produced.

## Display context additions (2026-11-14)

### MEDA aggregation and direction

`node scripts/build_meda_context.cjs` reads the checked-in 337 actual minute-nearest observations, not the full 41,538-row archive. It computes arithmetic speed means by integer LTST hour and counts of non-calm directions in eight 45° sectors, clockwise from north, centred on compass directions. These are sample means, not time-weighted hourly or daily climatology. Empty hours have count zero and JSON null mean; no interpolation, zero filling or arithmetic direction averaging occurs. Invalid/missing paired fields are excluded and counted. Calm observations enter speed means but not directional bins. The original archive has 995 invalid pairs; these were already excluded before the minute subset. Uncertainty fields are absent, not zero.

Direction is wind-from bearing clockwise from north, consistent with the existing source-processing script, source figure and MEDA derived-wind description above. No rover-relative direction transformation or CTX georeferencing is performed. The checked-in source summary identifies the historical rover point near the landing site. It does not establish the requested approximate 9 km distance to B; the card omits that distance instead of asserting it. Sol 36 is 2021-03-27/28, not the sampling sol or the illustrative EVA date.

### Curiosity RAD primary measurement

Hassler et al. (2014), *Mars’ Surface Radiation Environment Measured with the Mars Science Laboratory’s Curiosity Rover*, **Science 343**, 1244797, [doi:10.1126/science.1244797](https://doi.org/10.1126/science.1244797). Values verified in the primary article text and Table 1, available through [AAAS Science in the Classroom](https://www.scienceintheclassroom.org/research-papers/curiosity-tells-all-about-mars-radiation-environment).

The tissue-like E detector gave average total galactic cosmic ray absorbed dose rate **0.210 ± 0.040 mGy/day** in Gale crater, about −4.4 km MOLA elevation, over the first approximately 300 sols (7 August 2012–1 June 2013), near solar-cycle-24 maximum. The article describes the mean as a 300-day period. These are rates per day as published, not silently converted to per-sol rates. The **0.64 ± 0.12 mSv/day** dose-equivalent rate combines measured tissue dose rate with the mean radiation quality factor; it is a derived quantity, not a second direct detector reading. The GCR average is distinct from separately discussed solar energetic particle events.

Perseverance has no dedicated RAD-equivalent energetic-particle detector; MEDA optical radiometry is not such a measurement. Instrument suites: [NASA Perseverance instruments](https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/) and [NASA Curiosity RAD](https://science.nasa.gov/mission/msl-curiosity/science-instruments/rad/). These Gale data supply historical context only: **Gale, not Jezero**. No radiation map, local Jezero dose, crew exposure calculation or safety threshold is inferred.
