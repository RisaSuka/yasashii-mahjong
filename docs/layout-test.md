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

## Current Known Failures

As of MVP-1.1.4 layout-test setup, the regular browser tests pass, but the new layout check correctly detects the known real-device problem:

- `late` and `draw-ended` fail across all target viewports.
- North, west, south, and east discard zones clip discard tile 13 and later.
- This matches the Safari real-device issue where late-hand discards are visually cut off or appear to disappear.

This is expected for the first layout-check commit. The next UI fix should make these checks pass or update the check only if the product intentionally changes the display rule.

## Release Gate Recommendation

Before merging a future MVP-1.1 layout fix:

1. Run `tests/test-runner.html` and confirm the normal browser tests pass.
2. Run `tests/layout-check.mjs`.
3. If layout check fails, inspect the reported viewport/scenario and screenshot in `test-artifacts/layout/`.
4. Confirm the failure is either fixed or explicitly accepted as a documented limitation.
