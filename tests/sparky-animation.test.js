import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SPARKY_CLIPS,SEATED_IDLE_FRAMES,SEATED_IDLE_SHEET,SEATED_TALK_FRAMES,SEATED_TALK_SHEET,SEATED_ARRIVE_FRAMES,SEATED_ARRIVE_SHEET,SEATED_ARRIVE_DURATION,SEATED_OBSERVE_FRAMES,SEATED_OBSERVE_DURATION,SEATED_OBSERVE_HANDOFF_MS,SEATED_WAND_FRAMES,SEATED_WAND_RELEASE_MS,SEATED_WAND_RECOVERY_MS,SEATED_JOY_FRAMES,SEATED_JOY_SHEET,SEATED_JOY_DURATION,SEATED_JOY_RECOVERY_MS,SEATED_MISS_FRAMES,SEATED_MISS_SHEET,SEATED_MISS_DURATION,SEATED_MISS_RECOVERY_MS,SEATED_RESULT_FRAMES,SEATED_RESULT_SHEET,SEATED_RESULT_HOLD_MS,SEATED_NOD_YES_SHEET,SEATED_NOD_YES_FRAMES,SEATED_NOD_YES_DURATION,SEATED_NOD_NO_SHEET,SEATED_NOD_NO_FRAMES,SEATED_NOD_NO_DURATION,MOUTH_VISEMES,MOUTH_VISEME_SHEET,MOUTH_CLEANUP_SHEET,spriteFrame,seatedIdleFrame,seatedTalkFrame,seatedArriveFrame,seatedObserveFrame,seatedObserveDirection,seatedObserveSource,seatedWandFrame,seatedWandSource,seatedWandTip,seatedJoyFrame,seatedJoyEndTime,seatedMissFrame,seatedMissEndTime,seatedResultFrame,seatedNodYesFrame,seatedNodNoFrame,seatedTalkEndTime,seatedMouthViseme,buildMouthCues,mouthVisemeAt,mouthVisemePosition} from '../shape-friends/sparky.js';

test('Sparky plays the supplied kimono peeking, pointing and celebration frames',()=>{
  assert.deepEqual(spriteFrame('idle',0),{sheet:'peek',frame:11});
  assert.deepEqual(spriteFrame('idle',2450),{sheet:'peek',frame:10});
  assert.deepEqual(spriteFrame('thinking',500),{sheet:'expressions',frame:1+8});
  assert.deepEqual(spriteFrame('present-right',500),{sheet:'reach',frame:1});
  assert.deepEqual(spriteFrame('happy',300),{sheet:'reactions',frame:1});
  assert.deepEqual(spriteFrame('happy',600),{sheet:'reactions',frame:3});
  for(const pose of Object.keys(SPARKY_CLIPS)){
    const frames=new Set(Array.from({length:100},(_,i)=>spriteFrame(pose,i*70).frame));
    assert(frames.size>=2,`${pose} must draw more than a static cutout`);
    assert.deepEqual(spriteFrame(pose,0,true),spriteFrame(pose,99999,true));
  }
});
test('formal wall-seated idle sheet plays all 16 frames and respects reduced motion',async()=>{
  assert.equal(SEATED_IDLE_SHEET,'assets/new_sparky_sheets/sparky_wall_idle_blink_formal_atlas_v1.png');
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_IDLE_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(SEATED_IDLE_FRAMES.frames.length,16);
  assert.equal(SEATED_IDLE_FRAMES.times.length,16);
  assert.equal(seatedIdleFrame(0),0);
  assert.equal(seatedIdleFrame(899),0);
  assert.equal(seatedIdleFrame(900),1);
  assert.equal(seatedIdleFrame(1900),6);
  assert.equal(seatedIdleFrame(2180),11);
  assert.equal(seatedIdleFrame(2300),14);
  assert.equal(seatedIdleFrame(2476),15);
  assert.equal(seatedIdleFrame(3326),0);
  assert.equal(seatedIdleFrame(99999,true),0);
});
test('formal wall-seated runtime atlas is an exact 4 by 4 grid of 512px cells',async()=>{
  const bytes=await readFile(new URL(`../shape-friends/${SEATED_IDLE_SHEET}`,import.meta.url));
  assert.equal(bytes.readUInt32BE(16),2048);
  assert.equal(bytes.readUInt32BE(20),2048);
  assert(bytes.length>1000);
  const seatCloud=await readFile(new URL('../shape-friends/assets/sparky-seat-cloud-v1.webp',import.meta.url));
  assert.equal(seatCloud.toString('ascii',8,12),'WEBP');
  assert(seatCloud.length>1000);
});
test('wall talk atlas uses its supplied timing and completes recovery',async()=>{
  assert.equal(SEATED_TALK_SHEET,'assets/new_sparky_sheets/sparky_wall_invite_turn/sparky_wall_invite_turn_atlas.png');
  assert.equal(SEATED_TALK_FRAMES.frames.length,16);
  assert.equal(SEATED_TALK_FRAMES.times.length,16);
  assert.equal(seatedTalkFrame(0),0);
  assert.equal(seatedTalkFrame(900),7);
  assert.equal(seatedTalkFrame(1000),8);
  assert.equal(seatedTalkFrame(1958),8);
  assert.equal(seatedTalkFrame(2000),9);
  assert.equal(seatedTalkFrame(2500),14);
  assert.equal(seatedTalkFrame(3041),15);
  assert.equal(seatedTalkFrame(1200,4000),8,'long dialogue extends the conversational hold');
  assert.equal(seatedTalkFrame(99999,3042,true),0);
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_TALK_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(atlas.readUInt32BE(16),2048);
  assert.equal(atlas.readUInt32BE(20),2048);
});
test('supplied phonetic visemes are mapped to speech timing and hidden for recovery',async()=>{
  assert.equal(MOUTH_VISEMES.length,17);
  assert.equal(seatedMouthViseme(0,0),'REST');
  assert.equal(seatedMouthViseme(95,0),'MBP');
  assert.equal(seatedMouthViseme(950,9),'REST','recovery restores the baked atlas mouth');
  assert.equal(seatedMouthViseme(360,8,true),'REST','reduced motion keeps the neutral mouth');
  const cues=buildMouthCues('map ao of us!',2400);
  const shapes=cues.map(cue=>cue.shape);
  assert(shapes.includes('MBP'));assert(shapes.includes('A'));assert(shapes.includes('O'));assert(shapes.includes('FV'));assert(shapes.includes('U'));assert(shapes.includes('S'));
  assert(shapes.includes('SMILE_OPEN'));assert(buildMouthCues('Really?',1000).some(cue=>cue.shape==='GASP'));
  assert(cues.filter(cue=>cue.shape!=='REST').every(cue=>cue.end-cue.start>=120),'spoken mouth poses remain readable instead of fluttering per letter');
  assert.equal(mouthVisemeAt(0,cues),'REST');
  assert.equal(mouthVisemeAt(5000,cues),'REST');
  assert.deepEqual(mouthVisemePosition('REST'),{x:0,y:0});
  assert.deepEqual(mouthVisemePosition('O_REST_2'),{x:25,y:100});
  const synced=buildMouthCues('My turn! Let me think... I’ll try this one.',5440,[[979,1327],[2547,3579]]);
  assert.equal(mouthVisemeAt(1100,synced),'REST','measured phrase pauses close the mouth');
  assert.equal(mouthVisemeAt(3000,synced),'REST','long measured pauses do not lip-flap');
  const atlas=await readFile(new URL(`../shape-friends/${MOUTH_VISEME_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');assert.equal(atlas.readUInt32BE(16),1280);assert.equal(atlas.readUInt32BE(20),1024);
  const cleanup=await readFile(new URL(`../shape-friends/${MOUTH_CLEANUP_SHEET}`,import.meta.url));
  assert.equal(cleanup.toString('ascii',1,4),'PNG');assert.equal(cleanup.readUInt32BE(16),512);assert.equal(cleanup.readUInt32BE(20),512);
});
test('voice completion releases the speaking hold into authored recovery',()=>{
  const normalEnd=seatedTalkEndTime(2000);
  assert.equal(seatedTalkFrame(1999,normalEnd),8);
  assert.equal(seatedTalkFrame(2001,normalEnd),9);
  assert.equal(seatedTalkFrame(normalEnd-1,normalEnd),15);
  const earlyEnd=seatedTalkEndTime(300);
  assert(earlyEnd>2000,'an early clip still gets the complete intro and recovery');
  assert.equal(seatedTalkFrame(1070,earlyEnd),8,'an early clip shows a brief complete invitation pose');
});
test('Sparky cloud assembly is layered in play and docked in the result stage',async()=>{
  const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
  assert.match(css,/\.play-layout > \.sparky-anchor\{display:none\}/);
  assert.match(css,/#app\[data-mode="result"\] \.play-layout\{[\s\S]*?align-items:center;justify-content:center/);
  assert.match(css,/#app\[data-mode="match"\]\[data-sparky-ready="true"\] \.play-layout > \.sparky-anchor\{display:block\}/);
  assert.match(css,/#app\[data-mode="result"\] \.result-character-space \.sparky-anchor\{/);
  assert.match(css,/\.cast-star\{display:none\}/,'the gameplay star cannot leak into the top-left of the menu');
});
test('wall arrival uses all supplied 5 by 4 atlas frames before idle handoff',async()=>{
  assert.equal(SEATED_ARRIVE_SHEET,'assets/new_sparky_sheets/sparky_wall_arrive_settle/sparky_wall_arrive_settle_atlas.png');
  assert.equal(SEATED_ARRIVE_FRAMES.frames.length,20);
  assert.equal(SEATED_ARRIVE_FRAMES.times.length,20);
  assert(Math.abs(SEATED_ARRIVE_DURATION-833.333333)<0.001);
  assert.equal(seatedArriveFrame(0),0);
  assert.equal(seatedArriveFrame(7*1000/24),7,'manifest seat contact is Frame 007');
  assert.equal(seatedArriveFrame(19*1000/24),19,'final neutral handoff is Frame 019');
  assert.equal(seatedArriveFrame(0,true),19,'reduced motion uses the neutral handoff');
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_ARRIVE_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(atlas.readUInt32BE(16),2560);
  assert.equal(atlas.readUInt32BE(20),2048);
});
test('complete observe/think v2 uses all frames and exact wand handoffs',async()=>{
  assert.deepEqual(SEATED_OBSERVE_FRAMES.frames,[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
  assert(Math.abs(SEATED_OBSERVE_DURATION-2416.663)<0.001);
  assert(Math.abs(SEATED_OBSERVE_HANDOFF_MS-2333.33)<0.001);
  assert.equal(seatedObserveFrame(0),0);
  assert.equal(seatedObserveFrame(500),4,'OBSERVE_HOLD begins at Frame 004');
  assert.equal(seatedObserveFrame(1100),6,'the repaired hand rise uses Frame 006');
  assert.equal(seatedObserveFrame(1200),7,'the repaired chin transition uses Frame 007');
  assert.equal(seatedObserveFrame(1833.4),14,'CHOOSE_HOLD begins at Frame 014');
  assert.equal(seatedObserveFrame(SEATED_OBSERVE_HANDOFF_MS+0.01),15,'Frame 015 is the wand handoff');
  assert.equal(seatedObserveFrame(0,true),4);
  assert.equal(seatedObserveDirection(0,4),'left');
  assert.equal(seatedObserveDirection(1,3),'center');
  assert.equal(seatedObserveDirection(3,4),'right');
  const qa=JSON.parse(await readFile(new URL('../shape-friends/assets/new_sparky_sheets/sparky_wall_observe_think_v2/qa-report.json',import.meta.url),'utf8'));
  for(const variant of ['left','center','right']){
    const atlas=await readFile(new URL(`../shape-friends/${seatedObserveSource(variant)}`,import.meta.url));
    assert.equal(atlas.toString('ascii',1,4),'PNG');
    assert.equal(atlas.readUInt32BE(16),2048);assert.equal(atlas.readUInt32BE(20),2048);
    for(const frame of [6,7]){
      const png=await readFile(new URL(`../shape-friends/assets/new_sparky_sheets/sparky_wall_observe_think_v2/${variant}/sparky_wall_observe_think_${variant}_${String(frame).padStart(3,'0')}.png`,import.meta.url));
      assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);
    }
    assert.equal(qa.handoff015PixelIdenticalToWandPick000[variant],true,`${variant} decoded observe handoff must exactly match wand start`);
  }
});
test('wand pick uses supplied directional atlases, release anchor and contact hold',async()=>{
  assert.equal(SEATED_WAND_FRAMES.frames.length,24);
  assert.equal(SEATED_WAND_FRAMES.times.length,24);
  assert(Math.abs(SEATED_WAND_RELEASE_MS-666.666667)<0.001);
  assert(Math.abs(SEATED_WAND_RECOVERY_MS-833.333333)<0.001);
  assert.equal(seatedWandFrame(0),0);
  assert.equal(seatedWandFrame(SEATED_WAND_RELEASE_MS+0.01),10,'Frame 010 releases the independent star');
  assert.equal(seatedWandFrame(1000),14,'Frames 014–016 form the contact-controlled hold');
  assert.equal(seatedWandFrame(10000),14,'the hold cannot expire on a timer');
  assert.equal(seatedWandFrame(1201,1200),17,'card contact releases recovery at Frame 017');
  assert.equal(seatedWandFrame(2032,1200),23,'recovery ends on the neutral Frame 023');
  assert.equal(seatedWandFrame(0,null,true),14);
  assert.equal(seatedWandFrame(0,0,true),23);
  assert.deepEqual(seatedWandTip('left'),[146.029,244.472]);
  assert.deepEqual(seatedWandTip('center'),[148.018,252.018]);
  assert.deepEqual(seatedWandTip('right'),[151.005,259.222]);
  for(const variant of ['left','center','right']){
    const atlas=await readFile(new URL(`../shape-friends/${seatedWandSource(variant)}`,import.meta.url));
    assert.equal(atlas.toString('ascii',1,4),'PNG');
    assert.equal(atlas.readUInt32BE(16),3072);assert.equal(atlas.readUInt32BE(20),2048);
  }
});
test('pair success uses the supplied one-shot joy atlas and voice-controlled hold',async()=>{
  assert.equal(SEATED_JOY_SHEET,'assets/new_sparky_sheets/sparky_wall_pair_joy/sparky_wall_pair_joy_atlas.png');
  assert.equal(SEATED_JOY_FRAMES.frames.length,16);
  assert(Math.abs(SEATED_JOY_DURATION-1750)<0.001);
  assert(Math.abs(SEATED_JOY_RECOVERY_MS-750)<0.001);
  assert.equal(seatedJoyFrame(0),0);
  assert.equal(seatedJoyFrame(666.68),8,'Frame 008 is the happy hold');
  assert.equal(seatedJoyFrame(5000,Infinity),8,'active voice extends the happy hold');
  assert.equal(seatedJoyFrame(1000.01),9,'the normal one-shot enters recovery');
  assert.equal(seatedJoyFrame(1749),15,'the one-shot ends on neutral Frame 015');
  const voiceEnd=seatedJoyEndTime(2200);
  assert.equal(seatedJoyFrame(2199,voiceEnd),8);
  assert.equal(seatedJoyFrame(2200.01,voiceEnd),9,'voice completion releases recovery');
  assert.equal(seatedJoyFrame(0,SEATED_JOY_DURATION,true),8);
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_JOY_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(atlas.readUInt32BE(16),2048);assert.equal(atlas.readUInt32BE(20),2048);
});
test('misses use the supplied gentle reassurance atlas and voice-controlled hold',async()=>{
  assert.equal(SEATED_MISS_SHEET,'assets/new_sparky_sheets/sparky_wall_gentle_miss/sparky_wall_gentle_miss_atlas.png');
  assert.equal(SEATED_MISS_FRAMES.frames.length,16);
  assert(Math.abs(SEATED_MISS_DURATION-1916.666667)<0.001);
  assert(Math.abs(SEATED_MISS_RECOVERY_MS-750)<0.001);
  assert.equal(seatedMissFrame(0),0);
  assert.equal(seatedMissFrame(833.34),10,'Frame 010 is the reassurance hold');
  assert.equal(seatedMissFrame(5000,Infinity),10,'active voice extends reassurance');
  assert.equal(seatedMissFrame(1166.68),11,'the normal one-shot enters recovery');
  assert.equal(seatedMissFrame(1915),15,'the one-shot ends on neutral Frame 015');
  const voiceEnd=seatedMissEndTime(2300);
  assert.equal(seatedMissFrame(2299,voiceEnd),10);
  assert.equal(seatedMissFrame(2300.01,voiceEnd),11,'voice completion releases recovery');
  assert.equal(seatedMissFrame(0,SEATED_MISS_DURATION,true),10);
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_MISS_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(atlas.readUInt32BE(16),2048);assert.equal(atlas.readUInt32BE(20),2048);
});
test('all outcomes use the supplied result intro and permanent friendly hold',async()=>{
  assert.equal(SEATED_RESULT_SHEET,'assets/new_sparky_sheets/sparky_wall_result_reaction/sparky_wall_result_reaction_atlas.png');
  assert.equal(SEATED_RESULT_FRAMES.frames.length,20);
  assert(Math.abs(SEATED_RESULT_HOLD_MS-1291.666667)<0.001);
  assert.equal(seatedResultFrame(0),0);
  assert.equal(seatedResultFrame(250.01),1);
  assert.equal(seatedResultFrame(583.34),9,'Frame 009 is the happy peak');
  assert.equal(seatedResultFrame(1291.67),16,'Frame 016 begins RESULT_HOLD');
  assert.equal(seatedResultFrame(100000),16,'the intro never loops');
  assert.equal(seatedResultFrame(0,true),16,'reduced motion freezes the friendly final pose');
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_RESULT_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(atlas.readUInt32BE(16),2560);assert.equal(atlas.readUInt32BE(20),2048);
});
test('approving nod yes atlas uses its supplied timing and completes neutral handoff',async()=>{
  assert.equal(SEATED_NOD_YES_SHEET,'assets/new_sparky_sheets/sparky_wall_nod_yes/atlas.png');
  assert.equal(SEATED_NOD_YES_FRAMES.frames.length,12);
  assert.equal(SEATED_NOD_YES_DURATION,976);
  assert.equal(seatedNodYesFrame(0),0);
  assert.equal(seatedNodYesFrame(119),0);
  assert.equal(seatedNodYesFrame(120),1);
  assert.equal(seatedNodYesFrame(321),4,'Frame 004 is YES_BEAT');
  assert.equal(seatedNodYesFrame(650),8,'Frame 008 is YES_HOLD');
  assert.equal(seatedNodYesFrame(975),11,'Frame 011 is NEUTRAL_HANDOFF');
  assert.equal(seatedNodYesFrame(1000),11);
  assert.equal(seatedNodYesFrame(0,true),0,'reduced motion freezes neutral frame');
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_NOD_YES_SHEET}`,import.meta.url)).catch(error=>{
    if(error.code==='ENOENT')return null;
    throw error;
  });
  // The yes nod remains an optional asset; the runtime deliberately falls
  // back to pair joy when lightweight builds omit its atlas.
  if(atlas){
    assert.equal(atlas.toString('ascii',1,4),'PNG');
    assert.equal(atlas.readUInt32BE(16),2048);
    assert.equal(atlas.readUInt32BE(20),1536);
  }
});
test('quiet no head shake uses its supplied timing and returns to neutral',async()=>{
  assert.equal(SEATED_NOD_NO_SHEET,'assets/new_sparky_sheets/sparky_wall_nod_no/atlas.png');
  assert.equal(SEATED_NOD_NO_FRAMES.frames.length,12);
  assert.equal(SEATED_NOD_NO_DURATION,1008);
  assert.equal(seatedNodNoFrame(0),0);
  assert.equal(seatedNodNoFrame(119),0);
  assert.equal(seatedNodNoFrame(120),1);
  assert.equal(seatedNodNoFrame(487),6,'Frame 006 is NO_BEAT');
  assert.equal(seatedNodNoFrame(721),9,'Frame 009 is TRY_AGAIN_HOLD');
  assert.equal(seatedNodNoFrame(887),10);
  assert.equal(seatedNodNoFrame(888),11,'Frame 011 is NEUTRAL_HANDOFF');
  assert.equal(seatedNodNoFrame(1200),11);
  assert.equal(seatedNodNoFrame(0,true),0,'reduced motion freezes neutral frame');
  const atlas=await readFile(new URL(`../shape-friends/${SEATED_NOD_NO_SHEET}`,import.meta.url));
  assert.equal(atlas.toString('ascii',1,4),'PNG');
  assert.equal(atlas.readUInt32BE(16),2048);
  assert.equal(atlas.readUInt32BE(20),1536);
  const prompts=await readFile(new URL('../shape-friends/SPARKY_WALL_ANIMATION_PROMPTS.md',import.meta.url),'utf8');
  assert.match(prompts,/## Prompt 11 — Quiet approving nod[\s\S]*?`sparky_wall_nod_yes`/);
  assert.match(prompts,/## Prompt 12 — Quiet gentle “not yet” head shake[\s\S]*?`sparky_wall_nod_no`/);
  assert.match(prompts,/NO_BEAT/);
  assert.match(prompts,/2048×1536/);
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.match(app,/gesture==='nod-no'\)sparky\.nodNo\(\)/,'silent mismatch feedback must use the no head shake');
});
