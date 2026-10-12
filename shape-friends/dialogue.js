// Short context-specific lines, with rotating variants instead of constant narration.
export const LINES = {
  practice: ['Welcome to practice! Pick any two cards!'],
  challenge: ['Ready to play against me? You go first!'],
  match: ['Oh, brilliant! You spotted another shape pair!'],
  sparkyMatch: ['I found a pair! My memory worked!', 'These two belong together! What a lovely pair.'],
  miss: ['Not a pair yet. Now we know both cards.', 'Those aren’t a pair, but we’ll remember them.'],
  sparkyMiss: ['Oops, I missed that pair. Your turn!'],
  win: ['You found more pairs than me! Wonderful playing!'],
  lose: ['I found more this time. Want another round?'],
  tie: ['It’s a tie! We remembered together.'],
  done: ['Every pair is found. You did it!'],
};
export class Dialogue {
  constructor() { this.counts = new Map(); }
  next(event) {
    const lines = LINES[event]; if (!lines) throw Error(`Unknown dialogue event: ${event}`);
    const count = this.counts.get(event) || 0; this.counts.set(event, count + 1);
    return lines[count % lines.length];
  }
}
