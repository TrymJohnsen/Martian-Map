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
const terrainArrays = (values, mask = values.map(() => 1)) => ({ elevation_m_rounded: values, valid_mask: mask });
test('central slope is zero on flat terrain and null on all borders', () => {
  assert.deepEqual(geometry.slopes(raster, terrainArrays(Array(9).fill(5))), [null,null,null,null,0,null,null,null,null]);
});
test('central slope uses both metre spacings and returns degrees', () => {
  const a = terrainArrays([0,10,20,0,10,20,0,10,20]);
  assert.ok(Math.abs(geometry.slopes(raster,a)[4]-45)<1e-10);
  assert.ok(Math.abs(geometry.slopes({...raster,pixel_size_m:[20,10]},a)[4]-Math.atan(.5)*180/Math.PI)<1e-10);
});
test('NoData and invalid neighbours never produce slope', () => {
  const a = terrainArrays(Array(9).fill(0)); a.valid_mask[1]=0;
  assert.equal(geometry.slopes(raster,a)[4],null);
  a.valid_mask[1]=1; a.elevation_m_rounded[1]=null;
  assert.equal(geometry.slopes(raster,a)[4],null);
  assert.throws(()=>geometry.slopes({...raster,pixel_size_m:[0,10]},a), /Invalid terrain/);
  assert.throws(()=>geometry.slopes(raster,terrainArrays([0])), /Invalid terrain/);
});
test('route traverses intermediate cells, deduplicates returns and reports outside and missing terrain', () => {
  const points=[{row:1,col:-10},{row:1,col:10},{row:1,col:-10}];
  const a=terrainArrays(Array(9).fill(0)); a.valid_mask[4]=0;
  const summary=geometry.routeTerrain(points,raster,a,[null,null,null,30,null,40,null,null,null],20);
  assert.deepEqual(summary.cells,[3,4,5]);
  assert.equal(summary.steep,2); assert.equal(summary.noData,1); assert.equal(summary.outside,true);
  assert.equal(geometry.routeTerrain(points,raster,a,Array(9).fill(30),35).steep,0);
});
test('route includes corner touches and does not count wholly outside segments', () => {
  assert.deepEqual(geometry.routeCells([{row:-5,col:-5},{row:-2,col:-2}],raster).cells,[]);
  const result=geometry.routeCells([{row:0,col:0},{row:1,col:1}],raster);
  assert.deepEqual(result.cells,[0,1,3,4]);
});
test('north and east gradients combine and source arrays remain unchanged', () => {
  const a=terrainArrays([20,30,40,10,20,30,0,10,20]);
  const before=JSON.stringify(a);
  assert.ok(Math.abs(geometry.slopes(raster,a)[4]-Math.atan(Math.sqrt(2))*180/Math.PI)<1e-10);
  assert.equal(JSON.stringify(a),before);
});
test('small rasters have no computable slope and invalid inputs fail explicitly',()=>{
  assert.deepEqual(geometry.slopes({width:1,height:1,pixel_size_m:[10,20]},terrainArrays([12])),[null]);
  assert.throws(()=>geometry.slopes(null,null),/Invalid terrain/);
  assert.throws(()=>geometry.routeCells([],{}),/Invalid route raster/);
  assert.throws(()=>geometry.routeCells([{row:NaN,col:1}],raster),/Invalid route point/);
  assert.throws(()=>geometry.routeTerrain([],raster,terrainArrays(Array(9).fill(0)),[],15),/Invalid slope array/);
});
