import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchBoard} from '../shape-friends/engine.js';
import {cardsFor,PACK} from '../shape-friends/content.js';
import {emptySave,sanitizeSave,readSave,writeSave,SAVE_KEY} from '../shape-friends/save.js';
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
