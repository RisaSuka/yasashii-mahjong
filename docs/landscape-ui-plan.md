# Smartphone Landscape UI Plan

This note records the MVP-0.8 landscape layout direction. It is inspired by common smartphone mahjong table layouts, but it must remain this app's own beginner-friendly design.

## Goal

- Recommend landscape orientation for regular smartphone play.
- Keep portrait usable enough for quick checks.
- Make smartphone landscape as close to one-screen play as practical.
- Avoid page-level vertical and horizontal scrolling in landscape.
- Prioritize the human hand at the bottom.
- Keep CPU seats around the table: top, left, and right.
- Keep table status, wall counts, dora frame, win messages, and discard advice in the center.
- Keep tap targets large enough for beginners and older players.

## Layout Direction

- Top: one CPU seat.
- Left: one CPU seat.
- Right: one CPU seat.
- Center: status, wall count, dead wall count, dora indicator, win/no-yaku messages, and discard advice.
- Bottom: human hand, human discards, and action buttons.

Current implementation uses responsive CSS only. It does not change `src/game/**`, tile data, or the discard advice core.

## One-Screen Landscape Priorities

- The page itself should not scroll in smartphone landscape.
- If all human tiles cannot fit, only the human hand area may scroll horizontally.
- CPU seats should be compact enough to frame the table without stealing space.
- The center panel should show only the most important state and advice.
- Footer stats may be visually compressed in landscape because live play depends more on the center panel and hand.
- Action buttons should stay tappable, but not dominate the center.

## Discard Advice In Landscape

- Keep the first recommendation easy to read with a reason.
- Keep the second and third recommendations compact.
- Preserve suggested tile highlighting on the hand.
- Do not let advice cover or crowd the hand.
- OFF means the advice panel is fully hidden.
- Current CSS keeps the first advice reason visible and hides secondary reasons on compact mobile layouts.

## Portrait Behavior

Portrait remains supported, but it shows a gentle hint:

`スマホを横向きにすると、牌とボタンが見やすくなります。`

The hint should not block tile taps or action buttons.

## Not In Scope

- Copying another mahjong app's visual design.
- Adding image tile assets.
- Changing `src/game/**` logic.
- Adding point calculation, new yaku, calls, riichi, furiten, dora, or multiplayer.

## Table-Like Visual Phases

Phase 1: Smartphone landscape one-screen play

- Fit the top CPU, side CPUs, center information, and bottom human hand into one viewport.
- Prevent page-level vertical and horizontal scrolling.
- Keep human hand scrolling inside the hand strip only when needed.

Phase 2: Green table background and center table panel

- Add a calm green table surface.
- Keep contrast high for older players.
- Use a simple center panel for status, wall counts, dora, advice, and win messages.

Phase 3: Table-style discard and wall placement

- Move discards visually closer to the center.
- Keep wall/dead-wall information readable without drawing a complex physical wall.
- Avoid realistic decoration that makes tile meaning harder to read.

Phase 4: SVG/image tile prototypes

- Prototype representative tiles first: 1-man, 9-man, 1-pin, 9-pin, 1-sou, 9-sou, east, hatsu, chun.
- Compare CSS tiles, SVG tiles, and image tiles for readability and maintenance.
- Do not introduce 34 production assets until the prototype is clearly better.

Phase 5: Beginner help integrated with the table

- Add short explanations near the relevant table area.
- Keep the help optional or collapsible.
- Preserve the current gentle wording style for beginners and older players.
