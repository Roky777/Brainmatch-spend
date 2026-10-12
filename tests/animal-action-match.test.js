import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContentManifest,cardsFor} from '../shape-friends/content.js';
import {LEVELS} from '../shape-friends/play-options.js';
import {MatchBoard} from '../shape-friends/engine.js';
const base=new URL('../animal-action-match/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('game-content.json',base)));
const expected={frog:'HOP',fish:'SWIM',bird:'FLY',cat:'CLIMB',horse:'TROT',lamb:'LEAP',snake:'CRAWL',monkey:'SWING'};
test('animal actions use the exact chapter relationships and three difficulty groups',()=>{
  assert.equal(validateContentManifest(manifest),true);assert.equal(manifest.variant.grade,2);
  assert.deepEqual(manifest.play.difficultyGroups.map(g=>g.rounds),[['1'],['2'],['3']]);
  assert.deepEqual(manifest.rounds.map(r=>r.pairs.map(p=>p[0])),[Object.keys(expected).slice(0,4),Object.keys(expected).slice(4),Object.keys(expected)]);
  for(const round of manifest.rounds)for(const [animal,picture,action] of round.pairs){
    assert.equal(manifest.items[picture].animal,animal);
    assert.equal(manifest.items[action].name,expected[animal]);
  }
});
test('animal pictures are local PNGs and action cards contain just one word',async()=>{
  for(const item of Object.values(manifest.items)){
    const data=await readFile(new URL(`assets/cards/${item.asset}`,base));
    if(item.representation==='picture'){
      assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    }else{
      const svg=data.toString();
      assert.deepEqual([...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m=>m[1]),[item.name]);
      assert.match(item.name,/^[A-Z]+$/);
    }
  }
});
test('4, 6 and 8 card boards finish correctly in Practice and Beat Sparky',()=>{
  for(const group of manifest.play.difficultyGroups){
    const count=LEVELS[group.id].pairs;
    const round=manifest.rounds.find(r=>r.id===group.rounds[0]);
    const cards=cardsFor({...round,pairs:round.pairs.slice(0,count)});
    assert.equal(cards.length,count*2);
    for(const mode of ['practice','challenge']){
      const board=new MatchBoard(cards,{shuffled:false,mode});
      for(let i=0;i<cards.length;i+=2){board.reveal(i,board.actor);board.reveal(i+1,board.actor);board.resolve();board.advance();}
      assert.equal(board.phase,'complete');assert.equal(board.matched.size,count);
    }
  }
});
test('animal action XP journey totals 200 with smaller Beat Sparky rewards',()=>{
  const xp=manifest.progression.xp;
  assert.equal(Object.keys(manifest.worlds).length*manifest.rounds.length*(xp.rewards.practice+xp.rewards.challenge)+xp.completionBonus,200);
  assert.ok(xp.rewards.practice>xp.rewards.challenge);
});
