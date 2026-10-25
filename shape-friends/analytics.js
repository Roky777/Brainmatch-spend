// PW level-wise contract from BrainMatch-main/js-analytics-bridge.
// Never send personal data, and never let telemetry block gameplay.
export const ANALYTICS_QUEUE_KEY='ignite_pending_sessions_jsplugin';
export const ANALYTICS_HISTORY_KEY='brainmatch:analytics-delivery:v1';
export const REPORTING_VERSION=4;
const copy=value=>JSON.parse(JSON.stringify(value));
const clock=()=>globalThis.performance?.now?.()??Date.now();
function readQueue(){try{const value=JSON.parse(globalThis.localStorage?.getItem(ANALYTICS_QUEUE_KEY)||'[]');return Array.isArray(value)?value.filter(item=>item&&typeof item.gameId==='string'&&(typeof item.runId==='string'||typeof item.name==='string')):[];}catch{return [];}}
function storeQueue(queue){try{
  // Never evict an unsent positive XP award to make room for zero-XP replays.
  const keep=queue.filter((item,index)=>Number(item.xpEarned)>0||index>=queue.length-100);
  if(keep.length)globalThis.localStorage?.setItem(ANALYTICS_QUEUE_KEY,JSON.stringify(keep));else globalThis.localStorage?.removeItem(ANALYTICS_QUEUE_KEY);
  return Boolean(globalThis.localStorage);
}catch{return false;}}
const reportKey=payload=>JSON.stringify([payload.gameId,payload.runId||payload.name,payload.level?.levelId]);
function archive(payload){try{
  const old=JSON.parse(globalThis.localStorage?.getItem(ANALYTICS_HISTORY_KEY)||'[]');
  const entries=Array.isArray(old)?old:[];
  const key=reportKey(payload);
  globalThis.localStorage?.setItem(ANALYTICS_HISTORY_KEY,JSON.stringify([...entries.filter(entry=>reportKey(entry.payload)!==key),{payload,status:'bridge-accepted',acceptedAt:new Date().toISOString()}].slice(-100)));
}catch{}}
async function bridgeResult(call){
  let timer;
  try{return (await Promise.race([Promise.resolve().then(call),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),2500);})]))!==false;}
  finally{clearTimeout(timer);}
}
export async function deliver(payload){
  if(typeof window==='undefined')return false;
  // Queue ownership stays local; never deliver one child's report in another
  // child's WebView session, and never send this private marker to the host.
  if(payload._brainmatchOwner&&window.userInfo?.UserID!==payload._brainmatchOwner)return false;
  const {_brainmatchOwner,...hostPayload}=payload;
  payload=hostPayload;
  // Prefer one bridge: delivering through every bridge duplicates sessions.
  try{if(typeof window.myJsAnalytics?.trackGameSession==='function')return await bridgeResult(()=>window.myJsAnalytics.trackGameSession(payload));}catch{return false;}
  try{if(typeof window.ReactNativeWebView?.postMessage==='function')return await bridgeResult(()=>window.ReactNativeWebView.postMessage(JSON.stringify(payload)));}catch{return false;}
  try{if(window.parent&&window.parent!==window){window.parent.postMessage(payload,window.__GodotAnalyticsParentOrigin||'*');return true;}}catch{}
  return false;
}
let flushing=null,retryTimer=null,retryDelay=1000;
function scheduleRetry(){
  if(retryTimer||typeof window==='undefined'||typeof window.setTimeout!=='function'||!readQueue().length)return;
  retryTimer=window.setTimeout(()=>{retryTimer=null;void flushPending();},retryDelay);
  retryDelay=Math.min(30000,retryDelay*2);
}
export function flushPending(){
  if(flushing)return flushing;
  flushing=(async()=>{
    const sent=new Set();
    for(const payload of readQueue())if(await deliver(payload)){sent.add(reportKey(payload));archive(payload);}
    // Read again: a board may complete while an async bridge is responding.
    storeQueue(readQueue().filter(payload=>!sent.has(reportKey(payload))));
  })().finally(()=>{
    flushing=null;
    if(readQueue().length)scheduleRetry();
    else{if(retryTimer&&typeof window!=='undefined')window.clearTimeout?.(retryTimer);retryTimer=null;retryDelay=1000;}
  });
  return flushing;
}
let installed=false;
function install(){
  if(installed||typeof window==='undefined')return;installed=true;
  window.addEventListener('online',flushPending);
  window.addEventListener('load',flushPending,{once:true});
  window.addEventListener('pageshow',flushPending);
  globalThis.document?.addEventListener('visibilitychange',()=>{if(!document.hidden)void flushPending();});
  window.addEventListener('message',event=>{
    if(event.source!==window.parent)return;
    try{const data=typeof event.data==='string'?JSON.parse(event.data):event.data;
      if(data?.type==='ANALYTICS_CONFIG'&&data.parentOrigin===event.origin){window.__GodotAnalyticsParentOrigin=event.origin;flushPending();}
    }catch{}
  });
  window.setTimeout(flushPending,2000);
}
export function createGameAnalytics(gameId,{legacyGameIds=[],ownerId=null}={}){
  const ids=new Set([gameId,...legacyGameIds]);
  // Discard only these games' old pending XP, before any delivery listener runs.
  storeQueue(readQueue().filter(payload=>!ids.has(payload.gameId)||payload.reportingVersion===REPORTING_VERSION));
  try{
    const history=JSON.parse(globalThis.localStorage?.getItem(ANALYTICS_HISTORY_KEY)||'[]');
    if(Array.isArray(history))globalThis.localStorage?.setItem(ANALYTICS_HISTORY_KEY,JSON.stringify(history.filter(entry=>!ids.has(entry?.payload?.gameId)||entry?.payload?.reportingVersion===REPORTING_VERSION)));
  }catch{}
  const newRun=()=>({gameId,runId:globalThis.crypto?.randomUUID?.()||`${gameId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,levels:[]});
  let campaign=newRun();
  install();let state=null,last=clock(),paused=false;
  const tick=()=>{const next=clock();if(state&&!paused)state.elapsedMs+=Math.max(0,next-last);last=next;};
  return {
    resetRun(){campaign=newRun();state=null;},
    start({levelNumber,roundId,world,mode,difficulty,activityId,curriculumLevel,highestLevelPlayed},restored=null){
      const canResume=restored&&restored.gameId===gameId&&restored.reportingVersion===REPORTING_VERSION&&typeof restored.runId==='string'&&!restored.submitted&&Array.isArray(restored.tasks)&&Number.isFinite(restored.elapsedMs)&&Number.isFinite(restored.taskElapsedMs)&&restored.tasks.every(task=>typeof task.successful==='boolean'&&Number.isFinite(task.timeTaken));
      if(canResume)campaign={gameId,runId:restored.runId,levels:[]};
      else if(levelNumber===1||campaign.levels.some(level=>level.levelNumber===levelNumber))campaign=newRun();
      state=canResume
        ? copy(restored)
        : {gameId,levelNumber,roundId,world,mode,difficulty,tasks:[],elapsedMs:0,taskElapsedMs:0,submitted:false};
      state.runId=campaign.runId;state.reportingVersion=REPORTING_VERSION;
      state.highestLevelPlayed=Math.max(Number.isInteger(highestLevelPlayed)?highestLevelPlayed:1,state.highestLevelPlayed||1);
      // Difficulty/mode describe the activity; levelNumber advances per board.
      if(activityId){state.activityId=activityId;state.levelNumber=levelNumber;state.curriculumLevel=curriculumLevel;}
      last=clock();paused=false;
    },
    pause(value){tick();paused=value;},
    snapshot(){tick();return state?copy(state):null;},
    recordTask({items,match,correctChoice}){
      if(!state||state.submitted)return;tick();
      state.tasks.push({taskId:`task_${state.tasks.length+1}`,question:`Match ${items[0]}`,options:JSON.stringify(items),correctChoice:String(correctChoice),choiceMade:String(items[1]),successful:Boolean(match),timeTaken:Math.max(0,Math.round(state.elapsedMs-state.taskElapsedMs)),xpEarned:0});
      state.taskElapsedMs=state.elapsedMs;
    },
    complete({xpEarned,totalXP,score,pairCount}){
      if(!state||state.submitted)return null;tick();state.submitted=true;
      const tasks=copy(state.tasks),successful=tasks.filter(task=>task.successful);
      const xp=Math.max(0,Math.trunc(xpEarned||0));
      if(successful.length)successful.forEach((task,index)=>task.xpEarned=Math.floor(xp*(index+1)/successful.length)-Math.floor(xp*index/successful.length));
      else if(xp)tasks.push({taskId:'completion',question:'Complete the board',options:'[]',correctChoice:'complete',choiceMade:'complete',successful:true,timeTaken:0,xpEarned:xp});
      const activityId=state.activityId||`${state.difficulty}:${state.mode}`;
      const level={levelId:String(state.levelNumber),levelNumber:state.levelNumber,completed:true,successful:true,timeTaken:Math.round(state.elapsedMs),timeDirection:false,xpEarned:xp,score, pairCount,tasks};
      // A repeated completion callback must not submit the same level twice.
      if(campaign.levels.some(previous=>previous.levelId===level.levelId))return null;
      campaign.levels.push(copy(level));
      const accuracy=state.tasks.length?successful.length/state.tasks.length:0;
      const journeyXpTotal=Math.max(0,Math.min(200,Math.trunc(totalXP||0)));
      const fields={level:state.levelNumber,activity_id:activityId,xp_rule_version:4,curriculum_level:state.curriculumLevel||state.levelNumber,stars:accuracy>=.9?3:accuracy>=.7?2:1,round_id:state.roundId,world:state.world,mode:state.mode,difficulty:state.difficulty,attempts:state.tasks.length,accuracy,score,xp_earned:xp,journey_xp_total:journeyXpTotal,object_count:pairCount,campaign_xp_cap:200};
      const levels=copy(campaign.levels).sort((a,b)=>a.levelNumber-b.levelNumber);
      const payload={gameId,name:state.runId,runId:state.runId,activityId:fields.activity_id,highestLevelPlayed:Math.max(state.highestLevelPlayed,...levels.map(level=>level.levelNumber)),level,xpEarned:xp,xpEarnedTotal:xp,journeyXpTotal,campaignXpCap:200,reportingVersion:REPORTING_VERSION,rawData:Object.entries(fields).map(([key,value])=>({key,value:String(value)})),diagnostics:{levels:[level]},timestamp:new Date().toISOString()};
      // Persist BEFORE touching the host bridge. Keep the original run ID when
      // retrying; never turn the saved cumulative total into another XP award.
      const queue=readQueue();
      const pending=ownerId?{...payload,_brainmatchOwner:ownerId}:payload;
      const stored=queue.some(item=>reportKey(item)===reportKey(payload))||storeQueue([...queue,pending]);
      void Promise.resolve().then(()=>stored?flushPending():deliver(pending));
      return payload;
    },
  };
}
