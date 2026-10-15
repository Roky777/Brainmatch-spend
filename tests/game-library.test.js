import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const html=await readFile(new URL('index.html',root),'utf8');
const games=['shape-friends','number-friends','animal-friends','body-sound-match','money-match','clock-match','animal-action-match','shadow-match','plant-match','how-things-work'];

test('the main library exposes every playable game',async()=>{
  assert.doesNotMatch(html,/http-equiv=["']refresh/i);
  for(const game of games){
    assert.match(html,new RegExp(`href=["']${game}/["']`));
    await access(new URL(`${game}/index.html`,root));
  }
});

test('every game entry can return to the shared library',async()=>{
  const shared=await readFile(new URL('shape-friends/index.html',root),'utf8');
  assert.match(shared,/class="home-button[^>]+href="\.\.\/"/);
  for(const game of games.slice(1)){
    const wrapper=await readFile(new URL(`${game}/index.html`,root),'utf8');
    assert.match(wrapper,/bootstrap.js\?v=11/);
    assert.match(wrapper,new RegExp(`data-game-variant="${game}"`));
  }
  const bootstrap=await readFile(new URL('shape-friends/bootstrap.js',root),'utf8');
  assert.match(bootstrap,/game-content\.json/);
  assert.match(bootstrap,/new URL\('\.\/game-shell.html\?v=2',import.meta.url\)/);
});

test('launcher artwork is local and present',async()=>{
  const sources=[...html.matchAll(/<img src="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(sources.length,games.length*2);
  await Promise.all(sources.map(source=>access(new URL(source,root))));
});
