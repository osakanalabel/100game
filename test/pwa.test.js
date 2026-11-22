import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function precacheList() {
  const src = read('sw.js');
  const block = src.match(/const PRECACHE = \[([\s\S]*?)\];/);
  assert.ok(block, 'sw.js に PRECACHE が見つからない');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** PNG の幅と高さ（IHDR） */
function pngSize(p) {
  const buf = fs.readFileSync(path.join(ROOT, p));
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', `${p} が PNG ではない`);
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

test('PWA：PRECACHE のファイルはすべて存在する', () => {
  for (const entry of precacheList()) {
    if (entry === './') continue;
    assert.ok(fs.existsSync(path.join(ROOT, entry)), `${entry} がない`);
  }
});

test('PWA：アプリのファイルはすべて PRECACHE に入っている', () => {
  const list = new Set(precacheList());
  const files = ['index.html', 'manifest.webmanifest'];
  for (const dir of ['js', 'css', 'fonts', 'icons']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
      if (/\.(js|css|woff2|png)$/.test(f)) files.push(`${dir}/${f}`);
    }
  }
  for (const f of files) assert.ok(list.has(`./${f}`), `./${f} が sw.js の PRECACHE にない`);
});

test('PWA：マニフェストのアイコンが存在し、サイズが合っている', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.display, 'standalone');
  const sizes = new Set();
  for (const icon of manifest.icons) {
    const [w, h] = pngSize(icon.src);
    assert.equal(`${w}x${h}`, icon.sizes, `${icon.src} のサイズ`);
    sizes.add(icon.sizes);
  }
  assert.ok(sizes.has('192x192') && sizes.has('512x512'), '192 と 512 のアイコンが必要');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'), 'maskable アイコンが必要');
});

test('PWA：index.html がマニフェストとアイコンを読み込んでいる', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
  assert.deepEqual(pngSize('icons/apple-touch-icon.png'), [180, 180]);
});
