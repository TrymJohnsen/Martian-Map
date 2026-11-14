#!/usr/bin/env python3
"""Find and crop a small overlapping USGS Astrogeology Mars DTM/ortho sample.

Requires Python 3.10+, rasterio, pyproj, numpy, matplotlib, and an internet
connection. Raster data are cropped through GDAL's HTTP range reads; the full
source COG is not saved.
No credentials or NASA API key are required for this public USGS STAC catalog.

Example (landing-area vicinity; adjust bbox to a selected matching footprint):
  python scripts/fetch_mars_samples.py --bbox 77.44 18.42 77.49 18.47
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

API = "https://stac.astrogeology.usgs.gov/api/search"
COLLECTION = "mro_ctx_controlled_usgs_dtms"
OUT = Path("data/raw/jezero")


def fetch_json(url: str) -> dict:
    req = Request(url, headers={"User-Agent": "GitWarriors-MartianMap/0.1"})
    with urlopen(req, timeout=45) as response:
        return json.load(response)


def raster_asset_keys(assets: dict, kind: str) -> list[str]:
    """Return GeoTIFF COG assets whose STAC keys identify the requested layer."""
    tokens = {
        "dtm": ("dtm", "dem"),
        "ortho": ("ortho",),
        "intersection_error": ("intersect",),
    }[kind]
    return [
        key for key, asset in assets.items()
        if any(token in key.lower() for token in tokens)
        and urlsplit(asset.get("href", "")).path.lower().endswith((".tif", ".tiff"))
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bbox", nargs=4, type=float, required=True,
                        metavar=("WEST", "SOUTH", "EAST", "NORTH"),
                        help="planetocentric Mars longitude/latitude search box in degrees")
    parser.add_argument("--max-items", type=int, default=100)
    parser.add_argument("--max-pixels", type=int, default=2_000_000,
                        help="maximum output raster pixels per layer")
    args = parser.parse_args()
    west, south, east, north = args.bbox
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        parser.error("bbox must be ordered WGS84 coordinates")

    try:
        import numpy as np
        import rasterio
        from pyproj import CRS as PyprojCRS
        from rasterio.enums import Resampling
        from rasterio.features import geometry_mask, geometry_window
        from rasterio.warp import transform_bounds, transform_geom
    except ImportError:
        print("Install rasterio and pyproj in the project's chosen environment to crop Mars COG assets.", file=sys.stderr)
        return 2

    query = API + "?" + urlencode({
        "collections": COLLECTION,
        "bbox": f"{west},{south},{east},{north}",
        "limit": args.max_items,
    })
    catalog = fetch_json(query)
    items = catalog.get("features", [])
    if not items:
        print("No intersecting STAC items returned; inspect the collection endpoint and bbox.", file=sys.stderr)
        return 1

    # Select a *single* catalog item with both required assets, so coverage and
    # acquisition geometry can be compared. A quality raster is optional.
    item = None
    for candidate in items:
        ca = candidate.get("assets", {})
        if raster_asset_keys(ca, "dtm") and raster_asset_keys(ca, "ortho"):
            item = candidate
            break
    if item is None:
        print("No returned item has both recognizable DTM and orthophoto GeoTIFF assets.", file=sys.stderr)
        first_assets = items[0].get("assets", {})
        print("First item's assets: " + ", ".join(first_assets), file=sys.stderr)
        return 1
    assets = item["assets"]
    candidates = {kind: raster_asset_keys(assets, kind)
                  for kind in ("dtm", "ortho", "intersection_error")}

    OUT.mkdir(parents=True, exist_ok=True)
    # This is an angular planetocentric Mars ROI. STAC uses GeoJSON-shaped
    # coordinates here, but do not transform it from Earth's EPSG:4326 datum.
    roi_mars_lonlat = {"type": "Polygon", "coordinates": [[[west, south], [east, south], [east, north], [west, north], [west, south]]]}
    summary = {
        "collection": COLLECTION,
        "item_id": item.get("id"),
        "item_datetime": item.get("properties", {}).get("datetime"),
        "item_start_datetime": item.get("properties", {}).get("start_datetime"),
        "item_end_datetime": item.get("properties", {}).get("end_datetime"),
        "item_geometry_planetocentric_lonlat": item.get("geometry"),
        "search_bbox_planetocentric_lonlat": args.bbox,
        "assets": {},
    }
    preview_layers = {}
    source_crses = {}
    for kind in ("dtm", "ortho", "intersection_error"):
        if not candidates[kind]:
            continue
        key = candidates[kind][0]
        asset = assets[key]
        href = asset["href"]
        # Rasterio/GDAL streams COG byte ranges; output is a small GeoTIFF crop.
        with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.tiff"):
            with rasterio.open(href) as src:
                # The projected CRS embeds Mars's spherical, ocentric geodetic
                # CRS. Use that geographic CRS so planetocentric latitudes are
                # not silently converted as terrestrial geodetic coordinates.
                mars_geographic_crs = PyprojCRS.from_wkt(src.crs.to_wkt()).geodetic_crs
                if mars_geographic_crs is None:
                    raise RuntimeError(f"Asset {key} CRS has no geographic base CRS: {src.crs}")
                geometry = transform_geom(mars_geographic_crs.to_wkt(), src.crs, roi_mars_lonlat)
                window = geometry_window(src, [geometry])
                height, width = int(window.height), int(window.width)
                scale = min(1.0, (args.max_pixels / max(1, height * width)) ** 0.5)
                out_h, out_w = max(1, int(height * scale)), max(1, int(width * scale))
                raw = src.read(window=window, out_shape=(src.count, out_h, out_w), resampling=Resampling.nearest)
                transform = src.window_transform(window) * rasterio.Affine.scale(width / out_w, height / out_h)
                inside = geometry_mask([geometry], out_shape=(out_h, out_w), transform=transform, invert=True)
                data = raw.astype("float32", copy=True)
                band_nodata = []
                for band in range(src.count):
                    raw_nodata = src.nodatavals[band]
                    if raw_nodata is None:
                        is_nodata = ~src.read_masks(band + 1, window=window, out_shape=(out_h, out_w)).astype(bool)
                    elif np.issubdtype(type(raw_nodata), np.number) and np.isnan(raw_nodata):
                        is_nodata = np.isnan(raw[band])
                    else:
                        is_nodata = raw[band] == raw_nodata
                    scale_factor = src.scales[band]
                    offset = src.offsets[band]
                    data[band] = data[band] * scale_factor + offset
                    data[band, is_nodata | ~inside] = float("nan")
                    band_nodata.append(raw_nodata)
                if scale < 1:
                    print(f"Note: {kind} sample was resampled to respect --max-pixels; source resolution is retained in metadata.", file=sys.stderr)
                path = OUT / f"{item.get('id')}_{kind}.tif"
                profile = src.profile.copy()
                profile.update(driver="GTiff", height=data.shape[-2], width=data.shape[-1], transform=transform,
                               dtype="float32", nodata=float("nan"), compress="deflate", tiled=True)
                with rasterio.open(path, "w", **profile) as dst:
                    dst.write(data)
                preview_layers[kind] = data
                source_crses[kind] = PyprojCRS.from_wkt(src.crs.to_wkt())
                finite = data[np.isfinite(data)]
                summary["assets"][kind] = {
                    "asset_key": key,
                    "source_url": href,
                    "advertised_size_bytes": asset.get("file:size"),
                    "output": str(path),
                    "crs": str(src.crs),
                    "geographic_crs": str(mars_geographic_crs),
                    "source_resolution_map_units_per_pixel": src.res,
                    "output_resolution_map_units_per_pixel": [abs(transform.a), abs(transform.e)],
                    "output_transform": list(transform)[:6],
                    "units_tag": src.tags().get("UNIT"),
                    "stac_band_units": [band.get("unit") for band in asset.get("raster:bands", [])],
                    "band_scales": src.scales,
                    "band_offsets": src.offsets,
                    "band_nodata_raw": band_nodata,
                    "output_nodata": "NaN; source scales and offsets applied",
                    "shape_bands_rows_cols": list(data.shape),
                    "valid_value_count": int(finite.size),
                    "valid_value_min": float(finite.min()) if finite.size else None,
                    "valid_value_max": float(finite.max()) if finite.size else None,
                    "source_bounds": list(src.bounds),
                    "crop_bounds": list(src.window_bounds(window)),
                }

    if "dtm" in summary["assets"] and "ortho" in summary["assets"]:
        dtm_meta = summary["assets"]["dtm"]
        ortho_meta = summary["assets"]["ortho"]
        ortho_bounds = ortho_meta["crop_bounds"]
        if source_crses["dtm"] != source_crses["ortho"]:
            ortho_bounds = transform_bounds(source_crses["ortho"].to_wkt(), source_crses["dtm"].to_wkt(), *ortho_bounds)
        dtm_bounds = dtm_meta["crop_bounds"]
        overlap = [max(dtm_bounds[0], ortho_bounds[0]), max(dtm_bounds[1], ortho_bounds[1]),
                   min(dtm_bounds[2], ortho_bounds[2]), min(dtm_bounds[3], ortho_bounds[3])]
        summary["dtm_ortho_projected_bounds_overlap"] = {
            "crs": dtm_meta["crs"],
            "bounds": overlap,
            "positive_area": overlap[0] < overlap[2] and overlap[1] < overlap[3],
            "note": "Bounding-box overlap only; this does not assert equal pixel grids or scientific accuracy.",
        }

    # Optional display-only PNG; the GeoTIFFs and metadata remain authoritative.
    try:
        import matplotlib.pyplot as plt
        figure, axes = plt.subplots(1, len(preview_layers), figsize=(6 * len(preview_layers), 5), constrained_layout=True)
        if len(preview_layers) == 1:
            axes = [axes]
        for axis, (kind, layer) in zip(axes, preview_layers.items()):
            if kind == "ortho" and layer.shape[0] >= 3:
                rgb = layer[:3].transpose(1, 2, 0)
                finite = rgb[np.isfinite(rgb)]
                lo, hi = (float(finite.min()), float(finite.max())) if finite.size else (0, 1)
                axis.imshow((rgb - lo) / max(hi - lo, 1e-9))
            else:
                axis.imshow(layer[0], cmap="gray" if kind == "ortho" else "terrain")
            axis.set_title(kind.replace("_", " "))
            axis.set_axis_off()
        preview = OUT / f"{item.get('id')}_preview.png"
        figure.savefig(preview, dpi=140)
        plt.close(figure)
        summary["preview_png"] = str(preview)
    except ImportError:
        summary["preview_png"] = None
        print("Install matplotlib in this environment to write the PNG preview.", file=sys.stderr)
    (OUT / "sample-metadata.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
