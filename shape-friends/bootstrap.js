// Same entrypoint for a variant subfolder and its repository root. No redirect
// page, and no dependency on the address having a trailing slash.
const entry=document.querySelector('script[data-game-variant]');
const variant=entry.dataset.gameVariant;
const manifestURL=new URL(`../${variant}/game-content.json`,import.meta.url);
manifestURL.searchParams.set('v','card-art-2');
document.documentElement.dataset.contentManifest=manifestURL.href;
try {
  await Promise.all([...document.querySelectorAll('link[data-game-style]')].map(link=>{
    if(link.sheet)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const optional=link.href.includes('fonts.googleapis.com');
      const timer=setTimeout(()=>finish(false),15000);
      const finish=ok=>{clearTimeout(timer);link.removeEventListener('load',loaded);link.removeEventListener('error',failed);ok||optional?resolve():reject(Error('Game styles unavailable'));};
      const loaded=()=>finish(true),failed=()=>finish(false);
      link.addEventListener('load',loaded,{once:true});link.addEventListener('error',failed,{once:true});
    });
  }));
  if(!document.getElementById('app')) {
    const response=await fetch(new URL('./index.html',import.meta.url),{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Game template unavailable');
    const template=new DOMParser().parseFromString(await response.text(),'text/html');
    template.body.querySelectorAll('script').forEach(script=>script.remove());
    // Retain the original loader: replacing it would restart its artwork.
    const loader=document.getElementById('game-loading');
    template.getElementById('game-loading')?.remove();
    document.body.replaceChildren(loader,...template.body.childNodes);
  }
  await import('./app.js?v=22');
} catch(error) {
  const screen=document.getElementById('game-loading');
  screen.querySelector('p').textContent='A little hiccup. Shall we try again?';
  screen.querySelector('progress').hidden=true;
  const retry=document.createElement('button');retry.textContent='Try again';
  retry.onclick=()=>location.reload();screen.append(retry);
}
