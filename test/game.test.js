import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HUMAN, CPU, emptyBoard, evaluate, availableMoves, cpuMove,
} from '../www/game.js';

test('detects row, column and diagonal wins', () => {
  const b = emptyBoard();
  b[0] = b[1] = b[2] = HUMAN;
  assert.deepEqual(evaluate(b), { winner: HUMAN, line: [0, 1, 2] });

  const c = emptyBoard();
  c[2] = c[4] = c[6] = CPU;
  assert.deepEqual(evaluate(c), { winner: CPU, line: [2, 4, 6] });
});

test('detects a draw and an unfinished race', () => {
  const d = [HUMAN, CPU, HUMAN, HUMAN, CPU, CPU, CPU, HUMAN, HUMAN];
  assert.equal(evaluate(d).winner, 'draw');
  assert.equal(evaluate(emptyBoard()).winner, null);
});

test('every difficulty returns a legal move', () => {
  for (const diff of ['rookie', 'pro', 'champion']) {
    const b = emptyBoard();
    b[0] = HUMAN; b[4] = CPU; b[8] = HUMAN;
    const m = cpuMove(b, diff);
    assert.ok(availableMoves(b).includes(m), `${diff} picked ${m}`);
  }
});

test('pro takes a win when one is available', () => {
  const b = emptyBoard();
  b[0] = CPU; b[1] = CPU; b[3] = HUMAN; b[4] = HUMAN;
  assert.equal(cpuMove(b, 'pro', () => 0.99), 2);
});

// Exhaustively play every possible human line against the champion,
// for both "human starts" and "CPU starts". The champion must never lose.
function explore(board, toMove, stats) {
  const { winner } = evaluate(board);
  if (winner) { stats[winner] = (stats[winner] || 0) + 1; return; }
  if (toMove === CPU) {
    const m = cpuMove(board, 'champion', () => 0);
    board[m] = CPU;
    explore(board, HUMAN, stats);
    board[m] = null;
  } else {
    for (const m of availableMoves(board)) {
      board[m] = HUMAN;
      explore(board, CPU, stats);
      board[m] = null;
    }
  }
}

test('champion is unbeatable', () => {
  for (const first of [HUMAN, CPU]) {
    const stats = {};
    explore(emptyBoard(), first, stats);
    assert.equal(stats[HUMAN] || 0, 0, `human beat the champion (first=${first})`);
  }
});
