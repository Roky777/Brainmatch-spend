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
  exportState() {
    // Save transitions at their committed boundary. Unresolved second picks
    // restart face-down; resolved scores must never be applied twice.
    const transition=this.phase==='transition';
    return {cards:this.#cards.map(card=>({...card})),matched:[...this.matched],
      open:this.phase==='ready'&&this.actor==='child'?[...this.open]:[],
      actor:transition&&this.mode!=='practice'&&!this.history.at(-1)?.match
        ? (this.actor==='child'?'sparky':'child'):this.actor,
      phase:this.matched.size===this.pairCount?'complete':'ready',
      attempts:this.attempts,history:this.history.map(turn=>({...turn})),
      mode:this.mode,scores:{...this.scores}};
  }
  static restore(state) {
    const board=new MatchBoard(state.cards,{shuffled:false,mode:state.mode});
    const pairs=new Set(state.cards.map(card=>card.pairId));
    if(!Array.isArray(state.matched)||state.matched.some(id=>!pairs.has(id))||new Set(state.matched).size!==state.matched.length)throw Error('Invalid saved matches');
    if(!Array.isArray(state.history)||state.history.length>10000||state.history.some(turn=>!['child','sparky'].includes(turn.actor)||typeof turn.match!=='boolean'))throw Error('Invalid saved history');
    const scores={child:0,sparky:0};
    for(const turn of state.history)if(turn.match)scores[turn.actor]++;
    if(scores.child+scores.sparky!==state.matched.length||state.attempts!==state.history.length)throw Error('Invalid saved scores');
    if(!['child','sparky'].includes(state.actor)||!Array.isArray(state.open)||state.open.length>1||state.open.some(index=>!Number.isInteger(index)||index<0||index>=board.size||state.matched.includes(state.cards[index].pairId)))throw Error('Invalid saved turn');
    board.matched=new Set(state.matched);board.open=[...state.open];
    board.scores=scores;board.history=state.history.map(turn=>({...turn}));board.attempts=state.attempts;
    board.actor=board.mode==='practice'?'child':state.actor;
    board.phase=board.matched.size===board.pairCount?'complete':'ready';
    return board;
  }
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
