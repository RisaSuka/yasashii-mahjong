# MVP-0.1 エージェント計画

## ブランチ構成

- `main`: 安定版
- `codex/mvp-01-base`: 共通土台
- `codex/mvp-01-test-runner`: Agent C
- `codex/mvp-01-game-core`: Agent A
- `codex/mvp-01-ui-board`: Agent B
- `codex/mvp-01-integration`: 統合用

## Agent A: game core

### 担当ファイル

- `src/game/tiles.js`
- `src/game/wall.js`
- `src/game/player.js`
- `src/game/round.js`
- `src/game/actions.js`
- `src/game/storage.js`
- `src/game/cpu/random-cpu.js`

### 作るもの

- 牌136枚生成
- 王牌14枚分離
- 通常山122枚
- シャッフル
- 4人作成
- 全員13枚配牌
- 親が最初に1枚ツモして14枚
- `START_ROUND`
- `DISCARD_TILE`
- `DRAW_TILE`
- `ADVANCE_TURN`
- `CPU_DISCARD`
- `END_ROUND_DRAW`
- `TOGGLE_LARGE_TILE_MODE`
- `RESET_STATS`
- localStorage保存、読み込み

### 触ってはいけないファイル

- `src/ui/**`
- `styles/**`
- `index.html`
- `tests/**`

### 制約

- `src/game/` 以下はDOMに触らない
- `document` と `window` は原則禁止
- `src/game/storage.js` でlocalStorageを扱う場合のみブラウザAPI使用可
- 状態変更は `dispatchAction(state, action)` に集約する

## Agent B: UI

### 担当ファイル

- `index.html`
- `styles/base.css`
- `styles/board.css`
- `styles/tiles.css`
- `styles/responsive.css`
- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`

### 作るもの

- 4人卓レイアウト
- 人間の手牌表示
- CPUの手牌枚数表示
- 各プレイヤーの捨て牌
- 現在手番
- 通常山の残り枚数
- 王牌枚数
- ドラ表示牌枠
- 流局メッセージ
- 新規局開始ボタン
- 大きい牌モード切替
- スマホ対応
- 人間の牌クリック、タップで `DISCARD_TILE` を発行
- CPUターンをランダム打牌で進める

### 触ってはいけないファイル

- `src/game/**`
- `tests/**`

### 制約

- UIは `gameState` を直接破壊しない
- 操作は `dispatchAction(state, action)` を呼ぶ
- 外部ライブラリは使わない

## Agent C: test runner

### 担当ファイル

- `tests/test-runner.html`
- `tests/test.js`
- `tests/tiles.test.js`
- `tests/wall.test.js`
- `tests/round.test.js`
- `tests/actions.test.js`
- `tests/storage.test.js`

### 作るもの

- 外部ライブラリなしの簡易テストランナー
- `assertEqual`
- `assertTrue`
- 必要に応じて `assertDeepEqual`
- 成功、失敗をブラウザで表示
- 失敗時にテスト名と理由を表示
- game実装がまだない場合も、想定APIに対するテストとして書く

### 必要なテスト

- 牌が136枚生成される
- tile idが重複しない
- 王牌が14枚
- 通常山が122枚
- 全員13枚配牌される
- 親が初回ツモ後14枚になる
- 局開始直後の通常山が69枚
- 打牌で手牌-1、捨て牌+1
- ツモで通常山-1、手牌+1
- 手番が0から1、2、3、0へ回る
- 通常山が空なら流局
- `CPU_DISCARD` でCPUが1枚捨てる
- localStorageの保存、読み込み
- 壊れた保存データでも初期値に戻せる

### 触ってはいけないファイル

- `src/game/**`
- `src/ui/**`
- `styles/**`
- `index.html`

## 統合順序

1. 共通土台を作る
2. テスト基盤を取り込む
3. game coreを取り込む
4. テストを実行して失敗を修正する
5. UIを取り込む
6. `src/main.js` でgame coreとUIを接続する
7. `index.html` で1局が流局まで進むことを確認する
8. スマホ幅で人間の手牌を操作できることを確認する
9. localStorageにstatsが保存されることを確認する
10. READMEに実行方法とMVP-0.1仕様を追記する
11. commitする
12. pushは確認後に行う

## 受け入れ条件

- `index.html` をブラウザで開くとアプリが表示される
- 新規局を開始できる
- 牌136枚から局が構成される
- 王牌14枚が分離される
- 通常山122枚から配牌とツモが行われる
- 全員13枚配牌される
- 親が初回ツモして14枚になる
- 人間が手牌を選んで捨てられる
- CPU3人がランダムに捨てる
- 手番が東、南、西、北、東の順で回る
- 通常山が尽きると流局する
- 流局数がlocalStorageに保存される
- 対局開始数がlocalStorageに保存される
- 最終プレイ日時がlocalStorageに保存される
- テストランナーで主要テストが通る
- スマホ幅で人間の手牌が操作できる
- `src/game/` 以下にDOM操作がない

