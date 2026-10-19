import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameAnalytics,deliver,flushPending,ANALYTICS_QUEUE_KEY,ANALYTICS_HISTORY_KEY} from '../shape-friends/analytics.js';
import {xpActivityNumber,xpActivityKey,XP_WORLD_IDS,XP_ROUND_IDS,XP_REWARDS,awardXP} from '../shape-friends/xp.js';
test('PW payload preserves schema, actual XP, task choices and resume run ID',async()=>{
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
  await flushPending();
});
test('PW delivery uses one host bridge, queues offline and retries without blocking play',async()=>{
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
    await flushPending();assert.equal(sent.length,1);assert.equal(sent[0].runId,payload.runId);assert.equal(values.has(ANALYTICS_QUEUE_KEY),false);
    globalThis.window={ReactNativeWebView:{postMessage:data=>sent.push(JSON.parse(data))}};
    assert.equal(await deliver(payload),true);assert.equal(sent.length,2);
  }finally{globalThis.window=previousWindow;globalThis.localStorage=previousStorage;}
});
function hostFixture(bridge){
  const previousWindow=globalThis.window,previousStorage=globalThis.localStorage;
  const values=new Map();
  globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  globalThis.window={addEventListener(){},setTimeout(){},myJsAnalytics:{trackGameSession:bridge}};
  return {values,restore(){globalThis.window=previousWindow;globalThis.localStorage=previousStorage;}};
}
const context=(activity)=>({levelNumber:xpActivityNumber(activity),activityId:xpActivityKey(activity),curriculumLevel:1,roundId:activity.roundId||'1',world:activity.worldId||'dream',mode:activity.mode,difficulty:activity.difficulty});
test('six XP activities have unique IDs, independent of theme or board',()=>{
  const ids=[];
  for(const difficulty of Object.keys(XP_REWARDS))for(const mode of ['practice','challenge'])ids.push(xpActivityNumber({difficulty,mode}));
  assert.equal(new Set(ids).size,ids.length);assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:ids.length},(_,i)=>i+1));
});
test('cross-world reports sum to the same cumulative XP as the game without reporting lifetime XP as a new award',async()=>{
  const received=[];const f=hostFixture(payload=>received.push(payload));
  try{
    const save={xp:0,xpClaims:[]};
    for(const difficulty of Object.keys(XP_REWARDS))for(const mode of ['practice','challenge']){
      const activity={difficulty,worldId:'dream',roundId:XP_ROUND_IDS[0],mode};
      const award=awardXP(save,activity),analytics=createGameAnalytics('shape-friends');
      analytics.start(context(activity));analytics.complete({xpEarned:award.earned,totalXP:award.total,score:2,pairCount:2});
      await flushPending();
    }
    assert.equal(new Set(received.map(p=>p.level.levelId)).size,6);
    assert.equal(received.reduce((sum,p)=>sum+p.xpEarned,0),save.xp);
    assert.equal(received.at(-1).journeyXpTotal,save.xp);
    assert.ok(received.every(p=>p.xpEarnedTotal===p.xpEarned));
    const replay={worldId:'neon',roundId:XP_ROUND_IDS[0],difficulty:'gentle',mode:'practice'};
    const award=awardXP(save,replay),analytics=createGameAnalytics('shape-friends');
    analytics.start(context(replay));analytics.complete({xpEarned:award.earned,totalXP:award.total,score:2,pairCount:2});await flushPending();
    assert.equal(received.at(-1).xpEarned,0);assert.equal(received.at(-1).journeyXpTotal,save.xp);
  }finally{f.restore();}
});
test('reports are durable before the bridge call and false or rejected calls stay queued',async()=>{
  let reject=false;const f=hostFixture(()=>{
    assert.equal(JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY)).length,1);
    if(reject)return Promise.reject(Error('offline'));return false;
  });
  try{
    const analytics=createGameAnalytics('test');analytics.start({levelNumber:1,roundId:'1',world:'dream',mode:'practice'});
    const payload=analytics.complete({xpEarned:10,totalXP:44,score:2,pairCount:2});
    await flushPending();assert.equal(JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY))[0].runId,payload.runId);
    reject=true;await flushPending();assert.equal(JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY)).length,1);
    globalThis.window.myJsAnalytics.trackGameSession=async()=>true;
    await flushPending();assert.equal(f.values.has(ANALYTICS_QUEUE_KEY),false);
    const history=JSON.parse(f.values.get(ANALYTICS_HISTORY_KEY));assert.equal(history[0].payload.runId,payload.runId);assert.equal(history[0].status,'bridge-accepted');
  }finally{f.restore();}
});
test('concurrent flushes do not send the same report twice or lose a newly queued award',async()=>{
  let release;const sent=[];const f=hostFixture(payload=>{sent.push(payload);return new Promise(r=>release=r);});
  try{
    const first=createGameAnalytics('test');first.start({levelNumber:1,roundId:'1',world:'dream',mode:'practice'});first.complete({xpEarned:10,totalXP:10});
    const flushing=flushPending();await Promise.resolve();await Promise.resolve();
    assert.equal(flushPending(),flushing);
    const second=createGameAnalytics('test');second.start({levelNumber:2,roundId:'1',world:'dream',mode:'challenge'});second.complete({xpEarned:6,totalXP:16});
    release(true);await flushing;
    assert.equal(sent.length,1);assert.equal(JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY)).length,1);
    globalThis.window.myJsAnalytics.trackGameSession=payload=>{sent.push(payload);return true;};
    await flushPending();assert.equal(sent.length,2);assert.equal(f.values.has(ANALYTICS_QUEUE_KEY),false);
  }finally{f.restore();}
});
test('resuming a legacy run upgrades its activity number but preserves run identity',async()=>{
  const analytics=createGameAnalytics('test');analytics.start({levelNumber:1,roundId:XP_ROUND_IDS[0],world:'neon',mode:'challenge'});
  const saved=analytics.snapshot(),activity={worldId:'neon',roundId:XP_ROUND_IDS[0],difficulty:'clever',mode:'challenge'};
  analytics.start(context(activity),saved);
  assert.equal(analytics.snapshot().runId,saved.runId);assert.equal(analytics.snapshot().levelNumber,xpActivityNumber(activity));
  analytics.complete({xpEarned:6,totalXP:44});await flushPending();
});
test('queued legacy reports retain their identity and award amounts during the XP rule change',async()=>{
  const f=hostFixture(()=>false),activity={worldId:'seasons',roundId:XP_ROUND_IDS[0],mode:'practice'};
  try{
    const old={gameId:'test',runId:'old-run',xpEarned:10,xpEarnedTotal:10,level:{levelId:'1',levelNumber:1,xpEarned:10},rawData:[{key:'world',value:activity.worldId},{key:'round_id',value:activity.roundId},{key:'mode',value:activity.mode},{key:'journey_xp_total',value:'44'}]};
    f.values.set(ANALYTICS_QUEUE_KEY,JSON.stringify([old,{...old,gameId:'another-game',runId:'foreign'},null]));
    createGameAnalytics('test',{activityNumber:xpActivityNumber});
    const queue=JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY));
    assert.equal(queue[0].runId,'old-run');assert.equal(queue[0].level.levelNumber,1);
    assert.equal(queue[0].xpEarned,10);assert.deepEqual(queue[0],old);
    assert.equal(queue[1].level.levelNumber,1);
    globalThis.window.myJsAnalytics.trackGameSession=()=>true;await flushPending();
  }finally{f.restore();}
});
test('a bridge injected after startup receives queued XP on the scheduled retry',async()=>{
  const sent=[],callbacks=[];const f=hostFixture(undefined);
  globalThis.window.setTimeout=callback=>{callbacks.push(callback);return callbacks.length;};
  globalThis.window.clearTimeout=()=>{};
  try{
    const analytics=createGameAnalytics('late-host');analytics.start({levelNumber:1,roundId:'1',world:'dream',mode:'practice'});
    analytics.complete({xpEarned:10,totalXP:44});await flushPending();
    assert.ok(callbacks.length);assert.equal(sent.length,0);
    globalThis.window.myJsAnalytics.trackGameSession=payload=>{sent.push(payload);return true;};
    callbacks.shift()();await flushPending();
    assert.equal(sent.length,1);assert.equal(sent[0].journeyXpTotal,44);assert.equal(f.values.has(ANALYTICS_QUEUE_KEY),false);
  }finally{f.restore();}
});
test('positive XP reports are not evicted by the legacy 100-session limit',async()=>{
  const f=hostFixture(()=>false);
  try{
    f.values.set(ANALYTICS_QUEUE_KEY,JSON.stringify(Array.from({length:101},(_,i)=>({gameId:'old',runId:`old-${i}`,level:{levelId:'1'},xpEarned:1}))));
    const analytics=createGameAnalytics('test');analytics.start({levelNumber:1,roundId:'1',world:'dream',mode:'practice'});
    analytics.complete({xpEarned:10,totalXP:44});await flushPending();
    assert.equal(JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY)).length,102);
    globalThis.window.myJsAnalytics.trackGameSession=()=>true;await flushPending();
  }finally{f.restore();}
});
test('a host promise that never settles cannot permanently block reporting',async()=>{
  const f=hostFixture(()=>new Promise(()=>{}));
  try{assert.equal(await deliver({gameId:'test',runId:'stalled',level:{levelId:'1'},xpEarned:10}),false);}
  finally{f.restore();}
});
