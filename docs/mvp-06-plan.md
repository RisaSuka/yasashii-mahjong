# MVP-0.6 Plan: Minimum Yaku Gate

## Goal

MVP-0.6 adds the first yaku gate before a win is accepted.

Current MVP-0.2 to MVP-0.5.5 behavior accepts tsumo or ron whenever the hand is a valid winning shape. Riichi mahjong needs at least one yaku. MVP-0.6 should keep scoring out of scope and answer only this question:

```text
Is this winning hand allowed to win because it has at least one supported yaku?
```

The milestone should preserve the existing win-shape checker. `isWinningHand(tiles)` remains responsible for shape validation. New yaku logic should be separate and should be called from `DECLARE_TSUMO` and `DECLARE_RON` only after the shape is known to be winning.

## Implement In MVP-0.6

- Add a yaku rules module such as `src/game/rules/yaku.js`.
- Add yaku detection for the first small set:
  - Menzen tsumo
  - Tanyao
  - Yakuhai
  - Chiitoitsu
  - Toitoi
  - Kokushi musou
- Add `detectYaku(handTiles, context)`.
- Add `hasYaku(handTiles, context)`.
- Gate `DECLARE_TSUMO` and `DECLARE_RON` so a shape-only hand without supported yaku is rejected.
- Store `yakuResult` in `round.winningResult` when a win succeeds.
- Keep all existing MVP-0.1 to MVP-0.5.5 flows working:
  - exhaustive draw
  - win-shape tests
  - tsumo action
  - ron action
  - reaction phase and skip
  - deterministic scenarios

## Do Not Implement In MVP-0.6

- Point calculation
- Fu calculation
- Han total display beyond optional yaku metadata
- Dora or ura-dora
- Riichi
- Calls / open hand state
- Furiten
- Pinfu
- Iipeiko
- Honitsu / chinitsu
- Sanshoku, ittsu, chanta, honroto, shosangen, or other advanced yaku
- Yakuman stacking
- Payment movement
- Honba / riichi stick settlement
- CPU strategy changes
- Broad UI redesign

## Scope Decisions

### Yaku Set

Use a deliberately small first set.

`menzen-tsumo`:

- Applies only to `winType: "tsumo"`.
- Applies only when `context.isClosed !== false`.
- Since MVP has no calls yet, default `isClosed` should be `true`.
- This makes most closed tsumo wins valid without needing full yaku coverage.

`tanyao`:

- Applies when all tiles are simples: suits `m/p/s` rank 2 to 8 only.
- Rejects all terminals and honors.
- Works for standard and chiitoitsu shapes if the tiles satisfy the condition.

`yakuhai`:

- Applies when the hand contains a triplet of any honor tile rank 5, 6, or 7.
- For MVP-0.6, dragons are enough and avoid needing seat/round wind context.
- Seat wind and round wind yakuhai can be added later when wind context is reliable.

`chiitoitsu`:

- Applies when `isWinningHand` identifies or yaku logic confirms seven pairs.
- Should not require decomposition into four sets and one pair.

`toitoi`:

- Applies when the hand can be represented as four triplets and one pair.
- Kans are out of scope, so treat only triplets in closed 14-tile hands.

`kokushi-musou`:

- Applies when the hand is kokushi.
- No scoring or yakuman handling in MVP-0.6; it is simply a yaku entry.

### Shape Detection Responsibility

Keep these responsibilities separate:

- `win-check.js`: validates tile data and detects whether the 14 tiles form a winning shape.
- `yaku.js`: detects supported yaku for an already winning hand and context.
- `actions.js`: decides whether a win action succeeds by combining shape and yaku checks.

Do not move shape logic into yaku detection.

### Shape Metadata

If current `isWinningHand` already returns a useful `handType`, reuse it. If it does not, MVP-0.6 may add minimal metadata to the result only if tests need it.

Preferred shape result:

```js
{
  valid: true,
  winning: true,
  handType: "standard" | "chiitoitsu" | "kokushi"
}
```

Yaku detection must still be able to work from tiles alone for simple yaku such as tanyao and yakuhai.

## API Proposal

### `detectYaku(handTiles, context)`

```js
detectYaku(handTiles, {
  winType: "tsumo" | "ron",
  isClosed: true,
  handType: "standard" | "chiitoitsu" | "kokushi",
  winningTile: tile | null,
  winnerId: 0,
  fromPlayerId: 1,
  seatWind: null,
  roundWind: null
})
```

Returns:

```js
{
  hasYaku: true,
  yaku: [
    { id: "menzen-tsumo", name: "Menzen Tsumo" },
    { id: "tanyao", name: "Tanyao" }
  ],
  reasons: []
}
```

For no yaku:

```js
{
  hasYaku: false,
  yaku: [],
  reasons: ["no-supported-yaku"]
}
```

For invalid input, prefer a safe false result:

```js
{
  hasYaku: false,
  yaku: [],
  reasons: ["invalid-hand"]
}
```

### `hasYaku(handTiles, context)`

```js
hasYaku(handTiles, context) === true
```

This should be a thin wrapper around `detectYaku`.

### Optional Helper APIs

Only add these if they keep tests clear:

```js
isTanyao(handTiles)
isYakuhai(handTiles, context)
isChiitoitsuYaku(handTiles)
isToitoi(handTiles)
isKokushiYaku(handTiles)
```

Keep them pure and DOM-free.

## gameState / winningResult Proposal

Extend successful win metadata:

```js
winningResult: {
  winnerId: 0,
  winType: "tsumo",
  handType: "standard",
  handTiles: [],
  winningTile: null,
  fromPlayerId: null,
  yakuResult: {
    hasYaku: true,
    yaku: [
      { id: "menzen-tsumo", name: "Menzen Tsumo" }
    ],
    reasons: []
  }
}
```

For rejected no-yaku wins, do not end the round. If the app already has no error messaging mechanism, MVP-0.6 can simply return the unchanged state. A later milestone can add user-facing rejection messages.

Optional rejection metadata:

```js
round.lastActionResult = {
  ok: false,
  reason: "no-yaku"
}
```

Only add this if tests or UI need it. Avoid broad state changes.

## Action Integration

### `DECLARE_TSUMO`

Recommended order:

1. Confirm round is not ended.
2. Confirm current player and phase rules.
3. Confirm `isWinningHand(player.hand).winning`.
4. Run `detectYaku(player.hand, { winType: "tsumo", isClosed: true, handType })`.
5. Reject if `hasYaku === false`.
6. End the round and store `winningResult.yakuResult`.

### `DECLARE_RON`

Recommended order:

1. Confirm round is not ended.
2. Confirm ron timing and `lastDiscard`.
3. Build candidate tiles from `player.hand + lastDiscard.tile`.
4. Confirm `isWinningHand(candidateTiles).winning`.
5. Run `detectYaku(candidateTiles, { winType: "ron", isClosed: true, handType, winningTile, fromPlayerId })`.
6. Reject if `hasYaku === false`.
7. End the round and store `winningResult.yakuResult`.

## Expected File Changes

Game core:

- `src/game/rules/yaku.js`
- `src/game/actions.js`
- `src/game/rules/win-check.js` only if minimal shape metadata is required
- `src/game/scenarios.js` only if existing fixtures need no-yaku/yaku-specific deterministic states

Tests:

- `tests/yaku.test.js`
- `tests/actions.test.js` or `tests/tsumo.test.js`
- `tests/ron.test.js`
- `tests/test-runner.html`

Docs:

- `README.md`
- `docs/mvp-06-plan.md`
- `docs/manual-test-checklist.md`
- optional `docs/mvp-06-verification.md`

UI:

- No required UI file changes for MVP-0.6.
- If a tiny message is needed later, keep it limited to existing status text.

## Test Case Ideas

Agent C should add pending tests before implementation.

### Yaku Detection Tests

- Closed tsumo standard hand returns `menzen-tsumo`.
- Tanyao hand returns `tanyao`.
- Hand with dragon triplet returns `yakuhai`.
- Chiitoitsu hand returns `chiitoitsu`.
- Toitoi hand returns `toitoi`.
- Kokushi hand returns `kokushi-musou`.
- Terminal/honor-heavy standard hand without supported yaku returns no yaku.
- Invalid tile data returns no yaku with `invalid-hand`.

### Tsumo Gate Tests

- Tsumo with a supported yaku succeeds.
- Closed tsumo with any valid winning shape succeeds via `menzen-tsumo`.
- Tsumo without any supported yaku is rejected if `isClosed: false` is introduced for test context.
- Successful tsumo stores `winningResult.yakuResult`.
- Rejected tsumo does not change `phase` to `ended`.

### Ron Gate Tests

- Ron with tanyao succeeds.
- Ron with yakuhai succeeds.
- Ron with chiitoitsu succeeds.
- Ron with kokushi succeeds.
- Shape-only ron with no supported yaku is rejected.
- Successful ron stores `winningResult.yakuResult`.
- Rejected ron keeps reaction flow safe and does not end the round.

### Regression Tests

- Existing MVP-0.1 exhaustive draw still works.
- Existing MVP-0.2 `isWinningHand` tests still pass.
- Existing MVP-0.3 tsumo tests are updated only where yaku gating changes expectations.
- Existing MVP-0.5 ron tests are updated only where yaku gating changes expectations.
- MVP-0.5.5 reaction skip still works.
- `src/game/` remains DOM-free.

## UI Policy

MVP-0.6 should not add a yaku explanation UI.

Allowed, only if needed:

- Ended win message can remain as-is.
- A tiny yaku list may be shown later after win, but it is not required for MVP-0.6.
- No score, han, fu, point movement, dora, or payment display.

Recommended MVP-0.6 UI behavior:

- If a win is rejected for no yaku, keep the round alive.
- For tsumo, the button should ideally not show when no yaku exists, but this can be deferred if it requires too much UI work.
- For ron, the reaction button should ideally require both winning shape and supported yaku, but this can be implemented in game core first and UI tightened later.

## Agent Split

Agent C: tests

- Adds pending `tests/yaku.test.js`.
- Adds or updates action tests for yaku-gated tsumo and ron.
- Registers tests in `tests/test-runner.html`.
- Does not change production code.

Agent A: game core

- Owns `src/game/rules/yaku.js`.
- Owns action integration in `src/game/actions.js`.
- Keeps yaku detection pure and DOM-free.
- Avoids scoring, fu, dora, riichi, calls, and furiten.

Agent B: UI

- No primary UI work expected for MVP-0.6.
- If asked later, only hides or disables win buttons based on game helpers.
- Must not implement rule checks directly in UI.

Agent D: design / UX reviewer

- Reviews no-yaku rejection wording if UI messaging is added later.
- Keeps recommendations clear for older users and smartphone use.

Integration owner:

- Integrates tests first.
- Integrates yaku rules second.
- Integrates action gating third.
- Runs all automated tests.
- Confirms normal flow, tsumo, ron, reaction skip, and exhaustive draw.
- Updates README and verification docs.

## Go Conditions

Start MVP-0.6 implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 79 pass / 0 pending / 0 fail.
- MVP-0.6 scope is limited to yaku detection and win gating.
- No scoring, fu, dora, riichi, calls, or furiten are included.
- Test cases are added or agreed before production code.
- Existing deterministic scenarios can cover at least one yaku and one no-yaku case, or new scenario fixtures are planned.

## No-Go Conditions

Do not start implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The implementation requires point calculation.
- The implementation requires open-hand call support.
- The implementation requires furiten or riichi.
- The UI work becomes a broad redesign.
- Yaku logic starts mutating game state directly.

## Suggested Implementation Order

1. Add pending `tests/yaku.test.js`.
2. Add pending tsumo/ron yaku-gate action tests.
3. Add `src/game/rules/yaku.js`.
4. Implement tile counting helpers in `yaku.js`.
5. Implement `detectYaku`.
6. Implement `hasYaku`.
7. Wire `DECLARE_TSUMO` to reject no-yaku wins.
8. Wire `DECLARE_RON` to reject no-yaku wins.
9. Store `winningResult.yakuResult` on successful wins.
10. Update or add deterministic scenarios only if necessary.
11. Run all tests.
12. Update README and manual verification docs.

## MVP-0.7 Candidates

- Pinfu
- Iipeiko
- Seat wind and round wind yakuhai
- Basic no-yaku UI messaging
- Furiten design
- Riichi design
- Dora design
- Minimal han counting without points
