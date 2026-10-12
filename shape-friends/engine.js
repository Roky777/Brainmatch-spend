export function shuffle(cards, rng = Math.random) {
  const result = cards.map(card => ({ ...card }));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Normal play snapshots never reveal a hidden card's identity. The explicit
// preview snapshot is only for the child-facing study moment before play.
export class MatchBoard {
  #cards;
  constructor(cards, { rng = Math.random, shuffled = true, mode = 'challenge' } = {}) {
    if (!cards.length || cards.length % 2) throw new Error('A board needs complete pairs.');
    const counts = new Map();
    for (const card of cards) counts.set(card.pairId, (counts.get(card.pairId) || 0) + 1);
    if ([...counts.values()].some(count => count !== 2)) throw new Error('Every pair needs exactly two cards.');
    this.#cards = shuffled ? shuffle(cards, rng) : cards.map(card => ({ ...card }));
    this.pairCount = counts.size;
    this.open = [];
    this.matched = new Set();
    this.actor = 'child';
    this.phase = 'ready';
    this.attempts = 0;
    this.history = [];
    this.mode = mode === 'practice' ? 'practice' : 'challenge';
    this.scores = { child: 0, sparky: 0 };
  }
  get size() { return this.#cards.length; }
  available() { return this.#cards.flatMap((card, index) => this.matched.has(card.pairId) ? [] : [index]); }
  reveal(index, actor) {
    if (actor !== this.actor || this.phase !== 'ready' || !Number.isInteger(index) || index < 0 || index >= this.size || this.open.includes(index)) return null;
    const card = this.#cards[index];
    if (this.matched.has(card.pairId)) return null;
    this.open.push(index);
    if (this.open.length === 2) this.phase = 'resolving';
    return { ...card, index };
  }
  resolve() {
    if (this.phase !== 'resolving') return null;
    const [a, b] = this.open.map(index => this.#cards[index]);
    const result = { match: a.pairId === b.pairId, pairId: a.pairId, items: [a.item, b.item], indices: [...this.open], actor: this.actor };
    if (result.match) { this.matched.add(a.pairId); this.scores[this.actor]++; }
    this.history.push({ actor: this.actor, match: result.match });
    this.attempts++;
    // The controller owns the visual transition. Input remains locked until advance.
    this.phase = 'transition';
    return result;
  }
  advance() {
    if (this.phase !== 'transition') return false;
    this.open = [];
    // A pair earns another turn for either player. Only a miss hands over play.
    if (this.mode === 'practice') this.actor = 'child';
    else if (!this.history.at(-1)?.match) this.actor = this.actor === 'child' ? 'sparky' : 'child';
    this.phase = this.matched.size === this.pairCount ? 'complete' : 'ready';
    return true;
  }
  snapshot() {
    return this.#cards.map((card, index) => {
      const matched = this.matched.has(card.pairId), visible = matched || this.open.includes(index);
      return { index, matched, visible, card: visible ? { ...card } : null };
    });
  }
  previewSnapshot() {
    if(this.history.length||this.open.length||this.phase!=='ready')return this.snapshot();
    return this.#cards.map((card,index)=>({index,matched:false,visible:false,card:{...card}}));
  }
}
