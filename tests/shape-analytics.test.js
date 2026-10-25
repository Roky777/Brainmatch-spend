import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGameAnalytics,deliver,flushPending,ANALYTICS_QUEUE_KEY,ANALYTICS_HISTORY_KEY} from '../shape-friends/analytics.js';
import {xpActivityNumber,xpActivityKey,XP_WORLD_IDS,XP_ROUND_IDS,XP_REWARDS,awardXP} from '../shape-friends/xp.js';
test('PW payload preserves schema, actual XP, task choices and resume run ID',async()=>{
  const f=hostFixture(()=>true);
  try{
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
  }finally{f.restore();}
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
test('level and task payload fields match the provided sorter analytics contract',async t=>{
  let source;try{source=await readFile(new URL('../Mini-s-Market-Sorter/src/core/analytics.js',import.meta.url),'utf8');}
  catch(error){if(error.code==='ENOENT'){t.skip('Reference folder is not shipped in standalone game exports');return;}throw error;}
  const reference=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const f=hostFixture(()=>true);
  globalThis.window.dispatchEvent=()=>{};
  try{
    const sorter=reference.createGameAnalytics({gameId:'reference',levelCount:6,levels:[{goal:1}]});
    sorter.startLevel(1);sorter.recordTask({itemName:'frog',correctChoice:'HOP',choiceMade:'HOP',successful:true});
    const expected=sorter.completeLevel({levelNumber:1,stars:3,attempts:1,firstTryCorrect:1,score:1});
    const game=createGameAnalytics('contract-game');game.start({levelNumber:1,difficulty:'gentle',mode:'practice'});
    game.recordTask({items:['frog','HOP'],correctChoice:'HOP',match:true});
    const actual=game.complete({xpEarned:expected.xpEarned,totalXP:expected.xpEarned,score:1,pairCount:1});
    for(const key of Object.keys(expected))assert.equal(typeof actual[key],typeof expected[key],key);
    for(const key of Object.keys(expected.level))assert.equal(typeof actual.level[key],typeof expected.level[key],`level.${key}`);
    for(const key of Object.keys(expected.level.tasks[0]))assert.equal(typeof actual.level.tasks[0][key],typeof expected.level.tasks[0][key],`task.${key}`);
    assert.equal(actual.level.levelId,expected.level.levelId);
    assert.equal(actual.xpEarnedTotal,actual.level.tasks.reduce((sum,task)=>sum+task.xpEarned,0));
    assert.deepEqual(actual.diagnostics.levels,[actual.level]);
    await flushPending();
  }finally{f.restore();}
});
const context=(activity)=>({levelNumber:xpActivityNumber(activity),activityId:xpActivityKey(activity),curriculumLevel:1,roundId:activity.roundId||'1',world:activity.worldId||'dream',mode:activity.mode,difficulty:activity.difficulty});
test('six XP activities have unique IDs, independent of theme or board',()=>{
  const ids=[];
  for(const difficulty of Object.keys(XP_REWARDS))for(const mode of ['practice','challenge'])ids.push(xpActivityNumber({difficulty,mode}));
  assert.equal(new Set(ids).size,ids.length);assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:ids.length},(_,i)=>i+1));
});
test('cross-world reports sum to the same cumulative XP as the game without reporting lifetime XP as a new award',async()=>{
  const received=[];const f=hostFixture(payload=>received.push(payload));
  try{
    const save={xp:0,xpClaims:[]},analytics=createGameAnalytics('shape-friends');
    for(let i=0;i<16;i++){
      const activity={difficulty:'gentle',worldId:i%2?'dream':'neon',roundId:XP_ROUND_IDS[0],mode:i%2?'challenge':'practice'};
      analytics.start({...context(activity),levelNumber:i+2});
      const report=analytics.snapshot();
      const award=awardXP(save,{...activity,completionId:`${report.runId}:${report.levelNumber}`});
      analytics.complete({xpEarned:award.earned,totalXP:award.total,score:2,pairCount:2});
      assert.equal(analytics.complete({xpEarned:award.earned}),null);
      await flushPending();
    }
    assert.equal(new Set(received.map(p=>p.level.levelId)).size,16);
    assert.equal(new Set(received.map(p=>p.runId)).size,1);
    assert.deepEqual(received.map(p=>p.level.levelNumber),Array.from({length:16},(_,i)=>i+2));
    assert.ok(received.every(p=>p.name===p.runId&&p.diagnostics.levels.length===1&&p.level.score===2));
    assert.equal(received.reduce((sum,p)=>sum+p.xpEarned,0),save.xp);
    // Reproduce a host that only credits newly completed progression levels.
    let backendHighest=1,backendXP=0;
    for(const payload of received){
      if(payload.level.levelNumber>backendHighest){backendXP+=payload.xpEarned;backendHighest=payload.highestLevelPlayed;}
    }
    assert.equal(backendXP,200);assert.equal(backendHighest,17);
    assert.equal(received.at(-1).journeyXpTotal,save.xp);
    assert.ok(received.every(p=>p.xpEarnedTotal===p.xpEarned));
    const replay={worldId:'neon',roundId:XP_ROUND_IDS[0],difficulty:'gentle',mode:'practice'};
    analytics.resetRun();analytics.start({...context(replay),levelNumber:18});
    const report=analytics.snapshot(),award=awardXP(save,{...replay,completionId:`${report.runId}:18`});
    const replayPayload=analytics.complete({xpEarned:award.earned,totalXP:award.total,score:2,pairCount:2});await flushPending();
    assert.equal(received.length,17);assert.equal(replayPayload.xpEarned,0);assert.notEqual(replayPayload.runId,received[0].runId);
    assert.equal(received.at(-1).journeyXpTotal,save.xp);assert.equal(received.reduce((sum,p)=>sum+p.xpEarned,0),200);
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
test('XP reset removes only this game and its alias old reports, preserving current and unrelated reports',async()=>{
  const f=hostFixture(()=>false),activity={worldId:'seasons',roundId:XP_ROUND_IDS[0],mode:'practice'};
  try{
    const old={gameId:'test',runId:'old-run',xpEarned:10,xpEarnedTotal:10,level:{levelId:'1',levelNumber:1,xpEarned:10},rawData:[{key:'world',value:activity.worldId},{key:'round_id',value:activity.roundId},{key:'mode',value:activity.mode},{key:'journey_xp_total',value:'44'}]};
    const current={...old,runId:'current',reportingVersion:4};
    f.values.set(ANALYTICS_QUEUE_KEY,JSON.stringify([old,{...old,gameId:'alias'},current,{...old,gameId:'another-game',runId:'foreign'},null]));
    f.values.set(ANALYTICS_HISTORY_KEY,JSON.stringify([{payload:old},{payload:current}]));
    createGameAnalytics('test',{legacyGameIds:['alias']});
    const queue=JSON.parse(f.values.get(ANALYTICS_QUEUE_KEY));
    assert.deepEqual(queue,[current,{...old,gameId:'another-game',runId:'foreign'}]);
    assert.deepEqual(JSON.parse(f.values.get(ANALYTICS_HISTORY_KEY)),[{payload:current}]);
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
