# MVP-3.0 Pon / Chi Plan

MVP-3.0 is a design-only milestone for calls. Pon and chi affect turn flow, yaku, riichi, hand display, and mobile layout, so the first step is to keep the scope deliberately small.

## MVP-3.1 Implementation Note

MVP-3.1 implements the first slice of this plan: human-only pon. The UI shows pon only when ron priority is not taking over, `DECLARE_PON` creates a `pon` meld, the human hand becomes open, and the caller must discard one tile. Open hands cannot declare riichi, and an open yakuhai pon can count as yaku. Chi, kan, CPU calls, scoring, furiten, and full call competition remain deferred.

## MVP-3.2 Implementation Note

MVP-3.2 implements human-only chi. Chi is offered only for the upper player's latest suited-number discard, and multiple sequence patterns are rendered as separate candidate buttons. `DECLARE_CHI` removes the selected two hand tiles, creates a `chi` meld with `calledTile` and `fromPlayerId`, marks the hand open, and lets the human discard one tile. The smartphone landscape meld area now supports multiple horizontal meld groups and the layout guard includes `chi-reaction` and `multiple-melds`. Kan, CPU calls, scoring, furiten, kuikae, and full call competition remain deferred.

## MVP-3.3 Stability Note

MVP-3.3 verifies the open-hand rules before any `main` merge. Open yakuhai pon and open tanyao chi can win, open complete shapes without yaku are rejected, open tsumo does not get menzen-tsumo, and fresh rounds clear all melds. The reaction priority remains ron first; if ron is available, the call buttons are not shown in the current MVP. If pon and chi are both possible without ron, both call choices may be shown. Full multi-player call competition remains deferred.

## MVP-3.4.2 Layout Correction Note

MVP-3.4.2 keeps the call implementation unchanged but corrects the smartphone landscape table structure around it. The human meld lane is a reserved area to the right of the self river, the action area sits between the self river and meld lane, and the bottom hand keeps nearly the full viewport width. This protects pon/chi candidate buttons and multiple human melds from covering the hand while preserving the hand-drawn four-direction table plan.

## Goal

- Add a clear implementation plan for human pon and chi.
- Keep the current stable riichi / CPU win / advice / layout behavior untouched.
- Prepare state and action shapes that can later support CPU calls.
- Avoid kan, scoring, furiten, and CPU call decisions for now.

## Implement In The First Call Milestones

- Human player can pon.
- Human player can chi from the upper player only.
- CPU players do not call yet.
- Kan is not implemented.
- A player in riichi cannot pon or chi.
- A called hand is no longer closed.
- After pon or chi, the caller discards one tile.
- Called melds are displayed separately from the hand.
- Yakuhai pon remains a yaku.
- Kuikae, scoring, fu, honba, riichi sticks, and call timing edge cases are deferred.

## Do Not Implement Yet

- CPU pon / chi.
- Kan.
- Chankan.
- Rinshan.
- Scoring or point movement.
- Furiten.
- Riichi sticks and deposits.
- Ippatsu / uradora interactions.
- Kuikae restrictions.
- Multiple simultaneous call windows for CPU decisions.
- Full open-hand yaku set.
- Large layout redesign beyond what is needed for call buttons and meld display.

## Recommended First Scope

MVP-3.1 should implement human pon first because it is easier to explain and test:

- Any discard from another player can be pon if the human has two matching tiles.
- The human must not be in riichi.
- The human hand must not already be in a call-reaction lock.
- Pon creates a `pon` meld with three identical tiles.
- Two tiles are removed from the human hand.
- The called discard is attached to the meld with `fromPlayerId`.
- The human becomes the current player and must discard one tile.

MVP-3.2 can then add human chi:

- Chi is only allowed from the human player's upper player.
- The called tile must be a suited tile.
- The human must have two tiles that form a sequence with the called tile.
- Multiple chi patterns are possible and must be selectable.
- Chi creates a `chi` meld with the chosen sequence.
- Two selected tiles are removed from the human hand.
- The human becomes the current player and must discard one tile.

## State Design

Extend each player with `melds` and use existing closed-hand flags consistently:

```js
player = {
  ...player,
  melds: [
    {
      id: "meld-round-1-call-3",
      type: "pon",
      tiles: [tileFromHandA, tileFromHandB, calledTile],
      calledTile,
      fromPlayerId: 1,
      openedAtTurn: 23
    },
    {
      id: "meld-round-1-call-4",
      type: "chi",
      tiles: [tile3, tile4, calledTile5],
      calledTile: calledTile5,
      fromPlayerId: 3,
      openedAtTurn: 31
    }
  ],
  isClosed: false,
  menzen: false
}
```

Notes:

- Keep `tiles` sorted in display order for chi.
- Preserve `calledTile` and `fromPlayerId` for UI and future scoring.
- Do not mutate hand arrays directly from UI; all changes go through actions.
- `isClosed` / `menzen` should become false after the first call.
- Existing riichi state remains separate. A riichi player cannot call.

## Action Design

Add call-related actions after the design is approved:

```js
ENTER_CALL_REACTION
DECLARE_PON
DECLARE_CHI
SKIP_CALL
```

Possible payloads:

```js
{
  type: "DECLARE_PON",
  playerId: 0,
  handTileIds: ["z5-0", "z5-1"]
}

{
  type: "DECLARE_CHI",
  playerId: 0,
  handTileIds: ["p3-0", "p4-0"],
  pattern: ["p3", "p4", "p5"]
}
```

Expected action behavior:

- Validate latest discard exists and is not from the caller.
- Validate caller is human for MVP-3.x.
- Validate caller is not in riichi.
- Validate required hand tiles are present.
- Remove required tiles from caller hand.
- Add a meld to caller.
- Remove or mark the latest discard as called so it is not treated as a normal visible discard in future call logic.
- Set `round.currentPlayerIndex` to caller id.
- Set `round.phase` to `discard`.
- After the caller discards, next turn advances to the caller's next player.

## Reaction Priority

Suggested priority for the first implementation:

1. Human ron.
2. Human pon / chi.
3. Skip.

Recommended MVP behavior:

- If human ron is possible, show ron / skip as today.
- If human ron is not possible but pon or chi is possible, show pon / chi / skip.
- If ron and calls are both possible, start with ron priority only and do not show call buttons. This avoids complex beginner choices and keeps MVP-3.1 safer.
- A later MVP can expose both ron and call options if needed.

## Pon Rules

Pon availability:

- Latest discard exists.
- Discarder is not the human.
- Human is not in riichi.
- Human has at least two tiles with the same suit/rank.

Pon result:

- Create `type: "pon"` meld.
- Remove exactly two matching hand tiles.
- Include the called discard as `calledTile`.
- Set human `isClosed` / `menzen` to false.
- Human immediately enters discard phase.

## Chi Rules

Chi availability:

- Latest discard exists.
- Discarder is the human's upper player.
- Called tile is manzu, pinzu, or souzu.
- Human is not in riichi.
- Human has at least one valid two-tile pattern.

Possible patterns for a discarded rank `n`:

- `n-2, n-1, n`
- `n-1, n, n+1`
- `n, n+1, n+2`

Only patterns fully within 1 to 9 are valid. Honors cannot be chi'd.

Chi result:

- Create `type: "chi"` meld.
- Remove the selected two hand tiles.
- Add the called tile.
- Set human `isClosed` / `menzen` to false.
- Human immediately enters discard phase.

## Upper Player

Turn order is east -> south -> west -> north -> east. The upper player is the player who acts immediately before the caller.

For human id `0`, upper player is player `3` in the current four-player order.

Use a helper instead of hard-coding:

```js
function getUpperPlayerId(players, playerId) {
  const index = players.findIndex((player) => player.id === playerId);
  return players[(index + players.length - 1) % players.length]?.id ?? null;
}
```

## UI Design

Call reaction UI should stay in the existing action bar area.

Buttons:

- `ロン`
- `ポン`
- `チー`
- `見送る`

For chi with multiple patterns:

- Show one button per pattern.
- Each button should render the three-tile sequence with SVG tile components.
- Keep wording short for smartphone landscape.

Example:

```text
チー [3筒][4筒][5筒]
チー [4筒][5筒][6筒]
```

## Meld Display

Add a meld area to each player seat, starting with human display:

```text
鳴き:
[白][白][白]
[3筒][4筒][5筒]
```

Requirements:

- Meld area is separate from the concealed hand.
- Melds use the same SVG tile renderer and CSS fallback as existing tiles.
- Human meld area must not hide the hand or action bar in smartphone landscape.
- State shape should support CPU melds later even if CPU UI is minimal at first.

## Yaku Impact

Calling makes the hand open:

- Riichi becomes unavailable.
- Menzen tsumo becomes unavailable.
- Future closed-only yaku must check `isClosed` / `menzen`.
- Yakuhai remains valid when opened.

Tanyao decision:

- Recommendation: allow open tanyao for beginner friendliness.
- Rationale: it gives beginners an understandable open-hand path and avoids too many "shape is complete but no yaku" moments.
- Document this clearly as the app rule for now.

Out of scope:

- Fu.
- Open pinfu.
- Iipeikou and other closed-only yaku beyond existing minimal yaku.
- Kuikae.

## Riichi Relationship

- Riichi players cannot pon or chi.
- A player who has called cannot declare riichi.
- Riichi tsumogiri lock remains unchanged.
- Riichi players can still ron.
- Human call UI should not appear while human is in riichi.

## CPU Relationship

MVP-3.x should not add CPU calls.

However:

- `melds` must be generic.
- call validation helpers should accept any player id.
- UI can initially expose only human call actions.
- CPU call decisions can later reuse the same availability helpers.

## Test Plan

Core tests:

- Pon is available when human has two matching tiles.
- Pon is unavailable with only one matching tile.
- Pon is unavailable against the human's own discard.
- Pon is unavailable while human is in riichi.
- Pon removes two hand tiles and adds one meld.
- Pon sets `isClosed` / `menzen` false.
- Pon moves to human discard phase.
- Chi is available only from the upper player.
- Chi is unavailable from non-upper players.
- Chi is unavailable for honors.
- Chi returns multiple patterns when available.
- Chi removes selected two hand tiles and adds one meld.
- Chi sets `isClosed` / `menzen` false.
- Chi moves to human discard phase.
- After call and discard, turn advances to caller's next player.
- Called hand cannot declare riichi.
- Yakuhai pon can satisfy yaku.
- Open tanyao behavior follows the chosen app rule.

UI tests:

- Pon button appears in call reaction.
- Chi pattern buttons appear with tile previews.
- Skip button remains available.
- Call buttons do not appear during riichi.
- Meld area renders human pon/chi melds.
- Existing ron buttons are not broken.
- Existing next-round, result, all-hands, yaku-guide, waits, and discard zoom popups are not broken.

Layout tests:

- Add `pon-reaction` scenario.
- Add `chi-reaction` scenario with multiple chi patterns.
- Add `open-melds` scenario with at least two human melds.
- Confirm action bar is visible and tappable.
- Confirm human hand remains visible.
- Confirm meld area does not create page-level overflow.

## Suggested Implementation Order

1. MVP-3.1: Pon core + human pon UI.
2. MVP-3.2: Chi core + human chi UI.
3. MVP-3.3: Meld display and open-hand yaku stabilization.
4. MVP-3.4: Exact four-direction table layout, right-edge gear menu, rotated discard/meld tiles, and stronger landscape layout guard.
5. MVP-3.5: Advice / yaku-guide / waits adjustments for open hands if the new table layout needs more polish.
6. MVP-4.x: CPU pon / chi decision logic.
7. Later: Kan.

## Go / No-Go Conditions

Go:

- Current `main` is clean and published.
- MVP-3.0 plan is reviewed.
- Pon is implemented before chi.
- Scope stays human-only.
- Riichi and CPU win tests remain passing.

No-Go:

- Implementation starts before call state/action rules are agreed.
- CPU calls are pulled into MVP-3.1 or MVP-3.2.
- Kan or scoring enters the first call milestones.
- Smartphone landscape action bar becomes crowded without layout guard coverage.
- Existing riichi behavior regresses.
