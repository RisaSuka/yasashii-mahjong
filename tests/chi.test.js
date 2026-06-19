import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerChiTests() {
  test("CHI: upper player number discard can create a chi option", async () => {
    const state = await scenarioState("human-chi-ready");
    const { canDeclareChi, getChiOptions } = await loadChiActions();
    const options = getChiOptions(state, 0);

    assertEqual(canDeclareChi(state, 0), true, "Human should be able to chi the upper player's discard");
    assertEqual(options.length, 1, "One chi option should be listed");
    assertEqual(options[0].fromPlayerId, 3, "Chi should remember the upper player as source");
    assertEqual(options[0].type, "chi", "Option type should be chi");
    assertEqual(options[0].handTileIds.length, 2, "Chi option should select two hand tiles");
    assertEqual(optionRanks(options[0]).join("-"), "3-4-5", "Chi tiles should form 3-4-5");
  });

  test("CHI: multiple sequence choices are listed separately", async () => {
    const state = await scenarioState("human-chi-multiple-options");
    const { getChiOptions } = await loadChiActions();
    const options = getChiOptions(state, 0);
    const sequences = options.map((option) => optionRanks(option).join("-"));

    assertEqual(options.length, 3, "Three chi options should be available around a five discard");
    assertTrue(sequences.includes("3-4-5"), "3-4-5 chi should be available");
    assertTrue(sequences.includes("4-5-6"), "4-5-6 chi should be available");
    assertTrue(sequences.includes("5-6-7"), "5-6-7 chi should be available");
  });

  test("CHI: non-upper player, riichi, and honors block chi", async () => {
    const notKamicha = await scenarioState("human-chi-not-kamicha");
    const riichiState = await scenarioState("human-chi-riichi-blocked");
    const honorDiscard = await scenarioState("human-chi-ready");
    honorDiscard.round.lastDiscard.tile = { id: "layout-z5", suit: "z", rank: 5, copy: 0, red: false };
    const { canDeclareChi, getChiOptionsForDiscard } = await loadChiActions(["getChiOptionsForDiscard"]);

    assertEqual(canDeclareChi(notKamicha, 0), false, "Human should only chi from the upper player");
    assertEqual(canDeclareChi(riichiState, 0), false, "Riichi should block chi calls");
    assertEqual(canDeclareChi(honorDiscard, 0), false, "Honor tiles cannot be chi");
    assertEqual(getChiOptionsForDiscard(honorDiscard.round.lastDiscard.tile, honorDiscard.round.players[0].hand).length, 0, "Honor discard should produce no raw chi options");
  });

  test("CHI: DECLARE_CHI removes two hand tiles and adds an open meld", async () => {
    const state = await scenarioState("human-chi-ready");
    const { dispatchAction, getChiOptions } = await loadChiActions();
    const option = getChiOptions(state, 0)[0];
    const nextState = dispatchAction(state, { type: "DECLARE_CHI", playerId: 0, handTileIds: option.handTileIds });
    const human = nextState.round.players[0];

    assertEqual(human.hand.length, state.round.players[0].hand.length - 2, "Chi should remove two tiles from hand");
    assertEqual(human.melds.length, 1, "Chi should add one meld");
    assertEqual(human.melds[0].type, "chi", "Meld type should be chi");
    assertEqual(human.melds[0].fromPlayerId, 3, "Chi meld should remember the source player");
    assertEqual(human.isClosed, false, "Chi should make the hand open");
    assertEqual(human.menzen, false, "Chi should clear menzen status");
    assertEqual(nextState.round.phase, "discard", "Chi should move to discard phase");
    assertEqual(nextState.round.currentPlayerIndex, 0, "Chi caller should become current player");
    assertEqual(nextState.round.lastActionResult.callType, "chi", "Chi should show temporary discard guidance");
  });

  test("CHI: after chi discard can continue normal flow and clears guidance", async () => {
    const state = await scenarioState("human-chi-ready");
    const { dispatchAction, getChiOptions } = await loadChiActions();
    const called = dispatchAction(state, {
      type: "DECLARE_CHI",
      playerId: 0,
      handTileIds: getChiOptions(state, 0)[0].handTileIds
    });
    const discardTile = called.round.players[0].hand[0];
    const discarded = dispatchAction(called, { type: "DISCARD_TILE", playerId: 0, tileId: discardTile.id });
    const advanced = dispatchAction(discarded, { type: "ADVANCE_TURN" });

    assertEqual(discarded.round.phase, "draw", "Discard after chi should return to draw flow");
    assertEqual(discarded.round.lastDiscard.playerId, 0, "Human discard after chi should become latest discard");
    assertEqual(discarded.round.lastActionResult ?? null, null, "Discard after chi should clear the chi guidance message");
    assertEqual(advanced.round.currentPlayerIndex, 1, "After chi discard, next player should be south CPU");
  });

  test("CHI: open hand cannot declare riichi", async () => {
    const state = await scenarioState("human-chi-ready");
    const { dispatchAction, getChiOptions, canDeclareRiichi } = await loadChiActions(["canDeclareRiichi"]);
    const called = dispatchAction(state, {
      type: "DECLARE_CHI",
      playerId: 0,
      handTileIds: getChiOptions(state, 0)[0].handTileIds
    });

    assertEqual(canDeclareRiichi(called, 0), false, "An open chi hand should not be able to declare riichi");
  });

  test("CHI UI: chi reaction renders candidate buttons and skip", async () => {
    const state = await scenarioState("human-chi-multiple-options");
    const { getChiOptions } = await loadChiActions();
    const html = await renderState(state, {
      canDeclareChi: () => true,
      getChiOptions: () => getChiOptions(state, 0)
    });

    assertEqual(countOccurrences(html, 'data-action="declare-chi"'), 3, "Each chi candidate should render as its own button");
    assertTrue(html.includes("chi-option-tile"), "Chi buttons should show the tile combination");
    assertTrue(html.includes('data-action="skip-ron"'), "Chi reaction should keep a skip button");
  });

  test("CHI UI: multiple melds render horizontally near the human seat", async () => {
    const state = await scenarioState("human-multiple-melds-layout");
    const html = await renderState(state);

    assertTrue(html.includes("meld-area"), "Open meld area should render");
    assertTrue(html.includes("meld-chi"), "Chi meld should render with a chi class");
    assertTrue(countOccurrences(html, "class=\"meld ") >= 3, "Multiple melds should render");
  });
}

async function loadChiActions(extraExports = []) {
  return loadModule("../src/game/actions.js", [
    "canDeclareChi",
    "getChiOptions",
    "dispatchAction",
    ...extraExports
  ]);
}

async function scenarioState(name, options = {}) {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  return createScenarioState(name, options);
}

async function renderState(state, renderOptions = {}) {
  const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
  const root = { innerHTML: "" };

  renderGame(state, root, {
    canDeclareTsumo: () => false,
    canDeclareRon: () => false,
    canCompleteRonLatestDiscard: () => false,
    canDeclarePon: () => false,
    canDeclareChi: () => false,
    getChiOptions: () => [],
    suggestDiscards: () => [],
    ...renderOptions
  });

  return root.innerHTML;
}

function optionRanks(option) {
  return option.tiles.map((tile) => tile.rank);
}

function countOccurrences(text, pattern) {
  return text.split(pattern).length - 1;
}
