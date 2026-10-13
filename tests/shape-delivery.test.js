import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {DELIVERY_ASSETS,deliveryURL} from '../shape-friends/delivery-map.js';
test('delivery mapping preserves version queries and unrelated URLs',()=>{
  const source=new URL('../shape-friends/assets/loader-sparky.png?v=test',import.meta.url).href;
  assert.match(deliveryURL(source),/loader-sparky-crisp.webp\?v=test$/);
  assert.equal(deliveryURL('https://example.com/photo.png'),'https://example.com/photo.png');
});
test('optimized shared delivery assets exist and use WebP',async()=>{
  for(const [source,target] of Object.entries(DELIVERY_ASSETS)){
    if(!source.startsWith('shape-friends/'))continue;
    const bytes=await readFile(new URL(`../${target}`,import.meta.url));
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    await access(new URL(`../${source}`,import.meta.url));
  }
});
test('optional image warming yields to input and inactive character loops stop',async()=>{
  const loading=await readFile(new URL('../shape-friends/loading.js',import.meta.url),'utf8');
  assert.match(loading,/requestIdleCallback/);assert.match(loading,/fetchPriority=priority/);
  const sparky=await readFile(new URL('../shape-friends/sparky.js',import.meta.url),'utf8');
  assert.match(sparky,/cancelAnimationFrame\(this.timer\)/);
  assert.match(sparky,/now-this.lastDraw>=32/);
});
test('runtime base styles eliminate the nested import network waterfall',async()=>{
  const css=await readFile(new URL('../shape-friends/runtime-base.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/@import/);
  assert.match(css,/\.card-face/);assert.match(css,/--game-ink/);
});
test('hero character uses crisp assets rather than the half-resolution delivery',()=>{
  assert.match(DELIVERY_ASSETS['shape-friends/assets/loader-sparky.png'],/-crisp.webp$/);
  assert.match(DELIVERY_ASSETS['shape-friends/assets/new_sparky_sheets/sparky_wall_idle_blink_formal_atlas_v1.png'],/-crisp.webp$/);
});
test('upcoming board warms without downloading the entire card catalog',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.match(app,/function warmNextBoard/);
  assert.match(app,/upcoming.pairs.flatMap/);
  assert.doesNotMatch(app,/Object.keys\(GAME_CONTENT.items\).map\(assetURL\)/);
});
