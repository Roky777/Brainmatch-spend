export const LEVELS = Object.freeze({
  gentle: { name: 'Little spark', pairs: 2, capacity: 2, accuracy: .28, description: '4 cards · Sparky is learning' },
  growing: { name: 'Bright spark', pairs: 3, capacity: 3, accuracy: .44, description: '6 cards · Sparky is still practising' },
  clever: { name: 'Super spark', pairs: 4, capacity: 5, accuracy: .62, description: '8 cards · Sparky remembers more' },
});
export function playOptions(mode = 'practice', level = 'gentle') {
  return { mode: mode === 'challenge' ? 'challenge' : 'practice', level: LEVELS[level] ? level : 'gentle' };
}
export function resultFor(board) {
  if (board.phase !== 'complete') return null;
  if (board.mode === 'practice') return 'practice';
  return board.scores.child === board.scores.sparky ? 'tie' : board.scores.child > board.scores.sparky ? 'win' : 'lose';
}
