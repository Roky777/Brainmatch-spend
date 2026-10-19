import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContentManifest,cardsFor} from '../shape-friends/content.js';
import {LEVELS} from '../shape-friends/play-options.js';
import {MatchBoard} from '../shape-friends/engine.js';
const base=new URL('../plant-match/',import.meta.url);
const m=JSON.parse(await readFile(new URL('game-content.json',base)));
const expected={roots:'Absorb Water',stem:'Support Plant',leaf:'Make Food',flower:'Make Fruit',fruit:'Protect Seeds',seed:'New Plant',bark:'Outer Cover',trunk:'Hold Branches',mango:'Tree',rose:'Shrub',tulsi:'Shrub',mint:'Herb',tomato:'Herb',wheat:'Grass',moneyplant:'Climber',pumpkin:'Creeper'};
test('Plant Match contains every supplied part/function and plant/type relationship',()=>{
  assert.equal(validateContentManifest(m),true);
  assert.deepEqual(m.play.difficultyGroups.map(g=>g.rounds),[['1','2'],['3','4'],['5','6']]);
  assert.deepEqual(Object.fromEntries(Object.keys(expected).map(name=>[name,m.items[`text_${name}`].name])),expected);
  assert.deepEqual(m.rounds.map(r=>r.pairs.length),[4,4,4,4,8,8]);
});
test('every board has unique visible answers, including Shrub and Herb',()=>{
  for(const round of m.rounds){
    const answers=round.pairs.map(([,a,b])=>{
      assert.equal(m.items[a].subject,m.items[b].subject);
      return m.items[b].name;
    });
    assert.equal(new Set(answers).size,answers.length);
  }
});
test('all illustrations are local PNGs and text cards preserve the exact short phrases',async()=>{
  for(const item of Object.values(m.items)){
    const data=await readFile(new URL(`assets/cards/${item.asset}`,base));
    if(item.representation==='picture')assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    else assert.equal([...data.toString().matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map(x=>x[1]).join(' '),item.name);
  }
});
test('all plant pools produce playable 4, 6 and 8 card boards in both modes',()=>{
  for(const group of m.play.difficultyGroups)for(const id of group.rounds){
    const round=m.rounds.find(r=>r.id===id),count=LEVELS[group.id].pairs;
    const cards=cardsFor({...round,pairs:round.pairs.slice(0,count)});
    assert.equal(cards.length,count*2);
    for(const mode of ['practice','challenge']){
      const board=new MatchBoard(cards,{shuffled:false,mode});
      for(let i=0;i<cards.length;i+=2){board.reveal(i,board.actor);board.reveal(i+1,board.actor);board.resolve();board.advance();}
      assert.equal(board.phase,'complete');
    }
  }
});
test('Plant Match offers exactly 200 XP with lower Sparky rewards',()=>{
  const xp=m.progression.xp;
  assert.equal(Object.values(xp.rewards).reduce((sum,reward)=>sum+reward.practice+reward.challenge,0),200);
  assert.ok(Object.values(xp.rewards).every(reward=>reward.practice>reward.challenge));
});
