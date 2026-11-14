/* Mission checklist: turns a mission scenario's events into the steps an astronaut reads.
 * Every step names the documented practice it is inspired by (see docs/science.md, "Sampling
 * precedents"). A precedent shows the practice exists; it does not validate the step for Mars
 * EVA and it changes no contact path. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CleanApproachMission = api;
})(globalThis, function () {
  const DISCLAIMER = "Scenario steps and hypotheses, not a validated EVA procedure.";
  const PRECEDENT_NOTE = "Inspired by this practice; not validated for Mars EVA.";

  const PRECEDENTS = Object.freeze({
    tubes: {
      label: "Perseverance: 43 sample tubes, each hermetically sealed",
      url: "https://www.jpl.nasa.gov/news/a-martian-roundtrip-nasas-perseverance-rover-sample-tubes/"
    },
    documented: {
      label: "Apollo: gnomon for scale and colour, numbered sample bags (Allton 1989)",
      url: "https://an.rsl.wustl.edu/apollo/data/A12/resources/LunarSampleToolCatalog.pdf"
    },
    zoning: {
      label: "Crewed-Mars planning uses zoning (Spry et al. 2024); the glove change itself is a scenario step",
      url: "https://elib.dlr.de/203376/1/spry-et-al-2024-planetary-protection-knowledge-gap-closure-enabling-crewed-missions-to-mars.pdf"
    },
    witness: {
      label: "Perseverance witness tubes, opened on Mars to record the surroundings",
      url: "https://science.nasa.gov/resource/witness-tube-in-perseverance-sample-caching-system"
    },
    tongs: {
      label: "Apollo tongs for picking up small rocks; tongs and scoop planned for Artemis (Naids et al. 2021)",
      url: "https://ntrs.nasa.gov/api/citations/20210000242/downloads/Developing%20Geology%20Sampling%20Tools_Lunar%20Surface%20Science%20Workshop_FINAL_2021.pdf"
    },
    rockBox: {
      label: "Apollo: 4 of 12 sample return containers leaked from bag material or dust on the sealing surface",
      url: "https://ntrs.nasa.gov/api/citations/20080003835/downloads/20080003835.pdf"
    },
    archive: {
      label: "OSIRIS-REx: witness material and archived components kept for later comparison",
      url: "https://ntrs.nasa.gov/api/citations/20180002869/downloads/20180002869.pdf"
    }
  });

  const NOT_MODELED = Object.freeze([
    { id: "suit-leak", label: "Leakage and venting from the suit", reason: "Crewed-Mars planning expects leakage at suit joints and seals (Spry et al. 2024). No data says what would reach a sample." },
    { id: "raised-dust", label: "Dust raised by walking", reason: "No measurement links crew-raised dust to a sample at this site." },
    { id: "wind", label: "Wind", reason: "No wind dataset for Bright Angel is part of this project." },
    { id: "lander-exhaust", label: "Lander exhaust", reason: "No landing site or exhaust data is part of this scenario." }
  ]);

  const SAMPLER_LABELS = Object.freeze({
    "tool-1": "Tool T1 (used at A)",
    "tool-2": "Tool T2 (from its sealed bag)",
    tongs: "Tongs (from their sealed bag)",
    hand: "By hand, with the glove"
  });

  function steps(scenario) {
    const choices = scenario.choices;
    const eventIds = new Set(scenario.events.map((event) => event.id));
    const present = (ids) => ids.filter((id) => eventIds.has(id));
    const list = [
      {
        id: "kit-check", placeId: "prep", kind: "check",
        title: "Check the sealed kit",
        instruction: "Confirm that Tool T2, the tongs and tube B are in sealed, unopened bags. They are opened only at B.",
        why: "Items that stay bagged take part in no contact before B, so no modeled path runs through them on the way.",
        precedent: PRECEDENTS.tubes, eventIds: present(["m-human-g1", "m-kit-check"])
      },
      {
        id: "collect-a", placeId: "A", kind: "sample",
        title: "Document and collect sample A",
        instruction: "Place the gnomon and photograph the sample in place. Collect sample A with Tool T1, put it in a numbered bag and seal it.",
        why: "Outer glove G1 and Tool T1 now have a modeled contact with site A.",
        precedent: PRECEDENTS.documented, eventIds: present(["m-source-a", "m-photo-a", "m-touch-a", "m-collect-a", "m-seal-a"])
      },
      {
        id: "stow-t1", placeId: "A", kind: "stow",
        title: "Bag the used tool",
        instruction: "Put Tool T1 in the used-equipment bag. The plan keeps it out of the B work zone.",
        why: "Bagging is a record of where the tool is. It removes no path that already exists.",
        precedent: null, eventIds: present(["m-bag-t1"])
      },
      {
        id: "glove-change", placeId: "zone-B", kind: "glove",
        title: "Change the outer glove at the zone boundary",
        instruction: choices.gloveSwap
          ? "Stop at the boundary. Take off outer glove G1, bag it, and put on outer glove G2, which was not used at A."
          : "Walk into the work zone still wearing outer glove G1.",
        why: "G1 has a modeled contact with site A. What G2 carries is an assumption you can switch below.",
        precedent: PRECEDENTS.zoning, eventIds: present(["m-glove-off", "m-glove-on", "m-glove-keep"]),
        decision: {
          key: "gloveSwap", legend: "Outer glove at the boundary",
          options: [{ value: true, label: "Change to G2" }, { value: false, label: "Keep G1 on" }]
        }
      },
      {
        id: "witness", placeId: "B", kind: "witness",
        title: "Photograph the target and open the witness tube",
        instruction: choices.witnessOpened
          ? "Photograph the target in place. Open witness tube B and leave it open while you work."
          : "Photograph the target in place. Witness tube B stays closed.",
        why: "A witness tube records what was around the sample. It adds knowledge and removes no path.",
        precedent: PRECEDENTS.witness, eventIds: present(["m-source-b", "m-photo-b", "m-witness-open"]),
        decision: {
          key: "witnessOpened", legend: "Witness tube B",
          options: [{ value: true, label: "Open it" }, { value: false, label: "Leave it closed" }]
        }
      },
      {
        id: "collect-b", placeId: "B", kind: "sample",
        title: "Collect sample B",
        instruction: choices.sampler === "hand"
          ? "Pick up sample B by hand and place it in tube B."
          : `Collect sample B with ${{ "tool-1": "Tool T1", "tool-2": "Tool T2", tongs: "the tongs" }[choices.sampler]} and place it in tube B.`,
        why: "Whatever touches the sample joins its history. The glove holds the tool and the tube, so those contacts stay in the model.",
        precedent: PRECEDENTS.tongs, eventIds: present(["m-collect-b"]),
        decision: {
          key: "sampler", legend: "How sample B is picked up",
          options: ["tongs", "tool-2", "tool-1", "hand"].map((value) => ({ value, label: SAMPLER_LABELS[value] }))
        }
      },
      {
        id: "seal-b", placeId: "B", kind: "seal",
        title: "Seal tube B",
        instruction: choices.sealSurfaceChecked
          ? "Remove visible dust from the sealing surface, then seal tube B."
          : "Seal tube B without checking the sealing surface.",
        why: "Sealing freezes the sample's history. Checking the surface changes the recorded seal status, not the contact paths.",
        precedent: PRECEDENTS.rockBox, eventIds: present(["m-seal-b"]),
        decision: {
          key: "sealSurfaceChecked", legend: "Sealing surface",
          options: [{ value: true, label: "Remove visible dust first" }, { value: false, label: "Seal without checking" }]
        }
      },
      {
        id: "log-b", placeId: "B", kind: "log",
        title: "Log the IDs",
        instruction: "Record the sample ID, tube ID and witness-tube ID.",
        why: "A log lets later analysts match the sample to its handling record. It removes no path.",
        precedent: PRECEDENTS.archive, eventIds: present(["m-log-b"])
      }
    ];
    return list.map((step, index) => ({ order: index + 1, ...step }));
  }

  /* Which checklist steps created the edges of one source path. Edges without an event come from
   * a declared starting assumption on an object. */
  function stepsForPath(stepList, path) {
    const created = [];
    let startingAssumption = false;
    for (const edge of path) {
      if (!edge.eventId) { startingAssumption = true; continue; }
      const step = stepList.find((item) => item.eventIds.includes(edge.eventId));
      if (step && !created.includes(step)) created.push(step);
    }
    return { steps: created, startingAssumption };
  }

  return Object.freeze({ steps, stepsForPath, PRECEDENTS, NOT_MODELED, SAMPLER_LABELS, DISCLAIMER, PRECEDENT_NOTE });
});
