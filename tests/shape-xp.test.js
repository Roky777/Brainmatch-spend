import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { awardXP, XP_ACTIVITY_COUNT, XP_JOURNEY_BONUS, XP_LIMIT, XP_REWARDS, XP_ROUND_IDS, XP_WORLD_IDS } from '../shape-friends/xp.js';
import { emptySave, sanitizeSave } from '../shape-friends/save.js';

test('Practice earns more XP than Beat Sparky and both feed one 200 XP journey',()=>{
  assert.equal(XP_LIMIT,200);
  assert.deepEqual(XP_REWARDS,{practice:10,challenge:6});
  assert(XP_REWARDS.practice>XP_REWARDS.challenge);
  const save=emptySave();
  const practice={worldId:'dream',roundId:'1',mode:'practice'};
  const challenge={worldId:'dream',roundId:'1',mode:'challenge'};
  assert.deepEqual(awardXP(save,practice),{earned:10,total:10,max:200,complete:false,bonus:0,reason:'earned'});
  assert.deepEqual(awardXP(save,challenge),{earned:6,total:16,max:200,complete:false,bonus:0,reason:'earned'});
  assert.deepEqual(awardXP(save,practice),{earned:0,total:16,max:200,complete:false,bonus:0,reason:'replay'});
  assert.equal(save.xpClaims.length,2,'replaying a board cannot farm XP');
});

test('the 24 unique activities plus completion bonus total exactly 200 XP',()=>{
  const save=emptySave();let earned=0,last;
  for(const worldId of XP_WORLD_IDS)for(const roundId of XP_ROUND_IDS)for(const mode of Object.keys(XP_REWARDS)){
    last=awardXP(save,{worldId,roundId,mode});earned+=last.earned;
  }
  assert.equal(XP_ACTIVITY_COUNT,24);assert.equal(XP_JOURNEY_BONUS,8);
  assert.equal(earned,200);assert.equal(save.xp,200);assert.equal(save.xpClaims.length,24);
  assert.equal(last.bonus,8);assert.equal(last.complete,true);assert.equal(save.xpJourneyBonus,true);
});

test('XP never exceeds 200 and legacy totals are safely capped',()=>{
  const save={xp:197,xpClaims:[],xpJourneyBonus:false};
  assert.deepEqual(awardXP(save,{worldId:'dream',roundId:'1',mode:'practice'}),{earned:3,total:200,max:200,complete:true,bonus:0,reason:'earned'});
  assert.deepEqual(awardXP(save,{worldId:'dream',roundId:'2',mode:'challenge'}),{earned:0,total:200,max:200,complete:true,bonus:0,reason:'complete'});
  assert.equal(sanitizeSave({...emptySave(),xp:999}).xp,200);
  assert.equal(sanitizeSave({...emptySave(),xp:-10}).xp,0);
});

test('existing progress receives a safe one-time XP migration',()=>{
  const legacy={...emptySave(),xp:undefined,dreamStars:['1','2','3'],seasonStars:['1']};
  delete legacy.xpClaims;delete legacy.xpJourneyBonus;
  const restored=sanitizeSave(legacy);
  assert.equal(restored.xp,40);
  assert.deepEqual(restored.xpClaims,['dream:1:practice','dream:2:practice','dream:3:practice','seasons:1:practice']);
});

test('the child-facing UI shows the total journey and both reward amounts',async()=>{
  const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.match(html,/id="xp-meter"[\s\S]*?XP journey[\s\S]*?First clear in each mode · Practice 10 · Beat Sparky 6/);
  assert.doesNotMatch(html,/class="mode-xp"/,'XP rewards are explained once, not scattered across buttons');
  assert.match(html,/class="result-summary"[\s\S]*?id="result-score"[\s\S]*?id="result-xp"/);
  assert.match(app,/const xpAward=awardXP\(save,\{worldId:theme\.id,roundId:round\.id,mode:options\.mode\}\);[\s\S]*?persist\(\)/);
});

test('the compact result XP message fits the shared summary panel',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
  assert.match(app,/award\.reason==='replay' \? 'XP collected'/);
  assert.match(css,/\.result-xp>span:last-child\{[^}]*min-width:0/);
  assert.match(css,/\.result-xp strong\{[^}]*white-space:normal/);
  assert.match(css,/\.result-summary\{[^}]*gap:0/,'the score and XP panels should meet without a blank seam');
});
