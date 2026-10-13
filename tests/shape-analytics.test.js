import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameAnalytics,deliver,flushPending,ANALYTICS_QUEUE_KEY} from '../shape-friends/analytics.js';
test('PW payload preserves schema, actual XP, task choices and resume run ID',()=>{
  const analytics=createGameAnalytics('number-friends');
  analytics.start({levelNumber:2,roundId:'2',world:'dream',mode:'practice',difficulty:'gentle'});
  analytics.recordTask({items:['3','4 dots'],correctChoice:'3 dots',match:false});
  const saved=analytics.snapshot();
  const resumed=createGameAnalytics('number-friends');resumed.start({},saved);
  resumed.recordTask({items:['3','3 dots'],correctChoice:'3 dots',match:true});
  const payload=resumed.complete({xpEarned:10,totalXP:40,score:2,pairCount:2});
  assert.equal(payload.runId,saved.runId);assert.equal(payload.gameId,'number-friends');
  assert.equal(payload.level.tasks[0].correctChoice,'3 dots');assert.equal(payload.level.tasks[0].choiceMade,'4 dots');
  assert.equal(payload.level.tasks.reduce((sum,task)=>sum+task.xpEarned,0),10);
  assert.equal(payload.xpEarned,10);assert.equal(payload.diagnostics.levels[0],payload.level);
  assert.equal(resumed.complete({xpEarned:10}),null);
});
test('PW delivery uses one host bridge, queues offline and retries without blocking play',()=>{
  const previousWindow=globalThis.window,previousStorage=globalThis.localStorage;
  const values=new Map(),sent=[];
  globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  globalThis.window={addEventListener(){},setTimeout(){}};
  try{
    const analytics=createGameAnalytics('test-game');
    analytics.start({levelNumber:1,roundId:'1',world:'dream',mode:'challenge',difficulty:'gentle'});
    const payload=analytics.complete({xpEarned:0,totalXP:0,score:0,pairCount:2});
    assert.equal(JSON.parse(values.get(ANALYTICS_QUEUE_KEY)).length,1);
    globalThis.window={myJsAnalytics:{trackGameSession:data=>sent.push(data)},ReactNativeWebView:{postMessage(){throw Error('must not duplicate');}}};
    flushPending();assert.equal(sent.length,1);assert.equal(sent[0].runId,payload.runId);assert.equal(values.has(ANALYTICS_QUEUE_KEY),false);
    globalThis.window={ReactNativeWebView:{postMessage:data=>sent.push(JSON.parse(data))}};
    assert.equal(deliver(payload),true);assert.equal(sent.length,2);
  }finally{globalThis.window=previousWindow;globalThis.localStorage=previousStorage;}
});
