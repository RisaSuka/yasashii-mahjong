# MVP-0.2 Readiness Checklist

Use this document immediately before starting MVP-0.2 implementation.

## MVP-0.2 Goal

Add the first winning-shape checker.

The checker answers only:

```text
Can these 14 tiles form a complete winning shape?
```

It does not decide whether the hand has yaku, how many points it is worth, or whether the round should end.

## Implement In MVP-0.2

- Standard hand shape: four melds and one pair
- Seven pairs
- Thirteen orphans
- Invalid hand checks
- 14-tile input validation
- Invalid suit/rank validation
- More-than-four-copies validation
- Pure game-rule API
- Browser-runnable tests for the above

## Do Not Implement In MVP-0.2

- Scoring
- Yaku detection
- Fu calculation
- Han calculation
- Tsumo/ron payment
- Chi, pon, kan
- Riichi
- Furiten
- Dora effects
- Ura-dora
- UI buttons
- Round settlement
- CPU strategy changes
- Tonpuu/hanchan progression

## Files Expected To Change

Agent C test branch:

- `tests/win-check.test.js`
- `tests/test-runner.html`
- `tests/test.js` only if a tiny registration change is needed

Agent A implementation branch:

- `src/game/rules/win-check.js`
- `src/game/rules/.gitkeep` only if the directory is created before implementation

Integration branch:

- Minimal fixes only
- Documentation test count updates

## Files That Should Not Change

- `src/main.js`
- `src/ui/**`
- `styles/**`
- `index.html`
- `src/game/actions.js`
- `src/game/round.js`
- `src/game/player.js`
- `src/game/wall.js`
- `src/game/tiles.js`, unless a tiny exported helper is explicitly approved

## Planned API

Primary API:

```js
isWinningHand(tiles)
```

Recommended result:

```js
{
  winning: true,
  type: "standard",
  reason: null
}
```

Failure example:

```js
{
  winning: false,
  type: null,
  reason: "not-14-tiles"
}
```

Accepted `type` values:

- `standard`
- `seven-pairs`
- `thirteen-orphans`
- `null`

Accepted `reason` values:

- `null`
- `not-14-tiles`
- `too-many-copies`
- `invalid-tile`
- `no-winning-shape`

Optional helper exports for focused tests:

- `createTileCounts(tiles)`
- `validateWinningHandInput(tiles)`
- `isStandardWinningHand(tiles)`
- `isSevenPairs(tiles)`
- `isThirteenOrphans(tiles)`

## Planned Tests

Test source:

- `docs/mvp-02-win-check-tests.md`

Required groups:

- Standard hand success cases
- Seven pairs success cases
- Thirteen orphans success cases
- Incomplete 14-tile hands
- Non-14-tile inputs
- Empty input
- Invalid suit/rank
- Five copies of one suit/rank
- Hands with honors
- Hands with terminals and simples
- Hands where pair choice matters
- Hands with multiple possible reductions

## Existing MVP-0.1 Protection Checks

Before MVP-0.2 implementation:

- Run current MVP-0.1 tests.
- Confirm expected result is `20 pass`.
- Confirm exhaustive-draw simulation still succeeds.
- Confirm local server still returns HTTP 200 for `/`.
- Confirm `src/game/` still avoids DOM access except `src/game/storage.js`.

After MVP-0.2 implementation:

- Run all tests, including new win-check tests.
- Confirm MVP-0.1 table flow did not change.
- Confirm no UI files changed.
- Confirm no scoring/yaku/call/riichi/furiten code was added.

## Agent Split

Agent C: test runner

- Owns new win-check tests.
- Writes expected API tests first.
- Does not edit production code.

Agent A: game core

- Owns `src/game/rules/win-check.js`.
- Implements only the pure checker.
- Does not edit UI or existing round flow.

Integration owner:

- Merges tests before implementation.
- Confirms tests fail or show pending before implementation.
- Merges implementation.
- Runs full suite.
- Makes only minimal integration fixes.

Agent B:

- No MVP-0.2 work unless a later scope explicitly allows UI.

Agent D:

- May review wording or future UX notes only.

## Go Conditions

Start MVP-0.2 only when all are true:

- User explicitly approves MVP-0.2 implementation.
- Current branch is confirmed.
- Working tree is clean.
- No unapproved push has happened.
- No unapproved `main` merge has happened.
- MVP-0.1 tests pass.
- `docs/mvp-02-plan.md` is reviewed.
- `docs/mvp-02-win-check-tests.md` is reviewed.
- Agent A and Agent C write scopes are separated.

## No-Go Conditions

Do not start MVP-0.2 if any are true:

- The user only asked for planning.
- Working tree is dirty.
- Test suite is failing.
- Scope includes UI buttons.
- Scope includes scoring, yaku, calls, riichi, or furiten.
- The implementation branch would need broad refactoring.
- The planned API is still disputed.

