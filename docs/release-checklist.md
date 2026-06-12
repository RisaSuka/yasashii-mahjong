# Release / Publish Checklist

Use this before merging to `main` or publishing with GitHub Pages.

## Current Release Candidate

- Branch: `codex/mvp-01-integration`
- Scope: MVP-0.1 through MVP-0.7.8
- Expected automated result: `135 pass / 0 pending / 0 fail`
- Push: not yet
- `main` merge: not yet

## Git Safety

- Confirm the current branch is `codex/mvp-01-integration`.
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

## Automated Checks

- Open `http://127.0.0.1:8765/tests/test-runner.html`.
- Confirm total count is 135.
- Confirm pass count is 135.
- Confirm fail count is 0.
- Confirm pending count is 0.
- Confirm `src/game/` has no DOM access except the localStorage boundary in `src/game/storage.js`.

## Core Functional Checks

- New round starts.
- Human player receives 14 tiles after dealer draw.
- CPU players show hand counts.
- Human can discard one tile.
- CPU players discard randomly.
- Turn returns to the human during normal play.
- Live wall reaches 0 in simulation or long manual play.
- Round ends with `exhaustive-draw`.
- Stats are saved to localStorage.
- Human tsumo win still works.
- Human ron win still works.
- No-yaku tsumo/ron is rejected with a beginner-friendly message.
- Winning result still shows yaku names, han, total han, explanations, and furigana.

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
- Tsumo, ron, and skip buttons are readable and tappable when they appear.
- No-yaku message is readable near the center status text.
- Exhaustive draw does not show a yaku summary.
- Win display does not show stale rejection messages.

## GitHub Pages Checks

- Confirm the app uses relative module paths.
- Confirm no local-only build step is required.
- Confirm `index.html` works from a static server.
- Confirm `tests/test-runner.html` works from a static server.
- Confirm there are no external dependencies that GitHub Pages must install.
- Confirm README describes the current MVP scope and known missing features.

## Do Not Release If

- Tests fail.
- Pending tests remain.
- Working tree is dirty.
- Browser smoke check has not been done.
- Push has not been approved.
- `main` merge has not been approved.
- New work accidentally includes point scoring, calls, riichi, furiten, dora, or other out-of-scope features.
