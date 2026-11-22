// タップ位置からボールを選ぶ。DOM に触らない。

import { HIT_MAX_DIST } from './config.js';

/**
 * タップ位置から「ボールの縁までの距離」が最小のボールを返す。
 * 内側を押せば距離はマイナスになるので、必ずそのボールが選ばれる。
 * 最小の距離が maxDist を超えたら null（タップを無視する）。
 */
export function findHit(balls, x, y, maxDist = HIT_MAX_DIST) {
  let best = null;
  let bestDist = Infinity;
  for (const b of balls) {
    const d = Math.hypot(b.x - x, b.y - y) - b.r;
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return bestDist <= maxDist ? best : null;
}
