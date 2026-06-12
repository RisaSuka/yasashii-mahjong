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

## 1. Automated Baseline

- Open the test runner URL.
- Confirm total count is 79.
- Confirm pass count is 79.
- Confirm fail count is 0.
- Confirm pending count is 0.

## 2. Normal Desktop Flow

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
- Confirm the turn returns to the human when no ron/tsumo ends the round.

## 3. Deterministic Ron Check

Normal shuffled play may not quickly produce a ron-ready discard. Use the fixed scenario in a browser console for deterministic manual confirmation.

Open the app URL, then in developer tools console run:

```js
const actions = await import("./src/game/actions.js");
const scenarios = await import("./src/game/scenarios.js");
const render = await import("./src/ui/render.js");
const input = await import("./src/ui/input.js");
let state = scenarios.createScenarioState("ron-ready-basic", { phase: "draw" });
const root = document.querySelector("#app");
function draw() {
  render.renderGame(state, root, {
    canDeclareTsumo: actions.canDeclareTsumo,
    canDeclareRon: actions.canDeclareRon
  });
  input.bindControls(root, {
    onStartRound() {},
    onToggleLargeTileMode() {},
    onDiscardTile() {},
    onDeclareTsumo() {},
    onDeclareRon() {
      state = actions.dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });
      draw();
    },
    onSkipRon() {
      state = actions.dispatchAction(state, { type: "SKIP_RON" });
      const player = state.round.players[state.round.currentPlayerIndex];
      state = actions.dispatchAction(state, { type: "DRAW_TILE", playerId: player.id });
      draw();
    }
  });
}
state = actions.dispatchAction(state, { type: "ENTER_REACTION", playerId: 0 });
draw();
```

Then verify:

- The center status shows `ロンできます。ロンしますか？`.
- The `ロン` button is visible.
- The `見送る` button is visible.
- Click `見送る`.
- Confirm the next player draws and the table returns to normal discard flow.
- Run the console setup again.
- Click `ロン`.
- Confirm the center status shows `あなたのロン和了です`.
- Confirm no further tile discard is required after ron.

## 4. Tsumo Regression Check

Because normal shuffled play may not quickly produce a winning hand, automated tests are the primary acceptance check for tsumo.

Manual UI checks:

- Confirm no `ツモ` button is visible for ordinary non-winning hands.
- If a winning hand appears, confirm the `ツモ` button is visible only on the human turn.
- Click `ツモ`.
- Confirm the center status shows `あなたのツモ和了です`.
- Confirm no further discard/draw action progresses after the round ends.
- If CPU wins by tsumo during random play, confirm the center status shows `CPU nのツモ和了です`.

## 5. Exhaustive Draw Check

- Start a new round.
- Continue discarding tiles until the live wall reaches 0.
- Confirm the center status shows `流局しました`.
- Confirm stats show the drawn round count increased.
- Refresh the page.
- Confirm stats are still loaded from `localStorage`.

## 6. localStorage Check

Use browser developer tools after starting at least one round.

- Confirm `localStorage` contains `jun-chan-mahjong:stats`.
- Confirm `roundsStarted` is at least 1.
- Confirm `lastPlayedAt` is a string.
- After exhaustive draw, confirm `roundsDrawn` increased.

## 7. Smartphone Width Check

Use a browser device toolbar or narrow the window to around 390px width.

- Confirm the human hand remains easy to find.
- Confirm human tile buttons are at least about 50px wide and 66px tall.
- Confirm the human hand can scroll horizontally if needed.
- Confirm disabled tiles look disabled when it is not the human turn.
- Confirm the large tile mode button works.
- Confirm large tile mode makes the human hand easier to tap.
- Confirm the `ツモ` button is large enough to tap when it appears.
- Confirm the `ロン` and `見送る` buttons are large enough to tap when they appear.

## Known Tooling Limitation

The in-app Browser plugin could not be used in earlier sessions because its expected `scripts/browser-client.mjs` file was missing. Static server, module-level tests, syntax checks, and render-string checks were used instead.

