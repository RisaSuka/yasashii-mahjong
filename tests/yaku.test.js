import { assertEqual, assertTrue, loadModule, test } from "./test.js";

const YAKU_MODULE = "../src/game/rules/yaku.js";

export function registerYakuTests() {
  test("YAKU: menzen tsumo can be detected", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(standardWinningHand(), {
      winType: "tsumo",
      isClosed: true,
      handType: "standard"
    });

    assertHasYaku(result, "menzen_tsumo");
  });

  test("YAKU: tanyao can be detected", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(tanyaoHand(), {
      winType: "ron",
      isClosed: true,
      handType: "standard"
    });

    assertHasYaku(result, "tanyao");
  });

  test("YAKU: yakuhai can be detected", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(yakuhaiHand(), {
      winType: "ron",
      isClosed: true,
      handType: "standard"
    });

    assertHasYaku(result, "yakuhai");
  });

  test("YAKU: chiitoitsu can be detected as yaku", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(chiitoitsuHand(), {
      winType: "ron",
      isClosed: true,
      handType: "seven-pairs"
    });

    assertHasYaku(result, "chiitoitsu");
  });

  test("YAKU: toitoi can be detected", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(toitoiHand(), {
      winType: "ron",
      isClosed: true,
      handType: "standard"
    });

    assertHasYaku(result, "toitoi");
  });

  test("YAKU: kokushi musou can be detected as yaku", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(kokushiHand(), {
      winType: "ron",
      isClosed: true,
      handType: "thirteen-orphans"
    });

    assertHasYaku(result, "kokushi_musou");
  });

  test("YAKU: no-yaku hand returns no yaku", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(noYakuHand(), {
      winType: "ron",
      isClosed: true,
      handType: "standard"
    });

    assertEqual(result.length, 0, "No-yaku hand should return an empty yaku list");
  });

  test("YAKU: multiple yaku can be returned together", async () => {
    const { detectYaku } = await loadYakuModule();
    const result = detectYaku(tanyaoHand(), {
      winType: "tsumo",
      isClosed: true,
      handType: "standard"
    });

    assertHasYaku(result, "menzen_tsumo");
    assertHasYaku(result, "tanyao");
  });

  test("YAKU: hasYaku returns true when supported yaku exists", async () => {
    const { hasYaku } = await loadYakuModule();

    assertEqual(
      hasYaku(tanyaoHand(), { winType: "ron", isClosed: true, handType: "standard" }),
      true,
      "hasYaku should return true for a hand with supported yaku"
    );
  });

  test("YAKU: hasYaku returns false when no supported yaku exists", async () => {
    const { hasYaku } = await loadYakuModule();

    assertEqual(
      hasYaku(noYakuHand(), { winType: "ron", isClosed: true, handType: "standard" }),
      false,
      "hasYaku should return false for a shape-only no-yaku hand"
    );
  });
}

async function loadYakuModule() {
  return loadModule(YAKU_MODULE, ["detectYaku", "hasYaku"]);
}

function assertHasYaku(result, expectedId) {
  assertTrue(Array.isArray(result), "Yaku result should be an array");
  assertTrue(
    result.some((yaku) => yaku.id === expectedId),
    `Expected yaku ${expectedId} to be present`
  );
}

function standardWinningHand() {
  return tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1");
}

function tanyaoHand() {
  return tiles("m2 m3 m4 m4 m5 m6 p2 p3 p4 p6 p7 p8 s5 s5");
}

function yakuhaiHand() {
  return tiles("m1 m2 m3 p4 p5 p6 s7 s8 s9 z5 z5 z5 m9 m9");
}

function chiitoitsuHand() {
  return tiles("m1 m1 m9 m9 p2 p2 p8 p8 s3 s3 s7 s7 z5 z5");
}

function toitoiHand() {
  return tiles("m2 m2 m2 p3 p3 p3 s4 s4 s4 z1 z1 z1 m9 m9");
}

function kokushiHand() {
  return tiles("m1 m9 p1 p9 s1 s9 z1 z1 z2 z3 z4 z5 z6 z7");
}

function noYakuHand() {
  return tiles("m1 m2 m3 p1 p2 p3 s1 s2 s3 m7 m8 m9 z1 z1");
}

function tiles(pattern) {
  const counts = new Map();

  return pattern
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const suit = token[0];
      const rank = Number(token.slice(1));
      const key = `${suit}${rank}`;
      const copy = counts.get(key) || 0;
      counts.set(key, copy + 1);

      return {
        id: `yaku-${key}-${copy}`,
        suit,
        rank,
        copy,
        red: false
      };
    });
}
