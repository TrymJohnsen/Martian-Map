/* Fully illustrative human activity scenario located on the available CTX crop. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CleanApproachScenario = api;
})(globalThis, function () {
  const PLANS = Object.freeze([
    { id: "shared-tool", label: "Reuse the tool", summary: "Use tool T1 at A and B." },
    { id: "separate-tool", label: "Use a separate tool", summary: "Use T1 at A and T2 at B; the modeled glove contact remains." },
    { id: "omit-glove-contact", label: "What if this contact is avoided?", summary: "Counterfactual: omit the modeled G1 → T2 contact at B." }
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

  /* ---- Mission checklist scenario -------------------------------------------------------
   * A separate builder for the "build your own sequence" mode. It never changes build() above.
   * Choices are what the astronaut does; assumptions are what the team supposes about objects.
   * Nothing here protects a sample: a path disappears only when the chosen sequence contains
   * no edge for it. */
  const SAMPLERS = Object.freeze(["tool-1", "tool-2", "tongs", "hand"]);
  const WORK_ZONE_RADIUS_M = 50; // Planning rule chosen by the team, not an observation.
  const MISSION_DEFAULTS = Object.freeze({
    choices: Object.freeze({ gloveSwap: true, sampler: "tongs", sealSurfaceChecked: true, witnessOpened: true }),
    assumptions: Object.freeze({ g2CarriesHuman: true, equipmentSource: false, swapContact: false })
  });
  const ASSUMPTIONS = Object.freeze([
    {
      id: "g2CarriesHuman", defaultOn: true,
      label: "Glove G2 carries human material",
      text: "On by default: no data shows that an outer glove put on during an EVA is free of human-associated material. Switching it off is a what-if, not a finding."
    },
    {
      id: "swapContact", defaultOn: false,
      label: "G1 touches G2 at the change",
      text: "Off by default. Switch it on to include a contact from the removed glove G1 to G2 during the change."
    },
    {
      id: "equipmentSource", defaultOn: false,
      label: "The equipment is a source",
      text: "Off by default. Switch it on to treat seals, coatings, lubricants and bag material of the tools and tube as a possible source."
    }
  ]);
  const missionSources = {
    ...sources,
    equipment: { label: "Possible material from the equipment itself (seals, bags, lubricants)", kind: "equipment_scenario_source" }
  };

  function cellSizeM(mapData) {
    return mapData?.raster?.pixel_size_m || [20, 20];
  }

  /* The zone boundary is the first valid cell outside the work-zone radius, walking from B back
   * toward A along the same rasterised line the route profile samples. */
  function zoneBoundaryPlace(places, mapData, radiusM) {
    const { A, B } = places;
    const [cellX, cellY] = cellSizeM(mapData);
    const width = mapData?.raster?.width;
    const mask = mapData?.arrays?.valid_mask;
    const steps = Math.max(Math.abs(B.row - A.row), Math.abs(B.col - A.col));
    for (let step = steps - 1; step >= 1; step--) {
      const fraction = step / steps;
      const row = Math.round(A.row + (B.row - A.row) * fraction);
      const col = Math.round(A.col + (B.col - A.col) * fraction);
      const distanceM = Math.hypot((row - B.row) * cellY, (col - B.col) * cellX);
      if (distanceM <= radiusM) continue;
      if (mask && !mask[row * width + col]) continue;
      return {
        label: "Work-zone boundary · planning rule", short: "", row, col, kind: "illustrative_scenario",
        distance_to_B_m: Math.round(distanceM),
        note: "A point on the A–B route just outside the scenario work zone. It is a planning rule, not an observation."
      };
    }
    throw new RangeError("No valid cell on the A–B line lies outside the work zone");
  }

  function missionObjects(assumptions) {
    const equipment = (label) => assumptions.equipmentSource
      ? [{ sourceId: "equipment", assumption: `Assumption (switchable): materials of ${label} itself, such as seals, coatings, lubricants or bag residue, are a possible source.` }]
      : [];
    const noSource = "Declared starting history: no scenario source assigned; this is not a sterility claim.";
    return {
      glove: { label: "Outer glove G1", kind: "glove", startHistory: [], note: "Its possible source history is established by events." },
      "glove-2": { label: "Outer glove G2", kind: "glove", startHistory: [], note: "Not used at A. Whether it carries human-associated material is a switchable assumption." },
      "tool-1": { label: "Sample tool T1", kind: "tool", startHistory: equipment("T1"), note: noSource },
      "tool-2": { label: "Sample tool T2", kind: "tool", startHistory: equipment("T2"), note: "Kept in a sealed, unopened bag until B. " + noSource },
      tongs: { label: "Tongs", kind: "tool", startHistory: equipment("the tongs"), note: "Kept in a sealed, unopened bag until B. The glove still holds the tongs. " + noSource },
      "tube-B": { label: "Sample tube B", kind: "container", startHistory: equipment("tube B"), note: "Kept in a sealed, unopened bag until B. " + noSource },
      "bag-used": { label: "Used-equipment bag", kind: "container", startHistory: [], note: "A record of where used items are kept; it removes no path." },
      "witness-B": { label: "Witness tube B", kind: "control", startHistory: [], note: "Documentation only; it does not remove contact paths." },
      "surface-A": { label: "Target A surface", kind: "target_surface", startHistory: [] },
      "surface-B": { label: "Target B surface", kind: "target_surface", startHistory: [] },
      "sample-A": { label: "Sample A", kind: "sample", startHistory: [] },
      "sample-B": { label: "Sample B", kind: "sample", startHistory: [] }
    };
  }

  function buildMission(mapData, choiceInput = {}, assumptionInput = {}) {
    const choices = { ...MISSION_DEFAULTS.choices, ...choiceInput };
    const assumptions = { ...MISSION_DEFAULTS.assumptions, ...assumptionInput };
    if (!SAMPLERS.includes(choices.sampler)) throw new RangeError(`Unknown sampler: ${choices.sampler}`);
    const markers = mapData?.scenario_markers;
    const places = markers
      ? { prep: { ...markers.start }, A: { ...markers.A }, B: { ...markers.B } }
      : { prep: { ...fallbackPlaces.prep }, A: { ...fallbackPlaces.A }, B: { ...fallbackPlaces.B } };
    places["zone-B"] = zoneBoundaryPlace(places, mapData, WORK_ZONE_RADIUS_M);
    const [cellX, cellY] = cellSizeM(mapData);
    const insideZone = Object.keys(places).filter((placeId) => Math.hypot(
      (places[placeId].row - places.B.row) * cellY, (places[placeId].col - places.B.col) * cellX) <= WORK_ZONE_RADIUS_M);
    const zones = [{
      id: "work-zone-B", kind: "work-zone", centerPlaceId: "B", radius_m: WORK_ZONE_RADIUS_M, placeIds: insideZone,
      label: "Sample B work zone · planning rule, not an observation", evidence: "scenario"
    }];
    const rules = [{
      id: "keep-out-B", kind: "keep-out", zoneId: "work-zone-B", objectIds: ["glove", "tool-1"],
      label: "Outer glove G1 and Tool T1, both used at A, stay out of the sample B work zone"
    }];

    const objects = missionObjects(assumptions);
    const events = [];
    const add = (id, placeId, action, participants, contacts = [], type = "contact", extra = {}) => {
      events.push({ id, order: events.length + 1, placeId, type, action, participants, contacts, ...extra });
    };
    const record = (id, placeId, action, participants, tag) => add(id, placeId, action, participants, [], "document-control", { tag });
    const edge = (from, to, assumption) => ({ from, to, direction: "forward", assumption });

    add("m-human-g1", "prep", "Include a possible human-associated source on outer glove G1", ["human", "glove"], [
      edge("human", "glove", "Scenario assumption: a possible source is present on G1 before the traverse; no Mars-EVA measurement is implied.")
    ]);
    record("m-kit-check", "prep", "Record that T2, the tongs and tube B are in sealed, unopened bags", ["tool-2", "tongs", "tube-B"], "kit-check");

    add("m-source-a", "A", "Represent possible target-A material at the work surface", ["fromA", "surface-A"], [
      edge("fromA", "surface-A", "Scenario assumption: material associated with target A is available at its surface.")
    ]);
    record("m-photo-a", "A", "Photograph sample A in place with the gnomon", ["surface-A"], "photo");
    add("m-touch-a", "A", "Outer glove G1 contacts the target-A surface", ["glove", "surface-A"], [
      edge("surface-A", "glove", "Assumption: contact could carry target-associated material to G1."),
      edge("glove", "surface-A", "Assumption: contact could carry glove-associated material to the surface.")
    ]);
    add("m-collect-a", "A", "Use tool T1 to collect hypothetical sample A", ["glove", "tool-1", "surface-A", "sample-A"], [
      edge("surface-A", "tool-1", "Assumption: the sampling interface contacts the A surface."),
      edge("glove", "tool-1", "Assumption: G1 holds T1 during the activity."),
      edge("tool-1", "sample-A", "Assumption: T1 contacts sample A during collection.")
    ]);
    add("m-seal-a", "A", "Seal sample A in its numbered bag and preserve its history", ["sample-A"], [], "seal");
    record("m-bag-t1", "A", "Record that T1 is placed in the used-equipment bag", ["tool-1", "bag-used"], "stow");

    const activeGlove = choices.gloveSwap ? "glove-2" : "glove";
    if (choices.gloveSwap) {
      record("m-glove-off", "zone-B", "Record that outer glove G1 is taken off and bagged", ["glove", "bag-used"], "glove-off");
      const donContacts = [];
      const donParticipants = ["glove-2"];
      if (assumptions.g2CarriesHuman) {
        donParticipants.push("human");
        donContacts.push(edge("human", "glove-2", "Assumption (on by default): G2 carries possible human-associated material once it is put on; no data shows otherwise."));
      }
      if (assumptions.swapContact) {
        donParticipants.push("glove");
        donContacts.push(edge("glove", "glove-2", "Assumption (switchable): G1 touches G2 while the gloves are changed."));
      }
      if (donContacts.length) add("m-glove-on", "zone-B", "Put on outer glove G2", donParticipants, donContacts);
      else record("m-glove-on", "zone-B", "Record that outer glove G2 is put on; no contact is assumed", donParticipants, "glove-on");
    } else {
      record("m-glove-keep", "zone-B", "Record that outer glove G1 stays on; no glove change", ["glove"], "glove-kept");
    }

    add("m-source-b", "B", "Represent target-B material at the B work surface", ["fromB", "surface-B"], [
      edge("fromB", "surface-B", "Scenario input: B's own material is represented at its surface; this is not a contamination source.")
    ]);
    record("m-photo-b", "B", "Photograph sample B in place with the gnomon", ["surface-B"], "photo");
    if (choices.witnessOpened) record("m-witness-open", "B", "Record that witness tube B is open during the work", ["witness-B"], "witness-open");

    const gloveName = objects[activeGlove].label;
    const tubeContacts = [
      edge(activeGlove, "tube-B", `Assumption: ${gloveName} holds tube B.`),
      edge("tube-B", "sample-B", "Assumption: sample B is placed in tube B and touches its interior.")
    ];
    if (choices.sampler === "hand") {
      add("m-collect-b", "B", `Pick up sample B by hand with ${gloveName}`, [activeGlove, "surface-B", "tube-B", "sample-B"], [
        edge("surface-B", activeGlove, `Assumption: ${gloveName} contacts the B surface while picking up the sample.`),
        edge(activeGlove, "sample-B", `Assumption: ${gloveName} contacts sample B directly.`),
        ...tubeContacts
      ]);
    } else {
      const toolName = objects[choices.sampler].label;
      add("m-collect-b", "B", `Use ${toolName} to collect sample B`, [activeGlove, choices.sampler, "surface-B", "tube-B", "sample-B"], [
        edge("surface-B", choices.sampler, "Assumption: the sampling interface contacts the B surface."),
        edge(activeGlove, choices.sampler, `Assumption: ${gloveName} holds ${toolName}; using a tool does not remove this contact.`),
        edge(choices.sampler, "sample-B", "Assumption: the sampling interface contacts sample B."),
        ...tubeContacts
      ]);
    }
    add("m-seal-b", "B", choices.sealSurfaceChecked
      ? "Remove visible dust from the sealing surface, then seal tube B"
      : "Seal tube B without checking the sealing surface", ["sample-B", "tube-B"], [], "seal",
      { integrity: choices.sealSurfaceChecked ? "checked" : "unchecked" });
    record("m-log-b", "B", "Record the sample ID, tube ID and witness-tube ID", ["tube-B", "witness-B"], "log");

    return {
      id: "mission", label: "Your sampling sequence", places, sources: missionSources, objects, events, sampleId: "sample-B",
      route: ["prep", "A", "zone-B", "B"], zones, rules, choices, assumptions
    };
  }

  return Object.freeze({ PLANS, build, buildMission, MISSION_DEFAULTS, ASSUMPTIONS, SAMPLERS });
});
