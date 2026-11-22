import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tap, isCorrect, partnerOf } from '../js/game.js';
import { seededRandom } from '../js/random.js';
import { PAIRS, BALL_COUNT, MISS_LOCK_MS, DIFFICULTIES } from '../js/config.js';

const find = (game, n) => game.balls.find((b) => b.n === n);

/** 番号 n のボールの中心をタップする */
function tapNumber(game, n, t, rng = seededRandom(99)) {
  const b = find(game, n);
  assert.ok(b, `番号 ${n} のボールが盤面にない`);
  return tap(game, b.x, b.y, t, rng);
}

/** 1から順に、target までの1つ手前まで正しく押し進める */
function advanceTo(game, target, rng) {
  let t = 0;
  while (game.next < target) {
    const n = find(game, game.next) ? game.next : partnerOf(game.next);
    tapNumber(game, n, (t += 1000), rng);
  }
  return t;
}

test('組：4組は互いに正解、それ以外は入れ替わらない', () => {
  for (const [a, b] of PAIRS) {
    assert.ok(isCorrect(a, b));
    assert.ok(isCorrect(b, a));
    assert.ok(isCorrect(a, a));
  }
  for (const [a, b] of [[16, 91], [19, 61], [18, 81], [60, 9], [1, 2]]) {
    assert.ok(!isCorrect(a, b), `${a} と ${b} は組ではない`);
  }
});

for (const difficulty of DIFFICULTIES) {
  test(`${difficulty}：1から最後の番号まで押すとクリアする`, () => {
    const rng = seededRandom(3);
    const game = createGame(difficulty, rng);
    let last;
    let t = 0;
    while (!game.cleared) {
      const n = find(game, game.next) ? game.next : partnerOf(game.next);
      last = tapNumber(game, n, (t += 500), rng);
      assert.notEqual(last.type, 'miss');
    }
    assert.equal(last.type, 'clear');
    assert.equal(last.number, game.count);
    assert.equal(game.misses, 0);
  });
}

test('practice：ボールは1〜20の20個で、20番でクリアする', () => {
  const rng = seededRandom(41);
  const game = createGame('practice', rng);
  assert.equal(game.count, 20);
  assert.deepEqual(
    game.balls.map((b) => b.n).sort((a, b) => a - b),
    Array.from({ length: 20 }, (_, i) => i + 1),
  );
  const t = advanceTo(game, 20, rng);
  assert.equal(game.balls.length, 1);
  assert.equal(tapNumber(game, 20, t + 1000).type, 'clear');
});

test('practice：easy と同じく、正解したボールが消え、色付き', () => {
  const rng = seededRandom(42);
  const game = createGame('practice', rng);
  assert.equal(game.rules.vanish, true);
  assert.equal(game.rules.gray, false);
  assert.equal(game.rules.reshuffle, false);
  tapNumber(game, 1, 1000);
  assert.equal(game.balls.length, 19);
});

test('practice：6の番に「9」、9の番に残った「6」で進める', () => {
  const rng = seededRandom(43);
  const game = createGame('practice', rng);
  let t = advanceTo(game, 6, rng);
  assert.equal(tapNumber(game, 9, (t += 1000)).type, 'correct');
  t = advanceTo(game, 9, rng);
  assert.equal(tapNumber(game, 6, (t += 1000)).type, 'correct');
  assert.equal(game.next, 10);
});

test('組（normal）：6番で「9」を押し、9番でも同じ「9」を押してよい', () => {
  const rng = seededRandom(5);
  const game = createGame('normal', rng);
  let t = advanceTo(game, 6, rng);
  assert.equal(tapNumber(game, 9, (t += 1000)).type, 'correct');
  t = advanceTo(game, 9, rng);
  assert.equal(game.next, 9);
  assert.equal(tapNumber(game, 9, (t += 1000)).type, 'correct');
  assert.equal(game.next, 10);
});

test('組（easy）：片方が消えたあとは、残った方が正解になる', () => {
  for (const [a, b] of PAIRS) {
    const rng = seededRandom(a);
    const game = createGame('easy', rng);
    let t = advanceTo(game, a, rng);
    assert.equal(tapNumber(game, b, (t += 1000)).type, 'correct', `${a} の番に ${b}`);
    assert.equal(find(game, b), undefined, `${b} が消えていない`);
    t = advanceTo(game, b, rng);
    assert.equal(game.next, b);
    assert.equal(tapNumber(game, a, (t += 1000)).type, 'correct', `${b} の番に残った ${a}`);
  }
});

test('ミス：ミス回数が増え、停止中のタップは無視されミスに数えない', () => {
  const rng = seededRandom(11);
  const game = createGame('normal', rng);
  assert.equal(tapNumber(game, 50, 1000).type, 'miss');
  assert.equal(game.misses, 1);

  assert.equal(tapNumber(game, 1, 1000 + MISS_LOCK_MS - 1).type, 'locked');
  assert.equal(tapNumber(game, 50, 1000 + MISS_LOCK_MS - 1).type, 'locked');
  assert.equal(game.misses, 1);
  assert.equal(game.next, 1);

  assert.equal(tapNumber(game, 1, 1000 + MISS_LOCK_MS).type, 'correct');
  assert.equal(game.next, 2);
});

test('ミス：何もないところのタップは無視される', () => {
  const rng = seededRandom(12);
  const game = createGame('easy', rng);
  game.balls = [{ n: 1, x: 10, y: 10, r: 15, angle: 0, color: 0 }];
  assert.equal(tap(game, 300, 600, 1000, rng).type, 'ignored');
  assert.equal(game.misses, 0);
});

test('easy：正解したボールが消える', () => {
  const rng = seededRandom(21);
  const game = createGame('easy', rng);
  tapNumber(game, 1, 1000);
  assert.equal(game.balls.length, BALL_COUNT - 1);
  assert.equal(find(game, 1), undefined);
});

test('normal・hard：正解しても消えず、配置も変わらない', () => {
  for (const difficulty of ['normal', 'hard']) {
    const rng = seededRandom(22);
    const game = createGame(difficulty, rng);
    const before = game.balls;
    tapNumber(game, 1, 1000);
    assert.equal(game.balls, before);
    assert.equal(game.balls.length, BALL_COUNT);
  }
});

test('色：hard と maniac だけグレー', () => {
  assert.equal(createGame('easy', seededRandom(1)).rules.gray, false);
  assert.equal(createGame('normal', seededRandom(1)).rules.gray, false);
  assert.equal(createGame('hard', seededRandom(1)).rules.gray, true);
  assert.equal(createGame('maniac', seededRandom(1)).rules.gray, true);
});

test('maniac：正解で盤面を作り直し、ミスでは作り直さない', () => {
  const rng = seededRandom(31);
  const game = createGame('maniac', rng);

  const before = game.balls;
  assert.equal(tapNumber(game, 50, 1000, rng).type, 'miss');
  assert.equal(game.balls, before);

  assert.equal(tapNumber(game, 1, 5000, rng).type, 'correct');
  assert.notEqual(game.balls, before);
  assert.equal(game.balls.length, BALL_COUNT);
  assert.notDeepEqual(
    game.balls.map((b) => [b.x, b.y]),
    before.map((b) => [b.x, b.y]),
  );
});

test('未知の難易度は例外', () => {
  assert.throws(() => createGame('nomal', seededRandom(1)));
});
