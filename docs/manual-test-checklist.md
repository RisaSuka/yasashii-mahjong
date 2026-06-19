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
- Confirm total count is 268.
- Confirm pass count is 268.
- Confirm fail count is 0.
- Confirm pending count is 0.
- For smartphone landscape layout work, also run the layout guard described in `docs/layout-test.md`.
- If `tests/layout-check.mjs` fails, review the reported viewport/scenario and screenshots under `test-artifacts/layout/` before continuing UI fixes.
- For CPU win reachability diagnostics, run `node scripts/simulate-cpu-win-reachability.mjs` and confirm CPU tsumo, CPU ron, and no-yaku rejection are reported.

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

## 2.1 MVP-1.8.1 Discard Evaluator Sanity

- Start a round and turn advice ON.
- Confirm completed number runs such as `1筒2筒3筒` are not highlighted as the first discard candidates when weaker isolated tiles exist.
- Confirm pairs and triplets are not casually suggested before isolated honors or weak isolated terminals.
- Confirm `助言を見る` gives a readable reason for the suggested tile.
- Confirm CPU turns continue normally and do not stall after the evaluator change.

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

## 4A. CPU Win Check

Use automated tests as the primary acceptance check for MVP-1.8. For deterministic manual checks, use the scenarios:

- `cpu-tsumo-ready-yakuhai`
- `cpu-ron-ready-yakuhai`
- `cpu-no-yaku-win-shape`

Verify:

- CPU tsumo with yaku ends the round.
- CPU ron on a human discard with yaku ends the round.
- CPU no-yaku completed shapes do not end the round.
- CPU win display shows the CPU winner and win type.
- `谺｡縺ｮ螻縺ｸ` is visible after CPU win.
- Pressing `谺｡縺ｮ螻縺ｸ` starts the next hand.
- East-only match result history includes CPU tsumo/ron entries.
- Human ron reaction still takes priority when the human can react to a CPU discard.

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

## 7A. Hand Yaku Guide Check

- Start a match and confirm the `役ガイド` button is visible near the human seat.
- Open `役ガイド`.
- Confirm the popup title says `今の手で狙いやすい役`.
- Confirm 1 to 3 yaku candidates are shown.
- Confirm each candidate has a yaku name, reading, beginner description, and why text.
- Confirm the popup says the guide is a rough aid, not an absolute correct answer.
- Confirm each candidate shows a `完成イメージ（例）` with CSS tiles.
- Confirm keep hints and discard hints are short and readable.
- Confirm the close button closes the popup.
- Confirm Escape closes the popup on desktop.
- Confirm opening `役ガイド` closes advice, discard zoom, result, and beginner help popups instead of stacking them.
- Confirm advice ON/OFF and suggested discard highlights still work after closing the guide.
- Confirm smartphone landscape keeps the yaku-guide popup inside the viewport.

## 7B. Tenpai / Wait Helper Check

- Start a match and confirm the `待ち` or `待ちあり` button is visible near the human seat.
- Open the wait helper.
- If the hand is not tenpai, confirm it says the hand is not tenpai yet.
- In a deterministic tenpai state or automated test, confirm wait tiles are shown as CSS tiles.
- Confirm yaku-valid waits show a `役:` line.
- Confirm shape-complete no-yaku waits explain that the shape is complete but yaku is missing.
- Confirm the close button closes the popup.
- Confirm Escape closes the popup on desktop.
- Confirm opening waits closes advice, yaku guide, discard zoom, result, and beginner help popups instead of stacking them.
- Confirm smartphone landscape keeps the waits popup inside the viewport.

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

## 16. Automated Smartphone Landscape Layout Guard

Run this before continuing MVP-1.1 layout fixes or asking for another real-device Safari check.

```powershell
node tests/layout-check.mjs
```

If Node is not on PATH in the Codex desktop environment, use:

```powershell
& "C:\Users\kurop\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\layout-check.mjs
```

Confirm the script checks these viewports:

- 844x390
- 896x414
- 932x430
- 812x375
- 780x360

Confirm it checks these scenarios:

- Early hand with about 3 discards per player.
- Middle hand with about 9 discards per player.
- Late hand with about 18 discards per player.
- Exhaustive-draw ended hand with late discards.
- Action-button state with advice popup.
- Discard zoom popup state with 18 human discards.
- East-only match ended state.
- Match result popup state.

Review failures for:

- Page-level horizontal or vertical overflow.
- North, west, south, or east discard clipping.
- Human hand tile clipping.
- Recommended badge clipping.
- Hidden or unclickable action buttons.
- Hidden or unclickable advice button.
- Advice popup outside the viewport.
- Discard zoom popup outside the viewport.
- Discard zoom close button hidden or unclickable.
- Match result popup outside the viewport.
- Match result close button hidden or unclickable.
- Overlap between the center information, discard zones, and hand area.

Screenshots are saved under:

```text
test-artifacts/layout/
```

Current expected result after MVP-1.1.6:

- Normal browser tests pass.
- Layout check passes across all target viewports and scenarios.
- Late-hand and draw-ended scenarios show 18 discards per player without discard clipping.
- If layout check fails again, inspect the reported viewport/scenario and the matching screenshot in `test-artifacts/layout/`.

## 17. MVP-1.2 Discard Zoom Check

Use a real phone in landscape orientation, or browser device toolbar viewports such as 844x390, 896x414, and 932x430.

- Open the app with `?v=mvp12-discard-zoom-2`.
- Confirm north, west, south, and east discard zones show a small `拡大` hint.
- Tap/click the north CPU discard zone.
- Confirm a popup opens with `北 CPU 3の捨て牌`.
- Confirm the popup shows the north CPU discarded tiles larger than the normal center-ring tiles.
- Close the popup with `閉じる`.
- Repeat for west CPU, south CPU, and east/human discards.
- Confirm backdrop click closes the popup.
- Confirm Escape closes the popup on desktop.
- Confirm opening discard zoom closes the advice popup, and opening advice closes discard zoom.
- Confirm the popup does not create page-level horizontal or vertical scrolling in smartphone landscape.
- Confirm the close button remains visible and easy to tap.
- Confirm `次の局へ`, `東風戦終了`, and `もう一度遊ぶ` still work after opening and closing discard zoom.

## 18. MVP-1.3 East-Only Match Result Check

- Play or simulate through East 4.
- Confirm the end screen shows `東風戦終了`.
- Confirm it says `4局遊び終わりました。`.
- Confirm it says `点数計算はまだ未対応です。`.
- Confirm `もう一度遊ぶ` remains visible and tappable.
- Tap/click `結果を見る`.
- Confirm a popup opens with `今回の結果`.
- Confirm East 1 through East 4 results are listed.
- Confirm result lines are short, such as `流局`, `あなたのツモ`, or `南CPUのロン`.
- Confirm no points or rankings are shown.
- Confirm `閉じる` closes the result popup.
- Confirm backdrop click and Escape close the result popup.
- Confirm the result popup does not stay open at the same time as the discard zoom or advice popup.
- Confirm smartphone landscape does not gain page-level overflow when the result popup is open.

## 19. MVP-1.4 Discard Evaluator And Beginner Help Check

- Open the app with `?v=mvp14-discard-evaluator-1`.
- Start an east-only match.
- Confirm advice is ON by default unless you previously turned it OFF.
- Confirm at least one suggested discard appears on the human discard turn.
- Confirm suggested tiles remain highlighted in the human hand.
- Tap/click the advice reason button.
- Confirm the reason popup shows beginner-friendly reasons for the current candidates.
- Confirm reasons sound like guidance, not an absolute correct answer.
- Confirm advice remains available even when the hand has mostly connected number tiles.
- Toggle advice OFF and confirm advice highlights and the advice reason button disappear.
- Toggle advice ON again and confirm suggestions return.
- Open `初心者ヘルプ`.
- Confirm the help says advice is only a guide.
- Confirm the help explains isolated tiles, terminal tiles, honor tiles, pairs, connected number tiles, dora, tanyao, and yakuhai.
- Confirm the help closes with the close button and Escape on desktop.
- Confirm beginner help does not stay open at the same time as advice, discard zoom, or result popups.
- Confirm discard zoom, match result popup, next round, match end, and replay still work after opening and closing beginner help.

## 20. MVP-1.5 CPU Discard Evaluator Check

- Open the app with `?v=mvp151-ron-check-1`.
- Start an east-only match.
- Discard as the human player and wait for CPU turns.
- Confirm CPU turns continue and do not stall.
- Confirm CPU players discard tiles after drawing.
- Confirm CPU discards still look slightly varied across games because the evaluator keeps light randomness.
- Confirm CPU play does not block ron reaction, skip, exhaustive draw, next round, or match end.
- Confirm human discard advice still appears when advice is ON.
- Confirm advice reasons still open and remain beginner-friendly.
- Confirm advice OFF hides human advice without affecting CPU turns.
- Confirm discard zoom, beginner help, result popup, and replay still work after several CPU turns.

## 21. MVP-1.5.1 Ron Verification Check

Normal shuffled play may not quickly produce ron. Use deterministic scenarios for manual confirmation.

Recommended browser-console setup:

```js
const scenarios = await import("./src/game/scenarios.js");
const actions = await import("./src/game/actions.js");
let state = scenarios.createScenarioState("ron-ready-tanyao", { phase: "reaction" });
actions.canDeclareRon(state, 0);
```

- Confirm `ron-ready-tanyao` returns `true` from `canDeclareRon(state, 0)`.
- Dispatch `DECLARE_RON` and confirm the round ends as a ron win.
- Repeat with `ron-ready-yakuhai` and confirm yakuhai ron wins.
- Repeat with `ron-ready-chiitoitsu` and confirm seven-pairs ron wins.
- Open/render `no-yaku-ron-shape` in reaction phase.
- Confirm it is a complete ron shape but `canDeclareRon(state, 0)` is false.
- Confirm the UI shows a gentle no-yaku message and a `skip ron` / `見送る` action instead of a winning ron button.
- Confirm skipping ron continues the normal draw/discard flow.
- Confirm smartphone landscape keeps ron/skip actions inside the action bar.

Portrait orientation check:

- Confirm the page shows: `スマホを横向きにすると、牌とボタンが見やすくなります。`
- Confirm the portrait hint does not block tile taps.
- Confirm portrait still works well enough for emergency play.

## Known Tooling Limitation

The in-app Browser plugin could not be used in earlier sessions because its expected `scripts/browser-client.mjs` file was missing. Static server, module-level tests, syntax checks, and render-string checks were used instead.
