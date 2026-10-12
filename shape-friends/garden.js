// Small, state-driven scene rewards. Nothing here can inspect the hidden deck.
export const flowerArt = `<svg viewBox="0 0 240 140" aria-hidden="true"><g fill="none" stroke="#719576" stroke-width="3" stroke-linecap="round"><path d="M56 124q5-39-6-71m69 71q-8-56 5-91m53 91q-5-33 10-58"/><path d="M56 107q-32-4-32-20 26-4 32 20m59-25q-26-5-24-20 23 0 24 20m10 17q23-21 36-10-9 18-36 10m53 13q-19-15-29-5 11 16 29 5" fill="#9cb590" stroke-width="1.5"/></g><g class="garden-flower flower-one" transform="translate(50 53)"><g fill="#edb3a5" stroke="#c98e82" stroke-width="1"><ellipse cy="-12" rx="10" ry="16"/><ellipse cy="-12" rx="10" ry="16" transform="rotate(72)"/><ellipse cy="-12" rx="10" ry="16" transform="rotate(144)"/><ellipse cy="-12" rx="10" ry="16" transform="rotate(216)"/><ellipse cy="-12" rx="10" ry="16" transform="rotate(288)"/></g><circle r="7" fill="#e1b66c"/></g><g class="garden-flower flower-two" transform="translate(124 33)"><g fill="#fff0c5" stroke="#d6bb83" stroke-width="1"><ellipse cy="-11" rx="9" ry="15"/><ellipse cy="-11" rx="9" ry="15" transform="rotate(72)"/><ellipse cy="-11" rx="9" ry="15" transform="rotate(144)"/><ellipse cy="-11" rx="9" ry="15" transform="rotate(216)"/><ellipse cy="-11" rx="9" ry="15" transform="rotate(288)"/></g><circle r="7" fill="#daa761"/></g><g class="garden-flower flower-three" transform="translate(187 66)"><g fill="#b9ccda" stroke="#8ba5b5" stroke-width="1"><ellipse cy="-10" rx="9" ry="14"/><ellipse cy="-10" rx="9" ry="14" transform="rotate(72)"/><ellipse cy="-10" rx="9" ry="14" transform="rotate(144)"/><ellipse cy="-10" rx="9" ry="14" transform="rotate(216)"/><ellipse cy="-10" rx="9" ry="14" transform="rotate(288)"/></g><circle r="6" fill="#e8c276"/></g><path d="M19 126q90-14 198 0" fill="none" stroke="#b0b899" stroke-width="6" stroke-linecap="round" opacity=".5"/></svg>`;

export class LivingGarden {
  constructor(root, { speak, effect, discovered = 0 }) {
    this.root = root; this.speak = speak; this.effect = effect; this.growth = Math.min(3, discovered);
    root.innerHTML = `<button type="button" class="garden-bloom" aria-label="Visit the little flowers">${flowerArt}</button><div class="garden-magic" aria-hidden="true"></div>`;
    root.dataset.growth = this.growth;
    root.querySelector('button').addEventListener('click', () => {
      this.effect('chime'); this.flutter();
      this.speak(this.growth ? 'A little butterfly! Hello, friend.' : 'Our garden is sleeping. Let’s find a pair!');
    });
  }
  grow() {
    this.growth = Math.min(3, this.growth + 1); this.root.dataset.growth = this.growth;
    this.root.classList.remove('awakening'); void this.root.offsetWidth; this.root.classList.add('awakening');
    this.flutter();
  }
  flutter() {
    const magic = this.root.querySelector('.garden-magic'); magic.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const butterfly = document.createElement('i'); butterfly.className = 'paper-butterfly';
      butterfly.style.setProperty('--flight-x', `${(i - 1) * 80}px`); butterfly.style.setProperty('--delay', `${i * .18}s`);
      magic.append(butterfly);
      butterfly.addEventListener('animationend', () => butterfly.remove(), { once: true });
    }
  }
}
