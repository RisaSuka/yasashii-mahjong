# Future Table Layout Plan

This document records the longer-term smartphone landscape table layout direction. It is a planning note only. MVP-3.1.1 keeps implementation small and fixes the immediate pon-message and meld-overlap issues; the full table redesign is intentionally deferred.

## Goals

- Keep page-level scrolling off in smartphone landscape.
- Keep the human hand as the largest and most tappable area.
- Reserve separate areas for hand, discards, open melds, action buttons, table information, and future scores.
- Make pon/chi/riichi/result/scoring additions less likely to break the layout.
- Move toward a four-direction mahjong-table feeling without copying any existing app UI.
- Treat existing apps such as Mahjong Soul as layout inspiration only, not as a design to copy.

## Overall Landscape Regions

Smartphone landscape should eventually be divided into these regions:

- Top: a very thin header, or only a gear/menu entry.
- Center: the main mahjong table.
- Bottom: the human hand area.
- Right: a gear icon and optional vertical menu entry.
- Modal layer: settings, result, all-hands review, help, and other larger panels.

The page itself should not scroll. Horizontal scrolling is acceptable inside the human hand area when needed.

## Central Table Area

The center should become a compact table information panel surrounded by the four player areas.

The central table should eventually show:

- Current hand, such as `東1局`.
- Remaining wall count, such as `残り 45`.
- Current dealer.
- Seat labels for east, south, west, and north.
- Future scores:
  - `CPU1 30000 +5000`
  - `CPU2 25000`
  - `CPU3 25000`
  - `自分 25000`
- Riichi/dealer/current-turn highlights.

Until scoring exists, the score area can be a reserved layout concept or hidden placeholder. The important point is that future score display has a clear home and does not compete with the hand or open melds.

## Player Placement

The four players should be arranged around the central table.

- Human: bottom side.
- CPU1: right side.
- CPU2: top side.
- CPU3: left side.

Each player area should have dedicated zones for:

- Name or seat label.
- Discards.
- Open melds.
- Riichi status.
- Dealer status.
- Current-turn highlight.

CPU hands remain hidden during the hand. They are shown only after the hand ends through the learning-oriented all-hands review.

## Human Area Priority

The human hand is the highest priority visual element.

The human area should include:

- Human name or `自分`.
- Human hand.
- Human discards.
- Human open melds.
- Riichi status.
- Dealer status.
- Advice, riichi, wait, and yaku-guide highlights on relevant tiles.

The hand should use the widest available bottom area. Open melds must not overlap the hand. As pon and chi increase, the layout must keep a dedicated meld strip or side area from the start.

## Discard Orientation

Long term, each player discard zone can follow table orientation:

- Human discards: normal orientation.
- CPU1 discards: right-side orientation, possibly rotated.
- CPU2 discards: top-side orientation, possibly upside-down.
- CPU3 discards: left-side orientation, possibly rotated.

For MVP steps, readability is more important than strict rotation. The first redesign can keep all tiles upright while placing the discard zones in four directions. Rotation should be introduced only if real-device readability remains good.

## Open Melds

Open melds need their own reserved areas.

Suggested placement:

- Human melds: to the right of the human hand, or in a strip above the hand.
- CPU melds: near each CPU seat.

Rules for the layout:

- Melds must not overlap hands or discards.
- Melds should use the same SVG tile rendering as hands/discards.
- Meld labels such as `ポン` or `チー` are useful, but should stay compact.
- The called tile source indicator can be added later.

MVP-3.1.1 only fixes the immediate pon meld overlap. A more complete meld layout can be handled after chi is implemented.

## Riichi Display

Riichi should be visible without long center messages.

Possible indicators:

- Glow the riichi player's seat.
- Add a compact `リーチ` badge near the player.
- Highlight the player's central score/seat display.
- Later, show riichi sticks near the central score area.

The current compact riichi badge can remain until the full table redesign.

## Dealer Display

Dealer status should be visible at a glance.

Possible indicators:

- Glow the dealer seat.
- Emphasize the dealer's east/south/west/north marker in the center.
- Add a small `親` badge near the player's name or score.

This should replace long explanatory text where possible.

## Current Turn Display

The current turn should be shown with seat-level emphasis rather than long central text.

Possible indicators:

- Glow the current player's seat.
- Add a small `手番` badge or arrow.
- Emphasize the human hand area when it is the human turn.

Avoid returning to a large `あなたの番です。牌を選んでください` message in the center, because it consumes table space.

## Gear Menu

The current header buttons should eventually move into a gear menu.

Menu items:

- New game / new match.
- Large tile mode.
- Advice ON/OFF.
- Help.

The gear menu should open as a modal or compact side panel only when needed. This lets the table and human hand use more of the landscape viewport during normal play.

## Advice, Yaku Guide, Waits, and Learning Buttons

The helper controls should remain near the human hand, but not crowd it.

Controls include:

- Advice.
- Yaku guide.
- Waits.
- Result.
- All-hands review.

If the row becomes crowded, future versions should group some helpers into a compact helper menu.

## Result Modal Direction

After a hand or match ends, avoid permanently covering the table with a large result card.

Preferred direction:

- Show compact action buttons such as `結果を見る`, `みんなの手を見る`, and `次の局へ`.
- Open a result modal on demand.
- The result modal can later include winner, win type, yaku, points, score changes, all-hands review, and next-round action.

This keeps the normal table layout stable even as result details grow.

## Immediate MVP-3.1.1 Fixes

Before larger redesign work, fix these concrete issues:

- Clear the `ポンしました。捨てる牌を選んでください。` guidance after the caller discards.
- Move the human pon meld display so it does not overlap human hand tiles.
- Keep a minimum separation between the meld area and the hand area.
- Strengthen `open-melds` layout check so meld/hand overlap is detected.

## Future Implementation Order

Recommended staged path:

1. MVP-3.1.1
   - Fix post-pon guidance persistence.
   - Fix human meld/hand overlap.
   - Document this future table layout plan.
   - Strengthen open-melds layout guard.
2. MVP-3.2
   - Chi core and human chi UI.
3. MVP-3.3
   - Stabilize open-meld display and post-call UI after pon/chi.
4. MVP-3.4
   - Implement the first exact four-direction central table layout.
   - Hide the active-round header and move table controls into the right-edge gear menu.
   - Rotate discard/meld tile graphics by seat direction while keeping labels and buttons upright.
   - MVP-3.4.2 correction: keep CPU seats as small markers, use a central score board as the visual anchor, order each river locally as a 6x3 grid before whole-river rotation, keep the human hand nearly full-width with tight tile gaps, and reserve separate hand/meld/action/support/gear areas.
5. MVP-3.5
   - Continue polish of the gear menu and compact table controls if more actions are added.
6. MVP-4.x
   - CPU calls, kan, scoring display, and scoring calculation.

## Go / No-Go Conditions For The Redesign

Go when:

- Human hand remains tappable on 780x360 through 932x430 landscape viewports.
- Discards, open melds, and helper buttons have separate zones.
- Page-level overflow stays within layout-check limits.
- Pon/chi/reaction controls remain visible and tappable.
- The design can show future score and result information without covering the hand.

No-go when:

- The human hand is reduced too much.
- Open melds overlap hand tiles.
- The center panel grows vertically again.
- Header controls compete with table space.
- The design depends on copying another app's exact UI.
