# Manual Test Checklist

Use this checklist after starting the local static server.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

App URL:

```text
http://127.0.0.1:8765/
```

Test runner URL:

```text
http://127.0.0.1:8765/tests/test-runner.html
```

## 1. Desktop App Check

- Open the app URL.
- Confirm the title is visible.
- Confirm the new round button is visible.
- Click `新規局開始`.
- Confirm the center status shows the human turn.
- Confirm the human hand has 14 tiles.
- Confirm CPU hands show tile counts.
- Confirm live wall count is shown.
- Confirm dead wall count is shown.
- Confirm dora indicator frame is shown.
- Click one human tile.
- Confirm the human discard count increases.
- Wait for CPU turns.
- Confirm CPU discard counts increase.
- Confirm the turn returns to the human.

## 2. Tsumo Check

Because normal shuffled play may not quickly produce a winning hand, automated tests are the primary acceptance check for tsumo.

Manual UI checks:

- Confirm no `ツモ` button is visible for ordinary non-winning hands.
- If a winning hand appears, confirm the `ツモ` button is visible only on the human turn.
- Click `ツモ`.
- Confirm the center status shows `あなたのツモ和了です`.
- Confirm no further discard/draw action progresses after the round ends.
- If CPU wins by tsumo during random play, confirm the center status shows `CPU nのツモ和了です`.

Automated tsumo acceptance:

- Open the test runner URL.
- Confirm total count is 44.
- Confirm pass count is 44.
- Confirm fail count is 0.
- Confirm pending count is 0.

## 3. Exhaustive Draw Check

- Start a new round.
- Continue discarding tiles until the live wall reaches 0.
- Confirm the center status shows `流局しました`.
- Confirm stats show the drawn round count increased.
- Refresh the page.
- Confirm stats are still loaded from `localStorage`.

## 4. localStorage Check

Use browser developer tools after starting at least one round.

- Confirm `localStorage` contains `jun-chan-mahjong:stats`.
- Confirm `roundsStarted` is at least 1.
- Confirm `lastPlayedAt` is a string.
- After exhaustive draw, confirm `roundsDrawn` increased.

## 5. Smartphone Width Check

Use a browser device toolbar or narrow the window to around 390px width.

- Confirm the human hand remains easy to find.
- Confirm human tile buttons are at least about 50px wide and 66px tall.
- Confirm the human hand can scroll horizontally if needed.
- Confirm disabled tiles look disabled when it is not the human turn.
- Confirm the large tile mode button works.
- Confirm large tile mode makes the human hand easier to tap.
- Confirm the `ツモ` button is large enough to tap when it appears.

## Known Tooling Limitation

The in-app Browser plugin could not be used in this session because its expected `scripts/browser-client.mjs` file was missing. Static server, module-level tests, syntax checks, and render-string checks were used instead.

