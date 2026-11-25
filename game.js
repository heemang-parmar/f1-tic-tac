// Pure game logic — no DOM. Shared by the app and the tests.

export const HUMAN = 'H';
export const CPU = 'C';

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

export function emptyBoard() {
  return Array(9).fill(null);
}

export function availableMoves(board) {
  const moves = [];
  for (let i = 0; i < 9; i++) if (!board[i]) moves.push(i);
  return moves;
}

/** Returns { winner, line } where winner is HUMAN, CPU, 'draw', or null (still racing). */
export function evaluate(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every(Boolean)) return { winner: 'draw', line: null };
  return { winner: null, line: null };
}

const other = (p) => (p === HUMAN ? CPU : HUMAN);

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Move that completes a line for `player`, or -1. */
function findWinningMove(board, player) {
  for (const m of availableMoves(board)) {
    board[m] = player;
    const won = evaluate(board).winner === player;
    board[m] = null;
    if (won) return m;
  }
  return -1;
}

// Minimax with depth so the CPU wins fast and loses slow.
function minimax(board, toMove, me, depth) {
  const { winner } = evaluate(board);
  if (winner === me) return 10 - depth;
  if (winner === other(me)) return depth - 10;
  if (winner === 'draw') return 0;

  let best = toMove === me ? -Infinity : Infinity;
  for (const m of availableMoves(board)) {
    board[m] = toMove;
    const score = minimax(board, other(toMove), me, depth + 1);
    board[m] = null;
    best = toMove === me ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

function bestMoves(board, me) {
  let best = -Infinity;
  let moves = [];
  for (const m of availableMoves(board)) {
    board[m] = me;
    const score = minimax(board, other(me), me, 1);
    board[m] = null;
    if (score > best) { best = score; moves = [m]; }
    else if (score === best) moves.push(m);
  }
  return moves;
}

export const DIFFICULTIES = {
  rookie: { label: 'Rookie', blurb: 'Still learning the circuit' },
  pro: { label: 'Pro', blurb: 'Solid racecraft, makes mistakes' },
  champion: { label: 'Champion', blurb: 'Never makes a mistake' },
};

/**
 * Pick the CPU's move.
 * rookie   – usually random, takes an obvious win sometimes.
 * pro      – wins/blocks reliably, otherwise prefers centre/corners; can be beaten with a fork.
 * champion – perfect play (minimax); cannot be beaten.
 */
export function cpuMove(board, difficulty = 'pro', rng = Math.random) {
  const b = board.slice();
  const moves = availableMoves(b);
  if (moves.length === 0) return -1;

  if (difficulty === 'rookie') {
    if (rng() < 0.5) {
      const win = findWinningMove(b, CPU);
      if (win !== -1) return win;
    }
    return pick(moves, rng);
  }

  if (difficulty === 'pro') {
    const win = findWinningMove(b, CPU);
    if (win !== -1) return win;
    const block = findWinningMove(b, HUMAN);
    if (block !== -1 && rng() < 0.9) return block;
    if (rng() < 0.15) return pick(moves, rng);
    if (!b[4]) return 4;
    const corners = [0, 2, 6, 8].filter((i) => !b[i]);
    if (corners.length) return pick(corners, rng);
    return pick(moves, rng);
  }

  // champion
  return pick(bestMoves(b, CPU), rng);
}

/** Championship points for a race result. */
export const POINTS = { win: 25, draw: 10, loss: 0 };
