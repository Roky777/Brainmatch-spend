import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {awardXP,migrateXP,XP_KEYS,XP_REWARDS,XP_LIMIT,XP_ACTIVITY_COUNT,xpActivityKey,xpActivityNumber} from '../shape-friends/xp.js';
import {emptySave,sanitizeSave} from '../shape-friends/save.js';
test('six difficulty/mode rewards total exactly 200 without themes or bonuses',()=>{
  assert.equal(XP_LIMIT,200);assert.equal(XP_ACTIVITY_COUNT,6);
  assert.deepEqual(XP_REWARDS,{gentle:{practice:30,challenge:20},growing:{practice:40,challenge:25},clever:{practice:50,challenge:35}});
  const save=emptySave();let sum=0;
  for(const key of XP_KEYS){const [difficulty,mode]=key.split(':');const result=awardXP(save,{difficulty,mode});sum+=result.earned;assert.equal(result.bonus,0);}
  assert.equal(sum,200);assert.equal(save.xp,200);
});
test('themes and hidden board IDs never create another XP claim',()=>{
  const save=emptySave();
  assert.equal(awardXP(save,{worldId:'dream',roundId:'1',difficulty:'gentle',mode:'practice'}).earned,30);
  assert.equal(awardXP(save,{worldId:'neon',roundId:'4',difficulty:'gentle',mode:'practice'}).earned,0);
  assert.equal(awardXP(save,{worldId:'dream',roundId:'1',difficulty:'clever',mode:'practice'}).earned,50);
  assert.equal(save.xp,80);assert.equal(save.xpClaims.length,2);
  assert.equal(xpActivityKey({difficulty:'gentle',mode:'practice',worldId:'neon'}),'gentle:practice');
  assert.equal(xpActivityNumber({difficulty:'clever',mode:'challenge'}),6);
});
test('every old earned total resets once and can earn exactly 200 again',()=>{
  for(let total=0;total<=200;total++){
    const save={xp:total,xpClaims:['dream:1:practice']};Object.assign(save,migrateXP(save));
    assert.equal(save.xp,0);assert.deepEqual(migrateXP(save),migrateXP(migrateXP(save)));
    let earned=0;for(const key of XP_KEYS){const [difficulty,mode]=key.split(':');earned+=awardXP(save,{difficulty,mode}).earned;}
    assert.equal(save.xp,200);assert.equal(earned,200);
  }
});
test('legacy XP resets but newly earned XP survives reload without a second reset',()=>{
  let save=sanitizeSave({version:6,xp:44,xpClaims:['dream:1:practice']});
  assert.equal(save.xp,0);assert.deepEqual(save.xpClaims,[]);
  const result=awardXP(save,{difficulty:'gentle',mode:'practice'});
  assert.equal(result.earned,30);save=sanitizeSave(JSON.parse(JSON.stringify(save)));
  assert.equal(save.xp,30);assert.equal(awardXP(save,{difficulty:'gentle',mode:'practice'}).earned,0);
  assert.equal(sanitizeSave({version:6,xp:999}).xp,0);assert.equal(sanitizeSave({version:6,xp:-10}).xp,0);
  const version2=sanitizeSave({version:7,xpRuleVersion:2,xp:200,xpCredits:Object.fromEntries(XP_KEYS.map(key=>[key,200])),xpClaims:XP_KEYS});
  assert.equal(version2.xp,0);assert.deepEqual(version2.xpClaims,[]);
});
test('old stars remain unlocked without inferring or re-awarding old XP',()=>{
  const save=sanitizeSave({version:5,dreamStars:['1','2','3'],seasonStars:['1']});
  assert.equal(save.xp,0);assert.deepEqual(save.xpClaims,[]);
  assert.deepEqual(save.dreamStars,['1','2','3']);assert.deepEqual(save.seasonStars,['1']);
});
test('invalid claims cannot create XP or mutate the journey',()=>{
  const save=emptySave();assert.equal(awardXP(save,{difficulty:'unknown',mode:'practice'}).earned,0);assert.equal(save.xp,0);
  const loaded=sanitizeSave({...emptySave(),xp:999,xpCredits:{'gentle:practice':999},xpClaims:['neon:1:practice','oops']});
  assert.equal(loaded.xp,30);assert.deepEqual(loaded.xpClaims,[]);
});
test('UI and award calls describe difficulty rewards, not themes',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
  assert.match(app,/awardXP\(save,\{difficulty:options.level,mode:options.mode\}\)/);
  assert.match(html,/First clear per difficulty and mode · Themes share XP/);
  assert.doesNotMatch(app,/awardXP\(save,\{worldId/);
  const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
  assert.match(css,/\.result-xp strong\{[^}]*white-space:normal/);
});
