import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('decoded images share one request and failures can be retried', async () => {
  const previousImage=globalThis.Image, previousDocument=globalThis.document;
  let requests=0, fail=false, decodes=0;
  globalThis.document={baseURI:'http://localhost/shape-friends/'};
  globalThis.Image=class {
    naturalWidth=100;
    set src(value){requests++;queueMicrotask(()=>fail?this.onerror():this.onload());}
    async decode(){decodes++;}
  };
  try {
    const {loadImage}=await import('../shape-friends/loading.js');
    assert.deepEqual(await Promise.all([loadImage('card.png'),loadImage('card.png')]),[true,true]);
    assert.equal(requests,1);assert.equal(decodes,1);
    fail=true;assert.equal(await loadImage('retry.png'),false);
    fail=false;assert.equal(await loadImage('retry.png'),true);
    assert.equal(requests,3);
  } finally {globalThis.Image=previousImage;globalThis.document=previousDocument;}
});
test('all variants load the shared loading screen and versioned runtime', async () => {
  for(const folder of ['shape-friends','number-friends','money-match','body-sound-match','animal-friends','animal-action-match','clock-match','shadow-match','plant-match','how-things-work']) {
    let html;
    try {html=await readFile(new URL(`../${folder}/index.html`,import.meta.url),'utf8');}
    catch(error){if(error.code==='ENOENT'&&folder!=='shape-friends')continue;throw error;}
    assert.match(html,/loading.css\?v=2/);
    assert.match(html,/bootstrap.js\?v=1/);
    assert.match(html,/id="loading-critical"/);
    assert.match(html,/class="loading-mascot"/);
  }
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/settingsUI\(\); startRound/);
  assert.match(app,/await finishStartup/);
  assert.match(app,/sparky.preparePlay\(\)/);
});
test('startup gives assets time to load and bounds external font waiting', async () => {
  const loader=await readFile(new URL('../shape-friends/loading.js',import.meta.url),'utf8');
  assert.match(loader,/STARTUP_MIN_MS = 1200/);
  assert.match(loader,/Promise.all\(\[delay\(STARTUP_MIN_MS\), openingFontsReady\(\)\]\)/);
  assert.match(loader,/setTimeout\(resolve, 2500\)/);
  assert.match(loader,/await welcomeReady/);
  assert.match(loader,/app.removeAttribute\('aria-busy'\)/);
});
test('opening screen remains blocked until the startup hold completes', async () => {
  const previousDocument=globalThis.document, previousStyle=globalThis.getComputedStyle,previousImage=globalThis.Image;
  const attrs=new Map();
  const app={inert:false,setAttribute:(name,value)=>attrs.set(name,value),removeAttribute:name=>attrs.delete(name)};
  globalThis.document={baseURI:'http://localhost/shape-friends/',body:{},getElementById:id=>id==='app'?app:null,querySelector:()=>null,fonts:{load:async()=>[]}};
  globalThis.Image=class {naturalWidth=100;set src(value){queueMicrotask(()=>this.onload());}async decode(){}};
  globalThis.getComputedStyle=()=>({backgroundImage:'none'});
  try {
    const {finishStartup,STARTUP_MIN_MS}=await import('../shape-friends/loading.js');
    const began=performance.now(),ready=finishStartup();
    assert.equal(app.inert,true);assert.equal(attrs.get('aria-busy'),'true');
    await ready;
    assert.ok(performance.now()-began>=STARTUP_MIN_MS-20);
    assert.equal(app.inert,false);assert.equal(attrs.has('aria-busy'),false);
  } finally {globalThis.document=previousDocument;globalThis.getComputedStyle=previousStyle;globalThis.Image=previousImage;}
});
test('a screen transition waits for every asset and blocks interaction', async () => {
  const previous=globalThis.document;
  let release,removed=false;
  const progress={value:0,max:1};
  const app={inert:false};
  const screen={querySelector:()=>progress,remove:()=>{removed=true;}};
  globalThis.document={getElementById:id=>id==='app'?app:screen};
  try {
    const {readyScreen}=await import('../shape-friends/loading.js');
    const pending=readyScreen([Promise.resolve(true),new Promise(resolve=>{release=resolve;})]);
    await Promise.resolve();
    assert.equal(app.inert,true);assert.equal(removed,false);
    release(true);assert.equal(await pending,true);
    assert.equal(removed,true);assert.equal(app.inert,false);assert.equal(progress.value,2);
  } finally {globalThis.document=previous;}
});
test('repository export creates direct game entrypoints instead of redirect links',async()=>{
  // Export helper lives in the development repo, not the standalone game repos.
  let source;
  try{source=await readFile(new URL('../scripts/export-variant.mjs',import.meta.url),'utf8');}
  catch(error){if(error.code==='ENOENT')return;throw error;}
  assert.match(source,/writeFile\(join\(target,'index.html'\),entry\)/);
  assert.match(source,/<base href="\.\/shape-friends\/">/);
});
