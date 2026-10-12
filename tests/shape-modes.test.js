import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import { MatchBoard } from '../shape-friends/engine.js';
import { CompanionMemory } from '../shape-friends/companion.js';
import { LEVELS, playOptions, resultFor } from '../shape-friends/play-options.js';
import { Dialogue, LINES } from '../shape-friends/dialogue.js';
import { VOICE_CLIPS } from '../shape-friends/audio.js';
const cards = Array.from({length:8},(_,i)=>({id:String(i),pairId:String(Math.floor(i/2)),item:String(i)}));
function turn(board,a,b){board.reveal(a,board.actor);board.reveal(b,board.actor);board.resolve();board.advance();}
test('Practice gives every turn to the child and counts each pair once',()=>{
 const board=new MatchBoard(cards,{shuffled:false,mode:'practice'});
 turn(board,0,2);assert.equal(board.actor,'child');assert.deepEqual(board.scores,{child:0,sparky:0});
 for(let i=0;i<8;i+=2){turn(board,i,i+1);assert.equal(board.actor,'child');}
 assert.deepEqual(board.scores,{child:4,sparky:0});assert.equal(resultFor(board),'practice');
});
test('Challenge awards extra turns to both players and resolves all three outcomes',()=>{
 const tie=new MatchBoard(cards,{shuffled:false});assert.equal(resultFor(tie),null);
 turn(tie,0,1);assert.equal(tie.actor,'child');turn(tie,2,3);assert.equal(tie.actor,'child');
 turn(tie,4,6);assert.equal(tie.actor,'sparky');turn(tie,4,5);assert.equal(tie.actor,'sparky');turn(tie,6,7);
 assert.deepEqual(tie.scores,{child:2,sparky:2});assert.equal(resultFor(tie),'tie');
 const win=new MatchBoard(cards.slice(0,6),{shuffled:false});for(let i=0;i<6;i+=2)turn(win,i,i+1);assert.equal(resultFor(win),'win');
 const lose=new MatchBoard(cards.slice(0,6),{shuffled:false});turn(lose,0,2);for(let i=0;i<6;i+=2)turn(lose,i,i+1);assert.equal(resultFor(lose),'lose');
});
test('Sparky levels have bounded observed memory, never hidden information',()=>{
 for(const level of Object.values(LEVELS)){
   const memory=new CompanionMemory({capacity:level.capacity});
   cards.forEach((card,index)=>memory.observe({...card,index}));
   assert.equal(memory.seen.size,Math.min(8,level.capacity));
   const legal=[0,1,2,3,4,5,6,7];assert(legal.includes(memory.chooseFirst(legal)));
   memory.removePair('3');assert([...memory.seen.values()].every(c=>c.pairId!=='3'));
 }
 assert.deepEqual(playOptions('bad','bad'),{mode:'practice',level:'gentle'});
 assert.deepEqual(Object.values(LEVELS).map(l=>l.pairs),[2,3,4]);
});
test('Sparky makes kind memory mistakes instead of always taking a known pair',()=>{
 const memory=new CompanionMemory({capacity:4,accuracy:.3});
 memory.observe({index:0,pairId:'round',item:'ball'});
 memory.observe({index:1,pairId:'round',item:'orange'});
 memory.observe({index:2,pairId:'box',item:'book'});
 assert.equal(memory.chooseFirst([0,1,2],()=>.9),2,'failed recall leaves the known pair for the child');
 assert.equal(memory.chooseSecond([0,1,2],{index:0,pairId:'round'},()=>.9),2,'failed recall chooses a legal non-mate');
 assert.equal(memory.chooseSecond([0,1],{index:0,pairId:'round'},()=>.9),1,'the last legal card still completes the board');
 assert(Object.values(LEVELS).every(level=>level.accuracy<.7),'even Hard Sparky remains child-friendly');
});
test('Context reactions vary and every event has a local voice clip',()=>{
 const dialogue=new Dialogue();assert.notEqual(dialogue.next('miss'),dialogue.next('miss'));
 for(const lines of Object.values(LINES))for(const line of lines)assert(VOICE_CLIPS[line],line);
});
test('pre-readers can choose a board by card count and start with one tap',async()=>{
 const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
 for(const [level,label,pairs,cards,image] of [['gentle','Easy',2,4,'difficulty-easy.svg'],['growing','Medium',3,6,'difficulty-medium.svg'],['clever','Hard',4,8,'difficulty-hard.svg']]){
   const button=html.match(new RegExp(`<button[^>]*data-level="${level}"[\\s\\S]*?</button>`))?.[0]||'';
   assert.match(button,new RegExp(`<strong>${label}</strong>`));
   assert.match(button,new RegExp(`${pairs} pairs · ${cards} cards`));
   assert.match(button,new RegExp(`<img[^>]+${image}`));
   assert.match(await readFile(new URL(`../shape-friends/assets/${image}`,import.meta.url),'utf8'),/^<svg/);
 }
 assert.doesNotMatch(html,/🙂|🤔|🤩/,'difficulty controls do not use platform emoji');
 assert.match(html,/id="level-dialog"/,'difficulty is a focused modal rather than a replacement page');
 assert.doesNotMatch(html,/id="level-panel"/);
 assert.doesNotMatch(html,/id="start-game"/,'level choice itself is the start action');
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 assert.match(app,/button\.dataset\.level\);\s*\$\('level-dialog'\)\.close\(\);activateAudio\(\);startRound\(save\.activeRound\)/);
});
test('world chooser is visual, persistent and keeps later worlds behind completed rounds',async()=>{
 const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 const content=await readFile(new URL('../shape-friends/game-content.json',import.meta.url),'utf8');
 const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
 assert.match(html,/id="theme-open"/);assert.match(html,/data-theme-choice="dream"/);assert.match(html,/data-theme-choice="seasons"/);assert.match(html,/data-theme-choice="neon"/);
 assert.match(html,/id="theme-unlock-dialog"/);assert.match(html,/id="unlock-visit"/);assert.match(html,/id="unlock-later"/);
 assert.match(html,/theme-picture--dream/);assert.match(html,/theme-picture--seasons/);assert.match(html,/theme-picture--neon/);
 assert.match(app,/seasons:Math\.min\(3,dreamRounds\)/,'three Dream clears unlock Seasons, capped for shorter variants');
 assert.match(app,/neon:Math\.min\(5,dreamRounds\+seasonRounds\)/,'five combined clears unlock Neon, capped for shorter variants');
 assert.match(app,/save\.dreamStars\.length>=goals\.seasons/);
 assert.match(app,/save\.dreamStars\.length\+save\.seasonStars\.length>=goals\.neon/);
 assert.match(app,/document\.body\.dataset\.theme = theme\.id/);
 assert.match(app,/unlockDialog\.showModal\(\)/,'new worlds receive a one-time unlock popup');
 assert.match(app,/\$\('theme-open-label'\)\.textContent = 'Worlds'/,'the permanent world switcher stays explicit');
 assert.match(app,/theme\.cloudAsset/,'world presentation metadata is resolved generically');
 assert.match(content,/season-sparky-cloud-v1\.webp/);
 assert.match(content,/neon-sparky-cloud-v1\.webp/);
 assert.match(css,/body\[data-theme="seasons"\]/);
 assert.match(css,/season-parade-bg-v4\.webp/);
 assert.match(css,/season-card-back-v1\.webp/);
 assert.match(css,/season-card-front-v1\.webp/);
 assert.match(css,/season-result-stage-v1\.webp/);
 assert.match(css,/body\[data-theme="seasons"\] dialog#level-dialog/,'difficulty modal follows the active world');
 assert.match(css,/body\[data-theme="seasons"\] dialog\.theme-dialog/,'world modal follows the active world');
 assert.match(css,/body\[data-theme="neon"\]/);
 assert.match(css,/neon-space-bg-v3\.webp/);
 assert.match(css,/neon-card-back-v1\.webp/);
 assert.match(css,/neon-card-front-v1\.webp/);
 assert.match(css,/body\[data-theme="neon"\] #app\[data-mode="match"\] \.board-wrap\{[\s\S]*?border:0;[\s\S]*?background:transparent;box-shadow:none/,'Neon artwork provides the play field without an extra board panel');
 assert.match(css,/body\[data-theme="neon"\] #app\[data-mode="match"\] #match-score\{[\s\S]*?background:linear-gradient/,'Neon score keeps readable contrast');
});
test('pause menu stays child-facing and uses complete setting controls',async()=>{
 const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(html,/For grown-ups|id="chapter-path"|id="restart-round"/);
 for(const [id,label] of [['voice-toggle','Voice'],['music-toggle','Music']]){
   const button=html.match(new RegExp(`<button id="${id}"[\\s\\S]*?</button>`))?.[0]||'';
   assert.match(button,new RegExp(`data-setting-label="${label}"`));
   assert.match(button,/class="setting-switch"/);
   assert.match(button,/class="setting-state">On</);
 }
 assert.doesNotMatch(html,/id="effects-toggle"|>Sounds</);
 assert.match(html,/class="setting-icon"[\s\S]*?<svg/,'settings use drawn icons rather than emoji');
 assert.match(html,/id="settings-home"[\s\S]*Choose a game/);
 assert.match(app,/if \(key === 'music'\) \{ save\.effects = save\.music;/,'Music is the master switch for effects too');
});
test('result screen uses gentle language, one clear heading and visual action icons',async()=>{
 const html=await readFile(new URL('../shape-friends/index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
 assert.doesNotMatch(html,/Round complete/i);
 assert.doesNotMatch(html,/class="result-kicker"/);
 for(const id of ['play-again','choose-game']){
   const button=html.match(new RegExp(`<button id="${id}"[\\s\\S]*?</button>`))?.[0]||'';
   assert.match(button,/<svg[^>]*aria-hidden="true"/);
 }
 assert.match(app,/lose:'Sparky found more!'/);
 assert.doesNotMatch(app,/Sparky wins this time!/);
 assert.match(app,/score\.setAttribute\('aria-label'/);
 assert.match(css,/Result modal architecture/);
 assert.match(css,/#app\[data-mode="result"\] \.result-actions\{[\s\S]*?border:0;[\s\S]*?background:transparent/);
 assert.match(css,/body\[data-theme="seasons"\] #app\[data-mode="result"\] \.result-view\{[\s\S]*?--result-surface/);
 assert.match(css,/body\[data-theme="neon"\] #app\[data-mode="result"\] \.result-view\{[\s\S]*?--result-surface/);
});
test('welcome narration and the child card preview finish before the board accepts taps',async()=>{
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 assert.match(app,/mode = 'match'; busy = enteringPlay/);
 assert.match(app,/const welcomeVoice=speakLine\(sparky,openingLine\);[\s\S]*waitForVoice\(welcomeVoice,ticket\)[\s\S]*previewing=true;[\s\S]*wait\(BOARD_PREVIEW_HOLD_MS,ticket\)[\s\S]*previewing=false;[\s\S]*busy=false;renderBoard\(\)/);
 assert.match(app,/const shown=visible\|\|previewing/,'the opening preview turns every card face-up');
 assert.match(app,/previewing\?board\.previewSnapshot\(\):board\.snapshot\(\)/,'only the opening study moment receives all card identities');
 assert.match(app,/button\.disabled = !canPlay \|\| shown/,'preview cards cannot be selected early');
 assert.match(app,/BOARD_PREVIEW_HOLD_MS=2200/,'children receive a readable study moment');
 assert.match(app,/music\.setDucked\(true\)/);
});
test('card artwork is decoded before play and has a nonblank loading face',async()=>{
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
 assert.match(app,/const artReady=Promise\.all/);
 assert.match(app,/await artReady;[\s\S]*?previewing=true;[\s\S]*?busy=false;renderBoard\(\)/);
 assert.match(app,/front\.classList\.add\('is-loading'\)/);
 assert.match(css,/\.card-front\.is-loading::after/);
 assert.doesNotMatch(css,/\.memory-card:not\(\:disabled\):hover \.card-face\s*\{[^}]*transform:/s,'hover must not replace the face-flip transform');
 assert.match(css,/\.memory-card:not\(\:disabled\):hover\s*\{[^}]*transform:/s,'hover lifts the complete card instead');
});
test('turn pacing releases the board without waiting through speech or full reactions',async()=>{
 const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
 assert.match(app,/CARD_REVEAL_HOLD_MS=650/);
 assert.match(app,/RESULT_READ_MS=620/);
 assert.match(app,/CARD_CLOSE_MS=300/);
 assert.doesNotMatch(app,/waitForVoice\(reactionVoice/,'ordinary result speech must not lock card input');
 assert.match(app,/narrateNow\('child-match',\{first:1\}\)/,'only the first child match in a round is spoken');
 assert.match(app,/narrateNow\('child-miss',\{first:1\}\)/,'only the first child miss in a round is spoken');
 assert.match(app,/result\.actor==='child'[\s\S]*?: false;/,'Sparky uses non-verbal feedback for his own results');
});
