import test from 'node:test';
import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import { ALL_ITEMS, CATEGORIES, GAME_CONTENT, PACK, SEASON_PACK, NEON_PACK, ITEMS, SEASON_ITEMS, WORLDS, cardsFor, assetURL, getTheme, validateContentManifest } from '../shape-friends/content.js';
import { MatchBoard, shuffle } from '../shape-friends/engine.js';
import { CompanionMemory } from '../shape-friends/companion.js';
import { emptySave, sanitizeSave, discover, readSave, writeSave } from '../shape-friends/save.js';
import { Timeline } from '../shape-friends/timeline.js';
import { GameAudio } from '../shape-friends/audio.js';

test('the game variant is driven by generalized JSON content',()=>{
  assert.equal(validateContentManifest(GAME_CONTENT),true);
  assert.deepEqual(Object.keys(WORLDS),['dream','seasons','neon']);
  assert.equal(WORLDS.dream.skin,'meadow');
  assert.equal(CATEGORIES.round.name,'Round friends');
  assert.equal(ALL_ITEMS.football.asset,'items-dream/football.webp');
  const variant=structuredClone(GAME_CONTENT);
  variant.variant={...variant.variant,id:'flag-friends',title:'Flag Friends',objective:'Find two cards from the same country.'};
  variant.categories={same_country:{name:'Country friends',detail:'Both belong to the same country.',color:'#4a79c9'}};
  variant.items={};
  for(let i=1;i<=8;i++)variant.items[`flag_${i}`]={name:`Flag ${i}`,asset:`flags/flag-${i}.webp`};
  variant.rounds=[{id:'1',title:'Flag friends',subtitle:'Countries together',pairs:Array.from({length:4},(_,i)=>['same_country',`flag_${i*2+1}`,`flag_${i*2+2}`])}];
  assert.equal(validateContentManifest(variant),true,'a new item/category JSON variant needs no engine changes');
  variant.rounds[0].pairs[0][2]='missing';
  assert.throws(()=>validateContentManifest(variant),/Invalid item pair/);
});

test('Grade 1 GDD: four rounds, four non-identical shape pairs in each', () => {
  assert.equal(PACK.rounds.length, 4);
  for (const round of PACK.rounds) {
    const cards = cardsFor(round);
    assert.equal(cards.length, 8); assert.equal(new Set(cards.map(card => card.id)).size, 8);
    assert.equal(new Set(cards.map(card => card.item)).size, 8);
    assert.deepEqual(round.pairs.map(pair => pair[0]), ['round', 'box', 'cone', 'cylinder']);
    assert(round.pairs.every(([, a, b]) => a !== b && ITEMS[a] && ITEMS[b]));
  }
  assert.deepEqual(PACK.rounds[2].pairs, [['round', 'watermelon', 'ball'], ['box', 'shoebox', 'book'], ['cone', 'icecream', 'birthdaycap'], ['cylinder', 'tumbler', 'waterbottle']]);
});

test('All 18 object IDs resolve to shipped, compact WebP art', async () => {
  assert.equal(Object.keys(ITEMS).length, 18);
  for (const id of Object.keys(ITEMS)) {
    const url = new URL(assetURL(id)); await access(url);
    assert((await stat(url)).size < 90000, `${id} exceeds the card budget`);
  }
});

test('Season Parade is a complete second world with four visual seasons', async () => {
  assert.equal(getTheme('seasons').pack, SEASON_PACK);
  assert.equal(SEASON_PACK.rounds.length, 4);
  for (const round of SEASON_PACK.rounds) {
    const cards=cardsFor(round);
    assert.equal(cards.length,8);
    assert.deepEqual(round.pairs.map(pair=>pair[0]),['round','box','cone','cylinder']);
    assert.equal(new Set(cards.map(card=>card.item)).size,8);
  }
  assert.equal(Object.keys(SEASON_ITEMS).length,16);
  for(const id of Object.keys(SEASON_ITEMS)){
    const url=new URL(assetURL(id));await access(url);
    assert.match(await (await import('node:fs/promises')).readFile(url,'utf8'),/^<svg/);
  }
  for(const file of ['season-parade-bg-v1.webp','season-parade-bg-v2.webp','season-parade-bg-v3.webp','season-parade-bg-v4.webp','season-card-back-v1.webp','season-card-front-v1.webp','season-sparky-cloud-v1.webp']){
    const url=new URL(`../shape-friends/assets/${file}`,import.meta.url);await access(url);
    assert((await stat(url)).size>20000,`${file} must be authored artwork, not a placeholder`);
    assert((await stat(url)).size<180000,`${file} exceeds the runtime image budget`);
  }
  const resultStage=new URL('../shape-friends/assets/season-result-stage-v1.webp',import.meta.url);
  await access(resultStage);
  assert((await stat(resultStage)).size>100000,'season result stage must be authored artwork');
  assert((await stat(resultStage)).size<300000,'season result stage exceeds the runtime image budget');
});

test('Neon Shape Lab is a complete third world with production artwork',async()=>{
  assert.equal(getTheme('neon').pack,NEON_PACK);
  assert.equal(NEON_PACK.rounds.length,4);
  for(const round of NEON_PACK.rounds){
    const cards=cardsFor(round);
    assert.equal(cards.length,8);
    assert.deepEqual(round.pairs.map(pair=>pair[0]),['round','box','cone','cylinder']);
    assert.equal(new Set(cards.map(card=>card.item)).size,8);
  }
  for(const file of ['neon-shape-lab-bg-v2.webp','neon-card-back-v1.webp','neon-card-front-v1.webp','neon-sparky-cloud-v1.webp']){
    const url=new URL(`../shape-friends/assets/${file}`,import.meta.url);await access(url);
    const size=(await stat(url)).size;
    assert(size>50000,`${file} must be authored artwork, not a placeholder`);
    assert(size<300000,`${file} exceeds the runtime image budget`);
  }
});

test('Every legal two-card choice in every round resolves by shape, not identical pictures', () => {
  for (const round of PACK.rounds) for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
    if (a === b) continue;
    const cards = cardsFor(round), board = new MatchBoard(cards, { shuffled: false });
    assert(board.snapshot().every(card => card.card === null));
    assert.equal(board.previewSnapshot().filter(card => card.card).length,8,'the child can study every card before play');
    assert.equal(board.reveal(-1, 'child'), null); assert.equal(board.reveal(a, 'sparky'), null);
    assert(board.reveal(a, 'child')); assert.equal(board.reveal(a, 'child'), null);
    assert.equal(board.snapshot().filter(card => card.card).length, 1);
    assert.equal(board.previewSnapshot().filter(card => card.card).length,1,'the full preview cannot reopen after play starts');
    board.reveal(b, 'child');
    assert.equal(board.reveal((b + 1) % 8, 'child'), null);
    const result = board.resolve(); assert.equal(result.match, cards[a].pairId === cards[b].pairId);
    assert.equal(board.resolve(), null); assert.equal(board.reveal(a, 'child'), null);
    assert(board.advance()); assert.equal(board.actor, result.match ? 'child' : 'sparky'); assert.equal(board.advance(), false);
    assert.equal(board.matched.size, result.match ? 1 : 0);
  }
});

test('200 shuffled rounds finish with match-earned extra turns and observed memory only', () => {
  for (let trial = 0; trial < 200; trial++) {
    const board = new MatchBoard(cardsFor(PACK.rounds[trial % 4]));
    const memory = new CompanionMemory(); let expected = 'child';
    while (board.phase !== 'complete') {
      assert.equal(board.actor, expected);
      const first = board.reveal(memory.chooseFirst(board.available()), board.actor); memory.observe(first);
      const second = board.reveal(memory.chooseSecond(board.available(), first), board.actor); memory.observe(second);
      const result = board.resolve(); if (result.match) memory.removePair(result.pairId);
      if (!result.match) expected = expected === 'child' ? 'sparky' : 'child';
      board.advance(); assert(board.attempts <= 12, 'Observation-driven player should converge.');
    }
    assert.equal(board.matched.size, 4); assert.equal(board.available().length, 0);
    assert.equal(board.history.filter(turn => turn.match).length, 4);
  }
});

test('Companion cannot remember an unseen identity; hints use real observed positions', () => {
  const memory = new CompanionMemory(); assert.equal(memory.hint([0, 1, 2]).type, 'none');
  memory.observe({ index: 6, item: 'football', pairId: 'round' });
  assert.equal(memory.hint([2, 6]).cards[0].index, 6);
  assert.equal(memory.chooseFirst([1, 6], () => .9), 1);
  memory.observe({ index: 1, item: 'beachball', pairId: 'round' });
  assert.deepEqual(memory.knownPair([1, 6]), [6, 1]);
  assert.equal(memory.hint([1, 6], { index: 1, pairId: 'round' }).cards[0].index, 6);
  assert.equal(memory.chooseSecond([1, 6], { index: 1, pairId: 'round' }), 6);
  assert.equal(memory.hint([1, 6, 7], { index: 7, pairId: 'box' }).type, 'none', 'Do not suggest an unrelated pair after the child has selected a card.');
  memory.removePair('round'); assert.equal(memory.seen.size, 0);
});

test('Discovery collection is unique, persistent and robust to unavailable/corrupt storage', () => {
  const save = emptySave();
  for (const round of PACK.rounds) { discover(save, cardsFor(round).map(card => card.item)); save.completed.push(round.id); }
  save.dreamStars=[...save.completed];
  assert.equal(save.discoveries.length, 18);
  assert.equal(discover(save, ['football', 'book']).length, 0);
  assert.deepEqual(sanitizeSave(save), save);
  assert.deepEqual(sanitizeSave({ discoveries: ['bad', 'football', 'football'], completed: ['4'] }).discoveries, ['football']);
  assert.deepEqual(sanitizeSave({ completed: ['4'] }).completed, []);
  const broken = { getItem() { throw Error('private'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(readSave(broken), emptySave()); assert.equal(writeSave(save, broken), false);
  assert.deepEqual(readSave({ getItem: () => '{bad' }), emptySave());
  let value; const storage = { getItem: () => value, setItem: (_, input) => { value = input; } };
  assert(writeSave(save, storage)); assert.deepEqual(readSave(storage), save);
});

test('three completed Dream boards unlock and preserve the Seasons world',()=>{
  const raw={...emptySave(),dreamStars:['1','2','3'],theme:'seasons'};
  const restored=sanitizeSave(raw);
  assert.deepEqual(restored.dreamStars,['1','2','3']);
  assert.equal(restored.theme,'seasons');
  assert.equal(sanitizeSave({...raw,dreamStars:['1','2']}).theme,'dream');
});

test('five completed rounds across worlds unlock and preserve Neon Shape Lab',()=>{
  const raw={...emptySave(),dreamStars:['1','2','3'],seasonStars:['1','2'],theme:'neon'};
  const restored=sanitizeSave(raw);
  assert.deepEqual(restored.seasonStars,['1','2']);
  assert.equal(restored.theme,'neon');
  assert.equal(sanitizeSave({...raw,seasonStars:['1']}).theme,'seasons');
});

test('Shuffle is a copy and always preserves all cards', () => {
  const cards = cardsFor(PACK.rounds[0]), before = JSON.stringify(cards);
  for (let i = 0; i < 100; i++) assert.deepEqual(shuffle(cards).map(card => card.id).sort(), cards.map(card => card.id).sort());
  assert.equal(JSON.stringify(cards), before);
});

test('Cancelled and paused turn timelines never run into a new round', async () => {
  const timeline = new Timeline();
  const old = timeline.wait(10000); timeline.cancel(); assert.equal(await old, false);
  timeline.pause(); let complete = false;
  const pending = timeline.wait(10).then(ok => { complete = ok; });
  await new Promise(resolve => setTimeout(resolve, 30)); assert.equal(complete, false);
  timeline.resume(); await pending; assert.equal(complete, true);
  timeline.pause(); const cancelled = timeline.wait(20); timeline.cancel(); assert.equal(await cancelled, false);
  assert.equal(timeline.tasks.size, 0);
});

test('Opt-in device voice fails gracefully, falls back only once, and respects mute and stale generations', async () => {
  const spoken = [], settings = { voice: true, effects: false };
  const engine = { cancel() {}, getVoices: () => [], speak: line => spoken.push(line.text) };
  let clip;
  const audio = new GameAudio(settings, { engine, clips: { Hello: './missing.wav' }, utterance: text => ({ text }), createAudio: () => (clip = { play: () => Promise.reject(Error('missing')), pause() {} }), deviceFallback: true });
  audio.say('Hello'); clip.onerror(); await Promise.resolve(); assert.deepEqual(spoken, ['Hello']);
  audio.say('Hello'); audio.stop(); await Promise.resolve(); assert.equal(spoken.length, 1);
  settings.voice = false; audio.say('Silent'); assert.equal(spoken.length, 1);
  assert.doesNotThrow(() => new GameAudio({ voice: true }, { engine: null }).say('No engine'));
});

test('Voice animation hooks follow actual media playback lifecycle', async () => {
  const events=[];
  const clip={paused:true,duration:2,currentTime:0,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};
  const audio=new GameAudio({voice:true},{engine:null,clips:{Hello:'./hello.mp3'},createAudio:()=>clip});
  let meta;const completion=audio.say('Hello',{onStart:value=>{meta=value;events.push('start');},onEnd:()=>events.push('end')});
  await Promise.resolve();
  assert.deepEqual(events,['start']);assert.equal(meta.durationMs,2000);
  clip.currentTime=.75;assert.deepEqual(meta.clock(),{currentMs:750,durationMs:2000});
  clip.onended();await completion;assert.deepEqual(events,['start','end']);
  assert.equal(audio.remainingMs(),0);
  audio.say('Hello',{onStart:()=>events.push('start-2'),onEnd:()=>events.push('end-2')});
  await Promise.resolve();audio.stop();
  assert.deepEqual(events,['start','end','start-2','end-2']);
});

test('a newer voice owns the single speech channel and cleanly completes the older one',async()=>{
  const events=[],clips=[];
  const createAudio=()=>{const clip={paused:true,duration:1,currentTime:0,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};clips.push(clip);return clip;};
  const audio=new GameAudio({voice:true},{engine:null,clips:{First:'./first.mp3',Second:'./second.mp3'},createAudio});
  const first=audio.say('First',{onStart:()=>events.push('first-start'),onEnd:()=>events.push('first-end')});
  await first.started;
  const second=audio.say('Second',{onStart:()=>events.push('second-start'),onEnd:()=>events.push('second-end')});
  await first;await second.started;
  assert.equal(clips[0].paused,true,'starting a new line stops the previous media element');
  assert.deepEqual(events,['first-start','first-end','second-start']);
  clips[1].onended();await second;
  assert.deepEqual(events,['first-start','first-end','second-start','second-end']);
});
