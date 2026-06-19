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

  test("MVP-1.7 WAITS: invalid hand size is safe", async () => {
    const { analyzeWaits } = await loadWaitModule();
    const result = analyzeWaits([]);

    assertEqual(result.isTenpai, false, "Invalid hand should not be tenpai");
    assertEqual(result.waits.length, 0, "Invalid hand should not throw or return waits");
  });
}

async function loadWaitModule() {
  return loadModule("../src/game/advice/wait-analysis.js", ["analyzeWaits", "findWinningWaits", "getTenpaiInfo"]);
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
