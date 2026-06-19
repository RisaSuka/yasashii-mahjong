# Current Status

Last updated for MVP-1.9 discard-to-wait helper.

## Repository State

- Working branch: `codex/mvp-16-hand-yaku-guide`
- Automated tests: MVP-1.9 normal tests pass locally
- Layout check: Chrome-based smartphone landscape guard passes all target viewports/scenarios, including discard zoom, result popup, yaku-guide popup, waits popup, discard-to-wait popup, and CPU win scenarios
- Working tree: clean at the time of the latest MVP-1.9 verification
- Push: not yet
- `main` merge: not yet for MVP-1.9

## Implemented MVPs

| MVP | Status | Summary |
| --- | --- | --- |
| MVP-0.1 | Done | Four-player table can progress to exhaustive draw. |
| MVP-0.2 | Done | Winning hand shape checks for standard hand, seven pairs, and thirteen orphans. |
| MVP-0.3 | Done | Tsumo win action connected to round flow. |
| MVP-0.4 | Done | Deterministic scenario setup for development and tests. |
| MVP-0.5 | Done | Human single ron entry point. |
| MVP-0.5.5 | Done | Reaction phase and minimal ron/skip UI. |
| MVP-0.6 | Done | Minimal yaku detection. |
| MVP-0.6.5 | Done | Yaku detection connected to tsumo/ron. |
| MVP-0.7 | Done | Yaku result display with beginner explanations. |
| MVP-0.7.6 | Done | Furigana/reading helper APIs. |
| MVP-0.7.7 | Done | Furigana yaku display connected to render. |
| MVP-0.7.8 | Done | Beginner-friendly no-yaku rejection messages. |
| MVP-0.8 | Done | Beginner discard advice with ON/OFF setting and smartphone landscape layout refinements. |
| MVP-0.9 | Done on working branch | Next-round continuation after exhaustive draw, tsumo, or ron. |
| MVP-0.9.5 | Working branch | Smartphone landscape review and small next-round UI refinements. |
| MVP-1.0 | Working branch | Minimal east-only match state and UI: East 1 through East 4, fixed scores, compact round history, current-hand display, and East-only end display. |
| MVP-1.1 | Working branch | Smartphone landscape discard layout: human discards above the hand, compact CPU discards, and reduced page-level scrolling. |
| MVP-1.1.1 | Working branch | Table-center discard ring and popup discard-advice reasons for smartphone landscape. |
| MVP-1.1.4 | Working branch | Chrome-based smartphone landscape layout guard for detecting clipping, overflow, overlap, and unclickable controls. |
| MVP-1.1.6 | Working branch | Late-hand landscape discard grids fit 18 discards in all four discard zones and pass the layout guard. |
| MVP-1.2 | Working branch | Discard areas can be tapped to open a larger discard-list popup for each player. |
| MVP-1.3.1 | Working branch | East-only match end screen has a polished result-history popup based on `roundHistory`. |
| MVP-1.4 | Working branch | Shared discard evaluator v1 scores every tile for beginner advice and future CPU use; beginner help popup added. |
| MVP-1.5 | Working branch | CPU discards use the shared evaluator and choose from low-score candidates with light randomness. |
| MVP-1.5.1 | Working branch | Ron verification scenarios and UI checks clarify that normal ron is rare but the ron path works. |
| MVP-1.6 | Working branch | Beginner yaku guide suggests likely hand targets with gentle explanations and CSS-tile completion examples. |
| MVP-1.7 | Working branch | Tenpai/wait helper shows which tile would complete a 13-tile human hand and whether that wait has yaku. |
| MVP-1.8 | Working branch | CPU players can resolve yaku-valid tsumo or ron wins; no-yaku CPU completed shapes are ignored. |
| MVP-1.8.1 | Working branch | Discard evaluator protects completed sequences/triplets/pairs more strongly and adds a CPU win reachability diagnostic. |
| MVP-1.8.2 | Working branch | Yakuhai pairs and pair-heavy chiitoitsu/toitoi direction are protected more strongly in advice and CPU discard selection. |
| MVP-1.9 | Working branch | Discard-to-wait helper shows which discard leaves tenpai and what waits remain for 14-tile human turns. |

## Current Capabilities

- Static HTML/CSS/JavaScript app.
- No external libraries.
- GitHub Pages compatible structure.
- Human player vs three evaluator-guided CPU players.
- Live wall, dead wall, dora indicator frame.
- Human discard, evaluator-guided CPU discard, turn progression.
- Exhaustive draw when the live wall is empty.
- Tsumo win and ron win.
- No-yaku win rejection.
- Minimal yaku detection:
  - Menzen tsumo
  - Tanyao
  - Yakuhai
  - Chiitoitsu
  - Toitoi
  - Kokushi musou
- Yaku result display:
  - Yaku name
  - Furigana
  - Han
  - Total han
  - Beginner-friendly description
- Beginner-friendly no-yaku message:
  - `形は完成していますが、役がありません。`
  - `まずはタンヤオや役牌を狙ってみましょう。`
- Improved CSS tile visuals:
  - Slightly tall tile shape.
  - `tile-face` structure for future SVG/image replacement.
  - Red manzu, blue pinzu, green souzu, and dark honor accents.
  - Compact visual cues for suits.
  - Large tile mode support.
- localStorage stats:
  - rounds started
  - rounds drawn
  - last played timestamp
- Beginner discard advice:
  - Up to three suggested discards.
  - Gentle reasons for beginners.
  - ON/OFF setting stored in localStorage.
  - Suggested tiles highlighted in the human hand.
  - Mobile display keeps the first reason visible and secondary suggestions compact.
- Smartphone layout:
  - Landscape is recommended for regular play.
  - Human hand is prioritized near the bottom.
  - CPU seats stay around the table.
  - Portrait shows a gentle landscape recommendation.
  - Tsumo, ron, skip, and advice toggle remain tappable.
- Next-round continuation:
  - `次の局へ` appears after exhaustive draw, tsumo, or ron.
  - The next round creates a fresh wall, dead wall, players, hands, and dealer initial draw.
  - Previous round result is kept as `lastRoundResult`.
  - Previous result display uses short wording such as `前の局: 流局`.
  - Large tile mode and discard advice settings are preserved.
- East-only match core:
  - `START_MATCH` starts an east-only match at East 1.
  - `START_NEXT_ROUND` advances East 1, East 2, East 3, and East 4.
  - After East 4 ends, match state becomes ended and no East 5 starts.
  - Dealer advances every hand with no dealer repeat in MVP-1.0.
  - Scores remain fixed; no point movement is performed.
  - `roundHistory` stores compact hand results without point details.
- East-only match UI:
  - The center panel shows the current hand label, such as `東1局`.
  - East 1 through East 3 ended hands show `次の局へ`.
  - East 4 ended hand shows `東風戦終了` and does not show `次の局へ`.
  - The end display says four hands are complete and point calculation is not supported yet.
  - A fresh match start button remains available after the match ends.
  - The match-end restart button is wired to the same `START_MATCH` handler as the header start button.
- Human hand auto-sort:
  - Human hand tiles are always shown in manzu, pinzu, souzu, honor order.
  - Suited tiles sort from 1 through 9.
  - Honor tiles sort east, south, west, north, white, green, red.
  - Sorting is automatic; no extra UI toggle is added.
- MVP-1.0 real-device cache handling:
  - App CSS and module URLs include `v=mvp10-sort-debug-3`.
  - `main.js` also imports changed game/UI modules with the same version.
  - The rendered start button is covered by a UI event test that reaches the `START_MATCH` handler.
- MVP-1.1 landscape discard layout:
  - Human discards are displayed in a separate area above the human hand in landscape.
  - The human discard area shows the latest 12 discarded tiles.
  - CPU discard areas show the latest 6 discarded tiles in compact seats.
  - The human hand remains the bottom-priority tap area and may scroll horizontally inside its own strip.
  - Landscape CSS reduces page-level horizontal and vertical scrolling with `100dvh`/`100svh` sizing.
  - App CSS and module URLs include `v=mvp11-discard-layout-1`.
- MVP-1.1.1 center discard layout:
  - Landscape shows a center discard ring for north, west, south, and east discards.
  - CPU discard zones prioritize recent discards over CPU hand-back display in landscape.
  - Human discards sit above the hand as a center-bottom discard zone instead of overlapping the hand.
  - Detailed discard-advice reasons are opened with `助言を見る`.
  - Advice details appear in a compact popup and can be closed without adding page scroll.
  - App CSS and module URLs include `v=mvp111-discard-center-1`.

## MVP-1.1.4 Layout-Test Setup

- `tests/layout-check.mjs` launches local Chrome through Chrome DevTools Protocol.
- The check starts a temporary static server and does not require Playwright or Puppeteer packages.
- Covered viewports: 844x390, 896x414, 932x430, 812x375, and 780x360.
- Covered scenarios: early, mid, late, draw-ended, actions, discard-zoom, match-ended, and result-popup.
- It checks page overflow, important element visibility, discard clipping, hand clipping, recommended badge clipping, action/advice button clickability, popup bounds, and major overlaps.
- Screenshots are saved under `test-artifacts/layout/`.
- `test-artifacts/` is ignored by git.
- Current verified layout-check result: all viewports and MVP-1.1.6 scenarios pass as of MVP-1.1.6.
- The previous known failure, late-hand and draw-ended discard clipping at tile 13+ in all four discard zones, is fixed by the MVP-1.1.6 discard grid update.

## MVP-1.2 Discard Zoom

- Every center discard zone is tappable/clickable.
- Tapping north, west, south, or east discards opens a dialog for that player's discard list.
- The dialog shows the player label, discard count, all discard tiles in a larger tile size, and a close button.
- Backdrop click and Escape also close the dialog.
- Opening discard zoom closes the advice popup, and opening advice closes discard zoom.
- The layout guard includes a `discard-zoom` scenario that opens the human discard dialog with 18 tiles and checks viewport fit, close-button clickability, and tile count.
- Run `tests/layout-check.mjs` before merging or publishing MVP-1.2 or later.

## MVP-1.3 Match Result Popup

- East 4 match end still shows `東風戦終了`, `4局遊び終わりました。`, and the no-scoring note.
- `もう一度遊ぶ` remains visible.
- `結果を見る` opens a fixed popup with the four compact `roundHistory` entries.
- The result popup shows short beginner-friendly lines such as `東1局: 流局`, `東2局: あなたのツモ`, and `東3局: 南CPUのロン`.
- The result popup closes with `閉じる`, backdrop click, or Escape.
- Result, advice, and discard-zoom popups do not stay open at the same time.

## MVP-1.4 Discard Evaluator v1

- `evaluateDiscardCandidates(hand, context)` is a UI-independent pure evaluator for discard candidates.
- The evaluator returns one scored entry per valid tile with `tile`, `tileId`, `score`, `reasons`, and `tags`.
- Lower scores are easier discard candidates; higher scores are tiles the app prefers to keep.
- The v1 score considers isolated tiles, terminal tiles, honor tiles, pairs, connected number shapes, yakuhai pairs, dora, nearby dora, visible table tiles, and simple tanyao direction.
- `suggestDiscards(hand, context)` now uses the evaluator and keeps valid hands from returning empty advice.
- Advice reasons remain short and beginner-friendly.
- CPU discard behavior is connected to the evaluator in MVP-1.5.
- A beginner help popup explains that advice is a guide, not an absolute answer, and introduces isolated tiles, terminals, honors, pairs, connected numbers, dora, tanyao, and yakuhai.

## MVP-1.6 Hand Yaku Guide

- `suggestYakuTargets(hand, context)` is a UI-independent pure guide for beginner yaku targets.
- It returns 1 to 3 compact yaku suggestions with `name`, `reading`, `description`, `why`, `keepHints`, `discardHints`, and `exampleTiles`.
- MVP-1.6 covers tanyao, yakuhai, chiitoitsu, toitoi, and a no-yaku caution fallback.
- The guide favors tanyao when 2-8 suited tiles are common, yakuhai when dragon/seat/round wind pairs are present, chiitoitsu when many pairs exist, and toitoi when pairs/triplets are common.
- The UI adds a small `役ガイド` button near the human seat.
- The popup says the suggestions are a guide, not an absolute answer.
- Completion examples use the existing CSS tile structure rather than image assets.
- The yaku-guide popup does not stay open at the same time as advice, discard zoom, match result, or beginner help popups.
- The discard evaluator is not coupled to yaku-guide scoring yet; this keeps MVP-1.6 focused on explanation and avoids destabilizing CPU/advice behavior.

## MVP-1.7 Tenpai Waits Helper

- `analyzeWaits(hand, context)` is a UI-independent pure helper for 13-tile human hands.
- It tries all 34 tile kinds, skips impossible fifth copies, and reuses the existing winning-shape and yaku detection.
- The result includes `isTenpai`, `waits`, `tileLabel`, `hasYaku`, `yaku`, and beginner-readable messages.
- Yaku is checked in a ron-like context so the helper can explain shape-complete but no-yaku waits.
- The UI adds a compact `待ち` / `待ちあり` button near the human seat.
- The waits popup shows CSS tile wait examples, yaku-valid waits, no-yaku waits, or a gentle non-tenpai message.
- The waits popup does not stay open at the same time as advice, discard zoom, result, beginner help, or yaku-guide popups.
- Full shanten calculation, furiten, danger reading, and CPU wait display remain out of scope.

## MVP-1.9 Discard-To-Wait Helper

- `analyzeDiscardWaits(hand, context)` is a UI-independent pure helper for 14-tile human hands.
- It removes each possible discard by `tileId`, analyzes the remaining 13-tile hand with `analyzeWaits`, and returns compact discard-to-wait options.
- Each option includes `discardTile`, `discardTileId`, `discardTileLabel`, `waits`, `hasYakuWait`, and a beginner-readable message.
- The waits popup adds a compact `切ると待ち` section while preserving the existing 13-tile waits section.
- Yaku-valid and no-yaku waits remain separated so the UI can explain when the shape completes but no yaku is visible.
- Discard advice receives a small boost for unprotected discards that leave yaku-valid tenpai, while completed meld, dora, and yakuhai-pair protection stay stronger.
- Full shanten count, complete ukeire counting, furiten, and danger reading remain out of scope.

## MVP-1.8 CPU Tsumo/Ron Support

- CPU players can win by tsumo when their drawn hand is a winning shape with yaku.
- CPU players can win by ron on the latest discard when the human ron reaction is not taking priority.
- CPU ron currently chooses the first yaku-valid CPU winner found; multiple ron and head-bump rules remain out of scope.
- CPU no-yaku completed shapes are ignored and normal play continues.
- CPU wins store `winnerId`, `winType`, `fromPlayerId`/`loserId` for ron, `yakuResult`, and compact history data.
- East-only next-round flow and the match result popup show CPU tsumo/ron results.
- Added deterministic scenarios: `cpu-tsumo-ready-yakuhai`, `cpu-ron-ready-yakuhai`, and `cpu-no-yaku-win-shape`.

## MVP-1.5 CPU Discard Evaluator Connection

- CPU players use `chooseCpuDiscard` / `chooseCpuDiscardCandidate` for discard selection.
- CPU discard selection calls `evaluateDiscardCandidates` with available round, player, discard, match, and dora context.
- The CPU keeps light randomness by choosing from the top three low-score candidates with weighted probabilities.
- Tests can inject `rng` so CPU discard behavior remains stable and verifiable.
- A safe fallback remains for invalid or empty candidate evaluation.
- CPU discard remains intentionally lightweight; full shanten calculation, danger reading, and point expectation are still out of scope.

## MVP-1.5.1 Ron Verification

- Normal shuffled play can make ron feel rare because the player needs a complete winning shape with yaku and a CPU must discard the exact winning tile.
- `canRonLatestDiscard` still means yaku-valid ron is declarable.
- `canCompleteRonLatestDiscard` detects complete ron shapes even when no yaku exists, so the UI can show a helpful no-yaku explanation and a skip button.
- Added deterministic scenarios for `ron-ready-tanyao`, `ron-ready-yakuhai`, `ron-ready-chiitoitsu`, and `no-yaku-ron-shape`.
- Ron reaction UI is covered for yaku-valid ron and no-yaku ron-shape states.
- CPU evaluator discards can make obvious bad discards less common, so deterministic ron scenarios are the recommended manual verification path.

## MVP-1.1 Remaining Visual Polish Candidates

- West CPU 2 and South CPU 1 seat labels can still feel slightly clipped in smartphone landscape.
- The previous-round summary, such as `前の局: 流局`, can feel cramped in the compact landscape table.
- Smartphone landscape is playable, but fine UI polish is still needed around spacing, labels, and table balance.
- A discard-enlargement popup remains a candidate for MVP-1.2 or later, especially for older users when discard tiles must stay small.

## Not Implemented Yet

- Point calculation.
- Fu calculation.
- Chi, pon, kan.
- Riichi.
- Furiten.
- Dora and ura-dora scoring.
- Point-based final result screen.
- Hanchan flow.
- Dealer repeat and honba full rules.
- Point movement between rounds.
- CPU ron.
- Multiple ron.
- Full CPU AI.
- Dealer repeat and honba.
- Riichi sticks and deposits.
- Local same-device multiplayer.
- Local network multiplayer.

## Main Merge Readiness

Before merging into `main`, confirm:

- `git status --short --branch` is clean.
- Latest test runner result is `210 pass / 0 pending / 0 fail`.
- `tests/layout-check.mjs` has been run and its result is reviewed.
- `tests/layout-check.mjs` passes, including late-hand and draw-ended discard scenarios.
- `/` returns HTTP 200 from a local static server.
- `/tests/test-runner.html` returns HTTP 200 from a local static server.
- README reflects MVP-1.1.x layout status.
- Smartphone landscape layout has been checked or queued for final real-device check.
- `docs/layout-test.md` is reviewed.
- `docs/release-checklist.md` is reviewed.
- `docs/manual-test-checklist.md` is reviewed.
- `docs/landscape-ui-plan.md` is reviewed.
- The user explicitly approves the merge.
- The user explicitly approves any push.

## GitHub Pages Readiness

Before publishing:

- Confirm `index.html` works from a local static server.
- Confirm `tests/test-runner.html` works from a local static server.
- Confirm all module imports are relative and static-host friendly.
- Confirm no build step is required.
- Confirm no external dependencies are required.
- Confirm smartphone landscape is manually checked.
- Confirm portrait shows the landscape recommendation.
- Confirm README clearly lists missing major features.
