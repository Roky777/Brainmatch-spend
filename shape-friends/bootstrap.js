// Same entrypoint for a variant subfolder and its repository root. No redirect
// page, and no dependency on the address having a trailing slash.
const entry=document.querySelector('script[data-game-variant]');
const variant=entry.dataset.gameVariant;
const manifestURL=new URL(`../${variant}/game-content.json`,import.meta.url);
manifestURL.searchParams.set('v','card-art-3');
document.documentElement.dataset.contentManifest=manifestURL.href;
try {
  // Fetch the layout while styles download, not in a second network phase.
  const shellReady=document.getElementById('app')?null:fetch(new URL('./game-shell.html?v=1',import.meta.url),{signal:AbortSignal.timeout(15000)})
    .then(response=>{if(!response.ok)throw Error('Game template unavailable');return response.text();})
    .catch(error=>({error}));
  // Fetch and decode the loader art first, independently of game styles and
  // modules. Reveal the background, cloud and mascot together, never in pieces.
  await Promise.all([...document.querySelectorAll('link[data-game-style]')].filter(link=>!link.href.includes('fonts.googleapis.com')).map(link=>{
    if(link.sheet)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const optional=link.href.includes('fonts.googleapis.com');
      // Slow styles may finish applying later; they must not hold JS startup.
      const timer=setTimeout(()=>finish(true),3000);
      const finish=ok=>{clearTimeout(timer);link.removeEventListener('load',loaded);link.removeEventListener('error',failed);ok||optional?resolve():reject(Error('Game styles unavailable'));};
      const loaded=()=>finish(true),failed=()=>finish(false);
      link.addEventListener('load',loaded,{once:true});link.addEventListener('error',failed,{once:true});
    });
  }));
  if(!document.getElementById('app')) {
    const html=await shellReady;if(html?.error)throw html.error;
    const template=new DOMParser().parseFromString(html,'text/html');
    template.body.querySelectorAll('script').forEach(script=>script.remove());
    // Retain the original loader: replacing it would restart its artwork.
    const loader=document.getElementById('game-loading');
    template.getElementById('game-loading')?.remove();
    document.body.replaceChildren(loader,...template.body.childNodes);
  }
  await import('./app.js?v=35');
} catch(error) {
  const screen=document.getElementById('game-loading');
  screen.querySelector('p').textContent='A little hiccup. Shall we try again?';
  screen.querySelector('progress').hidden=true;
  const retry=document.createElement('button');retry.textContent='Try again';
  retry.onclick=()=>location.reload();screen.append(retry);
}
