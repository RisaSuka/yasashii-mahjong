# MVP-0.9 Plan: Next Round

## Goal

Allow the player to continue after a round ends. When a round ends by exhaustive draw, tsumo, or ron, the UI should show a clear `次の局へ` button. Pressing it starts a fresh round with a new wall, new hands, and the dealer's initial draw.

MVP-0.9 is a continuation loop, not full match progression.

## Current Baseline

- Branch: `codex/mvp-09-next-round`
- Start point: `main`
- Latest published baseline: `b23f1a4 Compact landscape center panel`
- Automated tests before MVP-0.9: `148 pass / 0 pending / 0 fail`
- GitHub Pages is already published from `main`, but MVP-0.9 will not be published until explicit approval.

## Implement In MVP-0.9

- Add `START_NEXT_ROUND`.
- Show `次の局へ` after a round ends.
- Support next round after:
  - exhaustive draw
  - tsumo win
  - ron win
- Create a fresh wall, dead wall, dora indicator, players, hands, and dealer initial draw.
- Preserve user settings:
  - large tile mode
  - discard advice ON/OFF
  - discard advice strategy
  - CPU delay
- Preserve stats and increment `roundsStarted` when the next round begins.
- Increment `roundsDrawn` only when a round ends by exhaustive draw, not when moving to the next round.
- Store the previous round result in `lastRoundResult`.
- Clear `round.lastActionResult` when the next round begins.
- Display the previous round result briefly in the UI.
- Keep smartphone landscape controls tappable.
- Add tests before implementation.

## Do Not Implement In MVP-0.9

- Point calculation.
- Fu calculation.
- Point stick movement.
- Full dealer repeat logic.
- Full east-only match progression.
- Hanchan progression.
- Honba progression beyond preserving the existing placeholder field.
- Riichi sticks and deposits.
- Chi, pon, kan.
- Riichi.
- Furiten.
- Dora scoring.
- CPU ron.
- Multiple ron.
- Local or network multiplayer.

## Action Proposal

```js
dispatchAction(state, {
  type: "START_NEXT_ROUND",
  storage,
  random
})
```

Rules:

- If there is no current round, treat it like `START_ROUND`.
- If the current round has not ended, return state unchanged.
- If the current round has ended, snapshot the ended round into `lastRoundResult`, then call the same round setup path used by `START_ROUND`.
- The resulting round must start in `phase: "discard"` with the dealer holding 14 tiles.

## Game State Additions

Add one top-level field:

```js
{
  lastRoundResult: null | {
    roundId: string,
    endReason: "exhaustive-draw" | "win",
    winnerId?: number,
    winType?: "tsumo" | "ron",
    fromPlayerId?: number,
    handType?: string,
    yakuResult?: Array,
    endedAt: string
  }
}
```

Why top-level:

- It survives replacing `state.round` with the fresh next round.
- It keeps previous-round summary separate from active round state.
- It avoids keeping a large full round history in MVP-0.9.

`roundHistory` is deferred. MVP-0.9 only needs the most recent result.

## Result Snapshot Rules

For exhaustive draw:

```js
{
  roundId,
  endReason: "exhaustive-draw",
  endedAt
}
```

For tsumo:

```js
{
  roundId,
  endReason: "win",
  winnerId,
  winType: "tsumo",
  handType,
  yakuResult,
  endedAt
}
```

For ron:

```js
{
  roundId,
  endReason: "win",
  winnerId,
  winType: "ron",
  fromPlayerId,
  winningTile,
  handType,
  yakuResult,
  endedAt
}
```

Do not store complete hands unless a later MVP needs a detailed review screen.

## UI Policy

When `round.phase === "ended"`:

- Show `次の局へ` near the existing win/draw status.
- Keep `新規局開始` in the header as a hard restart option.
- Use gentle wording:
  - `次の局を始めます`
  - `前の局: 流局しました`
  - `前の局: あなたのツモ和了です`
  - `前の局: あなたのロン和了です`
- Keep the button large enough for smartphone landscape.
- Do not add score display.
- Do not add match progression labels beyond the existing placeholders.

## Test Plan

Add `tests/next-round.test.js`.

Acceptance tests:

1. After exhaustive draw, `START_NEXT_ROUND` starts a new round.
2. After tsumo win, `START_NEXT_ROUND` starts a new round.
3. After ron win, `START_NEXT_ROUND` starts a new round.
4. The next round starts with `phase: "discard"`.
5. The next round regenerates wall, dead wall, players, and hands.
6. `roundsStarted` increments when the next round starts.
7. `roundsDrawn` increments only when the previous round ended by exhaustive draw.
8. `lastRoundResult` stores the previous result.
9. `lastActionResult` is cleared in the new round.
10. Advice settings and large tile mode are preserved.
11. Existing exhaustive draw, tsumo, ron, yaku, and discard advice tests still pass.

Before implementation, these tests may be pending if `START_NEXT_ROUND` is not exported yet.

## Proposed Files

Game:

- `src/game/actions.js`
- `src/game/round.js` if shared helper extraction is useful

UI:

- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`
- `styles/board.css`
- `styles/responsive.css` only if the next-round button needs layout support

Tests:

- `tests/next-round.test.js`
- `tests/test-runner.html`

Docs:

- `README.md`
- `docs/current-status.md`
- `docs/manual-test-checklist.md`
- `docs/release-checklist.md`

## Agent Split

Agent C:

- Add pending `next-round` tests.
- Do not change production logic.

Agent A:

- Implement `START_NEXT_ROUND`.
- Add `lastRoundResult`.
- Keep game logic isolated from DOM.

Agent B:

- Add `次の局へ` UI.
- Add input binding and `main.js` dispatch.
- Keep smartphone landscape readable.

Integration owner:

- Run the full test suite.
- Verify HTTP 200 for `/` and `/tests/test-runner.html`.
- Update docs.
- Do not merge to `main` or push without explicit approval.

## Go / No-Go

Go when:

- Working tree is clean.
- Current branch is `codex/mvp-09-next-round`.
- Baseline tests are passing.
- MVP-0.9 scope is limited to next-round continuation.

No-Go when:

- Existing 148 tests fail before the new work.
- The feature requires point movement or full match progression.
- The implementation would require a broad rewrite of round flow.

## Implementation Order

1. Create `docs/mvp-09-plan.md`.
2. Add pending acceptance tests.
3. Implement `START_NEXT_ROUND` and `lastRoundResult`.
4. Connect UI button and input handling.
5. Update docs and manual checklist.
6. Verify all tests and local HTTP.
7. Stop before `main` merge or push.
