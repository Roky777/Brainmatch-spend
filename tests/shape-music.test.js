import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MusicLoop } from '../shape-friends/music.js';
import { emptySave, sanitizeSave } from '../shape-friends/save.js';

test('the seamless background loop ships locally and the setting survives save sanitization', async () => {
  const bytes = await readFile(new URL('../shape-friends/assets/Audio/dream-brainmatch-loop-seamless.mp3', import.meta.url));
  assert(bytes.length > 100_000);
  assert.equal(emptySave().music, true);
  assert.equal(sanitizeSave({ music: false }).music, false);
});

test('music waits for a gesture, pauses with the game, and respects the toggle', () => {
  const settings = { music: true };
  let clip, created = 0, plays = 0, pauses = 0;
  const music = new MusicLoop(settings, { createAudio: src => {
    created++;
    assert.match(src, /dream-brainmatch-loop-seamless\.mp3$/);
    return clip = { paused: true, play() { plays++; this.paused = false; return Promise.resolve(); }, pause() { pauses++; this.paused = true; } };
  } });
  music.sync(true);
  assert.equal(created, 0);
  music.activate();
  assert.equal(created, 1);
  assert.equal(clip.loop, true);
  assert.equal(clip.volume, 0.08);
  music.setDucked(true);
  assert.equal(clip.volume, 0.025);
  music.setDucked(false);
  assert.equal(clip.volume, 0.08);
  assert.equal(plays, 1);
  music.sync(false);
  assert.equal(pauses, 1);
  music.sync(true);
  assert.equal(plays, 2);
  settings.music = false;
  music.sync(true);
  assert.equal(clip.paused, true);
  assert.equal(created, 1);
});
