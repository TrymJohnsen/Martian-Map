#!/usr/bin/env python3
"""Export the small ignored Bright Angel rasters into a compact static demo payload.

The source GeoTIFFs remain under ignored data/raw/. The generated JSON contains
only the demonstration crop, not the source scenes.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer


def find_layer(folder: Path, suffix: str) -> Path:
    paths = list(folder.glob(f"*_{suffix}.tif"))
    if len(paths) != 1:
        raise SystemExit(f"Expected exactly one *_{suffix}.tif in {folder}; found {len(paths)}")
    return paths[0]


def marker_from_lonlat(dataset, longitude_east_deg: float, latitude_north_deg: float,
                       valid_mask: np.ndarray, *, label: str, kind: str,
                       source: str, accuracy_note: str) -> dict:
    """Map Mars planetocentric/east lon-lat to the nearest valid raster cell."""
    geographic_crs = dataset.crs.geodetic_crs
    if geographic_crs is None:
        raise ValueError("Raster CRS has no geographic base CRS")
    transformer = Transformer.from_crs(geographic_crs, dataset.crs, always_xy=True)
    x, y = transformer.transform(longitude_east_deg, latitude_north_deg)
    col_float, row_float = (~dataset.transform) @ (x, y)
    col, row = math.floor(col_float), math.floor(row_float)
    if not (0 <= row < dataset.height and 0 <= col < dataset.width):
        raise ValueError(f"{label} coordinate is outside the raster: row={row}, col={col}")
    if not valid_mask[row, col]:
        raise ValueError(f"{label} coordinate falls on NoData: row={row}, col={col}")
    center_x, center_y = dataset.transform @ (col + 0.5, row + 0.5)
    return {
        "kind": kind, "label": label, "row": row, "col": col,
        "longitude_east_deg": longitude_east_deg,
        "latitude_north_deg": latitude_north_deg,
        "grid_cell_center_offset_m": math.hypot(x - center_x, y - center_y),
        "position_source": source,
        "position_accuracy_note": accuracy_note,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/raw/bright-angel-n02"))
    parser.add_argument("--output", type=Path, default=Path("public/data/bright-angel-demo.json"))
    parser.add_argument("--scenario-config", type=Path,
                        help="JSON file with a documented Mars sample-report coordinate and illustrative route markers")
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
        scenario_config = json.loads(args.scenario_config.read_text(encoding="utf-8")) if args.scenario_config else None
        if scenario_config:
            sample_site = scenario_config["sample_site"]
            target_marker = marker_from_lonlat(
                reference, sample_site["longitude_east_deg"], sample_site["latitude_north_deg"], valid,
                label=sample_site["label"], kind="documented_sample_site",
                source=sample_site["position_source"], accuracy_note=sample_site["position_accuracy_note"],
            )
            sample_site = {**sample_site, **target_marker}
            scenario_markers = {"B": target_marker}
            for place_id in ("start", "A"):
                marker = scenario_config["scenario_markers"][place_id]
                row, col = int(marker["row"]), int(marker["col"])
                if not (0 <= row < reference.height and 0 <= col < reference.width and valid[row, col]):
                    raise ValueError(f"Illustrative marker {place_id} is outside valid terrain cells")
                scenario_markers[place_id] = {**marker, "row": row, "col": col}
        else:
            sample_site = None
            scenario_markers = None
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
            "area": scenario_config["area"] if scenario_config else "Jezero landing-region demonstration crop",
            "target_marker": target_marker if scenario_config else {"kind": "illustrative_scenario", "label": "Demo sample target", "row": 76, "col": 78},
            "start_marker": scenario_markers["start"] if scenario_config else {"kind": "illustrative_scenario", "label": "Walk start", "row": 126, "col": 16},
            "survey_marker": scenario_markers["A"] if scenario_config else {"kind": "illustrative_scenario", "label": "Survey waypoint", "row": 16, "col": 137},
            "scenario_markers": scenario_markers,
            "sample_site": sample_site,
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
                "item_title": metadata.get("item_properties", {}).get("title"),
                "missions": metadata.get("item_properties", {}).get("missions"),
                "instruments": metadata.get("item_properties", {}).get("instruments"),
                "gsd_m": metadata.get("item_properties", {}).get("gsd"),
                "license": metadata.get("item_properties", {}).get("license"),
                "ctx_inputs": metadata["item_id"].split("__"),
                "asset_urls": {name: info["source_url"] for name, info in metadata["assets"].items()},
                "credits": "MRO/CTX; NASA; USGS Astrogeology; CC0-1.0; DOI 10.5066/P9JKVWR3",
                "coordinate_limit": "Mars 2015 sphere/ocentric projected geometry; not a traverse-grade navigation product.",
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
