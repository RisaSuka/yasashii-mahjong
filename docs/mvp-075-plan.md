# MVP-0.7.5 Plan: No-Yaku Rejection Feedback

## Goal

MVP-0.7.5 explains why a player cannot win when the hand shape is complete but no supported yaku exists.

Current state:

- MVP-0.6.5 rejects no-yaku tsumo and ron.
- MVP-0.7 shows yaku names, han, total han, and beginner-friendly explanations after a successful win.
- No-yaku rejection still has no visible explanation.

MVP-0.7.5 should keep the game rules unchanged and add a small, testable feedback path:

```text
形は完成していますが、あがるための条件である役がありません。
まずはタンヤオや役牌を狙ってみましょう。
```

## Implement In MVP-0.7.5

- Store a no-yaku rejection reason in round state.
- Render the no-yaku rejection message in the center panel.
- Use beginner-friendly wording.
- Keep the message short and readable on smartphone.
- Keep tsumo, ron, reaction skip, exhaustive draw, and yaku display behavior stable.
- Update manual verification docs after implementation.

## Do Not Implement In MVP-0.7.5

- Point calculation
- Fu calculation
- New yaku
- Complete yaku coverage
- Dora
- Riichi
- Furiten
- Chi, pon, kan
- Full tutorial mode
- Practice mode
- Local battle
- Network battle
- Broad UI redesign

## Expected File Changes

Game core:

- `src/game/actions.js`

UI:

- `src/ui/render.js`
- `styles/board.css`

Tests:

- `tests/yaku-integration.test.js` or a new focused rejection-message test file
- `tests/test-runner.html` if a new test file is added

Docs:

- `docs/mvp-075-plan.md`
- `docs/manual-test-checklist.md`
- optional `README.md`

## State Design

Use a small optional field on `round`:

```js
round.lastActionResult = {
  ok: false,
  action: "DECLARE_TSUMO",
  reason: "no-yaku",
  message: "形は完成していますが、あがるための条件である役がありません。\nまずはタンヤオや役牌を狙ってみましょう。"
}
```

For ron:

```js
round.lastActionResult = {
  ok: false,
  action: "DECLARE_RON",
  reason: "no-yaku",
  message: "形は完成していますが、あがるための条件である役がありません。\nまずはタンヤオや役牌を狙ってみましょう。"
}
```

Why `round.lastActionResult`:

- It keeps the reason close to the round state.
- UI can render from `gameState` without knowing rule details.
- It avoids duplicating yaku logic in UI.
- It remains optional and does not affect normal progression.

Do not use local UI-only state as the primary source of truth. The game layer should own the rejection reason.

## Clearing Policy

Clear or replace `lastActionResult` when:

- A new round starts.
- A successful tsumo or ron occurs.
- A player discards a tile.
- A player draws a tile.
- A reaction is skipped.
- The round ends by exhaustive draw.

Keep it when:

- A no-yaku win is rejected and the player should see the reason.

This prevents old messages from lingering after normal play continues.

## UI Message Policy

Recommended main message:

```text
形は完成していますが、あがるための条件である役がありません。
まずはタンヤオや役牌を狙ってみましょう。
```

Short fallback message:

```text
まだ役がありません。
```

Display rules:

- Show the message in the center panel.
- Use a soft warning style, not an error style.
- Do not use `失敗`.
- Prefer short lines.
- Keep font size readable.
- Do not hide current turn or table counts.

## Rejection Reason Scope

MVP-0.7.5 only needs a user-facing message for:

- `reason: "no-yaku"`

Other rejection cases can remain silent for now:

- Not current player
- Wrong phase
- Missing discard
- Incomplete hand
- Own discard
- Ended round

Later milestones can add more detailed feedback if needed.

## Button Behavior

Current yaku-aware helpers mean:

- `canDeclareTsumo` returns false for no-yaku tsumo.
- `canDeclareRon` / `canRonLatestDiscard` return false for no-yaku ron.

MVP-0.7.5 does not need to show enabled buttons for unavailable wins.

However, no-yaku feedback is still useful for:

- stale button dispatches
- manual/debug scenarios
- future explicit "try win" controls
- future beginner guidance

Do not add new buttons in this milestone.

## Test Case Ideas

Agent C should add tests before implementation.

Game metadata tests:

- No-yaku `DECLARE_TSUMO` sets `round.lastActionResult.reason === "no-yaku"`.
- No-yaku `DECLARE_TSUMO` keeps `phase` unchanged.
- No-yaku `DECLARE_TSUMO` does not set `winningResult`.
- No-yaku `DECLARE_RON` sets `round.lastActionResult.reason === "no-yaku"`.
- No-yaku `DECLARE_RON` keeps `phase: "reaction"`.
- No-yaku `DECLARE_RON` does not set `winningResult`.
- Successful tsumo clears `lastActionResult`.
- Successful ron clears `lastActionResult`.
- `START_ROUND` clears any previous message.
- Exhaustive draw clears or replaces any previous message.

Render tests:

- `round.lastActionResult.reason === "no-yaku"` renders the beginner-friendly message.
- Rendered message includes `形は完成`.
- Rendered message includes `役がありません`.
- Rendered message includes `タンヤオ` or `役牌`.
- Missing `lastActionResult` does not render a warning.
- Existing yaku summary display still renders after a successful win.
- Existing exhaustive draw display does not show no-yaku warning.

Regression tests:

- Existing 113 tests remain passing.
- `src/game/` remains DOM-free except `storage.js`.
- UI still renders from state.
- UI still uses actions for operations.

## Agent Split

Agent C: tests

- Adds pending game metadata tests.
- Adds pending render tests for the no-yaku message.
- Does not change production code.

Agent A: game core

- Adds `lastActionResult` on no-yaku tsumo/ron rejection.
- Clears stale action result on normal state transitions.
- Keeps game code DOM-free.
- Does not add scoring or new yaku.

Agent B: UI

- Renders `round.lastActionResult.message`.
- Uses soft warning styling.
- Keeps center panel readable on smartphone.
- Does not implement yaku logic directly.

Agent D: UX reviewer

- Reviews wording for beginner and older users.
- Checks that the message is not harsh or crowded.

Integration owner:

- Integrates tests first.
- Integrates game metadata second.
- Integrates UI rendering third.
- Runs all automated tests.
- Performs manual tsumo/ron/no-yaku/exhaustive-draw checks.
- Updates manual checklist.

## Go Conditions

Start implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 113 pass / 0 pending / 0 fail.
- Scope is limited to no-yaku feedback.
- No scoring, fu, dora, riichi, calls, or furiten are included.
- The message text is short and beginner-friendly.

## No-Go Conditions

Do not start implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The change expands into full tutorial or practice mode.
- The change requires new yaku detection.
- The UI becomes a broad redesign.
- The implementation adds local battle or networking.

## Suggested Implementation Order

1. Add pending metadata tests for no-yaku tsumo and ron.
2. Add pending render tests for no-yaku message.
3. Add `lastActionResult` helper in `src/game/actions.js`.
4. Set no-yaku rejection metadata in `DECLARE_TSUMO`.
5. Set no-yaku rejection metadata in `DECLARE_RON`.
6. Clear stale metadata on successful wins and normal progress actions.
7. Render `lastActionResult.message` in `src/ui/render.js`.
8. Add small warning styling in `styles/board.css`.
9. Run all tests.
10. Update `docs/manual-test-checklist.md`.

## MVP-0.8 Candidates

- Beginner help panel
- Explicit "why can't I win?" explanation
- Practice mode planning
- Pinfu
- Seat wind and round wind yakuhai
- Riichi design
- Furiten design
- Dora design
