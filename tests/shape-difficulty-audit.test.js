import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LEVELS} from '../shape-friends/play-options.js';
import {MatchBoard} from '../shape-friends/engine.js';
const games=['shape-friends','number-friends','money-match','body-sound-match','animal-friends','animal-action-match','clock-match','shadow-match','plant-match','how-things-work'];
test('all ten games use 4, 6 and 8 cards for every difficulty and mode',async()=>{
  for(const game of games){
    let data;try{data=JSON.parse(await readFile(new URL(`../${game}/game-content.json`,import.meta.url),'utf8'));}catch(error){if(error.code==='ENOENT')continue;throw error;}
    for(const [difficulty,level] of Object.entries(LEVELS)){
      const group=data.play?.difficultyGroups?.find(group=>group.id===difficulty);
      const rounds=group?data.rounds.filter(round=>group.rounds.includes(round.id)):data.rounds;
      for(const round of rounds)for(const mode of ['practice','challenge']){
        const cards=round.pairs.slice(0,level.pairs).flatMap(([pairId,a,b])=>[a,b].map((item,index)=>({id:`${pairId}-${index}`,pairId,item})));
        const board=new MatchBoard(cards,{mode});
        assert.equal(board.size,{gentle:4,growing:6,clever:8}[difficulty],`${game}/${round.id}/${difficulty}/${mode}`);
      }
    }
  }
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/Pick a level|data-round-choice|Next level/);
  assert.match(app,/const level = LEVELS\[options.level\]/);
});
