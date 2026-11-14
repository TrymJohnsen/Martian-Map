const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../public/contact-model.js");
const { build, buildMission, MISSION_DEFAULTS, ASSUMPTIONS, SAMPLERS } = require("../public/scenario.js");
const mapData = require("../public/data/bright-angel-demo.json");

const run = (choices, assumptions, data = mapData) => model.replay(buildMission(data, choices, assumptions));
const sourceIds = (result) => result.sampleHistory.map((item) => item.sourceId).sort();
const edgeKeys = (result) => result.graphEdges.map((edge) => `${edge.from}>${edge.to}@${edge.eventId}`).sort();
const hasEdge = (result, from, to) => result.graphEdges.some((edge) => edge.from === from && edge.to === to);

test("the example plans are unchanged by the mission builder", () => {
  assert.deepEqual(sourceIds(model.replay(build("shared-tool", mapData))), ["fromA", "fromB", "human"]);
  assert.deepEqual(sourceIds(model.replay(build("separate-tool", mapData))), ["fromA", "fromB", "human"]);
  assert.deepEqual(sourceIds(model.replay(build("omit-glove-contact", mapData))), ["fromB"]);
  const example = build("shared-tool", mapData);
  assert.deepEqual(Object.keys(example.places), ["prep", "A", "B"]);
  assert.deepEqual(Object.keys(example.sources), ["human", "fromA", "fromB"]);
  assert.equal(example.route, undefined);
  assert.deepEqual(example.events.map((event) => event.id),
    ["human-source", "source-a", "touch-a", "collect-a", "seal-a", "source-b", "collect-b", "control-b", "seal-b"]);
  const replayed = model.replay(example);
  assert.deepEqual(replayed.ruleWarnings, []);
  assert.equal(replayed.seals["sample-B"].integrity, null);
});

test("defaults follow the checklist and keep the conservative glove assumption", () => {
  assert.deepEqual(MISSION_DEFAULTS.choices, { gloveSwap: true, sampler: "tongs", sealSurfaceChecked: true, witnessOpened: true });
  assert.deepEqual(MISSION_DEFAULTS.assumptions, { g2CarriesHuman: true, equipmentSource: false, swapContact: false });
  assert.deepEqual(ASSUMPTIONS.map((item) => [item.id, item.defaultOn]),
    [["g2CarriesHuman", true], ["swapContact", false], ["equipmentSource", false]]);
  const scenario = buildMission(mapData);
  assert.deepEqual(Object.keys(scenario.sources), ["human", "fromA", "fromB", "equipment"]);
  const result = model.replay(scenario);
  assert.deepEqual(sourceIds(result), ["fromB", "human"]);
  assert.deepEqual(result.ruleWarnings, []);
});

test("a glove change removes the A path only because G1 has no contact at B", () => {
  const swapped = run({ gloveSwap: true });
  const kept = run({ gloveSwap: false });
  assert.deepEqual(sourceIds(swapped), ["fromB", "human"]);
  assert.deepEqual(sourceIds(kept), ["fromA", "fromB", "human"]);
  assert.equal(swapped.graphEdges.some((edge) => edge.eventId === "m-collect-b" && edge.from === "glove"), false);
  assert.equal(hasEdge(kept, "glove", "tongs"), true);
});

test("the human path through G2 depends on the stated G2 assumption", () => {
  const on = run({}, { g2CarriesHuman: true });
  const off = run({}, { g2CarriesHuman: false });
  assert.equal(sourceIds(on).includes("human"), true);
  assert.deepEqual(sourceIds(off), ["fromB"]);
  assert.deepEqual(on.sampleHistory.find((entry) => entry.sourceId === "human").path.map((edge) => edge.eventId),
    ["m-glove-on", "m-collect-b", "m-collect-b"]);
  assert.equal(off.records.some((item) => item.eventId === "m-glove-on" && item.tag === "glove-on"), true);
});

test("a glove-to-glove contact during the change carries both earlier sources to B", () => {
  const result = run({}, { g2CarriesHuman: false, swapContact: true });
  assert.deepEqual(sourceIds(result), ["fromA", "fromB", "human"]);
  assert.equal(hasEdge(result, "glove", "glove-2"), true);
  assert.deepEqual(result.ruleWarnings, []);
});

test("the equipment source reaches B only when its assumption is switched on", () => {
  for (const sampler of SAMPLERS) {
    assert.equal(sourceIds(run({ sampler }, { equipmentSource: false })).includes("equipment"), false, sampler);
    assert.equal(sourceIds(run({ sampler }, { equipmentSource: true })).includes("equipment"), true, sampler);
  }
  const edges = run({}, { equipmentSource: true }).graphEdges.filter((edge) => edge.from === "equipment");
  assert.deepEqual(edges.map((edge) => edge.to).sort(), ["tongs", "tool-1", "tool-2", "tube-B"]);
  assert.equal(edges.every((edge) => edge.type === "declared-start-history" && edge.assumption.includes("switchable")), true);
});

test("each sampler choice creates its own stated contacts", () => {
  for (const sampler of ["tool-1", "tool-2", "tongs"]) {
    const result = run({ sampler });
    assert.equal(hasEdge(result, "surface-B", sampler), true, sampler);
    assert.equal(hasEdge(result, "glove-2", sampler), true, sampler);
    assert.equal(hasEdge(result, sampler, "sample-B"), true, sampler);
    assert.equal(hasEdge(result, "glove-2", "sample-B"), false, sampler);
  }
  const hand = run({ sampler: "hand" });
  assert.equal(hasEdge(hand, "glove-2", "sample-B"), true);
  assert.equal(hasEdge(hand, "surface-B", "glove-2"), true);
  assert.equal(SAMPLERS.some((sampler) => hasEdge(hand, sampler, "sample-B")), false);
  assert.equal(sourceIds(hand).includes("fromB"), true);
  assert.deepEqual(sourceIds(run({ sampler: "tool-1" })), ["fromA", "fromB", "human"]);
  assert.throws(() => buildMission(mapData, { sampler: "scoop" }), /Unknown sampler/);
});

test("tongs do not remove the glove path", () => {
  const result = run({ gloveSwap: false, sampler: "tongs" });
  assert.deepEqual(sourceIds(result), ["fromA", "fromB", "human"]);
  const humanPath = result.sampleHistory.find((entry) => entry.sourceId === "human").path;
  assert.equal(humanPath.some((edge) => edge.from === "glove" && edge.eventId === "m-collect-b"), true);
  const withG2 = run({ gloveSwap: true, sampler: "tongs" });
  assert.equal(hasEdge(withG2, "glove-2", "tongs"), true);
  assert.equal(hasEdge(withG2, "glove-2", "tube-B"), true);
});

test("seal status is recorded and changes no edge or path", () => {
  const checked = run({ sealSurfaceChecked: true });
  const unchecked = run({ sealSurfaceChecked: false });
  assert.equal(checked.seals["sample-B"].integrity, "checked");
  assert.equal(unchecked.seals["sample-B"].integrity, "unchecked");
  assert.equal(checked.seals["sample-A"].integrity, null);
  assert.deepEqual(edgeKeys(checked), edgeKeys(unchecked));
  assert.deepEqual(sourceIds(checked), sourceIds(unchecked));
  assert.equal(checked.sampleSealed, true);
  const invalid = buildMission(mapData);
  invalid.events.find((event) => event.id === "m-seal-b").integrity = "perfect";
  assert.throws(() => model.replay(invalid), /Seal integrity/);
  const misplaced = buildMission(mapData);
  misplaced.events.find((event) => event.id === "m-photo-b").integrity = "checked";
  assert.throws(() => model.replay(misplaced), /Seal integrity/);
});

test("a witness tube and other records add knowledge and change no edge or path", () => {
  const opened = run({ witnessOpened: true });
  const closed = run({ witnessOpened: false });
  assert.equal(opened.records.some((item) => item.tag === "witness-open"), true);
  assert.equal(closed.records.some((item) => item.tag === "witness-open"), false);
  assert.deepEqual(edgeKeys(opened), edgeKeys(closed));
  assert.deepEqual(sourceIds(opened), sourceIds(closed));
  const recordIds = new Set(opened.records.map((item) => item.eventId));
  assert.equal(opened.graphEdges.some((edge) => recordIds.has(edge.eventId)), false);
  assert.deepEqual(opened.records.map((item) => item.tag),
    ["kit-check", "photo", "stow", "glove-off", "photo", "witness-open", "log"]);
});

test("keep-out breaches are warnings and never change the graph", () => {
  const gloveKept = buildMission(mapData, { gloveSwap: false });
  const toolReused = buildMission(mapData, { sampler: "tool-1" });
  const gloveResult = model.replay(gloveKept);
  const toolResult = model.replay(toolReused);
  assert.deepEqual(gloveResult.ruleWarnings.map((item) => [item.ruleId, item.objectId, item.eventId, item.placeId]),
    [["keep-out-B", "glove", "m-collect-b", "B"]]);
  assert.deepEqual(toolResult.ruleWarnings.map((item) => item.objectId), ["tool-1"]);
  assert.deepEqual(model.replay(buildMission(mapData, { gloveSwap: false, sampler: "tool-1" })).ruleWarnings.map((item) => item.objectId),
    ["glove", "tool-1"]);
  for (const scenario of [gloveKept, toolReused]) {
    const withRule = model.replay(scenario);
    const withoutRule = model.replay({ ...scenario, rules: [] });
    assert.deepEqual(withoutRule.ruleWarnings, []);
    assert.deepEqual(edgeKeys(withRule), edgeKeys(withoutRule));
    assert.deepEqual(withRule.sampleHistory, withoutRule.sampleHistory);
  }
  assert.deepEqual(model.replay(gloveKept, 6).ruleWarnings, []);
  const unknownZone = buildMission(mapData);
  unknownZone.rules[0].zoneId = "nowhere";
  assert.throws(() => model.replay(unknownZone), /Unknown zone in rule/);
});

test("the zone boundary is a valid cell on the A–B line outside the work zone", () => {
  const scenario = buildMission(mapData);
  const { A, B } = scenario.places;
  const boundary = scenario.places["zone-B"];
  const zone = scenario.zones[0];
  const { width, pixel_size_m: [cellX, cellY] } = mapData.raster;
  assert.equal(mapData.arrays.valid_mask[boundary.row * width + boundary.col], 1);
  const steps = Math.max(Math.abs(B.row - A.row), Math.abs(B.col - A.col));
  const lineCells = Array.from({ length: steps + 1 }, (_, step) =>
    `${Math.round(A.row + (B.row - A.row) * step / steps)},${Math.round(A.col + (B.col - A.col) * step / steps)}`);
  assert.equal(lineCells.includes(`${boundary.row},${boundary.col}`), true);
  const distanceM = Math.hypot((boundary.row - B.row) * cellY, (boundary.col - B.col) * cellX);
  assert.equal(distanceM > zone.radius_m, true);
  assert.equal(distanceM < zone.radius_m + 2 * Math.hypot(cellX, cellY), true);
  assert.equal(boundary.distance_to_B_m, Math.round(distanceM));
  assert.deepEqual(zone.placeIds, ["B"]);
  assert.equal(zone.evidence, "scenario");
  assert.match(zone.label, /planning rule, not an observation/);
  assert.deepEqual(scenario.route, ["prep", "A", "zone-B", "B"]);
  const length = (ids) => ids.map((id) => scenario.places[id]).reduce((sum, point, index, points) => index
    ? sum + Math.hypot((point.row - points[index - 1].row) * cellY, (point.col - points[index - 1].col) * cellX) : 0, 0);
  assert.equal(Math.abs(length(scenario.route) - length(["prep", "A", "B"])) < 1, true);
  for (const id of ["prep", "A", "B"]) assert.deepEqual(scenario.places[id], build("shared-tool", mapData).places[id]);
});

test("the mission scenario also builds without map data", () => {
  const scenario = buildMission(undefined);
  assert.deepEqual(scenario.zones[0].placeIds, ["B"]);
  assert.deepEqual(sourceIds(model.replay(scenario)), ["fromB", "human"]);
});

test("the same choices always give the same result and every event is ordered", () => {
  const choices = { gloveSwap: false, sampler: "hand", sealSurfaceChecked: false, witnessOpened: false };
  const assumptions = { g2CarriesHuman: false, equipmentSource: true, swapContact: true };
  const first = run(choices, assumptions);
  const second = run(choices, assumptions);
  assert.deepEqual(first.sampleHistory, second.sampleHistory);
  assert.deepEqual(first.ruleWarnings, second.ruleWarnings);
  assert.deepEqual(first.records, second.records);
  for (const gloveSwap of [true, false]) for (const sampler of SAMPLERS) for (const witnessOpened of [true, false]) {
    const scenario = buildMission(mapData, { gloveSwap, sampler, witnessOpened });
    assert.deepEqual(scenario.events.map((event) => event.order), scenario.events.map((_, index) => index + 1));
    assert.equal(scenario.events.every((event) => event.id.startsWith("m-")), true);
    assert.doesNotThrow(() => model.replay(scenario));
  }
});

test("no object label or note claims a clean, sterile or safe state", () => {
  const scenario = buildMission(mapData, {}, { equipmentSource: true, swapContact: true });
  const text = JSON.stringify([scenario.objects, scenario.events, scenario.zones, scenario.rules, ASSUMPTIONS]);
  assert.doesNotMatch(text.replace(/not a sterility claim/g, ""), /\b(clean|sterile|sterility|safe|uncontaminated)\b/i);
});
