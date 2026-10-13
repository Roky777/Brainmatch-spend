import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('card art uses a centered bounded area independent of intrinsic image size',async()=>{
  const css=await readFile(new URL('../shape-friends/prototype.css',import.meta.url),'utf8');
  assert.match(css,/left:50%;top:50%;[\s\S]*?max-width:80%;max-height:80%/);
  assert.match(css,/transform:translate\(-50%,-50%\)!important/);
  assert.match(css,/max-width:70%;max-height:70%/);
  const app=await readFile(new URL('../shape-friends/app.js',import.meta.url),'utf8');
  assert.match(app,/setProperty\('--art-fit'/);
  assert.doesNotMatch(app,/img.style.transform=`scale/);
});
