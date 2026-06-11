# Release / Publish Checklist

Use this before pushing or merging to `main`.

## Git Safety

- Confirm the current branch.
- Confirm the working tree is clean.
- Confirm the latest commit is the intended release candidate.
- Confirm no unreviewed local commits are being skipped.
- Confirm the user explicitly approved push.
- Confirm the user explicitly approved merge to `main`.

Commands:

```powershell
git status --short --branch
git log --oneline -10
git branch --list
```

## MVP-0.1 Functional Checks

- New round starts.
- Human player receives 14 tiles after dealer draw.
- CPU players show hand counts.
- Human can discard one tile.
- CPU players discard randomly.
- Turn returns to the human.
- Live wall reaches 0 in simulation.
- Round ends with `exhaustive-draw`.
- `roundsStarted` is saved.
- `roundsDrawn` is saved.
- `lastPlayedAt` is saved.

## Automated Checks

Expected:

```text
20 pass
```

Also confirm:

- Static server returns HTTP 200 for `/`.
- Static server returns HTTP 200 for `/tests/test-runner.html`.
- `src/game/` has no DOM access except `src/game/storage.js`.

## Manual Browser Checks

Use:

```text
http://127.0.0.1:8765/
```

Check:

- Desktop layout is usable.
- Smartphone width is usable.
- Human hand is easy to find.
- Human tiles are easy to tap.
- Disabled tiles look disabled.
- Large tile mode makes the human hand easier to tap.
- Current status text is readable.

## Do Not Release If

- Tests fail.
- Working tree is dirty.
- Real browser smoke check has not been done and the user expects a polished release.
- Any MVP-0.2 implementation code slipped into MVP-0.1.
- Push or `main` merge has not been approved.

