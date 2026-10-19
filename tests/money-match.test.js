import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {validateContentManifest} from '../shape-friends/content.js';
const manifest=JSON.parse(await readFile(new URL('../money-match/game-content.json',import.meta.url)));
test('Money Match has six valid boards grouped into Easy, Medium and Hard',()=>{
  assert.equal(validateContentManifest(manifest),true);
  assert.deepEqual(manifest.play.difficultyGroups.map(g=>g.rounds),[['1','2'],['3','4'],['5','6']]);
});
test('all money pairs have one unique equal value per board',()=>{
  for(const round of manifest.rounds){
    const values=[];
    for(const [category,a,b] of round.pairs){
      const value=Number(category.slice(1));values.push(value);
      for(const id of [a,b]){
        const item=manifest.items[id];assert.equal(item.value,value);
        if(item.coins||item.note)assert.equal((item.note||0)+(item.coins||[]).reduce((a,b)=>a+b,0),value);
      }
    }
    assert.equal(new Set(values).size,values.length);
  }
});
test('hard boards show different currency combinations without total cards',()=>{
  for(const round of manifest.rounds.slice(4))for(const [,a,b] of round.pairs){
    assert.ok(manifest.items[a].coins);assert.ok(manifest.items[b].coins);
    assert.notDeepEqual(manifest.items[a].coins,manifest.items[b].coins);
  }
});
test('all money art exists and its XP journey totals 200',async()=>{
  for(const item of Object.values(manifest.items))await access(new URL(`../money-match/assets/cards/${item.asset}`,import.meta.url));
  const xp=manifest.progression.xp;
  assert.equal(Object.values(xp.rewards).reduce((sum,reward)=>sum+reward.practice+reward.challenge,0),200);
  assert.ok(Object.values(xp.rewards).every(reward=>reward.practice>reward.challenge));
});
test('currency cards embed real currency images rather than schematic drawings',async()=>{
  for(const item of Object.values(manifest.items)){
    const svg=await readFile(new URL(`../money-match/assets/cards/${item.asset}`,import.meta.url),'utf8');
    if(item.note||item.coins){
      assert.equal((svg.match(/<image /g)||[]).length,(item.note?1:0)+(item.coins?.length||0));
      assert.ok(svg.includes('data:image/'));
      assert.ok(!svg.includes('LEARNING NOTE'));
    }
  }
});
test('coin groups use large high-contrast face labels without tiny badges',async()=>{
  for(const item of Object.values(manifest.items)){
    if(!item.coins)continue;
    const svg=await readFile(new URL(`../money-match/assets/cards/${item.asset}`,import.meta.url),'utf8');
    const labels=[...svg.matchAll(/class="coin-denomination"[^]*?<text[^>]*font-size="(\d+)"[^>]*>₹(\d+)<\/text>/g)];
    assert.deepEqual(labels.map(match=>Number(match[2])),item.coins);
    assert.ok(labels.every(match=>Number(match[1])>=48));
    assert.match(svg,/paint-order="stroke fill"/);
    assert.doesNotMatch(svg,/<rect/);
  }
});
