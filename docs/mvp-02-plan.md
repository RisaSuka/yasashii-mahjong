# MVP-0.2 Plan: Win Check Entry

## Goal

MVP-0.2 adds the first rule-checking layer: determine whether a 14-tile hand is complete.

This milestone should not add scoring, yaku, calls, riichi, furiten, or full round settlement. It should answer only:

```text
Can this 14-tile hand form a legal winning shape?
```

## Scope

Implement shape checks for:

- Standard hand: four melds and one pair
- Seven pairs
- Thirteen orphans

Optional, only if time is safe:

- Return the matched hand shape name
- Return a simple breakdown for debugging/tests

## Out Of Scope

- Han/yaku detection
- Fu calculation
- Point calculation
- Tsumo/ron payment
- Riichi
- Furiten
- Dora effect
- Calls and open-hand state
- UI buttons
- CPU strategy changes
- Tonpuu/hanchan progression

## Proposed Files

New game files:

- `src/game/rules/win-check.js`

Possible future files, not required immediately:

- `src/game/rules/tile-counts.js`
- `src/game/rules/hand-shapes.js`

New tests:

- `tests/win-check.test.js`

Test runner update:

- `tests/test-runner.html`
- `tests/test.js` only if needed for registration

## Proposed API

```js
isWinningHand(tiles)
```

Returns:

```js
{
  winning: true,
  type: "standard"
}
```

or:

```js
{
  winning: false,
  type: null
}
```

Accepted `type` values:

- `standard`
- `seven-pairs`
- `thirteen-orphans`
- `null`

## Data Expectations

- Input is an array of tile objects using the existing MVP-0.1 tile structure.
- Input should contain exactly 14 tiles.
- Invalid tile counts, such as five copies of the same tile identity by suit/rank, should return `winning: false`.
- The checker should count by suit/rank, not by tile `id`.

## Test Case Ideas

Standard hand:

- `m1 m2 m3 / m4 m5 m6 / p2 p3 p4 / s7 s8 s9 / z1 z1`
- All triplets plus a pair
- Mixed sequences and triplets

Seven pairs:

- Seven distinct pairs
- Reject six pairs plus two unrelated tiles
- Reject seven pairs with an impossible five-of-a-kind count

Thirteen orphans:

- One each of 1/9 in m/p/s, all honors, plus one duplicate terminal/honor
- Reject missing one required terminal/honor
- Reject duplicate on a non-required tile

Invalid hands:

- 13 tiles
- 15 tiles
- Empty hand
- Five copies of the same suit/rank
- Random incomplete 14-tile hand

## Implementation Order

1. Add `tests/win-check.test.js` with failing tests.
2. Register the new tests in the browser test runner.
3. Implement tile counting helpers inside `win-check.js`.
4. Implement seven-pairs check.
5. Implement thirteen-orphans check.
6. Implement standard four-melds-and-pair check.
7. Keep the function pure and DOM-free.
8. Run all MVP-0.1 tests plus new MVP-0.2 tests.

## Suggested Algorithm

For standard hands:

1. Count tiles by compact key, for example `m1`, `p9`, `z3`.
2. Try each key with count at least 2 as the pair.
3. Remove the pair.
4. Recursively remove melds:
   - Triplet: three of the same key
   - Sequence: same suit, consecutive ranks, only for `m`, `p`, `s`
5. If all counts reach zero, the hand is standard-winning.

Keep the recursion small and deterministic. A 14-tile hand is small enough that a clear recursive implementation is acceptable.

## Agent Split

Agent A: game rule implementation

- Owns `src/game/rules/win-check.js`
- Does not touch UI

Agent C: tests

- Owns `tests/win-check.test.js`
- Updates test runner registration

Integration owner:

- Merges tests first, then rule implementation
- Ensures all tests pass
- Does not add UI until a later MVP explicitly allows it

Agent B:

- No MVP-0.2 UI work unless the scope is expanded later

Agent D:

- May review wording and future UI placement for a later "Tsumo" affordance, but should not request implementation during MVP-0.2 planning.

## Risks

- Standard hand recursion can accidentally accept invalid tile counts if validation is skipped.
- Seven pairs and standard hand can overlap in rare shapes; return priority should be explicit.
- Thirteen orphans needs exact terminal/honor requirements.
- Avoid mixing tile `id` uniqueness with suit/rank counts.

## Acceptance Criteria

- Existing MVP-0.1 tests still pass.
- New win-check tests pass.
- `src/game/rules/win-check.js` does not touch DOM.
- No UI button is added.
- No scoring, yaku, riichi, calls, or furiten logic is added.

