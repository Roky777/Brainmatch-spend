import { PACK, SEASON_PACK, NEON_PACK, VARIANT, hasItem } from './content.js';
import { normalizeXPClaims, XP_ACTIVITY_COUNT, XP_JOURNEY_BONUS, XP_LIMIT, XP_REWARDS } from './xp.js';
export const SAVE_KEY = `brainmatch:${VARIANT.id}:v1`;
export const emptySave = () => ({ version: 5, discoveries: [], completed: [], seasonCompleted: [], dreamStars: [], seasonStars: [], neonStars: [], theme: 'dream', voice: true, effects: true, music: true, activeRound: '1', gardenWater: 0, xp: 0, xpClaims: [], xpJourneyBonus: false });
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
  const inferredClaims=[
    ...save.dreamStars.map(id=>`dream:${id}:practice`),
    ...save.seasonStars.map(id=>`seasons:${id}:practice`),
    ...save.neonStars.map(id=>`neon:${id}:practice`),
  ];
  save.xpClaims=normalizeXPClaims(Array.isArray(raw.xpClaims)?raw.xpClaims:inferredClaims);
  save.xpJourneyBonus=raw.xpJourneyBonus===true&&save.xpClaims.length===XP_ACTIVITY_COUNT;
  const restoredXP=Number.isInteger(raw.xp)
    ? raw.xp
    : save.xpClaims.reduce((total,key)=>total+(key.endsWith(':practice')?XP_REWARDS.practice:XP_REWARDS.challenge),0)+(save.xpJourneyBonus?XP_JOURNEY_BONUS:0);
  save.xp=Math.max(0,Math.min(XP_LIMIT,restoredXP));
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
  return save;
}
export function readSave(storage) {
  try { return sanitizeSave(JSON.parse((storage || globalThis.localStorage).getItem(SAVE_KEY))); } catch { return emptySave(); }
}
export function writeSave(save, storage) {
  try { (storage || globalThis.localStorage).setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function discover(save, items) {
  const added = items.filter(item => !save.discoveries.includes(item));
  save.discoveries = [...new Set([...save.discoveries, ...items])];
  return added;
}
