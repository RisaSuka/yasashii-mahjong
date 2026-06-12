import { assertEqual, assertTrue, loadModule, test } from "./test.js";

const DISCARD_ADVICE_MODULE = "../src/game/advice/discard-advice.js";

export function registerDiscardAdviceTests() {
  test("DISCARD ADVICE: isolated honor tile is recommended", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m2 m3 m4 p3 p4 p5 s4 s5 s6 m7 m8 p8 z1"));

    assertAdviceIncludesTile(advice, "z1", "Isolated honor tile should be recommended");
  });

  test("DISCARD ADVICE: isolated 1 and 9 tiles are recommended", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m1 m4 m5 p2 p3 p4 s6 s7 s8 p9 z5 z5 m6"));

    assertTrue(
      advice.some((entry) => entry.tileId.startsWith("m1")) || advice.some((entry) => entry.tileId.startsWith("p9")),
      "At least one isolated terminal should be recommended"
    );
  });

  test("DISCARD ADVICE: tanyao preference prioritizes terminals and honors", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m1 m2 m3 p4 p5 p6 s7 s8 s9 z2 m5 p5 s5"), { preferTanyao: true });

    assertTrue(
      advice.slice(0, 3).some((entry) => ["m1", "s9", "z2"].some((prefix) => entry.tileId.startsWith(prefix))),
      "Tanyao preference should recommend 1, 9, or honor tiles"
    );
  });

  test("DISCARD ADVICE: pairs are lower priority than isolated tiles", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z1 z2 z2"));

    assertNoAdviceForTile(advice, "m5", "Pair should not be prioritized as a discard");
    assertNoAdviceForTile(advice, "z2", "Honor pair should not be prioritized as a discard");
  });

  test("DISCARD ADVICE: nearby number shapes are preserved", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m3 m4 p6 p7 s2 s3 m9 p1 z4 z5 z5 m6 p6"));

    assertNoAdviceForTile(advice, "m3", "3-4 shape should be preserved");
    assertNoAdviceForTile(advice, "m4", "3-4 shape should be preserved");
    assertNoAdviceForTile(advice, "p6", "6-7 shape should be preserved when better isolated candidates exist");
    assertNoAdviceForTile(advice, "p7", "6-7 shape should be preserved");
  });

  test("DISCARD ADVICE: dragon pairs are preserved", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m2 m3 m4 p3 p4 p5 s4 s5 s6 z5 z5 m9 p1"));

    assertNoAdviceForTile(advice, "z5", "Dragon pair should be preserved because it can become yakuhai");
  });

  test("DISCARD ADVICE: suggestions are limited to at most 3", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m1 m9 p1 p9 s1 s9 z1 z2 z3 z4 z5 z6 z7"), { maxSuggestions: 3 });

    assertTrue(Array.isArray(advice), "Advice should be an array");
    assertTrue(advice.length <= 3, "Advice should return at most 3 suggestions");
  });

  test("DISCARD ADVICE: each suggestion has required fields", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m2 m3 m4 p3 p4 p5 s4 s5 s6 m7 m8 p8 z1"));

    assertTrue(advice.length > 0, "Advice should include at least one suggestion");

    for (const entry of advice) {
      assertTrue(typeof entry.tileId === "string" && entry.tileId.length > 0, "Advice should include tileId");
      assertTrue(Number.isFinite(entry.priority), "Advice should include numeric priority");
      assertTrue(typeof entry.label === "string" && entry.label.length > 0, "Advice should include label");
      assertTrue(typeof entry.reason === "string" && entry.reason.length > 0, "Advice should include reason");
    }
  });

  test("DISCARD ADVICE: reason is short and beginner-friendly", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m2 m3 m4 p3 p4 p5 s4 s5 s6 m7 m8 p8 z1"));
    const reason = advice[0]?.reason || "";

    assertTrue(reason.length > 0 && reason.length <= 60, "Reason should be short enough for beginners");
    assertTrue(!reason.includes("失敗"), "Reason should avoid harsh failure wording");
  });

  test("DISCARD ADVICE: empty or invalid hands are safe", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);

    assertEqual(suggestDiscards([]).length, 0, "Empty hand should return no advice");
    assertEqual(suggestDiscards(null).length, 0, "Invalid hand should return no advice");
  });

  test("DISCARD ADVICE: default settings can be created", async () => {
    const { createDefaultDiscardAdviceSettings } = await loadDiscardAdviceModule(["createDefaultDiscardAdviceSettings"]);
    const settings = createDefaultDiscardAdviceSettings();

    assertEqual(settings.discardAdviceEnabled, true, "Discard advice should default to ON for beginner support");
  });

  test("DISCARD ADVICE: settings can be saved and loaded", async () => {
    const { loadDiscardAdviceSettings, saveDiscardAdviceSettings } = await loadDiscardAdviceModule([
      "loadDiscardAdviceSettings",
      "saveDiscardAdviceSettings"
    ]);
    const storage = createMemoryStorage();

    saveDiscardAdviceSettings({ discardAdviceEnabled: false }, storage);
    const loaded = loadDiscardAdviceSettings(storage);

    assertEqual(loaded.discardAdviceEnabled, false, "Saved OFF setting should be loaded");
  });
}

async function loadDiscardAdviceModule(extraExports = []) {
  return loadModule(DISCARD_ADVICE_MODULE, extraExports);
}

function assertAdviceIncludesTile(advice, tilePrefix, message) {
  assertTrue(Array.isArray(advice), "Advice should be an array");
  assertTrue(advice.some((entry) => entry.tileId.startsWith(tilePrefix)), message);
}

function assertNoAdviceForTile(advice, tilePrefix, message) {
  assertTrue(Array.isArray(advice), "Advice should be an array");
  assertTrue(!advice.some((entry) => entry.tileId.startsWith(tilePrefix)), message);
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
        id: `${token}-${copy}`,
        suit: token[0],
        rank: Number(token.slice(1)),
        copy,
        red: false
      };
    });
}

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}
