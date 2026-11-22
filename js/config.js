// ゲームの定数。数値はここに集め、ほかのファイルに直接書かない。
// 各値の理由は SPEC.md を参照。

/** 盤面の論理サイズ（9:16） */
export const FIELD_W = 360;
export const FIELD_H = 640;

export const BALL_COUNT = 100;

/** ボールの直径（論理座標） */
export const DIAMETER_MIN = 30;
export const DIAMETER_MAX = 48;

/** ボール同士の最小の隙間 */
export const BALL_GAP = 1;

/** 1個あたりの配置の試行回数。超えたら盤面全体を作り直す */
export const PLACE_TRIES = 5000;

/** 盤面全体の作り直しの上限 */
export const MAX_REBUILDS = 50;

/** 当たり判定：ボールの縁からこの距離（論理座標）以内なら当たり */
export const HIT_MAX_DIST = 12;

/** ミスしたときにタップを受け付けない時間（ミリ秒） */
export const MISS_LOCK_MS = 300;

/** カウントダウン */
export const COUNTDOWN_FROM = 3;
export const COUNTDOWN_STEP_MS = 800;

/** 回して見分けがつかない組。組の番号の番なら、どちらのボールでも正解 */
export const PAIRS = [
  [6, 9],
  [66, 99],
  [68, 89],
  [86, 98],
];

/** practice のボール（20個で、100個のときと同じくらい盤面が埋まる大きさ） */
export const PRACTICE_COUNT = 20;
export const PRACTICE_DIAMETER_MIN = 67;
export const PRACTICE_DIAMETER_MAX = 107;

/** 難易度。並びはタイトル画面の表示順。easy〜maniac は積み重ね式 */
export const DIFFICULTIES = ['practice', 'easy', 'normal', 'hard', 'maniac'];

const FULL_BOARD = { count: BALL_COUNT, dMin: DIAMETER_MIN, dMax: DIAMETER_MAX };

export const DIFFICULTY_RULES = {
  practice: {
    vanish: true,
    gray: false,
    reshuffle: false,
    board: { count: PRACTICE_COUNT, dMin: PRACTICE_DIAMETER_MIN, dMax: PRACTICE_DIAMETER_MAX },
  },
  easy: { vanish: true, gray: false, reshuffle: false, board: FULL_BOARD },
  normal: { vanish: false, gray: false, reshuffle: false, board: FULL_BOARD },
  hard: { vanish: false, gray: true, reshuffle: false, board: FULL_BOARD },
  maniac: { vanish: false, gray: true, reshuffle: true, board: FULL_BOARD },
};

/** ボールの色と、その上に載せる番号の文字色 */
export const BALL_COLORS = [
  { fill: '#e5484d', text: '#ffffff' },
  { fill: '#f76b15', text: '#ffffff' },
  { fill: '#f5c400', text: '#3a2e00' },
  { fill: '#2f9e5f', text: '#ffffff' },
  { fill: '#0f9fb3', text: '#ffffff' },
  { fill: '#3e63dd', text: '#ffffff' },
  { fill: '#8e4ec6', text: '#ffffff' },
  { fill: '#e93d82', text: '#ffffff' },
];

export const GRAY_COLOR = { fill: '#6f7682', text: '#ffffff' };

/** 記録 */
export const HISTORY_SIZE = 10;
export const STORAGE_KEY = '100game:v1';
export const STORAGE_VERSION = 1;

/** 演出の長さ（ミリ秒）。入力を待たせない */
export const RIPPLE_MS = 380;
export const FLASH_MS = 160;
export const POP_MS = 220;
export const SHAKE_MS = 260;
