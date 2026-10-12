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
