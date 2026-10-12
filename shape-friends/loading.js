// One decoded-image cache shared by startup, boards and character animations.
const images = new Map();
// Keep the welcome screen readable on cached visits, without delaying slow
// connections further: this runs alongside actual asset loading.
export const STARTUP_MIN_MS = 1200;
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
export function loadImage(src) {
  const url = new URL(src, document.baseURI).href;
  if (!images.has(url)) images.set(url, new Promise(resolve => {
    const image = new Image();
    const timeout = setTimeout(() => finish(false), 15000);
    let settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true; clearTimeout(timeout);
      if (!ok) images.delete(url); // Allow a later visit to retry a failed request.
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
  const results = await Promise.all([...urls].map(async src => {
    const ok = await loadImage(src);
    if (progress) progress.value = ++done;
    return ok;
  }));
  await welcomeReady;
  if (results.some(ok => !ok) && screen) {
    screen.querySelector('p').textContent = 'Some pictures could not load. Check your connection and try again.';
    const retry = document.createElement('button');
    retry.textContent = 'Try again';
    retry.onclick = () => location.reload();
    screen.append(retry);
    return;
  }
  app.inert = false;
  app.removeAttribute('aria-busy');
  screen?.remove();
  document.querySelector('button[data-play-mode="practice"]')?.focus({preventScroll:true});
}
