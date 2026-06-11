# MVP-0.1 Architecture Notes

## Core Boundary

MVP-0.1 is split into three layers:

```text
UI input -> dispatchAction(state, action) -> game state -> renderGame(state)
```

The important rule is that only the game layer changes game state.

## Game Layer

Location:

```text
src/game/
```

Responsibilities:

- Generate tiles
- Build and shuffle the live wall and dead wall
- Create players
- Start a round
- Deal 13 tiles to all players
- Draw the dealer's first tile
- Discard
- Draw
- Advance turns
- End by exhaustive draw
- Save and load stats

DOM rule:

- No DOM access in `src/game/`
- The only browser API exception is `localStorage` in `src/game/storage.js`

## UI Layer

Location:

```text
src/ui/
src/main.js
styles/
index.html
```

Responsibilities:

- Render the current `gameState`
- Bind button and tile events
- Dispatch actions
- Schedule CPU turns
- Re-render after state changes

The UI must not directly mutate arrays such as `hand`, `wall`, or `players`.

## Test Layer

Location:

```text
tests/
```

Responsibilities:

- Run in the browser without external libraries
- Validate game APIs
- Make missing APIs obvious
- Keep acceptance tests close to MVP scope

Current expected result:

```text
32 pass
```

## Turn Flow

At round start:

1. Create 136 tiles.
2. Split 14 tiles into dead wall.
3. Keep 122 tiles as live wall.
4. Deal 13 tiles to each player.
5. Dealer draws one tile.
6. Dealer starts in `discard` phase.

During play:

1. Current player discards.
2. Turn advances.
3. Next player draws.
4. If the live wall is empty, the round ends by exhaustive draw.
5. If next player is CPU, CPU randomly discards after a short delay.
6. If next player is human, UI waits for a tile tap.

## Stats

Saved in `localStorage`:

- `roundsStarted`
- `roundsDrawn`
- `lastPlayedAt`

Storage key:

```text
jun-chan-mahjong:stats
```

## Known MVP-0.1 Limitations

- No win detection
- No yaku detection
- No scoring
- No chi, pon, or kan
- No riichi
- No furiten
- No dora effect
- CPU discard is random
