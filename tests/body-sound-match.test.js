import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { validateContentManifest } from '../shape-friends/content.js';

const manifest=JSON.parse(await readFile(new URL('../body-sound-match/game-content.json',import.meta.url),'utf8'));

test('Body & Sound Match ships nine complete, valid chapters',()=>{
  assert.equal(validateContentManifest(manifest),true);
  assert.equal(manifest.variant.id,'body-sound-match');
  assert.equal(manifest.rounds.length,9);
  assert.deepEqual(manifest.rounds.map(round=>round.pairs.length),[4,4,4,4,4,4,8,8,8]);
});

test('the nine chapters are presented as three child-friendly difficulty groups',()=>{
  assert.equal(manifest.play.fixedPairs,true);
  assert.deepEqual(manifest.play.difficultyGroups.map(group=>[group.id,group.name,group.rounds]),[
    ['gentle','Easy',['1','2','3']],
    ['growing','Medium',['4','5','6']],
    ['clever','Hard',['7','8','9']],
  ]);
  assert.deepEqual(manifest.play.difficultyGroups.map(group=>group.description),[
    '4 cards · 2 pairs','6 cards · 3 pairs','8 cards · 4 pairs',
  ]);
  assert.equal(manifest.play.difficultyGroups.flatMap(group=>group.rounds).length,manifest.rounds.length);
});

test('grouped difficulties use the Shape Friends 4, 6 and 8 card sizes',async()=>{
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.match(app,/fixedPairs&&!groupedDifficulties[\s\S]*?: LEVELS\[options\.level\]/);
});

test('body vocabulary and function chapters follow the learning brief',()=>{
  assert.deepEqual(manifest.rounds[0].pairs.map(pair=>pair[0]),['body_eye','body_ear','body_nose','body_hand']);
  assert.deepEqual(manifest.rounds[2].pairs.map(pair=>pair[0]),['function_see','function_hear','function_smell','function_eat']);
  assert.deepEqual(manifest.rounds[3].pairs.map(pair=>pair[0]),['action_clap','action_walk','action_move','action_feel']);
});

test('phonics chapters cover A through Z and finish with new A-F revision pictures',()=>{
  const soundRounds=manifest.rounds.slice(4);
  const introduced=soundRounds.flatMap(round=>round.pairs.map(([category])=>category.replace('letter_','').toUpperCase()));
  assert.equal([...new Set(introduced)].join(''),'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.deepEqual(manifest.rounds[8].pairs.slice(2).map(([category])=>category),['letter_a','letter_b','letter_c','letter_d','letter_e','letter_f']);
});

test('all Body & Sound Match artwork is local and picture cards use rendered PNG assets',async()=>{
  await Promise.all(Object.values(manifest.items).map(item=>access(new URL(`../body-sound-match/assets/cards/${item.asset}`,import.meta.url))));
  const pictureAssets=[...new Set(Object.entries(manifest.items).filter(([id])=>id.startsWith('object_')||id.startsWith('picture_')).map(([,item])=>item.asset))];
  for(const asset of pictureAssets){
    assert.match(asset,/\.png$/i,`${asset} should use production raster artwork`);
    const png=await readFile(new URL(`../body-sound-match/assets/cards/${asset}`,import.meta.url));
    assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],`${asset} should be a valid PNG`);
  }
});

test('later phonics boards use clear rendered objects for their initial sounds',()=>{
  assert.deepEqual(manifest.rounds[6].pairs.map(([,letter,object])=>[letter,object]),[
    ['letter_i','object_ice'],['letter_j','object_jeans'],['letter_k','object_kite'],['letter_l','object_lion'],
    ['letter_m','object_mango'],['letter_n','object_nose'],['letter_o','object_orange'],['letter_p','object_parrot'],
  ]);
  assert.deepEqual(manifest.rounds[7].pairs.slice(3).map(([,letter,object])=>[letter,object]),[
    ['letter_t','object_tomato'],['letter_u','object_umbrella'],['letter_v','object_violin'],['letter_w','object_watch'],['letter_x','object_xray'],
  ]);
});

test('the Body & Sound Match XP journey totals exactly 200',()=>{
  const activities=Object.keys(manifest.worlds).length*manifest.rounds.length;
  const xp=manifest.progression.xp;
  assert.ok(xp.rewards.practice>xp.rewards.challenge);
  assert.equal(activities*(xp.rewards.practice+xp.rewards.challenge)+xp.completionBonus,200);
});
