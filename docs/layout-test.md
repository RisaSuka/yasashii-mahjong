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
- `river-order-fixture`: each player has 18 discards and the guard checks local 6x3 river order before rotation
- `draw-ended`: each player has 18 discards and the hand is ended by exhaustive draw
- `actions`: action buttons and the advice popup are visible
- `discard-zoom`: the human discard zoom popup is open with 18 discards
- `match-ended`: the East-only match end summary is visible
- `result-popup`: the East-only match result popup is open
- `yaku-guide`: the beginner hand-yaku guide popup is open
- `waits`: the tenpai/wait helper popup is open
- `waits-after-discard`: the discard-to-wait helper section is open
- `riichi-ready`: the human riichi action is visible
- `riichi-declared`: the human riichi status/tsumogiri state is visible
- `cpu-riichi`: a CPU riichi seat badge is visible
- `pon-reaction`: the human pon reaction action is visible
- `chi-reaction`: the human chi reaction candidate buttons are visible and clickable
- `open-melds`: an open pon meld is visible near the human seat and does not overlap human hand tiles
- `multiple-melds`: multiple human melds are visible in a horizontal meld area and do not overlap human hand tiles
- `open-tanyao-win`: an open chi/tanyao win result remains inside the landscape layout
- `open-yakuhai-win`: an open yakuhai win result remains inside the landscape layout
- `cpu-win`: a CPU win result is visible with the next-round action
- `all-hands-open`: the round-end all-hands learning popup is open
- `settings-menu-open`: the right-edge gear menu is open and its modal fits inside the viewport
- `gear-menu-open`: the gear menu is open and menu controls are hit-tested
- `assist-buttons-open`: advice, yaku, and waits helper buttons remain visible and hit-tested
- `call-reaction-buttons`: call trigger buttons can open their candidate modal
- `riichi-action-buttons`: riichi action controls remain visible and hit-tested
- `cpu-pon`: CPU pon meld lane is visible after a CPU pon setup
- `cpu-chi`: CPU chi meld lane is visible after a CPU chi setup
- `cpu-open-melds`: CPU open melds stay in the CPU meld lane
- `cpu-pon-yakuhai-win`: CPU open yakuhai win result fits the table
- `cpu-chi-tanyao-win`: CPU open tanyao chi win result fits the table
- `multiple-cpu-melds`: CPU1/CPU2/CPU3 meld lanes stay separated from rivers, seats, actions, and the human hand

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
- MVP-3.4 changes the active match screen to the four-direction table layout. The guard now verifies that the active-round header is not rendered, the gear button/menu are inside the viewport, CPU1/CPU2/CPU3/human seats occupy right/top/left/bottom positions, discard zones surround the center table, discard tiles rotate by seat direction, human hand tiles remain visible, action bars do not cover the hand, and meld strips do not overlap hand tiles.
- MVP-3.4.1 strengthens the guard for the hand-drawn table redo. It checks that CPU1/CPU3 seats stay below 12% viewport width, CPU2 stays below 12% viewport height, the gear button stays compact, the center score board remains near the table center, the human hand uses at least 70% viewport width, all four rivers sit above/left/right/below the center board, rotated discard tiles remain visibly large enough, and the old giant CPU band/column layout cannot return.
- MVP-3.4.2 tightens the hand-drawn reference checks further. It lowers side CPU marker limits to 8% viewport width, verifies the human hand uses at least 90% viewport width with a 0-2px tile gap, verifies all four fixed score values are visible inside the center score board, verifies each river is a local 6x3 grid ordered left-to-right/top-to-bottom before whole-river rotation, checks compact `推` recommendation badges, and keeps action/meld/support areas from covering the bottom hand.
- MVP-3.4.4 connects the approved exact-table mock to the live app renderer. The guard now also verifies the generated app screenshots, page scrollWidth/scrollHeight, top-right gear placement, center score-board element separation, score/river non-overlap, rotated river visibility, hand tile height/aspect/gap, and action/support/meld separation across all active scenarios.
- MVP-3.5 adds operation-polish hit-tests. The guard checks gear button clickability, gear menu item clickability, advice/yaku/waits helper clickability, call trigger click-to-open behavior, modal exclusivity, and the new `gear-menu-open`, `assist-buttons-open`, `call-reaction-buttons`, and `riichi-action-buttons` scenarios.
- MVP-4.1 adds CPU pon/open-meld scenarios. The guard checks CPU meld lanes for right/top/left seats, seat-direction meld rotation, no overlap with CPU rivers, no overlap with the human hand or action area, and no page-level overflow after CPU pon or CPU open yakuhai win states.
- MVP-4.2 adds CPU chi/open-tanyao scenarios. The guard keeps the same CPU meld-lane geometry checks while verifying `chi` melds and mixed pon/chi CPU melds render in the four-direction table without covering rivers, seats, actions, or the human hand.
- MVP-1.9 adds the `waits-after-discard` scenario for 14-tile discard-to-wait guidance.
- MVP-2.1 adds `riichi-ready` and `riichi-declared` scenarios so the riichi action/status stay inside the smartphone landscape action bar.
- MVP-2.2 adds the `cpu-riichi` scenario so a CPU riichi seat badge stays inside the smartphone landscape table.
- MVP-3.1 adds `pon-reaction` and `open-melds` scenarios so pon/skip actions and the human meld area stay inside the smartphone landscape table.
- MVP-3.1.1 strengthens `open-melds` so a human meld overlapping human hand tiles fails the guard instead of slipping through as a visual-only problem.
- MVP-3.2 adds `chi-reaction` and `multiple-melds` scenarios so chi candidate buttons are clickable and multiple horizontal melds stay separated from the human hand.
- MVP-3.3 adds `open-tanyao-win` and `open-yakuhai-win` scenarios so open-hand win results and next-round actions stay inside the smartphone landscape table.
- MVP-1.8 adds the `cpu-win` scenario. It checks that a CPU win display and the next-round action remain inside the smartphone landscape viewport.
- MVP-1.9 adds the `waits-after-discard` scenario. It checks that discard-to-wait rows, wait tiles, and the close button stay inside the waits popup in smartphone landscape.
- MVP-1.9.1 adds the `all-hands-open` scenario. It checks that the all-hands dialog, close button, and four player hand sections stay inside the smartphone landscape viewport without page-level overflow.
- MVP-2.0 keeps the same scenarios after switching primary tile faces to handmade SVG assets, so the guard catches tile-size regressions in the hand, discard ring, zoom popup, all-hands popup, yaku guide, and waits popup.

The earlier MVP-1.1.4 guard intentionally detected late-hand discard clipping at discard tile 13 and later. MVP-1.1.6 fixes that known failure by fitting the landscape discard grids for 18-tile late-hand states.

## Release Gate Recommendation

Before merging a future table UI or layout fix:

1. Run `tests/test-runner.html` and confirm the normal browser tests pass.
2. Run `tests/layout-check.mjs`.
3. If layout check fails, inspect the reported viewport/scenario and screenshot in `test-artifacts/layout/`.
4. Confirm the failure is either fixed or explicitly accepted as a documented limitation.
