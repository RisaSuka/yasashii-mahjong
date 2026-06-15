import { assertEqual, assertTrue, loadModule, NotImplementedError, test } from "./test.js";

const START_NEXT_ROUND_NOT_IMPLEMENTED = "START_NEXT_ROUND action is not implemented yet";

export function registerNextRoundTests() {
  test("START_NEXT_ROUND: exhaustive draw can start a new round", async () => {
    const endedState = await exhaustiveDrawState();
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.round.phase, "discard", "Next round should start in discard phase");
    assertTrue(nextState.round.id !== endedState.round.id, "Next round should have a new round id");
  });

  test("START_NEXT_ROUND: tsumo win can start a new round", async () => {
    const endedState = await tsumoWinState();
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.round.phase, "discard", "Next round after tsumo should start in discard phase");
    assertTrue(nextState.round.id !== endedState.round.id, "Next round after tsumo should have a new round id");
  });

  test("START_NEXT_ROUND: ron win can start a new round", async () => {
    const endedState = await ronWinState();
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.round.phase, "discard", "Next round after ron should start in discard phase");
    assertTrue(nextState.round.id !== endedState.round.id, "Next round after ron should have a new round id");
  });

  test("START_NEXT_ROUND: next round has a fresh wall and players", async () => {
    const endedState = await exhaustiveDrawState();
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.round.wall.length, 69, "Next round should start with 69 live-wall tiles");
    assertEqual(nextState.round.deadWall.length, 14, "Next round should have a 14-tile dead wall");
    assertEqual(nextState.round.players.length, 4, "Next round should have four players");
    assertEqual(nextState.round.players[0].hand.length, 14, "Dealer should have 14 tiles after initial draw");
    assertEqual(nextState.round.players[1].hand.length, 13, "Non-dealer should have 13 tiles");
  });

  test("START_NEXT_ROUND: roundsStarted increments", async () => {
    const endedState = await exhaustiveDrawState();
    const beforeStarted = endedState.stats.roundsStarted;
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.stats.roundsStarted, beforeStarted + 1, "Next round should increment started count");
  });

  test("START_NEXT_ROUND: roundsDrawn is not incremented again", async () => {
    const endedState = await exhaustiveDrawState();
    const beforeDrawn = endedState.stats.roundsDrawn;
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.stats.roundsDrawn, beforeDrawn, "Next round should not add another drawn round");
  });

  test("START_NEXT_ROUND: lastRoundResult stores exhaustive draw", async () => {
    const endedState = await exhaustiveDrawState();
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.lastRoundResult?.roundId, endedState.round.id, "Previous round id should be stored");
    assertEqual(nextState.lastRoundResult?.endReason, "exhaustive-draw", "Previous draw reason should be stored");
  });

  test("START_NEXT_ROUND: lastRoundResult stores win summary", async () => {
    const endedState = await ronWinState();
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.lastRoundResult?.roundId, endedState.round.id, "Previous win round id should be stored");
    assertEqual(nextState.lastRoundResult?.endReason, "win", "Previous win reason should be stored");
    assertEqual(nextState.lastRoundResult?.winType, "ron", "Previous win type should be stored");
    assertEqual(nextState.lastRoundResult?.winnerId, 0, "Previous winner should be stored");
  });

  test("START_NEXT_ROUND: lastActionResult is cleared", async () => {
    const drawState = await exhaustiveDrawState();
    const endedState = {
      ...drawState,
      round: {
        ...drawState.round,
        lastActionResult: {
          type: "rejected",
          reason: "no-yaku",
          action: "tsumo",
          message: "no yaku"
        }
      }
    };
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.round.lastActionResult ?? null, null, "New round should not keep action rejection message");
  });

  test("START_NEXT_ROUND: settings are preserved", async () => {
    const endedState = {
      ...(await exhaustiveDrawState()),
      settings: {
        largeTileMode: true,
        cpuDelayMs: 500,
        discardAdviceEnabled: false,
        discardAdviceStrategy: "tanyao"
      }
    };
    const nextState = await startNextRoundOrPending(endedState);

    assertEqual(nextState.settings.largeTileMode, true, "Large tile mode should be preserved");
    assertEqual(nextState.settings.cpuDelayMs, 500, "CPU delay should be preserved");
    assertEqual(nextState.settings.discardAdviceEnabled, false, "Advice setting should be preserved");
    assertEqual(nextState.settings.discardAdviceStrategy, "tanyao", "Advice strategy should be preserved");
  });

  test("START_NEXT_ROUND: existing round flow still works", async () => {
    const drawState = await exhaustiveDrawState();
    const tsumoState = await tsumoWinState();
    const ronState = await ronWinState();

    assertEqual(drawState.round.endReason, "exhaustive-draw", "Exhaustive draw should still work");
    assertEqual(tsumoState.round.winningResult?.winType, "tsumo", "Tsumo should still work");
    assertEqual(ronState.round.winningResult?.winType, "ron", "Ron should still work");
  });
}

async function startNextRoundOrPending(state) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const nextState = dispatchAction(state, { type: "START_NEXT_ROUND" });

  if (!isNextRoundState(state, nextState)) {
    throw new NotImplementedError(START_NEXT_ROUND_NOT_IMPLEMENTED);
  }

  return nextState;
}

function isNextRoundState(previousState, nextState) {
  return (
    nextState !== previousState &&
    nextState.round?.phase === "discard" &&
    nextState.round?.id !== previousState.round?.id &&
    nextState.lastRoundResult?.roundId === previousState.round?.id
  );
}

async function exhaustiveDrawState() {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const state = await startedState();
  const emptyWallState = {
    ...state,
    round: {
      ...state.round,
      wall: []
    }
  };

  return dispatchAction(emptyWallState, { type: "DRAW_TILE", playerId: 0 });
}

async function tsumoWinState() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const state = createScenarioState("human-tsumo-ready");

  return dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });
}

async function ronWinState() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const state = createScenarioState("ron-ready-tanyao", { phase: "reaction" });

  return dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });
}

async function startedState() {
  const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
    "createInitialGameState",
    "startRound"
  ]);

  return startRound(createInitialGameState());
}
