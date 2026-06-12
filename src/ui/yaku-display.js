const YAKU_DESCRIPTIONS = {
  menzen_tsumo: "鳴かずに、自分で引いた牌であがる役です。",
  tanyao: "1・9・字牌を使わず、2〜8の牌だけで作る役です。",
  yakuhai: "白・發・中のどれかを3枚集めると成立する役です。",
  chiitoitsu: "同じ牌2枚の組を7つ作る役です。",
  toitoi: "同じ牌3枚の組を4つ作る役です。",
  kokushi_musou: "1・9・字牌を集める特別な役です。"
};

const TERM_DESCRIPTIONS = {
  ツモ: "自分で引いた牌であがることです。",
  ロン: "相手が捨てた牌であがることです。",
  役: "あがるために必要な条件です。",
  翻: "役の大きさを表す数字です。"
};

export function formatYakuResult(yakuResult = []) {
  if (!Array.isArray(yakuResult) || yakuResult.length === 0) {
    return "";
  }

  const lines = ["役:"];

  for (const yaku of yakuResult) {
    const name = yaku.name || yaku.id || "役";
    const hanText = Number.isFinite(yaku.han) ? ` ${yaku.han}翻` : "";
    const description = getYakuDescription(yaku.id);

    lines.push(`${name}${hanText}`);

    if (description) {
      lines.push(description);
    }
  }

  const totalHan = getTotalHan(yakuResult);

  if (totalHan > 0) {
    lines.push(`合計: ${totalHan}翻`);
  }

  return lines.join("\n");
}

export function getYakuDescription(yakuId) {
  return YAKU_DESCRIPTIONS[yakuId] || "";
}

export function getMahjongTermDescription(term) {
  return TERM_DESCRIPTIONS[term] || "";
}

export function getNoYakuMessage() {
  return "形は完成していますが、あがるための条件である役がありません。\nまずはタンヤオや役牌を狙ってみましょう。";
}

export function getTotalHan(yakuResult = []) {
  if (!Array.isArray(yakuResult)) {
    return 0;
  }

  return yakuResult.reduce((sum, yaku) => sum + (Number.isFinite(yaku.han) ? yaku.han : 0), 0);
}

export function formatWinSummary({ winType, winnerType } = {}) {
  const owner = winnerType === "human" ? "あなたの" : "";

  if (winType === "tsumo") {
    return `${owner}ツモ和了です`;
  }

  if (winType === "ron") {
    return `${owner}ロン和了です`;
  }

  return `${owner}和了です`;
}
