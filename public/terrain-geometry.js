/* Unit-consistent terrain coordinates and NoData-aware profile sampling. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TerrainGeometry = api;
})(globalThis, function () {
  function worldPoint(row, col, elevationM, raster, datumM, verticalScale = 1) {
    return {
      x: (col - (raster.width - 1) / 2) * raster.pixel_size_m[0],
      y: ((raster.height - 1) / 2 - row) * raster.pixel_size_m[1],
      z: (elevationM - datumM) * verticalScale
    };
  }

  function projectWorld(point, yaw, pitch, camera) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const xr = point.x * cs - point.y * sn;
    const yr = point.x * sn + point.y * cs;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [camera.cx + xr * camera.scale, camera.cy - (yr * cp - point.z * sp) * camera.scale];
  }

  function profile(points, raster, arrays) {
    const { width, height } = raster;
    const output = [];
    let travelledM = 0;
    for (let segment = 0; segment < points.length - 1; segment++) {
      const a = points[segment], b = points[segment + 1];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.row - a.row), Math.abs(b.col - a.col))));
      for (let step = segment ? 1 : 0; step <= steps; step++) {
        const fraction = step / steps;
        const row = Math.round(a.row + (b.row - a.row) * fraction);
        const col = Math.round(a.col + (b.col - a.col) * fraction);
        if (row < 0 || row >= height || col < 0 || col >= width) {
          output.push({ row, col, distanceM: travelledM, elevationM: null });
          continue;
        }
        if (output.length) {
          const previous = output[output.length - 1];
          const dr = row - previous.row, dc = col - previous.col;
          travelledM += Math.hypot(dr * raster.pixel_size_m[1], dc * raster.pixel_size_m[0]);
        }
        const index = row * width + col;
        output.push({
          row,
          col,
          distanceM: travelledM,
          elevationM: arrays.valid_mask[index] ? arrays.elevation_m_rounded[index] : null
        });
      }
    }
    return output;
  }

  function medianValidElevation(arrays) {
    const values = [];
    for (let i = 0; i < arrays.valid_mask.length; i++) {
      if (arrays.valid_mask[i]) values.push(arrays.elevation_m_rounded[i]);
    }
    if (!values.length) throw new RangeError("Terrain raster contains no valid elevations");
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  function validateRaster(raster, arrays) {
    if (!Number.isInteger(raster?.width) || raster.width < 1 || !Number.isInteger(raster.height) || raster.height < 1 ||
        !Array.isArray(raster.pixel_size_m) || !raster.pixel_size_m.every(v => Number.isFinite(v) && v > 0) || raster.pixel_size_m.length !== 2 ||
        arrays?.valid_mask?.length !== raster.width * raster.height || arrays?.elevation_m_rounded?.length !== raster.width * raster.height)
      throw new RangeError("Invalid terrain dimensions, spacing or arrays");
  }

  function slopes(raster, arrays) {
    validateRaster(raster, arrays);
    const { width, height, pixel_size_m: [dx, dy] } = raster;
    const values = new Array(width * height).fill(null);
    const valid = i => arrays.valid_mask[i] === 1 && Number.isFinite(arrays.elevation_m_rounded[i]);
    for (let r = 1; r < height - 1; r++) for (let c = 1; c < width - 1; c++) {
      const i = r * width + c;
      if (![i, i - 1, i + 1, i - width, i + width].every(valid)) continue;
      const east = (arrays.elevation_m_rounded[i + 1] - arrays.elevation_m_rounded[i - 1]) / (2 * dx);
      const north = (arrays.elevation_m_rounded[i - width] - arrays.elevation_m_rounded[i + width]) / (2 * dy);
      values[i] = Math.atan(Math.hypot(east, north)) * 180 / Math.PI;
    }
    return values;
  }

  // Clip each segment against closed cell squares. Boundary/corner touches count;
  // bounding boxes limit work to the raster even for far-outside endpoints.
  function routeCells(points, raster) {
    if (!Number.isInteger(raster?.width) || raster.width < 1 || !Number.isInteger(raster.height) || raster.height < 1)
      throw new RangeError("Invalid route raster dimensions");
    const cells = new Set();
    let outside = false;
    for (const p of points) {
      if (!Number.isFinite(p?.row) || !Number.isFinite(p?.col)) throw new RangeError("Invalid route point");
      if (p.row < -.5 || p.col < -.5 || p.row > raster.height - .5 || p.col > raster.width - .5) outside = true;
    }
    function intersects(a, b, r, c) {
      let lo = 0, hi = 1;
      for (const [start, delta, min, max] of [[a.col, b.col-a.col, c-.5, c+.5], [a.row, b.row-a.row, r-.5, r+.5]]) {
        if (delta === 0) { if (start < min || start > max) return false; }
        else { const t1 = (min-start)/delta, t2 = (max-start)/delta; lo = Math.max(lo, Math.min(t1,t2)); hi = Math.min(hi, Math.max(t1,t2)); }
        if (lo > hi) return false;
      }
      return true;
    }
    for (let s = 0; s < Math.max(0, points.length - 1); s++) {
      const a = points[s], b = points[s+1];
      for (let r = Math.max(0, Math.ceil(Math.min(a.row,b.row)-.5)); r <= Math.min(raster.height-1, Math.floor(Math.max(a.row,b.row)+.5)); r++)
        for (let c = Math.max(0, Math.ceil(Math.min(a.col,b.col)-.5)); c <= Math.min(raster.width-1, Math.floor(Math.max(a.col,b.col)+.5)); c++)
          if (intersects(a,b,r,c)) cells.add(r*raster.width+c);
    }
    return { cells: [...cells], outside };
  }

  function routeTerrain(points, raster, arrays, slopeValues, threshold) {
    validateRaster(raster, arrays);
    if (slopeValues?.length !== raster.width * raster.height) throw new RangeError("Invalid slope array length");
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 90) throw new RangeError("Invalid slope threshold");
    const result = routeCells(points, raster);
    return { ...result, steep: result.cells.filter(i => slopeValues[i] !== null && slopeValues[i] > threshold).length,
      noData: result.cells.filter(i => !arrays.valid_mask[i] || !Number.isFinite(arrays.elevation_m_rounded[i])).length,
      unknownSlope: result.cells.filter(i => slopeValues[i] == null).length };
  }

  return Object.freeze({ worldPoint, projectWorld, profile, medianValidElevation, slopes, routeCells, routeTerrain });
});
