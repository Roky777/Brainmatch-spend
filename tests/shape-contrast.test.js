import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const css=await readFile(new URL('shape-friends/prototype.css',root),'utf8');
function luminance(hex){
  const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('shared neon text and surface colours meet 4.5:1 contrast',()=>{
  const token=name=>css.match(new RegExp(`--space-${name}:(#[a-f0-9]{6})`))[1];
  for(const fg of ['text','muted','accent'])for(const bg of ['panel','panel-raised'])assert.ok(contrast(token(fg),token(bg))>=4.5,`${fg} on ${bg}`);
  assert.ok(contrast(token('card-ink'),token('card'))>=4.5);
});
test('neon score, XP and illustrated text cards use explicit compatible surfaces',()=>{
  assert.match(css,/\.result-summary #result-score\{background:var\(--space-panel\)/);
  assert.match(css,/\.result-xp\{background:var\(--space-panel-raised\)/);
  assert.match(css,/\.card-front img\{filter:none\}/);
  assert.match(css,/background:var\(--space-card\);color:var\(--space-card-ink\)/);
  assert.match(css,/\.difficulty-copy strong,[\s\S]*color:var\(--space-text\)/);
});
test('every variant loads the updated shared contrast stylesheet',async()=>{
  for(const game of ['shape-friends','number-friends','animal-friends','body-sound-match','money-match','clock-match','animal-action-match','shadow-match','plant-match','how-things-work']){
    const html=await readFile(new URL(`${game}/index.html`,root),'utf8');
    assert.match(html,/prototype\.css\?v=18/);
  }
});
