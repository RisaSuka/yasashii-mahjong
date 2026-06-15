# MVP-1.0 Plan: No-Call East-Only Match Skeleton

## Goal

Add the smallest safe skeleton for an east-only match. The app should progress from East 1 through East 4, let each hand play with the existing no-call rules, and show a simple match-ended screen after East 4.

MVP-1.0 is match flow infrastructure. It is not full riichi scoring.

## Current Baseline

- Branch: `codex/mvp-09-next-round`
- Latest MVP-0.9.5 commit: `2fbe252 Refine next round mobile UI`
- Existing continuation action: `START_NEXT_ROUND`
- Existing previous result field: `lastRoundResult`
- Automated tests before MVP-1.0 planning: `159 pass / 0 pending / 0 fail`
- `main` merge: not approved
- Push: not approved

## Implement In MVP-1.0

- Add a minimal east-only match state.
- Start at East 1.
- Progress through East 1, East 2, East 3, and East 4.
- After East 4 ends, mark the match as ended.
- Show a simple `東風戦終了` state.
- Show the current hand label, such as `東1局`, `東2局`, `東3局`, `東4局`.
- Use existing round play:
  - deal
  - discard
  - random CPU discard
  - exhaustive draw
  - tsumo
  - ron
  - yaku check
  - discard advice
  - next-round button
- Preserve large tile mode and discard advice settings.
- Keep `lastRoundResult`.
- Add a small `roundHistory` summary only if needed for the final screen.
- Add tests before implementation.

## Do Not Implement In MVP-1.0

- Chi, pon, kan.
- Riichi.
- Furiten.
- Dora scoring.
- Ura-dora.
- Point calculation.
- Fu calculation.
- Point movement.
- Full dealer repeat logic.
- Honba and riichi stick accounting.
- Hanchan.
- CPU ron.
- Multiple ron.
- Full CPU AI.
- Full ranking calculation.
- Local same-device multiplayer.
- Local network multiplayer.

## Key Decisions

### Hand Count

Use `roundWind: "east"` and `handNumber: 1..4`.

Display labels:

- `東1局`
- `東2局`
- `東3局`
- `東4局`

After East 4 ends, the match ends instead of starting East 5.

### Dealer Rotation

MVP-1.0 should use the simple and safe rule:

- No dealer repeat.
- Dealer advances each hand.
- East 1 dealer: player 0.
- East 2 dealer: player 1.
- East 3 dealer: player 2.
- East 4 dealer: player 3.

Why:

- It avoids touching point movement, honba, and repeat conditions too early.
- It makes exactly four hands easy to test.
- It matches the goal of a skeleton rather than full match rules.

Full dealer repeat should move to MVP-1.x after point movement and honba are designed.

### Points

Do not move points in MVP-1.0.

Recommended display:

- Keep all players at `25000` if a score display is introduced.
- Label it as placeholder or omit score display entirely.
- Do not calculate ranking from points yet.

Final result screen should say that detailed scoring/ranking is not implemented yet.

### Match End

After East 4 ends:

- Set match phase to `ended`.
- Keep the ended round visible or replace center status with `東風戦終了`.
- Show a simple summary:
  - `東風戦が終了しました`
  - `点数計算と順位は今後追加します`
  - optional recent hand results from `roundHistory`

No ranking should be shown unless it is clearly marked as placeholder.

## State Design Proposal

Add a top-level `match` object:

```js
{
  match: {
    type: "tonpuu",
    phase: "playing" | "ended",
    roundWind: "east",
    handNumber: 1,
    dealerIndex: 0,
    maxHands: 4,
    scores: [25000, 25000, 25000, 25000],
    roundHistory: []
  }
}
```

Keep existing top-level fields:

```js
{
  settings,
  stats,
  lastRoundResult,
  round
}
```

### Relationship To `round`

`round` remains the active playable hand.

At round start:

- `round.roundWind = state.match.roundWind`
- `round.handNumber = state.match.handNumber`
- `round.dealerIndex = state.match.dealerIndex`
- `round.currentPlayerIndex = state.match.dealerIndex`

### Relationship To `lastRoundResult`

`lastRoundResult` remains the single most recent result for the current UI.

`roundHistory` stores small summaries for the match end screen:

```js
{
  handLabel: "東1局",
  endReason: "exhaustive-draw" | "win",
  winnerId?: number,
  winType?: "tsumo" | "ron"
}
```

Avoid storing complete hands or full round snapshots.

### Stats Relationship

Existing `stats.roundsStarted` and `stats.roundsDrawn` are app-wide lifetime counters.

MVP-1.0 should not reinterpret them as match counters.

Match-specific progress belongs in `state.match`.

## Action Proposal

### `START_MATCH`

Starts a new east-only match.

```js
dispatchAction(state, { type: "START_MATCH", storage, random })
```

Rules:

- Reset `match` to East 1.
- Clear `lastRoundResult`.
- Start a fresh round for East 1.
- Preserve settings.
- Preserve lifetime stats.

### `START_NEXT_ROUND`

Extend the existing action.

Rules:

- If no match exists, keep current MVP-0.9 behavior or initialize a match safely.
- If current round is not ended, return unchanged.
- Store `lastRoundResult`.
- Append a compact summary to `match.roundHistory`.
- If current hand is East 4, set `match.phase = "ended"` and do not create a new round.
- Otherwise advance:
  - `handNumber += 1`
  - `dealerIndex = (dealerIndex + 1) % 4`
  - start a fresh round with those match values.

### `END_MATCH`

May be internal only for MVP-1.0. A public action is optional.

```js
dispatchAction(state, { type: "END_MATCH" })
```

Use only if tests or UI benefit from an explicit action.

### `RESET_MATCH`

Optional. Prefer `START_MATCH` as the reset entry point for MVP-1.0.

## UI Policy

### Current Hand Label

Show a compact hand label near the center status:

```text
東1局
```

Smartphone landscape:

- Keep it one short line.
- Avoid pushing the human hand down.
- Do not add a large scoreboard.

### Next Button Behavior

Before East 4 ends:

- Button text may stay `次の局へ`.

After East 4 ends:

- Show `結果を見る` or `東風戦終了`.
- Prefer `東風戦終了` in the center status and `新しい東風戦` as the button if a restart is offered.

### Beginner Copy

Use short helper text only when space allows:

- `東風戦は東1局から東4局までの4局です。`
- `点数計算は今後追加します。`

Avoid long explanations in smartphone landscape.

## Test Case Proposal

Create `tests/match.test.js`.

Acceptance tests:

1. `START_MATCH` starts at East 1.
2. East 1 dealer is player 0.
3. After East 1 ends, `START_NEXT_ROUND` starts East 2.
4. East 2 dealer is player 1.
5. After East 2 ends, next hand is East 3.
6. After East 3 ends, next hand is East 4.
7. After East 4 ends, `START_NEXT_ROUND` ends the match.
8. Match ended state does not create East 5.
9. `roundHistory` stores compact results.
10. `lastRoundResult` still stores the latest result.
11. Large tile mode is preserved.
12. Discard advice setting is preserved.
13. Existing exhaustive draw tests still pass.
14. Existing tsumo tests still pass.
15. Existing ron tests still pass.
16. Existing yaku and advice tests still pass.

Initial test additions may be pending until `START_MATCH` and match state exist.

## Proposed Files

Game:

- `src/game/round.js`
- `src/game/actions.js`
- optional new `src/game/match.js` if match helpers grow beyond small functions

UI:

- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`
- `styles/board.css`
- `styles/responsive.css`

Tests:

- `tests/match.test.js`
- `tests/test-runner.html`

Docs:

- `README.md`
- `docs/current-status.md`
- `docs/manual-test-checklist.md`
- `docs/release-checklist.md`

## Agent Split

Agent C:

- Add pending match tests.
- Do not change production logic.

Agent A:

- Implement match state and `START_MATCH`.
- Extend `START_NEXT_ROUND` without breaking MVP-0.9 behavior.
- Keep game logic DOM-free.

Agent B:

- Add compact `東1局` display.
- Add match-ended display.
- Keep smartphone landscape uncluttered.

Integration owner:

- Run all tests.
- Verify HTTP 200.
- Verify no `main` merge or push without approval.

## Go / No-Go

Go when:

- Current branch is clean.
- MVP-0.9.5 tests pass.
- The scope is limited to no-call east-only skeleton.
- The team agrees to no dealer repeat and no point movement in MVP-1.0.

No-Go when:

- The implementation starts requiring scoring.
- The implementation starts requiring real dealer repeat.
- The UI needs a full scoreboard to make sense.
- Existing one-hand flow is broken.

## Implementation Order

1. Add this plan.
2. Add pending `tests/match.test.js`.
3. Add minimal match state.
4. Add `START_MATCH`.
5. Extend `START_NEXT_ROUND` to advance East 1 through East 4.
6. Add match-ended state after East 4.
7. Connect UI hand label and match-ended display.
8. Update docs.
9. Verify all tests and HTTP.
10. Stop before `main` merge or push.

## MVP-1.1 And Later

Possible follow-up order:

1. MVP-1.1: placeholder scores and clearer match result screen.
2. MVP-1.2: real point calculation entry.
3. MVP-1.3: dealer repeat and honba.
4. MVP-1.4: riichi declarations.
5. MVP-1.5: dora/ura-dora scoring.
6. MVP-1.6: furiten and ron restrictions.
7. MVP-2.0: first call support, likely pon/kan before chi.
