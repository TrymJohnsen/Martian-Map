/* No-dependency Chrome headless smoke test. CHROME_PATH may override Windows default. */
const {spawn}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const http=require('node:http');
const assert=require('node:assert/strict');
const deadline=setTimeout(()=>{console.error('Browser check timed out');process.exit(1);},45000);
deadline.unref();
(async()=>{
 const root=path.resolve('public'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'clean-approach-browser-'));
 const server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(req.url==='/' ? '/index.html' : req.url));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(error,body)=>{if(error){res.writeHead(404);res.end();return;}
     res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.html':'text/html'})[path.extname(file)]||'text/plain');res.end(body);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 console.log('Test server',server.address().port, await fetch('http://127.0.0.1:'+server.address().port+'/').then(async r=>({status:r.status,type:r.headers.get('content-type'),size:(await r.text()).length})));
 const chrome=spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'http://127.0.0.1:'+server.address().port+'/'],{windowsHide:true});
 let ws;
 try{
   const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Chrome did not start')),20000);
     chrome.on('error',reject);chrome.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});});
   const pages=await fetch(endpoint.replace('ws:','http:').replace(/\/devtools\/browser\/.*/, '/json/list'),{signal:AbortSignal.timeout(5000)}).then(r=>r.json());
   const page=pages.find(page=>page.type==='page' && page.url.startsWith('http://127.0.0.1:'));
   assert.ok(page,'local page target should exist');
   ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
   let next=0;const pending=new Map(),errors=[];
   ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const handler=pending.get(message.id);pending.delete(message.id);message.error ? handler.reject(message.error) : handler.resolve(message.result);}
     if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text+': '+message.params.exceptionDetails.exception?.description);});
   const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
   await send('Runtime.enable');await send('Page.enable');
   const navigation={url:'http://127.0.0.1:'+server.address().port+'/'};
   let ready=false;
   for(let i=0;i<60;i++){
     const result=await send('Runtime.evaluate',{expression:"Boolean(document.querySelector('#route-terrain-summary')?.textContent && document.querySelector('#context-cards table'))",returnByValue:true});
     if(result.result.value){ready=true;break;}await new Promise(r=>setTimeout(r,200));
   }
   if(!ready){console.error('Runtime errors:',errors);console.error(navigation);console.error(await send('Runtime.evaluate',{expression:'JSON.stringify({url:location.href,html:document.documentElement.outerHTML})',returnByValue:true}));}
   assert.ok(ready,'map, layers, context should load');
   const benchmark=await send('Runtime.evaluate',{expression:`(async()=>{
     const canvas=document.querySelector('#terrain'),times=[];
     for(let i=0;i<16;i++){
       const start=performance.now();
       canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:i%2 ? 1 : -1,cancelable:true}));
       await new Promise(requestAnimationFrame);times.push(performance.now()-start);
     }
     if(canvas.dataset.preview!=='true')throw Error('Movement should use labelled preview');
     await new Promise(resolve=>setTimeout(resolve,250));
     if(canvas.dataset.preview!=='false' || !document.querySelector('.map-interaction-note').hidden)throw Error('Full detail was not restored after movement');
     const ctx=canvas.getContext('2d'),originalClear=ctx.clearRect;let frames=0;
     ctx.clearRect=function(...args){frames++;return originalClear.apply(this,args);};
     for(let i=0;i<20;i++)canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:i%2 ? 1 : -1,cancelable:true}));
     await new Promise(requestAnimationFrame);ctx.clearRect=originalClear;
     if(frames!==1)throw Error('Camera input burst should produce one frame, got '+frames);
     await new Promise(resolve=>setTimeout(resolve,250));
     times.sort((a,b)=>a-b);return {medianFrameMs:times[8],slowestFrameMs:times.at(-1),burstEvents:20,burstFrames:frames,fullDetailRestored:canvas.dataset.preview==='false'};
   })()`,awaitPromise:true,returnByValue:true});
   console.log('Camera benchmark:',benchmark.result.value);
   const result=await send('Runtime.evaluate',{expression:`(async()=>{
     const checks=[];const ca=window.CleanApproach;
     if(document.querySelector('.map-data-coverage'))throw Error('Removed coverage figure is still present');
     const legend=document.querySelector('.map-colour-legend');
     if(!legend?.textContent.includes('Map colours and symbols'))throw Error('Visible colour legend missing');
     if(legend.closest('details'))throw Error('Colour legend must remain outside collapsed controls');
     document.querySelector('.terrain-analysis').open=true;
     for(const input of document.querySelectorAll('[data-map-layer]')){
       const before=document.querySelector('#terrain').toDataURL();
       input.click();
       if(['ortho','elevation','intersection','slope','route'].includes(input.dataset.mapLayer) && before===document.querySelector('#terrain').toDataURL())throw Error('Layer has no rendered effect: '+input.dataset.mapLayer);
       input.click();checks.push(input.dataset.mapLayer);
       if(input.checked && !legend.textContent.includes(input.closest('label').textContent.trim().split(' · ')[0]))throw Error('Active layer missing from legend');
     }
     const slider=document.querySelector('#slope-threshold');slider.value=0;slider.dispatchEvent(new Event('input'));
     const low=document.querySelector('#route-terrain-summary').textContent;
     slider.value=90;slider.dispatchEvent(new Event('input'));
     const high=document.querySelector('#route-terrain-summary').textContent;
     if(!legend.textContent.includes('above 90°'))throw Error('Legend threshold did not update');
     const copy=document.querySelector('#layer-panel').textContent+document.querySelector('#context-cards').textContent+legend.textContent;
     if(/Observert|Avledet|Helningsgrense|Ruten|Ingen observasjoner|ikke Jezero|ved landingsstedet/.test(copy))throw Error('Untranslated UI copy');
     if(low===high || !high.startsWith('0 unique'))throw Error('Threshold does not update route counts');
     let payload;window.addEventListener('map:place',e=>payload=e.detail,{once:true});
     document.querySelector('.scene-overlay-label button').click();
     if(!payload?.placeId)throw Error('Place payload missing');
     window.dispatchEvent(new CustomEvent('mission:step',{detail:{stepId:null,placeId:payload.placeId}}));
     const original=ca.scenario;
     ca.scenario={...original,places:{...original.places,extra:{label:'Test extra',row:60,col:70}},route:['extra',...Object.keys(original.places)],zones:[{id:'test',centerPlaceId:'extra',radius_m:80,label:'Test zone',evidence:'scenario'}]};
     window.dispatchEvent(new CustomEvent('scenario:change',{detail:{planId:'browser-test'}}));
     if(![...document.querySelectorAll('.scene-overlay-label button')].some(b=>b.textContent.includes('extra')))throw Error('Extra place not rendered');
     const zoneToggle=document.querySelector('[data-map-layer="zones"]'),zoneBefore=document.querySelector('#terrain').toDataURL();
     zoneToggle.click();if(zoneBefore===document.querySelector('#terrain').toDataURL())throw Error('Scenario zone not rendered');zoneToggle.click();
     const astronautBefore=document.querySelector('#terrain').toDataURL();
     window.dispatchEvent(new CustomEvent('mission:step',{detail:{stepId:null,placeId:'extra'}}));
     if(astronautBefore===document.querySelector('#terrain').toDataURL())throw Error('Mission focus does not update map');
     const missing=ca.data.arrays.valid_mask.indexOf(0);
     ca.scenario={...ca.scenario,places:{...ca.scenario.places,unknown:{label:'Unknown height',row:Math.floor(missing/ca.data.raster.width),col:missing%ca.data.raster.width},outside:{label:'Outside',row:-5,col:-5}},route:['unknown','outside']};
     window.dispatchEvent(new CustomEvent('scenario:change',{detail:{planId:'unknown-test'}}));
     const unknown=document.querySelector('#route-terrain-summary').textContent;
     if(!unknown.includes('The route crosses') || !unknown.includes('beyond the raster'))throw Error('Unknown/outside route not flagged');
     ca.scenario=original;window.dispatchEvent(new CustomEvent('scenario:change',{detail:{planId:original.id}}));
     document.querySelector('.scene-overlay-label button').focus();
     if(document.activeElement!==document.querySelector('.scene-overlay-label button'))throw Error('Place control cannot focus');
     return {layers:checks,low,high,unknown,payload,contextCards:document.querySelectorAll('.context-card').length};
   })()`,awaitPromise:true,returnByValue:true});
   if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
   assert.deepEqual(errors,[]);assert.equal(result.result.value.layers.length,7);assert.equal(result.result.value.contextCards,2);
   const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   const screenshotPath=path.join(os.tmpdir(),'clean-approach-map-smoke.png');fs.writeFileSync(screenshotPath,Buffer.from(screenshot.data,'base64'));console.log('Screenshot:',screenshotPath);
   console.log(JSON.stringify(result.result.value,null,2));console.log('PASS: real headless Chrome smoke test; no runtime exceptions.');
 }finally{if(ws)ws.close();chrome.kill();server.close(); /* Chrome may briefly hold its temporary profile; OS temp cleanup owns it. */}
})().catch(error=>{console.error(error);process.exitCode=1;});
