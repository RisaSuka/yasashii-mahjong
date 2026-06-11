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

Recommended exported helpers:

```js
createTileCounts(tiles)
validateWinningHandInput(tiles)
isStandardWinningHand(tiles)
isSevenPairs(tiles)
isThirteenOrphans(tiles)
```

Only `isWinningHand(tiles)` needs to be used by future gameplay code. The helper exports are allowed so Agent C can test the tricky pieces directly.

Recommended result shape:

```js
{
  winning: false,
  type: null,
  reason: "not-14-tiles"
}
```

Accepted `reason` values:

- `null`
- `not-14-tiles`
- `too-many-copies`
- `invalid-tile`
- `no-winning-shape`

The `reason` field is for tests and debugging. It must not imply yaku, score, or settlement.

## Data Expectations

- Input is an array of tile objects using the existing MVP-0.1 tile structure.
- Input should contain exactly 14 tiles.
- Invalid tile counts, such as five copies of the same tile identity by suit/rank, should return `winning: false`.
- The checker should count by suit/rank, not by tile `id`.

Expected tile shape:

```js
{
  id: "m1-0",
  suit: "m",
  rank: 1,
  copy: 0,
  red: false
}
```

Counting key:

```text
${suit}${rank}
```

Examples:

- `m1`
- `p9`
- `s5`
- `z7`

Validation rules:

- `tiles` must be an array.
- `tiles.length` must be 14.
- `suit` must be `m`, `p`, `s`, or `z`.
- `rank` must be 1 through 9 for `m`, `p`, `s`.
- `rank` must be 1 through 7 for `z`.
- No suit/rank count may exceed 4.

## Algorithm Details

### Validation

Run validation before any shape check.

Return early for invalid input:

- Non-array input
- Not exactly 14 tiles
- Invalid suit/rank
- More than four copies of any suit/rank

### Seven Pairs

Seven pairs is true when:

- The hand has exactly seven distinct suit/rank keys.
- Every key count is exactly 2.

It is false when:

- Any key has count 1, 3, or 4.
- The hand has fewer or more than seven distinct keys.
- Any key count is impossible because validation failed.

### Thirteen Orphans

Required keys:

```text
m1 m9 p1 p9 s1 s9 z1 z2 z3 z4 z5 z6 z7
```

Thirteen orphans is true when:

- All required keys are present.
- One required key has count 2.
- All other required keys have count 1.
- No non-required key is present.

### Standard Four Melds And One Pair

Standard hand is true when:

- One pair can be selected.
- The remaining 12 tiles can be fully reduced into four melds.

Meld types:

- Triplet: same suit/rank x3
- Sequence: same suit, ranks n/n+1/n+2
- Sequences are allowed only for `m`, `p`, and `s`
- Honor sequences are never allowed

Search strategy:

1. Count tiles.
2. Try each key with count >= 2 as the pair.
3. Remove the pair.
4. Always choose the lowest remaining key.
5. Try removing a triplet if possible.
6. Try removing a sequence if possible.
7. Recurse until all counts are zero.

This deterministic search keeps the implementation small and easy to test.

### Shape Priority

If multiple shapes match, return in this order:

1. `thirteen-orphans`
2. `seven-pairs`
3. `standard`

Reason:

- Special hands are easier to identify and useful to preserve in test output.
- This priority does not represent yaku value or scoring.

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

Detailed cases are listed in `docs/mvp-02-win-check-tests.md`.

## Implementation Order

1. Create `src/game/rules/` with a `.gitkeep` only if needed by a branch.
2. Add `tests/win-check.test.js` with failing tests.
3. Register the new tests in the browser test runner.
4. Implement validation and tile counting in `win-check.js`.
5. Implement seven-pairs check.
6. Implement thirteen-orphans check.
7. Implement standard four-melds-and-pair check.
8. Add direct helper tests only where they clarify edge cases.
9. Keep the function pure and DOM-free.
10. Run all MVP-0.1 tests plus new MVP-0.2 tests.
11. Do not connect the result to UI yet.

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

## Integration Impact

Expected affected areas:

- `src/game/rules/win-check.js`
- `tests/win-check.test.js`
- `tests/test-runner.html`
- Possibly `tests/test.js` if registration helpers need a small update

Expected unaffected areas:

- `src/main.js`
- `src/ui/**`
- `styles/**`
- `src/game/actions.js`
- `src/game/round.js`

MVP-0.2 should be a rule-library milestone. It should not alter the MVP-0.1 playable table flow.

## Agent Split

Agent A: game rule implementation

- Owns `src/game/rules/win-check.js`
- Does not touch UI

Agent C: tests

- Owns `tests/win-check.test.js`
- Updates test runner registration
- Must include invalid-input and impossible-copy cases

Integration owner:

- Merges tests first, then rule implementation
- Ensures all tests pass
- Does not add UI until a later MVP explicitly allows it
- Checks that MVP-0.1 table behavior is unchanged

Agent B:

- No MVP-0.2 UI work unless the scope is expanded later

Agent D:

- May review wording and future UI placement for a later "Tsumo" affordance, but should not request implementation during MVP-0.2 planning.

## Risks

- Standard hand recursion can accidentally accept invalid tile counts if validation is skipped.
- Seven pairs and standard hand can overlap in rare shapes; return priority should be explicit.
- Thirteen orphans needs exact terminal/honor requirements.
- Avoid mixing tile `id` uniqueness with suit/rank counts.
- Recursive standard-hand search can mutate shared count objects by accident; copy counts before trying branches.
- Test fixtures can become unreadable; use small helper builders in tests if needed.
- "Winning shape" is not the same as "legal riichi mahjong win with yaku"; keep wording precise.

## MVP-0.3 Connection

MVP-0.3 can build on MVP-0.2 by adding a non-settlement "Tsumo available" flow.

Possible MVP-0.3 scope:

- Detect when the human's current 14-tile hand is a winning shape.
- Show a temporary debug/status message that a winning shape exists.
- Still no scoring.
- Still no yaku requirement.
- Still no ron/calls/riichi/furiten.

Do not start MVP-0.3 until MVP-0.2 tests are stable.

## Acceptance Criteria

- Existing MVP-0.1 tests still pass.
- New win-check tests pass.
- `src/game/rules/win-check.js` does not touch DOM.
- No UI button is added.
- No scoring, yaku, riichi, calls, or furiten logic is added.
