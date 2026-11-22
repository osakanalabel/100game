// 記録と設定の読み書き。localStorage にはこのファイルからだけ触る。
// オンラインランキングを足すときは、このファイルを差し替える。

import { DIFFICULTIES, HISTORY_SIZE, STORAGE_KEY, STORAGE_VERSION } from './config.js';

export function emptyData() {
  const records = {};
  for (const d of DIFFICULTIES) records[d] = { best: null, history: [] };
  return { version: STORAGE_VERSION, records, settings: { muted: false } };
}

/** 保存された文字列を読む。壊れていたり版が違えば空のデータを返す */
export function parseData(raw) {
  const data = emptyData();
  if (!raw) return data;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return data;
  }
  if (!parsed || parsed.version !== STORAGE_VERSION) return data;

  for (const d of DIFFICULTIES) {
    const r = parsed.records?.[d];
    if (!r) continue;
    if (isRecord(r.best)) data.records[d].best = r.best;
    if (Array.isArray(r.history)) {
      data.records[d].history = r.history.filter(isRecord).slice(0, HISTORY_SIZE);
    }
  }
  data.settings.muted = parsed.settings?.muted === true;
  return data;
}

function isRecord(v) {
  return (
    v != null &&
    Number.isFinite(v.time) &&
    Number.isFinite(v.misses) &&
    typeof v.date === 'string'
  );
}

/**
 * 記録を足す。data をその場で更新する。
 * @param record {{time:number, misses:number, date:string}}
 * @returns {{isBest:boolean, previousBest:object|null}}
 */
export function addRecord(data, difficulty, record) {
  const r = data.records[difficulty];
  const previousBest = r.best;
  const isBest = previousBest == null || record.time < previousBest.time;
  if (isBest) r.best = record;
  r.history = [record, ...r.history].slice(0, HISTORY_SIZE);
  return { isBest, previousBest };
}

export function loadData() {
  try {
    return parseData(globalThis.localStorage?.getItem(STORAGE_KEY));
  } catch {
    return emptyData();
  }
}

export function saveData(data) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 保存できない環境（プライベートモードなど）でも遊べるようにする
  }
}
