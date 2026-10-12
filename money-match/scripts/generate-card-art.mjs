import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('game-content.json',base),'utf8'));
await mkdir(new URL('assets/cards/',base),{recursive:true});
// Crop complete denomination faces from the transparent photograph strip.
// Originals and their licences are retained in assets/currency/.
const raster={};
for(const [value,crop] of [[1,'crop=214:214:10:20'],[2,'crop=226:226:228:16'],[5,'crop=198:198:460:30'],[10,'scale=320:-1']]){
  const source=new URL(`assets/currency/${value===10?'coin-10.png':'coins-1-2-5.png'}`,base);
  const result=spawnSync('ffmpeg',['-v','error','-i',fileURLToPath(source),'-vf',crop,'-frames:v','1','-f','image2pipe','-c:v','png','pipe:1'],{maxBuffer:8*1024*1024});
  if(result.status!==0)throw new Error(result.stderr.toString());
  raster[`coin${value}`]=`data:image/png;base64,${result.stdout.toString('base64')}`;
}
for(const value of [10,20,50,100]){
  const ext=value===100?'png':'jpg';
  const data=await readFile(new URL(`assets/currency/note-${value}.${ext}`,base));
  raster[`note${value}`]=`data:image/${ext==='jpg'?'jpeg':'png'};base64,${data.toString('base64')}`;
}
const ink='#203975';
const coin=(value,x,y,r)=>`<image href="${raster[`coin${value}`]}" x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}" preserveAspectRatio="xMidYMid meet"/>`;
const note=(value,y=120,w=224)=>`<image href="${raster[`note${value}`]}" x="${120-w/2}" y="${y-56}" width="${w}" height="112" preserveAspectRatio="xMidYMid meet"/>`;
for(const item of Object.values(manifest.items)){
  let art='';
  if(item.note){art=note(item.note,item.coins?77:120);if(item.coins)art+=coin(1,120,184,36);}
  else if(item.coins){
    const positions={1:[[120,120,94]],2:[[65,76,53],[175,164,53]],3:[[120,59,49],[64,170,49],[176,170,49]],4:[[63,63,50],[177,63,50],[63,177,50],[177,177,50]]}[item.coins.length];
    art=item.coins.map((v,i)=>coin(v,...positions[i])).join('');
  }else art=`<text x="120" y="143" text-anchor="middle" fill="${ink}" font-family="Arial,sans-serif" font-size="${item.value>=100?65:86}" font-weight="900">₹${item.value}</text>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><!-- Currency image attribution and licences: ../../CURRENCY_SOURCES.md --><defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="${ink}" flood-opacity=".18"/></filter></defs><g filter="url(#shadow)">${art}</g></svg>`;
  await writeFile(new URL(`assets/cards/${item.asset}`,base),svg);
}
console.log(`Composed ${Object.keys(manifest.items).length} cards using authentic Indian currency images.`);
