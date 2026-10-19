import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContentManifest,cardsFor} from '../shape-friends/content.js';
import {LEVELS} from '../shape-friends/play-options.js';
import {MatchBoard} from '../shape-friends/engine.js';
const base=new URL('../clock-match/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('game-content.json',base)));
test('Clock Match groups the chapter times into Easy, Medium and Hard',()=>{
  assert.equal(validateContentManifest(manifest),true);
  assert.deepEqual(manifest.play.difficultyGroups.map(g=>g.rounds),[['1'],['2'],['3']]);
  assert.deepEqual(manifest.rounds.map(r=>r.pairs.map(p=>manifest.items[p[1]].hour)),[[6,7,8,9],[1,2,4,10],[1,2,4,6,7,8,9,10]]);
  assert.equal(manifest.play.shufflePairs,true);
});
test('every clock pairs uniquely with its exact numerical time',()=>{
  for(const round of manifest.rounds){
    assert.equal(new Set(round.pairs.map(p=>p[0])).size,round.pairs.length);
    for(const [,a,b] of round.pairs){
      const clock=manifest.items[a],time=manifest.items[b];
      assert.equal(clock.hour,time.hour);
      assert.equal(clock.representation,'analog');assert.equal(time.representation,'digital');
      assert.equal(time.name,`${clock.hour}:00`);
    }
    assert.equal(cardsFor(round).length,round.pairs.length*2);
  }
});
test('all eight clock assets have mathematically correct hands and twelve numerals',async()=>{
  for(const item of Object.values(manifest.items)){
    const svg=await readFile(new URL(`assets/cards/${item.asset}`,base),'utf8');
    if(item.representation==='analog'){
      assert.match(svg,/data-hand="minute" transform="rotate\(0 120 120\)"/);
      assert.ok(svg.includes(`data-hand="hour" transform="rotate(${item.hour*30} 120 120)"`));
      assert.equal((svg.match(/<text /g)||[]).length,12);
      assert.match(svg,/M120 120V57/);assert.match(svg,/M120 120V79/);
    }else{
      assert.deepEqual([...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m=>m[1]),[`${item.hour}:00`]);
    }
  }
});
test('Clock Match journey totals 200 XP with a smaller Sparky reward',()=>{
  const xp=manifest.progression.xp;
  assert.equal(Object.values(xp.rewards).reduce((sum,reward)=>sum+reward.practice+reward.challenge,0),200);
  assert.ok(Object.values(xp.rewards).every(reward=>reward.practice>reward.challenge));
});
test('all difficulties produce playable 4, 6 and 8 card boards in both modes',()=>{
  for(const group of manifest.play.difficultyGroups){
    const round=manifest.rounds.find(r=>r.id===group.rounds[0]);
    const count=LEVELS[group.id].pairs;
    const cards=cardsFor({...round,pairs:round.pairs.slice(0,count)});
    assert.equal(cards.length,count*2);
    for(const mode of ['practice','challenge']){
      const board=new MatchBoard(cards,{shuffled:false,mode});
      for(let i=0;i<cards.length;i+=2){
        board.reveal(i,board.actor);board.reveal(i+1,board.actor);board.resolve();board.advance();
      }
      assert.equal(board.phase,'complete');assert.equal(board.matched.size,count);
    }
  }
});
