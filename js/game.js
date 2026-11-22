// ゲームの状態と難易度ルール。DOM に触らない。
// 時刻 t は「一時停止を除いた経過時間（ミリ秒）」を受け取る。

import { PAIRS, DIFFICULTY_RULES, MISS_LOCK_MS } from './config.js';
import { createBoard } from './packing.js';
import { findHit } from './hit.js';

const PARTNER = new Map();
for (const [a, b] of PAIRS) {
  PARTNER.set(a, b);
  PARTNER.set(b, a);
}

/** 組の相手の番号。組でなければ null */
export function partnerOf(n) {
  return PARTNER.get(n) ?? null;
}

/** target の番に、番号 n のボールを押したら正解か */
export function isCorrect(target, n) {
  return n === target || PARTNER.get(target) === n;
}

export function createGame(difficulty, rng) {
  const rules = DIFFICULTY_RULES[difficulty];
  if (!rules) throw new Error(`未知の難易度: ${difficulty}`);
  return {
    difficulty,
    rules,
    count: rules.board.count,
    balls: createBoard(rng, rules.board),
    next: 1,
    misses: 0,
    lockedUntil: -Infinity,
    cleared: false,
  };
}

/**
 * タップを処理する。game をその場で更新し、起きたことを返す。
 * - ignored：どのボールにも当たらない、またはクリア後
 * - locked：ミス後の停止中（ミスに数えない）
 * - miss：違うボールを押した
 * - correct：正解（number はその番の番号）
 * - clear：最後の番号（100、practice は20）に正解した
 */
export function tap(game, x, y, t, rng) {
  if (game.cleared) return { type: 'ignored' };
  if (t < game.lockedUntil) return { type: 'locked' };

  const ball = findHit(game.balls, x, y);
  if (!ball) return { type: 'ignored' };

  if (!isCorrect(game.next, ball.n)) {
    game.misses += 1;
    game.lockedUntil = t + MISS_LOCK_MS;
    return { type: 'miss', ball };
  }

  const number = game.next;
  if (game.rules.vanish) game.balls = game.balls.filter((b) => b !== ball);
  game.next += 1;

  if (game.next > game.count) {
    game.cleared = true;
    return { type: 'clear', ball, number };
  }
  if (game.rules.reshuffle) game.balls = createBoard(rng, game.rules.board);
  return { type: 'correct', ball, number };
}
