// Browser integration QA. Start npm start and an isolated Chrome with
// --headless=new --remote-debugging-port=9223. No browser library dependency.
// node tests/shape-friends-browser.mjs [--full]
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { PACK, ITEMS } from '../shape-friends/content.js';
const endpoint = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9223';
const origin = process.env.GAME_URL || 'http://127.0.0.1:4178';
const tab = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let serial = 0; const pending = new Map(), errors = [], badResponses = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) { const promise = pending.get(message.id); pending.delete(message.id); message.error ? promise.reject(Error(JSON.stringify(message.error))) : promise.resolve(message.result); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + message.params.exceptionDetails.exception?.description);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400 && !message.params.response.url.endsWith('favicon.ico')) badResponses.push(message.params.response.url);
});
function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(expression, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await evaluate(expression)) return; await delay(100); }
  throw Error(`Timed out: ${expression}`);
}
async function click(selector) {
  const rect = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'nearest'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...rect, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...rect, button: 'left', clickCount: 1 });
  await delay(90); // Allow native click/close events and the next rendered frame.
}
async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`/tmp/brainmatch-shape-friends-${name}.png`, Buffer.from(result.data, 'base64'));
}
async function viewport(width, height) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 }); await delay(200); }
async function noOverflow() { assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'horizontal overflow'); }
async function showToy(id) {
  for (let page = 0; page < 4; page++) {
    if (await evaluate(`!document.querySelector('[data-toy="${id}"]').hidden`)) return;
    await click('[data-more-toys]');
  }
  throw Error(`Cannot find discovery ${id}`);
}
async function drag(source, destination, touch = false, cancel = false) {
  const points = await evaluate(`(() => { const get=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}}; return [get(${JSON.stringify(source)}),get(${JSON.stringify(destination)})]; })()`);
  const [start, end] = points;
  const point = position => ({ ...position, id: 1, radiusX: 6, radiusY: 6, force: 1 });
  if (touch) await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start)] });
  else await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...start, button: 'left', buttons: 1, clickCount: 1 });
  for (let step = 1; step <= 8; step++) {
    const position = { x: start.x + (end.x - start.x) * step / 8, y: start.y + (end.y - start.y) * step / 8 };
    if (touch) await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(position)] });
    else await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...position, button: 'left', buttons: 1 });
    await delay(30);
  }
  if (touch) await send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  else await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...end, button: 'left', buttons: 0, clickCount: 1 });
  await delay(100);
}

await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
await viewport(1440,1000);await send('Page.navigate',{url:origin+'/shape-friends/'});await send('Page.bringToFront');
await until('document.querySelector("#app")?.dataset.mode==="setup"');
await evaluate('localStorage.removeItem("brainmatch:shape-friends:v1");location.reload()');await delay(600);
await until('document.querySelector("#app")?.dataset.mode==="setup"');
await screenshot('setup');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".menu-companion")).display'),'none','Sparky art is hidden for the portrait design pass');
assert.equal(await evaluate('document.querySelector("#app").hasAttribute("aria-pressed")'),false,'Mode and difficulty selectors must target buttons, never the app container');
for(const [width,height] of [[390,844],[375,669],[320,568],[360,640],[430,932],[480,800],[768,1024]]){
 await viewport(width,height);await noOverflow();
 assert.equal(await evaluate('document.querySelector("#level-dialog").open'),false,'Difficulty popup stays closed on the home menu');
 assert(await evaluate('(()=>{const r=document.querySelector("button[data-play-mode=challenge]").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()'),`Home menu visible ${width}x${height}`);
 assert(await evaluate('(()=>{const r=document.querySelector(".setup-view[data-step=menu] .menu-content").getBoundingClientRect();return Math.abs((r.top+r.bottom)/2-innerHeight/2)<2})()'),`Home menu is vertically balanced ${width}x${height}`);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".menu-companion")).display'),'none');
 await screenshot('setup-'+width+'x'+height);
}
await viewport(844,390);
assert.equal(await evaluate('getComputedStyle(document.querySelector(".portrait-gate")).display'),'flex','Landscape phones show the portrait-only gate');
await screenshot('portrait-gate-844x390');
await viewport(1440,1000);
await evaluate('document.querySelector("button[data-play-mode=challenge]").focus()');
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
assert.equal(await evaluate('document.querySelector("button[data-play-mode=challenge]").getAttribute("aria-pressed")'),'true');
await until('document.querySelector("#level-dialog").open');
assert.equal(await evaluate('document.querySelector("#level-mode-label").textContent'),'Beat Sparky');
for(const [width,height] of [[390,844],[320,568],[360,640],[430,932],[480,800],[768,1024]]){
 await viewport(width,height);await noOverflow();
 const bounds=await evaluate('(()=>{const r=document.querySelector("#level-dialog").getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom}})()');
 assert(bounds.top>=0&&bounds.left>=0&&bounds.right<=width&&bounds.bottom<=height,`Beat Sparky difficulty popup fits ${width}x${height}: ${JSON.stringify(bounds)}`);
 assert.equal(await evaluate('document.querySelectorAll(".difficulty-face").length'),3,'Every difficulty has a clear face cue');
 await screenshot('beat-sparky-level-dialog-'+width+'x'+height);
}
await click('#level-close');
await click('button[data-play-mode="practice"]');
await until('document.querySelector("#level-dialog").open');
assert.equal(await evaluate('document.querySelector("#level-mode-label").textContent'),'Practice');
for(const [width,height] of [[390,844],[320,568],[360,640],[430,932],[480,800],[768,1024]]){
 await viewport(width,height);await noOverflow();
 const bounds=await evaluate('(()=>{const r=document.querySelector("#level-dialog").getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom}})()');
 assert(bounds.top>=0&&bounds.left>=0&&bounds.right<=width&&bounds.bottom<=height,`Practice difficulty popup fits ${width}x${height}: ${JSON.stringify(bounds)}`);
 await screenshot('practice-level-dialog-'+width+'x'+height);
}
await evaluate('(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__playedVoice=this;return play.call(this)}})()');
await click('button[data-level="gentle"]');
assert.equal(await evaluate('document.querySelector("#cloud-curtain").hidden'),false,'Clouds cover the newly opened round');
await delay(400);
assert(await evaluate('(()=>{const c=document.querySelector("#cloud-veil"),r=document.querySelector("#cards").getBoundingClientRect(),d=devicePixelRatio||1,k=Math.min(d,2),ctx=c.getContext("2d"),center=ctx.getImageData(Math.round((r.left+r.width/2)*k),Math.round((r.top+r.height/2)*k),1,1).data[3],corner=ctx.getImageData(1,1,1,1).data[3];return center<corner})()'),'The cloud field clears from the board outward');
await screenshot('cloud-opening');
await until('document.querySelector("#cloud-curtain").hidden',3000);
await until('window.__playedVoice?.currentTime>0');
assert(await evaluate('decodeURIComponent(window.__playedVoice.src).endsWith("pw_asset_cheerful-encouragingwelco_20260929 (1).mp3")'));
assert.equal(await evaluate('document.querySelector("#sparky").dataset.sheet'),'wall-idle-formal','The approved formal wall-seated idle must be visible');
const count=await evaluate('(async()=>{const {VOICE_CLIPS}=await import("./audio.js");const c=new AudioContext();for(const path of Object.values(VOICE_CLIPS)){const r=await fetch(path);if(!r.ok)throw Error(path);const b=await c.decodeAudioData(await r.arrayBuffer());if(!b.duration)throw Error(path)}await c.close();return Object.keys(VOICE_CLIPS).length})()');
assert.equal(count,21);
await click('#settings-open');
for(const [width,height] of [[320,568],[390,844],[768,1024]]){
 await viewport(width,height);await noOverflow();
 const pause=await evaluate('(()=>{const r=document.querySelector("#settings-dialog").getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right}})()');
 assert(pause.top>=0&&pause.bottom<=height&&pause.left>=0&&pause.right<=width,`Pause fits ${width}x${height}: ${JSON.stringify(pause)}`);
 await screenshot('pause-'+width+'x'+height);
}
await viewport(1440,1000);const frame=await evaluate('document.querySelector("#sparky").dataset.frame');await delay(200);
assert.equal(await evaluate('document.querySelector("#sparky").dataset.frame'),frame);
await click('#voice-toggle');await click('#music-toggle');await click('[data-close]');
await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
const touch=await evaluate('(()=>{const r=document.querySelector(".memory-card").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');
await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...touch,id:1}]});
await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(200);
assert.equal(await evaluate('document.querySelectorAll(".is-open").length'),1);
await send('Emulation.setTouchEmulationEnabled',{enabled:false});
assert.equal(await evaluate('getComputedStyle(document.querySelector(".companion")).display'),'none');
await screenshot('dream-first-card');
await click('.home-button');
for(const mode of ['practice','challenge'])for(const [level,size] of [['gentle',4],['growing',6],['clever',8]]){
 await click('button[data-play-mode="'+mode+'"]');await click('button[data-level="'+level+'"]');
 await until('document.querySelector("#cloud-curtain").hidden',3000);
 assert.equal(await evaluate('document.querySelectorAll(".memory-card").length'),size);
 for(const [width,height] of [[390,844],[320,568],[360,640],[430,932],[480,800],[768,1024]]){
   await viewport(width,height);await noOverflow();
   assert(await evaluate('getComputedStyle(document.querySelector("#discovery-strip")).display==="none"'));
   const layout=await evaluate('(()=>{const b=document.querySelector("#cards").getBoundingClientRect(),t=document.querySelector(".turn-banner").getBoundingClientRect(),s=document.querySelector(".companion"),a=document.querySelector("#app").getBoundingClientRect();return {ok:t.bottom<=b.top&&b.left>=a.left&&b.right<=a.right&&b.bottom<=innerHeight&&getComputedStyle(s).display==="none",board:[b.x,b.y,b.width,b.height],turn:[t.x,t.y,t.width,t.height],stage:[a.x,a.y,a.width,a.height]}})()');
   if(!layout.ok)await screenshot('layout-fail-'+width+'x'+height);
   assert(layout.ok,mode+' '+level+' layout '+width+' '+JSON.stringify(layout));
   if(mode==='practice'&&level==='gentle'&&width===390)await screenshot('kimono-practice-390x844');
   if(mode==='challenge'&&level==='clever')await screenshot('minimal-'+width+'x'+height);
 }
 await viewport(1440,1000);
 const observations=new Map(),shapeForName=new Map(PACK.rounds[0].pairs.flatMap(([p,a,b])=>[[ITEMS[a].name,p],[ITEMS[b].name,p]]));
 let turns=new Set(),moves=0;const deadline=Date.now()+160000;
 while(Date.now()<deadline){
   const state=await evaluate('({mode:document.querySelector("#app").dataset.mode,actor:document.querySelector("#turn-chip").dataset.actor,cards:[...document.querySelectorAll(".memory-card")].map(e=>({index:+e.dataset.index,label:e.getAttribute("aria-label"),open:e.classList.contains("is-open"),matched:e.classList.contains("is-matched"),enabled:!e.disabled}))})');
   for(const card of state.cards.filter(c=>c.open)){const name=card.label.split(/, matched|, face up/)[0];assert(shapeForName.has(name),name);observations.set(card.index,shapeForName.get(name))}
   turns.add(state.actor);if(state.mode==='result')break;
   const choices=state.cards.filter(c=>c.enabled),selected=state.cards.find(c=>c.open&&!c.matched);
   if(state.actor==='child'&&choices.length){
     let choice;
     if(selected)choice=choices.find(c=>observations.get(c.index)&&observations.get(c.index)===observations.get(selected.index));
     else choice=choices.find(c=>observations.has(c.index)&&choices.some(o=>o.index!==c.index&&observations.get(o.index)===observations.get(c.index)));
     choice||=choices.find(c=>!observations.has(c.index))||choices[0];
     await click('[data-index="'+choice.index+'"]');moves++;
   }
   await delay(100);
 }
 assert.equal(await evaluate('document.querySelector("#app").dataset.mode'),'result');
 if(mode==='practice')assert.deepEqual([...turns],['child']);
 const score=await evaluate('document.querySelector("#result-score").textContent');
 if(mode==='challenge'){const numbers=score.match(/\d+/g).map(Number);assert.equal(numbers[0]+numbers[1],size/2);}
 await screenshot(mode+'-'+level+'-result');
 if(mode==='practice'&&level==='gentle'){
   for(const [width,height] of [[320,568],[390,844],[768,1024]]){
     await viewport(width,height);await noOverflow();
     const result=await evaluate('(()=>{const r=document.querySelector("#result-view").getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right}})()');
     assert(result.top>=0&&result.bottom<=height&&result.left>=0&&result.right<=width,`Result fits ${width}x${height}: ${JSON.stringify(result)}`);
     await screenshot('result-'+width+'x'+height);
   }
   await viewport(1440,1000);
 }
 console.log(mode+' '+level+' completed: '+score+'; '+moves+' child flips.');
 await click('#choose-game');
}
await click('button[data-play-mode="challenge"]');
await evaluate('window.__originalRandom=Math.random;Math.random=()=>0');
await click('button[data-level="clever"]');await until('document.querySelector("#cloud-curtain").hidden',3000);await click('[data-index="0"]');await click('[data-index="1"]');
await until('document.querySelector("#turn-chip").dataset.actor==="sparky"');
assert.equal(await evaluate('getComputedStyle(document.querySelector("#cast-star")).display'),'block','The wand star is available');
await until('document.querySelector("#cast-star").classList.contains("visible")');
await screenshot('sparky-star-travel');
await until('document.querySelectorAll(".is-open").length===1');
await screenshot('sparky-card-tap');
await click('.home-button');await evaluate('Math.random=window.__originalRandom');
await click('button[data-play-mode="challenge"]');await click('button[data-level="clever"]');await until('document.querySelector("#cloud-curtain").hidden',3000);await click('[data-index="0"]');
await click('.home-button');await delay(1500);assert.equal(await evaluate('document.querySelector("#app").dataset.mode'),'setup');
await click('button[data-play-mode="challenge"]');await click('button[data-level="gentle"]');await until('document.querySelector("#cloud-curtain").hidden',3000);assert.equal(await evaluate('document.querySelectorAll(".is-open").length'),0);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await click('.home-button');await click('button[data-play-mode="practice"]');await click('button[data-level="gentle"]');
assert.equal(await evaluate('document.querySelector("#cloud-curtain").hidden'),true,'Reduced motion skips the cloud transition');
assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
console.log('All six mode/level combinations, portrait layouts, cloud reveal, local voice playback, pause, cancellation and reduced motion passed.');
await send('Page.close');ws.close();
