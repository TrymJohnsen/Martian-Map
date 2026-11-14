/* Map-layer controls: a short row of switches and one slope threshold. Loaded by map.js.
 * The returned state object is read by map.js on every draw; no panel state is touched. */
(function () {
  const CA = window.CleanApproach;
  CA.layers = { init({ data, onChange }) {
    const state = { ortho: true, elevation: false, intersection: false, slope: false, steep: true, route: true, zones: true, threshold: 15 };
    const panel = document.querySelector("#layer-panel");
    const options = [
      ["ortho", "Image"], ["elevation", "Elevation"], ["slope", "Slope"], ["steep", "Steep ground"], ["zones", "Work zone"]
    ];
    const row = document.createElement("div");
    row.className = "lay";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Map layers");
    for (const [id, name] of options) {
      const label = document.createElement("label");
      label.className = "lay-o";
      const input = document.createElement("input");
      input.type = "checkbox"; input.checked = state[id]; input.dataset.mapLayer = id;
      input.addEventListener("change", () => { state[id] = input.checked; onChange(state); });
      const text = document.createElement("span");
      text.textContent = name;
      label.append(input, text);
      row.append(label);
    }
    const threshold = document.createElement("label");
    threshold.className = "lay-t";
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 5; slider.max = 40; slider.step = 1; slider.value = state.threshold; slider.id = "slope-threshold";
    const value = document.createElement("output");
    value.htmlFor = slider.id; value.textContent = `${state.threshold}°`;
    slider.addEventListener("input", () => { state.threshold = Number(slider.value); value.textContent = `${state.threshold}°`; onChange(state); });
    threshold.append("Steep above ", slider, value);
    const summary = document.createElement("p");
    summary.id = "route-terrain-summary"; summary.className = "lay-s"; summary.setAttribute("aria-live", "polite");
    panel.replaceChildren(row, threshold, summary);
    return state;
  } };
})();
