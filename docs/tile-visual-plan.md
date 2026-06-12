# Tile Visual Plan

## Goal

Make tile suits easier to recognize for beginners and older players while keeping the app small, static, and easy to maintain.

## Current Choice

Use CSS tiles for now.

Reasons:

- No image loading is required.
- GitHub Pages can serve the app as-is.
- The design can be adjusted quickly with CSS.
- The tile data structure does not need to change.
- The UI can still be refactored later to SVG or image assets.

## DOM Structure

The current tile markup is intentionally asset-friendly:

```text
tile
  tile-face
    tile-symbol
    tile-helper
      tile-visual-cue
      tile-suit-label
```

This structure supports three future paths:

- CSS tile: current implementation.
- SVG tile: replace `tile-face` content with inline SVG or an SVG component.
- Image tile: replace `tile-face` content with an image while keeping the outer tile shell and sizing rules.

## Current CSS Tile Design

- Slightly tall tile shape.
- White tile face.
- Outer shell with shadow and bottom thickness.
- Large main symbol.
- Small suit label.
- Compact visual cue:
  - Manzu: red accent and `萬`.
  - Pinzu: blue accent and `○`.
  - Souzu: green accent and `┃`.
  - Honors: dark accent and `字`.
- Discard tiles stay compact but keep the suit color cue.
- Large tile mode increases both the main symbol and the helper cue.

## Mobile And Large Tile Mode

- Human hand remains horizontally scrollable.
- Tile buttons keep their tap target size.
- Tiles use `flex: 0 0 auto` so they do not collapse in horizontal scroll.
- Large tile mode grows tile width, tile height, and symbol size together.

## Future SVG / Image Direction

Before replacing CSS tiles with assets:

- Test representative tiles first, not all 34 kinds.
- Confirm visual consistency across suits.
- Confirm readability at normal size, discard size, and large tile mode.
- Confirm license and ownership of all assets.
- Confirm the asset naming and lookup table are maintainable.
- Confirm the app still works on GitHub Pages without a build step.

Representative tiles for design checks:

- 一萬
- 九萬
- 一筒
- 九筒
- 一索
- 九索
- 東
- 發
- 中

## AI Image Generation

AI image generation was not used for the current implementation.

If used later:

- Use it only for design exploration first.
- Do not immediately generate and ship all 34 tile assets.
- Compare generated samples against CSS/SVG for readability and consistency.
- Do not use AI output as production assets until license, consistency, and maintainability are reviewed.

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

- Production image assets.
- Full 34-kind SVG tile set.
- AI-generated assets shipped directly.
- Point calculation.
- New yaku.
- Calls.
- Riichi.
- Furiten.
- Dora.
- Local multiplayer.
- Network multiplayer.
