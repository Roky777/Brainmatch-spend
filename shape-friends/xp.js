import { GAME_CONTENT, PACK, WORLDS } from './content.js?v=5';

export const XP_LIMIT=200, XP_RULE_VERSION=2, XP_ACTIVITY_COUNT=6, XP_JOURNEY_BONUS=0;
export const XP_REWARDS=Object.freeze({
  gentle:Object.freeze({practice:30,challenge:20}),
  growing:Object.freeze({practice:40,challenge:25}),
  clever:Object.freeze({practice:50,challenge:35}),
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
  const claims=normalizeXPClaims(raw.xpClaims);
  if(raw.xpRuleVersion===XP_RULE_VERSION){
    const credits=Object.fromEntries(XP_KEYS.map(key=>[key,claims.includes(key)?xpReward(key):Math.max(0,Math.min(xpReward(key),Math.trunc(Number(raw.xpCredits?.[key])||0))) ]));
    return {xpRuleVersion:XP_RULE_VERSION,xpCredits:credits,xpClaims:claims,xp:XP_KEYS.reduce((sum,key)=>sum+credits[key],0),xpJourneyBonus:false};
  }
  // Legacy claims did not store difficulty. Preserve their actual earned total
  // as proportional credit, not fabricated difficulty completions.
  const legacyRewards=GAME_CONTENT.progression?.legacyXP?.rewards||{practice:10,challenge:6};
  const legacyClaims=[...new Set(Array.isArray(raw.xpClaims)?raw.xpClaims:[])].filter(key=>{
    if(typeof key!=='string')return false;
    const [world,round,mode,...rest]=key.split(':');return !rest.length&&XP_WORLD_IDS.includes(world)&&XP_ROUND_IDS.includes(round)&&modes.includes(mode);
  });
  const inferred=legacyClaims.reduce((sum,key)=>sum+(legacyRewards[key.split(':')[2]]||0),0)+(raw.xpJourneyBonus?(GAME_CONTENT.progression?.legacyXP?.completionBonus??8):0);
  const total=Math.max(0,Math.min(XP_LIMIT,Number.isInteger(raw.xp)?raw.xp:inferred));
  let cumulative=0;
  const credits=Object.fromEntries(XP_KEYS.map(key=>{
    const before=Math.floor(total*cumulative/XP_LIMIT);cumulative+=xpReward(key);
    return [key,Math.floor(total*cumulative/XP_LIMIT)-before];
  }));
  return {xpRuleVersion:XP_RULE_VERSION,xpCredits:credits,xpClaims:[],xp:total,xpJourneyBonus:false};
}

export function awardXP(save,activity){
  Object.assign(save,migrateXP(save));
  const before=save.xp,key=xpActivityKey(activity);
  if(before===XP_LIMIT)return {earned:0,total:before,max:XP_LIMIT,complete:true,bonus:0,reason:'complete'};
  if(!validXPClaim(key)||save.xpClaims.includes(key))return {earned:0,total:before,max:XP_LIMIT,complete:false,bonus:0,reason:'replay'};
  const earned=xpReward(key)-save.xpCredits[key];
  save.xpCredits[key]=xpReward(key);save.xpClaims.push(key);save.xp=before+earned;
  return {earned,total:save.xp,max:XP_LIMIT,complete:save.xp===XP_LIMIT,bonus:0,reason:'earned'};
}
