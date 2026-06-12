# MVP-0.3 Plan: Tsumo Win Entry

## Goal

MVP-0.3 connects the MVP-0.2 winning-shape checker to the round flow.

When a player has a winning 14-tile hand, the round can end as a tsumo win.

## Implemented In MVP-0.3

- `DECLARE_TSUMO` action
- `canDeclareTsumo(state, playerId)` helper
- Human tsumo declaration
- CPU tsumo declaration
- CPU auto-tsumo after draw when the CPU hand is a winning shape
- Round ending with `phase: "ended"`
- Round ending with `endReason: "win"`
- Minimal win metadata in `round.winningResult`
- Minimal UI button for human tsumo
- Minimal UI status for human/CPU tsumo
- Automated tests for success, rejection, and ended-round protection
- Existing exhaustive-draw behavior preserved
- Existing MVP-0.2 win-check behavior preserved

## Not Implemented In MVP-0.3

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

## Action

```js
{
  type: "DECLARE_TSUMO",
  playerId: 0
}
```

Behavior:

- Valid only when `round.phase === "discard"`.
- Valid only for the current player.
- Valid only when `isWinningHand(player.hand).winning` is true.
- Rejected when the round already ended.
- Rejected for incomplete hands.
- Rejected for non-current players.
- Ends the round on success.

## gameState Additions

`round` now starts with:

```js
winningResult: null
```

When tsumo succeeds:

```js
winningResult: {
  winnerId: 0,
  winType: "tsumo",
  handType: "standard",
  handTiles: []
}
```

The round also sets:

```js
phase: "ended",
endReason: "win"
```

## Files Changed

Game core:

- `src/game/actions.js`
- `src/game/round.js`

UI:

- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`
- `styles/board.css`

Tests:

- `tests/tsumo.test.js`
- `tests/test-runner.html`

Docs:

- `README.md`
- `docs/mvp-03-plan.md`
- `docs/manual-test-checklist.md`
- `docs/mvp-03-verification.md`

## Test Coverage

Automated result after implementation:

```text
44 pass / 0 pending / 0 fail
```

Covered checks:

- Human winning hand can declare tsumo.
- Tsumo sets `phase: "ended"`.
- Tsumo sets `endReason: "win"`.
- Tsumo stores `winningResult.winnerId`.
- Tsumo stores `winningResult.winType: "tsumo"`.
- CPU current player can declare tsumo.
- Incomplete hands are rejected.
- Non-current players are rejected.
- Ended rounds reject additional tsumo declarations.
- `DRAW_TILE` does not progress after tsumo.
- `DISCARD_TILE` does not progress after tsumo.
- `CPU_DISCARD` does not progress after tsumo.
- Existing exhaustive-draw behavior still works.

## Manual Check Focus

- Start a new round.
- Confirm normal discard/CPU flow still progresses.
- Confirm the `ツモ` button appears only when the human current hand is a winning shape.
- Confirm clicking `ツモ` ends the round.
- Confirm the status shows `あなたのツモ和了です`.
- Confirm CPU tsumo status can show `CPU nのツモ和了です`.
- Confirm no score/yaku/ron/call UI was added.

## MVP-0.1 / MVP-0.2 Protection Checks

- Existing MVP-0.1 table progression tests pass.
- Existing MVP-0.2 win-check tests pass.
- Exhaustive draw still works.
- Non-winning hands still use the normal discard/draw flow.
- `src/game/` still avoids DOM access except `storage.js`.
- UI still uses `dispatchAction`.
- No scoring/yaku/ron/calls/riichi/furiten code was added.

## Next MVP-0.4 Candidates

- Ron design and acceptance tests only
- Yaku-gated win validation design
- Minimal score metadata design
- Better manual test hooks for deterministic winning hands
- CPU tsumo test fixture in UI/manual verification

