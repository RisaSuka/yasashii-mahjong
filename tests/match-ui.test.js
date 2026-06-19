import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerMatchUiTests() {
  test("MVP-1.0 UI: empty screen offers east-only match start", async () => {
    const html = await renderState(await initialState());

    assertTrue(html.includes('data-action="start-match"'), "Initial screen should expose START_MATCH entry point");
    assertTrue(!html.includes('data-action="start-round"'), "Initial screen should not expose old START_ROUND entry point");
  });

  test("MVP-1.4 APP: top page script renders the app root", async () => {
    const harness = createMainStartupHarness();

    try {
      await import(`../src/main.js?startup-smoke=${Date.now()}`);
      await waitForStartupRender();

      assertTrue(harness.root.innerHTML.length > 0, "Main script should render into #app");
      assertTrue(
        harness.root.innerHTML.includes('data-action="start-match"'),
        "Main script should render the start-match entry point"
      );
    } finally {
      harness.cleanup();
    }
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

  test("MVP-1.1.4 UI: center information renders as compact primary and secondary columns", async () => {
    const playingHtml = await renderState(await startMatchState());
    const endedHtml = await renderState(await endedHandState(2));

    assertTrue(playingHtml.includes("center-info-main"), "Center info should have a stable compact wrapper");
    assertTrue(playingHtml.includes("center-primary"), "Round and status should render in the primary center column");
    assertTrue(playingHtml.includes("center-secondary"), "Wall, dora, and action controls should render in the secondary center column");
    assertTrue(playingHtml.includes("table-meta-row"), "Wall/dead wall/dora summary should stay in one compact row");
    assertTrue(endedHtml.includes("center-secondary"), "Ended hands should keep actions in the secondary center column");
    assertTrue(endedHtml.includes('data-action="start-next-round"'), "Next-round action should remain available in the compact center layout");
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
    const ronState = {
      ...state,
      round: {
        ...state.round,
        phase: "reaction"
      }
    };
    const ronHtml = await renderState(ronState, { canDeclareRon: () => true });

    assertTrue(tsumoHtml.includes("table-action-bar"), "Tsumo action should render inside the stable action bar");
    assertTrue(tsumoHtml.includes('data-action="declare-tsumo"'), "Tsumo button should remain visible in render output");
    assertTrue(ronHtml.includes("table-action-bar"), "Ron reaction actions should render inside the stable action bar");
    assertTrue(ronHtml.includes('data-action="declare-ron"'), "Ron button should remain visible in render output");
    assertTrue(ronHtml.includes('data-action="skip-ron"'), "Skip ron button should remain visible in render output");
  });

  test("RON UI: yaku-valid ron reaction shows ron and skip buttons", async () => {
    const state = await scenarioState("ron-ready-tanyao", { phase: "reaction" });
    const html = await renderState(state, {
      canDeclareRon: () => true,
      canCompleteRonLatestDiscard: () => true
    });

    assertTrue(html.includes("table-action-bar"), "Ron reaction should stay in the table action bar");
    assertTrue(html.includes('data-action="declare-ron"'), "Ron button should render for yaku-valid ron");
    assertTrue(html.includes('data-action="skip-ron"'), "Skip button should render for yaku-valid ron");
  });

  test("RON UI: no-yaku ron shape shows message and skip without ron button", async () => {
    const state = await scenarioState("no-yaku-ron-shape", { phase: "reaction" });
    const html = await renderState(state, {
      canDeclareRon: () => false,
      canCompleteRonLatestDiscard: () => true
    });

    assertTrue(html.includes("no-yaku-reaction"), "No-yaku ron shape should render a helpful reaction message");
    assertTrue(html.includes("役がありません"), "No-yaku reaction should explain that yaku is missing");
    assertTrue(html.includes('data-action="skip-ron"'), "No-yaku reaction should still let the player continue");
    assertTrue(!html.includes('data-action="declare-ron"'), "No-yaku reaction should not show a winning ron button");
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

  test("MVP-1.4 UI: beginner help button and dialog render", async () => {
    const closedHtml = await renderState(await startMatchState());
    const openHtml = await renderState(await startMatchState(), { beginnerHelpDialogOpen: true });

    assertTrue(closedHtml.includes('data-action="open-beginner-help"'), "Beginner help button should be available from the table header");
    assertTrue(!closedHtml.includes("beginner-help-modal"), "Beginner help should stay closed by default");
    assertTrue(openHtml.includes("beginner-help-modal"), "Beginner help modal should render when opened");
    assertTrue(openHtml.includes('data-action="close-beginner-help"'), "Beginner help modal should include a close action");
    assertTrue(openHtml.includes("孤立牌"), "Beginner help should explain isolated tiles");
    assertTrue(openHtml.includes("ドラ"), "Beginner help should explain dora");
  });

  test("MVP-1.4 UI: beginner help suppresses advice, zoom, and result popups", async () => {
    const state = await matchEndedHistoryState();
    const html = await renderState(addDiscards(state, 4), {
      suggestDiscards: sampleAdvice,
      discardAdviceDialogOpen: true,
      discardZoomPlayerId: 0,
      matchResultDialogOpen: true,
      beginnerHelpDialogOpen: true
    });

    assertTrue(html.includes("beginner-help-modal"), "Beginner help should render");
    assertTrue(!html.includes("discard-advice-modal"), "Advice modal should be suppressed by help");
    assertTrue(!html.includes("discard-zoom-modal"), "Discard zoom modal should be suppressed by help");
    assertTrue(!html.includes("match-result-modal"), "Match result modal should be suppressed by help");
  });

  test("MVP-1.4 UI: beginner help controls dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let opened = 0;
    let closed = 0;
    let keydownListener = null;
    const openButton = createFakeButton();
    const closeButton = createFakeButton();
    const root = {
      addEventListener(type, listener) {
        if (type === "keydown") {
          keydownListener = listener;
        }
      },
      querySelector(selector) {
        if (selector === "[data-action='open-beginner-help']") {
          return openButton;
        }

        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='close-beginner-help']") {
          return [closeButton];
        }

        return [];
      }
    };

    bindControls(root, {
      onOpenBeginnerHelp() {
        opened += 1;
      },
      onCloseDiscardAdvice() {},
      onCloseDiscardZoom() {},
      onCloseMatchResult() {},
      onCloseBeginnerHelp() {
        closed += 1;
      }
    });

    openButton.listeners.click();
    closeButton.listeners.click({ target: closeButton });
    keydownListener({ key: "Escape" });

    assertEqual(opened, 1, "Open help button should call its handler");
    assertEqual(closed, 2, "Close button and Escape should close beginner help");
  });

  test("MVP-1.6 UI: yaku guide button and dialog render", async () => {
    const closedHtml = await renderState(await startMatchState(), { suggestYakuTargets: sampleYakuGuide });
    const openHtml = await renderState(await startMatchState(), {
      suggestYakuTargets: sampleYakuGuide,
      yakuGuideDialogOpen: true
    });

    assertTrue(closedHtml.includes('data-action="open-yaku-guide"'), "Yaku guide button should render in the human seat");
    assertTrue(!closedHtml.includes("yaku-guide-modal"), "Yaku guide should stay closed by default");
    assertTrue(openHtml.includes("yaku-guide-modal"), "Yaku guide modal should render when opened");
    assertTrue(openHtml.includes('data-action="close-yaku-guide"'), "Yaku guide modal should include a close action");
    assertTrue(openHtml.includes("yaku-guide-example-tiles"), "Yaku guide should show example tiles");
    assertTrue(openHtml.includes("yaku-guide-tile"), "Yaku guide should render tile examples with CSS tile markup");
  });

  test("MVP-1.6 UI: yaku guide suppresses advice, zoom, result, and beginner help popups", async () => {
    const state = await matchEndedHistoryState();
    const html = await renderState(addDiscards(state, 4), {
      suggestDiscards: sampleAdvice,
      suggestYakuTargets: sampleYakuGuide,
      discardAdviceDialogOpen: true,
      discardZoomPlayerId: 0,
      matchResultDialogOpen: true,
      beginnerHelpDialogOpen: true,
      yakuGuideDialogOpen: true
    });

    assertTrue(html.includes("yaku-guide-modal"), "Yaku guide should render");
    assertTrue(!html.includes("discard-advice-modal"), "Advice modal should be suppressed by yaku guide");
    assertTrue(!html.includes("discard-zoom-modal"), "Discard zoom modal should be suppressed by yaku guide");
    assertTrue(!html.includes("match-result-modal"), "Match result modal should be suppressed by yaku guide");
    assertTrue(!html.includes("beginner-help-modal"), "Beginner help modal should be suppressed by yaku guide");
  });

  test("MVP-1.6 UI: yaku guide controls dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let opened = 0;
    let closed = 0;
    let keydownListener = null;
    const openButton = createFakeButton();
    const closeButton = createFakeButton();
    const root = {
      addEventListener(type, listener) {
        if (type === "keydown") {
          keydownListener = listener;
        }
      },
      querySelector(selector) {
        if (selector === "[data-action='open-yaku-guide']") {
          return openButton;
        }

        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='close-yaku-guide']") {
          return [closeButton];
        }

        return [];
      }
    };

    bindControls(root, {
      onCloseDiscardAdvice() {},
      onCloseDiscardZoom() {},
      onCloseMatchResult() {},
      onCloseBeginnerHelp() {},
      onOpenYakuGuide() {
        opened += 1;
      },
      onCloseYakuGuide() {
        closed += 1;
      }
    });

    openButton.listeners.click();
    closeButton.listeners.click({ target: closeButton });
    keydownListener({ key: "Escape" });

    assertEqual(opened, 1, "Open yaku guide button should call its handler");
    assertEqual(closed, 2, "Close button and Escape should close yaku guide");
  });

  test("MVP-1.7 UI: waits button and dialog render", async () => {
    const closedHtml = await renderState(await startMatchState(), { analyzeWaits: sampleWaitInfo });
    const openHtml = await renderState(await startMatchState(), {
      analyzeWaits: sampleWaitInfo,
      waitsDialogOpen: true
    });

    assertTrue(closedHtml.includes('data-action="open-waits"'), "Waits button should render in the human seat");
    assertTrue(closedHtml.includes("has-waits"), "Tenpai wait button should indicate waits are available");
    assertTrue(!closedHtml.includes("waits-modal"), "Waits dialog should stay closed by default");
    assertTrue(openHtml.includes("waits-modal"), "Waits dialog should render when opened");
    assertTrue(openHtml.includes('data-action="close-waits"'), "Waits dialog should include a close action");
    assertTrue(openHtml.includes("waits-tile"), "Waits dialog should render wait tiles with CSS tile markup");
    assertTrue(openHtml.includes("waits-yaku"), "Yaku-valid waits should show yaku information");
  });

  test("MVP-1.9 UI: waits dialog shows discard-to-wait guidance", async () => {
    const closedHtml = await renderState(await startMatchState(), {
      analyzeWaits: sampleWaitInfo,
      analyzeDiscardWaits: sampleDiscardWaitInfo
    });
    const openHtml = await renderState(await startMatchState(), {
      analyzeWaits: sampleWaitInfo,
      analyzeDiscardWaits: sampleDiscardWaitInfo,
      waitsDialogOpen: true
    });

    assertTrue(closedHtml.includes("\u5207\u308b\u3068\u5f85\u3061"), "Waits button should show discard-to-wait state");
    assertTrue(openHtml.includes("discard-waits-section"), "Waits dialog should include discard-to-wait guidance");
    assertTrue(openHtml.includes("discard-waits-item"), "Discard-to-wait options should render as compact items");
    assertTrue(openHtml.includes("discard-waits-tiles"), "Discard-to-wait options should show wait tiles");
    assertTrue(openHtml.includes("current-waits-section"), "Current 13-tile waits can still render in the same dialog");
  });

  test("MVP-1.7 UI: waits dialog can show non-tenpai guidance", async () => {
    const html = await renderState(await startMatchState(), {
      analyzeWaits: () => ({
        isTenpai: false,
        waits: [],
        message: "\u307e\u3060\u30c6\u30f3\u30d1\u30a4\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002"
      }),
      waitsDialogOpen: true
    });

    assertTrue(html.includes("waits-modal"), "Waits dialog should open even when not tenpai");
    assertTrue(html.includes("waits-empty"), "Non-tenpai state should show an empty guidance message");
    assertTrue(!html.includes("waits-list"), "Non-tenpai state should not render wait candidates");
  });

  test("MVP-1.7 UI: waits dialog suppresses other popups", async () => {
    const state = await matchEndedHistoryState();
    const html = await renderState(addDiscards(state, 4), {
      suggestDiscards: sampleAdvice,
      suggestYakuTargets: sampleYakuGuide,
      analyzeWaits: sampleWaitInfo,
      discardAdviceDialogOpen: true,
      discardZoomPlayerId: 0,
      matchResultDialogOpen: true,
      beginnerHelpDialogOpen: true,
      yakuGuideDialogOpen: true,
      waitsDialogOpen: true
    });

    assertTrue(html.includes("waits-modal"), "Waits dialog should render");
    assertTrue(!html.includes("discard-advice-modal"), "Advice modal should be suppressed by waits dialog");
    assertTrue(!html.includes("discard-zoom-modal"), "Discard zoom modal should be suppressed by waits dialog");
    assertTrue(!html.includes("match-result-modal"), "Match result modal should be suppressed by waits dialog");
    assertTrue(!html.includes("beginner-help-modal"), "Beginner help modal should be suppressed by waits dialog");
    assertTrue(!html.includes("yaku-guide-modal"), "Yaku guide modal should be suppressed by waits dialog");
  });

  test("MVP-1.7 UI: waits controls dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let opened = 0;
    let closed = 0;
    let keydownListener = null;
    const openButton = createFakeButton();
    const closeButton = createFakeButton();
    const root = {
      addEventListener(type, listener) {
        if (type === "keydown") {
          keydownListener = listener;
        }
      },
      querySelector(selector) {
        if (selector === "[data-action='open-waits']") {
          return openButton;
        }

        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='close-waits']") {
          return [closeButton];
        }

        return [];
      }
    };

    bindControls(root, {
      onCloseDiscardAdvice() {},
      onCloseDiscardZoom() {},
      onCloseMatchResult() {},
      onCloseBeginnerHelp() {},
      onCloseYakuGuide() {},
      onOpenWaits() {
        opened += 1;
      },
      onCloseWaits() {
        closed += 1;
      }
    });

    openButton.listeners.click();
    closeButton.listeners.click({ target: closeButton });
    keydownListener({ key: "Escape" });

    assertEqual(opened, 1, "Open waits button should call its handler");
    assertEqual(closed, 2, "Close button and Escape should close waits dialog");
  });

  test("MVP-1.2 UI: discard zoom controls render for all four center discard zones", async () => {
    const html = await renderState(addDiscards(await startMatchState(), 6));

    assertEqual((html.match(/data-action="open-discard-zoom"/g) || []).length, 4, "All four discard zones should open the zoom dialog");
    assertTrue(html.includes('data-player-id="0"'), "Human discard zoom target should render");
    assertTrue(html.includes('data-player-id="1"'), "South CPU discard zoom target should render");
    assertTrue(html.includes('data-player-id="2"'), "West CPU discard zoom target should render");
    assertTrue(html.includes('data-player-id="3"'), "North CPU discard zoom target should render");
    assertTrue(html.includes("discard-zoom-hint"), "Discard zones should visibly hint that they can be enlarged");
  });

  test("MVP-1.2 UI: human discard zoom dialog shows enlarged discard list", async () => {
    const html = await renderState(addDiscards(await startMatchState(), 18), { discardZoomPlayerId: 0 });
    const modalHtml = extractSectionHtml(html, "discard-zoom-backdrop");

    assertTrue(html.includes("discard-zoom-modal"), "Discard zoom modal should render when a player is selected");
    assertTrue(html.includes("東 あなた"), "Zoom modal should show the selected player name");
    assertTrue(html.includes('data-action="close-discard-zoom"'), "Zoom modal should include a close action");
    assertEqual(countZoomDiscardTiles(modalHtml), 18, "Zoom modal should show the selected player's 18 discards");
  });

  test("MVP-1.2 UI: CPU discard zoom dialogs can target north, west, and south", async () => {
    const state = addDiscards(await startMatchState(), 9);
    const northHtml = await renderState(state, { discardZoomPlayerId: 3 });
    const westHtml = await renderState(state, { discardZoomPlayerId: 2 });
    const southHtml = await renderState(state, { discardZoomPlayerId: 1 });

    assertTrue(northHtml.includes("北 CPU 3"), "North CPU zoom should identify CPU 3");
    assertTrue(westHtml.includes("西 CPU 2"), "West CPU zoom should identify CPU 2");
    assertTrue(southHtml.includes("南 CPU 1"), "South CPU zoom should identify CPU 1");
    assertEqual(countZoomDiscardTiles(extractSectionHtml(northHtml, "discard-zoom-backdrop")), 9, "North CPU zoom should show its discards");
    assertEqual(countZoomDiscardTiles(extractSectionHtml(westHtml, "discard-zoom-backdrop")), 9, "West CPU zoom should show its discards");
    assertEqual(countZoomDiscardTiles(extractSectionHtml(southHtml, "discard-zoom-backdrop")), 9, "South CPU zoom should show its discards");
  });

  test("MVP-1.2 UI: discard zoom and advice modal do not render at the same time", async () => {
    const started = await startMatchState();
    const state = {
      ...started,
      settings: {
        ...started.settings,
        discardAdviceEnabled: true
      }
    };
    const html = await renderState(addDiscards(state, 4), {
      suggestDiscards: sampleAdvice,
      discardAdviceDialogOpen: true,
      discardZoomPlayerId: 0
    });

    assertTrue(html.includes("discard-zoom-modal"), "Discard zoom should render");
    assertTrue(!html.includes("discard-advice-modal"), "Advice modal should be suppressed while discard zoom is open");
  });

  test("MVP-1.2 UI: discard zoom controls dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let openedPlayerId = null;
    let closed = 0;
    const openTrigger = createFakeButton({ playerId: "2" });
    const closeTrigger = createFakeButton();
    const root = {
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='open-discard-zoom']") {
          return [openTrigger];
        }

        if (selector === "[data-action='close-discard-zoom']") {
          return [closeTrigger];
        }

        return [];
      }
    };

    bindControls(root, {
      onStartMatch() {},
      onStartRound() {},
      onStartNextRound() {},
      onToggleLargeTileMode() {},
      onToggleDiscardAdvice() {},
      onOpenDiscardZoom(playerId) {
        openedPlayerId = playerId;
      },
      onCloseDiscardZoom() {
        closed += 1;
      },
      onDiscardTile() {},
      onDeclareTsumo() {},
      onDeclareRon() {},
      onSkipRon() {}
    });
    openTrigger.listeners.click();
    closeTrigger.listeners.click();

    assertEqual(openedPlayerId, "2", "Open zoom should pass the selected player id");
    assertEqual(closed, 1, "Close zoom should call its handler");
  });

  test("MVP-1.2 UI: discard zoom closes from backdrop and Escape", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let closed = 0;
    let keydownListener = null;
    const backdrop = createFakeButton();
    backdrop.classList = {
      contains(className) {
        return className === "discard-zoom-backdrop";
      }
    };
    const root = {
      addEventListener(type, listener) {
        if (type === "keydown") {
          keydownListener = listener;
        }
      },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='close-discard-zoom']") {
          return [backdrop];
        }

        return [];
      }
    };

    bindControls(root, {
      onCloseDiscardAdvice() {},
      onCloseDiscardZoom() {
        closed += 1;
      }
    });

    backdrop.listeners.click({ target: backdrop });
    keydownListener({ key: "Escape" });

    assertEqual(closed, 2, "Backdrop click and Escape should close discard zoom");
  });

  test("MVP-1.3 UI: match end summary offers result history", async () => {
    const html = await renderState(await matchEndedHistoryState());

    assertTrue(html.includes("東風戦終了"), "Match end should show the east-only match end title");
    assertTrue(html.includes("4局遊び終わりました。"), "Match end should explain that four hands are complete");
    assertTrue(html.includes("点数計算はまだ未対応です。"), "Match end should explain that scoring is not implemented");
    assertTrue(html.includes('data-action="start-match"'), "Match end should keep the replay action visible");
    assertTrue(html.includes('data-action="open-match-result"'), "Match end should offer a result history button");
  });

  test("MVP-1.3 UI: match result popup lists East 1 through East 4 history", async () => {
    const html = await renderState(await matchEndedHistoryState(), { matchResultDialogOpen: true });

    assertTrue(html.includes("match-result-modal"), "Result popup should render when opened");
    assertTrue(html.includes("今回の結果"), "Result popup should include a beginner-friendly heading");
    assertTrue(html.includes("東1局"), "Result popup should show East 1");
    assertTrue(html.includes("東2局"), "Result popup should show East 2");
    assertTrue(html.includes("東3局"), "Result popup should show East 3");
    assertTrue(html.includes("東4局"), "Result popup should show East 4");
    assertTrue(html.includes("あなたのツモ"), "Result popup should show human tsumo result");
    assertTrue(html.includes("南CPUのロン"), "Result popup should show CPU ron result");
    assertTrue(html.includes("流局"), "Result popup should show draw results");
    assertTrue(html.includes('data-action="close-match-result"'), "Result popup should include a close action");
  });

  test("MVP-1.8 UI: CPU tsumo win keeps next-round action visible", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await scenarioState("cpu-tsumo-ready-yakuhai");
    const wonState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 1 });
    const html = await renderState(wonState);

    assertTrue(html.includes("CPU 1"), "CPU tsumo display should include the CPU winner name");
    assertTrue(html.includes("table-action-bar"), "CPU tsumo display should keep the action bar");
    assertTrue(html.includes('data-action="start-next-round"'), "CPU tsumo display should offer next round");
  });

  test("MVP-1.8 UI: CPU ron win keeps next-round action visible", async () => {
    const { resolveCpuRonAfterDiscard } = await loadModule("../src/game/actions.js", ["resolveCpuRonAfterDiscard"]);
    const state = await scenarioState("cpu-ron-ready-yakuhai");
    const wonState = resolveCpuRonAfterDiscard(state);
    const html = await renderState(wonState);

    assertTrue(html.includes("CPU 1"), "CPU ron display should include the CPU winner name");
    assertTrue(html.includes("table-action-bar"), "CPU ron display should keep the action bar");
    assertTrue(html.includes('data-action="start-next-round"'), "CPU ron display should offer next round");
  });

  test("MVP-1.9.1 UI: all-hands action appears after every round end type", async () => {
    const { dispatchAction, resolveCpuRonAfterDiscard } = await loadModule("../src/game/actions.js", ["dispatchAction", "resolveCpuRonAfterDiscard"]);
    const humanTsumo = dispatchAction(await scenarioState("human-tsumo-ready"), { type: "DECLARE_TSUMO", playerId: 0 });
    const humanRon = dispatchAction(await scenarioState("ron-ready-tanyao", { phase: "reaction" }), { type: "DECLARE_RON", playerId: 0 });
    const cpuTsumo = dispatchAction(await scenarioState("cpu-tsumo-ready-yakuhai"), { type: "DECLARE_TSUMO", playerId: 1 });
    const cpuRon = resolveCpuRonAfterDiscard(await scenarioState("cpu-ron-ready-yakuhai"));
    const draw = await endedHandState(2);

    for (const endedState of [humanTsumo, humanRon, cpuTsumo, cpuRon, draw]) {
      const html = await renderState(endedState);
      assertTrue(html.includes('data-action="open-all-hands"'), "Ended round should offer the all-hands learning popup");
    }
  });

  test("MVP-1.9.1 UI: all-hands popup shows four hands only after round end", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const playingHtml = await renderState(await startMatchState(), { allHandsDialogOpen: true });
    const wonState = dispatchAction(await scenarioState("cpu-tsumo-ready-yakuhai"), { type: "DECLARE_TSUMO", playerId: 1 });
    const openHtml = await renderState(wonState, { allHandsDialogOpen: true });

    assertTrue(!playingHtml.includes("all-hands-modal"), "All-hands popup should not render during play");
    assertTrue(openHtml.includes("all-hands-modal"), "All-hands popup should render after the round ends");
    assertEqual((openHtml.match(/all-hands-item/g) || []).length, 4, "All-hands popup should include all four players");
    assertTrue(openHtml.includes("data-player-id=\"0\""), "Human hand should be included");
    assertTrue(openHtml.includes("data-player-id=\"1\""), "South CPU hand should be included after round end");
    assertTrue(openHtml.includes("data-player-id=\"2\""), "West CPU hand should be included after round end");
    assertTrue(openHtml.includes("data-player-id=\"3\""), "North CPU hand should be included after round end");
    assertTrue(openHtml.includes("all-hands-winner"), "Winner should be highlighted when the hand ends by win");
    assertTrue((openHtml.match(/all-hands-tile/g) || []).length >= 40, "All-hands popup should render visible CSS tiles for the hands");
    assertTrue(openHtml.includes('data-action="close-all-hands"'), "All-hands popup should include a close action");
  });

  test("MVP-1.9.1 UI: all-hands popup sorts CPU hands for display without mutating state", async () => {
    const state = await matchEndedHistoryState();
    const south = state.round.players[1];
    south.hand = tilesForUi("z7 p9 m1 s4 z1 p1 m9 s1 z5 m3 p2 s9 z3");
    const originalOrder = south.hand.map((tile) => tile.id).join(",");
    const html = await renderState(state, { allHandsDialogOpen: true });
    const southSection = getTaggedSection(html, 'data-player-id="1"');
    const displayedLabels = getTileSymbols(southSection).slice(0, south.hand.length);

    assertTrue(southSection.includes("all-hands-item"), "South CPU all-hands section should render");
    assertEqual(displayedLabels.slice(0, 6).join(" "), "1 3 9 1 2 9", "CPU display hand should start in sorted suit/rank order");
    assertEqual(displayedLabels.slice(-4).join(" "), "東 西 白 中", "CPU display hand should place honors after suited tiles");
    assertEqual(south.hand.map((tile) => tile.id).join(","), originalOrder, "Rendering all-hands must not mutate the CPU hand array");
  });

  test("MVP-1.9.1 UI: all-hands popup suppresses other popups", async () => {
    const html = await renderState(await matchEndedHistoryState(), {
      suggestDiscards: sampleAdvice,
      suggestYakuTargets: sampleYakuGuide,
      analyzeWaits: sampleWaitInfo,
      discardAdviceDialogOpen: true,
      discardZoomPlayerId: 0,
      matchResultDialogOpen: true,
      beginnerHelpDialogOpen: true,
      yakuGuideDialogOpen: true,
      waitsDialogOpen: true,
      allHandsDialogOpen: true
    });

    assertTrue(html.includes("all-hands-modal"), "All-hands popup should render as the active learning overlay");
    assertTrue(!html.includes("discard-advice-modal"), "Advice popup should be suppressed by all-hands popup");
    assertTrue(!html.includes("discard-zoom-modal"), "Discard zoom popup should be suppressed by all-hands popup");
    assertTrue(!html.includes("match-result-modal"), "Match result popup should be suppressed by all-hands popup");
    assertTrue(!html.includes("beginner-help-modal"), "Beginner help popup should be suppressed by all-hands popup");
    assertTrue(!html.includes("yaku-guide-modal"), "Yaku guide popup should be suppressed by all-hands popup");
    assertTrue(!html.includes("waits-modal"), "Waits popup should be suppressed by all-hands popup");
  });

  test("MVP-1.9.1 UI: all-hands controls dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let opened = 0;
    let closed = 0;
    let keydownListener = null;
    const openButton = createFakeButton();
    const closeButton = createFakeButton();
    const backdrop = createFakeButton();
    backdrop.classList = {
      contains(className) {
        return className === "all-hands-backdrop";
      }
    };
    const root = {
      addEventListener(type, listener) {
        if (type === "keydown") {
          keydownListener = listener;
        }
      },
      querySelector(selector) {
        return selector === "[data-action='open-all-hands']" ? openButton : null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='close-all-hands']") {
          return [closeButton, backdrop];
        }

        return [];
      }
    };

    bindControls(root, {
      onOpenAllHands() {
        opened += 1;
      },
      onCloseDiscardAdvice() {},
      onCloseDiscardZoom() {},
      onCloseMatchResult() {},
      onCloseBeginnerHelp() {},
      onCloseYakuGuide() {},
      onCloseWaits() {},
      onCloseAllHands() {
        closed += 1;
      }
    });

    openButton.listeners.click();
    closeButton.listeners.click({ target: closeButton });
    backdrop.listeners.click({ target: backdrop });
    keydownListener({ key: "Escape" });

    assertEqual(opened, 1, "Open all-hands button should call its handler");
    assertEqual(closed, 3, "Close button, backdrop, and Escape should close all-hands popup");
  });

  test("MVP-1.3.1 UI: match result popup handles empty history", async () => {
    const state = await matchEndedHistoryState();
    const html = await renderState({
      ...state,
      match: {
        ...state.match,
        roundHistory: []
      }
    }, { matchResultDialogOpen: true });

    assertTrue(html.includes("match-result-modal"), "Result popup should still render with empty history");
    assertTrue(html.includes("match-result-list"), "Result popup should keep the result list structure");
    assertTrue(html.includes('data-action="close-match-result"'), "Result popup should still include a close action");
  });

  test("MVP-1.3 UI: match result popup suppresses other popups", async () => {
    const html = await renderState(await matchEndedHistoryState(), {
      suggestDiscards: sampleAdvice,
      discardAdviceDialogOpen: true,
      discardZoomPlayerId: 0,
      matchResultDialogOpen: true
    });

    assertTrue(html.includes("match-result-modal"), "Result popup should render");
    assertTrue(!html.includes("discard-advice-modal"), "Advice popup should not stay open with result popup");
    assertTrue(!html.includes("discard-zoom-modal"), "Discard zoom popup should not stay open with result popup");
  });

  test("MVP-1.3 UI: match result controls dispatch open and close handlers", async () => {
    const { bindControls } = await loadModule("../src/ui/input.js", ["bindControls"]);
    let opened = 0;
    let closed = 0;
    let keydownListener = null;
    const openButton = createFakeButton();
    const closeButton = createFakeButton();
    const root = {
      addEventListener(type, listener) {
        if (type === "keydown") {
          keydownListener = listener;
        }
      },
      querySelector(selector) {
        if (selector === "[data-action='open-match-result']") {
          return openButton;
        }

        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-action='close-match-result']") {
          return [closeButton];
        }

        return [];
      }
    };

    bindControls(root, {
      onOpenMatchResult() {
        opened += 1;
      },
      onCloseDiscardAdvice() {},
      onCloseDiscardZoom() {},
      onCloseMatchResult() {
        closed += 1;
      }
    });

    openButton.listeners.click();
    closeButton.listeners.click({ target: closeButton });
    keydownListener({ key: "Escape" });

    assertEqual(opened, 1, "Open result should call its handler");
    assertEqual(closed, 2, "Close button and Escape should close result popup");
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

function countZoomDiscardTiles(html) {
  return (html.match(/class="tile[^"]*discard-zoom-tile/g) || []).length;
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

async function matchEndedHistoryState() {
  const state = await startMatchState();
  const roundHistory = [
    { handLabel: "東1局", handNumber: 1, resultType: "draw" },
    { handLabel: "東2局", handNumber: 2, resultType: "tsumo", winnerId: 0, winType: "tsumo" },
    { handLabel: "東3局", handNumber: 3, resultType: "ron", winnerId: 1, winType: "ron" },
    { handLabel: "東4局", handNumber: 4, resultType: "draw" }
  ];

  return {
    ...state,
    match: {
      ...state.match,
      phase: "ended",
      status: "ended",
      handNumber: 4,
      dealerIndex: 3,
      roundHistory
    },
    round: {
      ...state.round,
      handNumber: 4,
      dealerIndex: 3,
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
    canCompleteRonLatestDiscard: () => false,
    suggestDiscards: () => [],
    ...renderOptions
  });

  return root.innerHTML;
}

async function scenarioState(name, options = {}) {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  return createScenarioState(name, options);
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

function sampleYakuGuide() {
  return [
    {
      id: "tanyao",
      name: "\u65ad\u4e48\u4e5d",
      reading: "\u30bf\u30f3\u30e4\u30aa",
      priority: 80,
      description: "1\u30fb9\u30fb\u5b57\u724c\u3092\u4f7f\u308f\u306a\u3044\u5f79\u3067\u3059\u3002",
      why: "2\u301c8\u306e\u6570\u724c\u304c\u591a\u3044\u306e\u3067\u72d9\u3044\u3084\u3059\u305d\u3046\u3067\u3059\u3002",
      keepHints: ["2\u301c8\u306e\u6570\u724c"],
      discardHints: ["1\u30fb9\u30fb\u5b57\u724c"],
      exampleTiles: tilesForUi("m2 m3 m4 p4 p5 p6 s3 s4 s5")
    },
    {
      id: "yakuhai",
      name: "\u5f79\u724c",
      reading: "\u30e4\u30af\u30cf\u30a4",
      priority: 70,
      description: "\u767d\u30fb\u767c\u30fb\u4e2d\u30923\u679a\u305d\u308d\u3048\u308b\u5f79\u3067\u3059\u3002",
      why: "\u767d\u304c2\u679a\u3042\u308b\u306e\u3067\u5019\u88dc\u3067\u3059\u3002",
      keepHints: ["\u5f79\u724c"],
      discardHints: ["\u5b64\u7acb\u724c"],
      exampleTiles: tilesForUi("z5 z5 z5")
    }
  ];
}

function sampleWaitInfo() {
  return {
    isTenpai: true,
    message: "5\u7b52\u304c\u6765\u308b\u3068\u4e0a\u304c\u308c\u307e\u3059\u3002",
    waits: [
      {
        tile: { id: "wait-p5", suit: "p", rank: 5, copy: 0, red: false },
        tileLabel: "5\u7b52",
        canWin: true,
        hasYaku: true,
        yaku: [{ id: "tanyao", name: "\u65ad\u4e48\u4e5d", han: 1 }],
        message: "5\u7b52\u304c\u6765\u308b\u3068\u4e0a\u304c\u308c\u307e\u3059\u3002"
      },
      {
        tile: { id: "wait-m9", suit: "m", rank: 9, copy: 0, red: false },
        tileLabel: "9\u842c",
        canWin: false,
        hasYaku: false,
        yaku: [],
        message: "9\u842c\u3067\u5f62\u306f\u5b8c\u6210\u3057\u307e\u3059\u304c\u3001\u5f79\u304c\u3042\u308a\u307e\u305b\u3093\u3002"
      }
    ]
  };
}

function sampleDiscardWaitInfo() {
  return {
    hasTenpaiDiscard: true,
    message: "1\u842c\u3092\u5207\u308b\u3068\u5f85\u3061\u304c\u6b8b\u308a\u307e\u3059\u3002",
    options: [
      {
        discardTile: { id: "discard-m1", suit: "m", rank: 1, copy: 0, red: false },
        discardTileId: "discard-m1",
        discardTileLabel: "1\u842c",
        isTenpaiAfterDiscard: true,
        hasYakuWait: true,
        message: "1\u842c\u3092\u5207\u308b\u30685\u7b52\u5f85\u3061\u306b\u306a\u308a\u307e\u3059\u3002",
        waits: [
          {
            tile: { id: "wait-p5", suit: "p", rank: 5, copy: 0, red: false },
            tileLabel: "5\u7b52",
            canWin: true,
            hasYaku: true,
            yaku: [{ id: "tanyao", name: "\u65ad\u4e48\u4e5d", han: 1 }],
            message: "5\u7b52\u304c\u6765\u308b\u3068\u4e0a\u304c\u308c\u307e\u3059\u3002"
          }
        ]
      }
    ]
  };
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

function tilesForUi(pattern) {
  return pattern.split(/\s+/).filter(Boolean).map((token, index) => ({
    id: `guide-ui-${token}-${index}`,
    suit: token[0],
    rank: Number(token.slice(1)),
    copy: index % 4,
    red: false
  }));
}

function getTaggedSection(html, marker) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    return "";
  }

  const sectionStart = html.lastIndexOf("<section", markerIndex);
  const sectionEnd = html.indexOf("</section>", markerIndex);

  if (sectionStart < 0 || sectionEnd < 0) {
    return "";
  }

  return html.slice(sectionStart, sectionEnd + "</section>".length);
}

function getTileSymbols(html) {
  return Array.from(html.matchAll(/class="tile-symbol">([^<]+)<\/span>/g)).map((match) => match[1]);
}

function createMainStartupHarness() {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  if (originalDocument?.createElement && originalDocument?.body) {
    const root = originalDocument.createElement("div");
    root.id = "app";
    originalDocument.body.appendChild(root);

    return {
      root,
      cleanup() {
        root.remove();
      }
    };
  }

  const root = {
    innerHTML: "",
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  globalThis.document = {
    querySelector(selector) {
      return selector === "#app" ? root : null;
    }
  };
  globalThis.window = {
    clearTimeout() {},
    setTimeout(callback) {
      callback();
      return 0;
    }
  };
  globalThis.localStorage = createMemoryStorage();

  return {
    root,
    cleanup() {
      globalThis.document = originalDocument;
      globalThis.window = originalWindow;
      globalThis.localStorage = originalLocalStorage;
    }
  };
}

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

async function waitForStartupRender() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => globalThis.setTimeout(resolve, 20));
}

function createFakeButton(dataset = {}) {
  return {
    dataset,
    listeners: {},
    classList: {
      contains() {
        return false;
      }
    },
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
