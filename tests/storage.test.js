import { assertDeepEqual, assertEqual, loadModule, test } from "./test.js";

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

export function registerStorageTests() {
  test("localStorageの保存/読み込みができる", async () => {
    const { loadStats, saveStats } = await loadModule("../src/game/storage.js", ["loadStats", "saveStats"]);
    const storage = createMemoryStorage();
    const stats = {
      roundsStarted: 2,
      roundsDrawn: 1,
      lastPlayedAt: "2026-06-12T00:00:00.000Z"
    };

    saveStats(stats, storage);

    assertDeepEqual(loadStats(storage), stats, "Saved stats should be loaded unchanged");
  });

  test("壊れた保存データでも初期値に戻せる", async () => {
    const { createDefaultStats, loadStats } = await loadModule("../src/game/storage.js", [
      "createDefaultStats",
      "loadStats"
    ]);
    const storage = createMemoryStorage();
    storage.setItem("jun-chan-mahjong:stats", "{broken json");

    assertDeepEqual(loadStats(storage), createDefaultStats(), "Broken stats should fall back to default stats");
  });

  test("RESET_STATSで保存済み成績を初期化できる", async () => {
    const { createDefaultStats, loadStats, saveStats } = await loadModule("../src/game/storage.js", [
      "createDefaultStats",
      "loadStats",
      "saveStats"
    ]);
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);
    const storage = createMemoryStorage();

    saveStats({ roundsStarted: 4, roundsDrawn: 3, lastPlayedAt: "2026-06-12T00:00:00.000Z" }, storage);
    dispatchAction(createInitialGameState(), { type: "RESET_STATS", storage });

    assertEqual(JSON.stringify(loadStats(storage)), JSON.stringify(createDefaultStats()), "Stats should be reset");
  });
}
