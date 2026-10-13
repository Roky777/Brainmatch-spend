import {deliveryURL} from './delivery-map.js?v=2';
// One decoded-image cache shared by startup, boards and character animations.
const images = new Map();
// Retain decoded elements for the session, not just their completion promises.
const decodedImages = new Map();
const DECODED_BUDGET = 64 * 1024 * 1024;
let decodedBytes=0;
export const isImageReady=src=>{
  const url=deliveryURL(src,document.baseURI), image=decodedImages.get(url);
  if(!image)return false;
  decodedImages.delete(url);decodedImages.set(url,image);
  return true;
};
function retainImage(url,image){
  decodedImages.set(url,image);
  decodedBytes+=image.naturalWidth*(image.naturalHeight||image.naturalWidth)*4;
  while(decodedBytes>DECODED_BUDGET&&decodedImages.size>1){
    const oldest=decodedImages.keys().next().value,previous=decodedImages.get(oldest);
    decodedBytes-=previous.naturalWidth*(previous.naturalHeight||previous.naturalWidth)*4;
    decodedImages.delete(oldest);images.delete(oldest);
  }
}
export async function preloadBackground(sources) {
  const queue=[...new Set(sources)];
  // Optional warming must yield to input and stop while the app is hidden.
  while(queue.length){
    if(document.hidden){await new Promise(resolve=>setTimeout(resolve,500));continue;}
    await new Promise(resolve=>globalThis.requestIdleCallback?requestIdleCallback(resolve,{timeout:1000}):setTimeout(resolve,80));
    await loadImage(queue.shift(),{priority:'low'});
  }
}
export const LOADING_ART=['assets/dream-heaven-v1.webp','assets/sparky-seat-cloud-v1.webp','assets/loader-sparky.png'];
export const worldAssets=id=>id==='neon'
  ? ['assets/neon-space-bg-v3.webp','assets/neon-card-back-v1.webp','assets/neon-card-front-v1.webp','assets/neon-sparky-cloud-v1.webp']
  : id==='seasons'
    ? ['assets/season-parade-bg-v4.webp','assets/season-card-back-v1.webp','assets/season-card-front-v1.webp','assets/season-sparky-cloud-v1.webp']
    : ['assets/dream-board-first-v1.png','assets/dream-heaven-v1.webp','assets/dream-star-first-v1.png','assets/sparky-seat-cloud-v1.webp'];
export async function readyScreen(tasks) {
  // Compatibility readiness guard only. Never recreate a loader after entry.
  // Startup has already decoded every gameplay image; these are cache hits.
  const results=await Promise.all(tasks);
  return results.every(ok=>ok!==false);
}
export async function warmLoadingArt() {
  const ready=(await Promise.all(LOADING_ART.map(loadImage))).every(Boolean);
  if(ready)document.getElementById('game-loading')?.setAttribute('data-art-ready','true');
  return ready;
}
// Keep the welcome screen readable on cached visits, without delaying slow
// connections further: this runs alongside actual asset loading.
export const STARTUP_MIN_MS = 0;
export const STARTUP_MAX_MS = 3500;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function openingFontsReady() {
  if (!document.fonts?.load) return;
  // External fonts must never trap the child on the loading screen. System
  // fallbacks remain usable if the font service is unavailable.
  let timer;
  try {
    await Promise.race([
      Promise.allSettled([document.fonts.load('700 32px Outfit'), document.fonts.load('600 20px Fredoka')]),
      new Promise(resolve => { timer = setTimeout(resolve, 2500); }),
    ]);
  } finally { clearTimeout(timer); }
}
export function loadImage(src,{priority='high'}={}) {
  const url = deliveryURL(src, document.baseURI);
  if (!images.has(url)) images.set(url, new Promise(resolve => {
    const image = new Image();
    image.decoding='async';image.fetchPriority=priority;
    const timeout = setTimeout(() => finish(false), 15000);
    let settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true; clearTimeout(timeout);
      if (!ok) images.delete(url); // Allow a later visit to retry a failed request.
      else retainImage(url,image);
      resolve(ok);
    }
    image.onload = async () => {
      try { await image.decode(); } catch {}
      finish(image.naturalWidth > 0);
    };
    image.onerror = () => finish(false);
    image.src = url;
  }));
  return images.get(url);
}
export async function finishStartup(extra = []) {
  const screen = document.getElementById('game-loading');
  const app = document.getElementById('app');
  app.inert = true;
  app.setAttribute('aria-busy', 'true');
  const welcomeReady = Promise.all([delay(STARTUP_MIN_MS), openingFontsReady()]);
  const urls = new Set(extra);
  for (const element of [document.body, app, document.querySelector('.garden-background'), document.querySelector('.theme-open-picture')]) {
    if (!element) continue;
    for (const match of getComputedStyle(element).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(match[1]);
  }
  let done = 0;
  const progress = screen?.querySelector('progress');
  if (progress) progress.max = urls.size || 1;
  // Bounded requests keep large card sets from starving the welcome artwork.
  const queue=[...urls],results=[];
  const assetsReady=Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{
    while(queue.length){
      const ok=await loadImage(queue.shift());results.push(ok);
      if(progress)progress.value=++done;
    }
  }));
  // Slow/missing artwork uses the existing scene fallback, never a trapped menu.
  let deadline;
  await Promise.race([Promise.all([assetsReady,welcomeReady]),new Promise(resolve=>{deadline=setTimeout(resolve,STARTUP_MAX_MS);})]);
  clearTimeout(deadline);
  app.inert = false;
  app.removeAttribute('aria-busy');
  screen?.remove();
  document.querySelector('button[data-play-mode="practice"]')?.focus({preventScroll:true});
}
