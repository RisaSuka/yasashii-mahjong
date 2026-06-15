import { assertEqual, assertTrue, loadModule, NotImplementedError, test } from "./test.js";

const MATCH_NOT_IMPLEMENTED = "MVP-1.0 match state is not implemented yet";

export function registerMatchTests() {
  test("START_MATCH: starts at East 1", async () => {
    const state = await startMatchOrPending();

    assertEqual(state.match?.roundWind, "east", "Match should start with east round wind");
    assertEqual(state.match?.handNumber, 1, "Match should start at East 1");
    assertEqual(state.match?.dealerIndex, 0, "East 1 dealer should be player 0");
    assertEqual(state.round?.roundWind, "east", "Active round should use east wind");
    assertEqual(state.round?.handNumber, 1, "Active round should be hand 1");
    assertEqual(state.round?.dealerIndex, 0, "Active round dealer should be player 0");
    assertEqual(state.round?.phase, "discard", "East 1 should start in discard phase");
  });

  test("START_NEXT_ROUND: East 1 advances to East 2", async () => {
    const east1Ended = await endedMatchHand(1, "draw");
    const east2 = await startNextMatchRoundOrPending(east1Ended);

    assertEqual(east2.match?.handNumber, 2, "Match should advance to East 2");
    assertEqual(east2.match?.dealerIndex, 1, "East 2 dealer should be player 1");
    assertEqual(east2.round?.handNumber, 2, "Active round should be East 2");
    assertEqual(east2.round?.dealerIndex, 1, "Active round dealer should be player 1");
    assertEqual(east2.round?.phase, "discard", "East 2 should start in discard phase");
    assertTrue(east2.round?.id !== east1Ended.round?.id, "East 2 should be a fresh round");
    assertEqual(east2.lastRoundResult?.handNumber, 1, "Last round result should remember East 1");
  });

  test("START_NEXT_ROUND: East 2 advances to East 3", async () => {
    const east2Ended = await endedMatchHand(2, "draw");
    const east3 = await startNextMatchRoundOrPending(east2Ended);

    assertEqual(east3.match?.handNumber, 3, "Match should advance to East 3");
    assertEqual(east3.match?.dealerIndex, 2, "East 3 dealer should be player 2");
    assertEqual(east3.round?.handNumber, 3, "Active round should be East 3");
  });

  test("START_NEXT_ROUND: East 3 advances to East 4", async () => {
    const east3Ended = await endedMatchHand(3, "draw");
    const east4 = await startNextMatchRoundOrPending(east3Ended);

    assertEqual(east4.match?.handNumber, 4, "Match should advance to East 4");
    assertEqual(east4.match?.dealerIndex, 3, "East 4 dealer should be player 3");
    assertEqual(east4.round?.handNumber, 4, "Active round should be East 4");
  });

  test("START_NEXT_ROUND: East 4 ends the match", async () => {
    const east4Ended = await endedMatchHand(4, "draw");
    const endedMatch = await startNextMatchRoundOrPending(east4Ended, { expectMatchEnded: true });

    assertTrue(isMatchEnded(endedMatch), "Match should be ended after East 4");
    assertTrue(endedMatch.round?.handNumber !== 5, "Match should not create East 5");
  });

  test("MVP-1.0: dealer always advances without repeats", async () => {
    const drawState = await startNextMatchRoundOrPending(await endedMatchHand(1, "draw"));
    const tsumoState = await startNextMatchRoundOrPending(await endedMatchHand(1, "tsumo"));
    const ronState = await startNextMatchRoundOrPending(await endedMatchHand(1, "ron"));

    assertEqual(drawState.match?.dealerIndex, 1, "Dealer should advance after draw");
    assertEqual(tsumoState.match?.dealerIndex, 1, "Dealer should advance even after dealer or player win");
    assertEqual(ronState.match?.dealerIndex, 1, "Dealer should advance after ron");
  });

  test("MVP-1.0: scores stay fixed or unchanged", async () => {
    const started = await startMatchOrPending();
    const ended = await endedMatchHand(1, "tsumo", {
      scores: started.match?.scores || [25000, 25000, 25000, 25000]
    });
    const next = await startNextMatchRoundOrPending(ended);

    assertEqual(JSON.stringify(next.match?.scores), JSON.stringify(started.match?.scores), "Scores should not move in MVP-1.0");
  });

  test("MVP-1.0: roundHistory stores compact results", async () => {
    const east1Ended = await endedMatchHand(1, "tsumo");
    const east2 = await startNextMatchRoundOrPending(east1Ended);
    const latest = east2.match?.roundHistory?.at(-1);

    assertEqual(latest?.handLabel, "東1局", "History should store the hand label");
    assertEqual(latest?.resultType, "tsumo", "History should store compact result type");
    assertEqual(latest?.winnerId, 0, "History should store winner when present");
    assertEqual(latest?.points ?? null, null, "History should not store detailed points yet");
  });

  test("MVP-1.0: lastRoundResult remains the latest result", async () => {
    const east1Ended = await endedMatchHand(1, "ron");
    const east2 = await startNextMatchRoundOrPending(east1Ended);

    assertEqual(east2.lastRoundResult?.handNumber, 1, "Latest result should remember the previous hand number");
    assertEqual(east2.lastRoundResult?.winType, "ron", "Latest result should remember the previous win type");
  });

  test("MVP-1.0: settings are preserved across match rounds", async () => {
    const east1Ended = await endedMatchHand(1, "draw", {
      settings: {
        largeTileMode: true,
        cpuDelayMs: 500,
        discardAdviceEnabled: false,
        discardAdviceStrategy: "tanyao"
      }
    });
    const east2 = await startNextMatchRoundOrPending(east1Ended);

    assertEqual(east2.settings.largeTileMode, true, "Large tile mode should be preserved");
    assertEqual(east2.settings.cpuDelayMs, 500, "CPU delay should be preserved");
    assertEqual(east2.settings.discardAdviceEnabled, false, "Advice enabled setting should be preserved");
    assertEqual(east2.settings.discardAdviceStrategy, "tanyao", "Advice strategy should be preserved");
  });

  test("MVP-1.0: existing one-hand features still work", async () => {
    const drawState = await oneHandExhaustiveDraw();
    const tsumoState = await oneHandTsumo();
    const ronState = await oneHandRon();

    assertEqual(drawState.round?.endReason, "exhaustive-draw", "Exhaustive draw should still work");
    assertEqual(tsumoState.round?.winningResult?.winType, "tsumo", "Tsumo should still work");
    assertEqual(ronState.round?.winningResult?.winType, "ron", "Ron should still work");
  });
}

async function startMatchOrPending(overrides = {}) {
  const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const state = dispatchAction(createInitialGameState(), { type: "START_MATCH" });
  const nextState = applyOverrides(state, overrides);

  if (!isStartedMatchState(nextState)) {
    throw new NotImplementedError(MATCH_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function startNextMatchRoundOrPending(state, options = {}) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const nextState = dispatchAction(state, { type: "START_NEXT_ROUND" });

  if (options.expectMatchEnded) {
    if (!isMatchEnded(nextState)) {
      throw new NotImplementedError(MATCH_NOT_IMPLEMENTED);
    }
    return nextState;
  }

  if (!isStartedMatchState(nextState) || nextState.match.handNumber <= state.match.handNumber) {
    throw new NotImplementedError(MATCH_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function endedMatchHand(handNumber, resultType, overrides = {}) {
  const state = await startMatchOrPending(overrides);
  const match = {
    ...state.match,
    handNumber,
    dealerIndex: handNumber - 1,
    scores: overrides.scores || state.match.scores || [25000, 25000, 25000, 25000]
  };
  const round = createEndedRoundForMatch(state.round, match, resultType);

  return {
    ...state,
    settings: overrides.settings || state.settings,
    match,
    round
  };
}

function createEndedRoundForMatch(round, match, resultType) {
  const base = {
    ...round,
    roundWind: "east",
    handNumber: match.handNumber,
    dealerIndex: match.dealerIndex,
    phase: "ended"
  };

  if (resultType === "draw") {
    return {
      ...base,
      endReason: "exhaustive-draw",
      winningResult: null
    };
  }

  if (resultType === "ron") {
    return {
      ...base,
      endReason: "win",
      winningResult: {
        winnerId: 0,
        winType: "ron",
        fromPlayerId: 1,
        handType: "standard",
        yakuResult: [{ id: "tanyao", name: "断么九", han: 1 }]
      }
    };
  }

  return {
    ...base,
    endReason: "win",
    winningResult: {
      winnerId: 0,
      winType: "tsumo",
      handType: "standard",
      yakuResult: [{ id: "menzen_tsumo", name: "門前清自摸和", han: 1 }]
    }
  };
}

function isStartedMatchState(state) {
  return (
    state.match?.type === "tonpuu" &&
    state.match?.phase === "playing" &&
    state.match?.roundWind === "east" &&
    Number.isInteger(state.match?.handNumber) &&
    Number.isInteger(state.match?.dealerIndex) &&
    state.round?.roundWind === "east" &&
    state.round?.phase === "discard"
  );
}

function isMatchEnded(state) {
  return state.match?.phase === "ended" || state.match?.status === "ended";
}

function applyOverrides(state, overrides) {
  if (!overrides.settings) {
    return state;
  }

  return {
    ...state,
    settings: {
      ...state.settings,
      ...overrides.settings
    }
  };
}

async function oneHandExhaustiveDraw() {
  const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
    "createInitialGameState",
    "startRound"
  ]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  const state = startRound(createInitialGameState());

  return dispatchAction(
    {
      ...state,
      round: {
        ...state.round,
        wall: []
      }
    },
    { type: "DRAW_TILE", playerId: 0 }
  );
}

async function oneHandTsumo() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);

  return dispatchAction(createScenarioState("human-tsumo-ready"), { type: "DECLARE_TSUMO", playerId: 0 });
}

async function oneHandRon() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);

  return dispatchAction(createScenarioState("ron-ready-tanyao", { phase: "reaction" }), {
    type: "DECLARE_RON",
    playerId: 0
  });
}
