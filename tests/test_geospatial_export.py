import unittest
import sys
from pathlib import Path

import numpy as np
import rasterio
from affine import Affine
from rasterio.io import MemoryFile
from rasterio.crs import CRS
from pyproj import Transformer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.build_demo_data import marker_from_lonlat


class MarkerFromLonLatTests(unittest.TestCase):
    def setUp(self):
        self.crs = CRS.from_authority("IAU", "49910")
        geographic_crs = self.crs.geodetic_crs
        self.longitude = 77.30514915
        self.latitude = 18.49747434
        x, y = Transformer.from_crs(geographic_crs, self.crs, always_xy=True).transform(
            self.longitude, self.latitude
        )
        self.transform = Affine.translation(x - 50, y + 50) @ Affine.scale(20, -20)
        self.memory = MemoryFile()
        self.dataset = self.memory.open(
            driver="GTiff", height=5, width=5, count=1, dtype="uint8",
            crs=self.crs, transform=self.transform,
        )

    def tearDown(self):
        self.dataset.close()
        self.memory.close()

    def marker(self, valid):
        return marker_from_lonlat(
            self.dataset, self.longitude, self.latitude, valid,
            label="test target", kind="documented_sample_site",
            source="test source", accuracy_note="nominal only",
        )

    def test_coordinate_maps_to_expected_cell_and_reports_snap_distance(self):
        marker = self.marker(np.ones((5, 5), dtype=bool))
        self.assertEqual((marker["row"], marker["col"]), (2, 2))
        self.assertGreaterEqual(marker["grid_cell_center_offset_m"], 0)
        self.assertLessEqual(marker["grid_cell_center_offset_m"], 20 * 2 ** 0.5 / 2)

    def test_coordinate_on_nodata_is_rejected(self):
        valid = np.ones((5, 5), dtype=bool)
        valid[2, 2] = False
        with self.assertRaisesRegex(ValueError, "NoData"):
            self.marker(valid)

    def test_coordinate_outside_raster_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "outside the raster"):
            marker_from_lonlat(
                self.dataset, 80, 20, np.ones((5, 5), dtype=bool),
                label="test target", kind="documented_sample_site",
                source="test source", accuracy_note="nominal only",
            )


if __name__ == "__main__":
    unittest.main()
