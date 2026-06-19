import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerPonTests() {
  test("PON: new round players start with empty melds", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());

    assertTrue(state.round.players.every((player) => Array.isArray(player.melds)), "Every player should have a meld list");
    assertTrue(state.round.players.every((player) => player.melds.length === 0), "New rounds should begin with no melds");
  });

  test("PON: matching pair can call pon on another player discard", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const { canDeclarePon, getPonOptions } = await loadPonActions();
    const options = getPonOptions(state, 0);

    assertEqual(canDeclarePon(state, 0), true, "Human should be able to pon with two matching tiles");
    assertEqual(options.length, 1, "One pon option should be listed");
    assertEqual(options[0].calledTile.suit, "z", "Called tile should be an honor");
    assertEqual(options[0].calledTile.rank, 5, "Called tile should be white dragon");
  });

  test("PON: one matching tile cannot call pon", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const human = state.round.players[0];
    const removedOneDragon = {
      ...state,
      round: {
        ...state.round,
        players: state.round.players.map((player) => player.id === 0
          ? { ...player, hand: removeOneKind(human.hand, "z", 5) }
          : player)
      }
    };
    const { canDeclarePon } = await loadPonActions();

    assertEqual(canDeclarePon(removedOneDragon, 0), false, "A single matching tile should not allow pon");
  });

  test("PON: own discard and riichi both block pon", async () => {
    const ownDiscard = await scenarioState("human-pon-ready-yakuhai");
    ownDiscard.round.lastDiscard = {
      playerId: 0,
      tile: ownDiscard.round.players[1].discards[0]
    };
    const riichiState = await scenarioState("human-pon-riichi-blocked");
    const { canDeclarePon } = await loadPonActions();

    assertEqual(canDeclarePon(ownDiscard, 0), false, "Human should not pon their own discard");
    assertEqual(canDeclarePon(riichiState, 0), false, "Riichi should block pon calls");
  });

  test("PON: DECLARE_PON removes two hand tiles and adds an open meld", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const { dispatchAction } = await loadPonActions();
    const nextState = dispatchAction(state, { type: "DECLARE_PON", playerId: 0 });
    const human = nextState.round.players[0];

    assertEqual(human.hand.length, state.round.players[0].hand.length - 2, "Pon should remove two tiles from hand");
    assertEqual(human.melds.length, 1, "Pon should add one meld");
    assertEqual(human.melds[0].type, "pon", "Meld type should be pon");
    assertEqual(human.melds[0].fromPlayerId, 1, "Meld should remember the source player");
    assertEqual(human.isClosed, false, "Pon should make the hand open");
    assertEqual(human.menzen, false, "Pon should clear menzen status");
    assertEqual(nextState.round.phase, "discard", "Pon should move to discard phase");
    assertEqual(nextState.round.currentPlayerIndex, 0, "Pon caller should become current player");
  });

  test("PON: after pon discard can continue normal flow", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const { dispatchAction } = await loadPonActions();
    const called = dispatchAction(state, { type: "DECLARE_PON", playerId: 0 });
    const discardTile = called.round.players[0].hand[0];
    const discarded = dispatchAction(called, { type: "DISCARD_TILE", playerId: 0, tileId: discardTile.id });
    const advanced = dispatchAction(discarded, { type: "ADVANCE_TURN" });

    assertEqual(discarded.round.phase, "draw", "Discard after pon should return to draw flow");
    assertEqual(discarded.round.lastDiscard.playerId, 0, "Human discard after pon should become latest discard");
    assertEqual(discarded.round.lastActionResult ?? null, null, "Discard after pon should clear the pon guidance message");
    assertEqual(advanced.round.currentPlayerIndex, 1, "After pon discard, next player should be south CPU");
  });

  test("PON: open hand cannot declare riichi", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const { dispatchAction, canDeclareRiichi } = await loadPonActions(["canDeclareRiichi"]);
    const called = dispatchAction(state, { type: "DECLARE_PON", playerId: 0 });

    assertEqual(canDeclareRiichi(called, 0), false, "An open hand should not be able to declare riichi");
  });

  test("PON: yakuhai pon counts as yaku and open tsumo is not menzen tsumo", async () => {
    const state = await scenarioState("human-pon-yakuhai-win-shape");
    const { detectYaku } = await loadModule("../src/game/rules/yaku.js", ["detectYaku"]);
    const human = state.round.players[0];
    const allTiles = [...human.hand, ...human.melds.flatMap((meld) => meld.tiles)];
    const yaku = detectYaku(allTiles, { winType: "tsumo", isClosed: false, menzen: false });
    const yakuIds = yaku.map((entry) => entry.id);

    assertTrue(yakuIds.includes("yakuhai"), "Open dragon pon should count as yakuhai");
    assertEqual(yakuIds.includes("menzen_tsumo"), false, "Open hand should not receive menzen tsumo");
  });

  test("PON: open yakuhai hand can show tsumo through meld-aware check", async () => {
    const state = await scenarioState("human-pon-yakuhai-win-shape");
    const { canDeclareTsumo } = await loadPonActions(["canDeclareTsumo"]);

    assertEqual(canDeclareTsumo(state, 0), true, "Open yakuhai winning shape should be able to declare tsumo");
  });

  test("PON UI: pon reaction renders pon and skip buttons", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const html = await renderState(state, {
      canDeclarePon: () => true
    });

    assertTrue(html.includes('data-action="declare-pon"'), "Pon reaction should show a pon button");
    assertTrue(html.includes('data-action="skip-ron"'), "Pon reaction should keep a skip button");
  });

  test("PON UI: open meld renders near the human seat", async () => {
    const state = await scenarioState("human-pon-after-discard");
    const html = await renderState(state);

    assertTrue(html.includes("meld-area"), "Open meld area should render");
    assertTrue(html.includes("meld-pon"), "Pon meld should render with a pon class");
    assertTrue(html.includes("meld-tile"), "Meld tiles should use tile rendering");
  });
}

async function loadPonActions(extraExports = []) {
  return loadModule("../src/game/actions.js", [
    "canDeclarePon",
    "getPonOptions",
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
    suggestDiscards: () => [],
    ...renderOptions
  });

  return root.innerHTML;
}

function removeOneKind(tiles, suit, rank) {
  let removed = false;

  return tiles.filter((tile) => {
    if (!removed && tile.suit === suit && tile.rank === rank) {
      removed = true;
      return false;
    }

    return true;
  });
}
