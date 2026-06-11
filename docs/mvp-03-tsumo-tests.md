# MVP-0.3 Tsumo Test Design

This is a planning document for MVP-0.3 tests. Do not add these tests or implementation until MVP-0.3 implementation is explicitly approved.

## Goal

Define acceptance tests for connecting `isWinningHand(tiles)` to round flow through a tsumo-only win entry.

MVP-0.3 tests should prove:

- A current player can declare tsumo with a winning 14-tile hand.
- A current player cannot declare tsumo with an incomplete hand.
- CPU can auto-declare tsumo after drawing a winning hand if CPU integration is included.
- A round that ended by tsumo no longer accepts normal draw/discard progression.
- Existing exhaustive-draw behavior still works.

## Assumed API

Planned action:

```js
{
  type: "DECLARE_TSUMO",
  playerId: 0
}
```

Possible helper:

```js
canDeclareTsumo(state, playerId)
```

Expected round end state:

```js
{
  phase: "ended",
  endReason: "tsumo",
  winningResult: {
    type: "tsumo",
    playerId: 0,
    handType: "standard",
    reason: null
  }
}
```

## Test Fixture Hands

Standard hand:

```text
m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1
```

Seven pairs:

```text
m1 m1 m9 m9 p2 p2 p8 p8 s3 s3 s7 s7 z5 z5
```

Thirteen orphans:

```text
m1 m9 p1 p9 s1 s9 z1 z1 z2 z3 z4 z5 z6 z7
```

Incomplete hand:

```text
m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1 z3
```

## Game / Action Test Cases

### Human standard tsumo succeeds

Setup:

- Start a round.
- Replace current human hand with the standard winning hand.
- Ensure current player is the human.
- Ensure round phase allows the current player to act.

Action:

```js
dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 })
```

Expected:

- `round.phase === "ended"`
- `round.endReason === "tsumo"`
- `round.winningResult.type === "tsumo"`
- `round.winningResult.playerId === 0`
- `round.winningResult.handType === "standard"`

### Human seven-pairs tsumo succeeds

Same as above, but use seven-pairs hand.

Expected:

- `round.winningResult.handType === "seven-pairs"`

### Human thirteen-orphans tsumo succeeds

Same as above, but use thirteen-orphans hand.

Expected:

- `round.winningResult.handType === "thirteen-orphans"`

### Human incomplete hand cannot tsumo

Setup:

- Current human hand is incomplete.

Action:

```js
dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 })
```

Expected:

- Round does not end by tsumo.
- `round.endReason !== "tsumo"`
- `round.winningResult` remains `null`.
- State is unchanged or safely rejected.

### Non-current player cannot declare tsumo

Setup:

- Current player is player 0.
- Player 1 has a winning hand.

Action:

```js
dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 1 })
```

Expected:

- Round does not end.
- No `winningResult` is set.

### Cannot declare tsumo after round ended

Setup:

- Round is already ended by exhaustive draw or prior tsumo.

Action:

```js
dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 })
```

Expected:

- Ended state remains unchanged.
- Existing `endReason` is preserved.

### Further draw/discard ignored after tsumo

Setup:

- Human declares tsumo successfully.

Actions:

```js
dispatchAction(state, { type: "DISCARD_TILE", playerId: 0, tileId })
dispatchAction(state, { type: "DRAW_TILE", playerId: 1 })
```

Expected:

- Round remains ended.
- `winningResult` remains unchanged.
- No discard or draw mutates the ended round.

### CPU auto-tsumo after draw succeeds

Setup:

- Current player is CPU.
- CPU has 13 tiles.
- Next draw gives CPU a winning 14-tile hand.

Action:

```js
dispatchAction(state, { type: "DRAW_TILE", playerId: cpuId })
```

Expected if CPU auto-tsumo is in MVP-0.3 scope:

- Round ends by tsumo.
- `winningResult.playerId === cpuId`
- `winningResult.handType` matches the winning shape.

If CPU auto-tsumo is deferred:

- This test should be pending or omitted until the scope includes it.

### Exhaustive draw still works

Setup:

- No player has a winning hand.
- Live wall reaches 0.

Expected:

- `round.phase === "ended"`
- `round.endReason === "exhaustive-draw"`
- `winningResult === null`

## UI / Manual Test Cases

These should be added only if MVP-0.3 includes UI.

### Human tsumo button appears only when available

Setup:

- Human current hand is winning.

Expected:

- `ツモ` button is visible and enabled.

### Human tsumo button absent when unavailable

Setup:

- Human current hand is incomplete.

Expected:

- `ツモ` button is absent or disabled.

### Clicking tsumo ends the round

Setup:

- Human has winning hand.
- `ツモ` button is visible.

Action:

- Click `ツモ`.

Expected:

- Round ends.
- Status text indicates human tsumo.
- No discard is required.

### CPU tsumo status is readable

Setup:

- CPU auto-tsumo occurs.

Expected:

- Status text indicates which CPU won by tsumo.
- Message is readable on smartphone width.

## MVP-0.1 / MVP-0.2 Regression Checks

Always run these after MVP-0.3 work:

- Existing MVP-0.1 table progression tests pass.
- Existing MVP-0.2 win-check tests pass.
- Exhaustive draw simulation still succeeds.
- Non-winning hands still use the normal discard/draw flow.
- `src/game/` still avoids DOM access except `storage.js`.
- UI still uses `dispatchAction`.
- No scoring/yaku/ron/calls/riichi/furiten code was added.

## Suggested Test File Split

Option A:

- Add tests to `tests/actions.test.js` if the count stays small.

Option B:

- Create `tests/tsumo.test.js` if tsumo setup helpers become bulky.
- Register it in `tests/test-runner.html`.

Prefer Option B if CPU auto-tsumo and UI-adjacent tests are included.

