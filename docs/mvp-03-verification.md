# MVP-0.3 Verification Log

Last updated: 2026-06-12 JST

## Environment

- Branch: `codex/mvp-01-integration`
- Local app URL: `http://127.0.0.1:8765/`
- Test runner URL: `http://127.0.0.1:8765/tests/test-runner.html`
- Static server command:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

## Automated Checks

Result:

```text
44 pass / 0 pending / 0 fail
```

Verified areas:

- MVP-0.1 tile, wall, round, action, and storage behavior
- MVP-0.2 win-check behavior
- MVP-0.3 `DECLARE_TSUMO` behavior
- Exhaustive draw still ends the round with `endReason: "exhaustive-draw"`
- Tsumo win ends the round with `endReason: "win"`
- Tsumo win stores `winningResult.winnerId`
- Tsumo win stores `winningResult.winType: "tsumo"`
- Draw/discard/cpu discard do not progress after tsumo

## UI Checks

Module-level render check:

```json
{
  "hasButton": true,
  "hasMessage": true,
  "phase": "ended",
  "endReason": "win"
}
```

Static server:

- `/` returned HTTP 200

Syntax checks:

- `src/ui/render.js`: pass
- `src/main.js`: pass

## Manual Browser Status

Full real-browser click-through was not completed in this session.

Reason:

- The in-app Browser plugin was available as a skill, but its expected `scripts/browser-client.mjs` file was missing from the installed plugin directory.

Manual confirmation still recommended:

- Open `http://127.0.0.1:8765/`
- Start a new round
- Confirm normal discard and CPU progression
- Confirm `ツモ` button is absent for ordinary non-winning hands
- Confirm `ツモ` button appears for a human winning current hand
- Confirm clicking `ツモ` shows `あなたのツモ和了です`
- Open `http://127.0.0.1:8765/tests/test-runner.html`
- Confirm 44 pass / 0 pending / 0 fail
- Check smartphone width around 390px

## Current Known Limitations

- No point calculation
- No yaku detection
- No ron
- No chi, pon, kan
- No riichi
- No furiten
- No dora effect
- CPU discard remains random
- CPU tsumo is deterministic when available, not strategic

