# MVP-1.1.6 layout-test note

MVP-1.1.4 adds a Chrome-based smartphone landscape layout guard at `tests/layout-check.mjs`. It checks common landscape viewports, early/mid/late discard counts, page overflow, clipped discard zones, clipped hand tiles, clipped advice badges, action/advice button clickability, popup bounds, and major overlaps.

MVP-1.1.6 fixes the known late-hand discard clipping detected by that guard. Screenshots are written to `test-artifacts/layout/`, which is ignored by git. Current normal tests target `199 pass / 0 pending / 0 fail`, and `tests/layout-check.mjs` should pass across all target smartphone landscape viewports and scenarios.

# MVP-1.1.1 working branch note

MVP-1.1.1 moves discards toward a table-center ring in smartphone landscape: north, west, south, and human discards surround the center information. The human hand keeps the bottom tap area, advice highlights remain on the hand, and detailed discard advice opens from a small `助言を見る` popup instead of taking permanent center space. The app module URLs use `mvp111-discard-center-1` for real-device cache busting.

# MVP-1.0 working branch note

MVP-1.0 adds the first east-only match skeleton: `START_MATCH`, East 1 through East 4 progression, fixed scores, no dealer repeat, compact `roundHistory`, current-hand display, and a minimal `東風戦終了` display. Human hands are automatically sorted into an easy-to-read tile order. The app module URLs are versioned for the MVP-1.0 real-device check so smartphone browsers do not keep stale JavaScript. Point-based final results are still for a later step.

This MVP-1.1.1 work is not published yet. Do not merge to `main` or push without explicit approval.

Current MVP-1.1.1 local checks target `194 pass / 0 pending / 0 fail`.

# MVP-0.9 working branch note

The `codex/mvp-09-next-round` branch adds a post-round continuation loop. After exhaustive draw, tsumo, or ron, the app can show a `次の局へ` button and start a fresh round while preserving large tile mode and discard advice settings.

MVP-0.9.5 refines that next-round UI for smartphone landscape: the `次の局へ` button is easier to tap, and the previous result text stays short.

This is a historical note for the previous MVP-0.9 step. Current local checks are listed in the MVP-1.0 note above.

# MVP-0.8 release candidate note

The `codex/mvp-08-discard-advice-plan` branch adds beginner discard advice, an advice ON/OFF setting, and smartphone landscape layout refinements. Current release-candidate checks target `148 pass / 0 pending / 0 fail`. Smartphone landscape is the recommended play orientation; portrait remains usable and shows a gentle landscape recommendation.

# じゅんちゃん麻雀

人間1人 vs CPU3人で遊べる、ブラウザ向け4人リーチ麻雀Webアプリを段階的に開発しています。

現在は `codex/mvp-01-integration` ブランチで MVP-0.7.8 まで統合済みです。静的HTML/CSS/JavaScriptのみで動作し、外部ライブラリは使っていません。GitHub Pages公開を想定しています。

## 現在の到達点

- 最新到達点: MVP-0.7.8
- 自動テスト: 136 pass / 0 pending / 0 fail
- 作業ツリー: clean
- push: 未実施
- `main` merge: 未実施

## MVP一覧

- MVP-0.1: 4人卓が流局まで進行可能
- MVP-0.2: 4面子1雀頭、七対子、国士無双の和了形判定
- MVP-0.3: ツモ和了の入口
- MVP-0.4: 固定局面セットアップ
- MVP-0.5: 人間プレイヤーの単独ロン入口
- MVP-0.5.5: reaction phaseと最小ロンUI
- MVP-0.6: 最低限の役判定
- MVP-0.6.5: ツモ/ロン時の役判定接続
- MVP-0.7: 役名、翻数、初心者向け説明の表示
- MVP-0.7.6: 役名・用語のふりがなAPI
- MVP-0.7.7: ふりがな付き役表示UI
- MVP-0.7.8: 役なし拒否時の初心者向けメッセージ表示

## できること

- 136枚の牌生成、王牌14枚分離、通常山122枚作成
- 4人配牌、親の初回ツモ
- 人間の打牌、CPU3人のランダム打牌
- 通常山が0枚になった場合の流局
- localStorageへの対局開始数、流局数、最終プレイ日時保存
- ツモ和了、ロン和了
- 役なし和了の拒否
- 役名、翻数、合計翻、初心者向け説明表示
- 役名と用語のふりがな表示
- CSS牌を改善し、将来SVG/画像へ差し替えやすい `tile-face` 構造に整理
- 固定局面を使った開発・確認
- スマホ幅向けの最低限UI

## まだ未実装

- 点数計算
- 符計算
- 鳴き
- リーチ
- フリテン
- ドラ、裏ドラ
- 東風戦、半荘戦の完全進行
- 本格CPU AI
- 点棒移動、供託、本場
- 複数ロン
- CPUロン
- ローカル対戦
- 通信対戦

## 起動方法

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

アプリ:

```text
http://127.0.0.1:8765/
```

テストランナー:

```text
http://127.0.0.1:8765/tests/test-runner.html
```

期待結果:

```text
136 pass / 0 pending / 0 fail
```

## 重要ドキュメント

- [現在状態](docs/current-status.md)
- [手動確認チェックリスト](docs/manual-test-checklist.md)
- [公開前チェックリスト](docs/release-checklist.md)
- [MVP-0.1仕様](docs/mvp-01-spec.md)
- [MVP-0.7計画](docs/mvp-07-plan.md)
- [MVP-0.7.5計画](docs/mvp-075-plan.md)
- [牌表示改善方針](docs/tile-visual-plan.md)
- [Agent共通ルール](AGENTS.md)

## 開発ルール

- `src/game/` 以下はDOMに触らない
- UIは `gameState` を受け取って描画する
- 操作は `dispatchAction(state, action)` 経由に集約する
- UIはstateを直接破壊しない
- type="module" 前提
- 外部ライブラリなし
- pushと `main` mergeはユーザー確認後に行う
