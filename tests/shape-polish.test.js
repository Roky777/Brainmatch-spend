import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
test('fixed game canvas cannot be scrolled by dialog focus restoration',()=>{
  assert.match(css,/#app\{overflow:clip\}/);
});
test('dialog titles keep the close-control lane and can wrap',()=>{
  assert.match(css,/#level-dialog-title\{margin-inline:40px;text-wrap:balance\}/);
  assert.match(css,/\.theme-dialog h2\{white-space:normal;max-width:100%;text-wrap:balance\}/);
});
test('keyboard users retain a visible focus indicator',()=>{
  assert.match(css,/button:focus-visible,a:focus-visible\{outline:3px solid var\(--game-blue\);outline-offset:4px\}/);
});
