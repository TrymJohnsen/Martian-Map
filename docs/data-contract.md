# Demo data contract

The frontend consumes `public/data/jezero-demo.json`, generated from the ignored raw crops by `scripts/build_demo_data.py`. The checked-in file is a small display derivative; original GeoTIFFs, item metadata and full-resolution sources remain under ignored `data/raw/` or their cited NASA/USGS source URLs.

## Shape and coordinate convention

- Grid dimensions are `width` × `height`; arrays are row-major (`index = row * width + col`).
- `transform` uses the first six GDAL affine terms `[a,b,c,d,e,f]`: `x=a*col+b*row+c`, `y=d*col+e*row+f`.
- Coordinates are in the product CRS, Mars 2015 sphere / ocentric / equirectangular (IAU:49910), metres. `x` increases east and `y` increases north; raster rows increase south because `e` is negative.
- This is a local display grid, not an operational navigation frame. Scenario markers use `{row,col}` and are manually chosen.

## Arrays

- `elevation_m_rounded`: integers rounded to the nearest metre for the display asset; null mask is represented by `valid_mask=0`. Source heights are metres relative to the areoid; the approximate 3–5 m typical vertical precision means the integer encoding is a compact display choice, not added precision.
- `ortho_gray8_display_only`: 0–255 linear stretch of the actual one-band ortho values between the valid source minimum and maximum. The source product metadata in this sample does not identify band units; never label these bytes reflectance or calibrated radiance.
- `intersection_error_cm`: scalar ASP camera-ray separation encoded as centimetres for compact rendering (actual product values were 0.0232–4.3329 m). This is a relative stereo diagnostic, not DTM accuracy or uncertainty.
- `valid_mask`: 1 when all three source assets have a value, 0 for NoData. The source rasters had the same mask: 295/21,904 cells (1.35%). Rendering must omit triangles with any invalid vertex; do not substitute zero elevation.

## Provenance and assumptions

`product` includes collection, item ID, CTX source observation IDs/times, direct source URLs and credits. `target_marker`, `start_marker`, and `survey_marker` have `kind="illustrative_scenario"`; they are not observed samples or recommended EVA locations. The route footprint radius, sequence, waypoints and any contact interpretation are scenario values. Route distance and elevation changes are derived from the raster at grid scale; no mobility or contamination model is implied.

Never:

- merge route or target markers into the observed raster arrays;
- fill or smooth NoData cells for display without explicitly disclosing it;
- treat the displayed intersection error as a contamination probability or terrain uncertainty;
- export the source ortho display stretch as a scientific measurement;
- report terrain route metrics at finer precision than the grid/product supports.
