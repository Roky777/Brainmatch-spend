// This module accepts revealed observations and legal positions, never a deck.
export class CompanionMemory {
  constructor({ capacity = Infinity, accuracy = 1 } = {}) {
    this.seen = new Map();this.capacity=Math.max(2,capacity);
    this.accuracy=Math.max(0,Math.min(1,Number(accuracy)));
  }
  observe(observation) {
    if (!observation) return;
    this.seen.delete(observation.index);
    this.seen.set(observation.index, { ...observation });
    while (this.seen.size > this.capacity) this.seen.delete(this.seen.keys().next().value);
  }
  removePair(pairId) {
    for (const [index, card] of this.seen) if (card.pairId === pairId) this.seen.delete(index);
  }
  knownPair(available) {
    const first = new Map(), allowed = new Set(available);
    for (const [index, card] of this.seen) {
      if (!allowed.has(index)) continue;
      if (first.has(card.pairId)) return [first.get(card.pairId), index];
      first.set(card.pairId, index);
    }
    return null;
  }
  chooseFirst(available, rng = Math.random, accuracy = this.accuracy) {
    const known = this.knownPair(available);
    if (known && rng() < accuracy) return known[0];
    const unseen = available.filter(index => !this.seen.has(index));
    // When recall fails, avoid immediately stumbling into the known pair. This
    // reads as a believable memory mistake and leaves the discovery to the child.
    const alternatives=known?available.filter(index=>!known.includes(index)):available;
    const pool = unseen.length ? unseen : alternatives.length ? alternatives : available;
    return pool[Math.floor(rng() * pool.length)];
  }
  chooseSecond(available, first, rng = Math.random, accuracy = this.accuracy) {
    const options = available.filter(index => index !== first.index);
    const mate = options.find(index => this.seen.get(index)?.pairId === first.pairId);
    if (mate !== undefined && rng() < accuracy) return mate;
    const alternatives=mate===undefined?options:options.filter(index=>index!==mate);
    const unseen = alternatives.filter(index => !this.seen.has(index));
    const pool = unseen.length ? unseen : alternatives.length ? alternatives : options;
    return pool[Math.floor(rng() * pool.length)];
  }
  hint(available, selected = null) {
    if (selected) {
      const mate = available.find(index => index !== selected.index && this.seen.get(index)?.pairId === selected.pairId);
      if (mate !== undefined) return { type: 'mate', cards: [this.seen.get(mate)] };
      // Another known pair is not actionable with this first card already open.
      return { type: 'none', cards: [] };
    }
    const pair = this.knownPair(available);
    if (pair) return { type: 'pair', cards: pair.map(index => this.seen.get(index)) };
    const card = available.map(index => this.seen.get(index)).find(card => card && card.index !== selected?.index);
    return card ? { type: 'single', cards: [card] } : { type: 'none', cards: [] };
  }
}
