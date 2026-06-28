import { createScenarioState } from "../src/game/scenarios.js";
import {
  canCpuDeclareTsumo,
  dispatchAction,
  findCpuRonWinner,
  resolveCpuChiAfterDiscard,
  resolveCpuPonAfterDiscard,
  resolveCpuRonAfterDiscard
} from "../src/game/actions.js";

function main() {
  const summary = {
    checkedScenarios: 0,
    cpuTsumoReachable: false,
    cpuRonReachable: false,
    cpuNoYakuIgnored: false,
    cpuPonFlowContinues: false,
    cpuChiFlowContinues: false,
    cpuOpenYakuhaiReachable: false,
    cpuOpenTanyaoReachable: false,
    cpuOpenNoYakuIgnored: false,
    outcomes: []
  };

  const tsumoState = createScenarioState("cpu-tsumo-ready-yakuhai");
  const canTsumo = canCpuDeclareTsumo(tsumoState, 1);
  const tsumoResult = canTsumo ? dispatchAction(tsumoState, { type: "DECLARE_TSUMO", playerId: 1 }) : tsumoState;
  summary.cpuTsumoReachable = tsumoResult.round?.winningResult?.winnerId === 1
    && tsumoResult.round?.winningResult?.winType === "tsumo";
  summary.outcomes.push({
    scenario: "cpu-tsumo-ready-yakuhai",
    result: summary.cpuTsumoReachable ? "cpu-tsumo" : "not-reached"
  });

  const ronState = createScenarioState("cpu-ron-ready-yakuhai");
  const ronWinner = findCpuRonWinner(ronState);
  const ronResult = resolveCpuRonAfterDiscard(ronState);
  summary.cpuRonReachable = ronWinner?.player?.id === 1
    && ronResult.round?.winningResult?.winnerId === 1
    && ronResult.round?.winningResult?.winType === "ron";
  summary.outcomes.push({
    scenario: "cpu-ron-ready-yakuhai",
    result: summary.cpuRonReachable ? "cpu-ron" : "not-reached"
  });

  const noYakuState = createScenarioState("cpu-no-yaku-win-shape");
  const noYakuResult = resolveCpuRonAfterDiscard(noYakuState);
  summary.cpuNoYakuIgnored = noYakuResult.round?.winningResult == null
    && noYakuResult.round?.phase === noYakuState.round?.phase;
  summary.outcomes.push({
    scenario: "cpu-no-yaku-win-shape",
    result: summary.cpuNoYakuIgnored ? "ignored-no-yaku" : "unexpected-win"
  });

  const ponFlowState = createScenarioState("cpu-pon-then-discard-flow");
  const ponFlowResult = resolveCpuPonAfterDiscard(ponFlowState, () => 0);
  summary.cpuPonFlowContinues = ponFlowResult.round?.phase === "draw"
    && ponFlowResult.round?.lastDiscard?.playerId === 1
    && ponFlowResult.round?.players?.[1]?.melds?.some((meld) => meld.type === "pon");
  summary.outcomes.push({
    scenario: "cpu-pon-then-discard-flow",
    result: summary.cpuPonFlowContinues ? "continued-after-pon" : "stalled"
  });

  const chiFlowState = createScenarioState("cpu-chi-then-discard-flow");
  const chiFlowResult = resolveCpuChiAfterDiscard(chiFlowState, () => 0);
  summary.cpuChiFlowContinues = chiFlowResult.round?.phase === "draw"
    && chiFlowResult.round?.lastDiscard?.playerId === 1
    && chiFlowResult.round?.players?.[1]?.melds?.some((meld) => meld.type === "chi");
  summary.outcomes.push({
    scenario: "cpu-chi-then-discard-flow",
    result: summary.cpuChiFlowContinues ? "continued-after-chi" : "stalled"
  });

  const openYakuhaiState = createScenarioState("cpu-open-yakuhai-tsumo");
  const openYakuhaiResult = dispatchAction(openYakuhaiState, { type: "DECLARE_TSUMO", playerId: 1 });
  summary.cpuOpenYakuhaiReachable = hasWinningYaku(openYakuhaiResult, "yakuhai")
    && !hasWinningYaku(openYakuhaiResult, "menzen_tsumo")
    && !hasWinningYaku(openYakuhaiResult, "riichi");
  summary.outcomes.push({
    scenario: "cpu-open-yakuhai-tsumo",
    result: summary.cpuOpenYakuhaiReachable ? "open-yakuhai-win" : "not-reached"
  });

  const openTanyaoState = createScenarioState("cpu-open-tanyao-tsumo");
  const openTanyaoResult = dispatchAction(openTanyaoState, { type: "DECLARE_TSUMO", playerId: 1 });
  summary.cpuOpenTanyaoReachable = hasWinningYaku(openTanyaoResult, "tanyao")
    && !hasWinningYaku(openTanyaoResult, "menzen_tsumo")
    && !hasWinningYaku(openTanyaoResult, "riichi");
  summary.outcomes.push({
    scenario: "cpu-open-tanyao-tsumo",
    result: summary.cpuOpenTanyaoReachable ? "open-tanyao-win" : "not-reached"
  });

  const openNoYakuState = createScenarioState("cpu-open-no-yaku-shape");
  const openNoYakuResult = dispatchAction(openNoYakuState, { type: "DECLARE_TSUMO", playerId: 1 });
  summary.cpuOpenNoYakuIgnored = openNoYakuResult.round?.winningResult == null
    && openNoYakuResult.round?.lastActionResult?.reason === "no-yaku";
  summary.outcomes.push({
    scenario: "cpu-open-no-yaku-shape",
    result: summary.cpuOpenNoYakuIgnored ? "ignored-open-no-yaku" : "unexpected-win"
  });

  summary.checkedScenarios = summary.outcomes.length;

  console.log(JSON.stringify(summary, null, 2));

  if (
    !summary.cpuTsumoReachable
    || !summary.cpuRonReachable
    || !summary.cpuNoYakuIgnored
    || !summary.cpuPonFlowContinues
    || !summary.cpuChiFlowContinues
    || !summary.cpuOpenYakuhaiReachable
    || !summary.cpuOpenTanyaoReachable
    || !summary.cpuOpenNoYakuIgnored
  ) {
    process.exitCode = 1;
  }
}

function hasWinningYaku(state, yakuId) {
  return (state.round?.winningResult?.yakuResult || []).some((yaku) => yaku.id === yakuId);
}

main();
