# MVP-0.1 Verification Log

Last updated: 2026-06-12 07:12 JST

## Environment

- Branch: `codex/mvp-01-integration`
- Local app URL: `http://127.0.0.1:8765/`
- Test runner URL: `http://127.0.0.1:8765/tests/test-runner.html`
- Static server command:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

## Automated Checks

Latest re-check after documentation and small UX adjustments:

- Browser-style test suite via module runner: 32 pass
- Exhaustive-draw simulation: pass
- Static server: HTTP 200
- `src/game/` DOM boundary: pass with expected `storage.js` exception

### Static server

Result: pass

- `/` returned HTTP 200
- `/tests/test-runner.html` returned HTTP 200
- `index.html` contains the app root
- `index.html` loads JavaScript with `type="module"`

### Browser-style test suite via module runner

Result: pass

```text
32 pass
```

Covered checks:

- 136 tiles are generated
- Tile ids are unique
- Dead wall has 14 tiles
- Live wall has 122 tiles
- All players receive 13 tiles
- Dealer has 14 tiles after initial draw
- Round starts with 69 live-wall tiles
- Discard changes hand/discard counts
- Draw changes wall/hand counts
- Turn order cycles correctly
- Empty live wall ends the round
- `CPU_DISCARD` discards one CPU tile
- Stats can be saved and loaded
- Broken saved stats fall back to defaults

### Exhaustive-draw simulation

Result: pass

```json
{
  "phase": "ended",
  "endReason": "exhaustive-draw",
  "wall": 0,
  "guard": 70,
  "roundsDrawn": 1
}
```

### `src/game/` DOM boundary

Result: pass with expected exception

- `window` appears only in `src/game/storage.js`
- No other `src/game/` module touches DOM APIs

## Manual / Visual Checks

Not yet completed with a real browser click-through in this session.

Reason:

- Playwright package resolution failed in the available tool environment.
- Static server and module-level game progression were verified instead.

Manual browser checks still recommended:

- Open `http://127.0.0.1:8765/`
- Start a new round
- Confirm the human hand appears at the bottom
- Click/tap one human tile
- Confirm CPU turns advance
- Confirm the table can progress to exhaustive draw
- Open `http://127.0.0.1:8765/tests/test-runner.html`
- Confirm the browser UI shows 32 pass
- Check smartphone width around 390px
- Confirm human tile buttons are easy to tap

## Current Known Limitations

- No win detection
- No yaku detection
- No scoring
- No calls
- No riichi
- No furiten
- No dora effect
- CPU discard is random
- Full real-browser click-through still needs manual confirmation
