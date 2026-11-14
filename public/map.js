/* Map view: terrain canvas, display layers, camera, route and place markers, route profile.
 * Owns everything inside the map card. It never touches the step-panel DOM; it talks to the
 * rest of the app only through window.CleanApproach and the events documented in
 * docs/data-contract.md ("Module and event contract"). */
(function () {
  const CA = (window.CleanApproach = window.CleanApproach || {});
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const canvas = $("#terrain");
  const ctx = canvas.getContext("2d");
  const profile = $("#profile");
  const pctx = profile.getContext("2d");
  const initialCamera = { yaw: -0.55, pitch: 0.82, zoom: 1 };
  const view = { layer: "ortho", verticalScale: 1, ...initialCamera, dragging: false, focusedPlace: "B" };
  let data;
  let datumM;
  let markerPoints = [];

  function init(context) {
    data = context.data;
    datumM = context.datumM;
    const placeLabels = { prep: "route start", A: "hypothetical activity", B: "nominal sample target" };
    const overlay = $(".scene-overlay-label").children;
    ["prep", "A", "B"].forEach((placeId, index) => { overlay[index].textContent = `${index === 0 ? "S" : placeId} · ${placeLabels[placeId]}`; });
    canvas.setAttribute("aria-label", `MRO CTX terrain around Bright Angel with an illustrative route to documented sample site ${data.sample_site.label}`);

    window.addEventListener("resize", resize);
    window.addEventListener("mission:step", (event) => { view.focusedPlace = event.detail.placeId; draw(); });
    window.addEventListener("scenario:change", updateRoute);
    $$(".scene-overlay-label [data-focus-place]").forEach((button) => button.addEventListener("click", () => emitPlace(button.dataset.focusPlace)));
    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      const nearest = markerPoints.map((item) => ({ ...item, distance: Math.hypot(item.point[0] - x, item.point[1] - y) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance < 22) emitPlace(nearest.id);
    });

    $$('[data-layer]').forEach((button) => button.addEventListener("click", () => {
      view.layer = button.dataset.layer;
      $$('[data-layer]').forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      const notes = {
        ortho: "Observed MRO / CTX orthoimage · grayscale display stretch · units are unspecified.",
        elevation: `Observed DTM heights: ${data.raster.elevation_min_m_source.toFixed(1)} to ${data.raster.elevation_max_m_source.toFixed(1)} m relative to the areoid · true height scale by default.`,
        intersection: `Observed ASP camera-ray separation: ${data.raster.intersection_error_min_m.toFixed(3)}–${data.raster.intersection_error_max_m.toFixed(3)} m · relative stereo diagnostic, not accuracy or uncertainty.`
      };
      $("#layer-note").textContent = notes[view.layer];
      draw();
    }));

    canvas.addEventListener("pointerdown", (event) => {
      view.dragging = true; view.lastX = event.clientX; view.lastY = event.clientY; canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!view.dragging) return;
      view.yaw += (event.clientX - view.lastX) * .008;
      view.pitch = Math.max(.45, Math.min(1.2, view.pitch + (event.clientY - view.lastY) * .004));
      view.lastX = event.clientX; view.lastY = event.clientY; draw();
    });
    canvas.addEventListener("pointerup", () => { view.dragging = false; });
    canvas.addEventListener("pointercancel", () => { view.dragging = false; });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      view.zoom = Math.max(.7, Math.min(1.55, view.zoom * (event.deltaY > 0 ? .92 : 1.08))); draw();
    }, { passive: false });
    $("#reset-camera").addEventListener("click", resetCamera);
    $("#vertical-scale").addEventListener("click", () => {
      view.verticalScale = view.verticalScale === 1 ? 3 : 1;
      const button = $("#vertical-scale"), exaggerated = view.verticalScale > 1;
      button.textContent = exaggerated ? "Height scale 3× · exaggerated" : "Height scale 1× · true scale";
      button.setAttribute("aria-pressed", String(exaggerated)); draw();
    });
    canvas.addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "r") { resetCamera(); event.preventDefault(); } });
    resize();
  }

  function emitPlace(placeId) {
    window.dispatchEvent(new CustomEvent("map:place", { detail: { placeId } }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function resetCamera() { Object.assign(view, initialCamera); draw(); }

  function cellColor(row, col) {
    const index = row * data.raster.width + col;
    if (!data.arrays.valid_mask[index]) return null;
    if (view.layer === "ortho") {
      const value = data.arrays.ortho_gray8_display_only[index];
      return `rgb(${value},${value},${value})`;
    }
    if (view.layer === "intersection") {
      const fraction = data.arrays.intersection_error_cm[index] / 433;
      const low = [44, 110, 111], high = [225, 159, 104];
      return `rgb(${low.map((value, axis) => Math.round(value + (high[axis] - value) * fraction)).join(",")})`;
    }
    const elevation = data.arrays.elevation_m_rounded[index];
    const min = data.raster.elevation_min_m_source;
    const max = data.raster.elevation_max_m_source;
    const fraction = Math.max(0, Math.min(1, (elevation - min) / Math.max(1, max - min)));
    const stops = [[29, 48, 43], [77, 103, 67], [161, 157, 99], [218, 195, 145]];
    const position = fraction * (stops.length - 1);
    const stop = Math.min(stops.length - 2, Math.floor(position));
    const local = position - stop;
    return `rgb(${stops[stop].map((value, axis) => Math.round(value + (stops[stop + 1][axis] - value) * local)).join(",")})`;
  }

  function project(row, col, elevationM, cx, cy, scale) {
    const point = TerrainGeometry.worldPoint(row, col, elevationM, data.raster, datumM, view.verticalScale);
    return TerrainGeometry.projectWorld(point, view.yaw, view.pitch, { cx, cy, scale });
  }

  function markerPoint(placeId, cx, cy, scale) {
    const place = CA.scenario.places[placeId];
    const index = place.row * data.raster.width + place.col;
    if (!data.arrays.valid_mask[index]) return null;
    return project(place.row, place.col, data.arrays.elevation_m_rounded[index], cx, cy, scale);
  }

  function routePlaces() { return CA.scenario?.route || ["prep", "A", "B"]; }

  function draw() {
    if (!data || !CA.scenario) return;
    const widthPx = canvas.clientWidth, heightPx = canvas.clientHeight;
    if (!widthPx || !heightPx) return;
    ctx.clearRect(0, 0, widthPx, heightPx);
    const fieldPlate = document.body.dataset.layout === "b";
    const viewScale = fieldPlate ? 1.5 : 1.3;
    const meanCellM = (data.raster.pixel_size_m[0] + data.raster.pixel_size_m[1]) / 2;
    const widthSpanM = data.raster.width * meanCellM * (fieldPlate ? 210 / 148 : 244 / 148);
    const heightSpanM = data.raster.height * meanCellM * (fieldPlate ? 190 / 148 : 235 / 148);
    const cameraScale = Math.min(widthPx / widthSpanM, heightPx / heightSpanM) * view.zoom * viewScale;
    const cx = widthPx * 0.5, cy = heightPx * 0.56;
    const northX = -Math.sin(view.yaw), northY = Math.cos(view.yaw) * Math.cos(view.pitch);
    $("#north-arrow").style.transform = `rotate(${Math.atan2(northX, -northY)}rad)`;
    const { width, height } = data.raster;
    const vertices = new Array(width * height);
    for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
      const index = row * width + col;
      if (data.arrays.valid_mask[index]) vertices[index] = project(row, col, data.arrays.elevation_m_rounded[index], cx, cy, cameraScale);
    }
    for (let row = 0; row < height - 1; row++) for (let col = 0; col < width - 1; col++) {
      const index = row * width + col;
      if (!vertices[index] || !vertices[index + 1] || !vertices[index + width] || !vertices[index + width + 1]) continue;
      const points = [vertices[index], vertices[index + 1], vertices[index + width + 1], vertices[index + width]];
      ctx.beginPath();
      points.forEach(([x, y], pointIndex) => pointIndex ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = cellColor(row, col) || "#172522";
      ctx.fill();
      if (view.layer !== "ortho") { ctx.strokeStyle = "rgba(13,24,20,.18)"; ctx.lineWidth = .5; ctx.stroke(); }
    }
    drawRoute(cx, cy, cameraScale);
  }

  function drawRoute(cx, cy, scale) {
    const route = routePlaces().map((placeId) => ({ id: placeId, point: markerPoint(placeId, cx, cy, scale) }));
    markerPoints = route.filter((item) => item.point);
    ctx.save();
    ctx.beginPath();
    route.filter((item) => item.point).forEach(({ point }, index) => index ? ctx.lineTo(...point) : ctx.moveTo(...point));
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(8,16,14,.82)"; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = "#e2b082"; ctx.lineWidth = 2.5; ctx.stroke();
    route.forEach(({ id, point }) => {
      if (!point) return;
      const selected = view.focusedPlace === id;
      const radius = selected ? 9 : 6;
      ctx.beginPath(); ctx.arc(point[0], point[1], radius + (selected ? 5 : 2), 0, Math.PI * 2);
      ctx.strokeStyle = selected ? "#f3dda5" : "rgba(241,241,233,.72)"; ctx.lineWidth = selected ? 2 : 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(point[0], point[1], radius, 0, Math.PI * 2);
      ctx.fillStyle = id === "prep" ? "#b7e28b" : id === "A" ? "#8fc7c4" : "#e2b082"; ctx.fill();
      ctx.font = "600 11px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#f1f1e9";
      ctx.fillText(id === "prep" ? "S" : id, point[0], point[1] - 14);
    });
    ctx.restore();
  }

  function metresBetween(a, b) {
    return Math.hypot((a.col - b.col) * data.raster.pixel_size_m[0], (a.row - b.row) * data.raster.pixel_size_m[1]);
  }

  function drawProfile(samples) {
    const width = profile.clientWidth, height = profile.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    profile.width = Math.max(1, Math.round(width * ratio)); profile.height = Math.max(1, Math.round(height * ratio));
    pctx.setTransform(ratio, 0, 0, ratio, 0, 0); pctx.clearRect(0, 0, width, height);
    const valid = samples.filter((point) => point.elevationM !== null);
    if (valid.length < 2) { $("#profile-range").textContent = "Insufficient valid terrain samples"; return; }
    const min = Math.min(...valid.map((point) => point.elevationM));
    const max = Math.max(...valid.map((point) => point.elevationM));
    const span = Math.max(1, max - min);
    const totalDistance = Math.max(1, samples.at(-1).distanceM);
    const y = (value) => height - 4 - (value - min) / span * (height - 12);
    let drawingSegment = false;
    pctx.beginPath();
    for (const point of samples) {
      if (point.elevationM === null) { drawingSegment = false; continue; }
      const x = point.distanceM / totalDistance * width;
      if (!drawingSegment) { pctx.moveTo(x, y(point.elevationM)); drawingSegment = true; }
      else pctx.lineTo(x, y(point.elevationM));
    }
    pctx.strokeStyle = "#c2e69d"; pctx.lineWidth = 1.6; pctx.stroke();
    const rounded = (value) => Math.round(value / 5) * 5;
    $("#profile-range").textContent = `Valid cells: ≈${rounded(min).toLocaleString()} to ≈${rounded(max).toLocaleString()} m · NoData shown as gaps`;
  }

  function updateRoute() {
    const route = routePlaces().map((placeId) => CA.scenario.places[placeId]);
    const lengthM = route.slice(1).reduce((sum, point, index) => sum + metresBetween(route[index], point), 0);
    $("#route-distance").textContent = (Math.round(lengthM / 10) * 10).toLocaleString();
    drawProfile(TerrainGeometry.profile(route, data.raster, data.arrays));
    draw();
  }

  CA.map = { init };
})();
