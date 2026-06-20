# MVP-3.4 exact four-direction table layout note

MVP-3.4 moves the active match screen to a four-direction table layout based on the hand-drawn layout plan. During a round, the old top header is hidden and the new right-edge gear menu contains `New round`, `Large tiles`, `Advice ON/OFF`, and `Help`. CPU1 is on the right, CPU2 is at the top, CPU3 is on the left, and the human hand stays across the bottom. Discards surround the center table, and tile graphics rotate by seat direction while labels and buttons remain upright.

Current local checks target MVP-3.4 normal tests, the smartphone landscape layout guard including the `settings-menu-open` scenario, four-direction seat/discard placement, tile rotation checks, no active-round header, and the CPU win reachability diagnostic.

# MVP-3.3 call stability note

MVP-3.3 is a stabilization pass for the new pon/chi work. It verifies that open yakuhai pon and open chi tanyao can win, open complete shapes without yaku are rejected, open tsumo does not receive menzen-tsumo, fresh rounds clear melds, and ron still has priority over call buttons. Layout guard scenarios now cover chi reactions, multiple melds, and open-hand win results.

Current local checks target MVP-3.3 normal tests, the smartphone landscape layout guard including open-hand call scenarios, and the CPU win reachability diagnostic.

# MVP-3.2 human chi note

MVP-3.2 adds the first human-only chi flow. The human can chi only the upper player's suited-number discard, with separate buttons for each possible sequence. Declaring chi removes the selected two hand tiles, creates a `chi` meld with the called discard and source player, marks the hand open, and returns control to the human to discard one tile. Multiple melds now use a wider horizontal meld area near the human seat so pon/chi groups do not overlap the hand in smartphone landscape.

Current local checks target MVP-3.2 normal tests, the smartphone landscape layout guard including `chi-reaction` and `multiple-melds`, and the CPU win reachability diagnostic.

# MVP-3.1.1 pon layout stabilization note

MVP-3.1.1 clears the post-pon guidance after the caller discards, moves the human pon meld away from the hand tiles in smartphone landscape, and strengthens the `open-melds` layout guard so meld/hand overlap is detected. The broader four-direction table redesign is documented in `docs/future-table-layout-plan.md` for future MVP-3.x work.

Current local checks target MVP-3.1.1 normal tests plus the smartphone landscape layout guard including meld/hand overlap detection, and the CPU win reachability diagnostic.

# MVP-3.1 human pon note

MVP-3.1 adds the first human-only call flow: pon. When another player discards a tile and the human has two matching tiles, the reaction bar can show `ポン` / `見送る` unless ron priority is taking over. Declaring pon removes two matching hand tiles, creates a `pon` meld with the called discard and source player, marks the hand as open, and returns control to the human to discard one tile. Open hands cannot declare riichi, and an open yakuhai pon is counted as a yaku. Chi, kan, CPU calls, scoring, furiten, and full call competition remain out of scope.

Current local checks target MVP-3.1 normal tests plus the smartphone landscape layout guard including `pon-reaction` and `open-melds`, and the CPU win reachability diagnostic.

# MVP-2.2 CPU riichi note

MVP-2.2 lets CPU players declare riichi when their 14-tile hand can discard into tenpai. CPU riichi is not automatic every time: the CPU favors yaku-valid waits and multi-wait options, then uses RNG so the behavior is not completely fixed. After declaring riichi, CPU players also discard only the latest drawn tile. CPU tsumo/ron after riichi includes `riichi` in the yaku result.

This does not add riichi sticks, point movement, ippatsu, uradora, furiten checks, kan after riichi, or CPU difficulty settings.

Current local checks target MVP-2.2 normal tests plus the smartphone landscape layout guard and the CPU win reachability diagnostic.

# MVP-2.1 human riichi note

MVP-2.1 adds the first human-only riichi flow. When the human hand can discard into tenpai, the action bar shows `リーチ`; pressing it enters a discard-selection mode and highlights only tiles that leave tenpai. After declaring riichi, the player is locked to tsumogiri on future turns. If the riichi player later wins by tsumo or ron, the yaku result includes `立直`.

This does not add riichi sticks, point movement, ippatsu, uradora, furiten checks, kan after riichi, or CPU riichi.

Current local checks target MVP-2.1 normal tests plus the smartphone landscape layout guard and the CPU win reachability diagnostic.

# MVP-2.0 SVG tile set note

MVP-2.0 introduces a handmade SVG tile set under `assets/tiles/` for all 34 tile faces. The UI resolves each tile object to a stable SVG path and renders it through the existing tile markup so clicks, advice badges, large tile mode, discard zoom, all-hands review, yaku examples, and waits remain on the same game data. The previous CSS tile face remains in the DOM as a fallback if an SVG image fails to load.

MVP-2.0.1 redraws those handmade assets for readability: souzu use wider bamboo marks with clear grid spacing, pinzu use larger circle placement, manzu use bold number/`萬` text, and honors use larger central characters. The redesign is original SVG artwork and does not copy or trace external tile images.

Current local checks target MVP-2.0.1 normal tests plus the smartphone landscape layout guard and the CPU win reachability diagnostic.

# MVP-1.9.1 all-hands learning popup note

MVP-1.9.1 adds a round-end learning popup. After tsumo, ron, CPU win, or exhaustive draw, the action bar shows `みんなの手を見る`. The popup reveals all four players' hands only after the hand is over, highlights the winner when there is one, shows the winning tile/yaku when available, and keeps point calculation marked as unsupported. CPU hands remain hidden during normal play.

Current local checks target MVP-1.9.1 normal tests plus the smartphone landscape layout guard, including the all-hands popup scenario, and the CPU win reachability diagnostic.

# MVP-1.9 discard-to-wait helper note

MVP-1.9 extends the tenpai helper for the common 14-tile human turn. `analyzeDiscardWaits(hand, context)` tries each possible discard, reuses the existing wait analyzer on the remaining 13 tiles, and shows which discard leaves which waits. The waits popup now includes a compact `切ると待ち` section, and discard advice gets a light boost for unprotected discards that leave yaku-valid tenpai without overriding completed meld or yakuhai-pair protection.

Current local checks target MVP-1.9 normal tests plus the smartphone landscape layout guard, including the discard-to-wait popup scenario, and the CPU win reachability diagnostic.

# MVP-1.8.2 yakuhai pair protection note

MVP-1.8.2 strengthens yakuhai pair protection in the shared discard evaluator. Dragon pairs such as `白白`, `發發`, and `中中`, plus round-wind and self-wind pairs when context is available, are treated as important yaku-pair shapes. Pair-heavy hands also get a small chiitoitsu/toitoi direction bonus so the evaluator is less likely to casually break pairs when isolated alternatives exist. This affects both beginner discard advice and CPU discard selection because both use the same evaluator.

Current local checks target MVP-1.8.2 normal tests plus the smartphone landscape layout guard and CPU win reachability diagnostic.

# MVP-1.8.1 discard evaluator stability note

MVP-1.8.1 strengthens the shared discard evaluator so completed sequences such as `1筒2筒3筒` and `7筒8筒9筒`, completed triplets, pairs, dora, and connected number shapes are protected before isolated terminal/honor penalties are applied. This reduces unnatural advice and CPU discards that break an already completed meld. A lightweight CPU win reachability diagnostic is available at `scripts/simulate-cpu-win-reachability.mjs`; it checks that CPU tsumo, CPU ron, and no-yaku CPU rejection paths are still reachable without adding any win-rate boost.

Current local checks target MVP-1.8.1 normal tests plus the smartphone landscape layout guard. CPU win frequency is still not tuned; this step only improves evaluator sanity and diagnostics.

# MVP-1.8 CPU win note

MVP-1.8 lets CPU players win when they already have a valid yaku hand. CPU tsumo is resolved after a CPU draw, and CPU ron is resolved after a discard when the human ron reaction is not taking priority. CPU no-yaku completed shapes are ignored, and the result is stored in `winningResult`, `lastRoundResult`, and `roundHistory` for the next-round and match-result UI.

Current local checks target `264 pass / 0 pending / 0 fail`, plus the smartphone landscape layout guard including the CPU win scenario.

# MVP-1.7 tenpai waits note

MVP-1.7 adds a beginner tenpai/wait helper. For a 13-tile human hand, the app checks which tile kinds would complete the hand, then shows whether each wait appears to have yaku or would only complete the shape without yaku. The helper opens from a compact `待ち` / `待ちあり` button near the human seat and is intentionally a guide, not full shanten calculation.

Current local checks target `255 pass / 0 pending / 0 fail`, plus the smartphone landscape layout guard including the waits popup scenario.

# MVP-1.6 hand yaku guide note

MVP-1.6 adds a beginner hand-yaku guide. The app can look at the human hand and suggest 1 to 3 easy-to-understand yaku targets such as tanyao, yakuhai, chiitoitsu, and toitoi. The guide opens from a compact `役ガイド` button near the human seat, explains why the yaku may fit the current hand, and shows CSS-tile completion examples. It is a learning aid, not a promise of the best possible strategy.

Current local checks target `244 pass / 0 pending / 0 fail`, plus the smartphone landscape layout guard including the yaku-guide popup scenario.

# MVP-1.5 CPU discard evaluator note

MVP-1.5 connects the shared discard evaluator v1 to CPU discards. CPU players now score their hand with `evaluateDiscardCandidates(hand, context)` and discard from the low-score candidates instead of using pure random discard. The CPU still keeps light randomness by choosing from the top evaluated candidates, so it is not a full optimal AI and should not feel perfectly deterministic.

MVP-1.5.1 adds ron verification fixtures and UI checks. Normal shuffled play can make ron feel rare because the human must have a complete shape with yaku and a CPU must discard the exact winning tile. Fixed scenarios now cover tanyao, yakuhai, chiitoitsu, and no-yaku ron-shape checks.

Current local checks target `234 pass / 0 pending / 0 fail`, plus the smartphone landscape layout guard.

# MVP-1.4 discard evaluator note

MVP-1.4 adds a shared discard evaluator v1 for beginner advice and future CPU improvements. `evaluateDiscardCandidates(hand, context)` scores every tile with beginner-readable reasons, and `suggestDiscards(hand, context)` now uses that evaluation so valid hands should keep producing 1 to 3 advice candidates instead of falling back to empty advice. The evaluator is still intentionally lightweight: it does not perform full shanten calculation, danger reading, scoring expectation, riichi, calls, or furiten checks.

The advice UI keeps the existing highlighted hand tiles and reason popup. A compact beginner help popup explains that advice is only a guide, and explains isolated tiles, terminal tiles, honor tiles, pairs, connected number tiles, dora, tanyao, and yakuhai. CPU discards are connected to the evaluator in MVP-1.5.

MVP-1.4 local checks targeted `220 pass / 0 pending / 0 fail`, plus the existing smartphone landscape layout guard.

# MVP-1.3 match result note

MVP-1.3 improves the East-only match end screen. After East 4 ends, the app shows a short `東風戦終了` summary, keeps `もう一度遊ぶ` visible, and adds a `結果を見る` popup with the four hand results from `roundHistory`. MVP-1.3.1 tightens the result popup spacing so East 1 through East 4 are easier to read on smartphone landscape. Point calculation and ranking remain out of scope. Current normal tests target `210 pass / 0 pending / 0 fail`, and the layout guard includes match-ended/result-popup scenarios.

# MVP-1.2 discard zoom note

MVP-1.2 adds a discard zoom popup for older-user readability. Tap or click any player's discard area in the smartphone landscape table to open a larger discard list for that player. The popup can be closed with the close button, backdrop click, or Escape key, and it is kept separate from the discard-advice popup.

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
