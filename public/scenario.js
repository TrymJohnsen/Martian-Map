/* Fully illustrative human activity scenario located on the available CTX crop. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CleanApproachScenario = api;
})(globalThis, function () {
  const PLANS = Object.freeze([
    { id: "shared-tool", label: "A · Same tool", summary: "Tool T1 is used at both targets." },
    { id: "separate-tool", label: "B · Separate tool", summary: "T2 is used at B; glove contacts at B remain." },
    { id: "omit-glove-contact", label: "C · What if this contact could be avoided?", summary: "Counterfactual: omit the assumed G1 → T2 contact at B." }
  ]);

  const fallbackPlaces = {
    prep: { label: "Walk start / preparation", row: 126, col: 16, kind: "illustrative_scenario" },
    A: { label: "Target A · illustrative", row: 16, col: 137, kind: "illustrative_scenario" },
    B: { label: "Target B · illustrative sample", row: 76, col: 78, kind: "illustrative_scenario" }
  };
  const sources = {
    human: { label: "Possible human-associated material", kind: "human_associated_scenario_source" },
    fromA: { label: "Possible material associated with hypothetical site A", kind: "target_associated_scenario_source", placeId: "A" },
    fromB: { label: "B's own geological material · sample origin", kind: "sample_origin_scenario_input", placeId: "B" }
  };

  function objectsFor() {
    return {
      glove: { label: "Glove G1", kind: "glove", startHistory: [], note: "Its possible source history is established by events." },
      "tool-1": { label: "Sample tool T1", kind: "tool", startHistory: [], note: "Declared starting history: no scenario source assigned; this is not a sterility claim." },
      "tool-2": { label: "Dedicated sample tool T2", kind: "tool", startHistory: [], note: "Declared starting history: no scenario source assigned; this is not a sterility claim." },
      "surface-A": { label: "Target A surface", kind: "target_surface", startHistory: [] },
      "surface-B": { label: "Target B surface", kind: "target_surface", startHistory: [] },
      "sample-A": { label: "Sample A", kind: "sample", startHistory: [] },
      "sample-B": { label: "Sample B", kind: "sample", startHistory: [] },
      "control-B": { label: "Witness record for B", kind: "control", startHistory: [], note: "Documentation only; it does not remove contact paths." }
    };
  }

  function build(planId, mapData) {
    if (!PLANS.some((plan) => plan.id === planId)) throw new RangeError(`Unknown plan: ${planId}`);
    const markers = mapData?.scenario_markers;
    const places = markers ? {
      prep: { ...markers.start },
      A: { ...markers.A },
      B: { ...markers.B }
    } : fallbackPlaces;
    const activeBTool = planId === "shared-tool" ? "tool-1" : "tool-2";
    const objects = objectsFor();
    const events = [];
    const add = (id, placeId, action, participants, contacts = [], type = "contact") => {
      events.push({ id, order: events.length + 1, placeId, type, action, participants, contacts });
    };
    const edge = (from, to, direction, assumption) => ({ from, to, direction, assumption });

    add("human-source", "prep", "Include a possible human-associated source on glove G1", ["human", "glove"], [
      edge("human", "glove", "forward", "Scenario assumption: a possible source is present on G1 before the traverse; no Mars-EVA measurement is implied.")
    ]);
    add("source-a", "A", "Represent possible target-A material at the work surface", ["fromA", "surface-A"], [
      edge("fromA", "surface-A", "forward", "Scenario assumption: material associated with target A is available at its surface.")
    ]);
    add("touch-a", "A", "Glove G1 contacts the target-A surface", ["glove", "surface-A"], [
      edge("surface-A", "glove", "forward", "Assumption: contact could carry target-associated material to G1."),
      edge("glove", "surface-A", "forward", "Assumption: contact could carry glove-associated material to the surface.")
    ]);
    add("collect-a", "A", "Use tool T1 to collect hypothetical sample A", ["glove", "tool-1", "surface-A", "sample-A"], [
      edge("surface-A", "tool-1", "forward", "Assumption: the sampling interface contacts the A surface."),
      edge("glove", "tool-1", "forward", "Assumption: G1 contacts T1 during the activity."),
      edge("tool-1", "sample-A", "forward", "Assumption: T1 contacts sample A during collection.")
    ]);
    add("seal-a", "A", "Seal sample A and preserve its history", ["sample-A"], [], "seal");
    add("source-b", "B", "Represent target-B material at the B work surface", ["fromB", "surface-B"], [
      edge("fromB", "surface-B", "forward", "Scenario input: B's own material is represented at its surface; this is not a contamination source.")
    ]);
    const bContacts = [
      edge("surface-B", activeBTool, "forward", "Assumption: the sampling interface contacts the B surface."),
      edge(activeBTool, "sample-B", "forward", "Assumption: the sampling interface contacts sample B.")
    ];
    if (planId !== "omit-glove-contact") {
      bContacts.push(edge("glove", activeBTool, "forward", planId === "shared-tool"
        ? "Assumption: G1 contacts shared tool T1 during the B activity."
        : "Assumption: G1 contacts separate tool T2 during the B activity."));
    }
    add("collect-b", "B", `Use ${activeBTool === "tool-1" ? "shared T1" : "separate T2"} to collect sample B`, ["glove", activeBTool, "surface-B", "sample-B"], bContacts);
    add("control-b", "B", "Record witness-control B as documentation only", ["control-B"], [], "document-control");
    add("seal-b", "B", "Seal sample B and preserve its history", ["sample-B"], [], "seal");

    return { id: planId, label: PLANS.find((plan) => plan.id === planId).label, places, sources, objects, events, sampleId: "sample-B" };
  }

  return Object.freeze({ PLANS, build });
});
