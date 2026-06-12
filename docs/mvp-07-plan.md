# MVP-0.7 Plan: Yaku Display And No-Yaku Feedback

## Goal

MVP-0.7 makes the MVP-0.6.5 yaku gate visible to the player.

Current state:

- `DECLARE_TSUMO` and `DECLARE_RON` require at least one supported yaku.
- No-yaku tsumo and ron are rejected by game logic.
- Successful wins store `round.winningResult.yakuResult`.
- The UI still shows only a generic tsumo/ron win message.
- The UI does not explain why a no-yaku win was rejected.

MVP-0.7 should show a simple yaku summary after a successful win and provide a clear no-yaku message when the player tries to win without yaku.

## Implement In MVP-0.7

- Show yaku names after tsumo or ron win.
- Show short beginner-friendly explanations with yaku names.
- Show each yaku's han value.
- Show total han for the detected yaku.
- Show a clear no-yaku rejection message such as:

```text
役がないため、あがれません
```

- Keep tsumo/ron win status text readable.
- Keep controls large enough for smartphone use.
- Update manual verification docs.
- Add UI-focused tests or render checks before implementation if feasible.

## Do Not Implement In MVP-0.7

- Full tutorial mode
- Practice mode
- Local human-vs-human play
- Local network play
- Point calculation
- Fu calculation
- Dora / ura-dora
- Riichi
- Furiten
- Chi, pon, kan
- Pinfu
- Iipeiko
- Honitsu / chinitsu
- Payment movement
- Honba / riichi stick settlement
- Full score result screen
- Complete yaku coverage
- Broad UI redesign

## Expected File Changes

UI:

- `src/ui/render.js`
- `src/ui/input.js` only if a rejection message needs a new UI event path
- `src/main.js` only if the app needs to track action rejection feedback
- `styles/board.css` for small yaku summary and message styling

Tests:

- `tests/render.test.js` or a new UI/render-oriented test file, if current test harness can support string/render checks without browser automation
- `tests/yaku-integration.test.js` only if rejection metadata is added to game state
- `tests/test-runner.html` if new test file is added

Docs:

- `docs/mvp-07-plan.md`
- `docs/manual-test-checklist.md`
- optional `README.md`

Game core:

- Avoid game logic changes if possible.
- `src/game/actions.js` only if a minimal rejection metadata field is needed.

## UI Policy

MVP-0.7 should be quiet, explicit, and easy to read.

After a successful win, the center panel should show:

```text
あなたのツモ和了です
役: 門前清自摸和
合計: 1翻
```

For ron:

```text
あなたのロン和了です
役: 断么九
合計: 1翻
```

For multiple yaku:

```text
役:
門前清自摸和 1翻
断么九 1翻
合計: 2翻
```

Design constraints:

- Use plain text; no decorative modal is needed.
- Keep the yaku list in the center panel near the win message.
- Do not use a score table yet.
- Do not show fu or points.
- Avoid tiny labels. The yaku list should remain readable on smartphone.
- Use the same visual rhythm as the current center status panel.
- Prefer short lines over dense paragraphs.
- Show yaku names and explanations together so a beginner does not need to already know the term.

## Beginner-Friendly Yaku Explanation Policy

This app is for both a beginner grandma user and a developer who is still learning mahjong. MVP-0.7 should not assume the player already knows yaku names.

Display each yaku as a name, han value, and one short explanation:

```text
断么九 1翻
1・9・字牌を使わず、2〜8だけで作る役です
```

Recommended first explanations:

- `menzen_tsumo` / 門前清自摸和:
  - `鳴かずに、自分で引いた牌であがる役です`
- `tanyao` / 断么九:
  - `1・9・字牌を使わず、2〜8だけで作る役です`
- `yakuhai` / 役牌:
  - `白・發・中のどれかを3枚集めると成立します`
- `chiitoitsu` / 七対子:
  - `同じ牌2枚の組を7つ作る役です`
- `toitoi` / 対々和:
  - `順子ではなく、同じ牌3枚の組を4つ作る役です`
- `kokushi_musou` / 国士無双:
  - `1・9・字牌を集める特別な役です`

Implementation note for later:

- The explanations can live in a UI-side lookup table keyed by `yaku.id`.
- Do not change the `detectYaku` return shape just to add UI copy.
- If a yaku id has no explanation, show only the yaku name and han.

## `winningResult.yakuResult` Display Format

MVP-0.6.5 stores `detectYaku` output directly:

```js
[
  { id: "menzen_tsumo", name: "門前清自摸和", han: 1 },
  { id: "tanyao", name: "断么九", han: 1 }
]
```

MVP-0.7 display should derive:

```js
const yaku = round.winningResult?.yakuResult || [];
const totalHan = yaku.reduce((sum, item) => sum + (item.han || 0), 0);
```

Display rules:

- If `yakuResult` is a non-empty array, show names and han.
- If `yakuResult` is missing on an older saved/debug state, do not crash.
- If a yaku entry has no `han`, show only the name and omit it from total.
- If total is 0 because data is missing, hide the total row.

## No-Yaku Rejection Message Policy

MVP-0.6.5 currently rejects no-yaku wins by returning the original state unchanged.

The rejection message must not stop at only:

```text
役がありません
```

Preferred beginner-friendly message:

```text
形は完成していますが、あがるための条件である役がありません。
まずはタンヤオや役牌を狙ってみましょう。
```

Tone policy:

- Avoid harsh words like `失敗`.
- Prefer soft wording such as `まだ役がありません`.
- Explain that the hand shape may be complete, but the rule still needs a yaku.
- Give one simple next step: `タンヤオ` or `役牌`.

There are two possible approaches for MVP-0.7.

### Option A: UI-Derived Precheck

Before dispatching `DECLARE_TSUMO` or `DECLARE_RON`, UI/main checks whether the action is available.

Pros:

- No game state changes.
- Keeps MVP-0.7 mostly in UI.

Cons:

- UI must know why a button is unavailable.
- Risk of duplicating rule knowledge in UI.
- If a player somehow clicks a stale button, there is no authoritative rejection reason.

### Option B: Minimal Game Rejection Metadata

When a win action is rejected due to no yaku, game core returns a new state with:

```js
round.lastActionResult = {
  ok: false,
  action: "DECLARE_TSUMO",
  reason: "no-yaku",
  message: "役がないため、あがれません"
}
```

Pros:

- The game layer owns the reason.
- UI only renders state.
- Works for stale buttons and future CPU/human flows.
- Easy to test.

Cons:

- Touches `src/game/actions.js`.
- Adds small state metadata.

Recommendation:

- Use Option B.
- Keep the metadata small and optional.
- Clear or replace `lastActionResult` on successful actions and new round start.

## Button Display Policy

### Tsumo Button

Recommended:

- Show the tsumo button only when `canDeclareTsumo(state, human.id)` is true.
- Since MVP-0.6.5 already makes `canDeclareTsumo` yaku-aware, this means no-yaku tsumo will not show the button in normal UI.

No-yaku message path:

- A rejection message is still useful for tests, stale UI, debug scenarios, or later explicit "try win" controls.

### Ron Button

Recommended:

- Show `ロン` only when `canDeclareRon(state, human.id)` is true.
- Since MVP-0.6.5 already makes reaction/yaku checks strict, no-yaku ron should not enter reaction in normal flow.

No-yaku message path:

- If `DECLARE_RON` is dispatched while no yaku exists, show the rejection message from `lastActionResult`.

### Do Not Show Dead Buttons

For older users, avoid showing enabled-looking buttons that cannot work.

- Prefer hiding invalid win buttons.
- If a disabled button is ever shown later, it must have clear text nearby.

## Grandma-Friendly Wording

Use short, direct Japanese:

- `あなたのツモ和了です`
- `あなたのロン和了です`
- `役:`
- `合計: 2翻`
- `役がないため、あがれません`

Avoid:

- Rule jargon without context
- Long explanations in the center panel
- English-only yaku names
- Tiny gray helper text

If more help is needed later, add a separate beginner help panel, not a dense in-game message.

Additional readability rules:

- Use larger text for result status, yaku names, and no-yaku messages.
- Put difficult kanji yaku names next to a short explanation.
- Keep each sentence short.
- Make buttons and result areas easy to tap and easy to scan.
- Use forgiving wording: `まだ役がありません` instead of `失敗`.

## Mahjong Term Explanation Policy

MVP-0.7 should add tiny explanations for important terms when they appear in result or rejection text.

Examples:

- `役`: `あがるために必要な条件です`
- `翻`: `役の大きさを表す数字です`
- `ツモ`: `自分で引いた牌であがることです`
- `ロン`: `相手が捨てた牌であがることです`

Scope:

- MVP-0.7 should not implement a full help screen.
- Term explanations should be short and local to the result/rejection display.
- A future beginner help screen can reuse the same wording.

## Future Local Battle Concept

The long-term app may support local human-vs-human play.

Future candidates:

- Same-device pass-and-play local match:
  - Multiple human players share one device and take turns.
  - This is the simplest local battle candidate.
- Same-Wi-Fi local network match:
  - Multiple devices on the same local network join one table.
  - This is more complex and should be considered much later.

MVP-0.7 does not implement local battle, communication, room creation, hidden-hand privacy, or multiplayer synchronization. This section only records the future direction.

## Test Case Ideas

Agent C should add tests before implementation.

### Render Tests

- Tsumo win with `yakuResult` renders yaku names.
- Ron win with `yakuResult` renders yaku names.
- Multiple yaku render as multiple rows or a comma-separated list.
- Beginner explanation text renders for supported yaku.
- Total han is rendered from yakuResult.
- Missing `yakuResult` does not crash render.
- No-yaku rejection message renders when `round.lastActionResult.reason === "no-yaku"`.
- No-yaku rejection text explains that the shape is complete but yaku is missing.
- Term explanation text for `役` or `翻` is available in the result area.

### Game Metadata Tests

Only if Option B is implemented:

- No-yaku `DECLARE_TSUMO` sets `round.lastActionResult.reason === "no-yaku"`.
- No-yaku `DECLARE_RON` sets `round.lastActionResult.reason === "no-yaku"`.
- Successful tsumo clears or replaces no-yaku rejection metadata.
- Successful ron clears or replaces no-yaku rejection metadata.
- `START_ROUND` clears previous rejection metadata.

### Regression Tests

- Existing 101 tests remain passing.
- Tsumo with yaku still succeeds.
- Ron with yaku still succeeds.
- No-yaku tsumo/ron still rejected.
- Exhaustive draw still works.
- `src/game/` remains DOM-free except `storage.js`.
- UI still dispatches actions instead of mutating state.

## Manual Test Plan

Update `docs/manual-test-checklist.md` with:

- Start app and run test runner.
- Confirm `101 pass / 0 pending / 0 fail` before MVP-0.7 work.
- Use `human-tsumo-ready` or a debug state to confirm tsumo win shows yaku.
- Use `ron-ready-tanyao` to confirm ron win shows yaku.
- Use `ron-ready-basic` to confirm no-yaku ron is rejected.
- Confirm no-yaku message text is readable.
- Confirm smartphone width still shows status/yaku text without overlap.
- Confirm large tile mode does not hide yaku text.

## Agent Split

Agent C: tests

- Adds render/state tests for yaku display and no-yaku messages.
- Registers new tests in the test runner.
- Does not change production code.

Agent A: game core

- Adds minimal `lastActionResult` metadata only if Option B is chosen.
- Keeps game logic DOM-free.
- Does not add scoring or new yaku.

Agent B: UI

- Renders `winningResult.yakuResult`.
- Renders total han.
- Renders no-yaku rejection message.
- Keeps buttons large and clear.
- Does not implement yaku logic directly.

Agent D: UX reviewer

- Reviews wording and spacing for older users.
- Confirms text is readable on smartphone and large tile mode.

Integration owner:

- Integrates tests first.
- Integrates any minimal game metadata second.
- Integrates UI rendering third.
- Runs all tests.
- Performs manual desktop and smartphone-width checks.
- Updates README/manual checklist if needed.

## Go Conditions

Start implementation only if all are true:

- User explicitly approves implementation.
- Working tree is clean.
- Current tests pass: 101 pass / 0 pending / 0 fail.
- The chosen no-yaku message approach is clear.
- UI work is limited to yaku display and rejection feedback.
- No scoring, fu, dora, riichi, calls, or furiten are included.
- Tests are added before or alongside production changes.

## No-Go Conditions

Do not start implementation if any are true:

- User asks only for planning.
- Working tree is dirty.
- Existing tests fail.
- The change expands into score calculation.
- The change requires a full result screen.
- The change requires new yaku implementation.
- The UI becomes a broad redesign.

## Suggested Implementation Order

1. Add pending tests for yaku display rendering.
2. Add pending tests for no-yaku rejection message.
3. If using Option B, add minimal `lastActionResult` tests.
4. Add or update game metadata for no-yaku rejection.
5. Add yaku summary rendering in `src/ui/render.js`.
6. Add no-yaku message rendering in `src/ui/render.js`.
7. Add small CSS for yaku summary and warning text.
8. Confirm `canDeclareTsumo` and `canDeclareRon` remain yaku-aware.
9. Run all automated tests.
10. Update manual checklist.

## MVP-0.8 Candidates

- Beginner help text for why a hand has no yaku
- Hide/disable win buttons with explanation
- Seat wind and round wind yakuhai
- Pinfu
- Riichi design
- Furiten design
- Dora display and dora yakuResult separation
- Result screen planning
