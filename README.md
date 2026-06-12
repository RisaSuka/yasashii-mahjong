# じゅんちゃん麻雀

人間1人 vs CPU3人で遊べる、ブラウザ向け4人リーチ麻雀Webアプリを段階的に開発しています。

現在は `codex/mvp-01-integration` ブランチで MVP-0.3 まで統合済みです。GitHub Pagesで公開できる静的HTML/CSS/JavaScript構成で、外部ライブラリは使っていません。

## 現在の到達点

- MVP-0.1: 4人卓が流局まで進行可能
- MVP-0.2: 14枚手牌の和了形チェックを実装
- MVP-0.3: ツモ和了の入口を実装
- 自動テスト: 44 pass / 0 pending / 0 fail
- pushなし
- `main` mergeなし

## MVP-0.3でできること

- 牌136枚生成、王牌14枚分離、通常山122枚作成
- 4人全員13枚配牌、親の初回ツモ
- 人間の打牌
- CPU3人のランダム打牌
- 東→南→西→北→東の手番進行
- 通常山が0枚になったら流局
- 4面子1雀頭、七対子、国士無双の和了形チェック
- `DECLARE_TSUMO` action
- 人間が和了形の14枚手牌ならツモ宣言可能
- CPUも和了形ならツモ宣言可能
- ツモ和了後は `phase: "ended"`、`endReason: "win"`
- `winningResult.winnerId` と `winningResult.winType: "tsumo"` を保存
- ツモ和了後は draw/discard/cpu discard が進まない
- 最小限のツモボタンとツモ和了メッセージ
- localStorageに対局開始数、流局数、最終プレイ日時を保存
- ブラウザで動く簡易テストランナー

## まだできないこと

- 点数計算
- 役判定
- ロン
- チー/ポン/カン
- リーチ
- フリテン
- ドラ効果、裏ドラ
- 本格CPU AI
- 東風戦/半荘戦の完全進行
- 和了後の支払い、連荘、場進行

## 起動方法

リポジトリ直下で静的サーバーを起動します。

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

GitHub Pagesでは `index.html` が公開入口になります。

## テスト実行

ブラウザでは次を開きます。

```text
http://127.0.0.1:8765/tests/test-runner.html
```

Codex環境では同梱Node.jsでモジュールテストを実行できます。

```powershell
& 'C:\Users\kurop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --input-type=module -e "const tile = await import('./tests/tiles.test.js'); const wall = await import('./tests/wall.test.js'); const round = await import('./tests/round.test.js'); const actions = await import('./tests/actions.test.js'); const storage = await import('./tests/storage.test.js'); const win = await import('./tests/win-check.test.js'); const tsumo = await import('./tests/tsumo.test.js'); const m = await import('./tests/test.js'); tile.registerTileTests(); wall.registerWallTests(); round.registerRoundTests(); actions.registerActionTests(); storage.registerStorageTests(); win.registerWinCheckTests(); tsumo.registerTsumoTests(); const results = await m.runTests(); console.log(results.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {}));"
```

期待結果:

```text
{ pass: 44 }
```

## 重要ドキュメント

- [MVP-0.1仕様](docs/mvp-01-spec.md)
- [Agent計画](docs/agent-plan.md)
- [UXレビュー](docs/design-review.md)
- [MVP-0.1検証ログ](docs/mvp-01-verification.md)
- [MVP-0.3計画](docs/mvp-03-plan.md)
- [MVP-0.3ツモテスト設計](docs/mvp-03-tsumo-tests.md)
- [MVP-0.3検証ログ](docs/mvp-03-verification.md)
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

## 次回再開手順

1. `git status --short --branch` で作業ツリーがcleanか確認
2. `codex/mvp-01-integration` にいることを確認
3. テストランナーまたはNodeコマンドで `44 pass` を確認
4. `docs/manual-test-checklist.md` に沿って実ブラウザ確認
5. 問題なければ MVP-0.4 の範囲を決める

