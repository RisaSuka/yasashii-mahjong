# Smartphone Landscape UI Plan

This note records the MVP-0.8 landscape layout direction. It is inspired by common smartphone mahjong table layouts, but it must remain this app's own beginner-friendly design.

## Goal

- Recommend landscape orientation for regular smartphone play.
- Keep portrait usable enough for quick checks.
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

## Discard Advice In Landscape

- Keep the first recommendation easy to read with a reason.
- Keep the second and third recommendations compact.
- Preserve suggested tile highlighting on the hand.
- Do not let advice cover or crowd the hand.
- OFF means the advice panel is fully hidden.

## Portrait Behavior

Portrait remains supported, but it shows a gentle hint:

`スマホを横向きにすると、牌とボタンが見やすくなります。`

The hint should not block tile taps or action buttons.

## Not In Scope

- Copying another mahjong app's visual design.
- Adding image tile assets.
- Changing `src/game/**` logic.
- Adding point calculation, new yaku, calls, riichi, furiten, dora, or multiplayer.
