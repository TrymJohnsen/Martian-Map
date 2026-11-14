const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../public/contact-model.js");
const { buildMission, SAMPLERS } = require("../public/scenario.js");
const mission = require("../public/mission.js");
const mapData = require("../public/data/bright-angel-demo.json");

const variants = [];
for (const gloveSwap of [true, false]) for (const sampler of SAMPLERS) for (const witnessOpened of [true, false]) {
  for (const g2CarriesHuman of [true, false]) variants.push(buildMission(mapData, { gloveSwap, sampler, witnessOpened }, { g2CarriesHuman, swapContact: !g2CarriesHuman }));
}

test("every checklist step has the documented shape and a known place", () => {
  for (const scenario of variants) {
    const steps = mission.steps(scenario);
    assert.deepEqual(steps.map((step) => step.id), ["kit-check", "collect-a", "stow-t1", "glove-change", "witness", "collect-b", "seal-b", "log-b"]);
    assert.deepEqual(steps.map((step) => step.order), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(steps.map((step) => step.placeId), ["prep", "A", "A", "zone-B", "B", "B", "B", "B"]);
    for (const step of steps) {
      assert.ok(Object.hasOwn(scenario.places, step.placeId));
      for (const field of ["title", "instruction", "why", "kind"]) assert.equal(typeof step[field] === "string" && step[field].length > 0, true, `${step.id}.${field}`);
      assert.equal(step.eventIds.length > 0, true, step.id);
    }
  }
});

test("every scenario event belongs to exactly one step, in route order", () => {
  for (const scenario of variants) {
    const steps = mission.steps(scenario);
    const claimed = steps.flatMap((step) => step.eventIds);
    assert.deepEqual([...claimed].sort(), scenario.events.map((event) => event.id).sort());
    assert.equal(new Set(claimed).size, claimed.length);
    for (const step of steps) {
      for (const eventId of step.eventIds) assert.equal(scenario.events.find((event) => event.id === eventId).placeId, step.placeId, eventId);
    }
  }
});

test("steps name a checked precedent with a link, or say they have none", () => {
  const steps = mission.steps(buildMission(mapData));
  const withPrecedent = steps.filter((step) => step.precedent);
  assert.deepEqual(steps.filter((step) => !step.precedent).map((step) => step.id), ["stow-t1"]);
  for (const step of withPrecedent) {
    assert.match(step.precedent.url, /^https:\/\//);
    assert.equal(step.precedent.label.length > 10, true);
  }
  assert.match(mission.PRECEDENT_NOTE, /not validated for Mars EVA/);
  assert.match(mission.DISCLAIMER, /not a validated EVA procedure/);
  assert.match(mission.PRECEDENTS.rockBox.label, /4 of 12/);
});

test("decisions offer exactly the choices the scenario builder accepts", () => {
  const steps = mission.steps(buildMission(mapData));
  const decisions = Object.fromEntries(steps.filter((step) => step.decision).map((step) => [step.decision.key, step.decision.options.map((option) => option.value)]));
  assert.deepEqual(decisions, {
    gloveSwap: [true, false], witnessOpened: [true, false],
    sampler: ["tongs", "tool-2", "tool-1", "hand"], sealSurfaceChecked: [true, false]
  });
  assert.deepEqual([...decisions.sampler].sort(), [...SAMPLERS].sort());
});

test("a source path is traced back to the steps that created it", () => {
  const scenario = buildMission(mapData, { gloveSwap: false, sampler: "tool-2" }, { equipmentSource: true });
  const steps = mission.steps(scenario);
  const result = model.replay(scenario);
  const trace = (sourceId) => mission.stepsForPath(steps, result.sampleHistory.find((entry) => entry.sourceId === sourceId).path);
  assert.deepEqual(trace("fromA").steps.map((step) => step.id), ["collect-a", "collect-b"]);
  assert.equal(trace("fromA").startingAssumption, false);
  assert.deepEqual(trace("human").steps.map((step) => step.id), ["kit-check", "collect-b"]);
  assert.equal(trace("equipment").startingAssumption, true);
  assert.deepEqual(trace("equipment").steps.map((step) => step.id), ["collect-b"]);
});

test("the four unmodeled mechanisms are listed with a reason and create no edge", () => {
  assert.deepEqual(mission.NOT_MODELED.map((item) => item.id), ["suit-leak", "raised-dust", "wind", "lander-exhaust"]);
  assert.equal(mission.NOT_MODELED.every((item) => item.label && item.reason.length > 20), true);
  const text = JSON.stringify(variants.map((scenario) => [scenario.sources, scenario.events]));
  assert.doesNotMatch(text, /leak|vent|wind|exhaust|plume|airborne/i);
});

test("checklist copy claims no clean, sterile or safe state", () => {
  const text = JSON.stringify([variants.map((scenario) => mission.steps(scenario)), mission.NOT_MODELED, mission.SAMPLER_LABELS, mission.PRECEDENTS, mission.DISCLAIMER]);
  assert.doesNotMatch(text, /\b(clean|cleaned|sterile|safe|unsafe|uncontaminated|risk|probability|score)\b/i);
});
