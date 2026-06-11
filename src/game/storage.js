export const STATS_STORAGE_KEY = "jun-chan-mahjong:stats";

export function createDefaultStats() {
  return {
    roundsStarted: 0,
    roundsDrawn: 0,
    lastPlayedAt: null
  };
}

export function loadStats(storage = getDefaultStorage()) {
  if (!storage) {
    return createDefaultStats();
  }

  try {
    const rawStats = storage.getItem(STATS_STORAGE_KEY);

    if (!rawStats) {
      return createDefaultStats();
    }

    return normalizeStats(JSON.parse(rawStats));
  } catch (_error) {
    return createDefaultStats();
  }
}

export function saveStats(stats, storage = getDefaultStorage()) {
  if (!storage) {
    return;
  }

  storage.setItem(STATS_STORAGE_KEY, JSON.stringify(normalizeStats(stats)));
}

function normalizeStats(stats) {
  const defaults = createDefaultStats();

  return {
    roundsStarted: Number.isFinite(stats?.roundsStarted) ? stats.roundsStarted : defaults.roundsStarted,
    roundsDrawn: Number.isFinite(stats?.roundsDrawn) ? stats.roundsDrawn : defaults.roundsDrawn,
    lastPlayedAt: typeof stats?.lastPlayedAt === "string" || stats?.lastPlayedAt === null
      ? stats.lastPlayedAt
      : defaults.lastPlayedAt
  };
}

function getDefaultStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}
