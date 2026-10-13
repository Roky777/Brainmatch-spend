// PW host contract adapted from Mini-s-Market-Sorter/src/core/analytics.js.
// Never send personal data, and never let telemetry block gameplay.
export const ANALYTICS_QUEUE_KEY='ignite_pending_sessions_jsplugin';
const copy=value=>JSON.parse(JSON.stringify(value));
const clock=()=>globalThis.performance?.now?.()??Date.now();
function readQueue(){try{const value=JSON.parse(globalThis.localStorage?.getItem(ANALYTICS_QUEUE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
function storeQueue(queue){try{if(queue.length)globalThis.localStorage?.setItem(ANALYTICS_QUEUE_KEY,JSON.stringify(queue.slice(-100)));else globalThis.localStorage?.removeItem(ANALYTICS_QUEUE_KEY);}catch{}}
export function deliver(payload){
  if(typeof window==='undefined')return false;
  // Prefer one bridge: delivering through every bridge duplicates sessions.
  try{if(typeof window.myJsAnalytics?.trackGameSession==='function'){window.myJsAnalytics.trackGameSession(payload);return true;}}catch{}
  try{if(typeof window.ReactNativeWebView?.postMessage==='function'){window.ReactNativeWebView.postMessage(JSON.stringify(payload));return true;}}catch{}
  try{if(window.parent&&window.parent!==window){window.parent.postMessage(payload,window.__GodotAnalyticsParentOrigin||'*');return true;}}catch{}
  return false;
}
export function flushPending(){storeQueue(readQueue().filter(payload=>!deliver(payload)));}
let installed=false;
function install(){
  if(installed||typeof window==='undefined')return;installed=true;
  window.addEventListener('online',flushPending);
  window.addEventListener('load',flushPending,{once:true});
  window.addEventListener('message',event=>{
    if(event.source!==window.parent)return;
    try{const data=typeof event.data==='string'?JSON.parse(event.data):event.data;
      if(data?.type==='ANALYTICS_CONFIG'&&data.parentOrigin===event.origin){window.__GodotAnalyticsParentOrigin=event.origin;flushPending();}
    }catch{}
  });
  window.setTimeout(flushPending,2000);
}
export function createGameAnalytics(gameId){
  install();let state=null,last=clock(),paused=false;
  const tick=()=>{const next=clock();if(state&&!paused)state.elapsedMs+=Math.max(0,next-last);last=next;};
  return {
    start({levelNumber,roundId,world,mode,difficulty},restored=null){
      state=restored&&restored.gameId===gameId&&typeof restored.runId==='string'&&Array.isArray(restored.tasks)&&Number.isFinite(restored.elapsedMs)&&Number.isFinite(restored.taskElapsedMs)&&restored.tasks.every(task=>typeof task.successful==='boolean'&&Number.isFinite(task.timeTaken))
        ? copy(restored)
        : {gameId,runId:globalThis.crypto?.randomUUID?.()||`${gameId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,levelNumber,roundId,world,mode,difficulty,tasks:[],elapsedMs:0,taskElapsedMs:0,submitted:false};
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
      const level={levelId:String(state.levelNumber),levelNumber:state.levelNumber,completed:true,successful:true,timeTaken:Math.round(state.elapsedMs),timeDirection:false,xpEarned:xp,tasks};
      const accuracy=state.tasks.length?successful.length/state.tasks.length:0;
      const fields={level:state.levelNumber,stars:accuracy>=.9?3:accuracy>=.7?2:1,round_id:state.roundId,world:state.world,mode:state.mode,difficulty:state.difficulty,attempts:state.tasks.length,accuracy,score,xp_earned:xp,journey_xp_total:totalXP,object_count:pairCount,campaign_xp_cap:200};
      const payload={gameId,name:state.runId,runId:state.runId,highestLevelPlayed:state.levelNumber,level,xpEarned:xp,xpEarnedTotal:xp,rawData:Object.entries(fields).map(([key,value])=>({key,value:String(value)})),diagnostics:{levels:[level]},timestamp:new Date().toISOString()};
      if(!deliver(payload)){const queue=readQueue();if(!queue.some(item=>item.runId===payload.runId))storeQueue([...queue,payload]);}
      return payload;
    },
  };
}
