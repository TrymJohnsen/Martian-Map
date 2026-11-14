/* Map view: terrain canvas, display layers, camera, route and place markers, route profile.
 * Owns everything inside the map card. It never touches the step-panel DOM; it talks to the
 * rest of the app only through window.CleanApproach and the events documented in
 * docs/data-contract.md ("Module and event contract"). */
(function () {
  const CA = (window.CleanApproach = window.CleanApproach || {});
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const canvas = $("#terrain");
  const ctx = canvas.getContext("2d");
  const profile = $("#profile");
  const pctx = profile.getContext("2d");
  const initialCamera = { yaw: -0.55, pitch: 0.82, zoom: 1 };
  const view = { layer: "ortho", verticalScale: 1, ...initialCamera, dragging: false, focusedPlace: null };
  let data;
  let datumM;
  let slopes, layers;
  const ranges = {};
  let markerPoints = [];
  let cellColours = [], colourKey, pendingFrame = null, projection;

  let wheelTimer = null;
  let interactionNote;

  // Input can arrive faster than display refresh. Render only the latest camera state.
  function requestDraw() {
    if (pendingFrame !== null) return;
    pendingFrame = requestAnimationFrame(() => { pendingFrame = null; draw(); });
  }

  function cacheColours() {
    const enabled = ["ortho", "elevation", "intersection", "slope"].filter(id => layers ? layers[id] : id === "ortho");
    const key = enabled.join(",");
    if (key === colourKey) return;
    const buffer = document.createElement("canvas");
    buffer.width = data.raster.width; buffer.height = data.raster.height;
    const painter = buffer.getContext("2d", { willReadFrequently: true });
    painter.fillStyle = "#172522"; painter.fillRect(0, 0, buffer.width, buffer.height);
    for (const layer of enabled) {
      view.layer = layer;
      painter.globalAlpha = layer === "ortho" ? 1 : .65;
      for (let row = 0; row < buffer.height; row++) for (let col = 0; col < buffer.width; col++) {
        const index = row * buffer.width + col;
        if (!data.arrays.valid_mask[index] || (layer === "slope" && slopes[index] === null)) continue;
        painter.fillStyle = layer === "slope" ? `hsl(${220 - 180 * slopes[index] / 90} 80% 55%)` : cellColor(row, col);
        painter.fillRect(col, row, 1, 1);
      }
    }
    const pixels = painter.getImageData(0, 0, buffer.width, buffer.height).data;
    cellColours = Array.from({ length: buffer.width * buffer.height }, (_, i) => `rgb(${pixels[i*4]},${pixels[i*4+1]},${pixels[i*4+2]})`);
    colourKey = key;
  }

  function init(context) {
    data = context.data;
    datumM = context.datumM;
    slopes = TerrainGeometry.slopes(data.raster, data.arrays);
    for (const [key, values] of Object.entries(data.arrays)) {
      if (!Array.isArray(values)) continue;
      const valid=values.filter((v,i)=>data.arrays.valid_mask[i] && Number.isFinite(v));
      ranges[key]=valid.length ? [Math.min(...valid),Math.max(...valid)] : null;
    }
    const script=document.createElement('script');script.src='/layers.js';
    script.onload=()=>{layers=CA.layers.init({data,onChange:()=>{updateSummary();draw();}});updateSummary();draw();};
    script.onerror=()=>{$('#layer-panel').textContent='Map layers could not be loaded.';};
    document.head.append(script);
    canvas.setAttribute("aria-label", `MRO CTX terrain around Bright Angel with an illustrative route to documented sample site ${data.sample_site.label}`);
    interactionNote=document.createElement('p');interactionNote.className='map-interaction-note';interactionNote.hidden=true;
    interactionNote.textContent='Interactive preview: simplified terrain mesh while moving. Full detail returns when movement stops.';
    


    window.addEventListener("resize", resize);
    window.addEventListener("mission:step", (event) => { view.focusedPlace = event.detail.placeId; draw(); });
    window.addEventListener("scenario:change", updateRoute);
    $$(".scene-overlay-label [data-focus-place]").forEach((button) => button.addEventListener("click", () => emitPlace(button.dataset.focusPlace)));
    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      const nearest = markerPoints.map((item) => ({ ...item, distance: Math.hypot(item.point[0] - x, item.point[1] - y) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance < 22) emitPlace(nearest.id);
    });

    $$('[data-layer]').forEach(button=>{button.remove();});
    
    
    canvas.addEventListener("pointerdown", (event) => {
      view.dragging = true; view.lastX = event.clientX; view.lastY = event.clientY; canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!view.dragging) return;
      view.yaw += (event.clientX - view.lastX) * .008;
      view.pitch = Math.max(.45, Math.min(1.2, view.pitch + (event.clientY - view.lastY) * .004));
      view.lastX = event.clientX; view.lastY = event.clientY; requestDraw();
    });
    canvas.addEventListener("pointerup", () => { view.dragging = false; requestDraw(); });
    canvas.addEventListener("pointercancel", () => { view.dragging = false; requestDraw(); });
    canvas.addEventListener("lostpointercapture", () => { view.dragging = false; requestDraw(); });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      if(wheelTimer!==null)clearTimeout(wheelTimer);
      wheelTimer=setTimeout(()=>{wheelTimer=null;requestDraw();},150);
      view.zoom = Math.max(.7, Math.min(1.55, view.zoom * (event.deltaY > 0 ? .92 : 1.08))); requestDraw();
    }, { passive: false });
    $("#reset-camera").addEventListener("click", resetCamera);
    $("#vertical-scale").addEventListener("click", () => {
      view.verticalScale = view.verticalScale === 1 ? 3 : 1;
      const button = $("#vertical-scale"), exaggerated = view.verticalScale > 1;
      button.textContent = exaggerated ? "Height scale 3× · exaggerated" : "Height scale 1× · true scale";
      button.setAttribute("aria-pressed", String(exaggerated)); draw();
    });
    canvas.addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "r") { resetCamera(); event.preventDefault(); } });
    resize();
  }

  function emitPlace(placeId) {
    window.dispatchEvent(new CustomEvent("map:place", { detail: { placeId } }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function resetCamera() { Object.assign(view, initialCamera); draw(); }

  function fractionFor(key,value) {
    const range=ranges[key];
    return range ? Math.max(0,Math.min(1,(value-range[0])/(range[1]-range[0] || 1))) : 0;
  }
  function cellColor(row, col) {
    const index = row * data.raster.width + col;
    if (!data.arrays.valid_mask[index]) return null;
    if (view.layer === "ortho") {
      const value = data.arrays.ortho_gray8_display_only[index];
      return `rgb(${value},${value},${value})`;
    }
    if (view.layer === "intersection") {
      const fraction = fractionFor("intersection_error_cm", data.arrays.intersection_error_cm[index]);
      const low = [44, 110, 111], high = [225, 159, 104];
      return `rgb(${low.map((value, axis) => Math.round(value + (high[axis] - value) * fraction)).join(",")})`;
    }
    const elevation = data.arrays.elevation_m_rounded[index];
    const [min, max] = ranges.elevation_m_rounded || [0, 0];
    const fraction = Math.max(0, Math.min(1, (elevation - min) / Math.max(1, max - min)));
    const stops = [[29, 48, 43], [77, 103, 67], [161, 157, 99], [218, 195, 145]];
    const position = fraction * (stops.length - 1);
    const stop = Math.min(stops.length - 2, Math.floor(position));
    const local = position - stop;
    return `rgb(${stops[stop].map((value, axis) => Math.round(value + (stops[stop + 1][axis] - value) * local)).join(",")})`;
  }

  function project(row, col, elevationM, cx, cy, scale) {
    const x = (col - (data.raster.width - 1) / 2) * data.raster.pixel_size_m[0];
    const y = ((data.raster.height - 1) / 2 - row) * data.raster.pixel_size_m[1];
    const z = (elevationM - datumM) * view.verticalScale;
    return [cx + (x * projection.cs - y * projection.sn) * scale,
      cy - ((x * projection.sn + y * projection.cs) * projection.cp - z * projection.sp) * scale];
  }

  function markerPoint(placeId, cx, cy, scale) {
    const place = CA.scenario.places[placeId];
    if (!place || place.row < 0 || place.col < 0 || place.row >= data.raster.height || place.col >= data.raster.width) return null;
    const index = place.row * data.raster.width + place.col;
    const elevation = data.arrays.valid_mask[index] ? data.arrays.elevation_m_rounded[index] : datumM;
    return project(place.row, place.col, elevation, cx, cy, scale);
  }

  function routePlaces() { return CA.scenario?.route || Object.keys(CA.scenario?.places || {}); }

  function draw() {
    if (!data || !CA.scenario) return;
    const widthPx = canvas.clientWidth, heightPx = canvas.clientHeight;
    if (!widthPx || !heightPx) return;
    cacheColours();

    projection = { cs: Math.cos(view.yaw), sn: Math.sin(view.yaw), cp: Math.cos(view.pitch), sp: Math.sin(view.pitch) };
    ctx.clearRect(0, 0, widthPx, heightPx);
    const fieldPlate = document.body.dataset.layout === "b";
    const viewScale = fieldPlate ? 1.5 : 1.3;
    const meanCellM = (data.raster.pixel_size_m[0] + data.raster.pixel_size_m[1]) / 2;
    const widthSpanM = data.raster.width * meanCellM * (fieldPlate ? 210 / 148 : 244 / 148);
    const heightSpanM = data.raster.height * meanCellM * (fieldPlate ? 190 / 148 : 235 / 148);
    const cameraScale = Math.min(widthPx / widthSpanM, heightPx / heightSpanM) * view.zoom * viewScale;
    const cx = widthPx * 0.5, cy = heightPx * 0.56;
    const northX = -Math.sin(view.yaw), northY = Math.cos(view.yaw) * Math.cos(view.pitch);
    $("#north-arrow").style.transform = `rotate(${Math.atan2(northX, -northY)}rad)`;
    const { width, height } = data.raster;
    const stride=view.dragging || wheelTimer!==null ? 2 : 1;
    interactionNote.hidden=stride===1;
    canvas.dataset.preview=String(stride>1);
    const vertices = new Array(width * height);
    for (let row = 0; row < height; row+=stride) for (let col = 0; col < width; col+=stride) {
      const index = row * width + col;
      if (data.arrays.valid_mask[index]) vertices[index] = project(row, col, data.arrays.elevation_m_rounded[index], cx, cy, cameraScale);
    }
    for (let row = 0; row < height - stride; row+=stride) for (let col = 0; col < width - stride; col+=stride) {
      const index = row * width + col;
      // Even the temporary coarse preview rejects a patch if ANY covered vertex
      // is missing. It must never bridge a NoData hole between sampled corners.
      let valid=true;
      for(let dr=0;dr<=stride && valid;dr++)for(let dc=0;dc<=stride;dc++){
        if(!data.arrays.valid_mask[index+dr*width+dc]){valid=false;break;}
      }
      if(!valid)continue;
      const points = [vertices[index], vertices[index + stride], vertices[index + stride*width + stride], vertices[index + stride*width]];
      ctx.beginPath();
      points.forEach(([x, y], pointIndex) => pointIndex ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = cellColours[index];
      ctx.fill();
    }
    drawOverlays(cx,cy,cameraScale);
    drawRoute(cx, cy, cameraScale);
  }

  function drawRoute(cx, cy, scale) {
    const route = routePlaces().map((placeId) => ({ id: placeId, point: markerPoint(placeId, cx, cy, scale) }));
    markerPoints=Object.keys(CA.scenario.places).map(id=>({id,point:markerPoint(id,cx,cy,scale)})).filter(item=>item.point);
    ctx.save();
    ctx.beginPath();
    let connected=false;
    if(!layers || layers.route) for(const {point} of route){
      if(!point){connected=false;continue;}
      if(connected) ctx.lineTo(...point);else ctx.moveTo(...point);connected=true;
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(8,16,14,.82)"; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = "#e2b082"; ctx.lineWidth = 2.5; ctx.stroke();
    markerPoints.forEach(({ id, point }) => {
      if (!point) return;
      const selected = view.focusedPlace === id;
      const radius = selected ? 9 : 6;
      ctx.beginPath(); ctx.arc(point[0], point[1], radius + (selected ? 5 : 2), 0, Math.PI * 2);
      ctx.strokeStyle = selected ? "#f3dda5" : "rgba(241,241,233,.72)"; ctx.lineWidth = selected ? 2 : 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(point[0], point[1], radius, 0, Math.PI * 2);
      ctx.fillStyle = "#e2b082"; ctx.fill();
      ctx.font = "600 11px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#f1f1e9";
      const place = CA.scenario.places[id];
      const knownHeight = data.arrays.valid_mask[place.row * data.raster.width + place.col];
      ctx.fillText(place.short ?? (id === "prep" ? "S" : id), point[0], point[1] - 14);
      if(selected){
        ctx.strokeStyle='#fff';ctx.lineWidth=2;
        const x=point[0],y=point[1]+21;
        ctx.beginPath();ctx.arc(x,y,4,0,2*Math.PI);ctx.stroke();
        ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x,y+13);ctx.moveTo(x-6,y+7);ctx.lineTo(x+6,y+7);
        ctx.moveTo(x,y+13);ctx.lineTo(x-5,y+19);ctx.moveTo(x,y+13);ctx.lineTo(x+5,y+19);ctx.stroke();
        
      }
    });
    ctx.restore();
  }

  function metresBetween(a, b) {
    return Math.hypot((a.col - b.col) * data.raster.pixel_size_m[0], (a.row - b.row) * data.raster.pixel_size_m[1]);
  }

  function drawProfile(samples) {
    const width = profile.clientWidth, height = profile.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    profile.width = Math.max(1, Math.round(width * ratio)); profile.height = Math.max(1, Math.round(height * ratio));
    pctx.setTransform(ratio, 0, 0, ratio, 0, 0); pctx.clearRect(0, 0, width, height);
    const valid = samples.filter((point) => point.elevationM !== null);
    if (valid.length < 2) { $("#profile-range").textContent = "Insufficient valid terrain samples"; return; }
    const min = Math.min(...valid.map((point) => point.elevationM));
    const max = Math.max(...valid.map((point) => point.elevationM));
    const span = Math.max(1, max - min);
    const totalDistance = Math.max(1, samples.at(-1).distanceM);
    const y = (value) => height - 4 - (value - min) / span * (height - 12);
    let drawingSegment = false;
    pctx.beginPath();
    for (const point of samples) {
      if (point.elevationM === null) { drawingSegment = false; continue; }
      const x = point.distanceM / totalDistance * width;
      if (!drawingSegment) { pctx.moveTo(x, y(point.elevationM)); drawingSegment = true; }
      else pctx.lineTo(x, y(point.elevationM));
    }
    pctx.strokeStyle = "#c2e69d"; pctx.lineWidth = 1.6; pctx.stroke();
    const rounded = (value) => Math.round(value / 5) * 5;
    $("#profile-range").textContent = `Valid cells: ≈${rounded(min).toLocaleString()} to ≈${rounded(max).toLocaleString()} m · NoData shown as gaps`;
  }

  function updateRoute() {
    const overlay=document.createElement('div');
    for(const [id,place] of Object.entries(CA.scenario.places)){
      const button=document.createElement('button');button.type='button';button.textContent=id+' · '+place.label;
      button.addEventListener('click',()=>emitPlace(id));overlay.append(button);
    }
    updateSummary();
    const route=routePlaces().map(id=>CA.scenario.places[id]).filter(Boolean);
    const lengthM = route.slice(1).reduce((sum, point, index) => sum + metresBetween(route[index], point), 0);
    $("#route-distance").textContent = (Math.round(lengthM / 10) * 10).toLocaleString();
    drawProfile(TerrainGeometry.profile(route, data.raster, data.arrays));
    draw();
  }


  function updateSummary(){
    if(!layers || !CA.scenario) return;
    const route=routePlaces().map(id=>CA.scenario.places[id]);
    if(route.some(p=>!p)){ $('#route-terrain-summary').textContent='The route references an unknown place.';return; }
    const result=TerrainGeometry.routeTerrain(route,data.raster,data.arrays,slopes,layers.threshold);
    $('#route-terrain-summary').textContent='The route crosses '+result.steep+' cells steeper than '+layers.threshold+'°'+(result.noData ? ' and '+result.noData+' cells with no data.' : '.')+' A planning threshold, not a suit limit.';
  }
  function polygon(points){ctx.beginPath();points.forEach((p,i)=>i ? ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
  function drawOverlays(cx,cy,scale){
    if(!layers) return;
    ctx.save();
    const {width,height}=data.raster;
    for(let r=0;r<height;r++)for(let c=0;c<width;c++){
      const i=r*width+c;
      if(!data.arrays.valid_mask[i] || !layers.steep || slopes[i]===null || slopes[i]<=layers.threshold)continue;
      const z=data.arrays.elevation_m_rounded[i];
      const points=[[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]].map(([dr,dc])=>project(r+dr,c+dc,z,cx,cy,scale));
      polygon(points);
      ctx.fillStyle='rgba(242,196,80,.6)';ctx.fill();
    }
    if(layers.zones)for(const zone of CA.scenario.zones || []){
      const place=CA.scenario.places[zone.centerPlaceId];
      if(!place || !Number.isFinite(zone.radius_m) || zone.radius_m<=0)continue;
      const i=place.row*width+place.col;
      if(!data.arrays.valid_mask[i])continue;
      const z=data.arrays.elevation_m_rounded[i];
      const points=Array.from({length:65},(_,n)=>{const a=n/64*2*Math.PI;return project(place.row+Math.sin(a)*zone.radius_m/data.raster.pixel_size_m[1],place.col+Math.cos(a)*zone.radius_m/data.raster.pixel_size_m[0],z,cx,cy,scale);});
      polygon(points);ctx.setLineDash(zone.evidence==='scenario' ? [6,4] : []);
      ctx.strokeStyle='#E0D6BF';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#ffffff';ctx.font='12px sans-serif';
      
    }
    ctx.restore();
  }
  async function loadContext(){
    const mount=$('#context-cards');
    mount.lang='en';
    const rad=document.createElement('article');rad.className='context-card';
    rad.innerHTML='<h3>Radiation · Curiosity RAD</h3><p>Gale, not Jezero.</p><p>Perseverance has no dedicated instrument equivalent to RAD. Hassler et al. (2014) report 0.210 ± 0.040 mGy/day in a tissue-like detector: average galactic cosmic ray absorbed dose rate over a 300-day period near solar maximum in 2012–2013. Derived dose-equivalent rate: 0.64 ± 0.12 mSv/day, using a radiation quality factor. These are not local Jezero measurements.</p><a href="https://doi.org/10.1126/science.1244797">Hassler et al., Science (2014)</a>';
    mount.append(rad);
    const wind=document.createElement('article');wind.className='context-card';mount.prepend(wind);
    try{
      const response=await fetch('/data/meda-sol-0036-context.json');if(!response.ok)throw Error('HTTP '+response.status);
      const context=await response.json();
      const title=document.createElement('h3');title.textContent='Wind · historical point observations';wind.append(title);
      const note=document.createElement('p');note.textContent=context.label;wind.append(note);
      const rose=document.createElement('canvas');rose.width=240;rose.height=240;rose.setAttribute('role','img');rose.setAttribute('aria-label','Wind rose: non-calm minute-observation counts by wind-from sector, north at the top.');wind.append(rose);
      const rc=rose.getContext('2d'),maximum=Math.max(1,...context.wind_rose_counts);
      rc.translate(120,120);rc.strokeStyle='#aaa';rc.beginPath();rc.arc(0,0,85,0,2*Math.PI);rc.stroke();
      context.wind_rose_counts.forEach((count,i)=>{const a=i*Math.PI/4-Math.PI/2;rc.beginPath();rc.moveTo(0,0);rc.arc(0,0,80*count/maximum,a-Math.PI/8,a+Math.PI/8);rc.closePath();rc.fillStyle='#6faeb7';rc.fill();});
      rc.fillStyle='#aaa';rc.font='12px sans-serif';rc.fillText('N',-4,-94);rc.fillText('E',96,4);rc.fillText('S',-4,105);rc.fillText('W',-105,4);
      const table=document.createElement('table');table.innerHTML='<caption>LTST hours · observed minute samples; empty hours are not interpolated</caption><thead><tr><th>Hour</th><th>Count</th><th>Mean wind speed (m/s)</th></tr></thead>';
      const body=document.createElement('tbody');context.hours.forEach(h=>{const row=document.createElement('tr');[h.hour,h.count,h.mean_speed_m_s===null ? 'No observations' : h.mean_speed_m_s.toFixed(2)].forEach(v=>{const td=document.createElement('td');td.textContent=v;row.append(td);});body.append(row);});table.append(body);
      const hourly=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Hourly values and observation coverage';hourly.append(summary,table);wind.append(hourly);
      const details=document.createElement('p');details.textContent=context.method+' Wind rose (N, NE, E, SE, S, SW, W, NW): '+context.wind_rose_counts.join(', ')+'. No uncertainty values available.';wind.append(details);
      const link=document.createElement('a');link.href=context.source_url;link.textContent='PDS MEDA · source data';wind.append(link);
    }catch(error){wind.textContent='Wind context could not be loaded: '+error.message;}
  }
  CA.map = { init };
})();
