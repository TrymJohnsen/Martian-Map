const test = require("node:test");
const assert = require("node:assert/strict");
const geometry = require("../public/terrain-geometry.js");

const raster = { width: 3, height: 3, pixel_size_m: [10, 10] };

test("east, north, and up use metres with equal world scale before camera projection", () => {
  const origin = geometry.worldPoint(1, 1, 100, raster, 100);
  const east = geometry.worldPoint(1, 2, 100, raster, 100);
  const north = geometry.worldPoint(0, 1, 100, raster, 100);
  const up = geometry.worldPoint(1, 1, 110, raster, 100);
  const length = (point) => Math.hypot(point.x - origin.x, point.y - origin.y, point.z - origin.z);
  assert.equal(east.x > origin.x, true);
  assert.equal(north.y > origin.y, true);
  assert.equal(up.z > origin.z, true);
  assert.deepEqual([length(east), length(north), length(up)], [10, 10, 10]);
});

test("vertical exaggeration is an explicit z-only multiplier", () => {
  const one = geometry.worldPoint(1, 2, 110, raster, 100, 1);
  const three = geometry.worldPoint(1, 2, 110, raster, 100, 3);
  assert.equal(three.x, one.x);
  assert.equal(three.y, one.y);
  assert.equal(three.z, one.z * 3);
});

test("profile uses metadata width and retains missing cells as gaps", () => {
  const data = {
    valid_mask: [1, 1, 0, 1, 1, 1],
    elevation_m_rounded: [10, 11, null, 12, 13, 14]
  };
  const points = geometry.profile([{ row: 0, col: 0 }, { row: 0, col: 2 }], { width: 3, height: 2, pixel_size_m: [20, 30] }, data);
  assert.equal(points.length, 3);
  assert.equal(points[1].distanceM, 20);
  assert.equal(points[1].elevationM, 11);
  assert.equal(points[2].distanceM, 40);
  assert.equal(points[2].elevationM, null);
});

test("local height datum ignores NoData and comes from valid raster values", () => {
  assert.equal(geometry.medianValidElevation({ valid_mask: [1, 0, 1], elevation_m_rounded: [-2600, null, -2500] }), -2550);
  assert.throws(() => geometry.medianValidElevation({ valid_mask: [0], elevation_m_rounded: [null] }), /no valid elevations/);
});
