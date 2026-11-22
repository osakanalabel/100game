// README 用の QR コード（assets/qr.svg）を作る。
// 使い方: node tools/gen-qr.mjs [URL]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeQr, toSvg } from './qr.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] || 'https://osakanalabel.github.io/100game/';
const out = path.join(ROOT, 'assets', 'qr.svg');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, toSvg(encodeQr(url)));
console.log(`wrote ${path.relative(ROOT, out)} for ${url}`);
