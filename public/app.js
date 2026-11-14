/* App shell: loads the Bright Angel display derivative, fills the shared source/credit text,
 * then starts the map and panel modules. Keep this file small: map drawing lives in map.js and
 * the step panel in panel.js. Load order in index.html: map.js, panel.js, then this file. */
(function () {
  const CA = (window.CleanApproach = window.CleanApproach || {});
  const $ = (selector) => document.querySelector(selector);
  const loading = $("#scene-loading");
  const errorBox = $("#scene-error");

  document.body.dataset.layout = "steps";
  $(".assumptions-link").addEventListener("click", () => { $("#data-assumptions").open = true; });

  fetch("/data/bright-angel-demo.json").then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((data) => {
    const datumM = TerrainGeometry.medianValidElevation(data.arrays);
    CA.data = data;
    CA.datumM = datumM;
    $("#area-title").textContent = data.area;
    $("#target-coordinate").textContent = `${data.sample_site.latitude_north_deg.toFixed(5)}°N, ${data.sample_site.longitude_east_deg.toFixed(5)}°E`;
    $("#position-source").href = data.sample_site.position_source_url;
    $("#position-source").textContent = "PDS sample report ↗";
    $("#ctx-product-id").textContent = data.product.item_id;
    $("#ctx-dtm-link").href = data.product.asset_urls.dtm;
    $("#ctx-ortho-link").href = data.product.asset_urls.ortho;
    $("#ctx-ray-link").href = data.product.asset_urls.intersection_error;
    $("#ctx-product-credit").textContent = `${data.product.ctx_inputs.join(" + ")} · MRO/CTX, NASA/USGS · ${data.product.license} · DOI 10.5066/P9JKVWR3`;
    loading.hidden = true;
    CA.map.init({ data, datumM });
    CA.panel.init({ data });
  }).catch((error) => {
    loading.hidden = true;
    errorBox.hidden = false;
    console.error("Terrain data load failed", error);
  });
})();
