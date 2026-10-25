// Adapt the supplied BrainMatch WebView contract without logging player data.
export function readHostContext(info=globalThis.window?.userInfo){
  const text=value=>typeof value==='string'&&value.trim()?value.trim():null;
  const userId=text(info?.UserID),gameId=text(info?.GameID);
  if(!userId||!gameId)return null;
  const level=info.highestLevelPlayed;
  return {userId,gameId,highestLevelPlayed:Number.isSafeInteger(level)&&level>=1?level:1};
}
export function progressSaveKey(variantId,host){
  return host?`brainmatch:${variantId}:user:${encodeURIComponent(host.userId)}:game:${encodeURIComponent(host.gameId)}:v1`:`brainmatch:${variantId}:v1`;
}
export function resolveProgress(localLevel,hostLevel){
  const valid=value=>Number.isSafeInteger(value)&&value>=1?value:1;
  return Math.max(valid(localLevel),valid(hostLevel));
}
export const difficultyForProgress=level=>['gentle','growing','clever'][Math.min(2,Math.floor((resolveProgress(level,1)-1)/2))];
