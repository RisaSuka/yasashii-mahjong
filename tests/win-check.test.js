import { assertEqual, assertTrue, loadModule, test } from "./test.js";

const WIN_CHECK_MODULE = "../src/game/rules/win-check.js";

export function registerWinCheckTests() {
  test("4面子1雀頭の標準形が和了になる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1"));

    assertWinning(result, "standard");
  });

  test("順子4つ + 雀頭が和了になる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m1 m2 m3 p3 p4 p5 p7 p8 p9 s4 s5 s6 z7 z7"));

    assertWinning(result, "standard");
  });

  test("刻子を含む4面子1雀頭が和了になる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m2 m3 m4 m7 m8 m9 p5 p5 p5 z3 z3 z3 s1 s1"));

    assertWinning(result, "standard");
  });

  test("七対子が和了になる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m1 m1 m9 m9 p2 p2 p8 p8 s3 s3 s7 s7 z5 z5"));

    assertWinning(result, "seven-pairs");
  });

  test("国士無双13面待ち系の完成形が和了になる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m1 m9 p1 p9 s1 s9 z1 z1 z2 z3 z4 z5 z6 z7"));

    assertWinning(result, "thirteen-orphans");
  });

  test("14枚でない手牌は不正", async () => {
    const { isWinningHand, validateHandTiles } = await loadWinCheckModule();
    const hand = tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1");

    assertInvalid(validateHandTiles(hand), "not-14-tiles");
    assertNotWinning(isWinningHand(hand), "not-14-tiles");
  });

  test("同じ牌が5枚ある手牌は不正", async () => {
    const { isWinningHand, validateHandTiles } = await loadWinCheckModule();
    const hand = tiles("m1 m1 m1 m1 m1 m2 m3 m4 p2 p3 p4 s7 s8 s9");

    assertInvalid(validateHandTiles(hand), "too-many-copies");
    assertNotWinning(isWinningHand(hand), "too-many-copies");
  });

  test("suitが不正な牌は不正", async () => {
    const { isWinningHand, validateHandTiles } = await loadWinCheckModule();
    const hand = tiles("x1 m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1");

    assertInvalid(validateHandTiles(hand), "invalid-tile");
    assertNotWinning(isWinningHand(hand), "invalid-tile");
  });

  test("rankが不正な牌は不正", async () => {
    const { isWinningHand, validateHandTiles } = await loadWinCheckModule();
    const hand = tiles("z8 m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1");

    assertInvalid(validateHandTiles(hand), "invalid-tile");
    assertNotWinning(isWinningHand(hand), "invalid-tile");
  });

  test("未完成手牌は和了ではない", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1 z3"));

    assertNotWinning(result, "no-winning-shape");
  });

  test("複数解釈できる手牌でも和了判定できる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("m1 m1 m2 m2 m3 m3 p4 p5 p6 s7 s8 s9 z2 z2"));

    assertWinning(result, "standard");
  });

  test("字牌を含む標準形が和了になる", async () => {
    const { isWinningHand } = await loadWinCheckModule();
    const result = isWinningHand(tiles("z1 z1 z1 z5 z5 z5 m1 m2 m3 p7 p8 p9 s9 s9"));

    assertWinning(result, "standard");
  });
}

async function loadWinCheckModule() {
  return loadModule(WIN_CHECK_MODULE, ["isWinningHand", "validateHandTiles"]);
}

function assertWinning(result, expectedType) {
  assertEqual(result?.winning, true, "Hand should be winning");
  assertEqual(result?.type, expectedType, "Winning type should match");
}

function assertNotWinning(result, expectedReason) {
  assertEqual(result?.winning, false, "Hand should not be winning");
  assertEqual(result?.type, null, "Non-winning hand type should be null");
  assertEqual(result?.reason, expectedReason, "Failure reason should match");
}

function assertInvalid(result, expectedReason) {
  assertEqual(result?.valid, false, "Hand should be invalid");
  assertEqual(result?.reason, expectedReason, "Validation reason should match");
}

function tiles(pattern) {
  const counts = new Map();

  return pattern
    .split(/\s+/)
    .filter((token) => token && token !== "/")
    .map((token) => {
      const suit = token[0];
      const rank = Number(token.slice(1));
      const key = `${suit}${rank}`;
      const copy = counts.get(key) || 0;
      counts.set(key, copy + 1);

      return {
        id: `${key}-${copy}`,
        suit,
        rank,
        copy,
        red: false
      };
    });
}
