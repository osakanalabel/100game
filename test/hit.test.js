import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findHit } from '../js/hit.js';
import { HIT_MAX_DIST } from '../js/config.js';

const ball = (n, x, y, r) => ({ n, x, y, r, angle: 0, color: 0 });

test('判定：ボールの内側なら必ずそのボール', () => {
  const big = ball(1, 100, 100, 20);
  const small = ball(2, 125, 100, 4);
  // big の内側だが、small の中心の方が近い位置
  assert.equal(findHit([big, small], 118, 100), big);
});

test('判定：縁から上限ちょうどなら当たり、超えたら無視', () => {
  const b = ball(1, 0, 0, 15);
  assert.equal(findHit([b], 15 + HIT_MAX_DIST, 0), b);
  assert.equal(findHit([b], 15 + HIT_MAX_DIST + 0.01, 0), null);
});

test('判定：中心ではなく縁までの距離で比べる', () => {
  const big = ball(1, 0, 0, 20);
  const small = ball(2, 40, 0, 5);
  // 中心までは big 22、small 18 だが、縁までは big 2、small 13
  assert.equal(findHit([big, small], 22, 0), big);
});

test('判定：ボールがなければ null', () => {
  assert.equal(findHit([], 0, 0), null);
});
