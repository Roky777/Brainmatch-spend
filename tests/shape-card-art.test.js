import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const games=['shape-friends','number-friends','money-match','body-sound-match','animal-action-match','animal-friends','shadow-match','clock-match','plant-match','how-things-work'];
async function manifest(game){try{return JSON.parse(await readFile(new URL(`../${game}/game-content.json`,import.meta.url),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
test('all reviewed card assets exist and replacement PNGs retain alpha and sensible delivery sizes',async()=>{
  for(const game of games){
    const data=await manifest(game);if(!data)continue;
    const base=new URL(data.variant.assetBase||'./assets/',new URL(`../${game}/game-content.json`,import.meta.url));
    for(const item of Object.values(data.items)){
      const path=new URL(item.asset,base);await access(path);
      if(!item.asset.endsWith('-v2.png'))continue;
      const image=await readFile(path);
      assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10]);
      assert.equal(image[25],6,`${path}: RGBA cutout required`);
      assert.ok(image.readUInt32BE(16)<=512&&image.readUInt32BE(20)<=512);
    }
  }
});
test('body vocabulary and animal actions use reviewed replacement pictures',async()=>{
  const body=await manifest('body-sound-match');
  if(body)for(const part of ['head','eye','ear','nose','mouth','hand','leg','foot','skin'])assert.equal(body.items[`picture_${part}`].asset,`${part}-v2.png`);
  const actions=await manifest('animal-action-match');
  if(actions)for(const animal of ['frog','fish','bird','cat','snake','monkey'])assert.equal(actions.items[`picture_${animal}`].asset,`${animal}-v2.png`);
});
test('count-group enlargement stays bounded and never changes quantity relationships',async()=>{
  const data=await manifest('number-friends');if(!data)return;
  for(const [id,item] of Object.entries(data.items))if(item.artScale){assert.ok(item.artScale>1&&item.artScale<=1.25);assert.match(id,/^(apples|birds|flowers|balls|stars)_/);}
  for(const round of data.rounds)for(const [category,a,b] of round.pairs){const amount=Number(category.replace('number_',''));assert.equal(Number(a.match(/_(\d+)$/)[1]),amount);assert.equal(Number(b.match(/_(\d+)$/)[1]),amount);}
});
test('real money detail labels disclose individual denominations, not combination totals',async()=>{
  const data=await manifest('money-match');if(!data)return;
  for(const item of Object.values(data.items)){
    if(!item.coins)continue;
    const svg=await readFile(new URL(`../money-match/assets/cards/${item.asset}`,import.meta.url),'utf8');
    const labels=[...svg.matchAll(/font-size="21" fill="#203975">₹(\d+)<\/text>/g)].map(match=>Number(match[1]));
    assert.deepEqual(labels,item.coins);
  }
});
