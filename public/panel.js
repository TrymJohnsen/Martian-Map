/* Panel: everything outside the map card. Four views (Mission intro, Checklist, Example plans,
 * Data & assumptions), the mission checklist with its result and assumptions, the example-plan
 * comparison with its event timeline and walkthrough. It never draws on the map; it publishes the
 * current scenario as CleanApproach.scenario and talks to map.js through the events documented in
 * docs/data-contract.md ("Module and event contract").
 * Markup follows the design system in tokens.css / components.css. Behaviour depends only on the
 * data attributes listed in docs/data-contract.md ("Mission panel markup hooks"). */
(function () {
  const CA = (window.CleanApproach = window.CleanApproach || {});
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const VIEWS = ["intro", "checklist", "examples", "data"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = { view: "intro", plan: "shared-tool", eventIndex: 8, playing: false, timer: null, noteHidden: false };
  const mission = { stepId: "kit-check", choices: null, assumptions: null, scenario: null, steps: [], result: null };
  let data;
  let scenario;

  const SOURCE_ORDER = ["human", "fromA", "equipment", "fromB"];
  const SOURCE_LABELS = {
    human: "Possible human-associated material",
    fromA: "Possible material from hypothetical A",
    equipment: "Possible material from the equipment itself",
    fromB: "B's own sample material"
  };
  const SOURCE_SHORT = { human: "Human-associated", fromA: "Hypothetical A", equipment: "Equipment itself", fromB: "Is Sample B" };
  const PLACE_TAGS = { prep: "S · Start", A: "A · Work site", "zone-B": "Zone boundary", B: "B · Sample target" };
  const PLACE_SHORT = { prep: "S", A: "A", "zone-B": "Zone", B: "B" };
  const NODE_SHORT = {
    human: "Human", fromA: "Site A", fromB: "Site B", glove: "G1", "tool-1": "T1", "tool-2": "T2",
    "surface-A": "A surface", "surface-B": "B surface", "sample-A": "Sample A", "sample-B": "Sample B", "control-B": "Witness record"
  };

  /* ---- Small DOM helpers ------------------------------------------------------------------ */
  function h(tag, attributes = {}, ...children) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      if (value === false || value === null || value === undefined) continue;
      if (name === "class") node.className = value;
      else if (name === "text") node.textContent = value;
      else if (value === true) node.setAttribute(name, "");
      else node.setAttribute(name, String(value));
    }
    node.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
    return node;
  }
  const STROKES = {
    arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    chevLeft: '<path d="M15 6l-6 6 6 6"/>',
    chevRight: '<path d="M9 6l6 6-6 6"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    linkOn: '<circle cx="5.5" cy="12" r="3"/><circle cx="18.5" cy="12" r="3"/><path d="M8.5 12h7"/>',
    linkOff: '<circle cx="5.5" cy="12" r="3"/><circle cx="18.5" cy="12" r="3"/><path d="M8.5 12h1.5M14 12h1.5"/><path d="M12 9v6" stroke-dasharray="1.5 2"/>',
    warn: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.5h.01"/>',
    seal: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12.5l3 3 5-6"/>',
    tube: '<path d="M9 3h6"/><path d="M10 3v14.5a2 2 0 0 0 4 0V3"/><path d="M10 11h4"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>'
  };
  const MARKS = {
    human: '<circle cx="9" cy="9" r="6.5" style="fill:var(--human)"/>',
    fromA: '<path d="M9 1.8L16.2 9 9 16.2 1.8 9z" style="fill:var(--a)"/>',
    equipment: '<path d="M9 2.2L16.4 15.4H1.6z" style="fill:var(--equip)"/>',
    fromB: '<rect x="2" y="2" width="14" height="14" rx="3.5" fill="none" stroke-width="2" style="stroke:var(--bown)"/><rect x="6" y="6" width="6" height="6" rx="1" style="fill:var(--bown)"/>'
  };
  function svg(inner, size, viewBox, extra = "") {
    const holder = document.createElement("span");
    holder.innerHTML = `<svg width="${size}" height="${size}" viewBox="${viewBox}" aria-hidden="true" ${extra}>${inner}</svg>`;
    return holder.firstChild;
  }
  const icon = (name, size = 16) => svg(STROKES[name], size, "0 0 24 24", 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
  const mark = (sourceId, size = 18) => svg(MARKS[sourceId], size, "0 0 18 18");
  const scenarioGlyph = () => svg('<rect x="1" y="1" width="10" height="10"/>', 12, "0 0 12 12", 'fill="none" stroke-width="1.4" stroke-dasharray="2.4 1.6" style="stroke:var(--scn)"');
  const scenarioBadge = () => h("span", { class: "ev ev-scn" }, scenarioGlyph(), "Scenario");
  const pill = (present) => h("span", { class: `pill ${present ? "pill-on" : "pill-off"}` }, icon(present ? "linkOn" : "linkOff"), present ? "Modeled path to Sample B" : "No modeled path to Sample B");

  function emitStep(stepId, placeId) {
    window.dispatchEvent(new CustomEvent("mission:step", { detail: { stepId, placeId } }));
  }
  function publish(nextScenario, planId) {
    CA.scenario = nextScenario;
    window.dispatchEvent(new CustomEvent("scenario:change", { detail: { planId } }));
  }

  /* ---- Views -------------------------------------------------------------------------------- */
  function init(context) {
    data = context.data;
    mission.choices = { ...CleanApproachScenario.MISSION_DEFAULTS.choices };
    mission.assumptions = { ...CleanApproachScenario.MISSION_DEFAULTS.assumptions };
    const { nodata_count: missing, valid_count: valid } = data.raster;
    $("#nodata-share").textContent = `${missing.toLocaleString("en-US")} of ${(missing + valid).toLocaleString("en-US")} cells`;
    $("#data-not-modeled").replaceChildren(...notModeledItems());

    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-view-link]");
      if (link) { event.preventDefault(); showView(link.dataset.viewLink); return; }
      if (event.target.closest("[data-mission-enter]")) { showView("checklist"); return; }
      if (event.target.closest("[data-mission-exit]")) { showView("examples"); return; }
      if (event.target.closest("[data-mission-reset]")) { resetMission(); return; }
      const stepLink = event.target.closest("[data-mission-step]");
      if (stepLink) { selectMissionStep(stepLink.dataset.missionStep, true); return; }
      const assumptionLink = event.target.closest("[data-assumption-link]");
      if (assumptionLink) { $(`#mission-side [data-assumption="${assumptionLink.dataset.assumptionLink}"]`)?.focus(); return; }
      const action = event.target.closest("[data-action]");
      if (action) runAction(action.dataset.action, action);
    });
    document.addEventListener("change", (event) => {
      const input = event.target;
      if (input.dataset.choice) {
        mission.choices[input.dataset.choice] = input.value === "true" ? true : input.value === "false" ? false : input.value;
        updateMission(input.dataset.focusKey);
      } else if (input.dataset.assumption) {
        mission.assumptions[input.dataset.assumption] = input.checked;
        updateMission(input.dataset.focusKey);
      }
    });
    window.addEventListener("map:place", (event) => {
      stopWalk();
      const placeId = event.detail.placeId;
      if (state.view === "examples") focusExamplePlace(placeId);
      else if (state.view === "checklist") focusMissionPlace(placeId);
      else emitStep(null, placeId);
    });
    window.addEventListener("hashchange", () => showView(location.hash.slice(1), { fromHash: true }));
    showView(location.hash.slice(1) || "intro", { fromHash: true, focus: false });
  }

  function showView(view, { fromHash = false, focus = true } = {}) {
    if (!VIEWS.includes(view)) view = "intro";
    stopWalk();
    state.view = view;
    document.body.dataset.view = view;
    $$(".tab").forEach((tab) => { if (tab.dataset.viewLink === view) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current"); });
    if (!fromHash && location.hash.slice(1) !== view) history.replaceState(null, "", `#${view}`);
    if (view === "examples") updatePlan();
    else updateMission();
    // The map card changes size between views; map.js re-measures its canvas on resize.
    window.dispatchEvent(new Event("resize"));
    if (view === "data") window.dispatchEvent(new CustomEvent("scenario:change", { detail: { planId: "mission" } }));
    if (view === "intro") emitStep(null, "B");
    if (focus) {
      window.scrollTo(0, 0);
      ({ intro: $("#intro-title"), checklist: $("#mission-title"), examples: $("#examples-title"), data: $("#data-title") })[view]?.focus();
    }
  }

  function runAction(action, element) {
    if (action === "note-hide") { state.noteHidden = true; renderResult(); $('[data-action="note-show"]')?.focus(); }
    else if (action === "note-show") { state.noteHidden = false; renderResult(); $("#mission-result .note h4")?.focus(); }
    else if (action === "show-result") $("#mission-result-title").focus();
    else if (action === "plan") { state.plan = element.dataset.plan; if (element.dataset.eventIndex) state.eventIndex = Number(element.dataset.eventIndex); stopWalk(); updatePlan(element.dataset.focusKey); }
    else if (action === "event") { stopWalk(); state.eventIndex = Number(element.dataset.eventIndex); updatePlan(element.dataset.focusKey); }
    else if (action === "prev") { stopWalk(); state.eventIndex = Math.max(0, state.eventIndex - 1); updatePlan("walk-prev"); }
    else if (action === "next") { stopWalk(); state.eventIndex = Math.min(scenario.events.length - 1, state.eventIndex + 1); updatePlan("walk-next"); }
    else if (action === "walk") startWalk();
    else if (action === "stop") { stopWalk(); updatePlan("walk-toggle"); }
    else if (action === "restart") { stopWalk(); state.eventIndex = 0; updatePlan("walk-restart"); }
    else if (action === "open-plan") {
      mission.choices = { ...CleanApproachScenario.MISSION_DEFAULTS.choices, gloveSwap: false, sampler: state.plan === "shared-tool" ? "tool-1" : "tool-2" };
      mission.stepId = "collect-b";
      showView("checklist");
    }
  }

  const notModeledItems = () => CleanApproachMission.NOT_MODELED.map((item) => h("li", { "data-not-modeled": item.id },
    h("span", { class: "nm-n", text: item.label }), h("span", { class: "nm-r", text: item.reason })));

  /* ---- Mission checklist --------------------------------------------------------------------
   * In this mode "mission:step" carries the checklist step ID, not a scenario event ID. */
  function resetMission() {
    mission.choices = { ...CleanApproachScenario.MISSION_DEFAULTS.choices };
    mission.assumptions = { ...CleanApproachScenario.MISSION_DEFAULTS.assumptions };
    state.noteHidden = false;
    updateMission("mission-reset");
  }

  function updateMission(focusKey) {
    mission.scenario = CleanApproachScenario.buildMission(data, mission.choices, mission.assumptions);
    mission.result = ContactHistoryModel.replay(mission.scenario);
    mission.steps = CleanApproachMission.steps(mission.scenario);
    if (!mission.steps.some((step) => step.id === mission.stepId)) mission.stepId = mission.steps[0].id;
    // A source "depends on" an assumption when switching that one assumption changes whether it reaches B.
    const present = (replayed, sourceId) => replayed.sampleHistory.some((entry) => entry.sourceId === sourceId);
    mission.dependence = {};
    for (const assumption of CleanApproachScenario.ASSUMPTIONS) {
      const flipped = ContactHistoryModel.replay(CleanApproachScenario.buildMission(data, mission.choices,
        { ...mission.assumptions, [assumption.id]: !mission.assumptions[assumption.id] }));
      for (const sourceId of SOURCE_ORDER) {
        if (present(flipped, sourceId) !== present(mission.result, sourceId)) (mission.dependence[sourceId] = mission.dependence[sourceId] || []).push(assumption);
      }
    }
    renderSteps();
    renderResult();
    renderSide();
    renderBar();
    if (focusKey) $(`[data-focus-key="${focusKey}"]`)?.focus();
    publish(mission.scenario, "mission");
    const step = mission.steps.find((item) => item.id === mission.stepId);
    if (state.view === "checklist") emitStep(step.id, step.placeId);
  }

  function selectMissionStep(stepId, moveFocus = false) {
    const step = mission.steps.find((item) => item.id === stepId);
    if (!step) return;
    if (state.view !== "checklist") { mission.stepId = stepId; showView("checklist"); return; }
    mission.stepId = stepId;
    renderSteps();
    if (moveFocus) $("#mission-panel .ttl")?.focus();
    emitStep(step.id, step.placeId);
  }

  function focusMissionPlace(placeId) {
    const step = mission.steps.find((item) => item.placeId === placeId);
    if (step) selectMissionStep(step.id, true);
    else emitStep(null, placeId);
  }

  function renderSteps() {
    const activeIndex = mission.steps.findIndex((step) => step.id === mission.stepId);
    const total = mission.steps.length;
    const items = mission.steps.map((step, index) => {
      const status = index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : "is-up";
      const node = h("span", { class: "node", "aria-hidden": "true" }, status === "is-done" ? icon("check") : String(step.order));
      if (status !== "is-active") {
        const chosen = step.decision && step.decision.options.find((option) => option.value === mission.choices[step.decision.key]);
        return h("li", { class: `step ${status}`, "data-step-id": step.id }, node,
          h("button", { class: "row", type: "button", "data-mission-step": step.id },
            h("span", { class: "row-t" }, h("span", { class: "sr", text: `Step ${step.order}${status === "is-done" ? ", done" : ""}: ` }), step.title),
            h("span", { class: "row-m" }, PLACE_TAGS[step.placeId], h("span", { "aria-hidden": "true", text: "·" }),
              step.precedent ? "Precedent noted" : "Scenario step, no precedent",
              chosen ? [h("span", { "aria-hidden": "true", text: "·" }), h("b", { text: chosen.label })] : null)));
      }
      const decision = step.decision && h("fieldset", { class: "choice" },
        h("legend", { class: "lbl", text: `Your choice · ${step.decision.legend}` }),
        h("div", { class: "opts" }, step.decision.options.map((option) => {
          const key = `${step.decision.key}:${option.value}`;
          return h("label", { class: "opt" },
            h("input", { type: "radio", name: `mission-${step.decision.key}`, value: String(option.value), "data-choice": step.decision.key,
              "data-focus-key": key, checked: mission.choices[step.decision.key] === option.value }),
            h("span", { class: "dot" }), h("span", { text: option.label }));
        })));
      const precedent = step.precedent
        ? h("p", { class: "prec" }, icon("book"), h("span", {}, "Precedent: ",
          h("a", { href: step.precedent.url, target: "_blank", rel: "noreferrer" }, step.precedent.label, " ", icon("external", 13), h("span", { class: "sr", text: " (opens source)" })),
          ` ${CleanApproachMission.PRECEDENT_NOTE}`))
        : h("p", { class: "prec" }, icon("book"), h("span", { text: "Scenario step · no documented precedent is claimed." }));
      const previous = mission.steps[index - 1], next = mission.steps[index + 1];
      return h("li", { class: "step is-active", "data-step-id": step.id, "aria-current": "step" }, node,
        h("div", { class: "act" },
          h("div", { class: "act-top" }, h("span", { class: "chip", text: PLACE_TAGS[step.placeId] }), h("span", { class: "lbl", text: `Step ${step.order} of ${total}` })),
          h("h3", { class: "ttl", tabindex: "-1", text: step.title }),
          h("p", { class: "instr", text: step.instruction }),
          h("p", { class: "why" }, h("b", { text: "Why" }), step.why),
          decision, precedent,
          h("div", { class: "act-nav" },
            previous ? h("button", { class: "btn btn-q btn-sm", type: "button", "data-mission-step": previous.id }, icon("chevLeft"), "Previous") : null,
            next ? h("button", { class: "btn btn-pri btn-sm", type: "button", "data-mission-step": next.id }, `Next: step ${next.order}`, icon("arrowRight"))
              : h("button", { class: "btn btn-pri btn-sm", type: "button", "data-action": "show-result" }, "Review what connects to Sample B"))));
    });
    $("#mission-panel").replaceChildren(
      h("div", { class: "stc-h" },
        h("span", { class: "lbl", text: "Mission checklist · Scenario" }),
        h("h1", { class: "h2", id: "mission-title", tabindex: "-1", text: "Build your own sampling sequence" }),
        h("div", { class: "stc-tools" },
          h("button", { class: "btn btn-q btn-sm", type: "button", "data-mission-exit": true }, icon("arrowLeft"), "Back to example plans"),
          h("button", { class: "btn btn-q btn-sm", type: "button", "data-mission-reset": true, "data-focus-key": "mission-reset" }, icon("reset"), "Reset choices"))),
      h("ol", { class: "steps", "aria-label": "Mission checklist steps" }, items));
  }

  function summaryText(result) {
    const reaching = SOURCE_ORDER.filter((id) => id !== "fromB" && result.sampleHistory.some((entry) => entry.sourceId === id));
    return reaching.length
      ? `External sources with a modeled path to Sample B: ${reaching.map((id) => SOURCE_LABELS[id]).join(", ")}.`
      : "No external source has a modeled path to Sample B in this sequence.";
  }

  function renderSource(sourceId) {
    const result = mission.result;
    const entry = result.sampleHistory.find((item) => item.sourceId === sourceId);
    const label = (id) => mission.scenario.objects[id]?.label || mission.scenario.sources[id]?.label || id;
    const rows = [h("div", { class: "src-h" }, mark(sourceId), h("span", { class: "src-n", text: SOURCE_LABELS[sourceId] }), pill(Boolean(entry)))];
    if (entry) {
      const nodes = entry.path.map((edge) => edge.to);
      const chain = h("ol", { class: "chain", "aria-label": `Path: ${nodes.map(label).join(" to ")}` });
      nodes.forEach((id, index) => {
        if (index) chain.append(h("li", { class: "arr", "aria-hidden": "true" }, icon("arrowRight", 14)));
        const last = index === nodes.length - 1;
        chain.append(h("li", { class: `cn${last ? " cn-end" : ""}` }, index === 0 ? mark(sourceId, 12) : last ? mark("fromB", 12) : null, label(id)));
      });
      const created = CleanApproachMission.stepsForPath(mission.steps, entry.path);
      const meta = h("span", { class: "meta" }, "Created at: ");
      if (created.startingAssumption) meta.append("a starting assumption");
      created.steps.forEach((step, index) => {
        if (index || created.startingAssumption) meta.append(h("span", { "aria-hidden": "true", text: "·" }));
        meta.append(h("button", { class: "lnk", type: "button", "data-mission-step": step.id, text: `step ${step.order}` }));
      });
      rows.push(h("div", { class: "src-b" }, chain, meta));
    }
    for (const assumption of mission.dependence[sourceId] || []) {
      rows.push(h("div", { class: "src-b" }, h("span", { class: "dep" }, scenarioGlyph(), "Depends on this assumption"),
        h("button", { class: "lnk", type: "button", "data-assumption-link": assumption.id, text: assumption.label })));
    }
    return h("li", { class: `src ${entry ? "is-path" : "no-path"}`, "data-source-id": sourceId, "data-present": String(Boolean(entry)) }, rows);
  }

  function renderResult() {
    const mount = $("#mission-result");
    if (!mount.firstChild) {
      // Built once so the summary stays the same live region and announces one sentence per change.
      mount.append(
        h("div", { class: "res-h" },
          h("div", { class: "res-t" }, h("h2", { class: "h3", id: "mission-result-title", tabindex: "-1", text: "What connects to Sample B" }),
            h("span", { class: "lbl", style: "margin-left:auto", text: "Updates after every change" })),
          h("p", { class: "sum", "aria-live": "polite" })),
        h("div", { class: "res-b" }));
    }
    const result = mission.result;
    $("#mission-result .sum").textContent = summaryText(result);
    const humanPresent = result.sampleHistory.some((entry) => entry.sourceId === "human");
    const viaAssumption = humanPresent && (mission.dependence.human || []).some((item) => item.id === "g2CarriesHuman");
    const noteBody = viaAssumption
      ? ["Why is there already a path?", "The model assumes outer glove G2 carries human-associated material, because no data shows otherwise. It is an assumption, not a measurement, and you can switch it."]
      : ["What does this result mean?", "A modeled path means the contacts you assumed connect a source to Sample B. It is not measured contamination, and the absence of a path is not a finding about a real sample."];
    const note = state.noteHidden
      ? h("button", { class: "lnk", type: "button", style: "align-self:flex-start", "data-action": "note-show", text: "What does this result mean?" })
      : h("div", { class: "note", role: "note" }, icon("info", 18), h("h4", { tabindex: "-1", text: noteBody[0] }), h("p", { text: noteBody[1] }),
        h("div", { class: "acts" },
          viaAssumption ? h("button", { class: "btn btn-q btn-sm", type: "button", "data-assumption-link": "g2CarriesHuman", text: "Show the assumption" }) : null,
          h("button", { class: "btn btn-q btn-sm", type: "button", "data-action": "note-hide", text: "Hide" })));
    const objectLabel = (id) => mission.scenario.objects[id]?.label || id;
    const warnings = result.ruleWarnings.map((warning) => {
      const step = mission.steps.find((item) => item.eventIds.includes(warning.eventId));
      return h("div", { class: "warn", role: "note", "data-rule-warnings": String(result.ruleWarnings.length) }, icon("warn", 18),
        h("p", {}, h("b", { text: "Warning · work zone. " }), `${objectLabel(warning.objectId)} takes part in a contact inside the work zone. This is a warning; the path stays in the history. `,
          step ? h("button", { class: "lnk", type: "button", "data-mission-step": step.id, text: `Go to step ${step.order}` }) : null));
    });
    const own = result.sampleHistory.some((entry) => entry.sourceId === "fromB");
    $("#mission-result .res-b").replaceChildren(note, ...warnings,
      h("ul", { class: "srcs", "aria-label": "External source groups" }, ["human", "fromA", "equipment"].map(renderSource)),
      h("div", { class: "own-wrap" }, h("span", { class: "lbl", text: "The sample itself · not an external source" }),
        h("div", { class: "src src-own", "data-source-id": "fromB", "data-present": String(own) },
          h("div", { class: "src-h" }, mark("fromB"), h("span", { class: "src-n", text: SOURCE_LABELS.fromB }), h("span", { class: "pill pill-own", text: "Is Sample B" })))),
      h("p", { class: "res-f", text: "Sequences are compared only by which assumed contacts they contain. Nothing here is graded." }));
  }

  function renderSide() {
    const result = mission.result;
    const seal = result.seals["sample-B"]?.integrity;
    const witness = result.records.some((record) => record.tag === "witness-open");
    const warnings = result.ruleWarnings.length;
    const switches = CleanApproachScenario.ASSUMPTIONS.map((assumption) => {
      const on = mission.assumptions[assumption.id];
      return h("div", { class: "sw" },
        h("label", { class: "sw-l", for: `asm-${assumption.id}`, text: assumption.label }),
        h("span", { class: `tog${on ? " is-on" : ""}` },
          h("input", { type: "checkbox", role: "switch", id: `asm-${assumption.id}`, "data-assumption": assumption.id, "data-focus-key": `assumption:${assumption.id}`,
            "aria-describedby": `asm-${assumption.id}-d`, checked: on }),
          h("span", { class: "trk" }), h("span", { class: "tog-t", text: on ? "On" : "Off" })),
        h("p", { class: "sw-d", id: `asm-${assumption.id}-d`, text: assumption.text }));
    });
    $("#mission-side").replaceChildren(
      h("section", { class: "card blk", "aria-labelledby": "asm-title" },
        h("div", { class: "blk-h" }, h("h2", { class: "h3", id: "asm-title", text: "Assumptions" }), scenarioBadge()), switches),
      h("section", { class: "card blk", "aria-labelledby": "status-title" },
        h("div", { class: "blk-h" }, h("h2", { class: "h3", id: "status-title", text: "Status" }), h("span", { class: "lbl", text: "Not a result" })),
        h("div", { class: "stat" },
          h("div", { class: "st", "data-seal": seal || "none" }, icon("seal", 18), h("span", { class: "st-k", text: "Seal status" }), h("span", { class: "st-v", text: seal === "checked" ? "Checked" : "Not checked" })),
          h("div", { class: "st", "data-witness": String(witness) }, icon("tube", 18), h("span", { class: "st-k", text: "Witness tube" }), h("span", { class: "st-v", text: witness ? "Open" : "Closed" })),
          h("div", { class: "st", "data-rule-warnings": String(warnings) }, icon("warn", 18), h("span", { class: "st-k", text: "Work-zone warnings" }), h("span", { class: "st-v", text: warnings ? `${warnings} · see result` : "None" })))),
      h("section", { class: "card blk", "aria-labelledby": "nm-title" },
        h("div", { class: "blk-h" }, h("h2", { class: "h3", id: "nm-title", text: "Not modeled" })),
        h("ul", { class: "nm" }, notModeledItems())));
  }

  function sourceChips(result, sourceIds) {
    return h("div", { class: "rchips" }, sourceIds.map((sourceId) => {
      const present = result.sampleHistory.some((entry) => entry.sourceId === sourceId);
      if (sourceId === "fromB") return h("span", { class: "rchip own" }, mark(sourceId, 14), SOURCE_SHORT.fromB);
      return h("span", { class: `rchip ${present ? "on" : "off"}` }, mark(sourceId, 14), SOURCE_SHORT[sourceId], icon(present ? "linkOn" : "linkOff", 14),
        h("span", { class: "sr", text: present ? ": modeled path" : ": no modeled path" }));
    }));
  }

  function renderBar() {
    $("#mission-bar").replaceChildren(
      h("div", { class: "rbar-h" }, h("h2", { class: "h3", text: "What connects to Sample B" }),
        h("button", { class: "lnk", type: "button", "data-action": "show-result", text: "Details" })),
      sourceChips(mission.result, SOURCE_ORDER),
      h("p", { class: "rline" }, scenarioGlyph(), CleanApproachMission.DISCLAIMER));
  }

  /* ---- Example plans ------------------------------------------------------------------------ */
  function updatePlan(focusKey) {
    scenario = CleanApproachScenario.build(state.plan, data);
    state.eventIndex = Math.max(0, Math.min(state.eventIndex, scenario.events.length - 1));
    renderExamples();
    renderWalk();
    if (focusKey) $(`[data-focus-key="${focusKey}"]`)?.focus();
    publish(scenario, state.plan);
    const event = scenario.events[state.eventIndex];
    emitStep(event.id, event.placeId);
  }

  function focusExamplePlace(placeId) {
    const index = placeId === "B" ? scenario.events.findIndex((event) => event.id === "seal-b") : scenario.events.findIndex((event) => event.placeId === placeId);
    if (index < 0) { emitStep(null, placeId); return; }
    state.eventIndex = index;
    updatePlan();
    $("#walk-event")?.focus();
  }

  function renderExamples() {
    const plans = CleanApproachScenario.PLANS.map((plan) => {
      const built = CleanApproachScenario.build(plan.id, data);
      return { plan, built, result: ContactHistoryModel.replay(built) };
    });
    const selected = (plan) => plan.id === state.plan;
    const cell = (sourceId, { plan, built, result }) => {
      const entry = result.sampleHistory.find((item) => item.sourceId === sourceId);
      const content = [sourceId === "fromB"
        ? h("span", { class: entry ? "pill pill-own" : "pill pill-off", text: entry ? "Is Sample B" : "Not collected yet" })
        : h("span", { class: `pill ${entry ? "pill-on" : "pill-off"}` }, icon(entry ? "linkOn" : "linkOff"), entry ? "Modeled path" : "No modeled path")];
      if (entry && sourceId !== "fromB") {
        const orders = [...new Set(entry.path.map((edge) => edge.eventId))];
        const meta = h("span", { class: "meta", style: "margin-left:0;white-space:normal;flex-wrap:wrap" }, "Created at: ");
        orders.forEach((eventId, index) => {
          const eventIndex = built.events.findIndex((event) => event.id === eventId);
          if (index) meta.append(h("span", { "aria-hidden": "true", text: "·" }));
          meta.append(h("button", { class: "lnk", type: "button", "data-action": "plan", "data-plan": plan.id, "data-event-index": String(eventIndex), text: `event ${eventIndex + 1}` }));
        });
        content.push(meta);
      }
      return h("td", { class: selected(plan) ? "is-sel" : null }, h("div", { class: "cmp-cell" }, content));
    };
    const inOneLine = ({ result }) => {
      const names = ["human", "fromA"].filter((id) => result.sampleHistory.some((entry) => entry.sourceId === id)).map((id) => SOURCE_SHORT[id]);
      return names.length ? names.join(" · ") : "No external source";
    };
    const comparison = h("table", { class: "tbl cmp" },
      h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "Source group" }),
        plans.map(({ plan }) => h("th", { scope: "col", class: selected(plan) ? "is-sel" : null },
          h("button", { class: "planh", type: "button", "data-action": "plan", "data-plan": plan.id, "data-focus-key": `plan:${plan.id}`, "aria-pressed": String(selected(plan)) },
            h("b", { text: plan.label }), h("span", { text: plan.summary })))))),
      h("tbody", {},
        ["human", "fromA", "fromB"].map((sourceId) => h("tr", {},
          h("td", {}, h("div", { class: "cmp-src" }, mark(sourceId), SOURCE_LABELS[sourceId])), plans.map((entry) => cell(sourceId, entry)))),
        h("tr", {}, h("td", {}, h("span", { class: "lbl", text: "In one line" })),
          plans.map((entry) => h("td", { class: selected(entry.plan) ? "is-sel" : null, style: "font-weight:600", text: inOneLine(entry) })))));

    const events = plans[0].built.events;
    const timeline = h("div", { class: "tl tl-9", role: "table", "aria-label": "Events of each plan" },
      h("div", { class: "tl-l tl-h", text: "Plan" }),
      events.map((event, index) => h("div", { class: "tl-h", text: `${index + 1} · ${PLACE_SHORT[event.placeId]}` })),
      plans.map(({ plan, built }) => [
        h("div", { class: "tl-l", text: plan.label }),
        built.events.map((event, index) => {
          const chips = event.contacts.length
            ? event.contacts.map((contact) => h("span", { class: "evt", text: `${NODE_SHORT[contact.from]} → ${NODE_SHORT[contact.to]}` }))
            : [h("span", { class: "evt evt-x", text: event.type === "seal" ? "Seal" : "Record" })];
          const active = selected(plan) && index === state.eventIndex;
          return h("div", { class: "tl-c" }, h("button", { class: "tl-b", type: "button", "data-action": "plan", "data-plan": plan.id, "data-event-index": String(index),
            "data-focus-key": `cell:${plan.id}:${index}`, "aria-pressed": String(active), "aria-label": `${plan.label}, event ${index + 1}: ${event.action}` }, chips));
        })
      ]));

    $("#examples-main").replaceChildren(
      h("div", { class: "vh" },
        h("div", { class: "hrow", style: "justify-content:space-between" }, h("span", { class: "lbl", text: "Example plans · Scenario" }), scenarioBadge()),
        h("h1", { class: "h2", id: "examples-title", tabindex: "-1", text: "Compare three prepared sequences" }),
        h("p", { class: "body muted", text: "Each plan is the same walk with one difference in how Tool T1, Tool T2 and glove G1 are used. Compare what connects to Sample B, then step through the events." })),
      h("section", { class: "card blk xwrap", "aria-label": "What connects to Sample B in each plan" }, comparison),
      h("section", { class: "card blk", "aria-labelledby": "timeline-title" },
        h("div", { class: "blk-h" }, h("h2", { class: "h3", id: "timeline-title", text: "Event timeline" }),
          h("span", { class: "cap", text: "Contacts live here and in the result, never on the map." })),
        h("div", { class: "xwrap" }, timeline)));
  }

  function renderWalk() {
    const plan = CleanApproachScenario.PLANS.find((item) => item.id === state.plan);
    const event = scenario.events[state.eventIndex];
    const total = scenario.events.length;
    const partial = ContactHistoryModel.replay(scenario, state.eventIndex + 1);
    const label = (id) => scenario.sources[id]?.label || scenario.objects[id]?.label || id;
    const contacts = event.contacts.length
      ? event.contacts.map((contact) => h("li", {}, h("span", { class: "evs-c", text: `${label(contact.from)} → ${label(contact.to)}` }), h("span", { class: "evs-a", text: contact.assumption })))
      : [h("li", {}, h("span", { class: "evs-a", text: event.type === "document-control" ? "A record only. No path is added or removed." : "Sealing freezes the sample's history. No contact is added." }))];
    $("#examples-walk").replaceChildren(h("div", { class: "walk" },
      h("div", { class: "blk-h", style: "margin:0" }, h("h2", { class: "h3", id: "walk-title", text: "Guided walkthrough" }), h("span", { class: "chip", text: plan.label })),
      h("div", { class: "vh" },
        h("span", { class: "lbl", text: `Event ${state.eventIndex + 1} of ${total} · ${scenario.places[event.placeId].label}` }),
        h("h3", { class: "ttl", id: "walk-event", tabindex: "-1", "aria-live": "polite", text: event.action })),
      h("ul", { class: "evs", "aria-label": "Contacts assumed in this event" }, contacts),
      h("div", { class: "vh" }, h("span", { class: "lbl", text: "Paths into Sample B so far" }), sourceChips(partial, ["human", "fromA", "fromB"].filter((id) => id !== "fromB" || partial.sampleHistory.some((entry) => entry.sourceId === "fromB")))),
      h("div", { class: "walk-nav" },
        h("button", { class: "btn btn-q btn-sm", type: "button", "data-action": "prev", "data-focus-key": "walk-prev", disabled: state.eventIndex === 0 }, icon("chevLeft"), "Previous"),
        h("button", { class: "btn btn-q btn-sm", type: "button", "data-action": "next", "data-focus-key": "walk-next", disabled: state.eventIndex === total - 1 }, "Next", icon("chevRight")),
        state.playing
          ? h("button", { class: "btn btn-sec btn-sm", type: "button", "data-action": "stop", "data-focus-key": "walk-toggle" }, icon("stop"), "Stop")
          : h("button", { class: "btn btn-sec btn-sm", type: "button", "data-action": "walk", "data-focus-key": "walk-toggle" }, icon("play"), "Walk me through it"),
        h("button", { class: "btn btn-q btn-sm", type: "button", "data-action": "restart", "data-focus-key": "walk-restart" }, icon("reset"), "Restart")),
      reduceMotion ? h("p", { class: "cap", text: "Reduced motion is on, so the walkthrough does not advance by itself. Use Next and Previous." }) : null,
      state.plan === "omit-glove-contact"
        ? h("p", { class: "cap", text: "This counterfactual has no checklist equivalent: the checklist always keeps the glove's hold on the tool." })
        : h("button", { class: "btn btn-sec", type: "button", "data-action": "open-plan" }, "Open this plan in the checklist", icon("arrowRight"))));
  }

  function startWalk() {
    if (state.eventIndex >= scenario.events.length - 1) state.eventIndex = 0;
    state.playing = !reduceMotion;
    updatePlan("walk-toggle");
    if (!state.playing) return;
    state.timer = setInterval(() => {
      if (state.eventIndex >= scenario.events.length - 1) { stopWalk(); updatePlan(); return; }
      state.eventIndex += 1;
      updatePlan();
    }, 2600);
  }

  function stopWalk() {
    state.playing = false;
    clearInterval(state.timer);
    state.timer = null;
  }

  CA.panel = { init };
})();
