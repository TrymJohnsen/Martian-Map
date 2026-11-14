/* Step panel: Mission / Plan / Sample history, plan selection, event timeline, sample-B paths
 * and the guided walkthrough. Owns everything inside the right-hand column. It never draws on the
 * map; it announces what is focused through events documented in docs/data-contract.md
 * ("Module and event contract") and publishes the current scenario as CleanApproach.scenario. */
(function () {
  const CA = (window.CleanApproach = window.CleanApproach || {});
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const state = { plan: "shared-tool", eventIndex: 8, currentStep: "mission", guidePlaying: false, guideIndex: -1, guideTimer: null };
  const guideSteps = [
    { step: "mission", plan: "shared-tool", eventId: "seal-b", focus: "B", copy: "Bright Angel's Sapphire Canyon sample has reported organic compounds and mineral associations. B is a nominal target area." },
    { step: "plan", plan: "shared-tool", eventId: "touch-a", focus: "A", copy: "At hypothetical A, Glove G1 and Tool T1 are used before the route continues to B." },
    { step: "history", plan: "separate-tool", eventId: "seal-b", focus: "B", copy: "At B, Tool T2 is separate, while the modeled history still connects Glove G1 to Sample B." }
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let data;
  let scenario;
  let finalReplay;

  function init(context) {
    data = context.data;
    $("#guide-motion-note").hidden = !reduceMotion;
    initializePlans();
    initializeMission();
    window.addEventListener("map:place", (event) => {
      stopGuide();
      if (mission.active) focusMissionPlace(event.detail.placeId);
      else focusPlace(event.detail.placeId);
    });
    updatePlan();
  }

  function emitStep(stepId, placeId) {
    window.dispatchEvent(new CustomEvent("mission:step", { detail: { stepId, placeId } }));
  }

  function initializePlans() {
    for (const button of $$("[data-plan]")) button.addEventListener("click", () => {
      stopGuide();
      $("#plan-c-exploration").open = button.dataset.plan === "omit-glove-contact";
      if (button.dataset.plan === state.plan) return;
      state.plan = button.dataset.plan;
      state.eventIndex = scenario.events.findIndex((event) => event.id === "seal-b");
      updatePlan();
    });
    for (const button of $$(".step-panel [data-focus-place]")) button.addEventListener("click", () => {
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

  function updatePlan() {
    if (!data) return;
    scenario = CleanApproachScenario.build(state.plan, data);
    CA.scenario = scenario;
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
    window.dispatchEvent(new CustomEvent("scenario:change", { detail: { planId: state.plan } }));
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
    emitStep(event.id, event.placeId);
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
    if (placeId === "B") selectEvent(scenario.events.findIndex((event) => event.id === "seal-b"));
    else if (eventIndex >= 0) selectEvent(eventIndex);
    else emitStep(null, placeId);
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

  /* ---- Mission checklist ("build your own sequence") --------------------------------------
   * Rendered into #mission-panel. While it is open, the example-plan steps are hidden and
   * CleanApproach.scenario is the mission scenario; closing it restores the selected example plan.
   * In this mode "mission:step" carries the checklist step ID, not a scenario event ID. */
  const mission = { active: false, stepId: "kit-check", choices: null, assumptions: null, scenario: null, steps: [] };
  const SOURCE_ORDER = ["human", "fromA", "equipment", "fromB"];
  const SOURCE_LABELS = {
    human: "Possible human-associated material",
    fromA: "Possible material from hypothetical A",
    equipment: "Possible material from the equipment itself",
    fromB: "B's own sample material"
  };
  const PLACE_TAGS = { prep: "S · start", A: "A · work site", "zone-B": "Zone boundary", B: "B · sample target" };

  function h(tag, attributes = {}, ...children) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      if (value === false || value === null || value === undefined) continue;
      if (name === "class") node.className = value;
      else if (name === "text") node.textContent = value;
      else if (name.startsWith("data-")) node.setAttribute(name, value === true ? "" : String(value));
      else if (value === true) node.setAttribute(name, "");
      else node.setAttribute(name, String(value));
    }
    node.append(...children.filter((child) => child !== null && child !== undefined && child !== false));
    return node;
  }

  function initializeMission() {
    const panel = $("#mission-panel");
    panel.addEventListener("click", (event) => {
      if (event.target.closest("[data-mission-enter]")) { enterMission(); return; }
      if (event.target.closest("[data-mission-exit]")) { exitMission(); return; }
      if (event.target.closest("[data-mission-reset]")) { resetMission(); return; }
      const jump = event.target.closest("[data-mission-step]");
      if (jump) selectMissionStep(jump.dataset.missionStep, true);
    });
    panel.addEventListener("change", (event) => {
      const input = event.target;
      if (input.dataset.choice) {
        mission.choices[input.dataset.choice] = input.value === "true" ? true : input.value === "false" ? false : input.value;
        mission.stepId = input.closest("[data-step-id]").dataset.stepId;
        updateMission(input.dataset.focusKey);
      } else if (input.dataset.assumption) {
        mission.assumptions[input.dataset.assumption] = input.checked;
        updateMission(input.dataset.focusKey);
      }
    });
    renderMissionEntry();
  }

  function renderMissionEntry() {
    $("#mission-panel").replaceChildren(h("section", { class: "mission-entry", "aria-labelledby": "mission-entry-title" },
      h("p", { class: "step-kicker", text: "MISSION CHECKLIST · SCENARIO" }),
      h("h2", { id: "mission-entry-title", text: "Build your own sampling sequence" }),
      h("p", { class: "mission-entry-copy", text: `Decide the glove, the tool and the seal check at each place, and see which sources stay connected to Sample B. ${CleanApproachMission.DISCLAIMER}` }),
      h("button", { type: "button", class: "step-primary", "data-mission-enter": true, text: "Open the mission checklist" })
    ));
  }

  function enterMission() {
    stopGuide();
    mission.active = true;
    mission.choices = mission.choices || { ...CleanApproachScenario.MISSION_DEFAULTS.choices };
    mission.assumptions = mission.assumptions || { ...CleanApproachScenario.MISSION_DEFAULTS.assumptions };
    $(".step-column").classList.add("is-mission");
    updateMission("mission-title");
  }

  function exitMission() {
    mission.active = false;
    $(".step-column").classList.remove("is-mission");
    renderMissionEntry();
    updatePlan();
    $("[data-mission-enter]").focus();
  }

  function resetMission() {
    mission.choices = { ...CleanApproachScenario.MISSION_DEFAULTS.choices };
    mission.assumptions = { ...CleanApproachScenario.MISSION_DEFAULTS.assumptions };
    updateMission("mission-reset");
  }

  function replayMission(assumptions) {
    return ContactHistoryModel.replay(CleanApproachScenario.buildMission(data, mission.choices, assumptions));
  }

  function updateMission(focusKey) {
    mission.scenario = CleanApproachScenario.buildMission(data, mission.choices, mission.assumptions);
    CA.scenario = mission.scenario;
    const result = ContactHistoryModel.replay(mission.scenario);
    mission.steps = CleanApproachMission.steps(mission.scenario);
    if (!mission.steps.some((step) => step.id === mission.stepId)) mission.stepId = mission.steps[0].id;
    // A source "depends on" an assumption when switching that one assumption changes whether it reaches B.
    const present = (replayed, sourceId) => replayed.sampleHistory.some((entry) => entry.sourceId === sourceId);
    const dependence = {};
    for (const assumption of CleanApproachScenario.ASSUMPTIONS) {
      const flipped = replayMission({ ...mission.assumptions, [assumption.id]: !mission.assumptions[assumption.id] });
      for (const sourceId of SOURCE_ORDER) {
        if (present(flipped, sourceId) !== present(result, sourceId)) (dependence[sourceId] = dependence[sourceId] || []).push(assumption);
      }
    }
    renderMission(result, dependence);
    if (focusKey) $(`#mission-panel [data-focus-key="${focusKey}"]`)?.focus();
    window.dispatchEvent(new CustomEvent("scenario:change", { detail: { planId: "mission" } }));
    const step = mission.steps.find((item) => item.id === mission.stepId);
    emitStep(step.id, step.placeId);
  }

  function selectMissionStep(stepId, moveFocus = false) {
    const step = mission.steps.find((item) => item.id === stepId);
    if (!step) return;
    mission.stepId = stepId;
    $$("#mission-panel [data-step-id]").forEach((item) => {
      if (item.dataset.stepId === stepId) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
    });
    if (moveFocus) $(`#mission-panel [data-step-id="${stepId}"] .mission-step-head`)?.focus();
    emitStep(step.id, step.placeId);
  }

  function focusMissionPlace(placeId) {
    const step = mission.steps.find((item) => item.placeId === placeId);
    if (step) selectMissionStep(step.id, true);
    else emitStep(null, placeId);
  }

  function renderMissionStep(step) {
    const decision = step.decision && h("fieldset", { class: "mission-decision" },
      h("legend", { text: `Your choice · ${step.decision.legend}` }),
      ...step.decision.options.map((option) => {
        const key = `${step.decision.key}:${option.value}`;
        return h("label", { class: "mission-option" },
          h("input", { type: "radio", name: `mission-${step.decision.key}`, value: String(option.value), "data-choice": step.decision.key,
            "data-focus-key": key, checked: mission.choices[step.decision.key] === option.value }),
          h("span", { text: option.label }));
      }));
    const precedent = step.precedent
      ? h("p", { class: "mission-precedent" },
        h("span", { class: "mission-precedent-label", text: "Precedent: " }),
        h("a", { href: step.precedent.url, target: "_blank", rel: "noreferrer", text: `${step.precedent.label} ↗` }),
        h("span", { class: "mission-precedent-note", text: ` ${CleanApproachMission.PRECEDENT_NOTE}` }))
      : h("p", { class: "mission-precedent mission-precedent-none", text: "Scenario step · no documented precedent is claimed." });
    return h("li", { class: `mission-step mission-step-${step.kind}`, "data-step-id": step.id, "aria-current": step.id === mission.stepId ? "step" : null },
      h("button", { type: "button", class: "mission-step-head", "data-mission-step": step.id },
        h("span", { class: "mission-step-number", text: String(step.order) }),
        h("span", { class: "mission-step-place", text: PLACE_TAGS[step.placeId] || step.placeId }),
        h("span", { class: "mission-step-title", text: step.title })),
      h("p", { class: "mission-instruction", text: step.instruction }),
      h("p", { class: "mission-why", text: `Why: ${step.why}` }),
      decision,
      precedent);
  }

  function renderMissionSource(sourceId, result, dependence) {
    const entry = result.sampleHistory.find((item) => item.sourceId === sourceId);
    const children = [
      h("span", { class: "source-chip", text: SOURCE_LABELS[sourceId] }),
      h("span", { class: "mission-source-state", text: entry ? "Modeled path to Sample B" : "No modeled path to Sample B" })
    ];
    if (entry) {
      const nodes = entry.path.map((edge) => edge.to);
      const label = (id) => mission.scenario.sources[id]?.label || mission.scenario.objects[id]?.label || id;
      children.push(h("span", { class: "object-chain", text: nodes.map(label).join(" → ") }));
      const created = CleanApproachMission.stepsForPath(mission.steps, entry.path);
      const origin = h("span", { class: "mission-source-steps" }, h("span", { text: "Created at: " }));
      if (created.startingAssumption) origin.append(h("span", { class: "mission-source-start", text: "a starting assumption about the equipment" }));
      created.steps.forEach((step, index) => {
        if (index || created.startingAssumption) origin.append(" · ");
        origin.append(h("button", { type: "button", class: "trace-link", "data-mission-step": step.id, text: `step ${step.order} · ${step.title}` }));
      });
      children.push(origin);
    }
    if (sourceId === "fromB") children.push(h("span", { class: "mission-source-note", text: "The sample's own material, not an external source." }));
    for (const assumption of dependence[sourceId] || []) {
      children.push(h("span", { class: "mission-depends", text: `Depends on this assumption: ${assumption.label}` }));
    }
    return h("li", { class: `mission-source source-${sourceId} ${entry ? "is-present" : "is-absent"}`, "data-source-id": sourceId, "data-present": String(Boolean(entry)) }, ...children);
  }

  function renderMissionStatus(result) {
    const seal = result.seals["sample-B"];
    const witness = result.records.some((record) => record.tag === "witness-open");
    const objectLabel = (id) => mission.scenario.objects[id]?.label || id;
    const items = [
      h("li", { class: "mission-status-seal", "data-seal": seal?.integrity || "none", text: seal?.integrity === "checked"
        ? "Seal checked: visible dust was removed from the sealing surface before sealing. Status only; it changes no path."
        : "Seal not checked: the sealing surface was not examined before sealing. Status only; it changes no path." }),
      h("li", { class: "mission-status-witness", "data-witness": String(witness), text: witness
        ? "Witness tube opened: equipment and surroundings can be characterized later. The modeled paths stay."
        : "No witness tube opened: there is no witness record for this sample." })
    ];
    if (!result.ruleWarnings.length) {
      items.push(h("li", { class: "mission-status-rule", "data-rule-warnings": "0", text: "Work-zone rule: no contact inside the zone involves Outer glove G1 or Tool T1." }));
    }
    for (const warning of result.ruleWarnings) {
      const step = mission.steps.find((item) => item.eventIds.includes(warning.eventId));
      items.push(h("li", { class: "mission-status-rule is-warning", "data-rule-warnings": String(result.ruleWarnings.length) },
        h("strong", { text: "Work-zone rule not followed: " }),
        `${objectLabel(warning.objectId)} takes part in a contact inside the work zone`,
        step ? h("span", {}, " (", h("button", { type: "button", class: "trace-link", "data-mission-step": step.id, text: `step ${step.order}` }), ")") : null,
        ". This is a warning; the path stays in the history."));
    }
    return h("ul", { class: "mission-status" }, ...items);
  }

  function renderMission(result, dependence) {
    const reaching = SOURCE_ORDER.filter((id) => id !== "fromB" && result.sampleHistory.some((entry) => entry.sourceId === id));
    const summary = reaching.length
      ? `External sources with a modeled path to Sample B: ${reaching.map((id) => SOURCE_LABELS[id]).join("; ")}.`
      : "No external source has a modeled path to Sample B in this sequence. That describes these assumed contacts; it is not a finding about a real sample.";
    const card = h("section", { class: "mission-card", "aria-labelledby": "mission-title" },
      h("header", { class: "mission-header" },
        h("p", { class: "step-kicker", text: "MISSION CHECKLIST · SCENARIO" }),
        h("h2", { id: "mission-title", tabindex: "-1", "data-focus-key": "mission-title", text: "Build your own sampling sequence" }),
        h("p", { class: "mission-disclaimer", text: `${CleanApproachMission.DISCLAIMER} Each precedent shows that a practice exists; none is validated for Mars EVA. Paths are assumed contacts, not measured contamination.` }),
        h("div", { class: "mission-actions" },
          h("button", { type: "button", class: "plain-button", "data-mission-exit": true, text: "← Back to example plans" }),
          h("button", { type: "button", class: "plain-button", "data-mission-reset": true, "data-focus-key": "mission-reset", text: "Reset choices" }))),
      h("ol", { class: "mission-steps", "aria-label": "Mission checklist steps" }, ...mission.steps.map(renderMissionStep)),
      h("section", { class: "mission-assumptions", "aria-labelledby": "mission-assumptions-title" },
        h("h3", { id: "mission-assumptions-title", text: "Assumptions you can switch" }),
        h("p", { class: "mission-assumptions-copy", text: "These are suppositions about the objects, not observations. The result below depends on them." }),
        ...CleanApproachScenario.ASSUMPTIONS.map((assumption) => h("label", { class: "mission-assumption" },
          h("input", { type: "checkbox", "data-assumption": assumption.id, "data-focus-key": `assumption:${assumption.id}`, checked: mission.assumptions[assumption.id] }),
          h("span", {}, h("b", { text: assumption.label }), h("small", { text: assumption.text }))))),
      h("section", { class: "mission-result", "aria-labelledby": "mission-result-title", "aria-live": "polite" },
        h("h3", { id: "mission-result-title", text: "What connects to Sample B" }),
        h("p", { class: "mission-summary", text: summary }),
        h("ul", { class: "mission-sources", "aria-label": "Source groups and their modeled paths to Sample B" },
          ...SOURCE_ORDER.map((sourceId) => renderMissionSource(sourceId, result, dependence))),
        renderMissionStatus(result),
        h("p", { class: "mission-footnote", text: "No score and no ranking: two sequences are compared only by which assumed contacts they contain." })),
      h("section", { class: "mission-not-modeled", "aria-labelledby": "mission-not-modeled-title" },
        h("h3", { id: "mission-not-modeled-title", text: "Not modeled" }),
        h("p", { text: "These can matter on a real EVA, but this project has no data to connect them to a sample, so no path is drawn for them." }),
        h("ul", {}, ...CleanApproachMission.NOT_MODELED.map((item) => h("li", { "data-not-modeled": item.id }, h("b", { text: `${item.label}. ` }), item.reason)))));
    $("#mission-panel").replaceChildren(card);
  }

  CA.panel = { init };
})();
