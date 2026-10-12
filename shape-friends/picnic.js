import { ITEMS, assetURL } from './content.js';
import { flowerArt } from './garden.js';

// The picnic is a separate interaction surface. It only receives discovered IDs.
export class Picnic {
  constructor(root, { speak, effect, progress = 0, onProgress = () => {} }) {
    this.root = root; this.speak = speak; this.effect = effect; this.selected = null;
    this.water = progress; this.onProgress = onProgress; this.page = 0; this.discoveries = [];
    this.drag = null; this.ignoreClickUntil = 0;
    this.reactions = new WeakMap(); this.zoneTimers = new WeakMap();
    this.root.addEventListener('click', event => this.click(event));
    this.root.addEventListener('pointerdown', event => this.down(event));
    this.root.addEventListener('pointermove', event => this.move(event));
    this.root.addEventListener('pointerup', event => this.up(event));
    this.root.addEventListener('pointercancel', () => this.cancelDrag());
  }
  render(discoveries) {
    this.cancelDrag(); this.selected = null;
    this.discoveries = discoveries; this.page = 0;
    this.root.innerHTML = `<div class="picnic-blanket" aria-hidden="true"></div><div class="picnic-items">${discoveries.map((id, i) => `<button type="button" class="picnic-toy" data-toy="${id}" style="--i:${i}" aria-label="Play with ${ITEMS[id].name}"><img src="${assetURL(id)}" alt="" draggable="false"><span>${ITEMS[id].name}</span></button>`).join('')}</div><div class="play-zones" aria-label="Places to play"><button class="play-zone" data-zone="bounce" aria-label="Bounce a round discovery on the trampoline"><svg viewBox="0 0 180 110" aria-hidden="true"><path d="m31 62-5 33m124-33 5 33M60 68v32m59-32v32" stroke="#4a7e73" stroke-width="8"/><ellipse cx="90" cy="60" rx="73" ry="29" fill="#f3939b"/><ellipse cx="90" cy="52" rx="74" ry="26" fill="#ffbec3"/><ellipse cx="90" cy="52" rx="58" ry="17" fill="#87c9bc"/><path d="m77 51 9 7 17-12" fill="none" stroke="#e5ffe8" stroke-width="5"/></svg><span>Boing!</span></button><button class="play-zone" data-zone="party" aria-label="Bring a discovery to the picnic table"><svg viewBox="0 0 180 110" aria-hidden="true"><path d="m52 53-8 45m82-45 8 45" stroke="#99683c" stroke-width="10"/><path d="M29 38h123l12 29H18Z" fill="#ffc97b"/><path d="M45 37h38l15 38-19-7-13 11-14-13Z" fill="#ed9290"/><path d="m52 48 31 2m-27 9 31 2M61 41l14 27" stroke="#fff1c7"/><ellipse cx="119" cy="49" rx="18" ry="6" fill="#fff7d0"/><path d="M98 34h22v11H98Z" fill="#93d6c5"/></svg><span>Picnic!</span></button><button class="play-zone" data-zone="chime" aria-label="Make music with a discovery"><svg viewBox="0 0 180 110" aria-hidden="true"><path d="m29 84 123-19" stroke="#bd9055" stroke-width="11"/><rect x="31" y="35" width="24" height="58" rx="7" fill="#f28e95" transform="rotate(-9 43 64)"/><rect x="57" y="32" width="24" height="52" rx="7" fill="#ffcc63" transform="rotate(-9 69 58)"/><rect x="84" y="29" width="24" height="46" rx="7" fill="#9fce7b" transform="rotate(-9 96 52)"/><rect x="111" y="27" width="24" height="40" rx="7" fill="#82c8c9" transform="rotate(-9 123 47)"/><path d="m66 29 57-14" stroke="#ad7950" stroke-width="5"/><circle cx="61" cy="30" r="10" fill="#ffd37d"/></svg><span>Ting!</span></button></div>`;
    const zones = this.root.querySelector('.play-zones');
    const water = document.createElement('button'); water.type = 'button'; water.className = 'play-zone watering-garden';
    water.dataset.zone = 'water'; water.dataset.growth = this.water; water.setAttribute('aria-label', 'Give the flowers a drink');
    water.innerHTML = `${flowerArt}<span class="water-drops" aria-hidden="true"></span><span>Help our flowers bloom</span>`;
    zones.prepend(water);
    this.root.querySelector('[data-zone="party"]').remove();
    const activities = document.createElement('nav'); activities.className = 'garden-activities'; activities.setAttribute('aria-label', 'Choose something to play');
    activities.innerHTML = `<button type="button" data-activity="water" aria-label="Water the flowers" aria-pressed="true"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C10 12 5 16 7 23q9 12 18 0c2-7-3-11-9-20Z" fill="#afcad1"/></svg></button><button type="button" data-activity="bounce" aria-label="Roll and bounce" aria-pressed="false"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="#e8bd86"/><path d="M8 7q15 9 15 19M6 20q10-9 19-12" fill="none"/></svg></button><button type="button" data-activity="chime" aria-label="Make a little tune" aria-pressed="false"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 24V8l15-3v16M12 9l15-3" fill="none"/><ellipse cx="8" cy="25" rx="5" ry="3" fill="#b7ba92"/><ellipse cx="23" cy="22" rx="5" ry="3" fill="#b7ba92"/></svg></button>`;
    this.root.prepend(activities);
    const more = document.createElement('button'); more.type = 'button'; more.className = 'more-toys'; more.dataset.moreToys = ''; more.setAttribute('aria-label', 'See more of our discoveries'); more.textContent = '→';
    this.root.querySelector('.picnic-items').after(more);
    this.showActivity('water', false);
  }
  showPage() {
    this.root.querySelectorAll('[data-toy]').forEach((toy, index) => { toy.hidden = Math.floor(index / 6) !== this.page; });
    this.root.querySelector('[data-more-toys]').hidden = this.discoveries.length <= 6;
  }
  showActivity(activity, announce = true) {
    this.cancelDrag(); this.selected = null;
    this.root.querySelectorAll('[data-zone]').forEach(zone => { zone.hidden = zone.dataset.zone !== activity; });
    this.root.querySelectorAll('[data-activity]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.activity === activity)));
    const helpful = this.discoveries.findIndex(id => activity === 'water' ? ['pour', 'chime'].includes(ITEMS[id].action) : activity === 'bounce' ? ['bounce', 'roll'].includes(ITEMS[id].action) : true);
    this.page = Math.floor(Math.max(0, helpful) / 6); this.showPage();
    if (announce) this.speak({ water: 'Can you give our flowers a drink?', bounce: 'Which friend can roll and bounce?', chime: 'Let’s make a little tune!' }[activity]);
  }
  click(event) {
    const activity = event.target.closest('[data-activity]');
    if (activity) { this.showActivity(activity.dataset.activity); return; }
    if (event.target.closest('[data-more-toys]')) { this.page = (this.page + 1) % Math.ceil(this.discoveries.length / 6); this.showPage(); return; }
    if (performance.now() < this.ignoreClickUntil) return;
    const toy = event.target.closest('[data-toy]'), zone = event.target.closest('[data-zone]');
    if (toy) {
      this.selected = toy.dataset.toy;
      this.root.querySelectorAll('[data-toy]').forEach(node => node.classList.toggle('selected', node === toy));
      this.react(toy, ITEMS[this.selected].action);
      this.speak({ bounce: 'Boing, boing!', roll: 'Round and round!', open: 'What’s inside?', slide: 'Wheee! A little slide.', party: 'Hooray! Picnic party!', spin: 'Twirl, little friend!', pour: 'A drink for our picnic!', chime: 'Tap, tap, ting!' }[ITEMS[this.selected].action]);
    }
    if (zone && this.selected) this.place(this.selected, zone);
  }
  down(event) {
    const toy = event.target.closest('[data-toy]'); if (!toy || event.button !== 0 || this.drag || event.isPrimary === false) return;
    this.drag = { toy, id: toy.dataset.toy, x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
    toy.setPointerCapture(event.pointerId);
  }
  move(event) {
    if (!this.drag) return;
    const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
    if (Math.hypot(dx, dy) > 8) this.drag.moved = true;
    if (this.drag.moved) {
      this.drag.toy.classList.add('dragging');
      this.drag.toy.style.translate = `${dx}px ${dy}px`;
      this.root.querySelectorAll('[data-zone]').forEach(zone => zone.classList.toggle('drop-ready', contains(zone, event)));
    }
  }
  up(event) {
    if (!this.drag) return;
    const { toy, id, moved } = this.drag;
    if (moved) {
      this.ignoreClickUntil = performance.now() + 350;
      const zone = [...this.root.querySelectorAll('[data-zone]')].find(zone => contains(zone, event));
      if (zone) this.place(id, zone); else this.react(toy, ITEMS[id].action);
    }
    this.cancelDrag();
  }
  cancelDrag() {
    if (this.drag) {
      try { this.drag.toy.releasePointerCapture(this.drag.pointerId); } catch {}
      this.drag.toy.classList.remove('dragging'); this.drag.toy.style.translate = '';
    }
    this.drag = null;
    this.root.querySelectorAll('.drop-ready').forEach(node => node.classList.remove('drop-ready'));
  }
  place(id, zone) {
    const item = ITEMS[id], action = zone.dataset.zone;
    if (action === 'water' && !['pour', 'chime'].includes(item.action)) { this.speak('What could hold a drink for our flowers?'); return; }
    const canBounce = ['bounce', 'roll'].includes(item.action);
    if (action === 'bounce' && !canBounce) {
      this.speak('Try a round friend here!'); return;
    }
    const toy = this.root.querySelector(`[data-toy="${id}"]`);
    if (action === 'water') {
      this.water = Math.min(3, this.water + 1); this.onProgress(this.water); zone.dataset.growth = this.water;
    }
    // The selected discovery actually arrives at the toy, instead of merely
    // shaking in its inventory position. Only a decorative clone is created.
    zone.querySelector('.zone-discovery')?.remove();
    const visitor = document.createElement('img'); visitor.src = assetURL(id); visitor.alt = '';
    visitor.className = 'zone-discovery'; visitor.setAttribute('aria-hidden', 'true');
    visitor.dataset.action = action; zone.append(visitor);
    this.react(toy, action); zone.classList.add('zone-happy');
    clearTimeout(this.zoneTimers.get(zone));
    this.zoneTimers.set(zone, setTimeout(() => { zone.classList.remove('zone-happy'); visitor.remove(); }, 2400));
    this.speak(action === 'water' ? this.water === 3 ? 'Our flowers are awake! Thank you!' : 'Look! A little flower woke up.' : action === 'bounce' ? 'Boing! A round friend!' : action === 'chime' ? 'Ting! We made a tune.' : 'Welcome to our picnic!');
  }
  react(toy, action) {
    clearTimeout(this.reactions.get(toy));
    toy.dataset.action = ''; void toy.offsetWidth; toy.dataset.action = action;
    this.effect(action); this.reactions.set(toy, setTimeout(() => { if (toy.isConnected) toy.dataset.action = ''; }, 1400));
    if (action === 'party') {
      const sparkles = document.createElement('span'); sparkles.className = 'toy-sparkles'; sparkles.setAttribute('aria-hidden', 'true');
      toy.append(sparkles); setTimeout(() => sparkles.remove(), 1400);
    }
  }
}
function contains(node, event) { const r = node.getBoundingClientRect(); return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom; }
