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
    window.addEventListener("map:place", (event) => { stopGuide(); focusPlace(event.detail.placeId); });
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

  CA.panel = { init };
})();
