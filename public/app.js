const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canvas = $("#terrain");
const ctx = canvas.getContext("2d");
const profile = $("#profile");
const pctx = profile.getContext("2d");
const loading = $("#scene-loading");
const errorBox = $("#scene-error");
const initialCamera = { yaw: -0.55, pitch: 0.82, zoom: 1 };
const state = { layer: "ortho", plan: "shared-tool", eventIndex: 0, verticalScale: 1, ...initialCamera, dragging: false, tour: false, focusedPlace: "prep" };
let data;
let datumM;
let scenario;
let finalReplay;
let markerPoints = [];

const params = new URLSearchParams(location.search);
document.body.dataset.layout = params.get("design") === "field-plate" ? "b" : "a";
$(".assumptions-link").addEventListener("click", () => { $("#data-assumptions").open = true; });

fetch("/data/bright-angel-demo.json").then((response) => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then((loaded) => {
  data = loaded;
  datumM = TerrainGeometry.medianValidElevation(data.arrays);
  $("#area-title").textContent = data.area;
  $(".intro .eyebrow").textContent = "Jezero · Bright Angel / Neretva Vallis";
  $("#mission-summary").textContent = data.mission_summary;
  $("#science-target").textContent = `${data.sample_site.label} · ${data.sample_site.feature} · ${data.sample_site.region} · Sol ${data.sample_site.sol}`;
  $("#target-coordinate").textContent = `${data.sample_site.latitude_north_deg.toFixed(5)}°N, ${data.sample_site.longitude_east_deg.toFixed(5)}°E`;
  $("#target-cell-note").textContent = `Marker is on the nearest valid ${Math.round(data.raster.pixel_size_m[0])} m cell; the source report gives no location accuracy.`;
  $("#position-source").href = data.sample_site.position_source_url;
  $("#position-source").textContent = "PDS sample report ↗";
  $("#ctx-product-id").textContent = data.product.item_id;
  $("#ctx-dtm-link").href = data.product.asset_urls.dtm;
  $("#ctx-ortho-link").href = data.product.asset_urls.ortho;
  $("#ctx-ray-link").href = data.product.asset_urls.intersection_error;
  $("#ctx-product-credit").textContent = `${data.product.ctx_inputs.join(" + ")} · MRO/CTX, NASA/USGS · ${data.product.license} · DOI 10.5066/P9JKVWR3`;
  const placeLabels = { prep: data.scenario_markers.start.label, A: data.scenario_markers.A.label, B: data.scenario_markers.B.label };
  const focusButtons = new Map($$("[data-focus-place]").map((button) => [button.dataset.focusPlace, button]));
  for (const [placeId, label] of Object.entries(placeLabels)) focusButtons.get(placeId).textContent = `${placeId === "prep" ? "S" : placeId} · ${label}`;
  const overlay = $(".scene-overlay-label").children;
  ["prep", "A", "B"].forEach((placeId, index) => { overlay[index].textContent = `${index === 0 ? "S" : placeId} · ${placeLabels[placeId]}`; });
  canvas.setAttribute("aria-label", `MRO CTX terrain around Bright Angel with an illustrative route to documented sample site ${data.sample_site.label}`);
  loading.hidden = true;
  const [px, , x0, , py, y0] = data.raster.transform;
  const marsRadiusM = 3396190;
  const lon = ((x0 + px * data.raster.width / 2) / marsRadiusM * 180 / Math.PI).toFixed(2);
  const lat = ((y0 + py * data.raster.height / 2) / marsRadiusM * 180 / Math.PI).toFixed(2);
  $("#coord-readout").textContent = `${lat}°N  ${lon}°E · ocentric · local height datum ${datumM.toFixed(0)} m`;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const tour = $("#play-tour");
    tour.disabled = true;
    tour.title = "Automatic camera motion is disabled by your reduced-motion setting.";
    tour.querySelector("span:last-child").textContent = "TOUR OFF · REDUCED MOTION";
  }
  initializePlans();
  resize();
  updatePlan();
}).catch((error) => {
  loading.hidden = true;
  errorBox.hidden = false;
  console.error("Terrain data load failed", error);
});

function initializePlans() {
  const buttons = $$("[data-plan]");
  for (const button of buttons) button.addEventListener("click", () => {
    state.plan = button.dataset.plan;
    state.eventIndex = 0;
    updatePlan();
  });
  $$("[data-focus-place]").forEach((button) => button.addEventListener("click", () => focusPlace(button.dataset.focusPlace)));
  $("#previous-event").addEventListener("click", () => selectEvent(Math.max(0, state.eventIndex - 1)));
  $("#next-event").addEventListener("click", () => selectEvent(Math.min(scenario.events.length - 1, state.eventIndex + 1)));
  $("#inspect-sample-b").addEventListener("click", () => {
    state.focusedPlace = "B";
    selectEvent(scenario.events.findIndex((event) => event.id === "seal-b"));
  });
  $("#event-timeline").addEventListener("click", (event) => {
    const button = event.target.closest("[data-event-index]");
    if (button) selectEvent(Number(button.dataset.eventIndex));
  });
  $("#current-event").addEventListener("click", (event) => {
    const button = event.target.closest("[data-jump-event]");
    if (button) selectEvent(scenario.events.findIndex((item) => item.id === button.dataset.jumpEvent));
  });
  $("#sample-history").addEventListener("click", (event) => {
    const button = event.target.closest("[data-jump-event]");
    if (button) selectEvent(scenario.events.findIndex((item) => item.id === button.dataset.jumpEvent));
  });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}
window.addEventListener("resize", resize);

function cellColor(row, col) {
  const index = row * data.raster.width + col;
  if (!data.arrays.valid_mask[index]) return null;
  if (state.layer === "ortho") {
    const value = data.arrays.ortho_gray8_display_only[index];
    return `rgb(${value},${value},${value})`;
  }
  if (state.layer === "intersection") {
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
  const point = TerrainGeometry.worldPoint(row, col, elevationM, data.raster, datumM, state.verticalScale);
  return TerrainGeometry.projectWorld(point, state.yaw, state.pitch, { cx, cy, scale });
}

function markerPoint(placeId, cx, cy, scale) {
  const place = scenario.places[placeId];
  const index = place.row * data.raster.width + place.col;
  if (!data.arrays.valid_mask[index]) return null;
  return project(place.row, place.col, data.arrays.elevation_m_rounded[index], cx, cy, scale);
}

function routePlaces() { return ["prep", "A", "B"]; }

function draw() {
  if (!data || !scenario) return;
  const widthPx = canvas.clientWidth, heightPx = canvas.clientHeight;
  if (!widthPx || !heightPx) return;
  ctx.clearRect(0, 0, widthPx, heightPx);
  const fieldPlate = document.body.dataset.layout === "b";
  const viewScale = fieldPlate ? 1.5 : 1.3;
  const meanCellM = (data.raster.pixel_size_m[0] + data.raster.pixel_size_m[1]) / 2;
  const widthSpanM = data.raster.width * meanCellM * (fieldPlate ? 210 / 148 : 244 / 148);
  const heightSpanM = data.raster.height * meanCellM * (fieldPlate ? 190 / 148 : 235 / 148);
  const cameraScale = Math.min(widthPx / widthSpanM, heightPx / heightSpanM) * state.zoom * viewScale;
  const cx = widthPx * 0.5, cy = heightPx * 0.56;
  const northX = -Math.sin(state.yaw), northY = Math.cos(state.yaw) * Math.cos(state.pitch);
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
    if (state.layer !== "ortho") { ctx.strokeStyle = "rgba(13,24,20,.18)"; ctx.lineWidth = .5; ctx.stroke(); }
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
    const selected = state.focusedPlace === id;
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

function sourceLabels(result) {
  return [...new Set(result.sampleHistory.map((item) => item.sourceId))];
}

function updatePlan() {
  if (!data) return;
  scenario = CleanApproachScenario.build(state.plan, data);
  state.eventIndex = Math.min(state.eventIndex, scenario.events.length - 1);
  finalReplay = ContactHistoryModel.replay(scenario);
  $$("[data-plan]").forEach((button) => {
    const selected = button.dataset.plan === state.plan;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderPlanComparison();
  renderTimeline();
  selectEvent(Math.min(state.eventIndex, scenario.events.length - 1), false);
  const route = routePlaces().map((placeId) => scenario.places[placeId]);
  const lengthM = route.slice(1).reduce((sum, point, index) => sum + metresBetween(route[index], point), 0);
  $("#route-distance").textContent = (Math.round(lengthM / 10) * 10).toLocaleString();
  drawProfile(TerrainGeometry.profile(route, data.raster, data.arrays));
}

function renderPlanComparison() {
  const results = CleanApproachScenario.PLANS.map((plan) => ({ plan, result: ContactHistoryModel.replay(CleanApproachScenario.build(plan.id, data)) }));
  const currentIndex = results.findIndex(({ plan }) => plan.id === state.plan);
  const current = results[currentIndex];
  const prior = results[Math.max(0, currentIndex - 1)];
  const currentSources = sourceLabels(current.result);
  const priorSources = sourceLabels(prior.result);
  const added = currentSources.filter((sourceId) => !priorSources.includes(sourceId));
  const removed = priorSources.filter((sourceId) => !currentSources.includes(sourceId));
  const labels = (ids) => ids.map((id) => scenario.sources[id].label).join("; ");
  let explanation;
  if (currentIndex === 0) {
    explanation = `Calculated sample-B source groups: ${labels(currentSources)}.`;
  } else if (added.length || removed.length) {
    explanation = `Compared with ${prior.plan.label}: ${removed.length ? `no longer traced to B: ${labels(removed)}. ` : ""}${added.length ? `newly traced to B: ${labels(added)}. ` : ""}Still traced to B: ${labels(currentSources.filter((id) => !added.includes(id)))}.`;
  } else {
    const changedTrace = currentSources.some((sourceId) => {
      const oldPath = prior.result.sampleHistory.find((entry) => entry.sourceId === sourceId)?.path.map((edge) => edge.eventId).join("/");
      const newPath = current.result.sampleHistory.find((entry) => entry.sourceId === sourceId)?.path.map((edge) => edge.eventId).join("/");
      return oldPath !== newPath;
    });
    explanation = changedTrace
      ? `Compared with ${prior.plan.label}: the same source groups reach B through a different event chain. Read the trace below; the separate tool alone leaves the modeled glove links.`
      : `Compared with ${prior.plan.label}: the same source groups and event chain remain.`;
  }
  $("#plan-difference").textContent = explanation;
  $("#sample-source-summary").replaceChildren(...currentSources.map((sourceId) => {
    const chip = document.createElement("span");
    chip.className = `source-chip ${sourceId === "fromB" ? "source-chip-native" : ""}`;
    chip.textContent = scenario.sources[sourceId].label;
    return chip;
  }));
}

function renderTimeline() {
  const list = $("#event-timeline");
  list.replaceChildren(...scenario.events.map((event, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button"; button.dataset.eventIndex = String(index);
    button.className = "timeline-item";
    button.setAttribute("aria-current", String(index === state.eventIndex));
    const number = document.createElement("span"); number.className = "timeline-number"; number.textContent = String(event.order);
    const title = document.createElement("span"); title.className = "timeline-title"; title.textContent = event.action;
    const place = document.createElement("small"); place.textContent = scenario.places[event.placeId].label;
    button.append(number, title, place); item.append(button); return item;
  }));
}

function selectEvent(index, redrawList = true) {
  if (!scenario || index < 0) return;
  state.eventIndex = index;
  const event = scenario.events[index];
  state.focusedPlace = event.placeId;
  const partial = ContactHistoryModel.replay(scenario, index + 1);
  $("#event-position").textContent = `${event.order} / ${scenario.events.length}`;
  $("#previous-event").disabled = index === 0;
  $("#next-event").disabled = index === scenario.events.length - 1;
  if (redrawList) renderTimeline();
  else $$(".timeline-item").forEach((button) => button.setAttribute("aria-current", String(Number(button.dataset.eventIndex) === index)));
  const timeline = $("#event-timeline");
  const activeItem = timeline.querySelector(`[data-event-index="${index}"]`);
  if (activeItem) {
    const itemTop = activeItem.getBoundingClientRect().top - timeline.getBoundingClientRect().top + timeline.scrollTop;
    if (itemTop < timeline.scrollTop) timeline.scrollTop = itemTop;
    else if (itemTop + activeItem.offsetHeight > timeline.scrollTop + timeline.clientHeight) {
      timeline.scrollTop = itemTop + activeItem.offsetHeight - timeline.clientHeight;
    }
  }
  renderCurrentEvent(event);
  renderSampleHistory(partial);
  draw();
}

function renderCurrentEvent(event) {
  const article = $("#current-event");
  const place = scenario.places[event.placeId];
  const participants = event.participants.map((id) => scenario.sources[id]?.label || scenario.objects[id]?.label).filter(Boolean);
  const contacts = event.contacts || [];
  const heading = document.createElement("h4"); heading.textContent = event.action;
  const location = document.createElement("p"); location.className = "event-location"; location.textContent = `Place: ${place.label} · participants: ${participants.join(", ")}`;
  const objectNotes = event.participants.map((id) => scenario.objects[id]?.note ? `${scenario.objects[id].label}: ${scenario.objects[id].note}` : null).filter(Boolean);
  const noteList = document.createElement("ul"); noteList.className = "object-state-notes";
  objectNotes.forEach((note) => { const item = document.createElement("li"); item.textContent = note; noteList.append(item); });
  const list = document.createElement("ul"); list.className = "contact-assumptions";
  for (const contact of contacts) {
    const item = document.createElement("li");
    const direction = contact.direction === "bidirectional" ? " ↔ " : " → ";
    item.textContent = `${nodeLabel(contact.from)}${direction}${nodeLabel(contact.to)} · ${contact.assumption}`;
    list.append(item);
  }
  if (!contacts.length) {
    const item = document.createElement("li");
    item.textContent = event.type === "document-control" ? "Documentation event only; no pathway is removed." : "No contact edge is added by this event.";
    list.append(item);
  }
  article.replaceChildren(heading, location, ...(objectNotes.length ? [noteList] : []), list);
}

function nodeLabel(id) { return scenario.sources[id]?.label || scenario.objects[id]?.label || id; }

function renderSampleHistory(result) {
  const container = $("#sample-history");
  const histories = result.sampleHistory;
  if (!histories.length) {
    container.innerHTML = '<p class="empty-history">No source path to sample B has been created by this point in the timeline. An empty scenario history is not a sterility finding.</p>';
    return;
  }
  const title = document.createElement("p");
  title.className = "history-state";
  title.textContent = result.sampleSealed ? "Sample B is sealed; this is the history recorded at sealing." : "Possible source groups connected to B at this point in the event sequence:";
  const list = document.createElement("ol"); list.className = "history-paths";
  for (const history of histories) {
    const item = document.createElement("li");
    const source = document.createElement("b"); source.textContent = scenario.sources[history.sourceId].label;
    const pathList = document.createElement("ol");
    for (const edge of history.path) {
      const pathItem = document.createElement("li");
      const link = document.createElement("button"); link.type = "button"; link.className = "trace-link";
      if (edge.eventId) link.dataset.jumpEvent = edge.eventId;
      link.textContent = `${nodeLabel(edge.from)} → ${nodeLabel(edge.to)}${edge.eventId ? ` · event ${edge.order}` : " · declared starting history"}`;
      const assumption = document.createElement("small"); assumption.textContent = edge.assumption;
      pathItem.append(link, assumption); pathList.append(pathItem);
    }
    item.append(source, pathList); list.append(item);
  }
  container.replaceChildren(title, list);
}

function focusPlace(placeId) {
  const eventIndex = scenario.events.findIndex((event) => event.placeId === placeId);
  state.focusedPlace = placeId;
  if (placeId === "B") selectEvent(scenario.events.findIndex((event) => event.id === "seal-b"));
  else if (eventIndex >= 0) selectEvent(eventIndex);
  else draw();
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  const nearest = markerPoints.map((item) => ({ ...item, distance: Math.hypot(item.point[0] - x, item.point[1] - y) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (nearest && nearest.distance < 22) focusPlace(nearest.id);
});

$$('[data-layer]').forEach((button) => button.addEventListener("click", () => {
  state.layer = button.dataset.layer;
  $$('[data-layer]').forEach((item) => {
    item.classList.toggle("is-active", item === button);
    item.setAttribute("aria-pressed", String(item === button));
  });
  const notes = {
    ortho: "Observed MRO / CTX orthoimage · grayscale display stretch · units are unspecified.",
    elevation: "Observed DTM heights: −2,615.7 to −2,515.6 m relative to the areoid · true height scale by default.",
    intersection: "Observed ASP camera-ray separation: 0.023–4.333 m · relative stereo diagnostic, not accuracy or uncertainty."
  };
  $("#layer-note").textContent = notes[state.layer];
  draw();
}));

canvas.addEventListener("pointerdown", (event) => {
  state.dragging = true; state.lastX = event.clientX; state.lastY = event.clientY; canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  if (state.tour) { state.tour = false; $("#play-tour").querySelector("span:last-child").textContent = "PLAY SHORT TOUR"; }
  state.yaw += (event.clientX - state.lastX) * .008;
  state.pitch = Math.max(.45, Math.min(1.2, state.pitch + (event.clientY - state.lastY) * .004));
  state.lastX = event.clientX; state.lastY = event.clientY; draw();
});
canvas.addEventListener("pointerup", () => { state.dragging = false; });
canvas.addEventListener("pointercancel", () => { state.dragging = false; });
canvas.addEventListener("wheel", (event) => {
  event.preventDefault(); if (state.tour) stopTour();
  state.zoom = Math.max(.7, Math.min(1.55, state.zoom * (event.deltaY > 0 ? .92 : 1.08))); draw();
}, { passive: false });
function stopTour() { state.tour = false; $("#play-tour").querySelector("span:last-child").textContent = "PLAY SHORT TOUR"; }
function resetCamera() { stopTour(); Object.assign(state, initialCamera); draw(); }
$("#reset-camera").addEventListener("click", resetCamera);
$("#vertical-scale").addEventListener("click", () => {
  state.verticalScale = state.verticalScale === 1 ? 3 : 1;
  const button = $("#vertical-scale"), exaggerated = state.verticalScale > 1;
  button.textContent = exaggerated ? "Height scale 3× · exaggerated" : "Height scale 1× · true scale";
  button.setAttribute("aria-pressed", String(exaggerated)); draw();
});
canvas.addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "r") { resetCamera(); event.preventDefault(); } });
$("#play-tour").addEventListener("click", () => {
  if (state.tour) { stopTour(); return; }
  state.tour = true; const button = $("#play-tour"), start = performance.now(), yaw = state.yaw, zoom = state.zoom;
  button.querySelector("span:last-child").textContent = "PLAYING · DRAG TO INTERRUPT";
  function frame(now) {
    if (!state.tour) return;
    const fraction = Math.min(1, (now - start) / 18000);
    state.yaw = yaw + Math.sin(fraction * Math.PI * 2) * .16;
    state.zoom = zoom + .08 * Math.sin(fraction * Math.PI); draw();
    if (fraction < 1) requestAnimationFrame(frame);
    else { state.tour = false; state.yaw = yaw; state.zoom = zoom; button.querySelector("span:last-child").textContent = "PLAY SHORT TOUR"; draw(); }
  }
  requestAnimationFrame(frame);
});
