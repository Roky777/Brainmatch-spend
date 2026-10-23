// One release-scoped reset, not localStorage.clear(): other games/apps may
// share this origin. New progress survives every subsequent launch.
export const DATA_RESET_VERSION='fresh-start-2026-10';
const variants=new Set(['shape-friends','number-friends','money-match','body-sound-match','animal-action-match','animal-friends','shadow-match','clock-match','plant-match','how-things-work']);
export function resetGameData(variantId,{storage,gameId}={}){
  if(!variants.has(variantId))return false;
  const marker=`brainmatch:data-reset:${variantId}:${DATA_RESET_VERSION}`;
  try{
    storage??=globalThis.localStorage;if(!storage)return false;
    if(storage.getItem(marker)==='done')return false;
    const keys=Array.from({length:storage.length},(_,index)=>storage.key(index));
    const ids=new Set([variantId,gameId].filter(Boolean));
    const owned=keys.filter(key=>key?.startsWith(`brainmatch:${variantId}:`));
    for(const key of owned){
      const match=key.match(/:game:([^:]+):v\d+$/);
      if(match){try{ids.add(decodeURIComponent(match[1]));}catch{}}
    }
    const belongs=payload=>ids.has(payload?.gameId)||payload?.variantId===variantId;
    for(const key of ['ignite_pending_sessions_jsplugin','brainmatch:analytics-delivery:v1']){
      const raw=storage.getItem(key);if(!raw)continue;
      let entries;try{entries=JSON.parse(raw);}catch{continue;}
      if(!Array.isArray(entries))continue;
      const kept=entries.filter(entry=>!belongs(key==='brainmatch:analytics-delivery:v1'?entry?.payload:entry));
      if(kept.length)storage.setItem(key,JSON.stringify(kept));else storage.removeItem(key);
    }
    for(const key of keys){
      if(owned.includes(key)||[...ids].some(id=>key?.startsWith('brainmatch:analytics-campaign:')&&key.endsWith(`:${id}`)))storage.removeItem(key);
    }
    storage.setItem(marker,'done');return true;
  }catch{return false;} // Storage restrictions must never block startup.
}
