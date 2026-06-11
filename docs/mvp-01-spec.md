# MVP-0.1 共通仕様

## 目的

MVP-0.1では、和了判定なしで「人間1人 vs CPU3人の4人卓が流局まで正しく進む」状態を作る。

## 完成条件

- 静的HTML/CSS/JavaScriptのみ
- 外部ライブラリなし
- GitHub Pagesで公開可能
- 牌136枚を生成する
- 王牌14枚を分離する
- 通常山122枚を作る
- シャッフルする
- 4人全員に13枚配牌する
- 親が最初に1枚ツモして14枚になる
- 人間が手牌から1枚捨てられる
- CPU3人がランダムに捨てる
- 手番が東、南、西、北、東の順で回る
- 通常山が0枚になったら流局する
- 最低限の4人卓UIを作る
- スマホ幅でも人間の手牌を押せる
- localStorageに対局開始数、流局数、最終プレイ日時を保存する
- ブラウザで動く簡易テストランナーを作る

## 作らないもの

- 和了判定
- 役判定
- 点数計算
- チー、ポン、カン
- リーチ
- フリテン
- ドラ効果
- 裏ドラ
- 本格CPU AI
- 東風戦、半荘戦の完全進行

## 確定ルール

- 配牌方式は「全員13枚配牌し、親が初回ツモ」で固定する
- 王牌は14枚で固定する
- 通常山は122枚から開始する
- 局開始直後は、配牌52枚と親の初回ツモ1枚を通常山から消費済みとする
- 局開始直後の通常山は69枚
- 親の手牌は14枚、子の手牌は13枚
- MVP-0.1ではドラ表示牌の枠は持つが、ドラ効果は使わない
- 通常山が尽きたら `exhaustive-draw` で流局する

## 共通データ構造

### Tile

```js
{
  id: "m1-0",
  suit: "m",
  rank: 1,
  copy: 0,
  red: false
}
```

- `suit`: `m`, `p`, `s`, `z`
- `rank`: 数牌は1から9、字牌は1から7
- `copy`: 0から3
- `red`: MVP-0.1では常に `false`

### Player

```js
{
  id: 0,
  name: "あなた",
  type: "human",
  wind: "east",
  score: 25000,
  hand: [],
  discards: [],
  melds: [],
  riichi: false
}
```

### RoundState

```js
{
  id: "round-xxxxx",
  phase: "setup",
  roundWind: "east",
  handNumber: 1,
  honba: 0,
  riichiSticks: 0,
  dealerIndex: 0,
  currentPlayerIndex: 0,
  wall: [],
  deadWall: [],
  doraIndicators: [],
  lastDraw: {
    playerId: null,
    tile: null
  },
  lastDiscard: {
    playerId: null,
    tile: null
  },
  turnCount: 0,
  endReason: null,
  players: []
}
```

### GameState

```js
{
  version: 1,
  settings: {
    largeTileMode: false,
    cpuDelayMs: 300
  },
  stats: {
    roundsStarted: 0,
    roundsDrawn: 0,
    lastPlayedAt: null
  },
  round: null
}
```

## Action一覧

すべての状態変更は `dispatchAction(state, action)` 経由で行う。

```js
{ type: "START_ROUND" }
```

新しい局を開始する。

```js
{ type: "DISCARD_TILE", playerId, tileId }
```

指定プレイヤーが指定牌を捨てる。

```js
{ type: "DRAW_TILE", playerId }
```

指定プレイヤーが通常山から1枚ツモる。通常山が空なら流局する。

```js
{ type: "ADVANCE_TURN" }
```

手番を次家へ進める。

```js
{ type: "CPU_DISCARD" }
```

現在手番がCPUなら、ランダムに1枚捨てる。

```js
{ type: "END_ROUND_DRAW" }
```

流局にする。

```js
{ type: "TOGGLE_LARGE_TILE_MODE" }
```

大きい牌モードを切り替える。

```js
{ type: "RESET_STATS" }
```

保存済み成績を初期化する。

## ファイル責務

- `src/game/tiles.js`: 牌生成、牌の表示名、牌ソート
- `src/game/wall.js`: 山生成、シャッフル、王牌分離、ツモ
- `src/game/player.js`: プレイヤー生成
- `src/game/round.js`: 局開始、配牌、手番の基本処理
- `src/game/actions.js`: `dispatchAction` とaction処理
- `src/game/storage.js`: localStorage保存、読み込み
- `src/game/cpu/random-cpu.js`: MVP用ランダム打牌
- `src/ui/render.js`: `gameState` を受け取って描画
- `src/ui/input.js`: UIイベントをactionに変換
- `src/main.js`: game層とUI層の接続
- `tests/`: ブラウザ実行の簡易テスト

## 境界ルール

- `src/game/` 以下はDOMに触らない
- `document` と `window` は `src/game/storage.js` 以外で使わない
- UIは `gameState` を直接破壊しない
- UI操作は `dispatchAction(state, action)` を呼ぶ
- ルール処理はテストしやすい純粋関数に寄せる
- MVP-0.1の範囲を超える機能は追加しない

