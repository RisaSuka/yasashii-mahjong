import { assertEqual, assertTrue, loadModule, test } from "./test.js";

const SCENARIO_MODULE = "../src/game/scenarios.js";

export function registerScenarioTests() {
  test("SCENARIO: human tsumo-ready state can be created", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const { canDeclareTsumo } = await loadModule("../src/game/actions.js", ["canDeclareTsumo"]);
    const state = createScenarioState("human-tsumo-ready");

    assertEqual(state.round.players.length, 4, "Scenario should create four players");
    assertEqual(state.round.currentPlayerIndex, 0, "Human tsumo scenario should make player 0 current");
    assertEqual(canDeclareTsumo(state, 0), true, "Human should be able to declare tsumo");
  });

  test("SCENARIO: CPU tsumo-ready state can be created", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const { canDeclareTsumo } = await loadModule("../src/game/actions.js", ["canDeclareTsumo"]);
    const state = createScenarioState("cpu-tsumo-ready");

    assertEqual(state.round.players.length, 4, "Scenario should create four players");
    assertEqual(state.round.currentPlayerIndex, 1, "CPU tsumo scenario should make player 1 current");
    assertEqual(canDeclareTsumo(state, 1), true, "CPU should be able to declare tsumo");
  });

  test("SCENARIO: future ron-ready state includes discard and waiting hand", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const state = createScenarioState("ron-ready-basic");
    const human = state.round.players[0];

    assertEqual(state.round.lastDiscard?.playerId, 1, "Ron-ready scenario should record CPU discard");
    assertTrue(Boolean(state.round.lastDiscard?.tile), "Ron-ready scenario should include discarded tile");
    assertEqual(human.hand.length, 13, "Future ron winner should have 13 tiles before claiming discard");
  });

  test("SCENARIO: wall, dead wall, hands, and discards have stable counts", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const state = createScenarioState("human-tsumo-ready");

    assertEqual(state.round.players.length, 4, "Scenario should preserve four players");
    assertEqual(state.round.deadWall.length, 14, "Scenario should preserve 14-tile dead wall");
    assertTrue(state.round.wall.length >= 0, "Scenario should have a live wall array");
    assertTrue(state.round.players.every((player) => Array.isArray(player.hand)), "Each player should have a hand");
    assertTrue(state.round.players.every((player) => Array.isArray(player.discards)), "Each player should have discards");
  });

  test("SCENARIO: tile ids are not duplicated across physical zones", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const state = createScenarioState("ron-ready-basic");
    const tileIds = collectPhysicalTileIds(state);
    const uniqueTileIds = new Set(tileIds);

    assertEqual(uniqueTileIds.size, tileIds.length, "Tile ids should not appear in multiple physical zones");
  });

  test("SCENARIO: currentPlayerIndex can be specified", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const state = createScenarioState("human-tsumo-ready", { currentPlayerIndex: 2 });

    assertEqual(state.round.currentPlayerIndex, 2, "Scenario options should override current player");
  });

  test("SCENARIO: phase can be specified", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const state = createScenarioState("human-tsumo-ready", { phase: "draw" });

    assertEqual(state.round.phase, "draw", "Scenario options should override phase");
  });

  test("SCENARIO: unknown scenario name fails safely", async () => {
    const { createScenarioState } = await loadScenarioModule();
    let failedSafely = false;

    try {
      const result = createScenarioState("__missing_scenario__");
      failedSafely = !result || result.valid === false || Boolean(result.error);
    } catch (error) {
      failedSafely = error instanceof Error;
    }

    assertEqual(failedSafely, true, "Unknown scenario should fail safely");
  });

  test("SCENARIO: normal START_ROUND behavior is unchanged", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);
    const state = createInitialGameState();
    const nextState = dispatchAction(state, { type: "START_ROUND" });

    assertEqual(nextState.round.players.length, 4, "Normal round should still create four players");
    assertEqual(nextState.round.deadWall.length, 14, "Normal round should still create 14-tile dead wall");
    assertEqual(nextState.round.wall.length, 69, "Normal round should still start with 69 live-wall tiles");
    assertEqual(nextState.round.players[0].hand.length, 14, "Dealer should still start with 14 tiles");
    assertEqual(nextState.round.players[1].hand.length, 13, "Non-dealer should still start with 13 tiles");
  });

  test("SCENARIO: tsumo-ready state connects to DECLARE_TSUMO", async () => {
    const { createScenarioState } = await loadScenarioModule();
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = createScenarioState("human-tsumo-ready");
    const nextState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Scenario should allow existing tsumo action to end the round");
    assertEqual(nextState.round.endReason, "win", "Scenario tsumo should end as win");
    assertEqual(nextState.round.winningResult?.winnerId, 0, "Scenario tsumo should store winner");
    assertEqual(nextState.round.winningResult?.winType, "tsumo", "Scenario tsumo should store tsumo win type");
  });
}

async function loadScenarioModule() {
  return loadModule(SCENARIO_MODULE, ["createScenarioState", "listScenarios"]);
}

function collectPhysicalTileIds(state) {
  return [
    ...state.round.wall,
    ...state.round.deadWall,
    ...state.round.players.flatMap((player) => [...player.hand, ...player.discards])
  ].map((tile) => tile.id);
}
