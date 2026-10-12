import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContentManifest,cardsFor} from '../shape-friends/content.js';
import {LEVELS} from '../shape-friends/play-options.js';
import {MatchBoard} from '../shape-friends/engine.js';
const base=new URL('../shadow-match/',import.meta.url);
const m=JSON.parse(await readFile(new URL('game-content.json',base)));
test('Shadow Match has object, hand-pose and mixed difficulty pools',()=>{
  assert.equal(validateContentManifest(m),true);
  assert.deepEqual(m.rounds.map(r=>r.pairs.length),[4,4,8]);
  assert.deepEqual(m.rounds[0].pairs.map(p=>p[0]),['cube','cone','cylinder','ball']);
  assert.deepEqual(m.rounds[1].pairs.map(p=>p[0]),['rabbit','dog','bird','deer']);
  for(const round of m.rounds){
    assert.equal(new Set(round.pairs.map(p=>p[0])).size,round.pairs.length);
    for(const [subject,a,b]of round.pairs){assert.equal(m.items[a].subject,subject);assert.equal(m.items[b].subject,subject);assert.equal(m.items[a].representation,'source');assert.equal(m.items[b].representation,'shadow');}
  }
});
test('cards are picture-only and hand silhouettes embed the exact source PNG',async()=>{
  for(const item of Object.values(m.items)){
    const data=await readFile(new URL(`assets/cards/${item.asset}`,base));
    if(item.asset.endsWith('.svg'))assert.doesNotMatch(data.toString(),/<text\b/);
    else assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    if(item.collection==='hands'&&item.representation==='shadow'){
      const png=await readFile(new URL(`assets/cards/${item.subject}.png`,base));
      assert.ok(data.toString().includes(png.toString('base64')));
      assert.match(data.toString(),/<feColorMatrix/);
    }
  }
});
test('all difficulties finish as 4, 6 and 8 card boards in both modes',()=>{
  for(const group of m.play.difficultyGroups){
    const round=m.rounds.find(r=>r.id===group.rounds[0]),count=LEVELS[group.id].pairs;
    const cards=cardsFor({...round,pairs:round.pairs.slice(0,count)});
    assert.equal(cards.length,count*2);
    for(const mode of ['practice','challenge']){
      const board=new MatchBoard(cards,{shuffled:false,mode});
      for(let i=0;i<cards.length;i+=2){board.reveal(i,board.actor);board.reveal(i+1,board.actor);board.resolve();board.advance();}
      assert.equal(board.phase,'complete');
    }
  }
});
test('shadow XP rewards total 200 and Practice earns more',()=>{
  const xp=m.progression.xp;
  assert.equal(3*3*(xp.rewards.practice+xp.rewards.challenge)+xp.completionBonus,200);
  assert.ok(xp.rewards.practice>xp.rewards.challenge);
});
