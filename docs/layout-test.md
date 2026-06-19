# Smartphone Landscape Layout Check

This document records the MVP-1.1 layout guard for smartphone landscape regressions.

The goal is not pixel-perfect visual regression testing yet. The first goal is to catch obvious layout breakage before another real-device Safari check:

- page-level horizontal overflow
- page-level vertical overflow
- discard zones clipped by their containers
- human hand tiles clipped vertically
- recommended discard badges clipped
- important action buttons outside the viewport or not clickable at their center
- advice button outside the viewport or not clickable
- advice popup outside the viewport
- large overlaps between discard zones, the hand, and center information

## Tooling

The layout check uses a dependency-free Chrome DevTools Protocol script:

```text
tests/layout-check.mjs
```

It starts a temporary static file server, launches local Chrome in headless mode, drives the app through Chrome DevTools Protocol, saves screenshots, and reports layout failures.

No Playwright or Puppeteer package is required. Chrome must be installed locally.

If Chrome is installed in a non-standard location, set:

```powershell
$env:CHROME_PATH="C:\Path\To\chrome.exe"
```

## Run Command

With a normal Node.js installation:

```powershell
node tests/layout-check.mjs
```

In the Codex desktop workspace, the bundled Node runtime can be used:

```powershell
& "C:\Users\kurop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\layout-check.mjs
```

The script starts its own local server on:

```text
http://127.0.0.1:18765/
```

The port can be changed with:

```powershell
$env:LAYOUT_CHECK_PORT=18766
```

## Viewports

The check currently covers:

- `844x390`
- `896x414`
- `932x430`
- `812x375`
- `780x360`

These approximate common smartphone landscape browser viewports, including tighter Safari-height cases.

## Scenarios

The check renders these scenarios:

- `early`: each player has 3 discards
- `mid`: each player has 9 discards
- `late`: each player has 18 discards
- `draw-ended`: each player has 18 discards and the hand is ended by exhaustive draw
- `actions`: action buttons and the advice popup are visible
- `discard-zoom`: the human discard zoom popup is open with 18 discards
- `match-ended`: the East-only match end summary is visible
- `result-popup`: the East-only match result popup is open
- `yaku-guide`: the beginner hand-yaku guide popup is open
- `waits`: the tenpai/wait helper popup is open
- `cpu-win`: a CPU win result is visible with the next-round action

## Screenshots

Screenshots are saved to:

```text
test-artifacts/layout/
```

Examples:

```text
test-artifacts/layout/844x390-early.png
test-artifacts/layout/844x390-late.png
test-artifacts/layout/896x414-draw-ended.png
```

`test-artifacts/` is intentionally ignored by git.

## Current Result

As of MVP-1.1.6, the regular browser tests pass and the layout check passes across all target viewports and scenarios.

- `late` and `draw-ended` render 18 discards for north, west, south, and east without discard clipping.
- Page-level horizontal and vertical overflow remain within the guard limits.
- Important action/advice controls remain visible and clickable.
- MVP-1.2 adds the `discard-zoom` scenario. It checks that the zoom dialog, close button, and 18 enlarged discard tiles fit within the smartphone landscape viewport.
- MVP-1.3 adds `match-ended` and `result-popup` scenarios. They check that the end summary, replay/result actions, result dialog, close button, and four history entries fit within the smartphone landscape viewport.
- MVP-1.4 keeps the existing layout scenarios and adds a compact beginner help popup. If future help content grows, add a dedicated `beginner-help-open` scenario before merging the UI change.
- MVP-1.5.1 keeps ron/reaction controls covered by the existing `actions` scenario, which renders the table action bar with ron/skip style controls in smartphone landscape.
- MVP-1.6 adds the `yaku-guide` scenario. It checks that the guide dialog, close button, and CSS-tile completion examples fit within the smartphone landscape viewport.
- MVP-1.7 adds the `waits` scenario. It checks that the waits dialog, close button, and wait tiles fit within the smartphone landscape viewport.
- MVP-1.8 adds the `cpu-win` scenario. It checks that a CPU win display and the next-round action remain inside the smartphone landscape viewport.
- MVP-1.9 adds the `waits-after-discard` scenario. It checks that discard-to-wait rows, wait tiles, and the close button stay inside the waits popup in smartphone landscape.

The earlier MVP-1.1.4 guard intentionally detected late-hand discard clipping at discard tile 13 and later. MVP-1.1.6 fixes that known failure by fitting the landscape discard grids for 18-tile late-hand states.

## Release Gate Recommendation

Before merging a future MVP-1.1 layout fix:

1. Run `tests/test-runner.html` and confirm the normal browser tests pass.
2. Run `tests/layout-check.mjs`.
3. If layout check fails, inspect the reported viewport/scenario and screenshot in `test-artifacts/layout/`.
4. Confirm the failure is either fixed or explicitly accepted as a documented limitation.
