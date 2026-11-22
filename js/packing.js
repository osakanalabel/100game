// ランダム円充填で盤面を作る。DOM に触らない。

import {
  FIELD_W,
  FIELD_H,
  BALL_COUNT,
  DIAMETER_MIN,
  DIAMETER_MAX,
  BALL_GAP,
  PLACE_TRIES,
  MAX_REBUILDS,
  BALL_COLORS,
} from './config.js';
import { shuffle } from './random.js';

const DEFAULTS = {
  count: BALL_COUNT,
  width: FIELD_W,
  height: FIELD_H,
  dMin: DIAMETER_MIN,
  dMax: DIAMETER_MAX,
  gap: BALL_GAP,
  tries: PLACE_TRIES,
  maxRebuilds: MAX_REBUILDS,
};

/**
 * 重ならない円を count 個並べる。大きい円から順に、ランダムな位置を試して置く。
 * 1個でも置けなければ最初からやり直す。
 * @returns {{x:number, y:number, r:number}[]}
 */
export function packCircles(rng, options = {}) {
  const opt = { ...DEFAULTS, ...options };
  for (let attempt = 0; attempt < opt.maxRebuilds; attempt++) {
    const circles = tryPack(rng, opt);
    if (circles) return circles;
  }
  throw new Error(`packCircles: ${opt.maxRebuilds} 回作り直しても配置できませんでした`);
}

function tryPack(rng, { count, width, height, dMin, dMax, gap, tries }) {
  const radii = [];
  for (let i = 0; i < count; i++) radii.push((dMin + rng() * (dMax - dMin)) / 2);
  radii.sort((a, b) => b - a);

  const placed = [];
  for (const r of radii) {
    let ok = false;
    for (let t = 0; t < tries; t++) {
      const x = r + rng() * (width - 2 * r);
      const y = r + rng() * (height - 2 * r);
      if (fits(placed, x, y, r, gap)) {
        placed.push({ x, y, r });
        ok = true;
        break;
      }
    }
    if (!ok) return null;
  }
  return placed;
}

function fits(placed, x, y, r, gap) {
  for (const p of placed) {
    const dx = p.x - x;
    const dy = p.y - y;
    const min = p.r + r + gap;
    if (dx * dx + dy * dy < min * min) return false;
  }
  return true;
}

/**
 * 盤面を作る。番号・向き・色をランダムに割り当てる。
 * @returns {{n:number, x:number, y:number, r:number, angle:number, color:number}[]}
 */
export function createBoard(rng, options = {}) {
  const circles = packCircles(rng, options);
  const numbers = shuffle(
    Array.from({ length: circles.length }, (_, i) => i + 1),
    rng,
  );
  return circles.map((c, i) => ({
    n: numbers[i],
    x: c.x,
    y: c.y,
    r: c.r,
    angle: rng() * Math.PI * 2,
    color: Math.floor(rng() * BALL_COLORS.length),
  }));
}
