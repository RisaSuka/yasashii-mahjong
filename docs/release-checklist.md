# Release / Publish Checklist

Use this before merging to `main` or publishing with GitHub Pages.

## Current Release Candidate

- Branch: `codex/mvp-16-hand-yaku-guide`
- Scope: MVP-0.1 through MVP-1.8 CPU tsumo/ron support
- Expected automated result: `264 pass / 0 pending / 0 fail`
- Push: not yet
- `main` merge: not yet
- Publish status: MVP-1.8 is not published yet.

## Git Safety

- Confirm the current branch is `codex/mvp-16-hand-yaku-guide`.
- Confirm the working tree is clean.
- Confirm the latest commit is the intended release candidate.
- Confirm no unreviewed local commits are being skipped.
- Confirm the user explicitly approved push.
- Confirm the user explicitly approved merge to `main`.

Commands:

```powershell
git status --short --branch
git log --oneline -10
git branch --list
```

## Automated Checks

- Open `http://127.0.0.1:8765/tests/test-runner.html`.
- Confirm total count is 264.
- Confirm pass count is 264.
- Confirm fail count is 0.
- Confirm pending count is 0.
- Confirm `src/game/` has no DOM access except the localStorage boundary in `src/game/storage.js`.
- Run the smartphone landscape layout guard:

```powershell
node tests/layout-check.mjs
```

- If Node is not on PATH in the Codex desktop environment, use the bundled Node command documented in `docs/layout-test.md`.
- Confirm layout-check screenshots are written under `test-artifacts/layout/`.
- Current layout-check result: all target viewports and scenarios pass, including `late`, `draw-ended`, `discard-zoom`, `match-ended`, `result-popup`, `yaku-guide`, `waits`, and `cpu-win`.

## Core Functional Checks

- New round starts.
- Human player receives 14 tiles after dealer draw.
- CPU players show hand counts.
- Human can discard one tile.
- CPU players discard using the shared discard evaluator with light randomness.
- Turn returns to the human during normal play.
- Live wall reaches 0 in simulation or long manual play.
- Round ends with `exhaustive-draw`.
- Stats are saved to localStorage.
- Human tsumo win still works.
- Human ron win still works.
- No-yaku tsumo/ron is rejected with a beginner-friendly message.
- Winning result still shows yaku names, han, total han, explanations, and furigana.
- Yaku display order remains beginner-friendly.
- CSS tile display keeps manzu, pinzu, souzu, and honor tiles visually distinct.
- Beginner discard advice appears on the human discard turn when enabled.
- Advice ON/OFF works and persists.
- Suggested discard highlighting remains visible without blocking taps.
- Smartphone landscape keeps CPU seats, center information, and the bottom human hand easy to understand.
- Portrait shows the landscape recommendation message.
- After exhaustive draw, tsumo, or ron, `次の局へ` appears.
- Pressing `次の局へ` starts a fresh round.
- Previous round result is displayed briefly.
- Previous round result uses short wording and does not crowd the center panel.
- Large tile mode and discard advice settings are preserved after `次の局へ`.
- `START_MATCH` starts East 1 with dealer 0.
- Match progression advances East 1 to East 4.
- After East 4 ends, the match is ended and East 5 is not created.
- Dealer advances every hand in MVP-1.0, regardless of draw, tsumo, or ron.
- Scores remain fixed; no point movement is performed.
- `roundHistory` stores compact results without point details.
- The center panel shows the current hand label, such as `東1局`.
- East 1 through East 3 ended hands show `次の局へ`.
- East 4 ended hand shows `東風戦終了`.
- East 4 ended hand does not show `次の局へ`.
- A fresh match start button remains available after the match ends.
- The fresh match start button after match end is tappable and dispatches `START_MATCH`.
- Restarting after match end returns to East 1 and clears the East-only end message.
- Human hand tiles are automatically sorted in manzu, pinzu, souzu, honor order.
- The sorted human hand still supports tile-id based discard.
- Beginner discard advice still highlights the intended sorted tile.
- App module URLs include the current MVP-1.1.x cache-busting version.
- All visible start-match buttons dispatch through the `START_MATCH` UI handler.
- Table-center discard ring appears in smartphone landscape.
- North, west, south, and human discard zones surround the center information.
- Human discard zone appears above the human hand and does not overlap it.
- CPU discard zones show recent discard tiles instead of disappearing into CPU seats.
- Page-level horizontal scroll is absent in smartphone landscape.
- Page-level vertical scroll is absent or minimal in smartphone landscape.
- Hand overflow stays inside the hand strip.
- `助言を見る` opens a compact discard-advice reason popup.
- The discard-advice reason popup closes without adding page scroll.
- Advice OFF hides the advice reason button.
- App module URLs include the current MVP-1.1.x cache-busting version.
- Smartphone landscape layout guard exists and is documented in `docs/layout-test.md`.
- Layout screenshots are ignored by git via `test-artifacts/`.
- Late-hand and draw-ended discard zones fit 18 discards without clipping in the layout guard.
- Tapping/clicking any player discard zone opens a larger discard zoom popup.
- The discard zoom popup shows the selected player label, discard count, and enlarged discard tiles.
- The discard zoom popup can be closed with the close button, backdrop click, or Escape.
- Discard zoom and discard-advice popups do not stay open at the same time.
- East-only match end shows `東風戦終了`, the four-hand completion note, no-scoring note, result-history button, and replay button.
- `結果を見る` opens a compact `roundHistory` popup.
- The result popup lists East 1 through East 4 without points or rankings.
- Result, advice, and discard-zoom popups do not stay open at the same time.
- `evaluateDiscardCandidates` scores all valid hand tiles with reasons.
- `suggestDiscards` uses the evaluator and returns at least one candidate for valid hands.
- Advice reasons remain beginner-friendly and do not imply an absolute correct answer.
- Dora, pairs, connected number shapes, and yakuhai pairs are kept more often by the evaluator.
- Beginner help opens and explains isolated tiles, terminal tiles, honor tiles, pairs, connected numbers, dora, tanyao, and yakuhai.
- Beginner help, advice, discard zoom, and match result popups do not stay open at the same time.
- CPU discards use low-score evaluator candidates in MVP-1.5.
- CPU discard selection still has light randomness and is not a full optimal AI.
- CPU turns continue without stalling after evaluator-guided discard.
- Ron-ready deterministic scenarios exist for tanyao, yakuhai, chiitoitsu, and no-yaku ron-shape checks.
- Yaku-valid ron scenarios show ron and skip actions.
- No-yaku ron-shape shows a helpful no-yaku message and skip action instead of a winning ron button.
- Smartphone landscape keeps ron/skip actions inside the table action bar.
- `suggestYakuTargets` returns beginner yaku targets for tanyao, yakuhai, chiitoitsu, toitoi, or no-yaku caution.
- `役ガイド` opens a popup with 1 to 3 current-hand yaku suggestions.
- The yaku guide includes yaku name, reading, beginner description, why text, keep/discard hints, and CSS-tile completion examples.
- The yaku guide states that suggestions are a guide, not an absolute correct answer.
- The yaku-guide popup closes with the close button, backdrop click, or Escape.
- Yaku guide, beginner help, advice, discard zoom, and match result popups do not stay open at the same time.
- Smartphone landscape layout guard includes the yaku-guide popup.
- `analyzeWaits` detects waits for 13-tile human hands by trying all 34 tile kinds.
- Tenpai waits show CSS wait tiles and whether the wait has yaku.
- Shape-complete no-yaku waits show a gentle no-yaku explanation.
- Non-tenpai hands show a gentle not-yet-tenpai message.
- The waits popup closes with the close button, backdrop click, or Escape.
- Waits, yaku guide, beginner help, advice, discard zoom, and match result popups do not stay open at the same time.
- Smartphone landscape layout guard includes the waits popup.
- CPU tsumo with yaku ends the round and stores `winningResult`.
- CPU ron on a human discard with yaku ends the round and stores `winnerId`, `fromPlayerId`, and `loserId`.
- CPU completed shapes without yaku are ignored.
- CPU win results are stored in `lastRoundResult` and `roundHistory`.
- CPU win states show the next-round action and fit in the smartphone landscape layout guard.

## Manual Browser Checks

Use:

```text
http://127.0.0.1:8765/
```

Check:

- Desktop layout is usable.
- Smartphone width is usable.
- Smartphone landscape is the recommended play layout.
- In landscape, CPU seats appear around the center and the human hand remains at the bottom.
- Human hand is easy to find.
- Human tiles are easy to tap.
- Manzu, pinzu, souzu, and honor tiles are easy to distinguish.
- Tiles look slightly tall and tile-like, not like flat text cards.
- Horizontal scrolling does not squeeze tiles.
- Disabled tiles look disabled.
- Large tile mode makes the human hand easier to tap.
- Large tile mode does not break tile proportions.
- Tsumo, ron, and skip buttons are readable and tappable when they appear.
- Advice ON/OFF is readable and tappable.
- Discard advice does not dominate the center panel.
- No-yaku message is readable near the center status text.
- Furigana yaku display remains readable.
- Exhaustive draw does not show a yaku summary.
- Win display does not show stale rejection messages.
- Next-round button is readable and tappable after a round ends.
- Next-round button remains easy to tap in smartphone landscape.
- Previous-round result text is readable after the next round starts.
- Human discards are visible above the human hand in the center discard ring.
- CPU discards remain visible in the center discard ring without making CPU seats dominate the table.
- The discard-advice reason popup opens and closes in landscape.
- The discard zoom popup opens and closes in landscape.
- The match result popup opens and closes in landscape.
- The yaku-guide popup opens and closes in landscape.
- The yaku-guide completion examples are visible and do not overflow the viewport.
- The waits popup opens and closes in landscape.
- Wait tiles and close controls stay within the viewport.
- CPU tsumo/ron win display remains readable and the next-round button remains tappable.

## GitHub Pages Checks

- Confirm the app uses relative module paths.
- Confirm no local-only build step is required.
- Confirm `index.html` works from a static server.
- Confirm `tests/test-runner.html` works from a static server.
- Confirm there are no external dependencies that GitHub Pages must install.
- Confirm README describes the current MVP scope and known missing features.
- Confirm `docs/current-status.md` reflects MVP-1.8 and 264 pass.
- Confirm `docs/manual-test-checklist.md` includes smartphone landscape checks.
- Confirm `docs/manual-test-checklist.md` includes next-round checks.
- Confirm `docs/layout-test.md` reflects the current layout guard result.

## Do Not Release If

- Tests fail.
- Pending tests remain.
- Working tree is dirty.
- Browser smoke check has not been done.
- Push has not been approved.
- `main` merge has not been approved.
- New work accidentally includes point scoring, calls, riichi, furiten, dora, or other out-of-scope features.
