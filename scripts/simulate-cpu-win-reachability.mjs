import { createScenarioState } from "../src/game/scenarios.js";
import {
  canCpuDeclareTsumo,
  dispatchAction,
  findCpuRonWinner,
  resolveCpuRonAfterDiscard
} from "../src/game/actions.js";

function main() {
  const summary = {
    checkedScenarios: 3,
    cpuTsumoReachable: false,
    cpuRonReachable: false,
    cpuNoYakuIgnored: false,
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

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.cpuTsumoReachable || !summary.cpuRonReachable || !summary.cpuNoYakuIgnored) {
    process.exitCode = 1;
  }
}

main();
