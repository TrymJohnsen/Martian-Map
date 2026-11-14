const $ = (selector) => document.querySelector(selector);
const canvas = $("#terrain");
const ctx = canvas.getContext("2d");
const profile = $("#profile");
const pctx = profile.getContext("2d");
const loading = $("#scene-loading");
const errorBox = $("#scene-error");
const state = { layer: "ortho", sequence: "sample-first", yaw: -0.55, pitch: 0.82, zoom: 1, dragging: false, tour: false };
let data;

fetch("/data/jezero-demo.json").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then((d) => {
  data = d;
  loading.hidden = true;
  resize();
  updatePlan();
}).catch((e) => { loading.hidden = true; errorBox.hidden = false; console.error("Terrain data load failed", e); });

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}
window.addEventListener("resize", resize);

function getGrid(key) {
  const { width, height } = data.raster;
  return Array.from({ length: height }, (_, r) => data.arrays[key].slice(r * width, (r + 1) * width));
}
function cellColor(r, c) {
  const i = r * data.raster.width + c;
  if (!data.arrays.valid_mask[i]) return null;
  if (state.layer === "ortho") { const v = data.arrays.ortho_gray8_display_only[i]; return `rgb(${v},${v},${v})`; }
  if (state.layer === "intersection") {
    const t = data.arrays.intersection_error_cm[i] / 433;
    const a = [44, 110, 111], b = [225, 159, 104];
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;
  }
  const z = data.arrays.elevation_m_rounded[i];
  const t = Math.max(0, Math.min(1, (z + 2616) / 101));
  const stops = [[29, 48, 43], [77, 103, 67], [161, 157, 99], [218, 195, 145]];
  const q = t * (stops.length - 1), j = Math.min(stops.length - 2, Math.floor(q)), f = q - j;
  return `rgb(${stops[j].map((v, k) => Math.round(v + (stops[j + 1][k] - v) * f)).join(",")})`;
}
function project(r, c, z, cx, cy, scale) {
  const x = (c - 73.5) * data.raster.pixel_size_m[0] / 20.1629551245;
  const y = (73.5 - r) * data.raster.pixel_size_m[1] / 20.1629551245;
  const cs = Math.cos(state.yaw), sn = Math.sin(state.yaw);
  const xr = x * cs - y * sn, yr = x * sn + y * cs;
  const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
  return [cx + xr * scale, cy + (yr * cp - (z + 2560) * 3 * sp) * scale];
}
function markerPoint(marker, cx, cy, scale) {
  const z = data.arrays.elevation_m_rounded[marker.row * data.raster.width + marker.col];
  return project(marker.row, marker.col, z, cx, cy, scale);
}
function routePoints() {
  const { start_marker: start, target_marker: target, survey_marker: survey } = data;
  return state.sequence === "sample-first" ? [start, target, survey] : [start, survey, target];
}
function draw() {
  if (!data) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min(w / 244, h / 235) * state.zoom;
  const cx = w * 0.5, cy = h * 0.56;
  const step = Math.max(1, Math.ceil(148 / 66));
  for (let r = 0; r < 148 - step; r += step) {
    for (let c = 0; c < 148 - step; c += step) {
      const i = r * 148 + c;
      if (!data.arrays.valid_mask[i] || !data.arrays.valid_mask[i + step] || !data.arrays.valid_mask[i + step * 148] || !data.arrays.valid_mask[i + step * 148 + step]) continue;
      const z1 = data.arrays.elevation_m_rounded[i], z2 = data.arrays.elevation_m_rounded[i + step], z3 = data.arrays.elevation_m_rounded[i + step * 148 + step], z4 = data.arrays.elevation_m_rounded[i + step * 148];
      const pts = [project(r,c,z1,cx,cy,scale), project(r,c+step,z2,cx,cy,scale), project(r+step,c+step,z3,cx,cy,scale), project(r+step,c,z4,cx,cy,scale)];
      ctx.beginPath(); pts.forEach(([x,y],n) => n ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
      ctx.fillStyle = cellColor(r + Math.floor(step/2), c + Math.floor(step/2)) || "#172522";
      ctx.fill();
      if (state.layer !== "ortho") { ctx.strokeStyle = "rgba(13,24,20,.18)"; ctx.lineWidth = .5; ctx.stroke(); }
    }
  }
  drawRoute(cx, cy, scale);
}
function drawRoute(cx, cy, scale) {
  const start = markerPoint(data.start_marker, cx, cy, scale), target = markerPoint(data.target_marker, cx, cy, scale), survey = markerPoint(data.survey_marker, cx, cy, scale);
  const targetR = Math.max(8, scale * 7);
  ctx.save();
  ctx.beginPath(); ctx.arc(target[0], target[1], targetR, 0, Math.PI * 2); ctx.fillStyle = "rgba(213,163,123,.12)"; ctx.fill(); ctx.strokeStyle = "rgba(229,177,131,.85)"; ctx.setLineDash([4,4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
  const legs = state.sequence === "sample-first" ? [[start,target,"#b8e58b"],[target,survey,"#e2b082"]] : [[start,survey,"#8fc7c4"],[survey,target,"#e2b082"]];
  legs.forEach(([a,b,color], index) => {
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = "rgba(8,16,14,.72)"; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    arrow(a,b,color);
  });
  [[start,"S","#b8e58b"],[survey,"W","#8fc7c4"],[target,"T","#e2b082"]].forEach(([p,label,color]) => {
    ctx.beginPath(); ctx.arc(p[0],p[1],5,0,Math.PI*2); ctx.fillStyle="#101615"; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=color; ctx.stroke();
    ctx.font="10px monospace"; ctx.textAlign="center"; ctx.fillStyle="#f1f1e9"; ctx.fillText(label,p[0],p[1]-10);
  });
  ctx.restore();
}
function arrow(a,b,color) {
  const t=.56, x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t, angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(5,0); ctx.lineTo(-4,-3.5); ctx.lineTo(-4,3.5); ctx.closePath(); ctx.fillStyle=color; ctx.fill(); ctx.restore();
}
function metersBetween(a,b) { return Math.hypot((a.col-b.col)*data.raster.pixel_size_m[0], (a.row-b.row)*data.raster.pixel_size_m[1]); }
function distanceInsideCircle(a,b,center,radius) {
  const ax=(a.col-center.col)*data.raster.pixel_size_m[0], ay=(a.row-center.row)*data.raster.pixel_size_m[1];
  const bx=(b.col-center.col)*data.raster.pixel_size_m[0], by=(b.row-center.row)*data.raster.pixel_size_m[1];
  const dx=bx-ax,dy=by-ay,A=dx*dx+dy*dy,B=2*(ax*dx+ay*dy),C=ax*ax+ay*ay-radius*radius;
  const disc=B*B-4*A*C; if(disc<0||A===0) return C<=0?Math.sqrt(A):0;
  const q=Math.sqrt(disc), lo=Math.max(0,(-B-q)/(2*A)), hi=Math.min(1,(-B+q)/(2*A));
  return hi>lo?(hi-lo)*Math.sqrt(A):0;
}
function profileFor(points) {
  const values=[];
  for(let seg=0;seg<points.length-1;seg++) {
    const a=points[seg],b=points[seg+1],n=Math.ceil(Math.max(Math.abs(b.row-a.row),Math.abs(b.col-a.col)));
    for(let i=seg?1:0;i<=n;i++) {
      const f=i/n,r=Math.round(a.row+(b.row-a.row)*f),c=Math.round(a.col+(b.col-a.col)*f),index=r*148+c;
      if(data.arrays.valid_mask[index]) values.push(data.arrays.elevation_m_rounded[index]);
    }
  }
  return values;
}
function drawProfile(values) {
  const w=profile.clientWidth,h=profile.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
  profile.width=Math.max(1,Math.round(w*dpr));profile.height=Math.max(1,Math.round(h*dpr));pctx.setTransform(dpr,0,0,dpr,0,0);pctx.clearRect(0,0,w,h);
  if(values.length<2)return;
  const min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);
  pctx.beginPath();values.forEach((v,i)=>{const x=i/(values.length-1)*w,y=h-4-(v-min)/span*(h-13);i?pctx.lineTo(x,y):pctx.moveTo(x,y)});pctx.lineTo(w,h);pctx.lineTo(0,h);pctx.closePath();pctx.fillStyle="rgba(183,226,139,.16)";pctx.fill();
  pctx.beginPath();values.forEach((v,i)=>{const x=i/(values.length-1)*w,y=h-4-(v-min)/span*(h-13);i?pctx.lineTo(x,y):pctx.moveTo(x,y)});pctx.strokeStyle="#c2e69d";pctx.lineWidth=1.6;pctx.stroke();
  $("#profile-range").textContent=`${min.toLocaleString()} to ${max.toLocaleString()} m · ${Math.round(max-min)} m relief`;
}
function updatePlan() {
  if(!data)return;
  const points=routePoints(),target=data.target_marker;
  const total=metersBetween(points[0],points[1])+metersBetween(points[1],points[2]);
  const before=state.sequence==="sample-first"?metersBetween(data.start_marker,target):metersBetween(data.start_marker,data.survey_marker)+distanceInsideCircle(data.survey_marker,target,target,7*data.raster.pixel_size_m[0]);
  $("#route-distance").textContent=Math.round(total).toLocaleString();
  $("#pre-sample-zone").textContent=Math.round(before).toLocaleString();
  $("#sequence-title").textContent=state.sequence==="sample-first"?"SAMPLE FIRST":"SURVEY FIRST";
  $("#sequence-explanation").textContent=state.sequence==="sample-first"?"The scout leg comes after collection. The target footprint is only approached on the final leg before sampling.":"The route passes the marked target footprint before collection. This is a geometric contact opportunity, not evidence of transfer.";
  const values=profileFor(points.slice(0,2));drawProfile(values);draw();
}
document.querySelectorAll("[data-layer]").forEach((button)=>button.addEventListener("click",()=>{state.layer=button.dataset.layer;document.querySelectorAll("[data-layer]").forEach((b)=>b.classList.toggle("is-active",b===button));draw();}));
document.querySelectorAll("[data-sequence]").forEach((button)=>button.addEventListener("click",()=>{state.sequence=button.dataset.sequence;document.querySelectorAll("[data-sequence]").forEach((b)=>{b.classList.toggle("is-selected",b===button);b.setAttribute("aria-pressed",String(b===button));});updatePlan();}));
canvas.addEventListener("pointerdown",(event)=>{state.dragging=true;state.lastX=event.clientX;state.lastY=event.clientY;canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener("pointermove",(event)=>{if(!state.dragging)return;if(state.tour){state.tour=false;$("#play-tour").querySelector("span:last-child").textContent="PLAY 18 SEC TOUR";}state.yaw+=(event.clientX-state.lastX)*.008;state.pitch=Math.max(.45,Math.min(1.2,state.pitch+(event.clientY-state.lastY)*.004));state.lastX=event.clientX;state.lastY=event.clientY;draw();});
canvas.addEventListener("pointerup",()=>{state.dragging=false;});
canvas.addEventListener("wheel",(event)=>{event.preventDefault();state.zoom=Math.max(.7,Math.min(1.55,state.zoom*(event.deltaY>0?.92:1.08)));draw();},{passive:false});
$("#play-tour").addEventListener("click",()=>{
  if(state.tour){state.tour=false;$("#play-tour").querySelector("span:last-child").textContent="PLAY 18 SEC TOUR";return;}
  state.tour=true;const button=$("#play-tour"),start=performance.now(),yaw=state.yaw,sequence=state.sequence;
  button.querySelector("span:last-child").textContent="PLAYING · DRAG TO INTERRUPT";
  function frame(now){if(!state.tour)return;const t=Math.min(1,(now-start)/18000);state.yaw=yaw+Math.sin(t*Math.PI*2)*.16;state.zoom=1+.12*Math.sin(t*Math.PI);draw();if(t<1)requestAnimationFrame(frame);else{state.tour=false;state.yaw=yaw;state.zoom=1;button.querySelector("span:last-child").textContent="PLAY 18 SEC TOUR";draw();}}
  requestAnimationFrame(frame);
});
