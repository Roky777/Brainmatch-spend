import defaultManifest from './game-content.json' with { type: 'json' };

const configuredManifest = typeof document === 'undefined' ? '' : document.documentElement.dataset.contentManifest;
const manifestURL = configuredManifest
  ? new URL(configuredManifest, globalThis.location?.href || import.meta.url)
  : new URL('./game-content.json', import.meta.url);
const manifest = configuredManifest
  ? await fetch(manifestURL).then(response => {
      if(!response.ok)throw new Error(`Could not load game content (${response.status}).`);
      return response.json();
    })
  : defaultManifest;

export function validateContentManifest(input) {
  if(!input||typeof input!=='object')throw new Error('Game content must be a JSON object.');
  if(!input.variant?.id||!input.variant?.title||!input.variant?.objective)throw new Error('Game content needs variant id, title and objective.');
  if(!input.worlds||!Object.keys(input.worlds).length)throw new Error('Game content needs at least one world.');
  if(!input.categories||!Object.keys(input.categories).length)throw new Error('Game content needs matching categories.');
  if(!input.items||!Object.keys(input.items).length)throw new Error('Game content needs card items.');
  for(const [id,world] of Object.entries(input.worlds)){
    if(world.id!==id||!world.name||!world.skin||!world.cloudAsset||!Array.isArray(world.menuTitleLines))throw new Error(`World ${id} is incomplete.`);
  }
  for(const [id,item] of Object.entries(input.items))if(!item.name||!item.asset)throw new Error(`Item ${id} needs a name and asset.`);
  const roundIds=new Set();
  for(const round of input.rounds||[]){
    if(!round.id||roundIds.has(round.id))throw new Error(`Round id ${round.id||'(missing)'} must be unique.`);
    roundIds.add(round.id);
    if(!Array.isArray(round.pairs)||round.pairs.length<4)throw new Error(`Round ${round.id} needs at least four pairs.`);
    for(const pair of round.pairs){
      if(!Array.isArray(pair)||pair.length!==3)throw new Error(`Round ${round.id} has an invalid pair.`);
      const [categoryId,a,b]=pair;
      if(!input.categories[categoryId])throw new Error(`Unknown category ${categoryId} in round ${round.id}.`);
      if(a===b||!input.items[a]||!input.items[b])throw new Error(`Invalid item pair ${a}/${b} in round ${round.id}.`);
    }
  }
  if(!roundIds.size)throw new Error('Game content needs at least one round.');
  if(input.play?.difficultyGroups){
    if(!Array.isArray(input.play.difficultyGroups)||input.play.difficultyGroups.length!==3)throw new Error('Difficulty groups must define Easy, Medium and Hard.');
    const groupedRounds=[];
    for(const group of input.play.difficultyGroups){
      if(!['gentle','growing','clever'].includes(group.id)||!group.name||!group.description||!Array.isArray(group.rounds)||!group.rounds.length)throw new Error(`Difficulty group ${group.id||'(missing)'} is incomplete.`);
      for(const roundId of group.rounds){
        if(!roundIds.has(roundId))throw new Error(`Difficulty group ${group.id} uses unknown round ${roundId}.`);
        groupedRounds.push(roundId);
      }
    }
    if(new Set(groupedRounds).size!==roundIds.size||groupedRounds.length!==roundIds.size)throw new Error('Difficulty groups must include every round exactly once.');
  }
  return true;
}

validateContentManifest(manifest);

// Generic, data-driven content contract. Presentation code consumes worlds,
// categories, items and rounds without knowing which learning variant is active.
export const GAME_CONTENT = Object.freeze(manifest);
export const VARIANT = Object.freeze(manifest.variant);
export const CATEGORIES = Object.freeze(manifest.categories);
export const ALL_ITEMS = Object.freeze(manifest.items);

const collection = name => Object.freeze(Object.fromEntries(
  Object.entries(ALL_ITEMS).filter(([,item])=>item.collection===name)
));

// Compatibility collections for the picnic and existing saved discoveries.
export const ITEMS = collection('primary');
export const SEASON_ITEMS = collection('secondary');

const makePack = world => Object.freeze({
  id: `${VARIANT.id}-${world.id}`,
  version: manifest.schemaVersion,
  title: world.id==='dream' ? VARIANT.title : world.name,
  subtitle: VARIANT.subtitle,
  grade: VARIANT.grade,
  objective: VARIANT.objective,
  rounds: manifest.rounds,
});

export const WORLDS = Object.freeze(Object.fromEntries(
  Object.entries(manifest.worlds).map(([id,world])=>[id,Object.freeze({
    ...world,
    title:world.name,
    pack:makePack(world),
  })])
));

export const PRIMARY_WORLD = WORLDS.dream;
export const PACK = PRIMARY_WORLD.pack;
export const SEASON_PACK = WORLDS.seasons.pack;
export const NEON_PACK = WORLDS.neon.pack;

// Backward-compatible aliases. New variants should use WORLDS/CATEGORIES.
export const THEMES = WORLDS;
export const SHAPES = CATEGORIES;
export function getWorld(id = PRIMARY_WORLD.id) { return WORLDS[id] || PRIMARY_WORLD; }
export const getTheme = getWorld;
export function itemFor(id) { return ALL_ITEMS[id]; }
export function hasItem(id) { return Boolean(itemFor(id)); }
export function assetURL(id) {
  const item=itemFor(id);
  if(!item)throw new Error(`Unknown card item: ${id}`);
  const assetBase=new URL(manifest.variant.assetBase||'./assets/',manifestURL);
  return new URL(item.asset,assetBase).href;
}
export function roundById(id, pack = PACK) { return pack.rounds.find(round => round.id === String(id)); }
export function cardsFor(round) {
  return round.pairs.flatMap(([categoryId,a,b])=>[a,b].map((item,side)=>({id:`${categoryId}-${side}`,pairId:categoryId,item})));
}
