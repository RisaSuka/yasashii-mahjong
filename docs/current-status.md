# Current Status

Last updated for MVP-1.0 east-only match UI connection.

## Repository State

- Working branch: `codex/mvp-09-next-round`
- Automated tests: `176 pass / 0 pending / 0 fail`
- Working tree: clean at the time of the latest MVP-1.0 UI confirmation
- Push: not yet
- `main` merge: not yet for MVP-1.0

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
- Latest test runner result is `176 pass / 0 pending / 0 fail`.
- `/` returns HTTP 200 from a local static server.
- `/tests/test-runner.html` returns HTTP 200 from a local static server.
- README reflects MVP-1.0 UI status.
- Smartphone landscape layout has been checked or queued for final real-device check.
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
