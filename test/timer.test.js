import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer, startTimer, pauseTimer, elapsed, formatTime } from '../js/timer.js';

test('計測：一時停止中の時間はタイムに入らない', () => {
  const timer = createTimer();
  assert.equal(elapsed(timer, 500), 0);
  startTimer(timer, 1000);
  assert.equal(elapsed(timer, 3000), 2000);
  pauseTimer(timer, 3000);
  assert.equal(elapsed(timer, 9000), 2000);
  startTimer(timer, 10000);
  assert.equal(elapsed(timer, 10500), 2500);
});

test('計測：二重に開始・停止しても狂わない', () => {
  const timer = createTimer();
  startTimer(timer, 0);
  startTimer(timer, 500);
  pauseTimer(timer, 1000);
  pauseTimer(timer, 2000);
  assert.equal(elapsed(timer, 3000), 1000);
});

test('表示：分:秒.百分の一秒', () => {
  assert.equal(formatTime(0), '00:00.00');
  assert.equal(formatTime(83456), '01:23.45');
  assert.equal(formatTime(59999), '00:59.99');
  assert.equal(formatTime(600000), '10:00.00');
});
