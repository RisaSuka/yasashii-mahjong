# じゅんちゃん麻雀

人間1人 vs CPU3人で遊べる、ブラウザ向け4人リーチ麻雀Webアプリを段階的に開発するプロジェクトです。

最終的には、スマホ/PC対応、GitHub Pages公開、大きい牌モード、リーチ麻雀の基本ルール、CPU AIを備えた麻雀アプリにします。

## 現在の到達点

MVP-0.1は `codex/mvp-01-integration` ブランチで統合済みです。

確認済み:

- 自動テスト: 20 pass
- 流局シミュレーション成功
- `src/game/` はDOM非依存。例外は `src/game/storage.js` の `localStorage` 参照のみ
- 実ブラウザの自動クリック確認は環境制約で未実施。手動確認チェックリストを用意済み
- pushなし
- `main` へのmergeなし

関連ドキュメント:

- [MVP-0.1仕様](docs/mvp-01-spec.md)
- [MVP-0.1アーキテクチャメモ](docs/mvp-01-architecture.md)
- [Agent計画](docs/agent-plan.md)
- [UXレビュー](docs/design-review.md)
- [検証ログ](docs/mvp-01-verification.md)
- [手動確認チェックリスト](docs/manual-test-checklist.md)
- [MVP-0.2計画](docs/mvp-02-plan.md)
- [MVP-0.2和了判定テストケース案](docs/mvp-02-win-check-tests.md)
- [MVP-0.2 Agentプロンプト](docs/mvp-02-agent-prompts.md)
- [エージェント共通ルール](AGENTS.md)

## MVP-0.1でできること

- 静的HTML/CSS/JavaScriptのみで起動
- 外部ライブラリなし
- GitHub Pagesで公開可能な構成
- 牌136枚を生成
- 王牌14枚を分離
- 通常山122枚を作成
- シャッフル
- 4人全員に13枚配牌
- 親が最初に1枚ツモして14枚になる
- 人間が手牌から1枚捨てられる
- CPU3人がランダムに捨てる
- 手番が東、南、西、北、東の順で回る
- 通常山が0枚になったら流局
- 最低限の4人卓UI
- スマホ幅でも人間の手牌を押しやすいサイズで表示
- 大きい牌モード切替
- localStorageに対局開始数、流局数、最終プレイ日時を保存
- ブラウザで動く簡易テストランナー

## まだできないこと

MVP-0.1では以下を実装していません。

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

## ローカル起動方法

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

## テスト実行方法

ブラウザでは次を開きます。

```text
http://127.0.0.1:8765/tests/test-runner.html
```

Codex環境では、同梱Nodeでテストモジュールを読み込んで確認できます。

```powershell
& 'C:\Users\kurop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --input-type=module -e "const tile = await import('./tests/tiles.test.js'); const wall = await import('./tests/wall.test.js'); const round = await import('./tests/round.test.js'); const actions = await import('./tests/actions.test.js'); const storage = await import('./tests/storage.test.js'); const m = await import('./tests/test.js'); tile.registerTileTests(); wall.registerWallTests(); round.registerRoundTests(); actions.registerActionTests(); storage.registerStorageTests(); const results = await m.runTests(); console.log(results.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {}));"
```

期待結果:

```text
{ pass: 20 }
```

## 開発方針

- `src/game/` 以下はDOMに触らない
- UIは `gameState` を受け取って描画する
- 操作は `dispatchAction(state, action)` に集約する
- UIはstateを直接変更しない
- type="module" 前提
- 外部ライブラリなし
- 1コミット1目的に近づける
- pushは確認後に行う
- `main` へのmergeは確認後に行う

## 面接後の再開手順

1. `git status --short --branch` で作業ツリーがcleanか確認
2. `codex/mvp-01-integration` にいることを確認
3. ローカルサーバーを起動
4. `http://127.0.0.1:8765/` を実ブラウザで開く
5. 新規局開始、人間の打牌、CPU打牌、流局までを手動確認
6. `tests/test-runner.html` で20 passを確認
7. スマホ幅で手牌の押しやすさを確認
8. 問題なければ、pushや`main` mergeの方針を決める
