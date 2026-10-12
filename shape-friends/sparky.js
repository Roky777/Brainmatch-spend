// The user's 4 x 3 kimono sheets keep Sparky's face and costume together.
export const SPARKY_CLIPS = Object.freeze({
  idle: { sheet:'peek', frames:[11,10,11], times:[2400,200,1200], loop:true },
  greeting: { sheet:'expressions', frames:[4,5,6,7,4], times:[220,220,220,250,650], loop:false },
  thinking: { sheet:'expressions', frames:[8,9,10], times:[230,320,900], loop:false },
  // The procedural sleeve supplies the long reach. Keep the base sprite's
  // own glove near his chest, otherwise two pointing hands appear onscreen.
  'present-right': { sheet:'reach', frames:[0,1,1], times:[130,130,830], loop:false },
  happy: { sheet:'reactions', frames:[0,1,2,3,4,5], times:[150,170,190,210,240,800], loop:false },
  'thumbs-up': { sheet:'reactions', frames:[4,5,6,7], times:[170,180,180,400], loop:false },
});
// The approved formal wall-seated idle is a 4 × 4 atlas. Variable holds keep
// the character calm while the middle frames provide one smooth natural blink.
export const SEATED_IDLE_SHEET = 'assets/new_sparky_sheets/sparky_wall_idle_blink_formal_atlas_v1.png';
export const SEATED_TALK_SHEET = 'assets/new_sparky_sheets/sparky_wall_invite_turn/sparky_wall_invite_turn_atlas.png';
export const SEATED_ARRIVE_SHEET = 'assets/new_sparky_sheets/sparky_wall_arrive_settle/sparky_wall_arrive_settle_atlas.png';
export const SEATED_OBSERVE_ROOT = 'assets/new_sparky_sheets/sparky_wall_observe_think_v2';
export const SEATED_WAND_ROOT = 'assets/new_sparky_sheets/sparky_wall_wand_pick';
export const SEATED_JOY_SHEET = 'assets/new_sparky_sheets/sparky_wall_pair_joy/sparky_wall_pair_joy_atlas.png';
export const SEATED_MISS_SHEET = 'assets/new_sparky_sheets/sparky_wall_gentle_miss/sparky_wall_gentle_miss_atlas.png';
export const SEATED_RESULT_SHEET = 'assets/new_sparky_sheets/sparky_wall_result_reaction/sparky_wall_result_reaction_atlas.png';
export const SEATED_NOD_YES_SHEET = 'assets/new_sparky_sheets/sparky_wall_nod_yes/atlas.png';
export const SEATED_NOD_YES_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11],
  times:[120,67,67,67,100,67,67,67,100,67,67,120],
});
export const SEATED_NOD_YES_DURATION=SEATED_NOD_YES_FRAMES.times.reduce((sum,time)=>sum+time,0);
export const SEATED_NOD_NO_SHEET = 'assets/new_sparky_sheets/sparky_wall_nod_no/atlas.png';
export const SEATED_NOD_NO_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11],
  times:[120,67,67,83,67,83,100,67,67,100,67,120],
});
export const SEATED_NOD_NO_DURATION=SEATED_NOD_NO_FRAMES.times.reduce((sum,time)=>sum+time,0);
export const MOUTH_VISEME_ROOT = 'assets/new_sparky_sheets/sparky_wall_mouth_visemes';
export const MOUTH_VISEME_SHEET = `${MOUTH_VISEME_ROOT}/mouth_runtime_atlas.png`;
export const MOUTH_CLEANUP_SHEET = `${MOUTH_VISEME_ROOT}/integration/base_mouth_cleanup.png`;
export const MOUTH_VISEMES = Object.freeze(['REST','MBP','A','E','O','U','FV','LTH','S','SMILE_OPEN','GASP','REST_A_1','REST_A_2','A_O_1','A_O_2','O_REST_1','O_REST_2']);
export const SEATED_IDLE_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  times:[900,120,120,160,140,450,70,42,42,42,84,42,42,42,180,850],
});
// Timings come directly from the corrected supplied manifest. Frame 8 is the
// safe conversational hold; the final seven frames always play as recovery.
export const SEATED_TALK_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  times:[333.333333,83.333333,83.333333,83.333333,83.333333,83.333333,83.333333,125,1000,125,83.333333,83.333333,83.333333,83.333333,125,500],
});
export const SEATED_ARRIVE_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
  times:Array(20).fill(1000/24),
});
export const SEATED_ARRIVE_DURATION=SEATED_ARRIVE_FRAMES.times.reduce((sum,time)=>sum+time,0);
export const SEATED_OBSERVE_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  times:[250,83.333,83.333,83.333,500,83.333,83.333,83.333,125,125,83.333,83.333,83.333,83.333,500,83.333],
});
export const SEATED_OBSERVE_DURATION=SEATED_OBSERVE_FRAMES.times.reduce((sum,time)=>sum+time,0);
export const SEATED_OBSERVE_HANDOFF_MS=SEATED_OBSERVE_FRAMES.times.slice(0,15).reduce((sum,time)=>sum+time,0);
const OBSERVE_VARIANTS=Object.freeze(['left','center','right']);
export function seatedObserveSource(variant) {
  const safe=OBSERVE_VARIANTS.includes(variant)?variant:'center';
  return `${SEATED_OBSERVE_ROOT}/atlas_${safe}.png`;
}
export const SEATED_WAND_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
  times:[250,1000/24,1000/24,1000/24,1000/24,1000/24,1000/12,1000/24,1000/24,1000/24,1000/24,1000/24,1000/24,1000/12,1000/3,1000/3,1000/3,1000/12,1000/24,1000/24,1000/24,1000/24,1000/12,500],
});
export const SEATED_JOY_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  times:[1000/3,1000/24,1000/24,1000/24,1000/24,1000/24,1000/24,1000/12,1000/3,1000/24,1000/24,1000/24,1000/24,1000/12,1000/12,1000/2.4],
});
export const SEATED_JOY_DURATION=SEATED_JOY_FRAMES.times.reduce((sum,time)=>sum+time,0);
export const SEATED_JOY_RECOVERY_MS=SEATED_JOY_FRAMES.times.slice(9).reduce((sum,time)=>sum+time,0);
const SEATED_JOY_HOLD_START_MS=SEATED_JOY_FRAMES.times.slice(0,8).reduce((sum,time)=>sum+time,0);
export const SEATED_MISS_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  times:[1000/3,1000/24,1000/24,1000/24,1000/24,125,1000/24,1000/24,1000/24,1000/12,1000/3,1000/12,1000/12,1000/12,1000/12,1000/2.4],
});
export const SEATED_MISS_DURATION=SEATED_MISS_FRAMES.times.reduce((sum,time)=>sum+time,0);
export const SEATED_MISS_RECOVERY_MS=SEATED_MISS_FRAMES.times.slice(11).reduce((sum,time)=>sum+time,0);
const SEATED_MISS_HOLD_START_MS=SEATED_MISS_FRAMES.times.slice(0,10).reduce((sum,time)=>sum+time,0);
export const SEATED_RESULT_FRAMES = Object.freeze({
  frames:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
  times:[250,1000/24,1000/24,1000/24,1000/24,1000/24,1000/24,1000/24,1000/24,125,1000/12,125,1000/12,1000/12,1000/12,125,500,500,500,1500],
});
export const SEATED_RESULT_HOLD_MS=SEATED_RESULT_FRAMES.times.slice(0,16).reduce((sum,time)=>sum+time,0);
export const SEATED_WAND_RELEASE_MS=SEATED_WAND_FRAMES.times.slice(0,10).reduce((sum,time)=>sum+time,0);
export const SEATED_WAND_RECOVERY_MS=SEATED_WAND_FRAMES.times.slice(17).reduce((sum,time)=>sum+time,0);
const SEATED_WAND_HOLD_MS=SEATED_WAND_FRAMES.times.slice(0,14).reduce((sum,time)=>sum+time,0);
const SEATED_WAND_TIPS=Object.freeze({left:[146.029,244.472],center:[148.018,252.018],right:[151.005,259.222]});
export function seatedWandSource(variant) {
  const safe=OBSERVE_VARIANTS.includes(variant)?variant:'center';
  return `${SEATED_WAND_ROOT}/atlas_${safe}.png`;
}
export function seatedWandTip(variant) {
  return SEATED_WAND_TIPS[OBSERVE_VARIANTS.includes(variant)?variant:'center'];
}
const SEATED_TALK_INTRO_MS=SEATED_TALK_FRAMES.times.slice(0,8).reduce((sum,time)=>sum+time,0);
const SEATED_TALK_RECOVERY_MS=SEATED_TALK_FRAMES.times.slice(9).reduce((sum,time)=>sum+time,0);
function timedFrame(clip,elapsed){
  const total=clip.times.reduce((sum,time)=>sum+time,0);
  let remaining=Math.max(0,elapsed)%total;
  for(let i=0;i<clip.frames.length;i++){if(remaining<clip.times[i])return clip.frames[i];remaining-=clip.times[i];}
  return clip.frames[0];
}
export function seatedIdleFrame(elapsed, reduced=false) {
  if(reduced)return 0;
  return timedFrame(SEATED_IDLE_FRAMES,elapsed);
}
export function seatedArriveFrame(elapsed, reduced=false) {
  if(reduced)return 19;
  return timedFrame(SEATED_ARRIVE_FRAMES,elapsed);
}
export function seatedObserveFrame(elapsed, reduced=false) {
  if(reduced)return 4;
  return timedFrame(SEATED_OBSERVE_FRAMES,elapsed);
}
export function seatedObserveDirection(index,columns) {
  const count=Math.max(1,Number(columns)||1),column=Math.max(0,Number(index)||0)%count;
  if(count===1)return 'center';
  const offset=column-(count-1)/2;
  return Math.abs(offset)<0.5?'center':offset<0?'left':'right';
}
export function seatedWandFrame(elapsed,contactElapsed=null,reduced=false) {
  if(reduced)return contactElapsed===null?14:23;
  if(contactElapsed===null){
    if(elapsed>=SEATED_WAND_HOLD_MS)return 14;
    return timedFrame({frames:SEATED_WAND_FRAMES.frames.slice(0,14),times:SEATED_WAND_FRAMES.times.slice(0,14)},elapsed);
  }
  const recovery={frames:SEATED_WAND_FRAMES.frames.slice(17),times:SEATED_WAND_FRAMES.times.slice(17)};
  return timedFrame(recovery,Math.min(Math.max(0,elapsed-contactElapsed),SEATED_WAND_RECOVERY_MS-0.001));
}
export function seatedJoyFrame(elapsed,duration=SEATED_JOY_DURATION,reduced=false) {
  if(reduced)return 8;
  const intro={frames:SEATED_JOY_FRAMES.frames.slice(0,8),times:SEATED_JOY_FRAMES.times.slice(0,8)};
  const recovery={frames:SEATED_JOY_FRAMES.frames.slice(9),times:SEATED_JOY_FRAMES.times.slice(9)};
  if(elapsed<SEATED_JOY_HOLD_START_MS)return timedFrame(intro,elapsed);
  const recoveryStart=Math.max(SEATED_JOY_HOLD_START_MS,duration-SEATED_JOY_RECOVERY_MS);
  if(elapsed<recoveryStart)return 8;
  return timedFrame(recovery,Math.min(elapsed-recoveryStart,SEATED_JOY_RECOVERY_MS-0.001));
}
export function seatedJoyEndTime(elapsed) {
  return Math.max(elapsed,SEATED_JOY_HOLD_START_MS+120)+SEATED_JOY_RECOVERY_MS;
}
export function seatedMissFrame(elapsed,duration=SEATED_MISS_DURATION,reduced=false) {
  if(reduced)return 10;
  const intro={frames:SEATED_MISS_FRAMES.frames.slice(0,10),times:SEATED_MISS_FRAMES.times.slice(0,10)};
  const recovery={frames:SEATED_MISS_FRAMES.frames.slice(11),times:SEATED_MISS_FRAMES.times.slice(11)};
  if(elapsed<SEATED_MISS_HOLD_START_MS)return timedFrame(intro,elapsed);
  const recoveryStart=Math.max(SEATED_MISS_HOLD_START_MS,duration-SEATED_MISS_RECOVERY_MS);
  if(elapsed<recoveryStart)return 10;
  return timedFrame(recovery,Math.min(elapsed-recoveryStart,SEATED_MISS_RECOVERY_MS-0.001));
}
export function seatedMissEndTime(elapsed) {
  return Math.max(elapsed,SEATED_MISS_HOLD_START_MS+120)+SEATED_MISS_RECOVERY_MS;
}
export function seatedResultFrame(elapsed,reduced=false) {
  if(reduced||elapsed>=SEATED_RESULT_HOLD_MS)return 16;
  return timedFrame({frames:SEATED_RESULT_FRAMES.frames.slice(0,16),times:SEATED_RESULT_FRAMES.times.slice(0,16)},elapsed);
}
export function seatedNodYesFrame(elapsed,reduced=false) {
  if(reduced)return 0;
  if(elapsed>=SEATED_NOD_YES_DURATION)return 11;
  return timedFrame(SEATED_NOD_YES_FRAMES,elapsed);
}
export function seatedNodNoFrame(elapsed,reduced=false) {
  if(reduced)return 0;
  if(elapsed>=SEATED_NOD_NO_DURATION)return 11;
  return timedFrame(SEATED_NOD_NO_FRAMES,elapsed);
}
export function seatedTalkFrame(elapsed, duration=3042, reduced=false) {
  if(reduced)return 0;
  const intro={frames:SEATED_TALK_FRAMES.frames.slice(0,8),times:SEATED_TALK_FRAMES.times.slice(0,8)};
  const recovery={frames:SEATED_TALK_FRAMES.frames.slice(9),times:SEATED_TALK_FRAMES.times.slice(9)};
  const introMs=intro.times.reduce((sum,time)=>sum+time,0);
  const recoveryMs=recovery.times.reduce((sum,time)=>sum+time,0);
  if(elapsed<introMs)return timedFrame(intro,elapsed);
  const recoveryStart=Math.max(introMs,duration-recoveryMs);
  if(elapsed<recoveryStart)return 8;
  return timedFrame(recovery,Math.min(elapsed-recoveryStart,recoveryMs-0.001));
}
export function seatedTalkEndTime(elapsed) {
  return Math.max(elapsed,SEATED_TALK_INTRO_MS+120)+SEATED_TALK_RECOVERY_MS;
}
export function seatedMouthViseme(elapsed, frame, reduced=false) {
  if(reduced||frame>8)return 'REST';
  return ['REST','MBP','E','LTH','A','O','U','FV','S','SMILE_OPEN'][Math.floor(Math.max(0,elapsed)/95)%10];
}
function graphemeViseme(char) {
  if(char==='!')return 'SMILE_OPEN';
  if(char==='?')return 'GASP';
  if(/[mbp]/.test(char))return 'MBP';
  if(/[fv]/.test(char))return 'FV';
  if(/[lthdrn]/.test(char))return 'LTH';
  if(/[szcjxkg]/.test(char))return 'S';
  if(char==='a')return 'A';
  if(/[eiy]/.test(char))return 'E';
  if(char==='o')return 'O';
  if(/[uwq]/.test(char))return 'U';
  return 'REST';
}
export function buildMouthCues(text='',durationMs=0,silences=[]) {
  const words=String(text).toLowerCase().match(/[a-z]+|[!?]/g)||[];
  const target=Math.max(400,Number(durationMs)||String(text).length*72||700);
  const spokenWords=words.filter(word=>/^[a-z]+$/.test(word));
  if(!spokenWords.length)return [{shape:'REST',start:0,end:target}];
  const measured=(Array.isArray(silences)?silences:[])
    .map(([start,end])=>[Math.max(0,Math.min(target,Number(start)||0)),Math.max(0,Math.min(target,Number(end)||0))])
    .filter(([start,end])=>end>start)
    .sort((a,b)=>a[0]-b[0]);
  if(!measured.some(([start])=>start===0))measured.push([0,Math.min(85,target*.04)]);
  if(!measured.some(([,end])=>end>=target-2))measured.push([Math.max(0,target-Math.min(150,target*.06)),target]);
  measured.sort((a,b)=>a[0]-b[0]);
  const quiet=[];
  for(const range of measured){
    const previous=quiet.at(-1);
    if(previous&&range[0]<=previous[1])previous[1]=Math.max(previous[1],range[1]);
    else quiet.push([...range]);
  }
  const windows=[];let cursor=0;
  for(const [start,end] of quiet){if(start>cursor)windows.push([cursor,start]);cursor=Math.max(cursor,end);}
  if(cursor<target)windows.push([cursor,target]);
  const voicedTotal=windows.reduce((sum,[start,end])=>sum+end-start,0);
  if(voicedTotal<1)return [{shape:'REST',start:0,end:target}];
  const totalWeight=spokenWords.reduce((sum,word)=>sum+Math.max(3,word.length),0);
  const projected=[];
  function project(start,end,shape){
    let offset=0;
    for(const [windowStart,windowEnd] of windows){
      const length=windowEnd-windowStart,from=Math.max(start,offset),to=Math.min(end,offset+length);
      if(to>from)projected.push({shape,start:windowStart+from-offset,end:windowStart+to-offset});
      offset+=length;
    }
  }
  let voiceAt=0;
  for(const word of spokenWords){
    const wordDuration=voicedTotal*Math.max(3,word.length)/totalWeight;
    const raw=[];
    for(const char of word){
      const shape=graphemeViseme(char);
      if(shape!=='REST'&&shape!==raw.at(-1))raw.push(shape);
    }
    const vowel=raw.find(shape=>['A','E','O','U'].includes(shape));
    const onset=raw[0]||vowel||'E';
    const beats=[];
    if(['MBP','FV','LTH','S'].includes(onset)&&wordDuration>=240)beats.push(onset);
    beats.push(vowel||onset);
    const ending=raw.at(-1);
    if(wordDuration>=520&&ending&&ending!==beats.at(-1))beats.push(ending);
    const beatDuration=wordDuration/beats.length;
    beats.forEach((shape,index)=>project(voiceAt+index*beatDuration,voiceAt+(index+1)*beatDuration,shape));
    voiceAt+=wordDuration;
  }
  const cues=[];cursor=0;
  for(const cue of projected.sort((a,b)=>a.start-b.start)){
    if(cue.start>cursor)cues.push({shape:'REST',start:cursor,end:cue.start});
    const previous=cues.at(-1);
    if(previous?.shape===cue.shape&&Math.abs(previous.end-cue.start)<1)previous.end=cue.end;
    else cues.push(cue);
    cursor=Math.max(cursor,cue.end);
  }
  if(cursor<target)cues.push({shape:'REST',start:cursor,end:target});
  const punctuation=words.at(-1)==='?'?'GASP':words.at(-1)==='!'?'SMILE_OPEN':null;
  if(punctuation){
    const lastSpoken=[...cues].reverse().find(cue=>cue.shape!=='REST');
    if(lastSpoken){
      const end=lastSpoken.end,start=Math.max(lastSpoken.start,end-140);
      lastSpoken.end=start;cues.push({shape:punctuation,start,end});
    }
  }
  return cues.filter(cue=>cue.end>cue.start).sort((a,b)=>a.start-b.start);
}
export function mouthVisemeAt(elapsed,cues=[]) {
  return cues.find(cue=>elapsed>=cue.start&&elapsed<cue.end)?.shape||'REST';
}
export function mouthVisemePosition(shape) {
  const index=Math.max(0,MOUTH_VISEMES.indexOf(shape));
  return {x:index%5/4*100,y:Math.floor(index/5)/3*100};
}
export function spriteFrame(pose, elapsed, reduced=false) {
  const clip=SPARKY_CLIPS[pose] || SPARKY_CLIPS.idle;
  if(reduced) return {sheet:clip.sheet, frame:pose==='idle'?0:clip.frames.at(-1)};
  const total=clip.times.reduce((a,b)=>a+b,0);
  let remaining=clip.loop ? Math.max(0,elapsed)%total : Math.min(Math.max(0,elapsed),total-1);
  for(let i=0;i<clip.frames.length;i++) { if(remaining<clip.times[i])return {sheet:clip.sheet,frame:clip.frames[i]}; remaining-=clip.times[i]; }
  return {sheet:clip.sheet,frame:clip.frames.at(-1)};
}
export function sparkyArt(){return '<span class="sparky-mini-frame" aria-hidden="true"></span>';}
export class Sparky {
  constructor(element, { seated = false } = {}) {
    this.element=element;this.seated=seated;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.elapsed=0;this.duration=0;this.rate=1;this.paused=false;this.last=performance.now();this.drawn='';this.speechActive=false;this.nodYesAvailable=false;this.nodNoAvailable=false;
    const observeSources=OBSERVE_VARIANTS.map(seatedObserveSource);
    const wandSources=OBSERVE_VARIANTS.map(seatedWandSource);
    const sources=seated?[SEATED_IDLE_SHEET,SEATED_TALK_SHEET,SEATED_ARRIVE_SHEET,SEATED_JOY_SHEET,SEATED_MISS_SHEET,SEATED_RESULT_SHEET,MOUTH_VISEME_SHEET,MOUTH_CLEANUP_SHEET,...observeSources,...wandSources]:['peek','expressions','reach','reactions'].map(sheet=>`assets/sparky/kimono-${sheet}-v1.webp`);
    this.images=sources.map(src=>{const image=new Image();image.src=src;return image;});
    if(seated){
      const yesNodImage=new Image();
      yesNodImage.onload=()=>{this.nodYesAvailable=true;};
      yesNodImage.onerror=()=>{this.nodYesAvailable=false;};
      yesNodImage.src=SEATED_NOD_YES_SHEET;this.images.push(yesNodImage);
      const noNodImage=new Image();
      noNodImage.onload=()=>{this.nodNoAvailable=true;};
      noNodImage.onerror=()=>{this.nodNoAvailable=false;};
      noNodImage.src=SEATED_NOD_NO_SHEET;this.images.push(noNodImage);
    }
    element.replaceChildren();
    if(seated){
      const cleanup=document.createElement('span');cleanup.className='sparky-mouth-cleanup';cleanup.setAttribute('aria-hidden','true');
      const mouth=document.createElement('span');mouth.className='sparky-mouth';mouth.setAttribute('aria-hidden','true');
      element.append(cleanup,mouth);
    }
    this.set('idle');
    this.tick=this.tick.bind(this);this.timer=requestAnimationFrame(this.tick);
  }
  tick(now) {
    const delta=Math.min(100,now-this.last);this.last=now;
    if(!this.paused&&!document.hidden){
      this.elapsed+=delta*this.rate;
      if(this.duration&&this.elapsed>=this.duration)this.set('idle');
      this.paint();
    }
    this.timer=requestAnimationFrame(this.tick);
  }
  paint() {
    if(this.seated){
      const talking=this.pose==='talk',arriving=this.pose==='arrive',observing=this.pose==='observe',wandPicking=this.pose==='wand-pick',joyful=this.pose==='pair-joy',reassuring=this.pose==='gentle-miss',result=this.pose==='result-reaction',noddingYes=this.pose==='nod-yes',noddingNo=this.pose==='nod-no',nodding=noddingYes||noddingNo;
      const frame=talking?seatedTalkFrame(this.elapsed,this.duration,this.reduced.matches):arriving?seatedArriveFrame(this.elapsed,this.reduced.matches):observing?seatedObserveFrame(this.elapsed,this.reduced.matches):wandPicking?seatedWandFrame(this.elapsed,this.wandContactElapsed,this.reduced.matches):joyful?seatedJoyFrame(this.elapsed,this.duration,this.reduced.matches):reassuring?seatedMissFrame(this.elapsed,this.duration,this.reduced.matches):result?seatedResultFrame(this.elapsed,this.reduced.matches):noddingYes?seatedNodYesFrame(this.elapsed,this.reduced.matches):noddingNo?seatedNodNoFrame(this.elapsed,this.reduced.matches):seatedIdleFrame(this.elapsed,this.reduced.matches);
      const sheet=talking?'wall-talk':arriving?'wall-arrive':observing?`wall-observe-${this.observeVariant}`:wandPicking?`wall-wand-${this.wandVariant}`:joyful?'wall-pair-joy':reassuring?'wall-gentle-miss':result?'wall-result-reaction':noddingYes?'wall-nod-yes':noddingNo?'wall-nod-no':'wall-idle-formal';
      const source=talking?SEATED_TALK_SHEET:arriving?SEATED_ARRIVE_SHEET:observing?seatedObserveSource(this.observeVariant,frame):wandPicking?seatedWandSource(this.wandVariant):joyful?SEATED_JOY_SHEET:reassuring?SEATED_MISS_SHEET:result?SEATED_RESULT_SHEET:noddingYes?SEATED_NOD_YES_SHEET:noddingNo?SEATED_NOD_NO_SHEET:SEATED_IDLE_SHEET;
      const columns=arriving||result?5:wandPicking?6:4,rows=nodding?3:4;
      // Lip sync is independent from the body pose: Sparky also speaks while
      // celebrating, reassuring and holding the result pose. Reduced-motion
      // freezes large body movement but keeps these slower speech shapes.
      const mouthActive=this.speechActive&&!nodding;
      const speechTiming=mouthActive&&this.speechClock?this.speechClock():null;
      if(speechTiming&&Number.isFinite(speechTiming.durationMs)&&Math.abs(speechTiming.durationMs-this.mouthCueDuration)>1){
        this.mouthCueDuration=speechTiming.durationMs;this.mouthCues=buildMouthCues(this.mouthText,this.mouthCueDuration,this.mouthSilences);
      }
      const viseme=mouthActive?mouthVisemeAt(speechTiming?.currentMs??this.elapsed,this.mouthCues):'REST';
      if(this.drawn===`${sheet}:${frame}:${viseme}:${mouthActive}`)return;
      this.drawn=`${sheet}:${frame}:${viseme}:${mouthActive}`;
      this.element.style.setProperty('--seated-sheet',`url('${source}')`);
      this.element.style.setProperty('--seated-background-size',`${columns*100}% ${rows*100}%`);
      this.element.style.setProperty('background-position',`${frame%columns/(columns-1)*100}% ${Math.floor(frame/columns)/(rows-1)*100}%`,'important');
      const mouthPosition=mouthVisemePosition(viseme);
      this.element.style.setProperty('--mouth-x',`${mouthPosition.x}%`);this.element.style.setProperty('--mouth-y',`${mouthPosition.y}%`);
      this.element.dataset.sheet=sheet;this.element.dataset.frame=String(frame);this.element.dataset.viseme=viseme;
      this.element.dataset.mouthActive=String(mouthActive);
      return;
    }
    const {sheet,frame}=spriteFrame(this.pose,this.elapsed,this.reduced.matches);
    if(this.drawn===`${sheet}:${frame}`)return;
    this.drawn=`${sheet}:${frame}`;
    this.element.style.setProperty('--sprite-sheet',`url('assets/sparky/kimono-${sheet}-v1.webp')`);
    this.element.style.setProperty('background-position',`${frame%4/3*100}% ${Math.floor(frame/4)/2*100}%`,'important');
    this.element.dataset.sheet=sheet;this.element.dataset.frame=String(frame);
  }
  set(pose,duration=0,rate=1) {
    this.pose=this.seated&&['talk','arrive','observe','wand-pick','pair-joy','gentle-miss','result-reaction','nod-yes','nod-no'].includes(pose)?pose:SPARKY_CLIPS[pose]?pose:'idle';this.elapsed=0;this.duration=duration;
    this.rate=rate;
    this.element.dataset.pose=this.pose;this.paint();
  }
  pause(value){this.paused=value;this.last=performance.now();}
  arrive(){
    if(!this.seated)return 0;
    this.set('arrive',SEATED_ARRIVE_DURATION);return SEATED_ARRIVE_DURATION;
  }
  observe(variant='center'){
    if(!this.seated)return 0;
    this.observeVariant=OBSERVE_VARIANTS.includes(variant)?variant:'center';
    const rate=1.6;this.set('observe',SEATED_OBSERVE_DURATION,rate);return SEATED_OBSERVE_DURATION/rate;
  }
  startWandPick(variant='center'){
    if(!this.seated)return 0;
    this.wandVariant=OBSERVE_VARIANTS.includes(variant)?variant:'center';this.wandContactElapsed=null;
    const rate=1.5;this.set('wand-pick',0,rate);return SEATED_WAND_RELEASE_MS/rate;
  }
  finishWandPick(){
    if(!this.seated||this.pose!=='wand-pick'||this.wandContactElapsed!==null)return 0;
    this.wandContactElapsed=this.elapsed;this.duration=this.elapsed+SEATED_WAND_RECOVERY_MS;this.paint();
    return SEATED_WAND_RECOVERY_MS/this.rate;
  }
  cancelWandPick(){if(this.pose==='wand-pick')this.set('idle');}
  pairJoy(){
    if(!this.seated)return 0;
    this.set('pair-joy',SEATED_JOY_DURATION);return SEATED_JOY_DURATION;
  }
  holdPairJoy(){if(this.seated&&this.pose==='pair-joy')this.duration=Infinity;}
  finishPairJoy(){
    if(!this.seated||this.pose!=='pair-joy')return;
    this.duration=seatedJoyEndTime(this.elapsed);this.paint();
  }
  gentleMiss(){
    if(!this.seated)return 0;
    this.set('gentle-miss',SEATED_MISS_DURATION);return SEATED_MISS_DURATION;
  }
  nodYes(rate=1){
    if(!this.seated||this.speechActive||this.pose==='wand-pick'||this.pose==='result-reaction')return 0;
    if(this.nodYesAvailable){this.set('nod-yes',SEATED_NOD_YES_DURATION,rate);return SEATED_NOD_YES_DURATION/rate;}
    // Lightweight builds may omit the optional nod atlas. Reuse the complete
    // positive-reaction clip instead of leaving Sparky on an empty frame.
    this.set('pair-joy',SEATED_JOY_DURATION,rate);return SEATED_JOY_DURATION/rate;
  }
  nodNo(rate=1){
    if(!this.seated||this.speechActive||this.pose==='wand-pick'||this.pose==='result-reaction')return 0;
    if(this.nodNoAvailable){this.set('nod-no',SEATED_NOD_NO_DURATION,rate);return SEATED_NOD_NO_DURATION/rate;}
    // Keep feedback visible if the optional atlas has not loaded yet.
    this.set('gentle-miss',SEATED_MISS_DURATION,rate);return SEATED_MISS_DURATION/rate;
  }
  holdGentleMiss(){if(this.seated&&this.pose==='gentle-miss')this.duration=Infinity;}
  finishGentleMiss(){
    if(!this.seated||this.pose!=='gentle-miss')return;
    this.duration=seatedMissEndTime(this.elapsed);this.paint();
  }
  resultReaction(){
    if(!this.seated)return;
    // The intro runs once; seatedResultFrame then freezes the identical result
    // hold on Frame 016 for as long as the result screen remains open.
    this.set('result-reaction');
  }
  speak(text='',durationMs=0,clock=null,silences=[]){
    if(!this.seated)return;
    // Audio playback owns the hold. Infinity keeps Frame 008 active until the
    // real clip ends; finishSpeaking then schedules the authored recovery.
    this.startMouth(text,durationMs,clock,silences);this.set('talk',Infinity);
  }
  speakOverCurrentPose(text='',durationMs=0,clock=null,silences=[]){
    if(!this.seated)return;
    this.startMouth(text,durationMs,clock,silences);this.paint();
  }
  startMouth(text='',durationMs=0,clock=null,silences=[]){
    this.mouthText=text;this.mouthCueDuration=durationMs;this.speechClock=clock;
    this.mouthSilences=silences;this.mouthCues=buildMouthCues(text,durationMs,silences);this.speechActive=true;
  }
  finishSpeaking(){
    if(!this.seated)return;
    this.speechActive=false;this.speechClock=null;
    if(this.pose==='talk')this.duration=seatedTalkEndTime(this.elapsed);
    this.paint();
  }
  look(){/* The pointing strip includes a drawn eye glance toward the board. */}
  destroy(){cancelAnimationFrame(this.timer);}
}
