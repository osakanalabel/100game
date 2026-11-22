import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, parseData, addRecord } from '../js/storage.js';
import { DIFFICULTIES, HISTORY_SIZE, STORAGE_VERSION } from '../js/config.js';

const rec = (time, misses = 0) => ({ time, misses, date: '2026-11-22T00:00:00.000Z' });

test('記録：空や壊れたデータは空の記録になる', () => {
  for (const raw of [null, '', '{', '"x"', JSON.stringify({ version: STORAGE_VERSION + 1 })]) {
    const data = parseData(raw);
    for (const d of DIFFICULTIES) {
      assert.equal(data.records[d].best, null);
      assert.deepEqual(data.records[d].history, []);
    }
    assert.equal(data.settings.muted, false);
  }
});

test('記録：速いタイムだけがベストを更新する', () => {
  const data = emptyData();
  assert.equal(addRecord(data, 'easy', rec(50000)).isBest, true);
  assert.equal(addRecord(data, 'easy', rec(60000)).isBest, false);
  const r = addRecord(data, 'easy', rec(40000));
  assert.equal(r.isBest, true);
  assert.equal(r.previousBest.time, 50000);
  assert.equal(data.records.easy.best.time, 40000);
  assert.equal(data.records.normal.best, null);
});

test('記録：履歴は新しい順に最大10回', () => {
  const data = emptyData();
  for (let i = 1; i <= HISTORY_SIZE + 3; i++) addRecord(data, 'hard', rec(i * 1000));
  const h = data.records.hard.history;
  assert.equal(h.length, HISTORY_SIZE);
  assert.equal(h[0].time, (HISTORY_SIZE + 3) * 1000);
});

test('記録：保存して読み戻せる', () => {
  const data = emptyData();
  addRecord(data, 'maniac', rec(123456, 4));
  data.settings.muted = true;
  const back = parseData(JSON.stringify(data));
  assert.deepEqual(back, data);
});
