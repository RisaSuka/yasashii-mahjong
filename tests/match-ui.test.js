import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerMatchUiTests() {
  test("MVP-1.0 UI: empty screen offers east-only match start", async () => {
    const html = await renderState(await initialState());

    assertTrue(html.includes('data-action="start-match"'), "Initial screen should expose START_MATCH entry point");
    assertTrue(!html.includes('data-action="start-round"'), "Initial screen should not expose old START_ROUND entry point");
  });

  test("MVP-1.0 UI: start-match button dispatches through onStartMatch handler", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let calledHandler = "";
    const startButton = createFakeButton();
    const root = {
      querySelector(selector) {
        return selector === "[data-action='start-match']" ? startButton : null;
      },
      querySelectorAll() {
        return [];
      }
    };

    bindControls(root, {
      onStartMatch() {
        calledHandler = "match";
      },
      onStartRound() {
        calledHandler = "round";
      },
      onStartNextRound() {},
      onToggleLargeTileMode() {},
      onToggleDiscardAdvice() {},
      onDiscardTile() {},
      onDeclareTsumo() {},
      onDeclareRon() {},
      onSkipRon() {}
    });
    startButton.listeners.click();

    assertEqual(calledHandler, "match", "Rendered start button should call START_MATCH UI handler");
  });

  test("MVP-1.0 UI: START_MATCH renders East 1 label", async () => {
    const state = await startMatchState();
    const html = await renderState(state);

    assertTrue(html.includes("東1局"), "Started match should show East 1");
  });

  test("MVP-1.0 UI: renders East 2, East 3, and East 4 labels", async () => {
    const east2 = await nextHandState(1);
    const east3 = await nextHandState(2);
    const east4 = await nextHandState(3);

    assertTrue((await renderState(east2)).includes("東2局"), "East 2 should be visible");
    assertTrue((await renderState(east3)).includes("東3局"), "East 3 should be visible");
    assertTrue((await renderState(east4)).includes("東4局"), "East 4 should be visible");
  });

  test("MVP-1.0 UI: East 1 through East 3 ended hands show next-round button", async () => {
    const east1Ended = await endedHandState(1);
    const east3Ended = await endedHandState(3);

    assertTrue((await renderState(east1Ended)).includes('data-action="start-next-round"'), "East 1 ended hand should show next round");
    assertTrue((await renderState(east3Ended)).includes('data-action="start-next-round"'), "East 3 ended hand should show next round");
  });

  test("MVP-1.0 UI: East 4 ended hand shows match ended instead of next-round button", async () => {
    const html = await renderState(await endedHandState(4));

    assertTrue(html.includes("東風戦終了"), "East 4 ended hand should show match ended");
    assertTrue(!html.includes('data-action="start-next-round"'), "East 4 ended hand should not show next round");
    assertTrue(html.includes('data-action="start-match"'), "East 4 ended hand should offer a fresh match start");
  });

  test("MVP-1.0 UI: existing yaku, advice, and next-round UI hooks remain available", async () => {
    const state = await startMatchState();
    const html = await renderState(state);

    assertTrue(html.includes("table-meta-row"), "Table metadata should still render");
    assertTrue(html.includes("discard-advice") || html.includes("center-panel"), "Advice/center UI should still have a rendering area");
    assertTrue(html.includes("seat-east"), "Human hand seat should still render");
  });
}

async function initialState() {
  const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);

  return createInitialGameState();
}

async function startMatchState() {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);

  return dispatchAction(await initialState(), { type: "START_MATCH" });
}

async function nextHandState(previousHandNumber) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);

  return dispatchAction(await endedHandState(previousHandNumber), { type: "START_NEXT_ROUND" });
}

async function endedHandState(handNumber) {
  const state = await startMatchState();
  const match = {
    ...state.match,
    handNumber,
    dealerIndex: handNumber - 1
  };

  return {
    ...state,
    match,
    round: {
      ...state.round,
      roundWind: "east",
      handNumber,
      dealerIndex: handNumber - 1,
      phase: "ended",
      endReason: "exhaustive-draw",
      winningResult: null
    }
  };
}

async function renderState(state) {
  const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
  const root = { innerHTML: "" };

  renderGame(state, root, {
    canDeclareTsumo: () => false,
    canDeclareRon: () => false,
    suggestDiscards: () => []
  });

  return root.innerHTML;
}

function createFakeButton() {
  return {
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    }
  };
}
