# じゅんちゃん麻雀

人間1人 vs CPU3人で遊べる、ブラウザ向け4人リーチ麻雀Webアプリを段階的に開発しています。

現在は `codex/mvp-01-integration` ブランチで MVP-0.5.5 まで統合済みです。GitHub Pagesで公開できる静的HTML/CSS/JavaScript構成で、外部ライブラリは使っていません。

## 現在の到達点

- MVP-0.1: 4人卓が流局まで進行可能
- MVP-0.2: 14枚手牌の和了形チェックを実装
- MVP-0.3: ツモ和了の入口を実装
- MVP-0.4: 固定局面セットアップを実装
- MVP-0.5: 人間プレイヤーの単独ロン入口を実装
- MVP-0.5.5: reaction phaseと最小ロンUIを接続
- 自動テスト: 79 pass / 0 pending / 0 fail
- pushなし
- `main` mergeなし

## MVP-0.5.5でできること

- 牌136枚生成、王牌14枚分離、通常山122枚作成
- 4人全員13枚配牌、親の初回ツモ
- 人間の打牌
- CPU3人のランダム打牌
- 通常山が0枚になったら流局
- 4面子1雀頭、七対子、国士無双の和了形チェック
- 人間/CPUのツモ和了入口
- 人間プレイヤーの単独ロン入口
- 人間がロン可能な捨て牌に対してreaction phaseへ入る
- `ロン` / `見送る` の最小UI
- 固定局面 `ron-ready-basic` によるロン確認
- localStorageに対局開始数、流局数、最終プレイ日時を保存
- ブラウザで動く簡易テストランナー

## まだできないこと

- 点数計算
- 役判定
- CPUロン
- 複数ロン
- チー/ポン/カン
- リーチ
- フリテン
- ドラ効果、裏ドラ
- 本格CPU AI
- 東風戦/半荘戦の完全進行
- 和了後の支払い、連荘、場進行

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

## テスト実行

ブラウザでは次を開きます。

```text
http://127.0.0.1:8765/tests/test-runner.html
```

期待結果:

```text
79 pass / 0 pending / 0 fail
```

## 重要ドキュメント

- [MVP-0.1仕様](docs/mvp-01-spec.md)
- [Agent計画](docs/agent-plan.md)
- [UXレビュー](docs/design-review.md)
- [MVP-0.3計画](docs/mvp-03-plan.md)
- [MVP-0.4計画](docs/mvp-04-plan.md)
- [MVP-0.5計画](docs/mvp-05-plan.md)
- [MVP-0.5.5計画](docs/mvp-055-plan.md)
- [手動確認チェックリスト](docs/manual-test-checklist.md)
- [公開前チェックリスト](docs/release-checklist.md)
- [エージェント共通ルール](AGENTS.md)

## 開発ルール

- `src/game/` 以下はDOMに触らない
- 例外は `src/game/storage.js` の localStorage 参照のみ
- UIは `gameState` を受け取って描画する
- 操作は `dispatchAction(state, action)` 経由に集約する
- UIはstateを直接破壊しない
- type="module" 前提
- 外部ライブラリなし
- pushは確認後に行う
- `main` へのmergeは確認後に行う

