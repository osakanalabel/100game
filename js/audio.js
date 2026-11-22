// 効果音。Web Audio API で合成する（音声ファイルは使わない）。

import { BALL_COUNT } from './config.js';

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** ユーザー操作の中で呼ぶ。スマホはこれより前に音を鳴らせない */
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, duration, { type = 'sine', gain = 0.2, delay = 0, slideTo = null } = {}) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  countdown() {
    this.tone(660, 0.12, { type: 'triangle', gain: 0.22 });
  }

  start() {
    this.tone(1320, 0.28, { type: 'triangle', gain: 0.22 });
  }

  /** 番号が進むほど音程が上がる（2オクターブ） */
  correct(number) {
    const f = 392 * Math.pow(2, ((number - 1) / (BALL_COUNT - 1)) * 2);
    this.tone(f, 0.09, { type: 'triangle', gain: 0.2 });
    this.tone(f * 2, 0.05, { type: 'sine', gain: 0.05 });
  }

  miss() {
    this.tone(150, 0.2, { type: 'square', gain: 0.08, slideTo: 90 });
  }

  clear() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', gain: 0.2, delay: i * 0.1 }));
    this.tone(1046.5, 0.7, { type: 'sine', gain: 0.12, delay: 0.4 });
    this.tone(1318.5, 0.7, { type: 'sine', gain: 0.08, delay: 0.4 });
  }
}
