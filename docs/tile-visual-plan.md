# Tile Visual Plan

## Goal

Make tile suits easier to recognize for beginners and older players without adding heavy assets or changing game logic.

## Chosen Approach

Use approach D:

- Base implementation: CSS-enhanced tile rendering.
- Structure: add suit-specific classes and inner labels in `render.js`.
- Future option: replace the inner tile content with SVG or static images later.
- No AI-generated production assets for this step.

This keeps the app small, GitHub Pages friendly, and easy to maintain.

## Suit Cues

- Manzu: red accent.
- Pinzu: blue accent.
- Souzu: green accent.
- Honors: dark accent and larger main character.
- All tiles: white face, clear border, bigger main text, generous spacing.

## Mobile And Large Tile Mode

- Human hand remains horizontally scrollable.
- Tap target size remains controlled by `.tile-button`.
- Large tile mode increases main text and suit label sizes.
- Discard tiles stay compact but keep suit color cues.

## AI Image Generation

AI image generation was not used for this implementation.

If used later, start with sample concepts only:

- 一萬
- 九萬
- 一筒
- 九筒
- 一索
- 九索
- 東
- 發
- 中

Production should still prefer CSS/SVG unless static images prove clearly better for readability.

## Yaku Display Order

Multiple yaku should be shown in this beginner-friendly order:

1. 役牌（ヤクハイ）
2. 断么九（タンヤオ）
3. 門前清自摸和（メンゼンツモ）
4. 七対子（チートイツ）
5. 対々和（トイトイ）
6. 国士無双（コクシムソウ）

Unknown yaku are kept after the known yaku and sorted by id for stable display.

## Out Of Scope

- Point calculation.
- New yaku.
- Calls.
- Riichi.
- Furiten.
- Dora.
- Local multiplayer.
- Network multiplayer.
