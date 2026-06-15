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
- Confirm total count is 194.
- Confirm pass count is 194.
- Confirm fail count is 0.
- Confirm pending count is 0.

## 2. Normal Desktop Flow

- Open the app URL.
- Confirm the title is visible.
- Confirm the new round button is visible.
- Click the new round button.
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
- Confirm the turn returns to the human when no win ends the round.

## 3. Tsumo Win Check

Normal shuffled play may not quickly produce a winning hand. Use automated tests as the primary acceptance check, and use fixed scenarios from the console when needed.

- Confirm no `ツモ` button is visible for ordinary non-winning hands.
- If a winning hand appears, confirm the `ツモ` button is visible only on the human turn.
- Click `ツモ`.
- Confirm the center status shows `あなたのツモ和了です`.
- Confirm the yaku summary shows yaku name, furigana, han, total han, and beginner explanation.
- Confirm no further discard/draw action progresses after the round ends.

## 4. Ron Reaction Check

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

- The center status asks whether to ron.
- The `ロン` button is visible.
- The `見送る` button is visible.
- Click `見送る`.
- Confirm the next player draws and the table returns to normal discard flow.

## 5. No-Yaku Rejection Message Check

Use automated tests as the main acceptance check. For manual confirmation, use a no-yaku winning-shape state from the console.

Verify:

- A no-yaku tsumo attempt does not end the round.
- A no-yaku ron attempt does not end the round.
- The center panel shows `形は完成していますが、役がありません。`
- The message also shows `まずはタンヤオや役牌を狙ってみましょう。`
- The wording feels gentle and does not say `失敗`.
- After a valid win, the rejection message is cleared.
- Exhaustive draw does not show the rejection message.

## 6. Yaku Display Check

- Confirm a win displays yaku names.
- Confirm yaku names include furigana, such as `断么九（タンヤオ）`.
- Confirm han uses readable text, such as `1翻（1ハン）`.
- Confirm total han is shown.
- Confirm beginner explanations are short and readable.
- Confirm yaku display order is kept:
  1. 役牌（ヤクハイ）
  2. 断么九（タンヤオ）
  3. 門前清自摸和（メンゼンツモ）
  4. 七対子（チートイツ）
  5. 対々和（トイトイ）
  6. 国士無双（コクシムソウ）
- Confirm unknown or missing yaku data does not break the screen.

## 7. Tile Visual Check

- Confirm manzu, pinzu, souzu, and honor tiles are easy to distinguish at a glance.
- Confirm the human hand is automatically sorted as manzu, pinzu, souzu, then honors.
- Confirm suited tiles are sorted from 1 through 9.
- Confirm honor tiles are sorted east, south, west, north, white, green, red.
- Confirm the human hand remains sorted after a draw.
- Confirm the human hand remains sorted after pressing `次の局へ`.
- Confirm sorted tiles can still be tapped and discarded correctly.
- Confirm suggested discard highlighting still appears on the correct sorted tile.
- Confirm manzu uses red accents.
- Confirm pinzu uses blue accents and a small circle cue.
- Confirm souzu uses green accents and a small stick cue.
- Confirm honor tiles use a dark accent and larger text.
- Confirm tiles look slightly taller and more tile-like than plain cards.
- Confirm each tile has a white face, visible border, shadow, and bottom thickness.
- Confirm the tile face structure does not visually crowd the main symbol.
- Confirm discard tiles remain compact but still readable.
- Confirm horizontal scrolling does not squeeze or collapse tiles.
- Confirm large tile mode does not break tile proportions.

## 8. Exhaustive Draw Check

- Start a new round.
- Continue discarding tiles until the live wall reaches 0.
- Confirm the center status shows that the round ended in exhaustive draw.
- Confirm exhaustive draw does not show `yaku-summary`.
- Confirm stats show the drawn round count increased.
- Refresh the page.
- Confirm stats are still loaded from `localStorage`.

## 9. localStorage Check

Use browser developer tools after starting at least one round.

- Confirm `localStorage` contains `jun-chan-mahjong:stats`.
- Confirm `roundsStarted` is at least 1.
- Confirm `lastPlayedAt` is a string.
- After exhaustive draw, confirm `roundsDrawn` increased.

## 10. Next Round Check

- Finish a round by exhaustive draw or use automated tests as the primary deterministic check.
- Confirm the center panel shows `次の局へ` after the round ends.
- Confirm `次の局へ` is easy to tap in smartphone landscape.
- Click `次の局へ`.
- Confirm a fresh round starts.
- Confirm the center status returns to the human discard turn or current turn guidance.
- Confirm the dealer has 14 tiles after the initial draw.
- Confirm CPU players have 13 tiles.
- Confirm the live wall is back to 69 tiles.
- Confirm the previous result is shown briefly as `前の局`.
- Confirm the previous result uses short wording such as `前の局: 流局`, `前の局: あなたのツモ`, or `前の局: あなたのロン`.
- Confirm the previous result does not crowd the center panel or the human hand.
- Confirm `roundsStarted` increases by 1.
- Confirm `roundsDrawn` does not increase again just by pressing `次の局へ`.
- Confirm large tile mode remains in the same ON/OFF state.
- Confirm discard advice remains in the same ON/OFF state.
- Confirm the header `新規局開始` button still works as a fresh restart option.

## 11. Smartphone Width Check

Use a browser device toolbar or narrow the window to around 390px width.

- Confirm the human hand remains easy to find.
- Confirm human tile buttons are at least about 50px wide and 66px tall.
- Confirm the human hand can scroll horizontally if needed.
- Confirm disabled tiles look disabled when it is not the human turn.
- Confirm the large tile mode button works.
- Confirm large tile mode makes the human hand easier to tap.
- Confirm CSS tiles remain vertically proportioned in large tile mode.
- Confirm the `ツモ` button is large enough to tap when it appears.
- Confirm the `ロン` and `見送る` buttons are large enough to tap when they appear.
- Confirm no-yaku messages and yaku summaries remain readable.
- Confirm furigana yaku display does not wrap awkwardly or overlap.

## 12. East-Only Match UI Check

Use automated tests as the primary acceptance check for MVP-1.0, then manually confirm the minimal UI.

- Confirm `START_MATCH` starts East 1.
- Confirm East 1 uses dealer player 0.
- Confirm `START_NEXT_ROUND` advances to East 2, East 3, and East 4.
- Confirm dealer advances 0, 1, 2, 3 without dealer repeat in MVP-1.0.
- Confirm after East 4 ends, the match is ended and East 5 is not created.
- Confirm scores remain fixed and no point movement is shown.
- Confirm `roundHistory` stores compact results for ended hands.
- Confirm `lastRoundResult` still represents only the immediately previous hand.
- Confirm large tile mode and discard advice settings are preserved.
- Confirm the center panel shows `東1局`, `東2局`, `東3局`, or `東4局`.
- Confirm East 1 through East 3 ended hands show `次の局へ`.
- Confirm East 4 ended hand shows `東風戦終了`.
- Confirm East 4 ended hand does not show `次の局へ`.
- Confirm the East-only end message says point calculation is not supported yet.
- Confirm the restart button after the East-only end is tappable.
- Confirm the fresh match restart returns to East 1, clears the East-only end message, and keeps large tile/advice settings.
- Confirm `もう一度遊ぶ` starts a fresh east-only match.

## 13. Smartphone Real Device Check On Local Wi-Fi

Use this when checking the app from a real smartphone on the same Wi-Fi network as the PC.

Start the local server on the PC with LAN access:

```powershell
python -m http.server 8765 --bind 0.0.0.0
```

Find the PC IPv4 address:

```powershell
ipconfig
```

Look for the IPv4 address of the Wi-Fi adapter, for example:

```text
192.168.x.x
```

Connect the smartphone to the same Wi-Fi network, then open:

```text
http://<PCのIPv4アドレス>:8765/
```

Example:

```text
http://192.168.1.23:8765/
```

If Windows Firewall blocks access:

- Allow Python network access when Windows asks.
- Allow it for private networks only.
- Do not casually allow public network access.
- If the phone cannot connect, confirm both devices are on the same Wi-Fi and the server is still running.

Security notes:

- Use this only inside the same trusted Wi-Fi network.
- This is not GitHub Pages publishing.
- This is not a push.
- This is not intended for external public access.
- Stop the server after the check is finished.

Real-device checks:

- Open the app in a new tab with `?v=mvp111-discard-center-1` if the phone might have cached an older module.
- Confirm the first start button begins an east-only match, not a single standalone round.
- Confirm `東1局` appears immediately after pressing the start button.
- Confirm tiles are readable on the phone screen.
- Confirm manzu, pinzu, souzu, and honor tiles are easy to distinguish.
- Confirm the human hand can scroll horizontally.
- Confirm tiles are easy to tap.
- Confirm the advice ON/OFF button is easy to tap.
- Confirm discard advice does not get in the way.
- Confirm suggested tile highlighting does not block tile taps.
- Confirm large tile mode does not break the layout.
- Confirm tsumo, ron, and skip buttons are easy to tap when they appear.
- Confirm yaku display, furigana, and no-yaku messages are readable.

## 14. Smartphone Landscape Table Check

MVP-0.8 recommends smartphone landscape for regular play. Portrait must remain usable, but landscape is the primary real-device layout.

Use a real phone or browser device toolbar in landscape orientation.

- Confirm the top CPU, left CPU, right CPU, center panel, and bottom human area are easy to understand.
- Confirm page-level vertical scrolling is mostly avoided.
- Confirm page-level horizontal scrolling does not appear.
- Confirm the human hand stays near the bottom and remains the easiest area to find.
- Confirm human tiles are large enough to tap.
- Confirm the human hand can scroll horizontally inside the hand area without hiding the tap target.
- Confirm any hand overflow is limited to the hand strip, not the whole page.
- Confirm the center panel does not take over the table.
- Confirm wall count, dead wall count, dora indicator, status text, and win messages remain readable.
- Confirm wall count, dead wall count, and dora indicator are shown in one compact row in landscape.
- Confirm discard advice is compact in landscape.
- Confirm discard advice is not clipped in the center panel.
- Confirm the first discard advice item shows a reason.
- Confirm the second and third discard advice items stay short.
- Confirm suggested tile highlighting remains visible on the hand.
- Confirm header buttons do not overflow horizontally in landscape.
- Confirm the advice ON/OFF button still works.
- Confirm advice disappears completely when OFF.
- Confirm CPU seats are compact enough and do not dominate the screen.
- Confirm tsumo, ron, and skip buttons are easy to tap when shown.
- Confirm the advice ON/OFF button is easy to tap.
- Confirm yaku display, furigana, and no-yaku messages are still readable.
- Confirm large tile mode does not break the bottom hand.
- Confirm discard rows do not become cramped enough to block understanding.
- Confirm the human hand is not clipped vertically.

## 15. MVP-1.1 Landscape Discard Layout Check

Use a real phone in landscape orientation, or browser device toolbar viewports such as 844x390, 896x414, and 932x430.

- Open the app with `?v=mvp111-discard-center-1`.
- Confirm page-level horizontal scrolling does not appear.
- Confirm page-level vertical scrolling is absent or nearly absent.
- Confirm the table-center discard ring is visible.
- Confirm north CPU discards appear above the center information.
- Confirm west CPU discards appear left of the center information.
- Confirm south CPU discards appear right of the center information.
- Confirm human discards appear below the center information and above the hand.
- Confirm human discards do not overlap the human hand.
- Confirm the human discard label and latest discarded tiles are readable.
- Confirm the human discard area can show recent discards without pushing the hand out of view.
- Confirm CPU discard areas show more than an empty seat and remain readable after several turns.
- Confirm CPU seats stay compact and do not dominate the table.
- Confirm the human hand stays at the bottom and remains easy to tap.
- Confirm any hand overflow scrolls inside the hand strip only.
- Confirm suggested discard highlights still appear on the sorted human hand.
- Confirm the center panel does not permanently show long discard-advice reasons.
- Confirm `助言を見る` appears when advice is ON and advice is available.
- Confirm `助言を見る` opens a compact advice popup.
- Confirm the advice popup can be closed.
- Confirm advice OFF hides the advice reason button.
- Confirm East 1 through East 4 labels are still visible.
- Confirm `谺｡縺ｮ螻縺ｸ`, `譚ｱ鬚ｨ謌ｦ邨ゆｺ・, and restart controls still appear in the correct states.
- Confirm large tile mode does not hide the human discard area or clip the human hand.
- Confirm portrait still shows the landscape recommendation and remains usable enough for emergency play.

Portrait orientation check:

- Confirm the page shows: `スマホを横向きにすると、牌とボタンが見やすくなります。`
- Confirm the portrait hint does not block tile taps.
- Confirm portrait still works well enough for emergency play.

## Known Tooling Limitation

The in-app Browser plugin could not be used in earlier sessions because its expected `scripts/browser-client.mjs` file was missing. Static server, module-level tests, syntax checks, and render-string checks were used instead.
