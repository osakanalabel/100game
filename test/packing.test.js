import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBoard, packCircles } from '../js/packing.js';
import { seededRandom } from '../js/random.js';
import {
  FIELD_W,
  FIELD_H,
  DIAMETER_MIN,
  DIAMETER_MAX,
  BALL_GAP,
  BALL_COUNT,
  BALL_COLORS,
  DIFFICULTY_RULES,
} from '../js/config.js';

const EPS = 1e-9;

test('盤面：100個すべてが盤面に収まり、重ならず、直径が範囲内', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const balls = createBoard(seededRandom(seed));
    assert.equal(balls.length, BALL_COUNT);

    for (const b of balls) {
      assert.ok(b.x - b.r >= -EPS && b.x + b.r <= FIELD_W + EPS, `横にはみ出し seed=${seed}`);
      assert.ok(b.y - b.r >= -EPS && b.y + b.r <= FIELD_H + EPS, `縦にはみ出し seed=${seed}`);
      const d = b.r * 2;
      assert.ok(d >= DIAMETER_MIN - EPS && d <= DIAMETER_MAX + EPS, `直径 ${d} seed=${seed}`);
      assert.ok(b.angle >= 0 && b.angle < Math.PI * 2);
      assert.ok(Number.isInteger(b.color) && b.color >= 0 && b.color < BALL_COLORS.length);
    }

    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(dist + EPS >= a.r + b.r + BALL_GAP, `重なり seed=${seed}`);
      }
    }
  }
});

test('盤面（practice）：20個すべてが盤面に収まり、重ならず、直径が 67〜107', () => {
  const { count, dMin, dMax } = DIFFICULTY_RULES.practice.board;
  assert.deepEqual([count, dMin, dMax], [20, 67, 107]);
  for (let seed = 1; seed <= 50; seed++) {
    const balls = createBoard(seededRandom(seed), DIFFICULTY_RULES.practice.board);
    assert.equal(balls.length, 20);
    assert.deepEqual(
      balls.map((b) => b.n).sort((a, b) => a - b),
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
    for (const b of balls) {
      assert.ok(b.x - b.r >= -EPS && b.x + b.r <= FIELD_W + EPS, `横にはみ出し seed=${seed}`);
      assert.ok(b.y - b.r >= -EPS && b.y + b.r <= FIELD_H + EPS, `縦にはみ出し seed=${seed}`);
      assert.ok(b.r * 2 >= dMin - EPS && b.r * 2 <= dMax + EPS, `直径 ${b.r * 2} seed=${seed}`);
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const dist = Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y);
        assert.ok(dist + EPS >= balls[i].r + balls[j].r + BALL_GAP, `重なり seed=${seed}`);
      }
    }
  }
});

test('盤面：番号は1〜100がちょうど1回ずつ', () => {
  const balls = createBoard(seededRandom(7));
  const nums = balls.map((b) => b.n).sort((a, b) => a - b);
  assert.deepEqual(nums, Array.from({ length: BALL_COUNT }, (_, i) => i + 1));
});

test('盤面：同じ種なら同じ配置、違う種なら違う配置', () => {
  const a = createBoard(seededRandom(42));
  const b = createBoard(seededRandom(42));
  const c = createBoard(seededRandom(43));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('充填：どうしても置けなければ例外を投げる', () => {
  assert.throws(() =>
    packCircles(seededRandom(1), { count: 10, dMin: 300, dMax: 300, tries: 20, maxRebuilds: 3 }),
  );
});
