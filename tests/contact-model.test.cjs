const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../public/contact-model.js");

test("same assumed glove/tool contacts give the same path in either activity order", () => {
  const sampleFirst = model.assess({ sequence: "sample-first" });
  const surveyFirst = model.assess({ sequence: "survey-first" });
  assert.deepEqual(sampleFirst.path, ["possible Earth-associated material", "EVA glove", "sample-contact interface", "rock core"]);
  assert.deepEqual(surveyFirst.path, sampleFirst.path);
  assert.notDeepEqual(sampleFirst.activityOrder, surveyFirst.activityOrder);
});

test("no assumed source means no modeled source-to-sample path", () => {
  assert.equal(model.assess({ sourcePresent: false }).pathwayPresent, false);
});

test("without either contact edge there is no modeled path", () => {
  assert.equal(model.assess({ gloveContactsTool: false }).pathwayPresent, false);
  assert.equal(model.assess({ toolContactsSample: false }).pathwayPresent, false);
});

test("an assumed glove change and protected interface cuts this modeled chain", () => {
  assert.equal(model.assess({ isolationBoundary: true }).pathwayPresent, false);
});

test("unknown sequences are rejected instead of silently treated as an alternative", () => {
  assert.throws(() => model.assess({ sequence: "route-shortest" }), RangeError);
});
