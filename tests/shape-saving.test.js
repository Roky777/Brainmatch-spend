import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchBoard} from '../shape-friends/engine.js';
import {cardsFor,PACK,SEASON_PACK,NEON_PACK} from '../shape-friends/content.js';
import {emptySave,sanitizeSave,sanitizeSession,continuableSession,readSave,writeSave,SAVE_KEY} from '../shape-friends/save.js';
import {readFile} from 'node:fs/promises';
const deck=()=>cardsFor({pairs:PACK.rounds[0].pairs.slice(0,2)});
test('resume preserves card order, scores, matches and a child first pick',()=>{
  const board=new MatchBoard(deck(),{shuffled:false,mode:'practice'});
  board.reveal(0,'child');board.reveal(1,'child');board.resolve();board.advance();board.reveal(2,'child');
  const restored=MatchBoard.restore(JSON.parse(JSON.stringify(board.exportState())));
  assert.deepEqual(restored.exportState(),board.exportState());
  restored.reveal(3,'child');restored.resolve();restored.advance();
  assert.equal(restored.phase,'complete');assert.equal(restored.scores.child,2);
});
test('mid-transition restore commits scores once and hands a missed turn to Sparky',()=>{
  const board=new MatchBoard(deck(),{shuffled:false});board.reveal(0,'child');board.reveal(2,'child');board.resolve();
  const restored=MatchBoard.restore(board.exportState());
  assert.equal(restored.actor,'sparky');assert.equal(restored.attempts,1);assert.deepEqual(restored.open,[]);
  restored.reveal(0,'sparky');
  assert.deepEqual(restored.exportState().open,[],'interrupted companion picks restart safely');
});
test('localStorage round trip preserves a valid board and rejects foreign/corrupt decks',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const save=emptySave(),board=new MatchBoard(deck(),{shuffled:false,mode:'practice'});
  save.session={world:'dream',roundId:PACK.rounds[0].id,difficulty:'gentle',mode:'practice',board:board.exportState(),memory:[0],guideMemory:[0]};
  assert.equal(writeSave(save,storage),true);assert.ok(values.has(SAVE_KEY));
  assert.deepEqual(readSave(storage).session.board,board.exportState());
  save.session.board.cards[0].item='foreign-variant';assert.equal(sanitizeSave(save).session,null);
  assert.equal(writeSave(save,{setItem(){throw Error('quota');}}),false);
  assert.equal(readSave({getItem:()=>'{broken'}).session,null);
});
test('restore rejects invalid matched IDs, scores and open positions',()=>{
  const state=new MatchBoard(deck(),{shuffled:false}).exportState();
  assert.throws(()=>MatchBoard.restore({...state,matched:['unknown']}));
  assert.throws(()=>MatchBoard.restore({...state,open:[999]}));
  assert.throws(()=>MatchBoard.restore({...state,attempts:10}));
});
test('Continue is available only for a valid unfinished board in the current world',()=>{
  const save=emptySave(),board=new MatchBoard(deck(),{shuffled:false,mode:'practice'});
  assert.equal(continuableSession(save),null);
  save.session={world:'dream',roundId:PACK.rounds[0].id,difficulty:'gentle',mode:'practice',board:board.exportState()};
  assert.ok(continuableSession(save));assert.equal(continuableSession({...save,theme:'neon'}),null);
  for(const [a,b] of [[0,1],[2,3]]){board.reveal(a,'child');board.reveal(b,'child');board.resolve();board.advance();}
  save.session.board=board.exportState();assert.equal(continuableSession(save),null);
});
test('each world validates its own card pack when resuming',()=>{
  for(const [world,pack] of [['dream',PACK],['seasons',SEASON_PACK],['neon',NEON_PACK]]){
    const round=pack.rounds[0];
    const cards=round.pairs.slice(0,2).flatMap(([pairId,a,b])=>[a,b].map((item,i)=>({id:`${pairId}-${i}`,pairId,item})));
    const board=new MatchBoard(cards,{mode:'practice',shuffled:false});
    assert.ok(sanitizeSession({world,roundId:round.id,difficulty:'gentle',mode:'practice',board:board.exportState()}),world);
  }
});
test('startup shows home; restoring a board requires the Continue control',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  const startup=app.slice(app.lastIndexOf('applyTheme(); renderXP(); settingsUI(); showSetup();'));
  assert.doesNotMatch(startup,/await startRound|void sparkyTurn/);
  assert.match(app,/\$\('continue-game'\).addEventListener\('click',[\s\S]*?await startRound\(session.roundId,session\)/);
  const shell=await readFile(new URL('../shape-friends/game-shell.html',import.meta.url),'utf8');
  assert.match(shell,/id="continue-game"[^>]*hidden/);
});
