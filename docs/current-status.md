# Current Status

Last updated for MVP-0.7.8.

## Repository State

- Working branch: `codex/mvp-01-integration`
- Automated tests: `136 pass / 0 pending / 0 fail`
- Working tree: clean at the time of the MVP-0.7.8 confirmation
- Push: not yet
- `main` merge: not yet

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

## Not Implemented Yet

- Point calculation.
- Fu calculation.
- Chi, pon, kan.
- Riichi.
- Furiten.
- Dora and ura-dora scoring.
- East-only match flow.
- Hanchan flow.
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
- Latest test runner result is `136 pass / 0 pending / 0 fail`.
- README reflects MVP-0.7.8.
- `docs/release-checklist.md` is reviewed.
- `docs/manual-test-checklist.md` is reviewed.
- The user explicitly approves the merge.
- The user explicitly approves any push.

## GitHub Pages Readiness

Before publishing:

- Confirm `index.html` works from a local static server.
- Confirm `tests/test-runner.html` works from a local static server.
- Confirm all module imports are relative and static-host friendly.
- Confirm no build step is required.
- Confirm no external dependencies are required.
- Confirm smartphone width is manually checked.
- Confirm README clearly lists missing major features.
