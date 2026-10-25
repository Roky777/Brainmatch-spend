import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {awardXP,migrateXP,XP_KEYS,XP_REWARDS,XP_LIMIT} from '../shape-friends/xp.js';
import {emptySave,sanitizeSave} from '../shape-friends/save.js';
const activity=(completionId,mode='practice',difficulty='gentle')=>({completionId,mode,difficulty});
test('every board earns 10 Practice or 15 Beat Sparky, independent of difficulty and theme',()=>{
  const save=emptySave();
  for(const [i,key] of XP_KEYS.entries()){
    const [difficulty,mode]=key.split(':');
    assert.equal(awardXP(save,activity(`board-${i}`,mode,difficulty)).earned,mode==='practice'?10:15);
  }
  assert.equal(save.xp,75);assert.equal(XP_LIMIT,200);
  assert.ok(Object.values(XP_REWARDS).every(reward=>reward.practice===10&&reward.challenge===15));
});
test('replays earn again, but the same completion callback never earns twice',()=>{
  let save=emptySave();
  assert.equal(awardXP(save,activity('play-1')).earned,10);
  assert.equal(awardXP(save,activity('play-1')).earned,0);
  save=sanitizeSave(JSON.parse(JSON.stringify(save)));
  assert.equal(awardXP(save,activity('play-1')).earned,0);
  assert.equal(awardXP(save,activity('play-2')).earned,10);
  assert.equal(awardXP(save,activity('play-3','challenge')).earned,15);
  assert.equal(save.xp,35);
});
test('old XP refreshes once, with no backfill, and new test earnings survive reload',()=>{
  let save=sanitizeSave({xpRuleVersion:3,xp:44,xpClaims:XP_KEYS});
  assert.equal(save.xp,0);assert.deepEqual(save.xpClaims,[]);
  assert.equal(awardXP(save,activity('new')).earned,10);
  save=sanitizeSave(JSON.parse(JSON.stringify(save)));assert.equal(save.xp,10);
  assert.equal(awardXP(save,activity('another')).earned,10);
  assert.equal(sanitizeSave({...emptySave(),xp:200,xpResetVersion:undefined}).xp,0);
  assert.deepEqual(migrateXP(save),migrateXP(migrateXP(save)));
});
test('repeat play reaches 200 without exceeding the cap, including partial final rewards',()=>{
  const save=emptySave();let earned=0;
  for(let i=0;i<20;i++)earned+=awardXP(save,activity(`play-${i}`,'challenge')).earned;
  assert.equal(earned,200);assert.equal(save.xp,200);
  const near=sanitizeSave({...emptySave(),xp:195});assert.equal(awardXP(near,activity('last','challenge')).earned,5);
});
test('invalid activities cannot award XP, and local progress stays intact',()=>{
  const save=emptySave();
  for(const input of [{mode:'practice',difficulty:'gentle'},activity('bad','unknown'),activity('bad','practice','unknown')])assert.equal(awardXP(save,input).earned,0);
  const loaded=sanitizeSave({xp:44,dreamStars:['1'],highestLevelPlayed:29});
  assert.equal(loaded.xp,0);assert.deepEqual(loaded.dreamStars,['1']);assert.equal(loaded.highestLevelPlayed,29);
});
test('UI and completion logic use per-board rewards with stable completion identity',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
  assert.match(app,/completionId:`\$\{report.runId\}:\$\{report.levelNumber\}`/);
  assert.match(html,/Every board · Practice 10 XP · Beat Sparky 15 XP/);
  assert.match(app,/resolveProgress\(save.highestLevelPlayed,host\?\.highestLevelPlayed\)\+1/);
});
