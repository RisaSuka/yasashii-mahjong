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

  test("DISCARD EVALUATOR: returns scored candidates for every valid tile", async () => {
    const { evaluateDiscardCandidates } = await loadDiscardAdviceModule(["evaluateDiscardCandidates"]);
    const hand = tiles("m1 m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z1 z2 z2");
    const candidates = evaluateDiscardCandidates(hand);

    assertEqual(candidates.length, hand.length, "Evaluator should score each tile in a valid hand");
    assertTrue(candidates.every((entry) => entry.tile && entry.tileId && Number.isFinite(entry.score)), "Each candidate should include tile, tileId, and score");
    assertTrue(candidates.every((entry) => Array.isArray(entry.reasons) && entry.reasons.length > 0), "Each candidate should include beginner-friendly reasons");
  });

  test("DISCARD EVALUATOR: isolated terminal and honor score lower than pair tiles", async () => {
    const { evaluateDiscardCandidates } = await loadDiscardAdviceModule(["evaluateDiscardCandidates"]);
    const candidates = evaluateDiscardCandidates(tiles("m1 m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z1 z2 z2"));

    assertTrue(scoreFor(candidates, "m1") < scoreFor(candidates, "m5"), "Isolated terminal should be easier to discard than a pair");
    assertTrue(scoreFor(candidates, "z1") < scoreFor(candidates, "z2"), "Isolated honor should be easier to discard than an honor pair");
  });

  test("DISCARD EVALUATOR: connected number shapes are preserved", async () => {
    const { evaluateDiscardCandidates } = await loadDiscardAdviceModule(["evaluateDiscardCandidates"]);
    const candidates = evaluateDiscardCandidates(tiles("m2 m3 m4 p6 p7 s1 s9 z1 z2 z3 m8 p1 s5"));

    assertTrue(scoreFor(candidates, "m3") > scoreFor(candidates, "s9"), "Middle tile in a sequence should be valued above an isolated terminal");
    assertTrue(scoreFor(candidates, "p6") > scoreFor(candidates, "z1"), "Adjacent shape should be valued above an isolated honor");
  });

  test("DISCARD EVALUATOR: dora and nearby dora are kept more often", async () => {
    const { evaluateDiscardCandidates } = await loadDiscardAdviceModule(["evaluateDiscardCandidates"]);
    const hand = tiles("m2 m5 m6 p1 p9 s1 s9 z1 z2 z3 p4 p5 s5");
    const candidates = evaluateDiscardCandidates(hand, {
      dora: [{ suit: "m", rank: 5 }]
    });

    assertTrue(scoreFor(candidates, "m5") > scoreFor(candidates, "p9"), "Dora should be harder to discard than an isolated terminal");
    assertTrue(scoreFor(candidates, "m6") > scoreFor(candidates, "z1"), "Near dora should receive a small keep bonus");
  });

  test("DISCARD EVALUATOR: visible tiles lower value", async () => {
    const { evaluateDiscardCandidates } = await loadDiscardAdviceModule(["evaluateDiscardCandidates"]);
    const hand = tiles("m2 m5 p2 p3 p4 s4 s5 s6 m8 m9 z1 z2 z3");
    const withVisible = evaluateDiscardCandidates(hand, {
      discards: tiles("m2 m2 m2")
    });
    const withoutVisible = evaluateDiscardCandidates(hand);

    assertTrue(scoreFor(withVisible, "m2") < scoreFor(withoutVisible, "m2"), "Tiles heavily visible on the table should lose value");
  });

  test("DISCARD EVALUATOR: yakuhai pair is preserved", async () => {
    const { evaluateDiscardCandidates } = await loadDiscardAdviceModule(["evaluateDiscardCandidates"]);
    const candidates = evaluateDiscardCandidates(tiles("m1 m9 p1 p9 s1 s9 z5 z5 z1 z2 z3 m4 p4"));

    assertTrue(scoreFor(candidates, "z5") > scoreFor(candidates, "m1"), "Dragon pair should be valued above an isolated terminal");
  });

  test("DISCARD ADVICE: evaluator fallback still returns advice for connected hands", async () => {
    const { suggestDiscards } = await loadDiscardAdviceModule(["suggestDiscards"]);
    const advice = suggestDiscards(tiles("m2 m3 m4 p3 p4 p5 s4 s5 s6 m6 m7 p7 p8"));
    const uniqueTileTypes = new Set(advice.map((entry) => entry.tileId.replace(/-\d+$/, "")));

    assertTrue(advice.length >= 1, "Advice should not be empty for a valid hand");
    assertTrue(advice.length <= 3, "Advice should stay compact");
    assertEqual(uniqueTileTypes.size, advice.length, "Advice should avoid duplicate tile types");
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

function scoreFor(candidates, tilePrefix) {
  const found = candidates.find((entry) => entry.tileId.startsWith(tilePrefix));

  assertTrue(Boolean(found), `Expected candidate for ${tilePrefix}`);
  return found.score;
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
