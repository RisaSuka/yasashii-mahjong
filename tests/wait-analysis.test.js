import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerWaitAnalysisTests() {
  test("MVP-1.7 WAITS: tanyao tenpai returns a yaku-valid wait", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits(tiles("m2 m3 p2 p3 p4 s3 s4 s5 m6 m7 m8 p6 p6"));

    assertEqual(result.isTenpai, true, "Hand should be tenpai");
    assertTrue(result.waits.some((wait) => wait.tileLabel === "1萬" || wait.tileLabel === "4萬"), "Ryanmen wait should be detected");
    assertTrue(result.waits.some((wait) => wait.hasYaku), "Tanyao-compatible wait should have yaku");
  });

  test("MVP-1.7 WAITS: multiple waits are returned", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits(tiles("m2 m3 p2 p3 p4 s3 s4 s5 m6 m7 m8 p6 p6"));
    const labels = result.waits.map((wait) => wait.tileLabel);

    assertTrue(labels.includes("1萬"), "Low-side wait should be detected");
    assertTrue(labels.includes("4萬"), "High-side wait should be detected");
  });

  test("MVP-1.7 WAITS: yakuhai wait is yaku-valid", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits(tiles("m1 m2 m3 p2 p3 p4 s3 s4 s5 z5 z5 p7 p7"));
    const whiteWait = result.waits.find((wait) => wait.tileLabel === "白");

    assertTrue(Boolean(whiteWait), "White dragon wait should be detected");
    assertEqual(whiteWait.hasYaku, true, "Dragon triplet wait should be yaku-valid");
    assertTrue(whiteWait.yaku.some((entry) => entry.id === "yakuhai"), "Yakuhai should be listed");
  });

  test("MVP-1.7 WAITS: no-yaku wait is detected with no-yaku status", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits(tiles("m1 m2 m3 p1 p2 p3 s1 s2 s3 m7 m8 z1 z1"));
    const wait = result.waits.find((entry) => entry.tileLabel === "9萬");

    assertTrue(Boolean(wait), "Shape-completing wait should be detected");
    assertEqual(wait.hasYaku, false, "No-yaku wait should be marked as not directly winnable");
    assertTrue(wait.message.includes("役がありません"), "No-yaku message should be beginner-readable");
  });

  test("MVP-1.7 WAITS: non-tenpai hand returns false", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits(tiles("m1 m3 m5 p1 p4 p7 s2 s5 s8 z1 z2 z4 z6"));

    assertEqual(result.isTenpai, false, "Scattered hand should not be tenpai");
    assertEqual(result.waits.length, 0, "Non-tenpai hand should not return waits");
  });

  test("MVP-1.7 WAITS: seven-pairs wait is detected", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits(tiles("m2 m2 p5 p5 s7 s7 z1 z1 z5 z5 m8 m8 p3"));
    const wait = result.waits.find((entry) => entry.tileLabel === "3筒");

    assertTrue(Boolean(wait), "Single tile in seven-pairs shape should be the wait");
    assertTrue(wait.yaku.some((entry) => entry.id === "chiitoitsu"), "Chiitoitsu should be listed");
  });

  test("MVP-1.9 DISCARD WAITS: discarding one tile can leave tenpai waits", async () => {
    const { analyzeDiscardWaits } = await loadWaitModule();
    const result = analyzeDiscardWaits(tiles("m2 m3 p2 p3 p4 s3 s4 s5 m6 m7 m8 p6 p6 z1"));
    const eastOption = result.options.find((option) => option.discardTileLabel === "\u6771");
    const labels = eastOption?.waits.map((wait) => wait.tileLabel) || [];

    assertEqual(result.hasTenpaiDiscard, true, "14-tile hand should find a discard that leaves tenpai");
    assertTrue(Boolean(eastOption), "Isolated east should be a discard-to-tenpai option");
    assertTrue(labels.includes("1\u842c"), "Discard option should keep low-side wait");
    assertTrue(labels.includes("4\u842c"), "Discard option should keep high-side wait");
    assertTrue(eastOption.waits.some((wait) => wait.hasYaku), "Discard option should mark yaku-valid waits");
  });

  test("MVP-1.9 DISCARD WAITS: no-yaku waits remain visible after discard", async () => {
    const { analyzeDiscardWaits } = await loadWaitModule();
    const result = analyzeDiscardWaits(tiles("m1 m2 m3 p1 p2 p3 s1 s2 s3 m7 m8 z1 z1 z2"));
    const option = result.options.find((entry) => entry.discardTileLabel === "\u5357");
    const wait = option?.waits.find((entry) => entry.tileLabel === "9\u842c");

    assertTrue(Boolean(option), "Discarding south should leave a shape-complete wait");
    assertTrue(Boolean(wait), "9 man no-yaku wait should be reported");
    assertEqual(wait.hasYaku, false, "No-yaku wait should remain marked as not directly winnable");
  });

  test("MVP-1.9 DISCARD WAITS: duplicate tile ids are preserved per discard option", async () => {
    const { analyzeDiscardWaits } = await loadWaitModule();
    const result = analyzeDiscardWaits(tiles("m2 m3 p2 p3 p4 s3 s4 s5 m6 m7 m8 p6 p6 z1"));

    assertTrue(result.options.every((option) => typeof option.discardTileId === "string"), "Every option should keep a tileId");
    assertTrue(result.options.every((option) => option.discardTile?.id === option.discardTileId), "discardTileId should match the discard tile");
  });

  test("MVP-1.9 DISCARD WAITS: seven-pairs wait can be found after discard", async () => {
    const { analyzeDiscardWaits } = await loadWaitModule();
    const result = analyzeDiscardWaits(tiles("m2 m2 p5 p5 s7 s7 z1 z1 z5 z5 m8 m8 p3 z2"));
    const option = result.options.find((entry) => entry.discardTileLabel === "\u5357");
    const chiitoitsuWait = option?.waits.find((entry) => entry.yaku.some((yaku) => yaku.id === "chiitoitsu"));

    assertTrue(Boolean(option), "Discarding south should leave the seven-pairs wait shape");
    assertTrue(Boolean(chiitoitsuWait), "Seven-pairs wait should remain detectable after discard");
  });

  test("MVP-1.9 DISCARD WAITS: non-tenpai-after-discard hand returns empty options", async () => {
    const { analyzeDiscardWaits } = await loadWaitModule();
    const result = analyzeDiscardWaits(tiles("m1 m3 m5 p1 p4 p7 s2 s5 s8 z1 z2 z4 z6 z7"));

    assertEqual(result.hasTenpaiDiscard, false, "Scattered 14-tile hand should not find a tenpai discard");
    assertEqual(result.options.length, 0, "No tenpai discard options should be returned");
  });

  test("MVP-1.7 WAITS: invalid hand size is safe", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits([]);

    assertEqual(result.isTenpai, false, "Invalid hand should not be tenpai");
    assertEqual(result.waits.length, 0, "Invalid hand should not throw or return waits");
  });
}

async function loadWaitModule() {
  return loadModule("../src/game/advice/wait-analysis.js", [
    "analyzeWaits",
    "findWinningWaits",
    "getTenpaiInfo",
    "analyzeDiscardWaits",
    "analyzeWaitsAfterDiscard",
    "getDiscardTenpaiOptions"
  ]);
}

function tiles(text) {
  return text.split(/\s+/).filter(Boolean).map((token, index) => {
    const suit = token[0];
    const rank = Number(token.slice(1));
    return {
      id: `${suit}${rank}-${index}`,
      suit,
      rank,
      copy: index % 4,
      red: false
    };
  });
}
