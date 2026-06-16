# Current Status

Last updated for MVP-1.3.1 match result popup polish.

## Repository State

- Working branch: `codex/mvp-12-discard-zoom`
- Automated tests: `210 pass / 0 pending / 0 fail`
- Layout check: Chrome-based smartphone landscape guard passed all target viewports/scenarios at MVP-1.1.6; MVP-1.2 adds a discard-zoom scenario that must be run before merge/publish
- Working tree: clean at the time of the latest MVP-1.3.1 match result polish
- Push: not yet
- `main` merge: not yet for MVP-1.3.1

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

## Current Capabilities

- Static HTML/CSS/JavaScript app.
- No external libraries.
- GitHub Pages compatible structure.
- Human player vs three random CPU players.
- Live wall, dead wall, dora indicator frame.
- Human discard, CPU random discard, turn progression.
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
