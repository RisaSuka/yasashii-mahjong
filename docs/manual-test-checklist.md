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

## Desktop App Check

- Open the app URL.
- Confirm the title is visible.
- Confirm the new round button is visible.
- Click `新規局開始`.
- Confirm the center status shows `あなたの番です`.
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

## Exhaustive Draw Check

- Continue discarding tiles until the live wall reaches 0.
- Confirm the center status shows `流局しました`.
- Confirm stats show the drawn round count increased.
- Refresh the page.
- Confirm stats are still loaded from `localStorage`.

## Test Runner Check

- Open the test runner URL.
- Confirm total count is 20.
- Confirm pass count is 20.
- Confirm fail count is 0.
- Confirm pending count is 0.

## Smartphone Width Check

Use a browser device toolbar or narrow the window to around 390px width.

- Confirm the human hand remains easy to find.
- Confirm human tile buttons are at least about 50px wide and 66px tall.
- Confirm the human hand can scroll horizontally if needed.
- Confirm disabled tiles look disabled when it is not the human turn.
- Confirm the large tile mode button works.
- Confirm large tile mode makes the human hand easier to tap.

## Known Tooling Limitation

Automated Playwright click-through could not be run in the current Codex environment because the available `playwright` package is missing `playwright-core`.
