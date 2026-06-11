import { assertEqual, loadModule, test } from "./test.js";

async function startedState() {
  const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
    "createInitialGameState",
    "startRound"
  ]);

  return startRound(createInitialGameState());
}

export function registerActionTests() {
  test("START_ROUNDで対局開始数と最終プレイ日時が更新される", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);
    const state = createInitialGameState();
    const nextState = dispatchAction(state, { type: "START_ROUND" });

    assertEqual(nextState.stats.roundsStarted, 1, "START_ROUND should increment started rounds");
    assertEqual(typeof nextState.stats.lastPlayedAt, "string", "START_ROUND should set last played time");
  });

  test("打牌で手牌-1、捨て牌+1", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startedState();
    const player = state.round.players[state.round.currentPlayerIndex];
    const tileId = player.hand[0].id;
    const beforeHand = player.hand.length;
    const beforeDiscards = player.discards.length;
    const nextState = dispatchAction(state, { type: "DISCARD_TILE", playerId: player.id, tileId });
    const nextPlayer = nextState.round.players[player.id];

    assertEqual(nextPlayer.hand.length, beforeHand - 1, "Discard should remove one tile from hand");
    assertEqual(nextPlayer.discards.length, beforeDiscards + 1, "Discard should add one tile to discards");
  });

  test("ツモで通常山-1、手牌+1", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startedState();
    const playerId = 1;
    const beforeWall = state.round.wall.length;
    const beforeHand = state.round.players[playerId].hand.length;
    const nextState = dispatchAction(state, { type: "DRAW_TILE", playerId });

    assertEqual(nextState.round.wall.length, beforeWall - 1, "Draw should remove one tile from wall");
    assertEqual(nextState.round.players[playerId].hand.length, beforeHand + 1, "Draw should add one tile to hand");
  });

  test("手番が0→1→2→3→0で回る", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    let state = await startedState();

    for (const expectedIndex of [1, 2, 3, 0]) {
      state = dispatchAction(state, { type: "ADVANCE_TURN" });
      assertEqual(state.round.currentPlayerIndex, expectedIndex, `Turn should advance to player ${expectedIndex}`);
    }
  });

  test("通常山が空なら流局", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startedState();
    state.round.wall = [];
    const beforeDrawn = state.stats.roundsDrawn;
    const nextState = dispatchAction(state, { type: "DRAW_TILE", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Empty wall draw should end the round");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Empty wall draw should use exhaustive-draw reason");
    assertEqual(nextState.stats.roundsDrawn, beforeDrawn + 1, "Exhaustive draw should increment draw stats");
  });

  test("CPU_DISCARDでCPUが1枚捨てる", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startedState();
    state.round.currentPlayerIndex = 1;
    state.round.phase = "discard";
    const cpu = state.round.players[1];
    const beforeHand = cpu.hand.length;
    const beforeDiscards = cpu.discards.length;
    const nextState = dispatchAction(state, { type: "CPU_DISCARD" });
    const nextCpu = nextState.round.players[1];

    assertEqual(nextCpu.hand.length, beforeHand - 1, "CPU discard should remove one tile from hand");
    assertEqual(nextCpu.discards.length, beforeDiscards + 1, "CPU discard should add one tile to discards");
  });

  test("TOGGLE_LARGE_TILE_MODEで大きい牌モードを切り替える", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);
    const state = createInitialGameState();
    const nextState = dispatchAction(state, { type: "TOGGLE_LARGE_TILE_MODE" });

    assertEqual(nextState.settings.largeTileMode, true, "Large tile mode should be enabled");
    assertEqual(state.settings.largeTileMode, false, "Original state should stay unchanged");
  });

  test("1局が通常山0枚まで進み流局する", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    let state = await startedState();
    let guard = 0;

    while (state.round.phase !== "ended" && guard < 400) {
      const player = state.round.players[state.round.currentPlayerIndex];
      const tile = player.hand[0];

      state = dispatchAction(state, {
        type: player.type === "cpu" ? "CPU_DISCARD" : "DISCARD_TILE",
        playerId: player.id,
        tileId: tile?.id,
        random: () => 0
      });

      if (state.round.phase === "ended") {
        break;
      }

      state = dispatchAction(state, { type: "ADVANCE_TURN" });
      state = dispatchAction(state, {
        type: "DRAW_TILE",
        playerId: state.round.players[state.round.currentPlayerIndex].id
      });
      guard += 1;
    }

    assertEqual(state.round.phase, "ended", "Round should end");
    assertEqual(state.round.endReason, "exhaustive-draw", "Round should end by exhaustive draw");
    assertEqual(state.round.wall.length, 0, "Live wall should be empty");
    assertEqual(state.stats.roundsDrawn, 1, "Drawn round stats should increment");
  });
}
