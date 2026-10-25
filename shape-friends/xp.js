import { PACK, WORLDS } from './content.js?v=5';

export const XP_LIMIT=200, XP_RULE_VERSION=4, XP_ACTIVITY_COUNT=6, XP_JOURNEY_BONUS=0;
export const XP_RESET_VERSION=1;
export const XP_REWARDS=Object.freeze({
  gentle:Object.freeze({practice:10,challenge:15}),
  growing:Object.freeze({practice:10,challenge:15}),
  clever:Object.freeze({practice:10,challenge:15}),
});
// Retained only for validating/migrating pre-difficulty saves and reports.
export const XP_WORLD_IDS=Object.freeze(Object.keys(WORLDS));
export const XP_ROUND_IDS=Object.freeze(PACK.rounds.map(round=>round.id));
const modes=['practice','challenge'];
export const XP_KEYS=Object.freeze(Object.keys(XP_REWARDS).flatMap(difficulty=>modes.map(mode=>`${difficulty}:${mode}`)));
export function xpActivityKey({difficulty,mode}){return `${difficulty}:${mode}`;}
export const validXPClaim=key=>XP_KEYS.includes(key);
export const normalizeXPClaims=claims=>[...new Set(Array.isArray(claims)?claims.filter(validXPClaim):[])];
export function xpActivityNumber(activity){const index=XP_KEYS.indexOf(xpActivityKey(activity));return index<0?null:index+1;}
export const xpReward=key=>{const [difficulty,mode]=String(key).split(':');return XP_REWARDS[difficulty]?.[mode]||0;};

export function migrateXP(raw={}){
  // User-requested XP-only refresh. Preserve new test earnings on every reload.
  const current=raw.xpRuleVersion===XP_RULE_VERSION&&raw.xpResetVersion===XP_RESET_VERSION;
  return {xpRuleVersion:XP_RULE_VERSION,xpResetVersion:XP_RESET_VERSION,xp:current?Math.max(0,Math.min(XP_LIMIT,Math.trunc(Number(raw.xp)||0))):0,xpClaims:[],xpCredits:{},xpJourneyBonus:false,
    xpCompletionIds:current&&Array.isArray(raw.xpCompletionIds)?[...new Set(raw.xpCompletionIds.filter(id=>typeof id==='string'&&id.length>0))].slice(-200):[]};
}

export function awardXP(save,activity){
  Object.assign(save,migrateXP(save));
  const before=save.xp,key=xpActivityKey(activity),id=activity.completionId;
  if(before===XP_LIMIT)return {earned:0,total:before,max:XP_LIMIT,complete:true,bonus:0,reason:'complete'};
  if(!validXPClaim(key)||typeof id!=='string'||!id)return {earned:0,total:before,max:XP_LIMIT,complete:false,bonus:0,reason:'invalid'};
  if(save.xpCompletionIds.includes(id))return {earned:0,total:before,max:XP_LIMIT,complete:false,bonus:0,reason:'duplicate'};
  const earned=Math.min(xpReward(key),XP_LIMIT-before);
  save.xpCompletionIds.push(id);save.xp=before+earned;
  return {earned,total:save.xp,max:XP_LIMIT,complete:save.xp===XP_LIMIT,bonus:0,reason:'earned'};
}
