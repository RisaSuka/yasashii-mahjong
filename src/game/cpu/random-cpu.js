import { evaluateDiscardCandidates } from "../advice/discard-advice.js";

const CPU_CANDIDATE_LIMIT = 3;
const CPU_CANDIDATE_WEIGHTS = [0.6, 0.25, 0.15];

export function chooseRandomDiscard(player, random = Math.random) {
  if (!player.hand.length) {
    return null;
  }

  const index = Math.floor(random() * player.hand.length);
  return player.hand[index];
}

export function chooseCpuDiscard(player, context = {}, random = Math.random) {
  return chooseCpuDiscardCandidate(player, context, random)?.tile || null;
}

export function chooseCpuDiscardCandidate(player, context = {}, random = Math.random) {
  if (!player || !Array.isArray(player.hand) || player.hand.length === 0) {
    return null;
  }

  const evaluatedCandidates = evaluateDiscardCandidates(player.hand, {
    ...context,
    player,
    currentPlayerId: player.id
  });
  const candidates = preferUnprotectedCandidates(evaluatedCandidates).slice(0, CPU_CANDIDATE_LIMIT);

  if (!candidates.length) {
    const tile = chooseRandomDiscard(player, random);
    return tile ? createFallbackCandidate(tile) : null;
  }

  return candidates[chooseWeightedCandidateIndex(candidates.length, random)];
}

function chooseWeightedCandidateIndex(candidateCount, random) {
  if (candidateCount <= 1) {
    return 0;
  }

  const normalizedWeights = CPU_CANDIDATE_WEIGHTS
    .slice(0, candidateCount)
    .map((weight, index) => index < candidateCount ? weight : 0);
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  let threshold = random() * totalWeight;

  for (let index = 0; index < normalizedWeights.length; index += 1) {
    threshold -= normalizedWeights[index];
    if (threshold <= 0) {
      return index;
    }
  }

  return normalizedWeights.length - 1;
}

function preferUnprotectedCandidates(candidates) {
  const unprotected = candidates.filter((candidate) => !isShapeProtectedCandidate(candidate));

  if (unprotected.length > 0) {
    return unprotected;
  }

  const withoutCritical = candidates.filter((candidate) => !isCriticalProtectedCandidate(candidate));

  return withoutCritical.length > 0 ? withoutCritical : candidates;
}

function isShapeProtectedCandidate(candidate) {
  return candidate.tags.includes("completed-sequence")
    || candidate.tags.includes("completed-triplet")
    || candidate.tags.includes("pair")
    || candidate.tags.includes("yakuhai-pair")
    || candidate.tags.includes("yaku-pair")
    || candidate.tags.includes("dora");
}

function isCriticalProtectedCandidate(candidate) {
  return candidate.tags.includes("completed-triplet")
    || candidate.tags.includes("yakuhai-pair")
    || candidate.tags.includes("yaku-pair")
    || candidate.tags.includes("dora");
}

function createFallbackCandidate(tile) {
  return {
    tile,
    tileId: tile.id,
    score: Number.POSITIVE_INFINITY,
    reasons: ["評価できない場合の安全な候補です。"],
    tags: ["fallback"]
  };
}
