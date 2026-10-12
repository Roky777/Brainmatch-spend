import { ITEMS, CATEGORIES, GAME_CONTENT, VARIANT, assetURL, cardsFor, roundById, getWorld, itemFor } from './content.js';
import { MatchBoard, shuffle } from './engine.js';
import { CompanionMemory } from './companion.js';
import { Timeline } from './timeline.js';
import { readSave, writeSave, discover } from './save.js';
import { GameAudio } from './audio.js';
import { MusicLoop } from './music.js';
import { Sparky, sparkyArt, seatedObserveDirection, seatedWandTip } from './sparky.js?v=4';
import { LivingGarden } from './garden.js';
import { Picnic } from './picnic.js';
import { icon } from './art.js';
import { LEVELS, playOptions, resultFor } from './play-options.js';
import { Dialogue } from './dialogue.js';
import { CloudReveal } from './cloud-reveal.js';
import { awardXP, XP_LIMIT, XP_REWARDS } from './xp.js';

const $ = id => document.getElementById(id);
// Board, rim controls and collection drawer form one responsive play object.
document.querySelector('.match-area').append($('discovery-strip'));
$('app').append($('hint'));
// Keep the compact XP HUD anchored to the stage, outside the transformed
// menu-content block that would otherwise pull it over the title.
$('setup-view').append($('xp-meter'));
const save = readSave();
let theme = getWorld(save.theme), pack = theme.pack;
// The child-facing Music control is the single master switch for all non-voice audio.
save.effects = save.music;
const audio = new GameAudio(save), music = new MusicLoop(save), timeline = new Timeline();
const sparky = new Sparky($('sparky'), { seated: true });
$('app').dataset.sparkyReady = 'true';
const menuSparky = new Sparky($('menu-sparky'), { seated: true });
document.querySelector('.mini-sparky').innerHTML = sparkyArt('picnic-sparky');
const garden = new LivingGarden($('living-garden'), { speak: text => say(text), effect: kind => audio.effect(kind), discovered: save.discoveries.filter(id=>ITEMS[id]).length / 2 });
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let board, memory, round, mode = 'match', busy = false, previewing = false, run = 0, started = false, voiceMoments = {};
let matchCount = 0, missCount = 0;
let tapAnimation = null, tapGeometry = null;
// Keep choices readable without turning each reveal into a blocking cutscene.
const BOARD_PREVIEW_HOLD_MS=2200, CARD_REVEAL_HOLD_MS=650, SPARKY_REVEAL_HOLD_MS=480, STAR_TRAVEL_MS=500, RESULT_READ_MS=620, CARD_CLOSE_MS=300, BETWEEN_ACTIONS_MS=100, VOICE_TIMEOUT_MS=6000;
const cloudReveal = new CloudReveal($('cloud-curtain'), $('cloud-veil'));
let options = playOptions(), guideMemory = new CompanionMemory();
const dialogue = new Dialogue();
const artCache=new Map();
const sparkyAnchor=document.querySelector('.sparky-anchor');
const resultCharacterSpace=document.querySelector('.result-character-space');
const difficultyGroups=()=>GAME_CONTENT.play?.difficultyGroups||[];
const picnic = new Picnic($('picnic'), {
  speak: text => say(text, 'picnic-caption'), effect: kind => audio.effect(kind),
  progress: save.gardenWater, onProgress: value => { save.gardenWater = value; persist(); },
});

function persist() { $('save-notice').hidden = writeSave(save); }
function renderXP(award=null) {
  const total=Math.max(0,Math.min(XP_LIMIT,save.xp||0));
  $('xp-value').textContent=String(total);
  $('xp-progress').style.width=`${total/XP_LIMIT*100}%`;
  $('xp-meter').setAttribute('aria-label',`${total} of ${XP_LIMIT} XP earned`);
  if(!award)return;
  $('result-xp').classList.toggle('is-complete',award.complete);
  $('result-xp-earned').textContent=award.earned
    ? `+${award.earned} XP`
    : award.reason==='replay' ? 'XP collected' : 'Journey complete';
  $('result-xp-total').textContent=String(award.total);
  $('result-xp').setAttribute('aria-label',award.earned
    ? `${award.earned} XP earned. ${award.total} of ${XP_LIMIT} total XP.`
    : award.reason==='replay'
      ? `XP already earned for this board and mode. ${award.total} of ${XP_LIMIT} total XP.`
      : `XP journey complete. ${XP_LIMIT} of ${XP_LIMIT} total XP.`);
}
function themeProgress(id = theme.id) { return id === 'neon' ? save.neonStars : id === 'seasons' ? save.seasonStars : save.dreamStars; }
function worldUnlockGoals(){
  const dreamRounds=getWorld('dream').pack.rounds.length;
  const seasonRounds=getWorld('seasons').pack.rounds.length;
  return {seasons:Math.min(3,dreamRounds),neon:Math.min(5,dreamRounds+seasonRounds)};
}
function themeUnlocked(id) {
  const goals=worldUnlockGoals();
  if(id==='dream')return true;
  if(id==='seasons')return save.dreamStars.length>=goals.seasons;
  return id==='neon'&&save.dreamStars.length+save.seasonStars.length>=goals.neon;
}
function nextRoundId() {
  const group=difficultyGroups().find(item=>item.id===options.level&&item.rounds.includes(round?.id));
  if(group){
    const index=group.rounds.indexOf(round.id);
    return group.rounds[(index+1)%group.rounds.length];
  }
  const index = pack.rounds.findIndex(item => item.id === round?.id);
  return pack.rounds[(index + 1) % pack.rounds.length]?.id || '1';
}
function applyTheme() {
  theme = getWorld(save.theme); pack = theme.pack;
  document.body.dataset.theme = theme.id; $('app').dataset.theme = theme.id;
  document.title = `${pack.title} · Dream Brainmatch`;
  document.body.dataset.variant = VARIANT.id;
  document.querySelector('#app > h1').textContent = pack.title;
  document.querySelector('.sparky-seat-cloud').src = new URL(`./assets/${theme.cloudAsset}`, import.meta.url).href;
  $('setup-title').innerHTML = `${theme.menuTitleLines.join('<br>')}<span aria-hidden="true">✦</span>`;
  document.querySelector('.setup-kicker').textContent = theme.menuKicker;
  $('level-objective').textContent = pack.objective;
  $('menu-caption').textContent = VARIANT.menuGreeting||'Welcome, friend! Let’s find matching pairs together.';
  document.querySelector('.xp-rules').textContent=`First clear in each mode · Practice ${XP_REWARDS.practice} · Beat Sparky ${XP_REWARDS.challenge}`;
  $('play-again').querySelector('span').textContent=difficultyGroups().length?'Next board':GAME_CONTENT.play?.fixedPairs?'Next level':'Play again';
  $('theme-open').setAttribute('aria-label', `Change world. Current world: ${theme.title}`);
  $('theme-open-label').textContent = 'Worlds';
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    const id = button.dataset.themeChoice, unlocked = themeUnlocked(id), active = id === theme.id;
    const world=getWorld(id);
    button.querySelector('.theme-copy strong').textContent=world.name;
    button.querySelector('.theme-copy small').textContent=world.description;
    button.classList.toggle('is-locked', !unlocked); button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active)); button.setAttribute('aria-disabled', String(!unlocked));
    const goals=worldUnlockGoals();
    const left = id === 'neon' ? Math.max(0,goals.neon-save.dreamStars.length-save.seasonStars.length) : Math.max(0,goals.seasons-save.dreamStars.length);
    button.querySelector('.theme-status').textContent = active ? 'Playing here' : unlocked ? 'Visit world' : `${left} more ${left===1?'match':'matches'}`;
  });
  const goals=worldUnlockGoals(),neonLeft=Math.max(0,goals.neon-save.dreamStars.length-save.seasonStars.length);
  $('theme-dialog-message').textContent = themeUnlocked('neon')
    ? 'Pick a world. You can come back whenever you like.'
    : themeUnlocked('seasons') ? `${neonLeft} more ${neonLeft===1?'match':'matches'} will light up the Neon Lab.` : `Play ${goals.seasons} ${goals.seasons===1?'match':'matches'} to open Season Parade.`;
}
function preloadArt(item) {
  const src=assetURL(item);
  if(!artCache.has(src))artCache.set(src,new Promise(resolve=>{
    const image=new Image();
    image.onload=async()=>{try{await image.decode?.();}catch{}resolve(image.naturalWidth>0);};
    image.onerror=()=>resolve(false);image.src=src;
  }));
  return artCache.get(src);
}
function activateAudio() {
  started = true;
  audio.unlock();
  music.sync(!document.hidden && !$('settings-dialog').open);
  music.activate();
}
function say(text, destination = 'caption') {
  $(destination).textContent = text;
  return speakLine(sparky,text);
}
function speakLine(speaker,text) {
  return started?audio.say(text,{onStart:meta=>{music.setDucked(true);speaker.speak(text,meta.durationMs,meta.clock,meta.silences);},onEnd:()=>{speaker.finishSpeaking();music.setDucked(false);}}):Promise.resolve({started:false,reason:'locked'});
}
function narrateNow(key,{first=1,every=0}={}) {
  const count=(voiceMoments[key]||0)+1;voiceMoments[key]=count;
  return count<=first||(every>0&&(count-first)%every===0);
}
function celebratePair(text,voiced=true,gesture='joy') {
  $('caption').textContent=text;
  if(!voiced||!started||!save.voice){
    if(gesture==='nod')sparky.nodYes();
    else sparky.pairJoy();
    return Promise.resolve({started:false,reason:'silent'});
  }
  let began=false;
  const completion=audio.say(text,{onStart:meta=>{began=true;music.setDucked(true);sparky.pairJoy();sparky.holdPairJoy();sparky.speakOverCurrentPose(text,meta.durationMs,meta.clock,meta.silences);},onEnd:()=>{sparky.finishSpeaking();sparky.finishPairJoy();music.setDucked(false);}});
  completion.then(()=>{if(!began)sparky.pairJoy();});return completion;
}
function reassureMiss(text,voiced=true,gesture='miss') {
  $('caption').textContent=text;
  if(!voiced||!started||!save.voice){
    if(gesture==='nod-no')sparky.nodNo();
    else sparky.gentleMiss();
    return Promise.resolve({started:false,reason:'silent'});
  }
  let began=false;
  const completion=audio.say(text,{onStart:meta=>{began=true;music.setDucked(true);sparky.gentleMiss();sparky.holdGentleMiss();sparky.speakOverCurrentPose(text,meta.durationMs,meta.clock,meta.silences);},onEnd:()=>{sparky.finishSpeaking();sparky.finishGentleMiss();music.setDucked(false);}});
  completion.then(()=>{if(!began)sparky.gentleMiss();});return completion;
}
function announceResult(text) {
  $('caption').textContent=text;
  sparky.resultReaction();
  if(started)audio.say(text,{onStart:meta=>{music.setDucked(true);sparky.speakOverCurrentPose(text,meta.durationMs,meta.clock,meta.silences);},onEnd:()=>{sparky.finishSpeaking();music.setDucked(false);}});
}
function updatePause() {
  const paused = document.hidden || $('settings-dialog').open || mode === 'explore' || mode === 'setup';
  music.sync(!document.hidden && !$('settings-dialog').open);
  sparky.pause(paused);
  menuSparky.pause(document.hidden || $('settings-dialog').open || mode !== 'setup');
  if (tapAnimation) paused ? tapAnimation.pause() : tapAnimation.play();
  if (paused) { timeline.pause(); audio.stop(); } else timeline.resume();
}
async function wait(ms, ticket = run) { return await timeline.wait(ms) && ticket === run; }
async function waitForVoice(completion,ticket=run) {
  if(!completion)return ticket===run;
  let timeout;
  const timedOut=new Promise(resolve=>{timeout=setTimeout(()=>resolve('timeout'),VOICE_TIMEOUT_MS);});
  const outcome=await Promise.race([completion.then(()=> 'ended'),timedOut]);clearTimeout(timeout);
  if(ticket!==run)return false;
  // A broken device speech engine must never trap a turn indefinitely.
  if(outcome==='timeout'){audio.stop();await Promise.resolve();}
  return ticket===run;
}
function clearPointer() {
  tapAnimation?.cancel(); tapAnimation = null;
  tapGeometry = null;
  $('cast-star').classList.remove('visible', 'contact');
  $('cards').querySelectorAll('.targeted').forEach(node => node.classList.remove('targeted'));
}
function resetHintFeedback() {
  $('cards').querySelectorAll('.hinted').forEach(node => node.classList.remove('hinted'));
  const button = $('hint');
  button.classList.remove('is-helping', 'needs-more');
  button.querySelector('span').textContent = 'Hint';
  button.setAttribute('aria-label', 'Help me remember');
}
function clearEffects() {
  clearPointer(); $('effects-layer').replaceChildren(); $('pair-celebration').hidden = true;
  resetHintFeedback();
  $('cards').querySelectorAll('.just-matched').forEach(node => node.classList.remove('just-matched'));
}
function burstAtCard(index, matched = false) {
  if (reduced.matches) return;
  const card = $('cards').children[index];
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const burst = document.createElement('span');
  burst.className = `card-burst${matched ? ' card-burst--match' : ''}`;
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;
  burst.style.setProperty('--burst-size', `${Math.min(rect.width, rect.height)}px`);
  for (let i = 0; i < (matched ? 7 : 4); i++) {
    const star = document.createElement('i');
    star.style.setProperty('--angle', `${(i * 360 / (matched ? 7 : 4) - 35)}deg`);
    burst.append(star);
  }
  $('effects-layer').append(burst);
  burst.addEventListener('animationend', event => {
    if (event.target === burst) burst.remove();
  });
}
function hideCloudCurtain() {
  cloudReveal.cancel();
  $('app').classList.remove('is-unveiling');
}
function unveilBoard() {
  hideCloudCurtain();
  if (reduced.matches) return;
  const rect = $('cards').getBoundingClientRect();
  const focus = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  $('app').classList.add('is-unveiling');
  cloudReveal.start(focus, hideCloudCurtain);
}
function unlocked(id) {
  if(difficultyGroups().length)return Boolean(roundById(id,pack));
  const index = pack.rounds.findIndex(item => item.id === id);
  return index === 0 || themeProgress().includes(pack.rounds[index - 1].id);
}
function dockSparkyAtBoard(){
  if(sparkyAnchor.parentElement!==$('play-layout'))$('result-view').after(sparkyAnchor);
  $('sparky').removeAttribute('tabindex');
}
function dockSparkyAtResult(){
  if(sparkyAnchor.parentElement!==resultCharacterSpace)resultCharacterSpace.append(sparkyAnchor);
  $('sparky').tabIndex=-1;
}
function startRound(id) {
  const enteringPlay = mode !== 'match';
  if (!roundById(id, pack) || !unlocked(id)) id = '1';
  run++; timeline.cancel(); audio.stop(); clearEffects(); picnic.cancelDrag();
  round = roundById(id, pack);
  const fixedPairs=GAME_CONTENT.play?.fixedPairs===true;
  const groupedDifficulties=difficultyGroups().length>0;
  const level = fixedPairs&&!groupedDifficulties
    ? {pairs:round.pairs.length,capacity:Math.max(2,Math.ceil(round.pairs.length*.6)),accuracy:.44}
    : LEVELS[options.level];
  const pairPool=GAME_CONTENT.play?.shufflePairs
    ? shuffle(round.pairs.map(pair=>({pair}))).map(entry=>entry.pair)
    : round.pairs;
  const activePairs=pairPool.slice(0, level.pairs);
  board = new MatchBoard(cardsFor({ pairs: activePairs }), { mode: options.mode });
  memory = new CompanionMemory({ capacity: level.capacity, accuracy: level.accuracy }); guideMemory = new CompanionMemory();
  // Decode all possible round art away from the DOM. Hidden card positions and
  // identities remain private, but a selected card never opens onto white.
  const artReady=Promise.all([...new Set(cardsFor({pairs:activePairs}).map(card=>card.item))].map(preloadArt));
  mode = 'match'; busy = enteringPlay; previewing=false; voiceMoments={}; matchCount=0; missCount=0; save.activeRound = id; persist();
  dockSparkyAtBoard();
  $('setup-view').hidden = true; $('result-view').hidden = true;
  document.querySelector('.match-area').hidden = false;
  $('app').dataset.playMode = options.mode;
  $('app').dataset.theme = theme.id;
  $('app').dataset.level = fixedPairs&&!groupedDifficulties?'clever':options.level;
  $('app').dataset.pairs = String(level.pairs);
  $('cards').style.setProperty('--columns', level.pairs === 3 ? '3' : level.pairs === 2 ? '2' : '4');
  $('cards').setAttribute('aria-label', `${board.size} memory cards. ${pack.objective}`);
  $('app').dataset.mode = mode; $('play-layout').hidden = false; $('discovery-strip').hidden = GAME_CONTENT.features?.picnic===false||theme.id !== 'dream';
  $('explore-view').hidden = true; $('chapter-number').textContent = id.padStart(2, '0');
  $('chapter-title').textContent = round.title;
  $('cards').innerHTML = Array.from({ length: board.size }, (_, index) => `<button class="memory-card" type="button" data-index="${index}" aria-label="Hidden card ${index + 1}"><span class="card-inner"><span class="card-face card-back" aria-hidden="true"><span class="card-emblem"><svg viewBox="0 0 60 60"><path d="M30 9c4 11 12 15 20 17-10 4-17 10-20 24-4-12-10-20-20-24 11-3 17-9 20-17Z"/><circle cx="46" cy="10" r="3"/><circle cx="11" cy="46" r="2"/></svg></span></span><span class="card-face card-front" aria-hidden="true"></span></span><span class="match-check" hidden aria-hidden="true">✓</span></button>`).join('');
  renderBoard(); renderTray(); updatePause();
  $('cards').querySelectorAll('.card-emblem').forEach(el => { el.innerHTML = icon('star'); });
  const openingLine=enteringPlay && id !== '1'
    ? 'A new board! You get the first pick.'
    : dialogue.next(options.mode);
  if(enteringPlay){
    $('caption').textContent=openingLine;
    const ticket=run,arrivalMs=sparky.arrive();
    void (async()=>{
      if(!await wait(arrivalMs,ticket)||mode!=='match')return;
      const welcomeVoice=speakLine(sparky,openingLine);
      if(!await waitForVoice(welcomeVoice,ticket)||mode!=='match')return;
      await artReady;
      if(ticket!==run||mode!=='match')return;
      previewing=true;$('caption').textContent='Take a good look!';renderBoard();
      if(!await wait(BOARD_PREVIEW_HOLD_MS,ticket)||mode!=='match')return;
      previewing=false;$('caption').textContent=VARIANT.matchPrompt||'Now find the matching pairs!';renderBoard();
      if(!await wait(reduced.matches?0:CARD_CLOSE_MS,ticket)||mode!=='match')return;
      busy=false;renderBoard();
    })();
  }else say(openingLine);
  if (enteringPlay) unveilBoard();
}
function renderBoard() {
  const canPlay = board.actor === 'child' && board.phase === 'ready' && !busy && mode === 'match';
  const gettingReady = busy && board.actor === 'child' && board.phase === 'ready' && !board.history.length;
  const snapshot=previewing?board.previewSnapshot():board.snapshot();
  snapshot.forEach(({ index, matched, visible, card }) => {
    const button = $('cards').children[index], front = button.querySelector('.card-front');
    const shown=visible||previewing;
    button.classList.toggle('is-open', shown); button.classList.toggle('is-previewing', previewing); button.classList.toggle('is-matched', matched);
    button.disabled = !canPlay || shown;
    button.setAttribute('aria-label', shown ? `${itemFor(card.item).name}${matched ? ', matched' : previewing ? ', preview card' : ', face up'}. Card ${index + 1}` : `Hidden card ${index + 1}`);
    button.querySelector('.match-check').hidden = !matched;
    // Normal play keeps unseen identities private. The child-facing opening
    // preview deliberately renders every card without teaching Sparky's AI.
    if (shown && !front.firstChild) {
      const img = new Image();
      front.classList.add('is-loading');img.alt='';img.draggable=false;img.hidden=true;
      const show=()=>{
        if(!front.contains(img)||!(board.snapshot()[index].visible||previewing))return;
        img.hidden=false;front.classList.remove('is-loading','load-failed');
      };
      img.onload=async()=>{try{await img.decode?.();}catch{}show();};
      img.onerror=()=>front.classList.replace('is-loading','load-failed');
      front.append(img);img.src=assetURL(card.item);
      if(img.complete&&img.naturalWidth)show();
    } else if (!shown) {
      // Retain previously observed art through the closing half of the flip only.
      const ticket = run;
      timeline.wait(210).then(ok => {
        if(ok&&ticket===run&&!board.snapshot()[index].visible&&!previewing){front.replaceChildren();front.classList.remove('is-loading','load-failed');}
      });
    }
  });
  $('turn-chip').dataset.actor = board.actor;
  $('turn-chip').classList.toggle('is-waiting', gettingReady);
  $('cards').setAttribute('aria-busy', String(gettingReady));
  const bonus = board.mode === 'challenge' && board.history.at(-1)?.match;
  $('turn-chip').querySelector('strong').textContent = previewing ? 'Look closely…' : gettingReady ? 'Getting ready…' : board.phase === 'complete' ? 'We did it!' : board.actor === 'child' ? (bonus ? 'You go again!' : 'Your turn!') : (bonus ? 'Sparky goes again!' : 'Sparky’s turn!');
  $('pair-progress').innerHTML = Array.from({ length: board.pairCount }, (_, i) => `<i class="${i < board.matched.size ? 'found' : ''}"></i>`).join('');
  $('pair-progress').setAttribute('aria-label', `${board.matched.size} of ${board.pairCount} pairs found`);
  $('pair-progress').hidden = options.mode === 'challenge';
  $('match-score').hidden = options.mode !== 'challenge';
  if (options.mode === 'challenge') {
    const { child, sparky: sparkyScore } = board.scores;
    $('match-score').innerHTML = `<span><small>You</small><strong>${child}</strong></span><i aria-hidden="true"></i><span><small>Sparky</small><strong>${sparkyScore}</strong></span>`;
    $('match-score').setAttribute('aria-label', `Score: You ${child}, Sparky ${sparkyScore}`);
  } else {
    $('match-score').replaceChildren();
    $('match-score').removeAttribute('aria-label');
  }
  $('hint').disabled = !canPlay;
  $('visit-picnic').hidden = theme.id !== 'dream' || !save.discoveries.some(id=>ITEMS[id]) || mode !== 'match';
  $('visit-picnic').disabled = !canPlay;
}
function renderTray() {
  const dreamDiscoveries=save.discoveries.filter(id=>ITEMS[id]);
  const count = dreamDiscoveries.length;
  $('discovery-count').textContent = count ? `${count} picnic ${count === 1 ? 'discovery' : 'discoveries'}` : 'Let’s fill our picnic!';
  $('basket-count').hidden = !count; $('basket-count').textContent = count;
  $('picnic-basket').setAttribute('aria-label', count ? `Play with our ${count} picnic discoveries` : 'Our picnic basket. Find a pair to fill it!');
  const max = 3;
  $('discovery-tray').innerHTML = dreamDiscoveries.slice(-max).map(id => `<button class="tray-item" data-discovery="${id}" type="button" aria-label="Visit our picnic with ${itemFor(id).name}"><img src="${assetURL(id)}" alt=""></button>`).join('');
}
function reveal(index, actor) {
  const observation = board.reveal(index, actor);
  if (!observation) return null;
  memory.observe(observation); guideMemory.observe(observation); audio.effect('flip'); renderBoard();
  return observation;
}
async function childFlip(index) {
  if (busy || timeline.paused || mode !== 'match' || board.actor !== 'child') return;
  activateAudio();
  resetHintFeedback();
  const observation = reveal(index, 'child'); if (!observation) return;
  if (board.open.length !== 1) {
    busy = true; renderBoard(); await resolveTurn(run,{settleMs:CARD_REVEAL_HOLD_MS});
  }
}
async function resolveTurn(ticket,{settleMs=CARD_REVEAL_HOLD_MS}={}) {
  if (!await wait(settleMs, ticket)) return;
  const result = board.resolve(); if (!result) return;
  let reactionVoiced=false;
  let gestureUsed=null;
  if (result.match) {
    memory.removePair(result.pairId);
    guideMemory.removePair(result.pairId);
    discover(save, result.items); persist();
    garden.grow();
    audio.effect('match');
    matchCount++;
    // Alternating cadence: Match 1 is voiced, Match 2 nods, Match 3 is voiced, Match 4 nods...
    // The game never stays silent, and never repeats speech back-to-back.
    const matchSpoken = (matchCount % 2 === 1);
    const voiced=reactionVoiced=result.actor==='child'
      ? (narrateNow('child-match',{first:1}) || matchSpoken)
      : false;
    const gesture=gestureUsed=result.actor==='child' ? (voiced ? 'joy' : 'nod') : (voiced ? 'joy' : 'nod');
    const reaction=result.actor==='child'
      ? (voiced?dialogue.next('match'):'You found a pair!')
      : (voiced?dialogue.next('sparkyMatch'):'Sparky found a pair.');
    celebratePair(reaction,voiced,gesture);
    $('pair-celebration').textContent = CATEGORIES[result.pairId].name;
    $('pair-celebration').hidden = false; renderTray();
    result.indices.forEach(index => {
      const card = $('cards').children[index];
      card.classList.remove('just-matched');
      void card.offsetWidth;
      card.classList.add('just-matched');
      burstAtCard(index, true);
    });
  } else {
    missCount++;
    const missSpoken = (missCount % 2 === 1);
    const event=result.actor==='child'?'miss':'sparkyMiss';
    const voiced=reactionVoiced=result.actor==='child'
      ? (narrateNow('child-miss',{first:1}) || missSpoken)
      : false;
    // On subsequent non-matches, gently shake “not yet” as acknowledgement
    // without repeating speech or holding the board.
    const gesture=gestureUsed=result.actor==='child' ? (voiced ? 'miss' : 'nod-no') : 'miss';
    reassureMiss(voiced?dialogue.next(event):(result.actor==='child'?'Try another pair.':'Sparky will try again later.'),voiced,gesture);
  }
  renderBoard();
  // Speech and character acting are ambient feedback, not an input lock. The
  // child can continue after this short, consistent result-reading window.
  if(!await wait(RESULT_READ_MS,ticket))return;
  clearEffects(); board.advance(); renderBoard();
  // Release input as soon as the closing flip is visually understandable.
  if (!await wait(CARD_CLOSE_MS, ticket)) return;
  if (board.phase === 'complete') { finishRound(); return; }
  busy = false; renderBoard();
  if (board.actor === 'sparky') await sparkyTurn(ticket,{quiet:reactionVoiced});
  else {
    $('caption').textContent='Your turn!';
  }
}
function drawStar(progress) {
  if (!tapGeometry) return;
  const { from, to, curve } = tapGeometry, p = progress;
  const at = {
    x: (1-p)**2*from.x + 2*(1-p)*p*curve.x + p*p*to.x,
    y: (1-p)**2*from.y + 2*(1-p)*p*curve.y + p*p*to.y,
  };
  const star = $('cast-star');
  star.style.left = `${at.x}px`; star.style.top = `${at.y}px`;
  star.style.opacity = String(Math.min(1, (p + .06) * 5));
  star.style.transform = `translate(-50%,-50%) rotate(${p*390}deg) scale(${.55 + .5*Math.sin(Math.PI*p)})`;
}
function moveStar(from, to, duration) {
  let elapsed = 0, last = performance.now(), paused = false, finished = false, frame, done;
  const promise = new Promise(resolve => { done = resolve; });
  const tick = now => {
    if (finished) return;
    if (!paused) {
      elapsed += Math.min(100, now-last);
      const t = Math.min(1, elapsed/duration), smooth = t*t*(3-2*t);
      drawStar(from+(to-from)*smooth);
      if (t >= 1) { finished = true; done(true); return; }
    }
    last = now; frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return {
    finished: promise,
    pause() { paused = true; },
    play() { paused = false; last = performance.now(); },
    cancel() { if (!finished) { finished = true; cancelAnimationFrame(frame); done(false); } },
  };
}
async function tapAt(index, ticket, onContact) {
  clearPointer();
  const columns=board.pairCount===2?2:board.pairCount===3?3:4;
  const direction=seatedObserveDirection(index,columns),target=$('cards').children[index];
  if (reduced.matches || getComputedStyle($('cast-star')).display === 'none') {
    target.classList.add('targeted');const observation=onContact?.();
    if(!await wait(reduced.matches ? 20 : 250,ticket))return false;
    return {observation,direction};
  }
  const releaseMs=sparky.startWandPick(direction);
  // Step just beyond the fractional frame boundary so Frame 010 is already
  // painted before the independent star appears.
  if(!await wait(releaseMs+1,ticket)){sparky.cancelWandPick();return false;}
  const rect = target.getBoundingClientRect();
  const character = $('sparky').getBoundingClientRect();
  // Spawn exactly once at Frame 010's measured per-variant wand-tip anchor.
  const [tipX,tipY]=seatedWandTip(direction);
  const from = {x:character.left+character.width*tipX/512,y:character.top+character.height*tipY/512};
  const to = {x:rect.left+rect.width*.5,y:rect.top+rect.height*.5};
  tapGeometry = {from,to,curve:{x:(from.x+to.x)/2,y:(from.y+to.y)/2-Math.min(70,Math.hypot(to.x-from.x,to.y-from.y)*.2)}};
  drawStar(0); $('cast-star').classList.add('visible');
  tapAnimation = moveStar(0, 1, STAR_TRAVEL_MS);
  if (!await tapAnimation.finished || ticket !== run){sparky.cancelWandPick();return false;}
  target.classList.add('targeted'); $('cast-star').classList.add('contact'); burstAtCard(index);
  const observation=onContact?.(),recoveryMs=sparky.finishWandPick();
  if(!await wait(recoveryMs,ticket)){sparky.cancelWandPick();return false;}
  clearPointer();
  if(!await wait(BETWEEN_ACTIONS_MS,ticket))return false;
  return {observation,direction};
}
async function sparkyTurn(ticket,{quiet=false}={}) {
  busy = true; renderBoard();
  const introduce=!quiet&&narrateNow('sparky-turn',{first:1});
  const turnVoice=introduce?say('My turn! Let me think... I’ll try this one.'):(($('caption').textContent='Sparky is thinking…'),Promise.resolve({started:false,reason:'not-needed'}));
  // The thought line may continue while the visible choice begins; it never
  // holds the whole board hostage.
  void turnVoice;
  if (!await wait(240, ticket)) return;
  if(!await wait(BETWEEN_ACTIONS_MS,ticket))return;
  // Sparky is a learning companion, not an optimal bot. When he gets ahead he
  // becomes even more forgetful, keeping the match playful for a young child.
  const recall=memory.accuracy*(board.scores.sparky>board.scores.child ? .55 : 1);
  const firstIndex = memory.chooseFirst(board.available(),Math.random,recall);
  const firstTap=await tapAt(firstIndex,ticket,()=>reveal(firstIndex,'sparky'));
  if(!firstTap||!firstTap.observation)return;
  const first=firstTap.observation;
  const secondIndex = memory.chooseSecond(board.available(),first,Math.random,recall);
  const columns=board.pairCount===2?2:board.pairCount===3?3:4;
  const secondDirection=seatedObserveDirection(secondIndex,columns);
  // Frame 015 is pixel-identical to the selected wand-pick Frame 000, so the
  // cast starts at the authored handoff instead of flashing through idle.
  if(!await wait(sparky.observe(secondDirection),ticket))return;
  const secondTap=await tapAt(secondIndex,ticket,()=>reveal(secondIndex,'sparky'));
  if(!secondTap||!secondTap.observation)return;
  await resolveTurn(ticket,{settleMs:SPARKY_REVEAL_HOLD_MS});
}
function flyDiscoveries(indices) {
  if (reduced.matches) return;
  const destination = $('discovery-tray').getBoundingClientRect();
  for (const [offset, index] of indices.entries()) {
    const source = $('cards').children[index].querySelector('img');
    const rect = source.getBoundingClientRect(), img = source.cloneNode();
    img.className = 'flying-discovery';
    Object.assign(img.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    $('effects-layer').append(img);
    const ticket = run;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (ticket !== run || !img.isConnected) return;
      Object.assign(img.style, { left: `${destination.left + offset * 45}px`, top: `${destination.top}px`, width: '42px', height: '42px' });
    }));
  }
}
function confetti() {
  if (reduced.matches) return;
  $('effects-layer').innerHTML = Array.from({ length: 24 }, (_, i) => `<i class="confetti-bit" style="--x:${i * 4.2}%;--delay:${i % 5 * .08}s;--c:${['#eab867', '#9cc493', '#df9c99', '#88bfc0'][i % 4]};--rot:${i * 47}deg"></i>`).join('');
}
function finishRound() {
  const seasonsWereUnlocked=themeUnlocked('seasons');
  const neonWasUnlocked=themeUnlocked('neon');
  const completed = themeProgress();
  completed.push(round.id);
  if (theme.id === 'neon') save.neonStars = completed;
  else if (theme.id === 'seasons') save.seasonStars = completed;
  else save.dreamStars = completed;
  const xpAward=awardXP(save,{worldId:theme.id,roundId:round.id,mode:options.mode});
  persist(); audio.effect('finish');
  renderXP(xpAward);
  applyTheme();
  const openedTheme=!seasonsWereUnlocked&&themeUnlocked('seasons')?'seasons':!neonWasUnlocked&&themeUnlocked('neon')?'neon':null;
  mode = 'result'; $('app').dataset.mode = mode;
  dockSparkyAtResult();
  document.querySelector('.match-area').hidden = true; $('result-view').hidden = false;
  const outcome = resultFor(board);
  $('result-title').textContent = { practice:'Every pair found!', win:'You found more!', lose:'Sparky found more!', tie:'You found the same!' }[outcome];
  $('result-message').textContent = {
    practice:VARIANT.resultMessage||'You remembered every friend.',
    win:'Wonderful remembering — you led the way!',
    lose:'Great teamwork — every pair was discovered.',
    tie:'Perfect teamwork — you matched them together!'
  }[outcome];
  const score = $('result-score');
  $('result-view').classList.remove('has-theme-unlock');
  if(openedTheme){
    const unlockedTheme=getWorld(openedTheme);
    const unlockDialog=$('theme-unlock-dialog');
    unlockDialog.dataset.theme=openedTheme;
    $('theme-unlock-title').textContent=unlockedTheme.title;
    $('theme-unlock-preview').className=`theme-picture theme-picture--${openedTheme}`;
    $('theme-unlock-message').textContent=unlockedTheme.unlockMessage;
    $('unlock-visit').dataset.theme=openedTheme;
  }
  if (options.mode === 'practice') {
    score.setAttribute('aria-label', `${board.pairCount} pairs found`);
    score.innerHTML = `<span class="result-score-total"><strong>${board.pairCount}</strong><small>pairs found</small></span>`;
  } else {
    score.setAttribute('aria-label', `You ${board.scores.child}, Sparky ${board.scores.sparky}`);
    score.innerHTML = `<span><small>You</small><strong>${board.scores.child}</strong></span><i aria-hidden="true"></i><span><small>Sparky</small><strong>${board.scores.sparky}</strong></span>`;
  }
  announceResult(dialogue.next(outcome === 'practice' ? 'done' : outcome)); confetti();
  if(openedTheme){
    const unlockDialog=$('theme-unlock-dialog');
    if(!unlockDialog.open)unlockDialog.showModal();
    $('unlock-visit').focus({preventScroll:true});
  }else $('play-again').focus({ preventScroll: true });
}
function showPicnic() {
  const dreamDiscoveries=save.discoveries.filter(id=>ITEMS[id]);
  if (theme.id !== 'dream' || !dreamDiscoveries.length) return;
  if (board.phase !== 'complete' && (busy || board.actor !== 'child')) return;
  mode = 'explore'; clearEffects(); picnic.render(dreamDiscoveries);
  $('app').dataset.mode = mode; $('play-layout').hidden = true; $('discovery-strip').hidden = true; $('explore-view').hidden = false; $('visit-picnic').hidden = true;
  const complete = board.phase === 'complete', final = new Set(save.dreamStars).size >= getWorld('dream').pack.rounds.length;
  $('explore-title').textContent = final ? 'Our happy picnic!' : 'Picnic time!';
  $('explore-kicker').textContent = complete ? `ROUND ${round.id} · WE DID IT TOGETHER` : 'A LITTLE PLAY BREAK';
  $('explore-message').textContent = 'Tap a discovery, or bring it to a place below.';
  $('next-round').hidden = !complete; $('resume-round').hidden = complete;
  $('next-round').innerHTML = `${nextRoundId() === '1' ? 'Play again!' : theme.id === 'seasons' ? 'More seasons!' : 'More shapes!'} <span aria-hidden="true">→</span>`;
  updatePause(); window.scrollTo({ top: 0, behavior: 'instant' });
}
function resumeRound() {
  picnic.cancelDrag(); audio.stop(); mode = 'match'; $('app').dataset.mode = mode;
  $('play-layout').hidden = false; $('discovery-strip').hidden = false; $('explore-view').hidden = true;
  updatePause(); renderBoard(); say('We’re back! Let’s see what we remember.');
}
function hint() {
  if (busy || timeline.paused || board.actor !== 'child' || board.phase !== 'ready') return;
  activateAudio();
  const selected = board.snapshot().find(card => card.visible && !card.matched);
  const result = guideMemory.hint(board.available(), selected ? { ...selected.card, index: selected.index } : null);
  resetHintFeedback();
  if (result.type === 'none') {
    $('hint').classList.add('needs-more');
    $('hint').querySelector('span').textContent = 'Try one';
    $('hint').setAttribute('aria-label', 'Turn another card so Sparky can learn it');
    say('I’m still learning too. Let’s turn another card.');
  }
  else {
    result.cards.forEach(card => $('cards').children[card.index].classList.add('hinted'));
    $('hint').classList.add('is-helping');
    $('hint').querySelector('span').textContent = 'Look here';
    $('hint').setAttribute('aria-label', 'Hint shown. Look at the glowing cards');
    say(result.type === 'pair' || result.type === 'mate' ? 'I remember seeing those two. Try them!' : 'I’m still learning too. Let’s turn another card.');
  }
}
function openSettings() { audio.stop(); picnic.cancelDrag(); $('settings-dialog').showModal(); updatePause(); }
function settingsUI() {
  for (const key of ['voice', 'music']) {
    const button = $(`${key}-toggle`), state = save[key] ? 'On' : 'Off';
    button.setAttribute('aria-pressed', String(save[key]));
    button.setAttribute('aria-label', `${button.dataset.settingLabel}: ${state}`);
    button.querySelector('.setting-state').textContent = state;
  }
}

$('cards').addEventListener('click', event => { const card = event.target.closest('[data-index]'); if (card) childFlip(Number(card.dataset.index)); });
$('hint').addEventListener('click', hint);
$('sparky').addEventListener('click', () => {
  if (busy || mode !== 'match' || $('settings-dialog').open) return;
  if (options.mode === 'practice') hint();
  else { say('Hi, friend! Ready to find some shape pairs?'); }
});
$('repeat').addEventListener('click', () => {
  activateAudio();
  const text=$('caption').textContent;
  audio.say(text,{onStart:meta=>{music.setDucked(true);sparky.speak(text,meta.durationMs,meta.clock,meta.silences);},onEnd:()=>{sparky.finishSpeaking();music.setDucked(false);}});
});
$('visit-picnic').addEventListener('click', showPicnic);
$('picnic-basket').addEventListener('click', () => { if (save.discoveries.some(id=>ITEMS[id])) showPicnic(); else { say('Let’s find a shape pair for our picnic!'); } });
$('discovery-tray').addEventListener('click', event => { if (event.target.closest('[data-discovery]')) showPicnic(); });
$('resume-round').addEventListener('click', resumeRound);
$('next-round').addEventListener('click', () => { activateAudio(); startRound(nextRoundId()); });
$('settings-open').addEventListener('click', openSettings);
$('settings-dialog').querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $('settings-dialog').close()));
$('settings-home').addEventListener('click', () => { $('settings-dialog').close(); showSetup(); });
$('settings-dialog').addEventListener('close', updatePause);
for (const key of ['voice', 'music']) $(`${key}-toggle`).addEventListener('click', () => {
  save[key] = !save[key];
  if (key === 'voice') audio.stop();
  if (key === 'music') { save.effects = save.music; music.sync(!document.hidden && !$('settings-dialog').open); }
  persist(); settingsUI();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('settings-dialog').open && !$('level-dialog').open && !$('theme-dialog').open) { event.preventDefault(); openSettings(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) picnic.cancelDrag(); updatePause(); });
window.addEventListener('resize', () => { renderTray(); if (board?.actor !== 'sparky') clearPointer(); });
document.addEventListener('pointerdown', activateAudio, { once: true });
document.addEventListener('keydown', activateAudio, { once: true });
// A suggestion only: never lock orientation or interrupt an unfinished turn.
try { $('rotate-tip').hidden = sessionStorage.getItem('shape-friends:rotation-dismissed') === 'yes'; } catch {}
$('dismiss-rotate').addEventListener('click', () => {
  $('rotate-tip').hidden = true;
  try { sessionStorage.setItem('shape-friends:rotation-dismissed', 'yes'); } catch {}
});
function setupUI() {
  document.querySelectorAll('button[data-play-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.playMode === options.mode)));
}
function showSetup() {
  run++; timeline.cancel(); audio.stop(); clearEffects(); picnic.cancelDrag(); busy = false;
  if($('level-dialog').open)$('level-dialog').close();
  sparky.set('idle');
  hideCloudCurtain();
  dockSparkyAtBoard();
  mode = 'setup'; $('app').dataset.mode = mode;
  $('setup-view').hidden = false; $('play-layout').hidden = true; $('explore-view').hidden = true;
  $('result-view').hidden = true; $('discovery-strip').hidden = true;
  $('setup-view').dataset.step = 'menu'; $('mode-panel').hidden = false;
  applyTheme(); renderXP(); setupUI(); updatePause(); menuSparky.nodYes();
  document.querySelector('button[data-play-mode="practice"]').focus({ preventScroll:true });
}
function showLevels(playMode) {
  options = playOptions(playMode, options.level); setupUI();
  $('level-mode-label').textContent = options.mode === 'practice' ? 'Practice' : 'Beat Sparky';
  const groups=difficultyGroups();
  if(groups.length){
    $('level-dialog-title').textContent='Choose difficulty';
    const choices=document.querySelector('.difficulty-choices');
    const face={gentle:'easy',growing:'medium',clever:'hard'};
    const completed=new Set(themeProgress());
    choices.innerHTML=groups.map(group=>{
      const done=group.rounds.filter(id=>completed.has(id)).length;
      return `<button type="button" data-difficulty-group="${group.id}" aria-label="${group.name}, ${group.description}, ${done} of ${group.rounds.length} boards complete"><img class="difficulty-face" src="assets/difficulty-${face[group.id]}.svg" alt=""><span class="difficulty-copy"><strong>${group.name}</strong><small>${group.description}</small><em>${done} / ${group.rounds.length} complete</em></span><span class="difficulty-arrow" aria-hidden="true">›</span></button>`;
    }).join('');
    choices.querySelectorAll('[data-difficulty-group]').forEach(button=>button.addEventListener('click',()=>{
      const group=groups.find(item=>item.id===button.dataset.difficultyGroup);
      const roundId=group.rounds.find(id=>!completed.has(id))||group.rounds[0];
      options=playOptions(playMode,group.id);
      $('level-dialog').close();activateAudio();startRound(roundId);
    }));
  }else if(GAME_CONTENT.play?.fixedPairs){
    $('level-dialog-title').textContent='Pick a level';
    const choices=document.querySelector('.difficulty-choices');
    choices.innerHTML=pack.rounds.map(item=>{
      const available=unlocked(item.id);
      return `<button type="button" data-round-choice="${item.id}" ${available?'':'disabled'} aria-label="Level ${item.id}, ${item.title}, ${item.pairs.length*2} cards"><span class="difficulty-face number-level-face" aria-hidden="true">${item.id}</span><span class="difficulty-copy"><strong>Level ${item.id}</strong><small>${item.title} · ${item.pairs.length*2} cards</small></span><span class="difficulty-arrow" aria-hidden="true">›</span></button>`;
    }).join('');
    choices.querySelectorAll('[data-round-choice]').forEach(button=>button.addEventListener('click',()=>{
      $('level-dialog').close();activateAudio();startRound(button.dataset.roundChoice);
    }));
  }
  if(!$('level-dialog').open)$('level-dialog').showModal();
  $('level-dialog').tabIndex=-1;
  $('level-dialog').focus({preventScroll:true});
}
document.querySelectorAll('button[data-play-mode]').forEach(button => button.addEventListener('click', () => showLevels(button.dataset.playMode)));
$('level-close').addEventListener('click',()=>$('level-dialog').close());
$('menu-sparky').addEventListener('click',()=>{
  activateAudio();menuSparky.nodYes();
  $('menu-caption').textContent=VARIANT.menuGreeting||(theme.id === 'seasons' ? 'Let’s find which season each picture belongs to!' : theme.id==='neon' ? 'Let’s light up shapes that belong together!' : 'Hi, friend! Ready to find some shape pairs?');
  audio.say($('menu-caption').textContent,{onStart:meta=>{music.setDucked(true);menuSparky.speak($('menu-caption').textContent,meta.durationMs,meta.clock,meta.silences);},onEnd:()=>{menuSparky.finishSpeaking();music.setDucked(false);}});
});
document.querySelectorAll('button[data-level]').forEach(button => button.addEventListener('click', () => {
  options = playOptions(options.mode, button.dataset.level);
  $('level-dialog').close();activateAudio();startRound(save.activeRound);
}));
$('play-again').addEventListener('click', () => { activateAudio(); startRound(nextRoundId()); });
$('choose-game').addEventListener('click', showSetup);
function openThemes() { applyTheme(); if (!$('theme-dialog').open) $('theme-dialog').showModal(); }
$('theme-open').addEventListener('click', openThemes);
$('theme-close').addEventListener('click', () => $('theme-dialog').close());
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.themeChoice;
  if (!themeUnlocked(id)) {
    button.classList.remove('needs-stars'); void button.offsetWidth; button.classList.add('needs-stars');
    const goals=worldUnlockGoals();
    const left=id==='neon'?Math.max(0,goals.neon-save.dreamStars.length-save.seasonStars.length):Math.max(0,goals.seasons-save.dreamStars.length);
    $('theme-dialog-message').textContent=id==='neon'
      ? `Play ${left} more ${left===1?'match':'matches'} to light up the Neon Lab.`
      : `Play ${left} more ${left===1?'match':'matches'} to open Season Parade.`;
    return;
  }
  save.theme=id; save.activeRound='1'; persist(); applyTheme(); $('theme-dialog').close(); showSetup();
}));
$('unlock-visit').addEventListener('click',()=>{
  const dialog=$('theme-unlock-dialog');
  save.theme=$('unlock-visit').dataset.theme||'seasons';save.activeRound='1';persist();dialog.close();applyTheme();showSetup();
});
$('unlock-later').addEventListener('click',()=>{$('theme-unlock-dialog').close();$('play-again').focus({preventScroll:true});});
document.querySelector('.home-button').addEventListener('click', event => { event.preventDefault(); if ($('settings-dialog').open) $('settings-dialog').close(); showSetup(); });
applyTheme(); renderXP(); settingsUI(); startRound(save.activeRound); showSetup();
