import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readHostContext,progressSaveKey,resolveProgress,difficultyForProgress} from '../shape-friends/host-progress.js';
import {readSave,writeSave,emptySave} from '../shape-friends/save.js';
import {createGameAnalytics,flushPending,ANALYTICS_QUEUE_KEY} from '../shape-friends/analytics.js';

test('WebView identity mapping validates injected progress without copying the player name',()=>{
  assert.deepEqual(readHostContext({UserID:'child',GameID:'catalog',Name:'not collected',highestLevelPlayed:4}),{userId:'child',gameId:'catalog',highestLevelPlayed:4});
  for(const value of [undefined,{}, {UserID:'child'}, {UserID:42,GameID:'catalog'}])assert.equal(readHostContext(value),null);
  for(const highestLevelPlayed of ['4',NaN,0,-1,1.5])assert.equal(readHostContext({UserID:'child',GameID:'catalog',highestLevelPlayed}).highestLevelPlayed,1);
  assert.equal(resolveProgress(5,3),5);assert.equal(resolveProgress(1,4),4);assert.equal(resolveProgress(100,1),6);
  assert.deepEqual([1,2,3,4,5,6].map(difficultyForProgress),['gentle','gentle','growing','growing','clever','clever']);
});
test('app user/game saves are isolated from each other and from anonymous progress',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const alice=progressSaveKey('shape-friends',{userId:'alice',gameId:'catalog'});
  const bob=progressSaveKey('shape-friends',{userId:'bob',gameId:'catalog'});
  const save=emptySave();save.highestLevelPlayed=4;writeSave(save,storage,alice);
  assert.equal(readSave(storage,alice).highestLevelPlayed,4);assert.equal(readSave(storage,bob).highestLevelPlayed,1);
  assert.notEqual(alice,progressSaveKey('shape-friends',{userId:'alice',gameId:'other'}));
  assert.equal(progressSaveKey('shape-friends',null),'brainmatch:shape-friends:v1');
});
test('new launches get fresh run IDs while retries keep the original run and owner',async()=>{
  const beforeWindow=globalThis.window,beforeStorage=globalThis.localStorage;
  const values=new Map(),sent=[];
  globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  globalThis.window={userInfo:{UserID:'alice'},addEventListener(){},setTimeout(){},myJsAnalytics:{trackGameSession:payload=>{sent.push(payload);return false;}}};
  try{
    const a=createGameAnalytics('catalog',{ownerId:'alice'});a.start({levelNumber:1});
    const original=a.complete({xpEarned:30,totalXP:30,score:2,pairCount:2});await flushPending();
    const b=createGameAnalytics('catalog',{ownerId:'alice'});b.start({levelNumber:2});assert.notEqual(b.snapshot().runId,original.runId);
    globalThis.window.userInfo.UserID='bob';const count=sent.length;await flushPending();assert.equal(sent.length,count);
    globalThis.window.userInfo.UserID='alice';globalThis.window.myJsAnalytics.trackGameSession=payload=>{sent.push(payload);return true;};
    await flushPending();assert.equal(sent.at(-1).runId,original.runId);assert.equal('_brainmatchOwner' in sent.at(-1),false);
    assert.equal(values.has(ANALYTICS_QUEUE_KEY),false);
    a.resetRun();a.start({levelNumber:2});assert.notEqual(a.snapshot().runId,original.runId);
  }finally{globalThis.window=beforeWindow;globalThis.localStorage=beforeStorage;}
});
test('payload passes the supplied BrainMatch AnalyticsManager level validator',async t=>{
  let source;try{source=await readFile(new URL('../BrainMatch-main/js-analytics-bridge/analytics-bridge.esm.js',import.meta.url),'utf8');}
  catch(error){if(error.code==='ENOENT'){t.skip('Reference folder is not shipped in standalone game exports');return;}throw error;}
  const {default:Manager}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const analytics=createGameAnalytics('catalog-game');analytics.start({levelNumber:3,highestLevelPlayed:5});
  analytics.recordTask({items:['frog','HOP'],correctChoice:'HOP',match:true});
  const payload=analytics.complete({xpEarned:40,totalXP:90,score:3,pairCount:3});
  assert.deepEqual(new Manager().validateLevelPayload(payload),{valid:true,errors:[]});
  assert.equal(payload.highestLevelPlayed,5);assert.equal(payload.xpEarnedTotal,40);
  assert.equal(analytics.complete({xpEarned:40}),null);await flushPending();
});
