import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GameAudio,VOICE_CLIPS,VOICE_TIMING} from '../shape-friends/audio.js';
import {Narration} from '../shape-friends/narration.js';
test('Twenty-one generated Sparky cues are nonempty local MP3s',async()=>{
  assert.equal(Object.keys(VOICE_CLIPS).length,21);
  assert.deepEqual(Object.keys(VOICE_TIMING).sort(),Object.keys(VOICE_CLIPS).sort());
  for(const [text,path] of Object.entries(VOICE_CLIPS)){
    assert(text.length>5);assert(path.startsWith('assets/shapepairssparkydialogues/'));
    const bytes=await readFile(new URL('../shape-friends/'+path,import.meta.url));assert(bytes.length>1000);
  }
});
test('challenge mascot tap uses an existing variant-neutral recording',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.match(app,/else \{ say\('Your turn! Which two cards will you try\?','caption',\{kind:'requested'\}\); \}/);
  assert.ok(VOICE_CLIPS['Your turn! Which two cards will you try?']);
  assert.doesNotMatch(app,/say\('Hello, friend!'/);
});
test('Reaction pacing waits only for active local voice, with a bounded tail',()=>{
  const audio=new GameAudio({voice:true},{engine:null});
  assert.equal(audio.remainingMs(),0);
  audio.clip={paused:false,duration:3,currentTime:1};assert.equal(audio.remainingMs(),2000);
  audio.clip.duration=Infinity;assert.equal(audio.remainingMs(),0);
  audio.clip.duration=30;assert.equal(audio.remainingMs(),4000);
  audio.settings.voice=false;assert.equal(audio.remainingMs(),0);
});
test('Sparky never changes to an unrelated system voice',async()=>{
  const spoken=[];
  const engine={cancel(){},getVoices:()=>[{name:'System voice',lang:'en-US'}],speak:line=>spoken.push(line)};
  const audio=new GameAudio({voice:true},{engine,clips:{},utterance:text=>({text})});
  const result=await audio.say('An optional caption-only line.');
  assert.equal(result.started,false);
  assert.equal(spoken.length,0);
});

function deferredClips(){
  const clips=[];
  const createAudio=()=>{
    let resolvePlay,rejectPlay;
    const pending=new Promise((resolve,reject)=>{resolvePlay=resolve;rejectPlay=reject;});
    const clip={paused:true,duration:2,currentTime:0,unloads:0,
      play:()=>pending,pause(){this.paused=true;},removeAttribute(){this.unloads++;},load(){},
      start(){this.paused=false;resolvePlay();},fail(){rejectPlay(Error('network'));}};
    clips.push(clip);return clip;
  };
  return {clips,createAudio};
}
test('a cancelled pending recording cannot start underneath the newer voice',async()=>{
  const {clips,createAudio}=deferredClips();
  let starts=0;
  const audio=new GameAudio({voice:true},{engine:null,clips:{old:'old.mp3',new:'new.mp3'},createAudio});
  const old=audio.say('old',{onStart:()=>starts++});
  const newer=audio.say('new',{onStart:()=>starts++});
  clips[1].start();await Promise.resolve();
  clips[0].start();await Promise.resolve();
  assert.equal(starts,1);assert.equal(clips[0].paused,true);
  assert.ok(clips[0].unloads>0);assert.equal(clips[1].paused,false);
  audio.stop();await Promise.all([old,newer]);
});
test('stopping while a recording downloads also suppresses late media events',async()=>{
  const {clips,createAudio}=deferredClips();
  let starts=0;
  const audio=new GameAudio({voice:true},{engine:{cancel(){throw Error('device');}},clips:{line:'line.mp3'},createAudio});
  const completion=audio.say('line',{onStart:()=>starts++});
  audio.stop();clips[0].start();await Promise.resolve();clips[0].onplaying();
  assert.equal(clips[0].paused,true);assert.equal(starts,0);
  await completion;
});
test('failed media is unloaded before optional device speech begins',async()=>{
  const {clips,createAudio}=deferredClips();
  let line;
  const engine={cancel(){},getVoices:()=>[],speak(value){assert.equal(clips[0].paused,true);assert.ok(clips[0].unloads>0);line=value;}};
  const audio=new GameAudio({voice:true},{engine,clips:{line:'line.mp3'},createAudio,deviceFallback:true,utterance:text=>({text})});
  const completion=audio.say('line');clips[0].fail();await Promise.resolve();await Promise.resolve();
  assert.ok(line);line.onstart();line.onend();await completion;
});
test('first narration waits for decoded mouth artwork before starting playback',async()=>{
  let release,plays=0,starts=0;
  const ready=new Promise(resolve=>{release=resolve;});
  const clip={duration:2,paused:true,currentTime:0,pause(){this.paused=true;},play(){plays++;this.paused=false;return Promise.resolve();}};
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},createAudio:()=>clip,prepareVoice:()=>ready});
  const completion=audio.say('line',{onStart:()=>starts++});
  await Promise.resolve();assert.equal(plays,0);assert.equal(starts,0);
  release(true);await completion.started;
  assert.equal(plays,1);assert.equal(starts,1);
  clip.onended();await completion;
});
test('cancelled mouth preparation cannot start a stale voice',async()=>{
  let release,plays=0;
  const ready=new Promise(resolve=>{release=resolve;});
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},prepareVoice:()=>ready,createAudio:()=>({pause(){},play(){plays++;return Promise.resolve();}})});
  const completion=audio.say('line');audio.stop();release(true);
  await completion;await Promise.resolve();assert.equal(plays,0);
});
test('a stalled download times out and cannot resurrect on late media events',async()=>{
  const {clips,createAudio}=deferredClips();let starts=0;
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},createAudio,startTimeoutMs:20});
  const done=audio.say('line',{onStart:()=>starts++});
  assert.equal((await done).reason,'timeout');assert.equal(audio.clip,null);
  clips[0].start();await Promise.resolve();clips[0].onplaying();
  assert.equal(starts,0);assert.equal(clips[0].paused,true);
});
test('timeout frees the real narration channel for the next requested voice',async()=>{
  const {clips,createAudio}=deferredClips();
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},createAudio,startTimeoutMs:20});
  const flow=new Narration(audio);
  assert.equal((await flow.say('line',{}, {kind:'result'})).reason,'timeout');
  assert.equal(flow.active,null);
  const next=flow.say('line',{}, {kind:'requested'});clips[1].start();await next.started;
  assert.equal(flow.active.text,'line');clips[1].onended();await next;assert.equal(flow.active,null);
});
test('a recording missing its ended event releases mouth and voice ownership',async()=>{
  const {clips,createAudio}=deferredClips();let ends=0;
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},createAudio,playbackTimeoutMs:20});
  const done=audio.say('line',{onEnd:()=>ends++});clips[0].start();
  assert.equal((await done).reason,'timeout');assert.equal(ends,1);assert.equal(audio.clip,null);
  clips[0].onended();assert.equal(ends,1);
});
test('stalled artwork preparation is bounded too',async()=>{
  let plays=0;
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},startTimeoutMs:20,prepareVoice:()=>new Promise(()=>{}),createAudio:()=>({pause(){},play(){plays++;}})});
  assert.equal((await audio.say('line')).reason,'timeout');assert.equal(plays,0);
});
test('a stale reaction is discarded before playback after mouth readiness',async()=>{
  let release,valid=true,plays=0;
  const audio=new GameAudio({voice:true},{engine:null,clips:{line:'line.mp3'},prepareVoice:()=>new Promise(r=>release=r),createAudio:()=>({pause(){},play(){plays++;return Promise.resolve();}})});
  const done=audio.say('line',{canStart:()=>valid});valid=false;release(true);
  assert.equal((await done).reason,'stale');assert.equal(plays,0);
});
