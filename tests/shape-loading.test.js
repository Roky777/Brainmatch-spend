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
    assert.match(html,/loading.css\?v=4/);
    assert.match(html,/bootstrap.js\?v=15/);
    assert.match(html,/id="loading-critical"/);
    assert.match(html,/class="loading-mascot"/);
    assert.match(html,/data-art-ready="true"/);
    assert.ok(Buffer.byteLength(html)<220000,'opening HTML should keep a bounded high-quality mascot budget');
    assert.match(html,/data:image\/webp;base64,/);
  }
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/settingsUI\(\); startRound/);
  assert.match(app,/await finishStartup/);
  assert.match(app,/sparky.preparePlay\(\)/);
});
test('startup gives assets time to load and bounds external font waiting', async () => {
  const loader=await readFile(new URL('../shape-friends/loading.js',import.meta.url),'utf8');
  assert.match(loader,/STARTUP_MIN_MS = 0/);
  assert.match(loader,/STARTUP_MAX_MS = 3500/);
  assert.match(loader,/Promise.all\(\[delay\(STARTUP_MIN_MS\), openingFontsReady\(\)\]\)/);
  assert.match(loader,/setTimeout\(resolve, 2500\)/);
  assert.match(loader,/await Promise.race/);
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
test('post-entry readiness never creates a loader or blocks the current screen', async () => {
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
    assert.equal(app.inert,false);assert.equal(removed,false);
    release(true);assert.equal(await pending,true);
    assert.equal(removed,false);assert.equal(app.inert,false);assert.equal(progress.value,0);
  } finally {globalThis.document=previous;}
});
test('entry waits only for the opening scene and warms cards after startup',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/Object.keys\(GAME_CONTENT.items\).map\(assetURL\)/);
  assert.doesNotMatch(app,/\.\.\.sparky.sources/);
  const startup=app.match(/await finishStartup\(\[([\s\S]*?)\]\)/)[1];
  assert.doesNotMatch(startup,/GAME_CONTENT.items|sparky.sources|flatMap/);
  assert.match(app,/void preloadBackground/);
  const loader=await readFile(new URL('../shape-friends/loading.js',import.meta.url),'utf8');
  assert.doesNotMatch(loader,/document.createElement\('section'\)/);
  assert.match(loader,/retainImage\(url,image\)/);
  const css=await readFile(new URL('../shape-friends/loading.css',import.meta.url),'utf8');
  assert.match(css,/data-art-ready="true"\] .loading-cloud/);
  assert.match(css,/data-art-ready="true"\] .loading-sparky/);
});
test('repository export creates direct game entrypoints instead of redirect links',async()=>{
  // Export helper lives in the development repo, not the standalone game repos.
  let source;
  try{source=await readFile(new URL('../scripts/export-variant.mjs',import.meta.url),'utf8');}
  catch(error){if(error.code==='ENOENT')return;throw error;}
  assert.match(source,/writeFile\(join\(target,'index.html'\),entry\)/);
  assert.match(source,/<base href="\.\/shape-friends\/">/);
});
test('missing startup artwork does not trap the menu',async()=>{
  const previousDocument=globalThis.document,previousImage=globalThis.Image,previousStyle=globalThis.getComputedStyle;
  const app={inert:false,setAttribute(){},removeAttribute(){}};
  let removed=false;
  const screen={querySelector:()=>null,remove(){removed=true;}};
  globalThis.document={baseURI:'http://localhost/',body:{},getElementById:id=>id==='app'?app:screen,querySelector:()=>null};
  globalThis.getComputedStyle=()=>({backgroundImage:'none'});
  globalThis.Image=class {set src(value){queueMicrotask(()=>this.onerror());}};
  try{
    const {finishStartup}=await import('../shape-friends/loading.js');
    await finishStartup(['missing-startup-picture.png']);
    assert.equal(app.inert,false);assert.equal(removed,true);
  }finally{globalThis.document=previousDocument;globalThis.Image=previousImage;globalThis.getComputedStyle=previousStyle;}
});
test('variant boot skips external font blocking and fetches a lightweight layout',async()=>{
  const bootstrap=await readFile(new URL('../shape-friends/bootstrap.js',import.meta.url),'utf8');
  assert.match(bootstrap,/filter\(link=>!link.href.includes\('fonts.googleapis.com'\)\)/);
  assert.match(bootstrap,/game-shell.html\?v=3/);
  const shell=await readFile(new URL('../shape-friends/game-shell.html',import.meta.url),'utf8');
  assert.ok(Buffer.byteLength(shell)<30000);assert.doesNotMatch(shell,/data:image|id="game-loading"/);
});

test('large decoded animation sheets are evicted instead of retaining unbounded memory',async()=>{
  const previousImage=globalThis.Image,previousDocument=globalThis.document;
  globalThis.document={baseURI:'http://localhost/memory-test/'};
  globalThis.Image=class {
    naturalWidth=4096;naturalHeight=4096;
    set src(value){queueMicrotask(()=>this.onload());}
    async decode(){}
  };
  try{
    const {loadImage,isImageReady}=await import('../shape-friends/loading.js');
    await loadImage('large-one.png');await loadImage('large-two.png');
    assert.equal(isImageReady('large-one.png'),false);
    assert.equal(isImageReady('large-two.png'),true);
  }finally{globalThis.Image=previousImage;globalThis.document=previousDocument;}
});

test('mode and world menus do not wait for unrelated pictures',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app.match(/async function showLevels[\s\S]*?options =/)[0],/await readyScreen/);
  assert.doesNotMatch(app.match(/async function openThemes[\s\S]*?\n\}/)[0],/await readyScreen/);
  const content=await readFile(new URL('../shape-friends/content.js',import.meta.url),'utf8');
  assert.doesNotMatch(content,/^import .*with \{/m);
  assert.match(content,/AbortSignal.timeout\(12000\)/);
});
