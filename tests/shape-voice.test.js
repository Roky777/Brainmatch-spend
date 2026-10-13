import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GameAudio,VOICE_CLIPS,VOICE_TIMING} from '../shape-friends/audio.js';
test('Twenty-one generated Sparky cues are nonempty local MP3s',async()=>{
  assert.equal(Object.keys(VOICE_CLIPS).length,21);
  assert.deepEqual(Object.keys(VOICE_TIMING).sort(),Object.keys(VOICE_CLIPS).sort());
  for(const [text,path] of Object.entries(VOICE_CLIPS)){
    assert(text.length>5);assert(path.startsWith('assets/shapepairssparkydialogues/'));
    const bytes=await readFile(new URL('../shape-friends/'+path,import.meta.url));assert(bytes.length>1000);
  }
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
