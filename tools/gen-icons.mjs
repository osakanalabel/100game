// PWA アイコン（icons/*.png）を headless Chrome で描いて書き出す。
// 使い方: node tools/gen-icons.mjs（Chrome の場所は環境変数 CHROME で変えられる）
// ゲーム本体の依存ではない。アイコンを変えたいときだけ使う。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "100game-icons-"));
const OUTDIR = path.join(ROOT, 'icons');
fs.mkdirSync(OUTDIR, { recursive: true });
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const DBG = 9334;
const font = fs.readFileSync(path.join(ROOT, 'fonts/roboto-mono-latin-700.woff2')).toString('base64');

const html = (S) => `<!doctype html><html><head><style>
@font-face{font-family:RM;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:700}
html,body{margin:0;width:${S}px;height:${S}px;background:#0f131b;overflow:hidden}
.ball{position:absolute;left:50%;top:50%;width:${S * 0.7}px;height:${S * 0.7}px;transform:translate(-50%,-50%);border-radius:50%;
background:radial-gradient(circle at 26% 24%,rgba(255,255,255,.42) 0,rgba(255,255,255,0) 13%),radial-gradient(circle at 50% 50%,#e5484d 82%,#c33a3f 100%);
display:grid;place-items:center}
.n{font:700 ${S * 0.25}px RM;color:#fff;letter-spacing:-0.03em;transform:rotate(-14deg) translateY(${S * 0.006}px)}
</style></head><body><div class="ball"><span class="n">100</span></div></body></html>`;

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${path.join(WORK, 'profile-icons')}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver;
for (let i = 0; i < 50; i++) { try { ver = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); let session;
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId: session })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
session = (await send('Target.attachToTarget', { targetId, flatten: true })).result.sessionId;
await send('Page.enable'); await send('Runtime.enable');

for (const [name, S] of targets) {
  await send('Emulation.setDeviceMetricsOverride', { width: S, height: S, deviceScaleFactor: 1, mobile: false });
  const file = path.join(WORK, `icon-${S}.html`);
  fs.writeFileSync(file, html(S));
  await send('Page.navigate', { url: 'file:///' + file.replace(/\\/g, '/') });
  await sleep(400);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>document.fonts.check("700 20px RM"))', awaitPromise: true });
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: S, height: S, scale: 1 } });
  fs.writeFileSync(path.join(OUTDIR, name), Buffer.from(r.result.data, 'base64'));
  console.log('wrote', name);
}
ws.close(); chrome.kill(); process.exit(0);
