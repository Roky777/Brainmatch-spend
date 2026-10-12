import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { validateContentManifest } from '../shape-friends/content.js';

const manifest=JSON.parse(await readFile(new URL('../number-friends/game-content.json',import.meta.url),'utf8'));

test('Number Friends ships seven complete, valid learning levels',()=>{
  assert.equal(validateContentManifest(manifest),true);
  assert.equal(manifest.variant.id,'number-friends');
  assert.equal(manifest.rounds.length,7);
  assert.deepEqual(manifest.rounds.map(round=>round.pairs.length),[4,4,4,4,8,4,4]);
});

test('every Number Friends pair represents one equal quantity',()=>{
  for(const round of manifest.rounds){
    for(const [category,a,b] of round.pairs){
      const expected=Number(category.replace('number_',''));
      const quantity=id=>Number(id.match(/_(\d+)$/)?.[1]);
      assert.equal(quantity(a),expected,`${round.id}: ${a}`);
      assert.equal(quantity(b),expected,`${round.id}: ${b}`);
      assert.notEqual(a,b);
    }
  }
});

test('all numeral, dot, hand and object artwork is local and present',async()=>{
  await Promise.all(Object.values(manifest.items).map(item=>access(new URL(`../number-friends/assets/cards/${item.asset}`,import.meta.url))));
});

test('hands and countable objects use finished raster artwork',async()=>{
  const rendered=Object.entries(manifest.items).filter(([id])=>id.startsWith('fingers_')||/^(sun|apples|birds|flowers|balls|stars)_/.test(id));
  for(const [id,item] of rendered){
    assert.match(item.asset,/\.png$/i,`${id} should use rendered PNG artwork`);
    const png=await readFile(new URL(`../number-friends/assets/cards/${item.asset}`,import.meta.url));
    assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],`${item.asset} should be a valid PNG`);
  }
});

test('dot cards use large, evenly countable token layouts',async()=>{
  for(const quantity of [1,2,3,4,8]){
    const svg=await readFile(new URL(`../number-friends/assets/cards/dots-${quantity}.svg`,import.meta.url),'utf8');
    assert.equal((svg.match(/<circle\b/g)||[]).length,quantity,`dots-${quantity}.svg should contain ${quantity} tokens`);
    assert.doesNotMatch(svg,/r="24"/,`dots-${quantity}.svg should not use the old undersized dots`);
  }
});

test('the longer Number Friends XP journey still totals exactly 200',()=>{
  const activities=Object.keys(manifest.worlds).length*manifest.rounds.length;
  const xp=manifest.progression.xp;
  assert.ok(xp.rewards.practice>xp.rewards.challenge);
  assert.equal(activities*(xp.rewards.practice+xp.rewards.challenge)+xp.completionBonus,200);
});
