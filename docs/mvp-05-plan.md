# MVP-0.5 Plan: Ron Win Entry

## Goal

MVP-0.5 adds the first ron win entry.

The goal is intentionally small:

```text
When another player discards a tile, the human player can declare ron if the discarded tile plus the human's 13-tile hand forms a winning 14-tile hand.
```

MVP-0.5 should use the MVP-0.2 `isWinningHand(tiles)` checker and the MVP-0.4 deterministic scenario setup. It must not add scoring, yaku requirements, calls, riichi, furiten, or multiple ron handling.

## Implement In MVP-0.5

- `DECLARE_RON` action.
- A helper such as `canDeclareRon(state, playerId)`.
- Human ron against another player's latest discard.
- Round ending with `phase: "ended"`.
- Round ending with `endReason: "win"`.
- `winningResult.winType: "ron"`.
- `winningResult.winnerId`.
- `winningResult.fromPlayerId`.
- `winningResult.winningTile`.
- `winningResult.handTiles`.
- Rejection when the player is the discarder.
- Rejection when there is no `lastDiscard.tile`.
- Rejection when the discarded tile does not complete a winning hand.
- Rejection after the round already ended.
- Minimal UI button for human ron when available.
- Automated tests based on `createScenarioState("ron-ready-basic")`.

## Do Not Implement In MVP-0.5

- Point calculation
- Yaku detection
- Yaku-required validation
- Multiple ron
- CPU ron
- Chi, pon, kan
- Riichi
- Furiten
- Dora effects
- Ura-dora
- Payment movement
- Honba or riichi-stick settlement
- Full turn interruption rules
- Full reaction priority between ron/calls

## Scope Decisions

### Reaction Phase

MVP-0.5 should introduce the smallest viable reaction window.

Recommended state:

```js
round.phase = "reaction"
```

After a discard:

- `DISCARD_TILE` removes the tile from the discarder hand.
- `lastDiscard` is set.
- Instead of immediately moving to draw flow, the round enters `reaction`.
- Human ron can be declared during `reaction`.
- If no ron is declared, an explicit action such as `ADVANCE_AFTER_REACTION` or existing flow logic moves to the next player's draw.

Why add `reaction` now:

- Ron is not the discarding player's own action.
- Ron must happen before the next draw.
- Future chi/pon/kan also need a reaction window.
- It avoids overloading `discard` or `draw` phase semantics.

Minimal alternative:

- Keep `phase: "draw"` and allow ron while `lastDiscard` exists.

Use this only if adding `reaction` causes too much churn. The preferred MVP-0.5 design is `reaction`.

### Multiple Ron

Defer multiple ron.

MVP-0.5 should accept only one winner:

- Human player 0 ron only.
- First matching `DECLARE_RON` ends the round.
- If more players could win, that is out of scope until a later milestone.

### CPU Ron

Defer CPU ron.

Reasons:

- CPU ron changes normal gameplay frequency.
- It needs clear timing and messaging.
- It may make manual testing harder while the UI is still simple.

MVP-0.5 can still structure the game helper so CPU ron can be added later.

## Action Proposal

### `DECLARE_RON`

```js
{
  type: "DECLARE_RON",
  playerId: 0
}
```

Behavior:

- Valid only when `round.phase === "reaction"`.
- Valid only when `round.lastDiscard.tile` exists.
- Invalid if `playerId === round.lastDiscard.playerId`.
- Invalid if the round is already ended.
- Builds a 14-tile candidate:

```js
[
  ...player.hand,
  round.lastDiscard.tile
]
```

- Calls `isWinningHand(candidateTiles)`.
- Succeeds only if the result is winning.
- Ends the round on success.

Success result:

```js
round: {
  phase: "ended",
  endReason: "win",
  winningResult: {
    winnerId: 0,
    winType: "ron",
    fromPlayerId: 1,
    winningTile: round.lastDiscard.tile,
    handTiles: [...player.hand, round.lastDiscard.tile],
    handType: "standard"
  }
}
```

### `ADVANCE_AFTER_REACTION`

Possible action:

```js
{
  type: "ADVANCE_AFTER_REACTION"
}
```

Behavior:

- Valid only when `round.phase === "reaction"`.
- Advances turn to the next player.
- Draws for the next player, or leaves draw to existing UI flow if keeping action sequencing explicit.

Design note:

- If current UI scheduling already does `ADVANCE_TURN` then `DRAW_TILE`, integration may instead update that flow to skip the reaction window after a short delay.
- Prefer an explicit action if tests become clearer.

## Helper Proposal

```js
canDeclareRon(state, playerId)
```

Returns `true` only when:

- `state.round` exists.
- `state.round.phase === "reaction"`.
- `state.round.lastDiscard.tile` exists.
- `playerId !== state.round.lastDiscard.playerId`.
- The player exists.
- `isWinningHand([...player.hand, state.round.lastDiscard.tile]).winning === true`.

This helper must be pure and DOM-free.

## gameState Changes

Existing fields to rely on:

```js
round.lastDiscard = {
  playerId,
  tile
}
```

New or clarified phase:

```js
round.phase = "reaction"
```

Winning result for ron:

```js
winningResult: {
  winnerId: 0,
  winType: "ron",
  fromPlayerId: 1,
  winningTile: tile,
  handTiles: [],
  handType: "standard"
}
```

No score fields should be added in MVP-0.5.

## Expected File Changes

Game core:

- `src/game/actions.js`
- `src/game/round.js` only if phase initialization or comments need adjustment
- `src/game/scenarios.js` only if `ron-ready-basic` needs a tiny fixture adjustment

Tests:

- `tests/ron.test.js`
- `tests/test-runner.html`
- `tests/actions.test.js` only if reaction phase affects existing discard/draw tests
- `tests/scenario.test.js` only if the ron-ready scenario expectation needs tightening

UI:

- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`
- `styles/board.css` only for a minimal tappable ron button

Docs:

- `README.md`
- `docs/mvp-05-plan.md`
- `docs/manual-test-checklist.md`
- `docs/mvp-05-verification.md`

## Test Case Ideas

Agent C should add pending tests before implementation.

### Ron Success

- `createScenarioState("ron-ready-basic")` gives player 0 a ron-ready 13-tile hand.
- `canDeclareRon(state, 0) === true`.
- `DECLARE_RON` ends the round.
- `endReason === "win"`.
- `winningResult.winType === "ron"`.
- `winningResult.winnerId === 0`.
- `winningResult.fromPlayerId === 1`.
- `winningResult.winningTile.id === state.round.lastDiscard.tile.id`.
- `winningResult.handTiles.length === 14`.

### Rejection Cases

- The discarder cannot ron their own discard.
- A non-winning hand cannot ron.
- Ron is rejected when `lastDiscard.tile` is null.
- Ron is rejected when `phase !== "reaction"`.
- Ron is rejected after `phase === "ended"`.
- Ron is rejected for missing player id.

### Regression Cases

- Existing 54 tests still pass.
- `DECLARE_TSUMO` still works.
- Exhaustive draw still works.
- Normal `START_ROUND` still creates shuffled play.
- Scenario setup still creates no duplicate tile ids.
- No score/yaku/call/riichi/furiten fields or actions are introduced.

### Reaction Phase Cases

- After a discard, the round enters `reaction`.
- During `reaction`, the discarded player has one tile in `lastDiscard`.
- If no ron is declared, the game can advance to the next player's draw.
- `DISCARD_TILE` should not allow a new discard while still in `reaction`.

## UI Policy

MVP-0.5 UI should be minimal:

- Show `ロン` button only for the human player when `canDeclareRon(state, 0)` is true.
- Place it near the existing center action area, similar to `ツモ`.
- Button dispatches `DECLARE_RON`.
- On success, show `あなたのロン和了です`.
- Do not show score.
- Do not show yaku.
- Do not show multiple-choice winner UI.
- Do not add chi/pon/kan/riichi buttons.

If reaction phase timing is too fast for manual use:

- Keep the existing CPU delay style.
- Use a short reaction delay before advancing after CPU/human discard.
- Do not build a large timing/animation system.

## Agent Split

Agent C: tests

- Owns `tests/ron.test.js`.
- Adds pending `DECLARE_RON`, `canDeclareRon`, and reaction phase tests.
- Registers tests in `tests/test-runner.html`.
- Does not change production code.

Agent A: game core

- Owns `canDeclareRon`.
- Owns `DECLARE_RON`.
- Owns reaction phase state transitions.
- Keeps logic in `src/game/**`.
- Does not touch UI.

Agent B: UI

- Owns minimal `ロン` button rendering and click binding.
- Uses `canDeclareRon` for display.
- Dispatches `DECLARE_RON`.
- Keeps UI state immutable and action-driven.

Agent D: UX reviewer

- Reviews button wording, placement, and timing.
- Keeps recommendations minimal and accessibility-focused.

Integration owner:

- Integrates tests first.
- Integrates game core second.
- Runs all tests.
- Integrates UI third.
- Confirms no out-of-scope features.
- Updates README and verification docs.

## Go Conditions

Start MVP-0.5 implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 54 pass / 0 pending / 0 fail.
- `ron-ready-basic` scenario exists and is usable.
- Scope is limited to single human ron entry.
- No scoring/yaku/calls/riichi/furiten/dora work is included.
- Reaction phase design is accepted or explicitly simplified.

## No-Go Conditions

Do not start MVP-0.5 implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The plan requires multiple ron.
- The plan requires CPU ron.
- The plan requires scoring or yaku.
- The plan requires full call priority.
- The UI change would become a broad redesign.

## Suggested Implementation Order

1. Add pending `tests/ron.test.js`.
2. Register ron tests in `tests/test-runner.html`.
3. Add `canDeclareRon(state, playerId)` to `src/game/actions.js`.
4. Add `DECLARE_RON` action.
5. Add or adapt `reaction` phase after discard.
6. Add a no-ron advance path, preferably explicit and testable.
7. Run all tests and adjust only MVP-0.5 behavior.
8. Add minimal human `ロン` button.
9. Add ron win status text.
10. Update README and verification docs.

## MVP-0.6 Candidates

- CPU ron
- Multiple ron
- Yaku-required winning validation
- Furiten basics
- Ron/chi/pon reaction priority design
- Minimal point calculation planning

