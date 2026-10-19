import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContentManifest,cardsFor} from '../shape-friends/content.js';
import {LEVELS} from '../shape-friends/play-options.js';
import {MatchBoard} from '../shape-friends/engine.js';
const base=new URL('../how-things-work/',import.meta.url);
const m=JSON.parse(await readFile(new URL('game-content.json',base)));
test('science variant contains the eight exact supplied relationships',()=>{
  assert.equal(validateContentManifest(m),true);
  const expected={stone:'Sinks',leaf:'Floats',ball:'Rolls',top:'Spins',cork:'Floats',coin:'Sinks',bangle:'Spins',bottle:'Floats'};
  assert.deepEqual(Object.fromEntries(Object.keys(expected).map(n=>[n,m.items[`behaviour_${n}`].name])),expected);
  assert.deepEqual(new Set(m.rounds.flatMap(r=>r.pairs.map(p=>p[0]))),new Set(Object.keys(expected)));
});
test('no board has duplicate visible behaviour answers',()=>{
  for(const round of m.rounds){
    const answers=round.pairs.map(([,a,b])=>{assert.equal(m.items[a].subject,m.items[b].subject);return m.items[b].name;});
    assert.equal(new Set(answers).size,answers.length);
  }
});
test('all science assets exist and answer cards contain one short word',async()=>{
  for(const item of Object.values(m.items)){
    const data=await readFile(new URL(`assets/cards/${item.asset}`,base));assert.ok(data.length>100);
    if(item.representation==='text')assert.deepEqual([...data.toString().matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(x=>x[1]),[item.name]);
  }
});
test('all science difficulties are playable with 4, 6 and 8 cards in both modes',()=>{
  for(const group of m.play.difficultyGroups){
    const round=m.rounds.find(r=>r.id===group.rounds[0]),count=LEVELS[group.id].pairs;
    const cards=cardsFor({...round,pairs:round.pairs.slice(0,count)});assert.equal(cards.length,count*2);
    for(const mode of ['practice','challenge']){
      const board=new MatchBoard(cards,{shuffled:false,mode});
      for(let i=0;i<cards.length;i+=2){board.reveal(i,board.actor);board.reveal(i+1,board.actor);board.resolve();board.advance();}
      assert.equal(board.phase,'complete');
    }
  }
});
test('science journey totals 200 XP and floating bottle is explicitly capped',()=>{
  const xp=m.progression.xp;assert.equal(Object.values(xp.rewards).reduce((sum,reward)=>sum+reward.practice+reward.challenge,0),200);
  assert.ok(Object.values(xp.rewards).every(reward=>reward.practice>reward.challenge));assert.match(m.items.picture_bottle.name,/capped/);
});
