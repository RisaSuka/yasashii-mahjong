import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerCallStabilityTests() {
  test("CALL: open yakuhai pon tsumo wins without menzen tsumo", async () => {
    const state = await scenarioState("human-pon-yakuhai-win-shape");
    const { canDeclareTsumo, dispatchAction } = await loadCallActions();

    assertEqual(canDeclareTsumo(state, 0), true, "Open yakuhai pon hand should be able to tsumo");

    const won = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });
    const yakuIds = yakuIdsFrom(won);

    assertEqual(won.round.phase, "ended", "Open yakuhai tsumo should end the hand");
    assertTrue(yakuIds.includes("yakuhai"), "Open yakuhai pon should keep yakuhai yaku");
    assertEqual(yakuIds.includes("menzen_tsumo"), false, "Open tsumo should not receive menzen tsumo");
  });

  test("CALL: open chi tanyao can win with tanyao", async () => {
    const state = await scenarioState("human-open-tanyao-win-shape");
    const { canDeclareTsumo, dispatchAction } = await loadCallActions();

    assertEqual(canDeclareTsumo(state, 0), true, "Open tanyao hand should be able to tsumo");

    const won = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });
    const yakuIds = yakuIdsFrom(won);

    assertEqual(won.round.phase, "ended", "Open tanyao tsumo should end the hand");
    assertTrue(yakuIds.includes("tanyao"), "Open chi tanyao should count under the kuitan-ari policy");
    assertEqual(yakuIds.includes("menzen_tsumo"), false, "Open chi tsumo should not receive menzen tsumo");
  });

  test("CALL: open complete no-yaku hand cannot win", async () => {
    const state = await scenarioState("human-open-no-yaku-win-shape");
    const { canDeclareTsumo, dispatchAction } = await loadCallActions();

    assertEqual(canDeclareTsumo(state, 0), false, "Open no-yaku complete shape should not expose tsumo");

    const rejected = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(rejected.round.phase, "discard", "No-yaku open tsumo should not end the hand");
    assertEqual(rejected.round.lastActionResult?.reason, "no-yaku", "No-yaku open tsumo should show a no-yaku rejection");
  });

  test("CALL: open yakuhai ron wins and records yaku result", async () => {
    const state = await scenarioState("human-open-yakuhai-ron-ready");
    const { canDeclareRon, dispatchAction } = await loadCallActions();

    assertEqual(canDeclareRon(state, 0), true, "Open yakuhai hand should be able to ron");

    const won = dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });
    const yakuIds = yakuIdsFrom(won);

    assertEqual(won.round.phase, "ended", "Open yakuhai ron should end the hand");
    assertEqual(won.round.winningResult.winType, "ron", "Winning result should be ron");
    assertEqual(won.round.winningResult.fromPlayerId, 1, "Ron source should be recorded");
    assertTrue(yakuIds.includes("yakuhai"), "Open yakuhai ron should keep yakuhai yaku");
    assertEqual(yakuIds.includes("menzen_tsumo"), false, "Ron should not receive menzen tsumo");
  });

  test("CALL: multiple melds can still discard and advance", async () => {
    const state = await scenarioState("human-multiple-melds-layout");
    const { dispatchAction } = await loadCallActions();
    const discardTile = state.round.players[0].hand[0];
    const discarded = dispatchAction(state, { type: "DISCARD_TILE", playerId: 0, tileId: discardTile.id });
    const advanced = dispatchAction(discarded, { type: "ADVANCE_TURN" });

    assertEqual(discarded.round.phase, "draw", "Open hand discard should return to draw flow");
    assertEqual(discarded.round.lastDiscard.playerId, 0, "Open hand discard should become latest discard");
    assertEqual(advanced.round.currentPlayerIndex, 1, "Multiple melds should not break turn advance");
  });

  test("CALL: next round clears open melds", async () => {
    const state = await scenarioState("human-multiple-melds-layout");
    const { dispatchAction } = await loadCallActions();
    const ended = {
      ...state,
      round: {
        ...state.round,
        phase: "ended",
        endReason: "exhaustive-draw"
      }
    };
    const next = dispatchAction(ended, { type: "START_NEXT_ROUND" });

    assertTrue(next.round.players.every((player) => Array.isArray(player.melds)), "New round players should have meld arrays");
    assertTrue(next.round.players.every((player) => player.melds.length === 0), "New round should clear open melds");
  });

  test("CALL UI: ron priority hides call buttons when ron is available", async () => {
    const state = await scenarioState("human-open-yakuhai-ron-ready");
    const html = await renderState(state, {
      canDeclareRon: () => true,
      canDeclarePon: () => true,
      canDeclareChi: () => true
    });

    assertTrue(html.includes('data-action="declare-ron"'), "Ron button should render first when ron is available");
    assertEqual(html.includes('data-action="declare-pon"'), false, "Pon should not render when ron priority is taking over");
    assertEqual(html.includes('data-action="declare-chi"'), false, "Chi should not render when ron priority is taking over");
  });
}

async function loadCallActions(extraExports = []) {
  return loadModule("../src/game/actions.js", [
    "canDeclareTsumo",
    "canDeclareRon",
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

function yakuIdsFrom(state) {
  return (state.round.winningResult?.yakuResult || []).map((entry) => entry.id);
}
