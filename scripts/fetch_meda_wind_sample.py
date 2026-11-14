#!/usr/bin/env python3
"""Fetch one archived MEDA wind sol and make a small, provenance-labelled plot.

The raw PDS CSVs and labels stay under ignored data/raw/meda/. The tracked
figure and minute sample are generated in docs/figures/. The plot uses every
valid individual wind observation; no directional averaging is performed.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


SOL = 36
ARCHIVE = (
    "https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/"
    "data_derived_env/sol_0000_0089/sol_0036/"
)
WIND_STEM = "WE__0036___________DER_WS__________________P02"
ANC_STEM = "WE__0036___________DER_ANCILLARY___________P03"
FILES = (f"{WIND_STEM}.CSV", f"{WIND_STEM}.xml", f"{ANC_STEM}.CSV", f"{ANC_STEM}.xml")
RAW_DIR = Path("data/raw/meda/sol_0036")
FIGURE_DIR = Path("docs/figures")
INVALID = {"", "999999999", "9999999999", "-999999999"}


def fetch_files() -> dict[str, Path]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}
    for name in FILES:
        path = RAW_DIR / name
        if not path.exists():
            request = urllib.request.Request(
                ARCHIVE + name,
                headers={"User-Agent": "GitWarriors-Clean-Approach/1.0 (MEDA archive reproducibility)"},
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                path.write_bytes(response.read())
        paths[name] = path
    return paths


def read_label(path: Path) -> dict[str, str]:
    root = ET.parse(path).getroot()
    values: dict[str, str] = {}
    for name in ("logical_identifier", "version_id", "start_date_time", "stop_date_time"):
        node = next((e for e in root.iter() if e.tag.split("}")[-1] == name), None)
        if node is not None and node.text:
            values[name] = node.text.strip()
    return values


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def number(row: dict[str, str], field: str) -> float | None:
    value = row.get(field, "").strip()
    if value in INVALID:
        return None
    try:
        result = float(value)
    except ValueError:
        return None
    return result if math.isfinite(result) else None


def ltst_hours(value: str) -> float:
    # Archive format is "ssss hh:mm:ss"; retain the measured LTST clock.
    clock = value.strip().split()[-1]
    hour, minute, second = clock.split(":")
    return int(hour) + int(minute) / 60 + float(second) / 3600


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def make_minute_sample(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Select the actual row nearest each minute mark; never interpolate."""
    selected: dict[int, tuple[float, dict[str, str]]] = {}
    for row in rows:
        speed = number(row, "HORIZONTAL_WIND_SPEED")
        direction = number(row, "WIND_DIRECTION")
        if speed is None or direction is None:
            continue
        hours = ltst_hours(row["LTST"])
        minute_mark = round(hours * 60)
        delta = abs(hours * 60 - minute_mark)
        if minute_mark not in selected or delta < selected[minute_mark][0]:
            selected[minute_mark] = (delta, row)
    return [selected[key][1] for key in sorted(selected)]


def make_figure(wind_rows: list[dict[str, str]], valid: list[dict[str, str]], output: Path) -> None:
    hours = [ltst_hours(row["LTST"]) for row in valid]
    speeds = [number(row, "HORIZONTAL_WIND_SPEED") for row in valid]
    directional = [
        (ltst_hours(row["LTST"]), number(row, "WIND_DIRECTION"))
        for row in valid
        if (number(row, "HORIZONTAL_WIND_SPEED") or 0) > 0
    ]
    max_row = max(valid, key=lambda row: number(row, "HORIZONTAL_WIND_SPEED") or -1)

    plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
    fig, (speed_ax, direction_ax) = plt.subplots(
        2, 1, figsize=(12, 7.4), sharex=True, gridspec_kw={"height_ratios": [1, 1]},
        constrained_layout=True,
    )
    fig.suptitle("Perseverance MEDA · derived wind observations", fontsize=17, fontweight="bold", x=0.06, ha="left")
    fig.text(
        0.06, 0.925,
        "Sol 36 · rover 15.9 m from the landing site · 27–28 March 2021 UTC · point observations",
        color="#48515b", fontsize=10.5,
    )
    speed_ax.scatter(hours, speeds, s=2.0, color="#c65b32", alpha=0.52, linewidths=0, rasterized=True)
    speed_ax.scatter(
        [ltst_hours(max_row["LTST"])], [number(max_row, "HORIZONTAL_WIND_SPEED")],
        s=26, color="#7f2814", zorder=3,
    )
    speed_ax.annotate(
        f"peak {number(max_row, 'HORIZONTAL_WIND_SPEED'):.2f} m/s",
        (ltst_hours(max_row["LTST"]), number(max_row, "HORIZONTAL_WIND_SPEED")),
        xytext=(8, 8), textcoords="offset points", fontsize=9, color="#7f2814",
    )
    speed_ax.set_ylabel("Horizontal speed (m/s)")
    speed_ax.set_ylim(bottom=0)
    speed_ax.grid(axis="y", color="#dce0e3", linewidth=0.7)

    if directional:
        direction_ax.scatter(
            [item[0] for item in directional], [item[1] for item in directional],
            s=2.0, color="#315d70", alpha=0.42, linewidths=0, rasterized=True,
        )
    direction_ax.set_ylabel("Wind-from bearing (clockwise from north, °)")
    direction_ax.set_yticks([0, 90, 180, 270, 360], ["N · 0°", "E · 90°", "S · 180°", "W · 270°", "N · 360°"])
    direction_ax.set_ylim(0, 360)
    direction_ax.set_xlim(0, 24)
    direction_ax.set_xticks(range(0, 25, 2))
    direction_ax.set_xlabel("Local true solar time (LTST) · individual records; gaps are not filled")
    direction_ax.grid(axis="y", color="#dce0e3", linewidth=0.7)
    fig.text(
        0.06, -0.015,
        f"{len(valid):,} paired records shown · {len(wind_rows) - len(valid):,} rows masked · actual observations, no interpolation or directional mean · derived PDS product P02",
        fontsize=8.5, color="#48515b",
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main() -> None:
    paths = fetch_files()
    wind_csv = paths[f"{WIND_STEM}.CSV"]
    wind_xml = paths[f"{WIND_STEM}.xml"]
    ancillary_csv = paths[f"{ANC_STEM}.CSV"]
    ancillary_xml = paths[f"{ANC_STEM}.xml"]
    wind_rows = read_rows(wind_csv)
    ancillary_rows = read_rows(ancillary_csv)
    valid = [
        row for row in wind_rows
        if number(row, "HORIZONTAL_WIND_SPEED") is not None
        and number(row, "WIND_DIRECTION") is not None
    ]
    if not valid:
        raise SystemExit("No valid speed/direction pairs found in the selected PDS product")
    if "ROVER_POSITION_X" not in ancillary_rows[0]:
        raise SystemExit("Ancillary data has no rover-position columns; refusing to infer location")

    label_wind = read_label(wind_xml)
    label_anc = read_label(ancillary_xml)
    expected_products = (
        (label_wind, "urn:nasa:pds:mars2020_meda:data_derived_env:we__0036___________der_ws__________________p", "2.0"),
        (label_anc, "urn:nasa:pds:mars2020_meda:data_derived_env:we__0036___________der_ancillary___________p", "3.0"),
    )
    for label, logical_id, version in expected_products:
        if label.get("logical_identifier") != logical_id or label.get("version_id") != version:
            raise SystemExit(f"Unexpected MEDA product label: {label}")
        if not label.get("start_date_time") or not label.get("stop_date_time"):
            raise SystemExit(f"MEDA label is missing its time coverage: {logical_id}")
    locations = [
        tuple(number(row, key) for key in ("ROVER_POSITION_X", "ROVER_POSITION_Y", "ROVER_POSITION_Z"))
        for row in ancillary_rows
    ]
    locations = [point for point in locations if all(value is not None for value in point)]
    if not locations:
        raise SystemExit("No valid rover-position rows in matching ancillary product")
    if not ("HORIZONTAL_WIND_SPEED" in wind_rows[0] and "WIND_DIRECTION" in wind_rows[0]):
        raise SystemExit("Wind CSV does not match the documented derived schema")
    radii = [math.hypot(point[0], point[1]) for point in locations]
    speeds = [number(row, "HORIZONTAL_WIND_SPEED") for row in valid]
    directions = [number(row, "WIND_DIRECTION") for row in valid]
    minute_rows = make_minute_sample(wind_rows)

    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    sample_path = FIGURE_DIR / "meda-sol-0036-minute-observations.csv"
    fields = [
        "SCLK", "LMST", "LTST", "HORIZONTAL_WIND_SPEED", "WIND_DIRECTION",
        "HORIZONTAL_WIND_SPEED_UNCERTAINTY", "WIND_DIRECTION_UNCERTAINTY",
        "BOTH_BOOMS_USED_FOR_RETRIEVAL", "ROVER_STILL",
    ]
    with sample_path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(minute_rows)

    figure_path = FIGURE_DIR / "meda-sol-0036-wind.png"
    make_figure(wind_rows, valid, figure_path)
    summary = {
        "selected_sol": SOL,
        "wind_product": label_wind,
        "ancillary_product": label_anc,
        "archive_directory": ARCHIVE,
        "source_files": {
            path.name: {"url": ARCHIVE + path.name, "bytes": path.stat().st_size, "sha256": sha256(path)}
            for path in paths.values()
        },
        "wind_rows_total": len(wind_rows),
        "wind_rows_valid_speed_and_direction": len(valid),
        "wind_rows_missing_or_sentinel_speed_or_direction": len(wind_rows) - len(valid),
        "valid_ltst_start": min(valid, key=lambda row: ltst_hours(row["LTST"]))["LTST"],
        "valid_ltst_stop": max(valid, key=lambda row: ltst_hours(row["LTST"]))["LTST"],
        "horizontal_speed_m_s_min": min(speeds),
        "horizontal_speed_m_s_max": max(speeds),
        "direction_deg_min": min(directions),
        "direction_deg_max": max(directions),
        "calm_speed_records_direction_omitted_from_plot": sum((value or 0) == 0 for value in speeds),
        "speed_uncertainty_nonempty_count": sum(number(row, "HORIZONTAL_WIND_SPEED_UNCERTAINTY") is not None for row in wind_rows),
        "direction_uncertainty_nonempty_count": sum(number(row, "WIND_DIRECTION_UNCERTAINTY") is not None for row in wind_rows),
        "both_booms_flag_nonempty_count": sum(bool(row.get("BOTH_BOOMS_USED_FOR_RETRIEVAL", "").strip()) for row in wind_rows),
        "rover_position_frame": "M2020_TOPO, relative to the landing site; +X local north, +Z outward normal, +Y completes right hand frame",
        "rover_position_xy_m": list(locations[0][:2]),
        "rover_horizontal_distance_from_landing_m_range": [min(radii), max(radii)],
        "minute_sample_records": len(minute_rows),
        "minute_sample_method": "actual valid observation nearest each LTST minute mark; no interpolation or averaging",
        "figure": str(figure_path),
        "plot_semantics": "individual speed and wind-from direction observations; no directional mean; no wind field or particle-transport model",
    }
    summary_path = FIGURE_DIR / "meda-sol-0036-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"Fetched and checked Sol {SOL}: {label_wind.get('logical_identifier')} v{label_wind.get('version_id')}")
    print(f"Wind records: {len(valid):,}/{len(wind_rows):,} valid paired values; LTST {summary['valid_ltst_start']} – {summary['valid_ltst_stop']}")
    print(f"Speed range {min(speeds):.2f}–{max(speeds):.2f} m/s; direction {min(directions):.2f}–{max(directions):.2f}° from north")
    print(f"Rover distance from landing: {min(radii):.2f}–{max(radii):.2f} m; figure {figure_path}")
    print(f"Wrote {sample_path} ({len(minute_rows)} actual minute-nearest observations) and {summary_path}")


if __name__ == "__main__":
    main()
