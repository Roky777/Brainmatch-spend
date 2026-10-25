import { PACK, SEASON_PACK, NEON_PACK, VARIANT, hasItem } from './content.js?v=5';
import { migrateXP, XP_RULE_VERSION, XP_RESET_VERSION } from './xp.js?v=10';
import { MatchBoard } from './engine.js?v=2';
export const SAVE_KEY = `brainmatch:${VARIANT.id}:v1`;
export const emptySave = () => ({ version: 7, highestLevelPlayed:1, session:null, discoveries: [], completed: [], seasonCompleted: [], dreamStars: [], seasonStars: [], neonStars: [], theme: 'dream', voice: true, effects: true, music: true, activeRound: '1', gardenWater: 0, xp: 0, xpRuleVersion:XP_RULE_VERSION,xpResetVersion:XP_RESET_VERSION,xpCredits:migrateXP({xp:0}).xpCredits, xpClaims: [], xpCompletionIds:[], xpJourneyBonus: false });
export function sanitizeSession(raw){
  try{
    if(!raw||!['dream','seasons','neon'].includes(raw.world)||!['gentle','growing','clever'].includes(raw.difficulty)||!['practice','challenge'].includes(raw.mode))return null;
    const pack={dream:PACK,seasons:SEASON_PACK,neon:NEON_PACK}[raw.world];
    const round=pack.rounds.find(round=>round.id===raw.roundId);if(!round)return null;
    const allowed=new Set(round.pairs.flatMap(([pairId,a,b])=>[`${pairId}:${a}`,`${pairId}:${b}`]));
    const cards=raw.board.cards;
    const expectedCards={gentle:4,growing:6,clever:8}[raw.difficulty];
    if(cards?.length!==expectedCards)return null;
    if(!Array.isArray(cards)||cards.length>round.pairs.length*2||cards.some(card=>!allowed.has(`${card.pairId}:${card.item}`))||new Set(cards.map(card=>`${card.pairId}:${card.item}`)).size!==cards.length)return null;
    const board=MatchBoard.restore(raw.board);
    if(board.mode!==raw.mode)return null;
    const analytics=raw.analytics;
    const validAnalytics=analytics&&typeof analytics.runId==='string'&&Number.isFinite(analytics.elapsedMs)&&analytics.elapsedMs>=0&&Array.isArray(analytics.tasks)&&analytics.tasks.length<=10000;
    const seen=values=>[...new Set(Array.isArray(values)?values.filter(index=>Number.isInteger(index)&&index>=0&&index<cards.length&&!board.matched.has(cards[index].pairId)):[])];
    return {world:raw.world,roundId:raw.roundId,difficulty:raw.difficulty,mode:raw.mode,board:board.exportState(),memory:seen(raw.memory),guideMemory:seen(raw.guideMemory),analytics:validAnalytics?analytics:null};
  }catch{return null;}
}
export function continuableSession(save){
  const session=sanitizeSession(save?.session);
  return session&&session.world===save.theme&&session.board.phase!=='complete'?session:null;
}
export function sanitizeSave(raw) {
  const save = emptySave();
  if (!raw || typeof raw !== 'object') return save;
  const validRounds = PACK.rounds.map(round => round.id);
  save.discoveries = [...new Set(Array.isArray(raw.discoveries) ? raw.discoveries.filter(hasItem) : [])];
  // Completed rounds must have their expected discoveries. Corruption cannot unlock content.
  save.completed = validRounds.filter(id => Array.isArray(raw.completed) && raw.completed.includes(id) && PACK.rounds.find(round => round.id === id).pairs.every(([, a, b]) => save.discoveries.includes(a) && save.discoveries.includes(b)));
  const validSeasonRounds = SEASON_PACK.rounds.map(round => round.id);
  save.seasonCompleted = validSeasonRounds.filter(id => Array.isArray(raw.seasonCompleted) && raw.seasonCompleted.includes(id) && SEASON_PACK.rounds.find(round => round.id === id).pairs.every(([, a, b]) => save.discoveries.includes(a) && save.discoveries.includes(b)));
  const rawDream = Array.isArray(raw.dreamStars) ? raw.dreamStars.filter(id => typeof id === 'string' && validRounds.includes(id)) : [];
  save.dreamStars = rawDream.length > 0 ? rawDream : validRounds.filter(id => save.completed.includes(id));
  const rawSeason = Array.isArray(raw.seasonStars) ? raw.seasonStars.filter(id => typeof id === 'string' && validSeasonRounds.includes(id)) : [];
  save.seasonStars = rawSeason.length > 0 ? rawSeason : validSeasonRounds.filter(id => save.seasonCompleted.includes(id));
  const validNeonRounds=NEON_PACK.rounds.map(round=>round.id);
  save.neonStars = Array.isArray(raw.neonStars) ? raw.neonStars.filter(id => typeof id === 'string' && validNeonRounds.includes(id)) : [];
  Object.assign(save,migrateXP(raw));
  save.highestLevelPlayed=Number.isSafeInteger(raw.highestLevelPlayed)?Math.max(1,raw.highestLevelPlayed):1;
  const seasonsGoal=Math.min(3,validRounds.length);
  const neonGoal=Math.min(5,validRounds.length+validSeasonRounds.length);
  const neonUnlocked=save.dreamStars.length+save.seasonStars.length>=neonGoal;
  const seasonsUnlocked=save.dreamStars.length>=seasonsGoal;
  save.theme = raw.theme === 'neon' && neonUnlocked
    ? 'neon'
    : (raw.theme === 'seasons'||raw.theme === 'neon') && seasonsUnlocked ? 'seasons' : 'dream';
  save.voice = raw.voice !== false; save.effects = raw.effects !== false; save.music = raw.music !== false;
  save.activeRound = validRounds.includes(raw.activeRound) ? raw.activeRound : '1';
  save.gardenWater = Number.isInteger(raw.gardenWater) ? Math.max(0, Math.min(3, raw.gardenWater)) : 0;
  save.session=sanitizeSession(raw.session);
  if(save.session&&(raw.xpRuleVersion!==XP_RULE_VERSION||raw.xpResetVersion!==XP_RESET_VERSION))save.session.analytics=null;
  if(save.session&&save.session.world!==save.theme)save.session=null;
  return save;
}
export function readSave(storage,key=SAVE_KEY) {
  try { return sanitizeSave(JSON.parse((storage || globalThis.localStorage).getItem(key))); } catch { return emptySave(); }
}
export function writeSave(save, storage,key=SAVE_KEY) {
  try { (storage || globalThis.localStorage).setItem(key, JSON.stringify(save)); return true; } catch { return false; }
}
export function discover(save, items) {
  const added = items.filter(item => !save.discoveries.includes(item));
  save.discoveries = [...new Set([...save.discoveries, ...items])];
  return added;
}
