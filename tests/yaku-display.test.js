import { assertEqual, assertTrue, loadModule, test } from "./test.js";

const YAKU_DISPLAY_MODULE = "../src/ui/yaku-display.js";

export function registerYakuDisplayTests() {
  test("YAKU DISPLAY: yaku name can be formatted from yakuResult", async () => {
    const { formatYakuResult } = await loadYakuDisplayModule();
    const result = formatYakuResult([{ id: "tanyao", name: "断么九", han: 1 }]);

    assertIncludes(result, "断么九", "Formatted yaku result should include the yaku name");
  });

  test("YAKU DISPLAY: han value can be formatted from yakuResult", async () => {
    const { formatYakuResult } = await loadYakuDisplayModule();
    const result = formatYakuResult([{ id: "tanyao", name: "断么九", han: 1 }]);

    assertIncludes(result, "1翻", "Formatted yaku result should include han value");
  });

  test("YAKU DISPLAY: total han can be formatted from yakuResult", async () => {
    const { formatYakuResult } = await loadYakuDisplayModule();
    const result = formatYakuResult([
      { id: "menzen_tsumo", name: "門前清自摸和", han: 1 },
      { id: "tanyao", name: "断么九", han: 1 }
    ]);

    assertIncludes(result, "合計", "Formatted yaku result should include a total label");
    assertIncludes(result, "2翻", "Formatted yaku result should include total han");
  });

  test("YAKU DISPLAY: tanyao beginner explanation can be shown", async () => {
    const { getYakuDescription } = await loadYakuDisplayModule();

    assertIncludes(getYakuDescription("tanyao"), "2〜8", "Tanyao explanation should mention 2 through 8");
  });

  test("YAKU DISPLAY: yakuhai beginner explanation can be shown", async () => {
    const { getYakuDescription } = await loadYakuDisplayModule();

    assertIncludes(getYakuDescription("yakuhai"), "白", "Yakuhai explanation should mention white dragon");
    assertIncludes(getYakuDescription("yakuhai"), "3枚", "Yakuhai explanation should mention three matching tiles");
  });

  test("YAKU DISPLAY: chiitoitsu beginner explanation can be shown", async () => {
    const { getYakuDescription } = await loadYakuDisplayModule();

    assertIncludes(getYakuDescription("chiitoitsu"), "7つ", "Chiitoitsu explanation should mention seven pairs");
  });

  test("YAKU DISPLAY: toitoi beginner explanation can be shown", async () => {
    const { getYakuDescription } = await loadYakuDisplayModule();

    assertIncludes(getYakuDescription("toitoi"), "3枚", "Toitoi explanation should mention triplets");
    assertIncludes(getYakuDescription("toitoi"), "4つ", "Toitoi explanation should mention four groups");
  });

  test("YAKU DISPLAY: kokushi beginner explanation can be shown", async () => {
    const { getYakuDescription } = await loadYakuDisplayModule();

    assertIncludes(getYakuDescription("kokushi_musou"), "1・9・字牌", "Kokushi explanation should mention terminals and honors");
  });

  test("YAKU DISPLAY: no-yaku message explains shape is complete but yaku is missing", async () => {
    const { getNoYakuMessage } = await loadYakuDisplayModule();
    const message = getNoYakuMessage();

    assertIncludes(message, "形は完成", "No-yaku message should acknowledge the hand shape");
    assertIncludes(message, "役がありません", "No-yaku message should explain yaku is missing");
  });

  test("YAKU DISPLAY: mahjong term descriptions can be retrieved", async () => {
    const { getMahjongTermDescription } = await loadYakuDisplayModule();

    assertIncludes(getMahjongTermDescription("ツモ"), "自分", "Tsumo term should explain self draw");
    assertIncludes(getMahjongTermDescription("ロン"), "相手", "Ron term should explain another player's discard");
    assertIncludes(getMahjongTermDescription("役"), "条件", "Yaku term should explain winning condition");
    assertIncludes(getMahjongTermDescription("翻"), "大きさ", "Han term should explain yaku value");
  });

  test("YAKU DISPLAY: existing tsumo win display text can still be represented", async () => {
    const { formatWinSummary } = await loadYakuDisplayModule(["formatWinSummary"]);
    const result = formatWinSummary({ winType: "tsumo", winnerType: "human" });

    assertIncludes(result, "ツモ", "Tsumo summary should still mention tsumo");
    assertIncludes(result, "和了", "Tsumo summary should still mention win");
  });

  test("YAKU DISPLAY: existing ron win display text can still be represented", async () => {
    const { formatWinSummary } = await loadYakuDisplayModule(["formatWinSummary"]);
    const result = formatWinSummary({ winType: "ron", winnerType: "human" });

    assertIncludes(result, "ロン", "Ron summary should still mention ron");
    assertIncludes(result, "和了", "Ron summary should still mention win");
  });
}

async function loadYakuDisplayModule(extraExports = []) {
  return loadModule(YAKU_DISPLAY_MODULE, [
    "formatYakuResult",
    "getYakuDescription",
    "getMahjongTermDescription",
    "getNoYakuMessage",
    ...extraExports
  ]);
}

function assertIncludes(value, expected, message) {
  assertTrue(typeof value === "string", "Value should be a string");
  assertTrue(value.includes(expected), `${message}. Expected ${JSON.stringify(value)} to include ${JSON.stringify(expected)}`);
}
