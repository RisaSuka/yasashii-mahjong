import { assertEqual, assertTrue, loadModule, NotImplementedError, test } from "./test.js";

const YAKU_GATE_NOT_IMPLEMENTED = "MVP-0.6.5 yaku gate is not connected to win actions yet";

export function registerYakuIntegrationTests() {
  test("YAKU GATE: yaku-valid tsumo succeeds", async () => {
    const nextState = await declareTsumoWithYakuOrPending(await tsumoState(yakuTsumoHand()), 0);

    assertEqual(nextState.round.phase, "ended", "Yaku-valid tsumo should end the round");
    assertEqual(nextState.round.winningResult?.winType, "tsumo", "Win type should be tsumo");
  });

  test("YAKU GATE: no-yaku tsumo is rejected", async () => {
    await implementedYakuGateBaseline();
    const state = await tsumoState(noYakuWinningHand(), { menzen: false });
    const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.phase, state.round.phase, "No-yaku tsumo should not end the round");
    assertEqual(nextState.round.winningResult ?? null, null, "No-yaku tsumo should not set winning result");
  });

  test("YAKU GATE: successful tsumo stores yakuResult", async () => {
    const nextState = await declareTsumoWithYakuOrPending(await tsumoState(yakuTsumoHand()), 0);

    assertYakuResult(nextState, "menzen_tsumo");
  });

  test("YAKU GATE: yaku-valid ron succeeds", async () => {
    const nextState = await declareRonWithYakuOrPending(await yakuRonState(), 0);

    assertEqual(nextState.round.phase, "ended", "Yaku-valid ron should end the round");
    assertEqual(nextState.round.winningResult?.winType, "ron", "Win type should be ron");
  });

  test("YAKU GATE: no-yaku ron is rejected", async () => {
    await implementedYakuGateBaseline();
    const state = await noYakuRonState();
    const nextState = await dispatch(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(nextState.round.phase, state.round.phase, "No-yaku ron should remain in reaction");
    assertEqual(nextState.round.winningResult ?? null, null, "No-yaku ron should not set winning result");
  });

  test("YAKU GATE: successful ron stores yakuResult", async () => {
    const nextState = await declareRonWithYakuOrPending(await yakuRonState(), 0);

    assertYakuResult(nextState, "tanyao");
  });

  test("YAKU GATE: ron-ready-basic is rejected when it has no yaku", async () => {
    await implementedYakuGateBaseline();
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const state = createScenarioState("ron-ready-basic", { phase: "reaction" });
    const nextState = await dispatch(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(nextState.round.phase, "reaction", "No-yaku ron-ready-basic should remain in reaction");
    assertEqual(nextState.round.winningResult ?? null, null, "No-yaku ron-ready-basic should not win");
  });

  test("YAKU GATE: yaku-valid fixed ron state succeeds", async () => {
    const nextState = await declareRonWithYakuOrPending(await yakuRonState(), 0);

    assertEqual(nextState.round.winningResult?.winnerId, 0, "Human should win in yaku-valid ron state");
    assertEqual(nextState.round.winningResult?.fromPlayerId, 1, "Ron should record the discarder");
  });

  test("YAKU GATE: existing DECLARE_TSUMO basic behavior remains intact", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const nextState = await declareTsumoWithYakuOrPending(createScenarioState("human-tsumo-ready"), 0);

    assertEqual(nextState.round.endReason, "win", "Tsumo should still end as win");
    assertEqual(nextState.round.winningResult?.winnerId, 0, "Tsumo should still store winnerId");
  });

  test("YAKU GATE: existing DECLARE_RON basic behavior remains intact for yaku-valid ron", async () => {
    const nextState = await declareRonWithYakuOrPending(await yakuRonState(), 0);

    assertEqual(nextState.round.endReason, "win", "Ron should still end as win");
    assertEqual(nextState.round.winningResult?.winnerId, 0, "Ron should still store winnerId");
  });

  test("YAKU GATE: exhaustive draw remains intact", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());
    state.round.wall = [];
    const nextState = await dispatch(state, { type: "DRAW_TILE", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Empty wall draw should still end the round");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Exhaustive draw reason should remain unchanged");
  });

  test("YAKU GATE: detectYaku and hasYaku remain available", async () => {
    const { detectYaku, hasYaku } = await loadModule("../src/game/rules/yaku.js", ["detectYaku", "hasYaku"]);
    const context = { winType: "ron", isClosed: true, handType: "standard" };
    const yaku = detectYaku(tanyaoWinningHand(), context);

    assertTrue(yaku.some((entry) => entry.id === "tanyao"), "detectYaku should still detect tanyao");
    assertEqual(hasYaku(tanyaoWinningHand(), context), true, "hasYaku should still return true");
  });
}

async function implementedYakuGateBaseline() {
  return declareTsumoWithYakuOrPending(await tsumoState(yakuTsumoHand()), 0);
}

async function declareTsumoWithYakuOrPending(state, playerId) {
  const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId });

  if (!isWinState(nextState, playerId, "tsumo") || !hasStoredYakuResult(nextState)) {
    throw new NotImplementedError(YAKU_GATE_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function declareRonWithYakuOrPending(state, playerId) {
  const nextState = await dispatch(state, { type: "DECLARE_RON", playerId });

  if (!isWinState(nextState, playerId, "ron") || !hasStoredYakuResult(nextState)) {
    throw new NotImplementedError(YAKU_GATE_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function dispatch(state, action) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  return dispatchAction(state, action);
}

async function tsumoState(hand, options = {}) {
  const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
    "createInitialGameState",
    "startRound"
  ]);
  const state = startRound(createInitialGameState());

  return {
    ...state,
    round: {
      ...state.round,
      phase: "discard",
      currentPlayerIndex: 0,
      winningResult: null,
      players: state.round.players.map((player) => {
        if (player.id !== 0) {
          return player;
        }

        return {
          ...player,
          hand,
          menzen: options.menzen ?? true,
          isClosed: options.menzen ?? true
        };
      })
    }
  };
}

async function yakuRonState() {
  const state = await noYakuRonState();
  const winningTile = tile("s5", 1);

  return {
    ...state,
    round: {
      ...state.round,
      lastDiscard: {
        playerId: 1,
        tile: winningTile
      },
      players: state.round.players.map((player) => {
        if (player.id === 0) {
          return {
            ...player,
            hand: yakuRonThirteenTiles()
          };
        }

        if (player.id === 1) {
          return {
            ...player,
            discards: [winningTile]
          };
        }

        return player;
      })
    }
  };
}

async function noYakuRonState() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  return createScenarioState("ron-ready-basic", { phase: "reaction" });
}

function isWinState(state, playerId, winType) {
  return (
    state.round?.phase === "ended" &&
    state.round?.endReason === "win" &&
    state.round?.winningResult?.winnerId === playerId &&
    state.round?.winningResult?.winType === winType
  );
}

function hasStoredYakuResult(state) {
  return Array.isArray(state.round?.winningResult?.yakuResult) && state.round.winningResult.yakuResult.length > 0;
}

function assertYakuResult(state, expectedId) {
  assertTrue(Array.isArray(state.round?.winningResult?.yakuResult), "Win should store yakuResult array");
  assertTrue(
    state.round.winningResult.yakuResult.some((entry) => entry.id === expectedId),
    `Expected stored yakuResult to include ${expectedId}`
  );
}

function yakuTsumoHand() {
  return tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1");
}

function noYakuWinningHand() {
  return tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1");
}

function tanyaoWinningHand() {
  return tiles("m2 m3 m4 m4 m5 m6 p2 p3 p4 p6 p7 p8 s5 s5");
}

function yakuRonThirteenTiles() {
  return tiles("m2 m3 m4 m4 m5 m6 p2 p3 p4 p6 p7 p8 s5");
}

function tiles(pattern) {
  const counts = new Map();

  return pattern
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const key = token;
      const copy = counts.get(key) || 0;
      counts.set(key, copy + 1);
      return tile(token, copy);
    });
}

function tile(token, copy) {
  return {
    id: `yaku-integration-${token}-${copy}`,
    suit: token[0],
    rank: Number(token.slice(1)),
    copy,
    red: false
  };
}
