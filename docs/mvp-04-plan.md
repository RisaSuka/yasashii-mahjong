# MVP-0.4 Plan: Deterministic Scenario Setup

## Goal

MVP-0.4 adds a deterministic scenario setup path for development and tests.

The purpose is to make future tsumo, ron, and yaku work easier by avoiding reliance on random shuffle results. MVP-0.4 should let tests create known hands, wall order, discards, current turn, and phase without changing normal gameplay.

This milestone is infrastructure only. It does not add ron, yaku, scoring, or new player-facing rule behavior.

## Implement In MVP-0.4

- Test/development-only scenario setup helpers.
- A small set of named deterministic scenarios.
- A safe API for creating a `gameState` from a scenario definition.
- Fixtures for:
  - Human tsumo-ready state
  - CPU tsumo-ready state
  - Future ron-ready state
  - Exhaustive-draw-near state
  - Normal non-winning state
- Validation that scenario tile counts never exceed four copies of a tile type.
- Validation that a scenario still has four players.
- Validation that wall, dead wall, hands, and discards do not duplicate tile ids.
- Tests proving scenario setup does not break normal `START_ROUND`.
- Documentation for how future agents should use scenarios.

## Do Not Implement In MVP-0.4

- Ron action
- Ron UI
- Yaku detection
- Point calculation
- Fu/han calculation
- Chi, pon, kan
- Riichi
- Furiten
- Dora effects
- Ura-dora
- Full CPU strategy
- A visible production debug menu
- Any behavior that changes random normal play

## Design Decision

Prefer test-only and development-only helpers first.

Do not expose scenario setup in the normal UI during MVP-0.4. A visible UI selector can be considered later if manual QA becomes painful, but it should be guarded behind a development flag or a separate local-only entry path.

This keeps GitHub Pages production behavior simple:

- Normal users click `新規局開始`.
- Normal users get shuffled play.
- Tests and future agents can create deterministic states directly.

## Proposed File Changes

Game/test support:

- `src/game/scenarios.js`
- `src/game/scenario-builder.js`
- `tests/scenario.test.js`
- `tests/test-runner.html`

Docs:

- `docs/mvp-04-plan.md`
- `docs/manual-test-checklist.md` only if manual scenario checks are later added
- `README.md` only if the test count or workflow changes

Avoid changes to:

- `src/ui/**`
- `styles/**`
- `index.html`

unless the user later explicitly approves a development-only UI hook.

## Proposed Data Structures

Scenario definition:

```js
{
  id: "human-tsumo-standard",
  description: "Human current player has a standard winning 14-tile hand.",
  round: {
    phase: "discard",
    currentPlayerIndex: 0,
    dealerIndex: 0,
    wall: ["m1", "m2"],
    deadWall: ["z1", "z2", "..."],
    doraIndicators: ["z1"],
    lastDraw: {
      playerId: 0,
      tile: "z1"
    },
    lastDiscard: null
  },
  players: [
    {
      id: 0,
      hand: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1",
      discards: ""
    },
    {
      id: 1,
      hand: "m1 m1 m2 m2 m3 m3 p1 p1 p2 p2 s1 s1 s2",
      discards: ""
    }
  ]
}
```

Tile pattern strings are only a fixture format. The actual game state should still use tile objects:

```js
{
  id: "m1-0",
  suit: "m",
  rank: 1,
  copy: 0,
  red: false
}
```

## Proposed API

```js
createScenarioState(scenarioId, baseState?)
```

Creates a complete `gameState` from a named scenario.

```js
buildScenarioState(scenarioDefinition, baseState?)
```

Creates a complete `gameState` from an explicit scenario object.

```js
getScenarioDefinition(scenarioId)
```

Returns a cloned scenario definition by id.

```js
listScenarioDefinitions()
```

Returns metadata for available scenarios.

```js
validateScenarioDefinition(scenarioDefinition)
```

Returns:

```js
{
  valid: true,
  reason: null
}
```

or:

```js
{
  valid: false,
  reason: "duplicate-tile-id"
}
```

Possible invalid reasons:

- `unknown-scenario`
- `missing-player`
- `invalid-tile-pattern`
- `too-many-copies`
- `duplicate-tile-id`
- `invalid-wall-size`
- `invalid-dead-wall-size`
- `invalid-current-player`
- `invalid-phase`

## Named Scenario Candidates

### `human-tsumo-standard`

Purpose:

- Manual and automated check for human `DECLARE_TSUMO`.

Expected:

- Player 0 is current.
- Player 0 has a standard 4-melds-and-pair winning hand.
- `canDeclareTsumo(state, 0) === true`.

### `cpu-tsumo-standard`

Purpose:

- Check CPU tsumo declaration and CPU tsumo status.

Expected:

- Player 1 is current.
- Player 1 has a standard winning hand.
- `canDeclareTsumo(state, 1) === true`.

### `human-not-winning`

Purpose:

- Check that tsumo button/action is rejected for incomplete hands.

Expected:

- Player 0 is current.
- Player 0 has 14 tiles but no winning shape.
- `canDeclareTsumo(state, 0) === false`.

### `ron-ready-human-ron-on-cpu-discard`

Purpose:

- Prepare MVP-0.5 ron tests without implementing ron yet.

Expected future setup:

- Player 1 has just discarded a tile.
- Player 0 can complete a winning hand using that discard.
- Current state records `lastDiscard.playerId === 1`.
- No ron action exists in MVP-0.4.

### `ron-ready-cpu-ron-on-human-discard`

Purpose:

- Prepare future CPU ron test design.

Expected future setup:

- Player 0 has just discarded a tile.
- A CPU player can complete a winning hand using that discard.

### `exhaustive-draw-near`

Purpose:

- Quickly confirm the MVP-0.1 exhaustive-draw path still works.

Expected:

- Live wall has 0 or 1 tile depending on test case.
- No player has a winning hand.
- Drawing from an empty wall still sets `endReason: "exhaustive-draw"`.

## Test Case Ideas

Scenario builder tests:

- `listScenarioDefinitions()` returns known scenario ids.
- `getScenarioDefinition()` returns a clone, not mutable shared data.
- `createScenarioState("human-tsumo-standard")` creates four players.
- Human tsumo scenario has player 0 current.
- Human tsumo scenario makes `canDeclareTsumo(state, 0)` true.
- CPU tsumo scenario makes `canDeclareTsumo(state, 1)` true.
- Non-winning scenario makes `canDeclareTsumo(state, 0)` false.
- Scenario state has no duplicate tile ids.
- Scenario state has no tile type with more than four copies.
- Scenario state preserves `deadWall.length === 14`.
- Scenario state has valid dora indicator references.
- Unknown scenario id is rejected clearly.
- Invalid tile pattern is rejected clearly.
- Normal `START_ROUND` still shuffles and deals without scenarios.

Regression tests:

- Existing 44 tests still pass.
- `src/game/` still avoids DOM access except `storage.js`.
- No UI element for scenarios appears in normal app render.
- Existing localStorage stats behavior is unchanged.

## Agent Split

Agent C: tests

- Adds pending scenario setup tests first.
- Owns `tests/scenario.test.js`.
- Registers scenario tests in `tests/test-runner.html`.
- Does not implement production code.

Agent A: game core

- Owns `src/game/scenarios.js`.
- Owns `src/game/scenario-builder.js`.
- Implements scenario validation and state creation.
- Keeps all scenario helpers DOM-free.
- Does not touch UI.

Agent B: UI

- No MVP-0.4 work by default.
- If later approved, may add a development-only scenario selector.
- Must not expose scenario setup to ordinary users without explicit approval.

Agent D: design / UX reviewer

- Reviews whether a future debug selector is safe and understandable.
- Keeps recommendations separate from implementation.

Integration owner:

- Integrates tests first.
- Integrates game core second.
- Confirms existing 44 tests still pass.
- Confirms no normal UI changes.
- Updates docs and README only after behavior is stable.

## Go Conditions

Start MVP-0.4 implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 44 pass / 0 pending / 0 fail.
- Scope remains scenario setup only.
- No ron/yaku/scoring/calls/riichi/furiten work is included.
- Scenario API is test-first and DOM-free.
- Normal app flow remains random unless a test/helper explicitly creates a scenario.

## No-Go Conditions

Do not start MVP-0.4 implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The work requires visible UI changes without explicit approval.
- The proposal includes ron implementation.
- The proposal includes yaku or scoring implementation.
- The scenario API would mutate shared fixture definitions.
- The scenario path would affect normal `START_ROUND`.

## MVP-0.5 Ron Connection

MVP-0.4 should make MVP-0.5 ron work easier by providing ready-made states.

MVP-0.5 can then focus on:

- Adding `DECLARE_RON` tests.
- Checking whether `lastDiscard.tile` completes another player's hand.
- Rejecting ron from the discarder.
- Rejecting ron after the round already ended.
- Ending the round with `endReason: "win"`.
- Storing `winningResult.winType: "ron"`.
- Storing `winningResult.winnerId`.
- Storing `winningResult.discarderId`.
- Keeping point calculation and yaku detection out of scope unless separately approved.

The key handoff from MVP-0.4 to MVP-0.5 is a deterministic `ron-ready-*` scenario where one known discard completes one known player hand.

## Open Questions For Implementation Time

- Should scenario definitions use compact strings only, or allow explicit tile objects?
- Should invalid scenario setup throw, return `{ valid: false }`, or both depending on API?
- Should scenario helpers live under `src/game/` or `tests/helpers/` first?
- Should a local-only debug UI be deferred until after MVP-0.5?

Safe default answers:

- Use compact strings in definitions, convert to tile objects in the builder.
- Validation returns structured results; state creation throws only for programmer misuse.
- Put reusable deterministic state builders in `src/game/` so tests and future local debug tools share the same path.
- Defer visible UI until a later milestone.

