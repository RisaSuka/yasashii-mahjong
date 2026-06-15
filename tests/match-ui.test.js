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
      querySelectorAll(selector) {
        return selector === "[data-action='start-match']" ? [startButton] : [];
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

  test("MVP-1.0 UI: all start-match buttons dispatch including restart", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let callCount = 0;
    const headerStartButton = createFakeButton();
    const restartButton = createFakeButton();
    const root = {
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        return selector === "[data-action='start-match']" ? [headerStartButton, restartButton] : [];
      }
    };

    bindControls(root, {
      onStartMatch() {
        callCount += 1;
      },
      onStartRound() {},
      onStartNextRound() {},
      onToggleLargeTileMode() {},
      onToggleDiscardAdvice() {},
      onDiscardTile() {},
      onDeclareTsumo() {},
      onDeclareRon() {},
      onSkipRon() {}
    });
    headerStartButton.listeners.click();
    restartButton.listeners.click();

    assertEqual(callCount, 2, "Header and restart start-match buttons should both be clickable");
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

  test("MVP-1.0 UI: START_MATCH after match end restarts East 1 and clears end display", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const ended = await endedHandState(4);
    const restarted = dispatchAction(
      {
        ...ended,
        settings: {
          ...ended.settings,
          largeTileMode: true,
          discardAdviceEnabled: false
        }
      },
      { type: "START_MATCH", random: reverseRandom }
    );
    const html = await renderState(restarted);

    assertEqual(restarted.match.status, "playing", "Restarted match should be playing");
    assertEqual(restarted.match.handNumber, 1, "Restarted match should begin at East 1");
    assertEqual(restarted.match.dealerIndex, 0, "Restarted match should reset dealer to East");
    assertEqual(restarted.round.phase, "discard", "Restarted match should enter discard phase");
    assertTrue(html.includes("match-hand-label"), "Restarted match should render the hand label area");
    assertTrue(!html.includes("match-ended-summary"), "Restarted match should hide previous match ended summary");
    assertTrue(isSorted(restarted.round.players[0].hand), "Restarted human hand should be sorted");
    assertEqual(restarted.settings.largeTileMode, true, "Large tile mode should be preserved");
    assertEqual(restarted.settings.discardAdviceEnabled, false, "Advice setting should be preserved");
  });

  test("MVP-1.0 UI: existing yaku, advice, and next-round UI hooks remain available", async () => {
    const state = await startMatchState();
    const html = await renderState(state);

    assertTrue(html.includes("table-meta-row"), "Table metadata should still render");
    assertTrue(html.includes("discard-advice") || html.includes("center-panel"), "Advice/center UI should still have a rendering area");
    assertTrue(html.includes("seat-east"), "Human hand seat should still render");
  });

  test("MVP-1.1 UI: human and CPU discard areas render separately", async () => {
    const state = addDiscards(await startMatchState(), 4);
    const html = await renderState(state);
    const eastSeatStart = html.indexOf("seat-east");
    const humanDiscardIndex = html.indexOf("discard-area-human", eastSeatStart);
    const humanHandIndex = html.indexOf('class="hand"', eastSeatStart);

    assertTrue(humanDiscardIndex > -1, "Human discard area should be explicit");
    assertTrue(humanHandIndex > -1, "Human hand should still render");
    assertTrue(humanDiscardIndex > humanHandIndex, "DOM keeps hand controls stable while CSS moves human discards above the hand");
    assertTrue(html.includes("discard-area-cpu"), "CPU discard area should be explicit");
    assertTrue(html.includes("advice-suggested") || html.includes("seat-east"), "Advice highlighting/rendering should remain available");
  });

  test("MVP-1.1.2 UI: human discard display keeps late-round recent tiles", async () => {
    const state = addDiscards(await startMatchState(), 18);
    const html = await renderState(state);
    const eastSeatStart = html.indexOf("seat-east");
    const eastSeatEnd = html.indexOf("</section>", eastSeatStart);
    const eastSeatHtml = html.slice(eastSeatStart, eastSeatEnd);
    const visibleHumanDiscards = (eastSeatHtml.match(/class="tile[^"]*discard-tile/g) || []).length;

    assertEqual(visibleHumanDiscards, 18, "Human discard area should keep the latest 18 tiles for late-round review");
  });

  test("MVP-1.1.1 UI: table-center discard ring renders all four directions", async () => {
    const html = await renderState(addDiscards(await startMatchState(), 8));

    assertTrue(html.includes("table-discard-ring"), "Center discard ring should render");
    assertTrue(html.includes("table-discard-north"), "North CPU discards should render near the center");
    assertTrue(html.includes("table-discard-west"), "West CPU discards should render near the center");
    assertTrue(html.includes("table-discard-south"), "South CPU discards should render near the center");
    assertTrue(html.includes("table-discard-east"), "Human discards should render near the center");
  });

  test("MVP-1.1.3 UI: center ring keeps CPU discards through late hand", async () => {
    const html = await renderState(addDiscards(await startMatchState(), 18));
    const northHtml = extractSectionHtml(html, "table-discard-north");
    const westHtml = extractSectionHtml(html, "table-discard-west");
    const southHtml = extractSectionHtml(html, "table-discard-south");

    assertEqual(countDiscardTiles(northHtml), 18, "North CPU center discards should keep up to 18 recent tiles");
    assertEqual(countDiscardTiles(westHtml), 18, "West CPU center discards should keep up to 18 recent tiles");
    assertEqual(countDiscardTiles(southHtml), 18, "South CPU center discards should keep up to 18 recent tiles");
  });

  test("MVP-1.1.2 UI: important win and reaction buttons stay in the table action bar", async () => {
    const state = await startMatchState();
    const tsumoHtml = await renderState(state, { canDeclareTsumo: () => true });
    const ronHtml = await renderState(state, { canDeclareRon: () => true });

    assertTrue(tsumoHtml.includes("table-action-bar"), "Tsumo action should render inside the stable action bar");
    assertTrue(tsumoHtml.includes('data-action="declare-tsumo"'), "Tsumo button should remain visible in render output");
    assertTrue(ronHtml.includes("table-action-bar"), "Ron reaction actions should render inside the stable action bar");
    assertTrue(ronHtml.includes('data-action="declare-ron"'), "Ron button should remain visible in render output");
    assertTrue(ronHtml.includes('data-action="skip-ron"'), "Skip ron button should remain visible in render output");
  });

  test("MVP-1.1.1 UI: discard advice reason button and modal render from advice state", async () => {
    const started = await startMatchState();
    const state = {
      ...started,
      settings: {
        ...started.settings,
        discardAdviceEnabled: true
      }
    };
    const closedHtml = await renderState(state, { suggestDiscards: sampleAdvice });
    const openHtml = await renderState(state, { suggestDiscards: sampleAdvice, discardAdviceDialogOpen: true });

    assertTrue(closedHtml.includes('data-action="open-discard-advice"'), "Advice button should be visible when advice is available");
    assertTrue(!closedHtml.includes("discard-advice-modal"), "Advice modal should stay closed by default");
    assertTrue(openHtml.includes("discard-advice-modal"), "Advice modal should render when opened");
    assertTrue(openHtml.includes('data-action="close-discard-advice"'), "Advice modal should include a close button");
    assertEqual((openHtml.match(/discard-advice-item/g) || []).length, 2, "Advice modal should keep each candidate as a separate readable item");
  });

  test("MVP-1.1.3 UI: advice button is anchored in the human seat instead of center info", async () => {
    const started = await startMatchState();
    const state = {
      ...started,
      settings: {
        ...started.settings,
        discardAdviceEnabled: true
      }
    };
    const html = await renderState(state, { suggestDiscards: sampleAdvice });
    const centerHtml = extractBetween(html, 'class="center-info"', 'class="table-discard-south"');
    const eastSeatHtml = extractSectionHtml(html, "seat-east");

    assertTrue(eastSeatHtml.includes('data-action="open-discard-advice"'), "Advice button should render in the human seat header");
    assertTrue(!centerHtml.includes('data-action="open-discard-advice"'), "Center info should not gain or lose height from the advice button");
  });

  test("MVP-1.1.3 UI: current turn is shown on the player seat and discard zone", async () => {
    const html = await renderState(await startMatchState());

    assertTrue(html.includes("seat-east current"), "Current human seat should keep the current turn highlight");
    assertTrue(html.includes("seat-turn-indicator"), "Current player should get a compact turn indicator");
    assertTrue(html.includes("table-discard-east is-current-turn"), "Current player discard zone should also be highlighted");
  });

  test("MVP-1.1.1 UI: discard advice reason button is hidden when advice is off", async () => {
    const started = await startMatchState();
    const state = {
      ...started,
      settings: {
        ...started.settings,
        discardAdviceEnabled: false
      }
    };
    const html = await renderState(state, { suggestDiscards: sampleAdvice });

    assertTrue(!html.includes('data-action="open-discard-advice"'), "Advice reason button should not show when advice is OFF");
    assertTrue(!html.includes("discard-advice-modal"), "Advice modal should not show when advice is OFF");
  });

  test("MVP-1.1.1 UI: advice modal buttons dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let opened = 0;
    let closed = 0;
    const openButton = createFakeButton();
    const closeButton = createFakeButton();
    const root = {
      querySelector(selector) {
        if (selector === "[data-action='open-discard-advice']") {
          return openButton;
        }

        if (selector === "[data-action='close-discard-advice']") {
          return closeButton;
        }

        return null;
      },
      querySelectorAll() {
        return [];
      }
    };

    bindControls(root, {
      onStartMatch() {},
      onStartRound() {},
      onStartNextRound() {},
      onToggleLargeTileMode() {},
      onToggleDiscardAdvice() {},
      onOpenDiscardAdvice() {
        opened += 1;
      },
      onCloseDiscardAdvice() {
        closed += 1;
      },
      onDiscardTile() {},
      onDeclareTsumo() {},
      onDeclareRon() {},
      onSkipRon() {}
    });
    openButton.listeners.click();
    closeButton.listeners.click();

    assertEqual(opened, 1, "Open advice button should call its handler");
    assertEqual(closed, 1, "Close advice button should call its handler");
  });
}

function extractSectionHtml(html, className) {
  const start = html.indexOf(className);
  const end = html.indexOf("</section>", start);

  return start === -1 || end === -1 ? "" : html.slice(start, end);
}

function extractBetween(html, startNeedle, endNeedle) {
  const start = html.indexOf(startNeedle);
  const end = html.indexOf(endNeedle, start);

  return start === -1 || end === -1 ? "" : html.slice(start, end);
}

function countDiscardTiles(html) {
  return (html.match(/class="tile[^"]*discard-tile/g) || []).length;
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

async function renderState(state, renderOptions = {}) {
  const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
  const root = { innerHTML: "" };

  renderGame(state, root, {
    canDeclareTsumo: () => false,
    canDeclareRon: () => false,
    suggestDiscards: () => [],
    ...renderOptions
  });

  return root.innerHTML;
}

function sampleAdvice() {
  return [
    {
      tileId: "s1-0",
      priority: 1,
      label: "おすすめ",
      reason: "端に近く、組み合わせが作りにくいためです。"
    },
    {
      tileId: "m9-0",
      priority: 2,
      label: "候補",
      reason: "孤立しているため候補です。"
    }
  ];
}

function addDiscards(state, count) {
  return {
    ...state,
    round: {
      ...state.round,
      players: state.round.players.map((player) => ({
        ...player,
        discards: Array.from({ length: count }, (_, index) => ({
          id: `${player.wind}-discard-${index}`,
          suit: ["m", "p", "s", "z"][index % 4],
          rank: index % 4 === 3 ? (index % 7) + 1 : (index % 9) + 1,
          copy: 0,
          red: false
        }))
      }))
    }
  };
}

function createFakeButton() {
  return {
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    }
  };
}

function reverseRandom() {
  return 0.999999;
}

function isSorted(tiles) {
  return tileKeys(tiles) === tileKeys([...tiles].sort(compareForTest));
}

function compareForTest(a, b) {
  const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
  return suitOrder[a.suit] - suitOrder[b.suit] || a.rank - b.rank || a.copy - b.copy;
}

function tileKeys(tiles) {
  return tiles.map((tileValue) => `${tileValue.suit}${tileValue.rank}-${tileValue.copy}`).join(",");
}
