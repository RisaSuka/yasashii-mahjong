# MVP-0.6.5 Plan: Connect Yaku Gate To Tsumo And Ron

## Goal

MVP-0.6.5 connects the MVP-0.6 yaku detector to the existing win actions.

Current state:

- `isWinningHand(tiles)` decides whether the hand is a legal winning shape.
- `detectYaku(tiles, context)` and `hasYaku(tiles, context)` can detect the first supported yaku set.
- `DECLARE_TSUMO` and `DECLARE_RON` still accept any winning shape, even if it has no supported yaku.

MVP-0.6.5 should make a win succeed only when both are true:

```text
winning shape === true
supported yaku exists === true
```

It should not add scoring, fu, dora, riichi, calls, furiten, or broad UI changes.

## Implement In MVP-0.6.5

- Connect `DECLARE_TSUMO` to `detectYaku`.
- Connect `DECLARE_RON` to `detectYaku`.
- Reject tsumo/ron when the candidate hand has no supported yaku.
- Store detected yaku on successful wins.
- Keep existing exhaustive draw, reaction skip, and deterministic scenario behavior stable.
- Adjust existing test hands or scenarios so tests that expect a successful win use yaku-valid hands.
- Add explicit rejection tests for no-yaku tsumo and no-yaku ron.

## Do Not Implement In MVP-0.6.5

- Point calculation
- Fu calculation
- Dora / ura-dora
- Riichi
- Furiten
- Chi, pon, kan
- Pinfu
- Iipeiko
- Honitsu / chinitsu
- Seat wind or round wind yakuhai
- Payment movement
- Honba / riichi stick settlement
- Broad UI redesign

## Expected File Changes

Game core:

- `src/game/actions.js`

Tests:

- `tests/tsumo.test.js`
- `tests/ron.test.js`
- `tests/reaction.test.js`
- `tests/scenario.test.js`
- optional `tests/yaku.test.js` only if a yaku return-shape mismatch is discovered

Scenarios:

- `src/game/scenarios.js` only if deterministic ron/tsumo fixtures need to become yaku-valid.

Docs:

- `docs/mvp-065-plan.md`
- optional `README.md`
- optional `docs/manual-test-checklist.md`

UI:

- No required UI changes.
- Minimal status wording may be planned later, but not required for this milestone.

## Yaku Context Design

Use a small context object built inside action handlers.

### Tsumo Context

```js
{
  winType: "tsumo",
  menzen: true,
  isClosed: true,
  handType: result.type,
  winnerId: playerId,
  winningTile: state.round.lastDraw?.playerId === playerId
    ? state.round.lastDraw.tile
    : null
}
```

Notes:

- MVP has no calls, so all hands are closed by default.
- `menzen: true` and `isClosed: true` should both be supplied for compatibility with the current yaku helper.
- Menzen tsumo means most existing tsumo tests remain yaku-valid.

### Ron Context

```js
{
  winType: "ron",
  menzen: true,
  isClosed: true,
  handType: result.type,
  winnerId: playerId,
  fromPlayerId: state.round.lastDiscard.playerId,
  winningTile: state.round.lastDiscard.tile
}
```

Notes:

- Menzen alone is not a yaku for ron.
- A closed ron hand still needs another supported yaku such as tanyao, yakuhai, chiitoitsu, toitoi, or kokushi.

## `yakuResult` Structure

`detectYaku` currently returns an array:

```js
[
  { id: "tanyao", name: "断么九", han: 1 }
]
```

Store that array directly in `winningResult.yakuResult` for MVP-0.6.5:

```js
winningResult: {
  winnerId: 0,
  winType: "ron",
  fromPlayerId: 1,
  winningTile,
  handType: "standard",
  handTiles,
  yakuResult: [
    { id: "tanyao", name: "断么九", han: 1 }
  ]
}
```

Why store the array directly:

- It matches the implemented MVP-0.6 API.
- It is simple for tests.
- A later scoring milestone can wrap it into a richer object if needed.

## Rejection Behavior

When a shape is valid but no supported yaku is detected:

- Return the original state unchanged.
- Do not set `phase: "ended"`.
- Do not set `endReason`.
- Do not set `winningResult`.
- Keep `lastDiscard` and reaction phase intact for ron.

Optional future field:

```js
round.lastActionResult = {
  ok: false,
  reason: "no-yaku"
}
```

Do not add this in MVP-0.6.5 unless tests require it.

## Existing Test Impact

### Tsumo Tests

Current `standardWinningHand()`:

```text
m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1
```

Impact:

- It is a valid winning shape.
- It contains terminals/honors, so it is not tanyao.
- It has no dragon triplet.
- It is still valid for tsumo because MVP-0.6 supports `menzen_tsumo`.
- Existing tsumo success tests should keep passing if action context supplies `winType: "tsumo"` and closed/menzen.

### Tsumo Scenarios

`human-tsumo-ready` and `cpu-tsumo-ready` use the same hand as above.

Impact:

- Both remain valid if menzen tsumo is connected.
- Scenario tests should not need fixture changes.

### Ron Tests

Current `ron-ready-basic` candidate hand:

```text
m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 + z1
```

Impact:

- It is a valid winning shape.
- It is ron, so `menzen_tsumo` does not apply.
- It is not tanyao because it has `m1` and `z1`.
- It has no dragon triplet.
- It is not chiitoitsu, toitoi, or kokushi.
- Therefore it becomes a no-yaku ron and must be rejected after MVP-0.6.5.

Required adjustment:

- Change success-path ron fixtures to a yaku-valid hand, preferably tanyao:

```text
human 13 tiles: m2 m3 m4 m4 m5 m6 p2 p3 p4 p6 p7 p8 s5
last discard: s5
```

- Keep one explicit no-yaku ron fixture using the current `ron-ready-basic` shape, or rename/add a scenario such as `ron-ready-no-yaku`.

### Reaction Tests

Reaction tests currently depend on `canRonLatestDiscard` and `DECLARE_RON` succeeding for `ron-ready-basic`.

Impact:

- If `canRonLatestDiscard` remains shape-only, reaction can still appear for a no-yaku ron candidate, but the ron action would reject. That would be confusing.
- MVP-0.6.5 should decide whether reaction availability also requires yaku.

Recommendation:

- Update `canRonLatestDiscard` / `canDeclareRon` to require both winning shape and yaku.
- Update reaction success tests to use a yaku-valid ron scenario.
- Add a no-yaku reaction test confirming no reaction is entered.

## Add / Modify Test Plan

Agent C should add or update tests before production changes.

### Tsumo Action Tests

- Successful tsumo stores `winningResult.yakuResult`.
- Successful tsumo includes `menzen_tsumo`.
- Tsumo with a winning shape but no supported yaku is rejected when `menzen` is false in test setup or helper context.
- Rejected no-yaku tsumo does not end the round.
- Existing exhaustive draw behavior still works.

### Ron Action Tests

- Successful yaku-valid ron stores `winningResult.yakuResult`.
- Successful tanyao ron includes `tanyao`.
- No-yaku ron is rejected.
- Rejected no-yaku ron keeps `phase: "reaction"`.
- Rejected no-yaku ron does not set `winningResult`.
- Missing discard, own discard, ended round, and incomplete hand rejections still work.

### Reaction Tests

- Yaku-valid latest discard enters reaction.
- No-yaku latest discard does not enter reaction.
- Reaction skip still advances to the next player.
- Reaction `DECLARE_RON` still ends the round for yaku-valid ron.

### Scenario Tests

- A yaku-valid ron scenario can be created.
- Existing no-yaku scenario can be retained for rejection tests.
- Tile id uniqueness remains intact.
- Normal `START_ROUND` behavior remains unchanged.

## Agent Split

Agent C: tests

- Updates pending or failing tests around tsumo/ron yaku gating.
- Adds no-yaku rejection tests.
- Adds yaku-valid ron fixture expectations.
- Does not change production logic.

Agent A: game core

- Imports `detectYaku` or `hasYaku` in `src/game/actions.js`.
- Builds yaku context for `DECLARE_TSUMO`.
- Builds yaku context for `DECLARE_RON`.
- Stores `winningResult.yakuResult`.
- Keeps `src/game/` DOM-free.

Agent B: UI

- No required work for MVP-0.6.5.
- If later requested, can hide tsumo/ron buttons when yaku is missing.
- Must not duplicate yaku logic in UI.

Agent D: UX reviewer

- May later review wording for no-yaku rejection.
- No implementation role in this milestone.

Integration owner:

- Integrates tests first.
- Integrates action yaku gate second.
- Runs all automated tests.
- Checks normal play, tsumo, ron, reaction skip, and exhaustive draw.
- Updates docs if behavior changes.

## Go Conditions

Start implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 89 pass / 0 pending / 0 fail.
- Test updates are prepared first.
- A yaku-valid ron fixture or scenario is chosen.
- No scoring, fu, dora, riichi, calls, or furiten work is included.
- `actions.js` remains the only production connection point unless scenario fixtures need tiny changes.

## No-Go Conditions

Do not start implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The work expands into scoring or han totals.
- The work requires open-hand state.
- The work requires UI redesign.
- The design starts treating all closed ron hands as valid without another yaku.

## Suggested Implementation Order

1. Add or update tests for yaku-gated tsumo.
2. Add or update tests for yaku-gated ron.
3. Add a yaku-valid ron scenario or adjust test-local ron hand fixtures.
4. Add explicit no-yaku ron rejection coverage.
5. Import `detectYaku` in `src/game/actions.js`.
6. In `declareTsumo`, run yaku detection after `isWinningHand`.
7. Reject tsumo if no yaku is returned.
8. Store `winningResult.yakuResult` for successful tsumo.
9. In `canRonLatestDiscard` / `canDeclareRon`, require yaku as well as winning shape.
10. In `declareRon`, run yaku detection after `isWinningHand`.
11. Reject ron if no yaku is returned.
12. Store `winningResult.yakuResult` for successful ron.
13. Run all tests.
14. Update README/manual checklist only if user-facing behavior is documented.

## MVP-0.7 Candidates

- No-yaku user-facing message
- Hide/disable tsumo button when yaku is missing
- Hide/disable ron reaction when yaku is missing, if not already fully covered
- Seat wind and round wind yakuhai
- Pinfu
- Riichi design
- Furiten design
- Dora design
