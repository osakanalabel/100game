// エントリ。画面遷移、入力、描画ループ。

import {
  COUNTDOWN_FROM,
  COUNTDOWN_STEP_MS,
  DIFFICULTIES,
  BALL_COLORS,
  GRAY_COLOR,
  SHAKE_MS,
} from './config.js';
import { createGame, tap } from './game.js';
import { createTimer, startTimer, pauseTimer, elapsed, formatTime } from './timer.js';
import { loadData, saveData, addRecord } from './storage.js';
import { Renderer, effect } from './render.js';
import { Sound } from './audio.js';
import { registerServiceWorker } from './pwa.js';

const $ = (id) => document.getElementById(id);

const screens = { title: $('title'), game: $('game') };
const overlays = { countdown: $('countdown'), pause: $('pause'), result: $('result') };

const sound = new Sound();
const renderer = new Renderer($('board'));
const data = loadData();
sound.muted = data.settings.muted;

/** 'title' | 'countdown' | 'playing' | 'paused' | 'result' */
let phase = 'title';
let game = null;
let timer = null;
let effects = [];
let shakeUntil = 0;
let countdownHandles = [];

// ---------- 画面 ----------

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function showOverlay(name) {
  for (const [key, el] of Object.entries(overlays)) el.hidden = key !== name;
}

function renderTitle() {
  for (const d of DIFFICULTIES) {
    const best = data.records[d].best;
    document.querySelector(`[data-best="${d}"]`).textContent = best ? formatTime(best.time) : '--:--.--';
  }
}

function renderMute() {
  for (const btn of document.querySelectorAll('[data-mute]')) {
    btn.setAttribute('aria-pressed', String(sound.muted));
    btn.setAttribute('aria-label', sound.muted ? '音を出す' : '音を消す');
    btn.classList.toggle('is-muted', sound.muted);
  }
}

function updateHud() {
  $('hud-next').textContent = game.cleared ? '—' : String(game.next);
  $('hud-misses').textContent = String(game.misses);
}

// ---------- 進行 ----------

function startGame(difficulty) {
  sound.unlock();
  game = createGame(difficulty, Math.random);
  timer = createTimer();
  effects = [];
  shakeUntil = 0;
  $('hud-difficulty').textContent = difficulty;
  $('hud-time').textContent = formatTime(0);
  showScreen('game');
  renderer.resize();
  renderer.setBoard(game.balls, game.rules.gray);
  updateHud();
  runCountdown();
}

function clearCountdown() {
  for (const h of countdownHandles) clearTimeout(h);
  countdownHandles = [];
}

/** 盤面を隠して 3・2・1 を数え、表示した瞬間に計測を始める（再開も同じ） */
function runCountdown() {
  clearCountdown();
  phase = 'countdown';
  showOverlay('countdown');
  const num = $('countdown-num');
  for (let i = 0; i < COUNTDOWN_FROM; i++) {
    countdownHandles.push(
      setTimeout(() => {
        num.textContent = String(COUNTDOWN_FROM - i);
        num.classList.remove('tick');
        void num.offsetWidth; // アニメーションをやり直す
        num.classList.add('tick');
        sound.countdown();
      }, i * COUNTDOWN_STEP_MS),
    );
  }
  countdownHandles.push(
    setTimeout(() => {
      showOverlay(null);
      phase = 'playing';
      startTimer(timer, performance.now());
      sound.start();
    }, COUNTDOWN_FROM * COUNTDOWN_STEP_MS),
  );
}

function pause() {
  if (phase !== 'playing' && phase !== 'countdown') return;
  clearCountdown();
  pauseTimer(timer, performance.now());
  phase = 'paused';
  showOverlay('pause');
}

function resume() {
  if (phase !== 'paused') return;
  sound.unlock();
  runCountdown();
}

function quit() {
  clearCountdown();
  phase = 'title';
  game = null;
  showOverlay(null);
  showScreen('title');
  renderTitle();
}

function finish(time) {
  phase = 'result';
  const record = { time: Math.round(time), misses: game.misses, date: new Date().toISOString() };
  const { isBest, previousBest } = addRecord(data, game.difficulty, record);
  saveData(data);

  $('result-difficulty').textContent = game.difficulty;
  $('result-time').textContent = formatTime(record.time);
  $('result-misses').textContent = String(record.misses);
  const bestEl = $('result-best');
  if (isBest) {
    bestEl.textContent = previousBest ? `ベスト更新（前回 ${formatTime(previousBest.time)}）` : 'はじめての記録';
    bestEl.classList.add('is-new');
  } else {
    bestEl.textContent = `ベスト ${formatTime(data.records[game.difficulty].best.time)}`;
    bestEl.classList.remove('is-new');
  }
  showOverlay('result');
}

// ---------- 入力 ----------

function onPointerDown(e) {
  if (phase !== 'playing') return;
  e.preventDefault();
  const now = performance.now();
  const p = renderer.toField(e.clientX, e.clientY);
  const result = tap(game, p.x, p.y, elapsed(timer, now), Math.random);

  switch (result.type) {
    case 'correct':
    case 'clear': {
      sound.correct(result.number);
      effects.push(effect.ripple(p.x, p.y, now));
      if (game.rules.vanish) {
        const color = game.rules.gray ? GRAY_COLOR.fill : BALL_COLORS[result.ball.color].fill;
        effects.push(effect.pop(result.ball, color, now));
        renderer.setBoard(game.balls, game.rules.gray);
      } else if (game.rules.reshuffle && result.type === 'correct') {
        renderer.setBoard(game.balls, game.rules.gray);
      } else {
        effects.push(effect.flash(result.ball, now));
      }
      updateHud();
      if (result.type === 'clear') {
        pauseTimer(timer, now);
        sound.clear();
        $('hud-time').textContent = formatTime(elapsed(timer, now));
        finish(elapsed(timer, now));
      }
      break;
    }
    case 'miss':
      sound.miss();
      shakeUntil = now + SHAKE_MS;
      effects.push(effect.miss(result.ball, now));
      updateHud();
      break;
    default:
      break;
  }
}

// ---------- ループ ----------

function frame(now) {
  if (phase !== 'title' && game) {
    if (phase === 'playing') $('hud-time').textContent = formatTime(elapsed(timer, now));
    effects = effects.filter((fx) => now - fx.t0 < fx.duration);
    renderer.draw({
      hidden: phase === 'countdown' || phase === 'paused',
      effects,
      now,
      shakeUntil,
    });
  }
  requestAnimationFrame(frame);
}

// ---------- 配線 ----------

for (const btn of document.querySelectorAll('[data-difficulty]')) {
  btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
}
for (const btn of document.querySelectorAll('[data-mute]')) {
  btn.addEventListener('click', () => {
    sound.muted = !sound.muted;
    data.settings.muted = sound.muted;
    saveData(data);
    if (!sound.muted) sound.unlock();
    renderMute();
  });
}
$('hud-pause').addEventListener('click', pause);
$('resume').addEventListener('click', resume);
$('quit').addEventListener('click', quit);
$('retry').addEventListener('click', () => startGame(game.difficulty));
$('to-title').addEventListener('click', quit);
$('board').addEventListener('pointerdown', onPointerDown);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
window.addEventListener('resize', () => {
  if (phase !== 'title') renderer.resize();
});

renderTitle();
renderMute();
showScreen('title');
// フォントが読み込まれる前に描くと別の字形になるので、先に読み込んでおく
document.fonts
  ?.load('700 32px "Roboto Mono"')
  .then(() => {
    renderer.dirty = true; // 読み込み前に描いた盤面を描き直す
  })
  .catch(() => {});
requestAnimationFrame(frame);
registerServiceWorker();
