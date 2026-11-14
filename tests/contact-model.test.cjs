const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../public/contact-model.js");
const { build } = require("../public/scenario.js");

const sourceIds = (result) => result.sampleHistory.map((item) => item.sourceId).sort();

test("shared tool carries possible material from target A and the human-associated scenario source to B", () => {
  const result = model.replay(build("shared-tool"));
  assert.deepEqual(sourceIds(result), ["fromA", "fromB", "human"]);
  const aTrace = result.sampleHistory.find((entry) => entry.sourceId === "fromA");
  assert.deepEqual(aTrace.path.map((edge) => edge.eventId), ["source-a", "collect-a", "collect-b"]);
});

test("separate tool leaves the explicitly modeled glove path to B", () => {
  const result = model.replay(build("separate-tool"));
  assert.deepEqual(sourceIds(result), ["fromA", "fromB", "human"]);
  assert.ok(result.sampleHistory.find((entry) => entry.sourceId === "human").path.some((edge) => edge.eventId === "collect-b"));
  assert.equal(result.histories["tool-2"].some((entry) => entry.sourceId === "human"), true);
});

test("omitting the glove-to-T2 contact removes only source groups that used it", () => {
  const separate = model.replay(build("separate-tool"));
  const omitted = model.replay(build("omit-glove-contact"));
  assert.deepEqual(sourceIds(omitted), ["fromB"]);
  assert.deepEqual(sourceIds({ sampleHistory: separate.histories["sample-A"] }), ["fromA", "human"]);
  assert.deepEqual(sourceIds({ sampleHistory: omitted.histories["sample-A"] }), ["fromA", "human"]);
  assert.equal(omitted.graphEdges.some((edge) => edge.eventId === "collect-b" && edge.from === "glove"), false);
});

test("control documentation adds no graph edge and removes no existing path", () => {
  const scenario = build("shared-tool");
  const before = model.replay({ ...scenario, events: scenario.events.slice(0, -2), sampleId: "sample-A" });
  const after = model.replay(scenario);
  assert.equal(after.graphEdges.some((edge) => edge.eventId === "control-b"), false);
  assert.deepEqual(sourceIds({ sampleHistory: after.histories["sample-A"] }), sourceIds({ sampleHistory: before.histories["sample-A"] }));
});

test("a sealed sample keeps its history while later events update other objects", () => {
  const scenario = build("shared-tool");
  scenario.sources.late = { label: "Later scenario source", kind: "test" };
  scenario.events.push({
    id: "late-glove", order: 10, placeId: "prep", type: "contact", action: "Later glove event",
    participants: ["late", "glove"], contacts: [{ from: "late", to: "glove", direction: "forward", assumption: "Test-only later contact" }]
  });
  const result = model.replay(scenario);
  assert.deepEqual(sourceIds(result), ["fromA", "fromB", "human"]);
  assert.equal(result.histories.glove.some((entry) => entry.sourceId === "late"), true);
});

test("an explicit reopen permits later sample contacts", () => {
  const scenario = build("shared-tool");
  scenario.sources.late = { label: "Later scenario source", kind: "test" };
  scenario.events.push(
    { id: "reopen-b", order: 10, placeId: "B", type: "reopen", action: "Explicitly reopen sample B", participants: ["sample-B"], contacts: [] },
    { id: "touch-open-b", order: 11, placeId: "B", type: "contact", action: "Contact reopened sample B", participants: ["late", "sample-B"], contacts: [{ from: "late", to: "sample-B", direction: "forward", assumption: "Test-only explicit contact" }] }
  );
  scenario.events.forEach((event, index) => { event.order = index + 1; });
  assert.ok(model.replay(scenario).sampleHistory.some((entry) => entry.sourceId === "late"));
});

test("contact with a sealed sample is rejected without an explicit reopen", () => {
  const scenario = build("shared-tool");
  scenario.events.push({
    id: "touch-sealed-b", order: 10, placeId: "B", type: "contact", action: "Invalid contact",
    participants: ["glove", "sample-B"], contacts: [{ from: "glove", to: "sample-B", direction: "forward", assumption: "Test-only invalid contact" }]
  });
  assert.throws(() => model.replay(scenario), /sealed object sample-B/);
});

test("each replay starts from scenario inputs and returns a deterministic result", () => {
  const scenario = build("shared-tool");
  const first = model.replay(scenario);
  const second = model.replay(scenario);
  assert.deepEqual(first.sampleHistory, second.sampleHistory);
  const reordered = structuredClone(scenario);
  [reordered.events[0], reordered.events[1]] = [reordered.events[1], reordered.events[0]];
  [reordered.events[0].order, reordered.events[1].order] = [1, 2];
  const changed = model.replay(reordered);
  assert.deepEqual(sourceIds(changed), sourceIds(first));
  assert.notDeepEqual(changed.sampleHistory.find((entry) => entry.sourceId === "human").path, first.sampleHistory.find((entry) => entry.sourceId === "human").path);
});

test("unknown places, objects, and ambiguous order are rejected", () => {
  const unknownPlace = build("shared-tool");
  unknownPlace.events[0].placeId = "nowhere";
  assert.throws(() => model.replay(unknownPlace), /Unknown place/);
  const unknownObject = build("shared-tool");
  unknownObject.events[0].contacts[0].to = "missing";
  assert.throws(() => model.replay(unknownObject), /Unknown contact target/);
  const duplicateOrder = build("shared-tool");
  duplicateOrder.events[1].order = 1;
  assert.throws(() => model.replay(duplicateOrder), /Ambiguous event order/);
});

test("all three plans keep the same mapped places and route geometry", () => {
  const plans = ["shared-tool", "separate-tool", "omit-glove-contact"].map((id) => build(id));
  const routeLength = (scenario) => {
    const points = ["prep", "A", "B"].map((id) => scenario.places[id]);
    return points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.row - points[index].row, point.col - points[index].col), 0);
  };
  assert.deepEqual(plans[1].places, plans[0].places);
  assert.deepEqual(plans[2].places, plans[0].places);
  assert.equal(routeLength(plans[1]), routeLength(plans[0]));
  assert.equal(routeLength(plans[2]), routeLength(plans[0]));
  assert.deepEqual(plans[0].objects["tool-2"].startHistory, []);
  assert.match(plans[0].objects["tool-2"].note, /not a sterility claim/);
});
