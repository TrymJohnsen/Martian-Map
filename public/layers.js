/* Independent map-layer controls. Loaded by map.js; no panel state is mutated. */
(function () {
  const CA = window.CleanApproach;
  CA.layers = { init({ data, onChange }) {
    const state = { ortho:true, elevation:false, intersection:false, slope:false, steep:true, route:true, zones:true, threshold:15 };
    const panel=document.querySelector('#layer-panel');panel.lang='en';
    const range=(key,scale=1)=>{
      const values=data.arrays[key].filter((v,i)=>data.arrays.valid_mask[i] && Number.isFinite(v));
      return values.length ? (Math.min(...values)/scale).toFixed(2)+'–'+(Math.max(...values)/scale).toFixed(2) : 'No valid values';
    };
    const definitions=[
      ['Observed',[['ortho','Orthophoto','Grayscale: display stretch, not reflectance.'],['elevation','Elevation','Dark green → sand: lower → higher elevation, metres relative to the areoid.'],['intersection','Ray separation','Teal → orange: smaller → larger camera-ray separation (m). Relative stereo diagnostic, not terrain accuracy or uncertainty.']]],
      ['Derived',[['slope','Terrain slope','Blue → yellow: 0–90° slope. Missing slope is not zero.'],['steep','Above selected slope threshold','Red: calculated slope exceeds your selected threshold.']]],
      ['Scenario',[['route','Planned route','Solid sand-coloured line: illustrative walking route.'],['zones','Work zones','Dashed cyan outline: planned work zone · scenario.']]]
    ];
    const mapLegend=document.createElement('section');
    mapLegend.className='map-colour-legend';mapLegend.lang='en';
    mapLegend.setAttribute('aria-label','Map colour legend');
    document.querySelector('.scene-wrap').after(mapLegend);
    const swatches={
      ortho:'linear-gradient(to right, black, white)',
      elevation:'linear-gradient(to right, rgb(29,48,43), rgb(77,103,67), rgb(161,157,99), rgb(218,195,145))',
      intersection:'linear-gradient(to right, rgb(44,110,111), rgb(225,159,104))',
      slope:'linear-gradient(to right, hsl(220 80% 55%), hsl(130 80% 55%), hsl(40 80% 55%))',
      steep:'rgb(255,65,65)',
      route:'linear-gradient(transparent 40%, #e2b082 40% 60%, transparent 60%)',
      zones:'transparent'
    };
    function renderLegend(){
      mapLegend.replaceChildren();
      const heading=document.createElement('h3');heading.textContent='Map colours and symbols';mapLegend.append(heading);
      for(const [group,items] of definitions)for(const [id,name,note] of items){
        if(!state[id])continue;
        const row=document.createElement('p');row.className='map-colour-legend-item';
        const swatch=document.createElement('span');swatch.className='map-colour-swatch';swatch.setAttribute('aria-hidden','true');
        Object.assign(swatch.style,{display:'inline-block',width:'64px',height:'12px',marginRight:'8px',verticalAlign:'middle',background:swatches[id]});
        if(id==='zones')swatch.style.border='2px dashed #a5e7eb';
        const detail=id==='steep' ? `Red: calculated slope above ${state.threshold}°. A planning threshold, not a validated suit limit.` : note;
        const extent=id==='elevation' ? ` Range: ${range('elevation_m_rounded')} m.` : id==='intersection' ? ` Range: ${range('intersection_error_cm',100)} m.` : '';
        row.append(swatch,`${name} · ${group}: ${detail}${extent}`);mapLegend.append(row);
      }
      const note=document.createElement('p');note.textContent='Only enabled layers are listed. Gaps in the terrain indicate missing data. Colours blend when multiple surface layers are enabled; enable one at a time to inspect its scale. Red marks threshold exceedance, not measured risk.';mapLegend.append(note);
    }
    panel.replaceChildren();
    for(const [group,items] of definitions){
      const field=document.createElement('fieldset'); field.className='map-layer-group';
      const legend=document.createElement('legend'); legend.textContent=group;field.append(legend);
      for(const [id,name,note] of items){
        const label=document.createElement('label');label.className='map-layer-option';
        const input=document.createElement('input');input.type='checkbox';input.checked=state[id];input.dataset.mapLayer=id;
        input.addEventListener('change',()=>{state[id]=input.checked;renderLegend();onChange(state);});
        label.append(input,` ${name} · ${group}`);
        const description=document.createElement('p');description.className='map-layer-legend';description.id=`legend-${id}`;description.textContent=note+(id==='elevation' ? ' '+range('elevation_m_rounded')+' m.' : id==='intersection' ? ' '+range('intersection_error_cm',100)+' m.' : '');
        input.setAttribute('aria-describedby',description.id);field.append(label,description);
      }panel.append(field);
    }
    const label=document.createElement('label');label.textContent='Slope threshold (degrees) ';
    const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=90;slider.step=1;slider.value=state.threshold;slider.id='slope-threshold';
    const value=document.createElement('output');value.htmlFor=slider.id;value.textContent=`${state.threshold}°`;
    slider.addEventListener('input',()=>{state.threshold=Number(slider.value);value.textContent=`${state.threshold}°`;renderLegend();onChange(state);});
    label.append(slider,value);panel.append(label);
    for(const text of ['A planning threshold you choose, not a validated suit limit.','Slope uses central differences of rounded elevations. Approximately 1.4° quantization near zero for a 1 m difference over 40 m; this is not constant angular resolution. The raster smooths local scarps. Layers blend in this order: orthophoto, elevation, ray separation, slope.']){const p=document.createElement('p');p.textContent=text;panel.append(p);}
    const metadata=document.createElement('p');metadata.textContent=`Raster: ${data.raster.width} × ${data.raster.height}; ${data.raster.pixel_size_m.join(' × ')} m/cell.`;panel.append(metadata);
    const summary=document.createElement('p');summary.id='route-terrain-summary';summary.setAttribute('aria-live','polite');panel.append(summary);
    renderLegend();
    return state;
  }};
})();
