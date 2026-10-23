import test from 'node:test';
import assert from 'node:assert/strict';
import {resetGameData} from '../shape-friends/reset-data.js';
const fixture=()=>{
  const data=new Map();
  return {data,storage:{get length(){return data.size;},key:index=>[...data.keys()][index],getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}};
};
test('fresh-data reset removes own saves, scoped users, campaign IDs and queued old awards only once',()=>{
  const {data,storage}=fixture();
  const own='brainmatch:shape-friends:v1',scoped='brainmatch:shape-friends:user:alice:game:catalog:v1';
  for(const key of [own,scoped,'brainmatch:analytics-campaign:v3:catalog'])data.set(key,'old');
  data.set('brainmatch:number-friends:v1','keep');data.set('other-app','keep');
  const ownReport={gameId:'catalog'},foreign={gameId:'sorter'};
  data.set('ignite_pending_sessions_jsplugin',JSON.stringify([ownReport,foreign]));
  data.set('brainmatch:analytics-delivery:v1',JSON.stringify([{payload:ownReport},{payload:foreign}]));
  assert.equal(resetGameData('shape-friends',{storage}),true);
  assert.equal(data.has(own),false);assert.equal(data.has(scoped),false);
  assert.equal(data.has('brainmatch:analytics-campaign:v3:catalog'),false);
  assert.equal(data.get('other-app'),'keep');assert.equal(data.get('brainmatch:number-friends:v1'),'keep');
  assert.deepEqual(JSON.parse(data.get('ignite_pending_sessions_jsplugin')),[foreign]);
  assert.deepEqual(JSON.parse(data.get('brainmatch:analytics-delivery:v1')),[{payload:foreign}]);
  data.set(own,'new progress');assert.equal(resetGameData('shape-friends',{storage}),false);
  assert.equal(data.get(own),'new progress');
});
test('all ten variants reset independently and storage failures are nonblocking',()=>{
  for(const variant of ['shape-friends','number-friends','money-match','body-sound-match','animal-action-match','animal-friends','shadow-match','clock-match','plant-match','how-things-work']){
    const {data,storage}=fixture();data.set(`brainmatch:${variant}:v1`,'old');
    assert.equal(resetGameData(variant,{storage}),true);assert.equal(data.has(`brainmatch:${variant}:v1`),false);
  }
  assert.equal(resetGameData('unrelated-game',{storage:fixture().storage}),false);
  assert.equal(resetGameData('shape-friends',{storage:{getItem(){throw Error('blocked');}}}),false);
});
