# AGENTS.md

## 1. Project Overview

This project is a browser-based four-player riichi mahjong web app. Development is incremental. The first milestone, MVP-0.1, focuses on making a four-player table progress correctly to an exhaustive draw without win detection.

The app must remain deployable as static files on GitHub Pages.

## 2. Final Goal

- Runs in the browser
- Supports PC and smartphone layouts
- Human 1 player vs CPU 3 players
- Supports tonpuu and hanchan in later milestones
- Implements riichi mahjong rules over time
- Eventually supports tsumo, ron, chi, pon, kan, riichi, dora, ura-dora, furiten, yaku detection, scoring, and CPU AI
- Includes a large tile mode that is easy for older users to see and tap
- Saves stats in `localStorage`

## 3. Current State

MVP-0.1 has been integrated on `codex/mvp-01-integration`.

Playable MVP-0.1 baseline commit:

```text
72b1dda Integrate MVP 0.1 playable table
```

Later documentation and planning commits may exist on top of that baseline. Always run `git log --oneline -5` and `git status --short --branch` before continuing.

Known verification:

- Browser-oriented test suite: 20 pass
- Exhaustive-draw simulation succeeds
- No push has been performed
- No merge into `main` has been performed

## 4. MVP-0.1 Scope

MVP-0.1 includes:

- Static HTML/CSS/JavaScript only
- No external libraries
- GitHub Pages compatible structure
- 136 tile generation
- 14-tile dead wall separation
- 122-tile live wall
- Shuffle
- Four players
- 13-tile initial deal to all players
- Dealer initial draw to 14 tiles
- Human discard from hand
- Random CPU discards
- Turn order: east, south, west, north, east
- Exhaustive draw when the live wall reaches 0
- Minimal four-player table UI
- Smartphone-friendly human hand controls
- `localStorage` stats for rounds started, drawn rounds, and last played time
- Browser-based simple test runner

## 5. Out Of Scope For MVP-0.1

Do not add these in MVP-0.1:

- Win detection
- Yaku detection
- Scoring
- Chi, pon, kan
- Riichi
- Furiten
- Dora effects
- Ura-dora
- Real CPU AI
- Full tonpuu or hanchan progression
- Decorative animations or complex visual polish

## 6. Directory Responsibilities

- `src/game/`: game rules, state transitions, tile/wall/player/round logic, storage helpers, CPU discard logic
- `src/game/cpu/`: CPU behavior for MVP-level random discard
- `src/ui/`: DOM rendering and input binding
- `styles/`: layout, board, tile, and responsive CSS
- `tests/`: browser-runnable tests and test helpers
- `docs/`: product, agent, and design documentation
- `README.md`: user-facing project overview and run instructions
- `AGENTS.md`: common rules for Codex agents

## 7. `src/game/` DOM Rule

`src/game/` must not touch the DOM.

Allowed:

- Pure game state transformations
- Data creation and validation
- Random tile selection when injected or isolated
- `localStorage` access only in `src/game/storage.js`

Forbidden outside `src/game/storage.js`:

- `document`
- `window`
- DOM queries or DOM mutation
- UI rendering
- Event listeners

## 8. UI And Action Rule

The UI must render from `gameState`.

UI files must not directly mutate game state. For example, UI code must not directly call `hand.push`, `hand.splice`, `wall.shift`, or edit player arrays.

All gameplay operations must go through:

```js
dispatchAction(state, action)
```

UI responsibilities:

- Render the current `gameState`
- Bind clicks/taps
- Dispatch actions
- Re-render after state changes
- Keep controls understandable and tappable

Game responsibilities:

- Change state
- Enforce turn progression
- Deal, draw, discard, and end round
- Save/load stats

## 9. Test Policy

Tests live in `tests/` and use no external libraries.

The browser test runner is:

```text
tests/test-runner.html
```

Core expected tests:

- 136 tiles are generated
- Tile ids are unique
- Dead wall has 14 tiles
- Live wall has 122 tiles
- All players receive 13 tiles
- Dealer has 14 tiles after initial draw
- Live wall has 69 tiles at round start after deal and dealer draw
- Discard reduces hand by 1 and increases discards by 1
- Draw reduces live wall by 1 and increases hand by 1
- Turn order cycles 0, 1, 2, 3, 0
- Empty live wall ends in exhaustive draw
- `CPU_DISCARD` discards one CPU tile
- Stats save/load works
- Broken stored stats fall back to defaults

Before integration or handoff, run the test runner or the equivalent module-based verification and report the result.

## 10. Safety Rules

- Do not push unless the user explicitly approves.
- Do not merge into `main` unless the user explicitly approves.
- Do not add MVP-0.1 out-of-scope features.
- Do not revert user changes or unrelated agent changes.
- Keep work small and commit by purpose.
- Respect assigned file ownership.
- If a branch has uncommitted changes, resolve or report before switching tasks.
- Prefer minimal fixes during integration.
- Keep GitHub Pages compatibility.
- Keep external library usage at zero for MVP-0.1.

## 11. Agent A: Game Core

Agent A owns game logic.

Primary responsibilities:

- `createTiles()`
- `buildWall(tiles)`
- `createInitialGameState()`
- `startRound(state)`
- `dispatchAction(state, action)`
- `createDefaultStats()`
- `loadStats(storage?)`
- `saveStats(stats, storage?)`
- Tile generation
- Wall/dead wall split
- Initial deal
- Dealer initial draw
- Discard
- Draw
- Turn advance
- CPU discard action
- Exhaustive draw
- Large tile setting action
- Stats reset

## 12. Agent B: UI Board

Agent B owns the app screen and player interaction.

Primary responsibilities:

- Four-player table layout
- Human hand display
- CPU hand count display
- Discard display
- Current turn display
- Live wall count
- Dead wall count
- Dora indicator display frame
- Exhaustive draw message
- New round button
- Large tile mode toggle
- Smartphone layout
- Human tile click/tap dispatching `DISCARD_TILE`
- CPU turn scheduling through actions

Agent B should follow `docs/design-review.md`.

## 13. Agent C: Test Runner

Agent C owns the test harness.

Primary responsibilities:

- Browser-based test runner
- `assertEqual`, `assertTrue`, and related helpers
- Clear pass/fail/pending reporting
- MVP-0.1 acceptance tests
- Tests against expected game APIs

Agent C must not change production logic to make tests pass.

## 14. Agent D: Design / UX Reviewer

Agent D owns review and guidance, not implementation.

Primary responsibilities:

- Research accessibility and mobile UI guidance
- Review the board UI for readability and tap safety
- Document guidance in `docs/design-review.md`
- Give concrete instructions to Agent B
- Keep recommendations within MVP-0.1 scope

Agent D should not change implementation files unless explicitly asked.

## 15. Integration Owner

The integration owner coordinates branches and verifies the combined app.

Primary responsibilities:

- Start from the agreed base branch
- Merge Agent C, Agent D, Agent A, and Agent B work in the agreed order
- Run tests after game core integration
- Make only minimal integration fixes
- Verify local static serving
- Verify round progression to exhaustive draw
- Update README when run instructions change
- Commit integration result
- Do not push or merge to `main` without approval

## 16. Files Each Agent May Touch

Agent A may touch:

- `src/game/tiles.js`
- `src/game/wall.js`
- `src/game/player.js`
- `src/game/round.js`
- `src/game/actions.js`
- `src/game/storage.js`
- `src/game/cpu/random-cpu.js`

Agent B may touch:

- `index.html`
- `styles/base.css`
- `styles/board.css`
- `styles/tiles.css`
- `styles/responsive.css`
- `src/main.js`
- `src/ui/render.js`
- `src/ui/input.js`

Agent C may touch:

- `tests/test-runner.html`
- `tests/test.js`
- `tests/tiles.test.js`
- `tests/wall.test.js`
- `tests/round.test.js`
- `tests/actions.test.js`
- `tests/storage.test.js`

Agent D may touch:

- `docs/design-review.md`

Integration owner may touch:

- Files required to resolve integration issues
- `README.md`
- Documentation needed to reflect the integrated state

## 17. Files Each Agent Must Not Touch

Agent A must not touch:

- `src/ui/**`
- `styles/**`
- `index.html`
- `tests/**`

Agent B must not touch:

- `src/game/**`
- `tests/**`

Agent C must not touch:

- `src/game/**`
- `src/ui/**`
- `styles/**`
- `index.html`

Agent D must not touch:

- `src/game/**`
- `src/ui/**`
- `styles/**`
- `index.html`
- `tests/**`

All agents must avoid unrelated files unless the user explicitly changes the assignment.

## 18. Before Starting MVP-0.2

Before MVP-0.2 begins, confirm:

- Current branch and latest commit
- Working tree is clean
- No unapproved push has happened
- No unapproved merge to `main` has happened
- Browser test runner still passes
- Exhaustive-draw simulation still succeeds
- `src/game/` still avoids DOM access except `storage.js`
- Smartphone hand controls remain tappable
- `localStorage` stats still update for round start and exhaustive draw
- MVP-0.2 scope is written down before implementation
- Any new feature is backed by tests before or alongside implementation
