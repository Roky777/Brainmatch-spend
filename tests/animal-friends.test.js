import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { validateContentManifest } from '../shape-friends/content.js';

const manifest=JSON.parse(await readFile(new URL('../animal-friends/game-content.json',import.meta.url),'utf8'));

test('Animal Friends ships a valid introduction and full-match board',()=>{
  assert.equal(validateContentManifest(manifest),true);
  assert.equal(manifest.variant.id,'animal-friends');
  assert.equal(manifest.play.fixedPairs,true);
  assert.deepEqual(manifest.rounds.map(round=>round.pairs.length),[4,8]);
});

test('the introduction uses the four requested animals',()=>{
  assert.deepEqual(manifest.rounds[0].pairs.map(pair=>pair[0]),['lion','monkey','fish','frog']);
});

test('the full board covers all eight chapter-supported animals',()=>{
  assert.deepEqual(manifest.rounds[1].pairs.map(pair=>pair[0]),[
    'lion','monkey','fish','elephant','frog','rabbit','bird','snake',
  ]);
});

test('all Animal Friends artwork is local and picture cards use finished raster assets',async()=>{
  await Promise.all(Object.values(manifest.items).map(item=>access(new URL(`../animal-friends/assets/cards/${item.asset}`,import.meta.url))));
  const pictureAssets=Object.entries(manifest.items)
    .filter(([id])=>id.startsWith('picture_'))
    .map(([,item])=>item.asset);
  for(const asset of pictureAssets){
    assert.match(asset,/\.png$/i,`${asset} should use production raster artwork`);
    const png=await readFile(new URL(`../animal-friends/assets/cards/${asset}`,import.meta.url));
    assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],`${asset} should be a valid PNG`);
  }
});

test('Animal Friends pairs every picture with its uppercase English name',()=>{
  for(const round of manifest.rounds){
    for(const [animal,pictureId,wordId] of round.pairs){
      assert.equal(pictureId,`picture_${animal}`);
      assert.equal(wordId,`word_${animal}`);
      assert.equal(manifest.items[wordId].name,animal.toUpperCase());
    }
  }
});

test('the Animal Friends XP journey totals exactly 200',()=>{
  const activities=Object.keys(manifest.worlds).length*manifest.rounds.length;
  const xp=manifest.progression.xp;
  assert.ok(xp.rewards.practice>xp.rewards.challenge);
  assert.equal(activities*(xp.rewards.practice+xp.rewards.challenge)+xp.completionBonus,200);
});
