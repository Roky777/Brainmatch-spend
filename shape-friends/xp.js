import { GAME_CONTENT, PACK, WORLDS } from './content.js';

export const XP_LIMIT = 200;
export const XP_REWARDS = Object.freeze(GAME_CONTENT.progression?.xp?.rewards||{ practice: 10, challenge: 6 });
export const XP_JOURNEY_BONUS = GAME_CONTENT.progression?.xp?.completionBonus??8;
export const XP_WORLD_IDS = Object.freeze(Object.keys(WORLDS));
export const XP_ROUND_IDS = Object.freeze(PACK.rounds.map(round=>round.id));
export const XP_ACTIVITY_COUNT = XP_WORLD_IDS.length * XP_ROUND_IDS.length * Object.keys(XP_REWARDS).length;

export function xpActivityKey({ worldId, roundId, mode }) {
  return `${worldId}:${roundId}:${mode}`;
}

export function validXPClaim(key) {
  if(typeof key!=='string')return false;
  const [worldId,roundId,mode,...rest]=key.split(':');
  return !rest.length&&XP_WORLD_IDS.includes(worldId)&&XP_ROUND_IDS.includes(roundId)&&mode in XP_REWARDS;
}

export function normalizeXPClaims(claims) {
  return [...new Set(Array.isArray(claims)?claims.filter(validXPClaim):[])];
}

export function awardXP(save, activity) {
  const before = Number.isInteger(save.xp) ? Math.max(0, Math.min(XP_LIMIT, save.xp)) : 0;
  save.xpClaims=normalizeXPClaims(save.xpClaims);
  if(before===XP_LIMIT){save.xp=before;return{earned:0,total:before,max:XP_LIMIT,complete:true,bonus:0,reason:'complete'};}
  const key=xpActivityKey(activity);
  if(!validXPClaim(key)||save.xpClaims.includes(key)){
    save.xp=before;return{earned:0,total:before,max:XP_LIMIT,complete:false,bonus:0,reason:'replay'};
  }
  save.xpClaims.push(key);
  const journeyFinished=save.xpClaims.length===XP_ACTIVITY_COUNT&&!save.xpJourneyBonus;
  const bonus=journeyFinished?XP_JOURNEY_BONUS:0;
  if(journeyFinished)save.xpJourneyBonus=true;
  const available = XP_LIMIT - before;
  const earned = Math.min(available, XP_REWARDS[activity.mode] + bonus);
  save.xp = before + earned;
  return { earned, total: save.xp, max: XP_LIMIT, complete: save.xp === XP_LIMIT, bonus:Math.min(bonus,earned), reason:'earned' };
}
