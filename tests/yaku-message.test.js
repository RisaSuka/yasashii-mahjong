import { assertEqual, assertTrue, loadModule, NotImplementedError, test } from "./test.js";

const NO_YAKU_MESSAGE_NOT_IMPLEMENTED = "MVP-0.7.8 no-yaku rejection message is not implemented yet";

export function registerYakuMessageTests() {
  test("YAKU MESSAGE: no-yaku tsumo rejection stores round.lastActionResult", async () => {
    const nextState = await declareNoYakuTsumoOrPending();

    assertTrue(nextState.round.lastActionResult, "No-yaku tsumo should store lastActionResult");
  });

  test("YAKU MESSAGE: no-yaku tsumo rejection reason is no-yaku", async () => {
    const nextState = await declareNoYakuTsumoOrPending();

    assertEqual(nextState.round.lastActionResult.reason, "no-yaku", "No-yaku tsumo reason should be no-yaku");
  });

  test("YAKU MESSAGE: no-yaku tsumo message explains yaku is missing", async () => {
    const nextState = await declareNoYakuTsumoOrPending();

    assertIncludes(nextState.round.lastActionResult.message, "役がありません", "No-yaku tsumo should explain yaku is missing");
  });

  test("YAKU MESSAGE: no-yaku tsumo message includes beginner guidance", async () => {
    const nextState = await declareNoYakuTsumoOrPending();

    assertIncludes(nextState.round.lastActionResult.message, "タンヤオ", "No-yaku tsumo should suggest tanyao");
    assertIncludes(nextState.round.lastActionResult.message, "役牌", "No-yaku tsumo should suggest yakuhai");
  });

  test("YAKU MESSAGE: no-yaku ron rejection stores round.lastActionResult", async () => {
    const nextState = await declareNoYakuRonOrPending();

    assertEqual(nextState.round.lastActionResult.reason, "no-yaku", "No-yaku ron reason should be no-yaku");
    assertIncludes(nextState.round.lastActionResult.message, "役がありません", "No-yaku ron should explain yaku is missing");
  });

  test("YAKU MESSAGE: yaku-valid tsumo clears lastActionResult", async () => {
    await requireLastActionResultSupport();
    const nextState = await dispatch(await yakuTsumoState(), { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.lastActionResult ?? null, null, "Successful tsumo should clear lastActionResult");
  });

  test("YAKU MESSAGE: yaku-valid ron clears lastActionResult", async () => {
    await requireLastActionResultSupport();
    const nextState = await dispatch(await yakuRonState(), { type: "DECLARE_RON", playerId: 0 });

    assertEqual(nextState.round.lastActionResult ?? null, null, "Successful ron should clear lastActionResult");
  });

  test("YAKU MESSAGE: render can show lastActionResult message", async () => {
    const nextState = await declareNoYakuTsumoOrPending();
    const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
    const root = { innerHTML: "" };

    renderGame(nextState, root, {});

    assertIncludes(root.innerHTML, "役がありません", "Rendered table should show no-yaku message");
    assertIncludes(root.innerHTML, "タンヤオ", "Rendered table should show beginner guidance");
  });

  test("YAKU MESSAGE: exhaustive draw display remains intact", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
    const state = startRound(createInitialGameState());
    const drawState = {
      ...state,
      round: {
        ...state.round,
        phase: "ended",
        endReason: "exhaustive-draw",
        winningResult: null
      }
    };
    const root = { innerHTML: "" };

    renderGame(drawState, root, {});

    assertTrue(root.innerHTML.includes("center-panel"), "Exhaustive draw should still render the center panel");
    assertTrue(!root.innerHTML.includes("yaku-summary"), "Exhaustive draw should not show yaku summary");
  });

  test("YAKU MESSAGE: winning display remains intact", async () => {
    const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
    const winState = await dispatch(await yakuTsumoState(), { type: "DECLARE_TSUMO", playerId: 0 });
    const root = { innerHTML: "" };

    renderGame(winState, root, {});

    assertTrue(root.innerHTML.includes("yaku-summary"), "Winning display should still show yaku summary");
    assertTrue(root.innerHTML.includes("メンゼンツモ") || root.innerHTML.includes("タンヤオ"), "Winning display should still show yaku reading");
  });
}

async function requireLastActionResultSupport() {
  await declareNoYakuTsumoOrPending();
}

async function declareNoYakuTsumoOrPending() {
  const nextState = await dispatch(await noYakuTsumoState(), { type: "DECLARE_TSUMO", playerId: 0 });

  if (!isNoYakuResult(nextState)) {
    throw new NotImplementedError(NO_YAKU_MESSAGE_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function declareNoYakuRonOrPending() {
  const nextState = await dispatch(await noYakuRonState(), { type: "DECLARE_RON", playerId: 0 });

  if (!isNoYakuResult(nextState)) {
    throw new NotImplementedError(NO_YAKU_MESSAGE_NOT_IMPLEMENTED);
  }

  return nextState;
}

function isNoYakuResult(state) {
  return state.round?.lastActionResult?.reason === "no-yaku" && typeof state.round.lastActionResult.message === "string";
}

async function dispatch(state, action) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  return dispatchAction(state, action);
}

async function noYakuTsumoState() {
  return tsumoState(noYakuWinningHand(), { menzen: false });
}

async function yakuTsumoState() {
  return tsumoState(yakuTsumoHand());
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
      lastActionResult: { reason: "previous-message", message: "前のメッセージ" },
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

async function noYakuRonState() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const state = createScenarioState("ron-ready-basic", { phase: "reaction" });

  return {
    ...state,
    round: {
      ...state.round,
      lastActionResult: { reason: "previous-message", message: "前のメッセージ" }
    }
  };
}

async function yakuRonState() {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const state = createScenarioState("ron-ready-basic", { phase: "reaction" });
  const winningTile = tile("s5", 1);

  return {
    ...state,
    round: {
      ...state.round,
      lastActionResult: { reason: "previous-message", message: "前のメッセージ" },
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

function yakuTsumoHand() {
  return tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1");
}

function noYakuWinningHand() {
  return tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1");
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
      const copy = counts.get(token) || 0;
      counts.set(token, copy + 1);
      return {
        id: `yaku-message-${token}-${copy}`,
        suit: token[0],
        rank: Number(token.slice(1)),
        copy,
        red: false
      };
    });
}

function tile(token, copy) {
  return {
    id: `yaku-message-${token}-${copy}`,
    suit: token[0],
    rank: Number(token.slice(1)),
    copy,
    red: false
  };
}

function assertIncludes(value, expected, message) {
  assertTrue(typeof value === "string", "Value should be a string");
  assertTrue(value.includes(expected), `${message}. Expected ${JSON.stringify(value)} to include ${JSON.stringify(expected)}`);
}
