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
  const cropped=new URL(`assets/currency/coin-face-${value}.png`,base);
  await writeFile(cropped,result.stdout);
  const packed=spawnSync('cwebp',['-quiet','-q','92','-alpha_q','100',fileURLToPath(cropped),'-o','-'],{maxBuffer:8*1024*1024});
  if(packed.status!==0)throw new Error(packed.stderr.toString());
  raster[`coin${value}`]=`data:image/webp;base64,${packed.stdout.toString('base64')}`;
}
for(const value of [10,20,50,100]){
  const ext=value===100?'png':'jpg';
  const packed=spawnSync('cwebp',['-quiet','-q','90','-resize','640','0',fileURLToPath(new URL(`assets/currency/note-${value}.${ext}`,base)),'-o','-'],{maxBuffer:8*1024*1024});
  if(packed.status!==0)throw new Error(packed.stderr.toString());
  raster[`note${value}`]=`data:image/webp;base64,${packed.stdout.toString('base64')}`;
}
const ink='#203975';
const coin=(value,x,y,r)=>`<image href="${raster[`coin${value}`]}" x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}" preserveAspectRatio="xMidYMid meet" filter="url(#currency-detail)"/><g class="coin-denomination"><text x="${x}" y="${y+r*.76}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${r>=80?64:48}" fill="${ink}" stroke="#fffdf4" stroke-width="8" paint-order="stroke fill" stroke-linejoin="round">₹${value}</text></g>`;
const note=(value,y=120,w=224)=>`<image href="${raster[`note${value}`]}" x="${120-w/2}" y="${y-56}" width="${w}" height="112" preserveAspectRatio="xMidYMid meet"/>`;
for(const item of Object.values(manifest.items)){
  let art='';
  if(item.note){art=note(item.note,item.coins?77:120);if(item.coins)art+=coin(1,120,184,36);}
  else if(item.coins){
    // Coins occupy equally sized slots. Clear face labels remain readable on
    // small boards without floating miniature badges or revealing the total.
    const positions={1:[[120,116,104]],2:[[62,112,56],[178,112,56]],3:[[62,58,54],[178,58,54],[120,178,54]],4:[[60,60,54],[180,60,54],[60,180,54],[180,180,54]]}[item.coins.length];
    art=item.coins.map((v,i)=>coin(v,...positions[i])).join('');
  }else art=`<text x="120" y="143" text-anchor="middle" fill="${ink}" font-family="Arial,sans-serif" font-size="${item.value>=100?65:86}" font-weight="900">₹${item.value}</text>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><!-- Currency image attribution and licences: ../../CURRENCY_SOURCES.md --><defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="${ink}" flood-opacity=".15"/></filter><filter id="currency-detail" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.18" intercept=".025"/><feFuncG type="linear" slope="1.18" intercept=".025"/><feFuncB type="linear" slope="1.18" intercept=".025"/></feComponentTransfer></filter></defs><g filter="url(#shadow)">${art}</g></svg>`;
  await writeFile(new URL(`assets/cards/${item.asset}`,base),svg);
}
console.log(`Composed ${Object.keys(manifest.items).length} cards using authentic Indian currency images.`);
