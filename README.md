# 100game

1から100までのボールを順番にタップして、タイムを競うブラウザゲーム。スマホ向けで、PCでも遊べる。

**遊ぶ** → https://osakanalabel.github.io/100game/

<img src="assets/qr.svg" width="160" alt="https://osakanalabel.github.io/100game/ の QR コード">

## 難易度

| | |
|---|---|
| practice | 1〜20で練習 |
| easy | タップしたボールが消える |
| normal | 消えない |
| hard | 消えない、色もない |
| maniac | 正解するたびに配置が変わる |

## 開発

ビルドなし、依存なし。

```sh
npx serve .     # 手元で遊ぶ
node --test     # テスト
```

仕様は [SPEC.md](SPEC.md) にあります。
