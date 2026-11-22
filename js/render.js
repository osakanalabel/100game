// Canvas 描画。論理座標（FIELD_W × FIELD_H）と画面座標の変換はこのファイルだけで行う。

import {
  FIELD_W,
  FIELD_H,
  BALL_COLORS,
  GRAY_COLOR,
  RIPPLE_MS,
  FLASH_MS,
  POP_MS,
  SHAKE_MS,
} from './config.js';

const FONT_FAMILY = '"Roboto Mono", ui-monospace, "Courier New", monospace';
const FIELD_BG = '#1b2130';
const FIELD_PAD = 6; // 盤面の外側の余白（CSS px）

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.layer = document.createElement('canvas'); // ボールを描いておく層
    this.layerCtx = this.layer.getContext('2d');
    this.balls = [];
    this.gray = false;
    this.dirty = true;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 3);
    this.dpr = dpr;
    this.cssW = rect.width;
    this.cssH = rect.height;
    for (const c of [this.canvas, this.layer]) {
      c.width = Math.max(1, Math.round(rect.width * dpr));
      c.height = Math.max(1, Math.round(rect.height * dpr));
    }
    this.scale = Math.max(
      0.01,
      Math.min((rect.width - FIELD_PAD * 2) / FIELD_W, (rect.height - FIELD_PAD * 2) / FIELD_H),
    );
    this.offsetX = (rect.width - FIELD_W * this.scale) / 2;
    this.offsetY = (rect.height - FIELD_H * this.scale) / 2;
    this.dirty = true;
  }

  /** 画面座標（clientX/Y）→ 論理座標 */
  toField(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.offsetX) / this.scale,
      y: (clientY - rect.top - this.offsetY) / this.scale,
    };
  }

  setBoard(balls, gray) {
    this.balls = balls;
    this.gray = gray;
    this.dirty = true;
  }

  colorOf(ball) {
    return this.gray ? GRAY_COLOR : BALL_COLORS[ball.color];
  }

  /** 論理座標で描けるように変換を設定する */
  applyFieldTransform(ctx, shakeX = 0) {
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, (this.offsetX + shakeX) * this.dpr, this.offsetY * this.dpr);
  }

  renderLayer() {
    const ctx = this.layerCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.layer.width, this.layer.height);
    this.applyFieldTransform(ctx);
    for (const b of this.balls) drawBall(ctx, b, this.colorOf(b));
    this.dirty = false;
  }

  /**
   * @param {{hidden:boolean, effects:object[], now:number, shakeUntil:number}} state
   */
  draw({ hidden, effects, now, shakeUntil }) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let shakeX = 0;
    if (!this.reducedMotion && now < shakeUntil) {
      const p = (shakeUntil - now) / SHAKE_MS;
      shakeX = Math.sin(now / 18) * 6 * p;
    }

    this.applyFieldTransform(ctx, shakeX);
    ctx.fillStyle = FIELD_BG;
    roundRect(ctx, 0, 0, FIELD_W, FIELD_H, 14);
    ctx.fill();
    if (hidden) return;

    if (this.dirty) this.renderLayer();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.layer, shakeX * this.dpr, 0);

    this.applyFieldTransform(ctx, shakeX);
    for (const e of effects) drawEffect(ctx, e, now);
  }
}

function drawBall(ctx, b, color) {
  // 数字にかからないよう、光沢は左上の縁寄りに小さく置き、下側を少し暗くする
  const g = ctx.createRadialGradient(b.x - b.r * 0.5, b.y - b.r * 0.55, 0, b.x, b.y, b.r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.18, color.fill);
  g.addColorStop(0.85, color.fill);
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fillStyle = color.fill;
  ctx.fill();
  ctx.fillStyle = g;
  ctx.fill();

  const digits = String(b.n).length;
  const size = b.r * (digits === 1 ? 1.25 : digits === 2 ? 1.05 : 0.78);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);
  ctx.fillStyle = color.text;
  ctx.font = `700 ${size}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(b.n), 0, size * 0.04);
  ctx.restore();
}

function drawEffect(ctx, e, now) {
  const p = (now - e.t0) / e.duration;
  if (p < 0 || p >= 1) return;
  ctx.save();
  if (e.kind === 'ripple') {
    ctx.globalAlpha = (1 - p) * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * (1 - p) + 1;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 8 + p * 34, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.kind === 'flash') {
    ctx.globalAlpha = (1 - p) * 0.65;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'pop') {
    ctx.globalAlpha = (1 - p) * 0.8;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * (1 + p * 0.5), 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'miss') {
    ctx.globalAlpha = (1 - p) * 0.9;
    ctx.strokeStyle = '#ff4d4f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 演出の作成（main.js から使う） */
export const effect = {
  ripple: (x, y, t0) => ({ kind: 'ripple', x, y, t0, duration: RIPPLE_MS }),
  flash: (b, t0) => ({ kind: 'flash', x: b.x, y: b.y, r: b.r, t0, duration: FLASH_MS }),
  pop: (b, color, t0) => ({ kind: 'pop', x: b.x, y: b.y, r: b.r, color, t0, duration: POP_MS }),
  miss: (b, t0) => ({ kind: 'miss', x: b.x, y: b.y, r: b.r, t0, duration: SHAKE_MS }),
};
