#!/usr/bin/env python3
"""Export the small ignored Jezero rasters into a compact static demo payload.

The source GeoTIFFs remain under ignored data/raw/. The generated JSON contains
only the 148x148 demonstration crop, not the source scenes.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import rasterio


def find_layer(folder: Path, suffix: str) -> Path:
    paths = list(folder.glob(f"*_{suffix}.tif"))
    if len(paths) != 1:
        raise SystemExit(f"Expected exactly one *_{suffix}.tif in {folder}; found {len(paths)}")
    return paths[0]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/raw/jezero"))
    parser.add_argument("--output", type=Path, default=Path("public/data/jezero-demo.json"))
    args = parser.parse_args()

    metadata = json.loads((args.input / "sample-metadata.json").read_text(encoding="utf-8"))
    layers = {}
    datasets = {}
    for name in ("dtm", "ortho", "intersection_error"):
        path = find_layer(args.input, name)
        src = rasterio.open(path)
        datasets[name] = src
        a = src.read(1, masked=True).astype("float64")
        a = a * src.scales[0] + src.offsets[0]
        layers[name] = a

    try:
        reference = datasets["dtm"]
        for name, src in datasets.items():
            if (src.shape != reference.shape or src.crs != reference.crs
                    or not np.allclose(tuple(src.transform), tuple(reference.transform))):
                raise SystemExit(f"{name} does not share the DTM grid; refusing to combine rasters")
        masks = {name: np.ma.getmaskarray(array) for name, array in layers.items()}
        if not (np.array_equal(masks["dtm"], masks["ortho"])
                and np.array_equal(masks["dtm"], masks["intersection_error"])):
            raise SystemExit("Layer NoData masks differ; export them separately rather than implying alignment")

        dtm = layers["dtm"]
        ortho = layers["ortho"]
        err = layers["intersection_error"]
        valid = ~masks["dtm"]
        z = np.rint(dtm.filled(0)).astype(np.int16)
        z[~valid] = 0
        ortho_values = ortho.compressed()
        ortho_min, ortho_max = float(ortho_values.min()), float(ortho_values.max())
        ortho_gray = np.zeros(reference.shape, dtype=np.uint8)
        if ortho_max > ortho_min:
            stretched = np.clip((ortho.filled(ortho_min) - ortho_min) / (ortho_max - ortho_min), 0, 1)
            ortho_gray[valid] = np.rint(stretched[valid] * 255).astype(np.uint8)
        error_cm = np.rint(err.filled(0) * 100).astype(np.uint16)
        error_cm[~valid] = 0

        output = {
            "schema_version": 1,
            "area": "Jezero landing-region demonstration crop",
            "target_marker": {"kind": "illustrative_scenario", "label": "Demo sample target", "row": 76, "col": 78},
            "start_marker": {"kind": "illustrative_scenario", "label": "Walk start", "row": 126, "col": 16},
            "survey_marker": {"kind": "illustrative_scenario", "label": "Survey waypoint", "row": 16, "col": 137},
            "raster": {
                "width": reference.width,
                "height": reference.height,
                "crs_wkt": reference.crs.to_wkt(),
                "transform": list(reference.transform)[:6],
                "pixel_size_m": [abs(reference.transform.a), abs(reference.transform.e)],
                "height_reference": "metres relative to Mars areoid",
                "dtm_rounding_for_display_m": 1,
                "nodata_count": int(masks["dtm"].sum()),
                "valid_count": int(valid.sum()),
                "elevation_min_m_source": float(dtm.min()),
                "elevation_max_m_source": float(dtm.max()),
                "orthophoto_display_stretch_source_min": ortho_min,
                "orthophoto_display_stretch_source_max": ortho_max,
                "orthophoto_units": "not specified in this sample metadata; 8-bit array is display-only contrast stretch",
                "intersection_error_unit": "m, ASP triangulation ray separation (diagnostic; not DTM accuracy or uncertainty)",
                "intersection_error_min_m": float(err.min()),
                "intersection_error_max_m": float(err.max()),
            },
            "product": {
                "collection": metadata["collection"],
                "item_id": metadata["item_id"],
                "ctx_inputs": ["P18_007925_1987_XN_18N282W", "P19_008650_1987_XI_18N282W"],
                "ctx_observation_times_utc": ["2008-04-05T00:01:32Z", "2008-05-31T12:10:26Z"],
                "asset_urls": {name: info["source_url"] for name, info in metadata["assets"].items()},
                "credits": "MRO/CTX; USGS Astrogeology; CC0-1.0; DOI 10.5066/P9JKVWR3",
                "planetographic_warning": "Coordinates and pixel geometry are Mars 2015 ocentric; this crop is not a traverse-grade navigation product.",
            },
            "arrays": {
                "elevation_m_rounded": z.ravel().tolist(),
                "ortho_gray8_display_only": ortho_gray.ravel().tolist(),
                "intersection_error_cm": error_cm.ravel().tolist(),
                "valid_mask": valid.astype(np.uint8).ravel().tolist(),
            },
        }
    finally:
        for src in datasets.values():
            src.close()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {args.output} ({args.output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
