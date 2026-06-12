# MVP-0.5.5 Plan: Reaction Phase And Minimal Ron UI

## Goal

MVP-0.5.5 connects the MVP-0.5 ron action to the normal play loop.

After a discard, if the human player can ron the latest discard, the round should pause in a reaction phase. The UI should show a clear `ロン` button and a `見送る` button. If the human declares ron, `DECLARE_RON` ends the round. If the human skips, the game continues with the normal next-player draw flow.

This milestone is still a single-human-ron milestone. It does not add CPU ron, multiple ron, scoring, yaku, calls, riichi, furiten, or dora.

## Implement In MVP-0.5.5

- Connect normal discard flow to `reaction` phase.
- Enter `round.phase = "reaction"` only when the human player can ron the latest discard.
- Keep existing no-ron discard flow moving as before.
- Add a skip action for reaction, such as `SKIP_RON` or `ADVANCE_AFTER_REACTION`.
- Pause CPU auto progression while `round.phase === "reaction"`.
- Add minimal UI:
  - `ロン` button
  - `見送る` button
  - Status text such as `ロンできます`
- Dispatch `DECLARE_RON` from the ron button.
- Dispatch skip action from the skip button.
- Preserve existing `DECLARE_TSUMO`.
- Preserve existing exhaustive draw.
- Preserve deterministic scenario tests.

## Do Not Implement In MVP-0.5.5

- CPU ron
- Multiple ron
- Point calculation
- Yaku detection
- Yaku-required win validation
- Chi, pon, kan
- Riichi
- Furiten
- Dora effects
- Ura-dora
- Payment movement
- Honba or riichi-stick settlement
- Full reaction priority rules
- Broad UI redesign

## Recommended Flow

### Existing Flow

Current simplified flow:

```text
human discard
-> ADVANCE_TURN
-> DRAW_TILE for next player
-> CPU auto discard if CPU
```

CPU discard follows the same continuation path:

```text
CPU_DISCARD
-> ADVANCE_TURN
-> DRAW_TILE for next player
```

### MVP-0.5.5 Flow

After any discard:

```text
DISCARD_TILE / CPU_DISCARD
-> lastDiscard is set
-> check canDeclareRon(state, humanPlayerId)
```

If human can ron:

```text
SET_REACTION_PHASE or discard action sets phase: "reaction"
-> render "ロンできます"
-> show ロン / 見送る
-> stop CPU timer
```

If human cannot ron:

```text
continue existing ADVANCE_TURN / DRAW_TILE flow
```

If human clicks `ロン`:

```text
DECLARE_RON
-> phase: "ended"
-> endReason: "win"
-> winningResult.winType: "ron"
```

If human clicks `見送る`:

```text
SKIP_RON or ADVANCE_AFTER_REACTION
-> phase returns to normal continuation path
-> ADVANCE_TURN
-> DRAW_TILE for next player
```

## Action Proposal

### Option A: `ENTER_REACTION`

```js
{
  type: "ENTER_REACTION"
}
```

Behavior:

- Valid only after a discard when `lastDiscard.tile` exists.
- Sets `round.phase = "reaction"`.
- Does not change turn index.
- Does not draw.
- Does not mutate hands or discards.

This option keeps `DISCARD_TILE` behavior close to MVP-0.5, but requires UI/main integration to decide when to enter reaction.

### Option B: `DISCARD_TILE` Sets Reaction Directly

After `DISCARD_TILE`, game core checks whether human ron is possible and sets:

```js
phase: "reaction"
```

This couples `DISCARD_TILE` to human-player ron availability. It is compact but less general.

### Recommendation

Use Option A for MVP-0.5.5:

```js
{
  type: "ENTER_REACTION"
}
```

Then `src/main.js` can call:

```js
state = dispatchAction(state, { type: "DISCARD_TILE", ... });

if (canDeclareRon(state, humanPlayerId)) {
  state = dispatchAction(state, { type: "ENTER_REACTION" });
  render();
  return;
}

continueAfterDiscard();
```

However, `canDeclareRon` currently requires `phase === "reaction"`. To avoid awkward ordering, introduce a helper:

```js
canRonLatestDiscard(state, playerId)
```

This helper checks `lastDiscard` and hand shape without requiring phase. Then:

- `canRonLatestDiscard` decides whether to enter reaction.
- `canDeclareRon` remains the stricter helper for the actual action.

### `ADVANCE_AFTER_REACTION`

```js
{
  type: "ADVANCE_AFTER_REACTION"
}
```

Behavior:

- Valid only when `round.phase === "reaction"`.
- Sets `round.phase = "draw"` or another continuation-ready state.
- Does not clear `lastDiscard`.
- Does not draw by itself unless tests prove that bundling draw is cleaner.

Recommended minimal behavior:

```text
ADVANCE_AFTER_REACTION -> phase: "draw"
main.js then performs ADVANCE_TURN + DRAW_TILE like existing continuation
```

This keeps draw sequencing close to the current app.

## gameState Changes

Use existing fields:

```js
round.phase
round.lastDiscard
round.winningResult
```

Clarify allowed phases:

```js
"setup" | "discard" | "draw" | "reaction" | "ended"
```

No new score or yaku fields.

Optional temporary UI flag is not recommended. Derive UI from:

```js
round.phase === "reaction" && canDeclareRon(state, 0)
```

## Reaction Permissions

During `reaction`:

Allowed:

- Human `DECLARE_RON` if `canDeclareRon(state, 0)` is true.
- Human `ADVANCE_AFTER_REACTION` / `SKIP_RON`.
- Starting a new round from top-level button may remain allowed if current app already allows it.

Rejected or ignored:

- `DRAW_TILE`
- `DISCARD_TILE`
- `CPU_DISCARD`
- `DECLARE_TSUMO`
- `ADVANCE_TURN` unless the chosen skip action uses it internally or immediately after skip

Implementation note:

- Existing `DISCARD_TILE` already rejects anything outside `discard`.
- Existing `CPU_DISCARD` already rejects anything outside `discard`.
- `DRAW_TILE` currently allows non-ended phases. MVP-0.5.5 should consider rejecting `DRAW_TILE` during `reaction` to prevent bypassing the choice window.

## CPU Auto Progression

CPU timer should stop while:

```js
state.round?.phase === "reaction"
```

Suggested `main.js` behavior:

- Clear `cpuTimer` before entering reaction.
- `scheduleCpuIfNeeded()` already checks `phase === "discard"`, so it should naturally avoid scheduling while in reaction.
- After `見送る`, continue the existing after-discard flow and schedule CPU if needed.

## UI Policy

Minimal UI only:

- Center panel status: `ロンできます`
- Button: `ロン`
- Button: `見送る`
- Buttons large enough for smartphone tapping
- No score display
- No yaku display
- No hand explanation
- No multiple winner UI
- No CPU ron message in this milestone

Show `ロン` / `見送る` only when:

```js
round.phase === "reaction" && canDeclareRon(state, humanPlayerId)
```

If reaction phase exists but human cannot ron, that is a bug or transitional state; UI should not show ron controls.

End message after ron:

```text
あなたのロン和了です
```

## Test Case Ideas

Agent C should add tests before implementation.

### Game Core Tests

- `ENTER_REACTION` sets `phase: "reaction"` when `lastDiscard.tile` exists.
- `ENTER_REACTION` is rejected when no `lastDiscard.tile` exists.
- `canRonLatestDiscard(state, 0)` is true for `ron-ready-basic` even before reaction.
- `canDeclareRon(state, 0)` is true only during reaction.
- `ADVANCE_AFTER_REACTION` exits reaction safely.
- `DRAW_TILE` does not progress during reaction.
- `DISCARD_TILE` does not progress during reaction.
- `CPU_DISCARD` does not progress during reaction.
- `DECLARE_TSUMO` does not progress during reaction.
- Existing `DECLARE_RON` still ends the round.
- Existing `DECLARE_TSUMO` still works.
- Existing exhaustive draw still works.

### Main/UI Integration Tests Or Module Checks

- After CPU discard that creates human ron, UI enters reaction.
- CPU timer is not scheduled during reaction.
- Clicking `ロン` dispatches `DECLARE_RON`.
- Clicking `見送る` continues to the next draw.
- No ron button appears during ordinary discard/draw flow.
- No ron button appears for non-winning latest discard.

### Manual Checks

- Use `createScenarioState("ron-ready-basic")` or a future debug path for deterministic verification.
- Confirm `ロンできます` appears.
- Confirm `ロン` ends the round.
- Confirm `見送る` resumes play.
- Confirm normal random play still works when no ron is available.

## Agent Split

Agent C: tests

- Adds pending reaction/ron UI connection tests.
- Owns new tests or additions to `tests/ron.test.js`.
- Does not change production code.

Agent A: game core

- Owns `ENTER_REACTION` if used.
- Owns `ADVANCE_AFTER_REACTION` or `SKIP_RON`.
- Owns `canRonLatestDiscard`.
- Keeps game code DOM-free.
- Does not change UI.

Agent B: UI

- Owns `ロン` and `見送る` rendering.
- Owns click bindings.
- Owns `main.js` continuation timing.
- Must not implement game rules in UI.

Agent D: UX reviewer

- Reviews wording, placement, and tap target size.
- Keeps advice minimal and MVP-scoped.

Integration owner:

- Merges tests, game core, then UI.
- Confirms all tests pass.
- Confirms no out-of-scope features.
- Updates README/manual checklist/verification docs.

## Go Conditions

Start MVP-0.5.5 implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 67 pass / 0 pending / 0 fail.
- Scope is only reaction connection and minimal human ron UI.
- No CPU ron, multiple ron, scoring, yaku, calls, riichi, furiten, or dora work is included.
- UI change remains a small button/status addition.

## No-Go Conditions

Do not start implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The design expands into CPU ron or multiple ron.
- The design requires full call priority.
- The design requires scoring/yaku/furiten.
- The UI requires a broad redesign.

## Suggested Implementation Order

1. Add pending tests for reaction connection.
2. Add `canRonLatestDiscard(state, playerId)`.
3. Add `ENTER_REACTION` if using explicit action.
4. Add `ADVANCE_AFTER_REACTION` or `SKIP_RON`.
5. Ensure draw/discard/cpu discard do not bypass reaction.
6. Connect `main.js` after-discard flow:
   - discard
   - check human ron availability
   - enter reaction or continue normally
7. Add minimal render support for `ロンできます`.
8. Add `ロン` and `見送る` buttons.
9. Bind buttons to actions.
10. Run all tests.
11. Update docs and manual checklist.

## MVP-0.6 Candidates

- CPU ron
- Multiple ron
- Call reactions: chi, pon, kan
- Reaction priority ordering
- Yaku-required win validation
- Furiten basics

