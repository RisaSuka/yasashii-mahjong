# MVP-0.2 Agent Prompts

Use these prompts after MVP-0.2 is explicitly approved. Do not run them during MVP-0.1 cleanup.

## Agent C: Win Check Tests

```text
You are Agent C for MVP-0.2.

Goal:
Add browser-runnable tests for the winning-shape checker only.

Allowed files:
- tests/win-check.test.js
- tests/test-runner.html
- tests/test.js only if registration needs a tiny adjustment

Forbidden files:
- src/game/**
- src/ui/**
- styles/**
- index.html

Scope:
- Standard hand: four melds and one pair
- Seven pairs
- Thirteen orphans
- Invalid hand checks
- No scoring
- No yaku
- No riichi
- No calls
- No furiten
- No UI changes

Reference docs:
- docs/mvp-02-plan.md
- docs/mvp-02-win-check-tests.md
- AGENTS.md

Expected result:
- New tests fail clearly while win-check implementation is missing.
- Existing MVP-0.1 tests remain registered.
- Test runner still displays pass/fail/pending clearly.

Report:
- Changed files
- Number of tests added
- Expected missing API names
- Test result
```

## Agent A: Win Check Implementation

```text
You are Agent A for MVP-0.2.

Goal:
Implement a pure winning-shape checker for 14-tile closed hands.

Allowed files:
- src/game/rules/win-check.js
- src/game/rules/.gitkeep only if needed before adding win-check.js

Forbidden files:
- src/ui/**
- styles/**
- index.html
- tests/**

Required API:
- isWinningHand(tiles)

Allowed helper exports:
- createTileCounts(tiles)
- validateWinningHandInput(tiles)
- isStandardWinningHand(tiles)
- isSevenPairs(tiles)
- isThirteenOrphans(tiles)

Scope:
- Standard hand: four melds and one pair
- Seven pairs
- Thirteen orphans
- Invalid hand checks

Out of scope:
- Scoring
- Yaku
- Riichi
- Furiten
- Calls
- Dora effects
- UI buttons
- Round settlement

Implementation rules:
- No DOM access
- No localStorage access
- Count by suit/rank, not tile id
- Reject non-14-tile inputs
- Reject invalid suit/rank
- Reject more than four copies of a suit/rank
- Keep recursion deterministic and small

Report:
- Changed files
- Implemented exports
- Known edge cases
- Test result after integration if available
```

## Integration Owner

```text
You are the integration owner for MVP-0.2.

Prerequisites:
- MVP-0.1 working tree is clean
- No unapproved push
- No unapproved main merge
- MVP-0.2 scope is approved

Integration order:
1. Start from the agreed integration/base branch.
2. Merge Agent C tests.
3. Confirm tests fail or pending because implementation is missing.
4. Merge Agent A implementation.
5. Run the full browser-style test suite.
6. Make only minimal integration fixes.
7. Confirm MVP-0.1 table behavior is unchanged.
8. Commit the integration result.

Forbidden:
- UI buttons
- Scoring
- Yaku
- Riichi
- Furiten
- Calls
- Dora effects
- Push without approval
- main merge without approval

Report:
- Branch
- Commits merged
- Test result
- Changed files
- Any skipped manual checks
```

## Agent D: Design Reviewer

```text
You are Agent D for MVP-0.2.

Goal:
Review wording and future UX placement for a possible later winning-shape indication.

Do not implement UI.

Allowed files:
- docs/design-review.md only if explicitly asked
- A new docs note only if explicitly asked

Scope:
- Explain how a future "winning shape detected" indication should avoid confusing users.
- Keep advice out of MVP-0.2 implementation unless explicitly approved.

Forbidden:
- src/**
- styles/**
- tests/**
- index.html
```

