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

  return Object.freeze({ worldPoint, projectWorld, profile, medianValidElevation });
});
