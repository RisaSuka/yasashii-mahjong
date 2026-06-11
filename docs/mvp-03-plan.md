# MVP-0.3 Plan: Tsumo Win Entry

## Goal

MVP-0.3 connects the MVP-0.2 winning-shape checker to the round flow as the first win-entry milestone.

The goal is intentionally small:

```text
When a player has a winning 14-tile hand after drawing, the round can end as a tsumo win.
```

MVP-0.3 still does not calculate points, check yaku, handle ron, support calls, or implement riichi/furiten.

## Implement In MVP-0.3

- Connect `isWinningHand(tiles)` to the round flow.
- Detect a winning shape after a player draws.
- Allow a human tsumo win.
- Allow a CPU tsumo win.
- End the round with a tsumo-win reason.
- Store minimal win metadata in `round`.
- Add tests for tsumo detection and round ending.
- Keep MVP-0.1 exhaustive-draw flow working.
- Keep MVP-0.2 win-check tests passing.

## Do Not Implement In MVP-0.3

- Point calculation
- Yaku detection
- Fu/han calculation
- Ron
- Chi, pon, kan
- Riichi
- Furiten
- Dora effects
- Ura-dora
- Payment movement
- Honba/riichi-stick settlement
- Full tonpuu/hanchan progression
- Full CPU strategy
- Hand suggestion UI

## Expected User-Facing Behavior

Minimal acceptable behavior:

- After the human draws a winning-shape hand, the UI can show that tsumo is available.
- The human can trigger tsumo win only when the current hand is a winning shape.
- After a CPU draws a winning-shape hand, CPU may immediately declare tsumo.
- The round ends and no further draws/discards occur.
- The app clearly shows that the round ended by tsumo.

If UI work is considered too large for this milestone, MVP-0.3 may be split:

- MVP-0.3a: game-state/action support only
- MVP-0.3b: minimal UI button/status integration

## Expected Files To Change

Game core:

- `src/game/actions.js`
- `src/game/round.js` only if round state initialization needs new fields
- `src/game/rules/win-check.js` only for tiny integration-safe export adjustments

UI:

- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`

Tests:

- `tests/actions.test.js`
- `tests/round.test.js` only if round initialization tests need updates
- A new `tests/tsumo.test.js` may be created if the action tests become too large
- `tests/test-runner.html` if a new test file is added

Docs:

- `README.md`
- `docs/mvp-01-verification.md`
- `docs/manual-test-checklist.md`

## Files That Should Not Change

- `styles/**`, unless the tsumo affordance needs a tiny button/status style
- `src/game/tiles.js`
- `src/game/wall.js`
- `src/game/player.js`
- `src/game/cpu/random-cpu.js`, unless CPU tsumo decision is intentionally isolated there
- Existing MVP-0.2 win-check tests, unless the API changes intentionally

## Action Ideas

### `DECLARE_TSUMO`

```js
{
  type: "DECLARE_TSUMO",
  playerId: 0
}
```

Behavior:

- Valid only when `round.phase` allows action from the current player.
- Valid only for the current player.
- Valid only when `isWinningHand(player.hand).winning` is true.
- Ends the round.
- Sets `round.endReason` to `tsumo`.
- Stores minimal win metadata.

### `CHECK_TSUMO_AVAILABLE`

This action may not be needed if availability is derived during rendering or after draw.

Prefer derived state or game helper functions over storing duplicate state unless tests show a real need.

### CPU Integration

Possible approach:

- After `DRAW_TILE`, if the drawn player is CPU and the hand is winning, dispatch `DECLARE_TSUMO`.
- Keep CPU decision deterministic: CPU always declares tsumo if available.
- Do not add AI strategy yet.

## gameState Additions

Add to `round`:

```js
winningResult: null
```

When tsumo occurs:

```js
winningResult: {
  type: "tsumo",
  playerId: 0,
  handType: "standard",
  reason: null
}
```

Existing field update:

```js
endReason: "tsumo"
```

Optional derived-only helper:

```js
canDeclareTsumo(state, playerId)
```

This helper can live in `actions.js` or a small rules/round helper. It should not touch DOM.

## UI Additions

Minimum UI:

- Show a `ツモ` button only when the human current hand is winning.
- Button dispatches `DECLARE_TSUMO`.
- Show round-end status such as `あなたのツモです` or `CPU 1のツモです`.

Do not add:

- Ron button
- Riichi button
- Chi/pon/kan buttons
- Score display
- Yaku list

## Test Case Ideas

### Game/action tests

- Human can declare tsumo with a standard winning hand.
- Human can declare tsumo with seven pairs.
- Human can declare tsumo with thirteen orphans.
- Human cannot declare tsumo with an incomplete hand.
- Non-current player cannot declare tsumo.
- `DECLARE_TSUMO` ends the round.
- `DECLARE_TSUMO` sets `endReason: "tsumo"`.
- `DECLARE_TSUMO` sets `winningResult`.
- After tsumo, further draw/discard actions do not change the round.
- CPU declares tsumo after drawing a winning hand if CPU integration is in scope.
- Exhaustive draw still works when no one wins.

### UI tests or manual checks

- Human tsumo button appears only when available.
- Human tsumo button is absent/disabled when not available.
- Clicking tsumo ends the round.
- Tsumo end message is readable on smartphone width.
- Existing discard flow still works when tsumo is not available.

## Agent Split

Agent C: tests

- Owns tsumo action tests.
- Adds expected tests before implementation.
- Does not edit production code.

Agent A: game core

- Owns `DECLARE_TSUMO` behavior.
- Owns `canDeclareTsumo` or equivalent helper.
- Connects `isWinningHand` to round/player state.
- Does not edit UI unless explicitly assigned.

Agent B: UI

- Owns the minimal `ツモ` button and status rendering.
- Uses `dispatchAction(state, action)`.
- Does not implement game logic.

Agent D: UX reviewer

- Reviews wording and visibility for tsumo affordance.
- Keeps recommendations minimal and accessible.

Integration owner:

- Merges tests first.
- Merges game core.
- Confirms tests.
- Merges UI only after game behavior is stable.
- Makes only minimal integration fixes.

## MVP-0.1 / MVP-0.2 Protection Checks

Before starting:

- Working tree is clean.
- No unapproved push.
- No unapproved `main` merge.
- Existing tests pass: `32 pass`.
- Exhaustive-draw simulation still succeeds.
- `src/game/` has no DOM access except `storage.js`.

After implementation:

- All previous tests still pass.
- New tsumo tests pass.
- Exhaustive draw still works.
- Non-winning hands still continue normal discard/draw flow.
- win-check API remains stable.
- UI still uses `dispatchAction`.

## Go Conditions

Start MVP-0.3 only if all are true:

- User explicitly approves MVP-0.3 implementation.
- MVP-0.2 is committed and clean.
- Current expected tests pass.
- The scope is limited to tsumo win entry.
- No scoring/yaku/ron/calls/riichi/furiten work is included.
- Agent ownership is clear.

## No-Go Conditions

Do not start MVP-0.3 if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The proposed work includes scoring or yaku.
- The proposed work includes ron.
- The proposed work includes calls, riichi, or furiten.
- The UI design for the tsumo button is unclear and would require broad redesign.

## Suggested Implementation Order

1. Add pending tests for `DECLARE_TSUMO`.
2. Add round state field `winningResult`.
3. Add `canDeclareTsumo` helper.
4. Implement `DECLARE_TSUMO`.
5. Add CPU auto-tsumo only if tests and game flow stay simple.
6. Add minimal human UI button.
7. Add/adjust manual checklist.
8. Update docs and test count.

