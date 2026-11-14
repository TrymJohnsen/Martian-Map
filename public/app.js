const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canvas = $("#terrain");
const ctx = canvas.getContext("2d");
const profile = $("#profile");
const pctx = profile.getContext("2d");
const loading = $("#scene-loading");
const errorBox = $("#scene-error");
const initialCamera = { yaw: -0.55, pitch: 0.82, zoom: 1 };
const state = { layer: "ortho", plan: "shared-tool", eventIndex: 8, currentStep: "mission", verticalScale: 1, ...initialCamera, dragging: false, guidePlaying: false, guideIndex: -1, guideTimer: null, focusedPlace: "B" };
const guideSteps = [
  { step: "mission", plan: "shared-tool", eventId: "seal-b", focus: "B", copy: "Bright Angel's Sapphire Canyon sample has reported organic compounds and mineral associations. B is a nominal target area." },
  { step: "plan", plan: "shared-tool", eventId: "touch-a", focus: "A", copy: "At hypothetical A, Glove G1 and Tool T1 are used before the route continues to B." },
  { step: "history", plan: "separate-tool", eventId: "seal-b", focus: "B", copy: "At B, Tool T2 is separate, while the modeled history still connects Glove G1 to Sample B." }
];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let data;
let datumM;
let scenario;
let finalReplay;
let markerPoints = [];

document.body.dataset.layout = "steps";
$(".assumptions-link").addEventListener("click", () => { $("#data-assumptions").open = true; });

fetch("/data/bright-angel-demo.json").then((response) => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then((loaded) => {
  data = loaded;
  datumM = TerrainGeometry.medianValidElevation(data.arrays);
  $("#area-title").textContent = data.area;
  $("#target-coordinate").textContent = `${data.sample_site.latitude_north_deg.toFixed(5)}°N, ${data.sample_site.longitude_east_deg.toFixed(5)}°E`;
  $("#position-source").href = data.sample_site.position_source_url;
  $("#position-source").textContent = "PDS sample report ↗";
  $("#ctx-product-id").textContent = data.product.item_id;
  $("#ctx-dtm-link").href = data.product.asset_urls.dtm;
  $("#ctx-ortho-link").href = data.product.asset_urls.ortho;
  $("#ctx-ray-link").href = data.product.asset_urls.intersection_error;
  $("#ctx-product-credit").textContent = `${data.product.ctx_inputs.join(" + ")} · MRO/CTX, NASA/USGS · ${data.product.license} · DOI 10.5066/P9JKVWR3`;
  const placeLabels = { prep: "route start", A: "hypothetical activity", B: "nominal sample target" };
  const overlay = $(".scene-overlay-label").children;
  ["prep", "A", "B"].forEach((placeId, index) => { overlay[index].textContent = `${index === 0 ? "S" : placeId} · ${placeLabels[placeId]}`; });
  canvas.setAttribute("aria-label", `MRO CTX terrain around Bright Angel with an illustrative route to documented sample site ${data.sample_site.label}`);
  loading.hidden = true;
  $("#guide-motion-note").hidden = !reduceMotion;
  initializePlans();
  resize();
  updatePlan();
}).catch((error) => {
  loading.hidden = true;
  errorBox.hidden = false;
  console.error("Terrain data load failed", error);
});

function initializePlans() {
  for (const button of $$("[data-plan]")) button.addEventListener("click", () => {
    stopGuide();
    $("#plan-c-exploration").open = button.dataset.plan === "omit-glove-contact";
    if (button.dataset.plan === state.plan) return;
    state.plan = button.dataset.plan;
    state.eventIndex = scenario.events.findIndex((event) => event.id === "seal-b");
    updatePlan();
  });
  for (const button of $$("[data-focus-place]")) button.addEventListener("click", () => {
    stopGuide();
    focusPlace(button.dataset.focusPlace);
  });
  $("#previous-event").addEventListener("click", () => { stopGuide(); selectEvent(Math.max(0, state.eventIndex - 1)); });
  $("#next-event").addEventListener("click", () => { stopGuide(); selectEvent(Math.min(scenario.events.length - 1, state.eventIndex + 1)); });
  $("#event-timeline").addEventListener("click", (event) => {
    const button = event.target.closest("[data-event-index]");
    if (button) { stopGuide(); selectEvent(Number(button.dataset.eventIndex)); }
  });
  $("#sample-history").addEventListener("click", (event) => {
    const button = event.target.closest("[data-jump-event]");
    if (button) {
      $(".event-sequence").open = true;
      stopGuide();
      selectEvent(scenario.events.findIndex((item) => item.id === button.dataset.jumpEvent));
    }
  });
  $("#guide-start").addEventListener("click", startGuide);
  $("#guide-stop").addEventListener("click", stopGuide);
  $("#guide-restart").addEventListener("click", () => startGuide(true));
  $("#guide-previous").addEventListener("click", () => moveGuide(-1));
  $("#guide-next").addEventListener("click", () => moveGuide(1));
  $$('[data-step], [data-go-step]').forEach((button) => button.addEventListener("click", () => {
    stopGuide();
    showStep(button.dataset.step || button.dataset.goStep);
  }));
}

function showStep(step) {
  if (!["mission", "plan", "history"].includes(step)) return;
  if (step === "history" && state.currentStep !== "history" && scenario) {
    const sealedIndex = scenario.events.findIndex((event) => event.id === "seal-b");
    if (sealedIndex >= 0) selectEvent(sealedIndex);
  }
  state.currentStep = step;
  $$('[data-step-panel]').forEach((panel) => { panel.hidden = panel.dataset.stepPanel !== step; });
  $$(".step-tab").forEach((button) => {
    const selected = button.dataset.step === step;
    button.classList.toggle("is-active", selected);
    if (selected) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
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

function updatePlan() {
  if (!data) return;
  scenario = CleanApproachScenario.build(state.plan, data);
  state.eventIndex = Math.max(0, Math.min(state.eventIndex, scenario.events.length - 1));
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
  const current = results.find(({ plan }) => plan.id === state.plan);
  const humanPath = current.result.sampleHistory.find((entry) => entry.sourceId === "human")?.path || [];
  const fromAPath = current.result.sampleHistory.find((entry) => entry.sourceId === "fromA")?.path || [];
  const activeToolId = state.plan === "shared-tool" ? "tool-1" : "tool-2";
  const gloveReachesBTool = humanPath.some((edge) => edge.from === "glove" && edge.to === activeToolId)
    && humanPath.some((edge) => edge.from === activeToolId && edge.to === "sample-B");
  const aMaterialReachesB = fromAPath.some((edge) => edge.from === "tool-1" && edge.to === "sample-B");
  const heading = state.plan === "shared-tool"
    ? (aMaterialReachesB ? "Shared tool. Possible A-surface path reaches B." : "Tool T1 is used at A and B.")
    : state.plan === "separate-tool"
      ? (gloveReachesBTool ? "Different tool. Shared glove history." : "Separate tool; no modeled glove path reaches B.")
      : (gloveReachesBTool ? "The modeled glove path still reaches B." : "No glove-to-T2 contact is modeled at B.");
  $("#plan-result-heading").textContent = heading;
  const toolAtB = state.plan === "separate-tool" ? "Tool T2" : "Tool T1";
  $("#sequence-tool-b").textContent = toolAtB;
  $("#plan-difference").textContent = state.plan === "omit-glove-contact"
    ? "This counterfactual omits only G1 → T2 at B; it is not a validated procedure or a cleanliness finding."
    : "Possible contact path under the selected scenario · not measured contamination.";
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
  $("#current-event-title").textContent = event.action;
  $("#current-event-place").textContent = `Event ${event.order} of ${scenario.events.length} · ${scenario.places[event.placeId].label}`;
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
  const stateLabel = $("#history-state");
  if (!histories.length) {
    stateLabel.textContent = "No possible source path has reached B at this event yet.";
    container.replaceChildren();
    return;
  }
  stateLabel.textContent = result.sampleSealed
    ? "Scenario history at sealing · possible contacts, not measured transfer."
    : `Possible source paths through event ${state.eventIndex + 1} · scenario assumptions.`;
  const rows = [];
  for (const history of histories) {
    const item = document.createElement("li");
    item.className = `compact-source-row source-${history.sourceId}`;
    const source = document.createElement("span"); source.className = "source-chip";
    source.textContent = ({
      human: "Possible human-associated material",
      fromA: "Possible material from hypothetical A",
      fromB: "B's own sample material"
    })[history.sourceId] || scenario.sources[history.sourceId].label;
    const nodes = [history.path[0]?.to, ...history.path.slice(1).map((edge) => edge.to)].filter(Boolean);
    const chain = document.createElement("span"); chain.className = "object-chain";
    chain.textContent = nodes.map(nodeLabel).join(" → ");
    const trace = document.createElement("button"); trace.type = "button"; trace.className = "trace-link";
    trace.dataset.jumpEvent = history.path.at(-1)?.eventId || "seal-b";
    trace.textContent = "Trace";
    item.append(source, chain, trace); rows.push(item);
  }
  container.replaceChildren(...rows);
}

function focusPlace(placeId) {
  const eventIndex = scenario.events.findIndex((event) => event.placeId === placeId);
  state.focusedPlace = placeId;
  if (placeId === "B") selectEvent(scenario.events.findIndex((event) => event.id === "seal-b"));
  else if (eventIndex >= 0) selectEvent(eventIndex);
  else draw();
}

function applyGuideStep(index) {
  state.guideIndex = index;
  const step = guideSteps[index];
  $("#plan-c-exploration").open = false;
  state.plan = step.plan;
  state.eventIndex = scenario.events.findIndex((event) => event.id === step.eventId);
  showStep(step.step);
  $("#guide-step-copy").textContent = step.copy;
  $("#guide-progress").textContent = `Step ${index + 1} of ${guideSteps.length}`;
  updatePlan();
}

function scheduleGuideStep() {
  clearTimeout(state.guideTimer);
  if (!state.guidePlaying || reduceMotion) return;
  state.guideTimer = setTimeout(() => {
    if (state.guideIndex < guideSteps.length - 1) {
      applyGuideStep(state.guideIndex + 1);
      scheduleGuideStep();
    } else stopGuide();
  }, 4800);
}

function startGuide(restart = false) {
  if (restart || state.guideIndex < 0 || state.guideIndex === guideSteps.length - 1) state.guideIndex = 0;
  state.guidePlaying = !reduceMotion;
  $("#guide-start").textContent = state.guidePlaying ? "Playing walkthrough" : "Walk me through it";
  $("#guide-stop").disabled = !state.guidePlaying;
  applyGuideStep(state.guideIndex);
  scheduleGuideStep();
}

function stopGuide() {
  state.guidePlaying = false;
  clearTimeout(state.guideTimer);
  $("#guide-start").textContent = "Walk me through it";
  $("#guide-stop").disabled = true;
}

function moveGuide(delta) {
  stopGuide();
  const next = state.guideIndex < 0 ? (delta > 0 ? 0 : guideSteps.length - 1) : Math.max(0, Math.min(guideSteps.length - 1, state.guideIndex + delta));
  applyGuideStep(next);
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  const nearest = markerPoints.map((item) => ({ ...item, distance: Math.hypot(item.point[0] - x, item.point[1] - y) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (nearest && nearest.distance < 22) { stopGuide(); focusPlace(nearest.id); }
});

$$('[data-layer]').forEach((button) => button.addEventListener("click", () => {
  state.layer = button.dataset.layer;
  $$('[data-layer]').forEach((item) => {
    item.classList.toggle("is-active", item === button);
    item.setAttribute("aria-pressed", String(item === button));
  });
  const notes = {
    ortho: "Observed MRO / CTX orthoimage · grayscale display stretch · units are unspecified.",
    elevation: `Observed DTM heights: ${data.raster.elevation_min_m_source.toFixed(1)} to ${data.raster.elevation_max_m_source.toFixed(1)} m relative to the areoid · true height scale by default.`,
    intersection: `Observed ASP camera-ray separation: ${data.raster.intersection_error_min_m.toFixed(3)}–${data.raster.intersection_error_max_m.toFixed(3)} m · relative stereo diagnostic, not accuracy or uncertainty.`
  };
  $("#layer-note").textContent = notes[state.layer];
  draw();
}));

canvas.addEventListener("pointerdown", (event) => {
  state.dragging = true; state.lastX = event.clientX; state.lastY = event.clientY; canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  state.yaw += (event.clientX - state.lastX) * .008;
  state.pitch = Math.max(.45, Math.min(1.2, state.pitch + (event.clientY - state.lastY) * .004));
  state.lastX = event.clientX; state.lastY = event.clientY; draw();
});
canvas.addEventListener("pointerup", () => { state.dragging = false; });
canvas.addEventListener("pointercancel", () => { state.dragging = false; });
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  state.zoom = Math.max(.7, Math.min(1.55, state.zoom * (event.deltaY > 0 ? .92 : 1.08))); draw();
}, { passive: false });
function resetCamera() { Object.assign(state, initialCamera); draw(); }
$("#reset-camera").addEventListener("click", resetCamera);
$("#vertical-scale").addEventListener("click", () => {
  state.verticalScale = state.verticalScale === 1 ? 3 : 1;
  const button = $("#vertical-scale"), exaggerated = state.verticalScale > 1;
  button.textContent = exaggerated ? "Height scale 3× · exaggerated" : "Height scale 1× · true scale";
  button.setAttribute("aria-pressed", String(exaggerated)); draw();
});
canvas.addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "r") { resetCamera(); event.preventDefault(); } });
