# MVP-0.8 Plan: Beginner Discard Advice

## Goal

Help beginners and older players choose a discard with a short, gentle reason.

MVP-0.8 is not a strong mahjong AI. It is a learning aid. The app should explain simple choices without overwhelming the player.

## Current Baseline

- `main` contains MVP-0.7.8 plus tile visual improvements.
- Automated tests: `136 pass / 0 pending / 0 fail`.
- Work for MVP-0.8 starts from branch `codex/mvp-08-discard-advice-plan`.

## Implement In MVP-0.8

- Add a simple discard advice module.
- Suggest 1 to 3 discard candidates on the human player's turn.
- Show a short reason for each suggestion.
- Allow advice display to be turned ON/OFF.
- Save the advice setting to localStorage.
- Keep the UI readable on desktop and smartphone widths.
- Keep large tile mode readable.
- Keep explanations gentle and beginner-friendly.

## Do Not Implement In MVP-0.8

- Full tile efficiency.
- Shanten calculation.
- Opponent discard reading.
- Safe tile judgment.
- Riichi judgment.
- Push/fold judgment.
- Expected point value.
- Full CPU strategy.
- Local multiplayer.
- Network multiplayer.
- Point calculation.
- New yaku.
- Calls.
- Riichi.
- Furiten.
- Dora.

## Proposed Files

New files:

- `src/game/advice/discard-advice.js`
- `tests/discard-advice.test.js`

Possible small updates:

- `src/game/storage.js`
- `src/ui/render.js`
- `src/ui/input.js`
- `src/main.js`
- `styles/board.css`
- `docs/manual-test-checklist.md`
- `README.md`

Avoid changing:

- Existing win-check logic.
- Existing yaku detection logic.
- Round progression rules unless required for display wiring.

## Proposed API

```js
suggestDiscards(hand, context = {})
```

Returns:

```js
[
  {
    tileId: "z4-0",
    priority: 1,
    label: "おすすめ",
    reason: "孤立した字牌で、役にしにくいためです。",
    category: "isolated-honor"
  }
]
```

Optional helper APIs:

```js
createDefaultAdviceSettings()
loadAdviceSettings(storage?)
saveAdviceSettings(settings, storage?)
toggleDiscardAdvice(state)
```

## Suggested Context

```js
{
  round,
  player,
  preferTanyao: true,
  maxSuggestions: 3
}
```

MVP-0.8 should not require full game context for the core advice function. The pure function should work with just a hand and optional context.

## Simple Advice Rules

Rules are intentionally simple and explainable.

### 1. Isolated Honor Tiles

Candidate:

- A single honor tile with no pair or triplet.

Reason:

- `孤立した字牌で、役にしにくいためです。`

Keep:

- Dragon pairs: 白, 發, 中 with two copies.
- Any honor pair may be given lower discard priority because it can become a pair.

### 2. Tanyao-Friendly Terminal And Honor Tiles

Candidate:

- 1, 9, and honor tiles when a simple tanyao direction is reasonable.

Reason:

- `タンヤオを狙うなら、1・9・字牌は先に捨てやすいです。`

This should not override a useful pair or connected shape.

### 3. Isolated Edge Number Tiles

Candidate:

- Isolated 1 or 9 with no nearby 2/3 or 7/8 in the same suit.

Reason:

- `この牌は近い数字とつながりにくいです。`

### 4. Preserve Pairs And Nearby Shapes

Avoid recommending:

- Pairs.
- Adjacent tiles such as 3-4.
- Ryanmen-like shapes such as 6-7.
- Near shapes such as 3-5 may be lower priority than isolated tiles.

Reason if explaining why not recommended later:

- `同じ牌や近い数字は形を作りやすいためです。`

### 5. Preserve Yakuhai Pairs

Avoid recommending:

- Two copies of 白, 發, or 中.

Reason:

- `3枚そろうと役になります。`

## Priority Model

Lower priority number means stronger recommendation.

Suggested ordering:

1. Isolated non-dragon honor.
2. Isolated terminal tile.
3. Tanyao-unfriendly terminal or honor.
4. Other isolated tile.

Tie breakers:

- Prefer honors before terminals.
- Prefer terminals before middle tiles.
- Keep original hand order stable when priorities are equal.

## UI Plan

Show advice only when all are true:

- Advice setting is ON.
- There is an active round.
- Human player exists.
- It is the human player's discard phase.
- The round has not ended.

Display:

- Near the center panel or near the human hand.
- Heading: `おすすめ捨て牌`
- Up to 3 entries.
- Each entry shows tile label and short reason.
- Highlight matching hand tiles lightly.
- Use gentle wording.

Example:

```text
おすすめ捨て牌
おすすめ: 西
理由: 孤立した字牌で、役にしにくいためです。
```

OFF state:

- Hide all advice.
- Do not highlight tiles.

## ON/OFF Setting

Suggested default:

- ON for MVP-0.8, because the project prioritizes beginners.

Storage:

- Key: `jun-chan-mahjong:advice-settings`

Shape:

```js
{
  discardAdviceEnabled: true
}
```

Broken saved data:

- Fall back to default settings.

## Game State Option

Add a settings field later:

```js
settings: {
  largeTileMode: false,
  discardAdviceEnabled: true
}
```

This should remain UI-facing. The pure advice function should not mutate state.

## Test Cases

Core advice tests:

- Isolated honor tile is recommended.
- Isolated dragon single can be recommended.
- Dragon pair is not recommended.
- Isolated 1 tile is recommended when no 2/3 exists.
- Isolated 9 tile is recommended when no 7/8 exists.
- A pair is not recommended.
- Adjacent shapes are not recommended before isolated tiles.
- Returns at most 3 suggestions.
- Suggestions include `tileId`, `priority`, `label`, `reason`, and `category`.
- Unknown or empty hand returns an empty array safely.

Settings tests:

- Default advice setting is ON.
- Settings save/load works.
- Broken saved data falls back to default.
- Toggle flips ON/OFF.

Integration tests:

- Advice appears only on the human discard phase.
- Advice does not appear on CPU turns.
- Advice does not appear when the round ended.
- OFF setting hides advice.
- Highlighted tiles match suggested tile IDs.
- Existing 136 tests remain passing.

## Agent Split

Agent A: advice core

- `src/game/advice/discard-advice.js`
- Pure advice logic.
- No DOM access.

Agent B: UI wiring

- `src/ui/render.js`
- `src/ui/input.js`
- `src/main.js`
- `styles/board.css`
- Advice panel and tile highlight.

Agent C: tests

- `tests/discard-advice.test.js`
- Storage/settings tests.
- UI integration tests if feasible with render-string checks.

Agent D: beginner UX review

- Review wording.
- Check whether advice is gentle, short, and not visually noisy.
- Confirm smartphone and large tile mode considerations.

## Go / No-Go Conditions

Go if:

- MVP-0.7.8 baseline remains `136 pass`.
- Advice can be implemented without changing tile data structure.
- Advice core can be kept as pure functions.
- UI can hide advice completely when OFF.
- Storage fallback behavior is defined.

No-Go if:

- The design requires shanten calculation.
- Advice requires changing round progression.
- UI becomes too noisy on smartphone.
- It risks blocking normal discard actions.

## Implementation Order

1. Add pending tests for advice core and settings.
2. Implement `suggestDiscards`.
3. Add storage helpers for advice settings.
4. Connect settings to initial state or app boot.
5. Render advice panel.
6. Add ON/OFF control.
7. Add optional hand tile highlight.
8. Confirm automated tests.
9. Manually check desktop and smartphone widths.
10. Update README and manual checklist.

## Future Ideas

- Shanten-based advice.
- `なぜ？` button for detailed explanation.
- Beginner mode with always-on explanations.
- Experienced mode with advice hidden by default.
- Slow explanation mode for older players.
- Advice that considers visible discards.
