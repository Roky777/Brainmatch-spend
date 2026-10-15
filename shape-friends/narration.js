// Speech is contextual feedback, never an input lock or a backlog of messages.
const priorities={ambient:0,guidance:1,requested:2,result:3};
function silent(reason){const done=Promise.resolve({started:false,reason});done.started=Promise.resolve(null);return done;}
// A miss already says "Your turn". Offer the standalone handoff only on a
// later miss, never as a second sentence immediately after that recording.
export function sparkyVoiceMoment({match,complete=false},spoken){
  if(complete)return null;
  if(match)return spoken.has('sparky-pair')?null:{key:'sparky-pair',text:'I found a pair! My memory worked!'};
  if(!spoken.has('sparky-miss'))return {key:'sparky-miss',text:'Oops, I missed that pair. Your turn!'};
  return spoken.has('child-handoff')?null:{key:'child-handoff',text:'Your turn! Which two cards will you try?'};
}
export class Narration {
  constructor(audio,{now=()=>performance.now(),cooldownMs=4000}={}){
    this.audio=audio;this.now=now;this.cooldownMs=cooldownMs;
    this.active=null;this.serial=0;this.lastSpoken=-Infinity;this.once=new Set();this.lastRequest=-Infinity;
  }
  reset(){this.stop();this.once.clear();this.lastSpoken=-Infinity;this.lastRequest=-Infinity;}
  stop(){this.serial++;const previous=this.active;this.active=null;previous?.finish();this.audio.stop();}
  interruptForAction(){if(this.active?.priority<priorities.result)this.stop();}
  say(text,hooks={}, {kind='guidance',onceKey=null,isCurrent=()=>true}={}){
    const priority=priorities[kind]??priorities.guidance,time=this.now();
    if(onceKey&&this.once.has(onceKey))return silent('already-said');
    if(kind==='requested'&&time-this.lastRequest<1200)return silent('tap-cooldown');
    if(this.active&&(priority<=this.active.priority||priority<priorities.requested))return silent('voice-busy');
    if(priority<=priorities.guidance&&time-this.lastSpoken<this.cooldownMs)return silent('quiet-time');
    if(kind==='requested')this.lastRequest=time;
    if(this.active)this.stop();
    const token=++this.serial;
    let ended=false;
    const finish=()=>{if(ended)return;ended=true;hooks.onEnd?.();this.lastSpoken=this.now();};
    this.active={token,priority,text,finish};
    const completion=this.audio.say(text,{
      canStart:()=>this.active?.token===token&&isCurrent(),
      onStart:meta=>{if(this.active?.token!==token)return;if(!isCurrent()){this.stop();return;}this.lastSpoken=this.now();if(onceKey)this.once.add(onceKey);hooks.onStart?.(meta);},
      onEnd:()=>{if(this.active?.token!==token)return;finish();this.active=null;},
    });
    completion.then(()=>{if(this.active?.token===token)this.active=null;});
    return completion;
  }
}
