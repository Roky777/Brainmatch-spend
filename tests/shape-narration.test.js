import test from 'node:test';
import assert from 'node:assert/strict';
import {Narration,sparkyVoiceMoment} from '../shape-friends/narration.js';

function fixture(){
  let time=0;const calls=[];
  const audio={stop(){},say(text,hooks){let resolve;const done=new Promise(r=>resolve=r);done.started=Promise.resolve(null);calls.push({text,hooks,resolve});return done;}};
  const flow=new Narration(audio,{now:()=>time});
  return {flow,calls,tick(ms){time+=ms;},start(){calls.at(-1).hooks.onStart({});},end(){const c=calls.at(-1);c.hooks.onEnd();c.resolve();}};
}
test('optional narration never interrupts or queues another line',async()=>{
  const f=fixture();f.flow.say('Welcome');f.start();
  assert.equal((await f.flow.say('Praise',{}, {kind:'ambient'})).reason,'voice-busy');
  f.end();f.tick(1000);
  assert.equal((await f.flow.say('Praise',{}, {kind:'ambient'})).reason,'quiet-time');
  assert.equal(f.calls.length,1);
});
test('shorter quiet interval allows useful feedback after four seconds',()=>{
  const f=fixture();f.flow.say('Welcome');f.start();f.end();f.tick(4100);
  f.flow.say('Praise',{}, {kind:'ambient'});assert.equal(f.calls.length,2);
});
test('late reaction callbacks cannot replace a newer body animation',()=>{
  const f=fixture();let current=true,gestures=0;
  f.flow.say('Praise',{onStart(){gestures++;}},{kind:'ambient',isCurrent:()=>current});
  current=false;assert.equal(f.calls[0].hooks.canStart(),false);f.start();
  assert.equal(gestures,0);assert.equal(f.flow.active,null);
});
test('requested help replaces guidance, rapid repeat taps are ignored',async()=>{
  const f=fixture();let cleaned=0;f.flow.say('Welcome',{onEnd(){cleaned++;}});f.start();
  f.flow.say('Hint',{}, {kind:'requested'});assert.equal(cleaned,1);assert.equal(f.calls.length,2);
  assert.equal((await f.flow.say('Hint',{}, {kind:'requested'})).reason,'tap-cooldown');
});
test('navigation cleans once and late callbacks cannot change a newer animation',()=>{
  const f=fixture();let starts=0,ends=0;
  f.flow.say('Old',{onStart(){starts++;},onEnd(){ends++;}});const old=f.calls[0];
  f.flow.stop();f.flow.say('New',{}, {kind:'result'});
  old.hooks.onStart({});old.hooks.onEnd();
  assert.equal(starts,0);assert.equal(ends,1);assert.equal(f.flow.active.text,'New');
});
test('card actions cancel speech, but results survive until navigation',()=>{
  const f=fixture();f.flow.say('Hint',{}, {kind:'requested'});f.flow.interruptForAction();assert.equal(f.flow.active,null);
  f.flow.say('Result',{}, {kind:'result'});f.flow.interruptForAction();assert.equal(f.flow.active.text,'Result');f.flow.stop();assert.equal(f.flow.active,null);
});
test('spoken once keys reset only for a new board',async()=>{
  const f=fixture();f.flow.say('Praise',{}, {kind:'ambient',onceKey:'pair'});f.start();f.end();f.tick(9000);
  assert.equal((await f.flow.say('Praise',{}, {kind:'ambient',onceKey:'pair'})).reason,'already-said');
  f.flow.reset();f.flow.say('Praise',{}, {kind:'ambient',onceKey:'pair'});assert.equal(f.calls.length,2);
});
test('Sparky gets distinct match, miss and later handoff recordings',()=>{
  const spoken=new Set();
  assert.equal(sparkyVoiceMoment({match:true},spoken).text,'I found a pair! My memory worked!');
  assert.equal(sparkyVoiceMoment({match:false},spoken).text,'Oops, I missed that pair. Your turn!');
  spoken.add('sparky-miss');
  assert.equal(sparkyVoiceMoment({match:false},spoken).text,'Your turn! Which two cards will you try?');
  spoken.add('child-handoff');spoken.add('sparky-pair');
  assert.equal(sparkyVoiceMoment({match:false},spoken),null);
  assert.equal(sparkyVoiceMoment({match:true},spoken),null);
});
test('final pair uses result narration, not a competing pair line',()=>{
  assert.equal(sparkyVoiceMoment({match:true,complete:true},new Set()),null);
});
test('companion moments retain cooldown and never exhaust a skipped recording',async()=>{
  const f=fixture();f.flow.say('Welcome');f.start();f.end();
  const cue=sparkyVoiceMoment({match:false},f.flow.once);
  assert.equal((await f.flow.say(cue.text,{}, {kind:'ambient',onceKey:cue.key})).reason,'quiet-time');
  assert.equal(sparkyVoiceMoment({match:false},f.flow.once).key,'sparky-miss');
  f.tick(9000);f.flow.say(cue.text,{}, {kind:'ambient',onceKey:cue.key});f.start();
  assert.equal(sparkyVoiceMoment({match:false},f.flow.once).key,'child-handoff');
  assert.equal((await f.flow.say('Handoff',{}, {kind:'ambient'})).reason,'voice-busy');
});
