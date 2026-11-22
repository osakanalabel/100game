// 一時停止を除いた経過時間を数える。時刻は引数で受け取る。

export function createTimer() {
  return { running: false, startedAt: 0, accumulated: 0 };
}

export function startTimer(timer, now) {
  if (timer.running) return;
  timer.running = true;
  timer.startedAt = now;
}

export function pauseTimer(timer, now) {
  if (!timer.running) return;
  timer.accumulated += now - timer.startedAt;
  timer.running = false;
}

export function elapsed(timer, now) {
  return timer.accumulated + (timer.running ? now - timer.startedAt : 0);
}

/** ミリ秒を「分:秒.百分の一秒」にする（例 01:23.45） */
export function formatTime(ms) {
  const cs = Math.floor(Math.max(0, ms) / 10);
  const m = Math.floor(cs / 6000);
  const s = Math.floor(cs / 100) % 60;
  const c = cs % 100;
  return `${pad(m)}:${pad(s)}.${pad(c)}`;
}

function pad(v) {
  return String(v).padStart(2, '0');
}
