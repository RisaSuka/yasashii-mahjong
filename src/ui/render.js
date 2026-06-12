import {
  getMahjongTermDescription,
  getMahjongTermReading,
  getTotalHan,
  getYakuDescription,
  getYakuDisplayName
} from "./yaku-display.js";

const WIND_LABELS = {
  east: "東",
  south: "南",
  west: "西",
  north: "北"
};

export function renderGame(state, root, options = {}) {
  const round = state.round;
  const largeTileClass = state.settings.largeTileMode ? " large-tiles" : "";

  root.innerHTML = `
    <div class="app${largeTileClass}">
      <header class="topbar">
        <h1 class="title">じゅんちゃん麻雀 MVP-0.5.5</h1>
        <div class="controls">
          <button type="button" data-action="start-round">新規局開始</button>
          <button type="button" class="secondary" data-action="toggle-large">
            ${state.settings.largeTileMode ? "通常牌" : "大きい牌"}
          </button>
        </div>
      </header>

      ${round ? renderTable(state, options) : renderEmptyState()}

      <footer class="footer-status">
        <span>対局開始数: ${state.stats.roundsStarted}</span>
        <span>流局数: ${state.stats.roundsDrawn}</span>
        <span>最終プレイ: ${state.stats.lastPlayedAt || "-"}</span>
      </footer>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <main class="table">
      <section class="center-panel">
        <strong>新規局開始を押してください</strong>
        <span class="status-line">4人卓を流局、ツモ和了、ロン和了まで進められます。</span>
      </section>
    </main>
  `;
}

function renderTable(state, options) {
  const { round } = state;
  const seats = [
    round.players[2],
    round.players[3],
    round.players[1],
    round.players[0]
  ];

  return `
    <main class="table" aria-label="4人麻雀卓">
      ${seats.map((player) => renderSeat(player, round)).join("")}
      <section class="center-panel">
        <strong>${renderStatus(round)}</strong>
        ${renderLastActionResult(round)}
        ${renderYakuSummary(round)}
        ${renderRonAction(state, options)}
        ${renderTsumoAction(state, options)}
        <span class="table-meta">通常山: ${round.wall.length}枚</span>
        <span class="table-meta">王牌: ${round.deadWall.length}枚</span>
        <span class="table-meta">ドラ表示牌: ${renderDoraIndicators(round)}</span>
      </section>
    </main>
  `;
}

function renderLastActionResult(round) {
  const result = round.lastActionResult;

  if (!result?.message || round.phase === "ended") {
    return "";
  }

  return `
    <section class="action-message" aria-label="操作メッセージ">
      ${String(result.message)
        .split("\n")
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join("")}
    </section>
  `;
}

function renderYakuSummary(round) {
  if (round.phase !== "ended" || round.endReason !== "win") {
    return "";
  }

  const yakuResult = round.winningResult?.yakuResult;

  if (!Array.isArray(yakuResult) || yakuResult.length === 0) {
    return "";
  }

  const totalHan = getTotalHan(yakuResult);
  const hanReading = getMahjongTermReading("翻");

  return `
    <section class="yaku-summary" aria-label="役の説明">
      <span class="yaku-summary-title">役（ヤク）:</span>
      ${yakuResult.map((yaku) => renderYakuSummaryItem(yaku, hanReading)).join("")}
      ${totalHan > 0 ? `<span class="yaku-total">合計 ${totalHan}翻（${totalHan}${escapeHtml(hanReading)}）</span>` : ""}
      ${renderWinTermHelp(round.winningResult?.winType)}
    </section>
  `;
}

function renderYakuSummaryItem(yaku, hanReading) {
  const displayName = getYakuDisplayName(yaku);
  const hanText = Number.isFinite(yaku.han) ? `${yaku.han}翻（${yaku.han}${hanReading}）` : "";
  const description = getYakuDescription(yaku.id);

  return `
    <div class="yaku-item">
      <span class="yaku-name">${escapeHtml(displayName)}${hanText ? ` ${escapeHtml(hanText)}` : ""}</span>
      ${description ? `<span class="yaku-description">${escapeHtml(description)}</span>` : ""}
    </div>
  `;
}

function renderWinTermHelp(winType) {
  const winTerm = winType === "tsumo" ? "ツモ" : winType === "ron" ? "ロン" : "";
  const winDescription = winTerm ? getMahjongTermDescription(winTerm) : "";
  const winReading = winTerm ? getMahjongTermReading(winTerm) : "";
  const yakuDescription = getMahjongTermDescription("役");
  const yakuReading = getMahjongTermReading("役");
  const hanDescription = getMahjongTermDescription("翻");
  const hanReading = getMahjongTermReading("翻");
  const lines = [
    winDescription ? `${winTerm}${winReading ? `（${winReading}）` : ""}: ${winDescription}` : "",
    yakuDescription ? `役${yakuReading ? `（${yakuReading}）` : ""}: ${yakuDescription}` : "",
    hanDescription ? `翻${hanReading ? `（${hanReading}）` : ""}: ${hanDescription}` : ""
  ].filter(Boolean);

  if (!lines.length) {
    return "";
  }

  return `<div class="term-help">${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</div>`;
}

function renderSeat(player, round) {
  const isCurrent = round.currentPlayerIndex === player.id;
  const positionClass = `seat-${player.wind}`;
  const currentClass = isCurrent ? " current" : "";

  return `
    <section class="seat ${positionClass}${currentClass}">
      <div class="seat-header">
        <span class="seat-name">${WIND_LABELS[player.wind]} ${player.name}</span>
        <span class="seat-meta">${isCurrent ? "手番" : ""}</span>
      </div>
      ${player.type === "human" ? renderHumanHand(player, round) : renderCpuHand(player)}
      <div>
        <div class="seat-meta">捨て牌 ${player.discards.length}枚</div>
        <div class="discards">${player.discards.map((tile) => renderTile(tile, "discard-tile")).join("")}</div>
      </div>
    </section>
  `;
}

function renderHumanHand(player, round) {
  const disabled = round.currentPlayerIndex !== player.id || round.phase !== "discard";

  return `
    <div class="hand" aria-label="あなたの手牌">
      ${player.hand.map((tile) => `
        <button class="tile-button" type="button" data-action="discard-tile" data-tile-id="${tile.id}" ${disabled ? "disabled" : ""}>
          ${renderTile(tile)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderCpuHand(player) {
  return `
    <div class="hand" aria-label="${player.name}の手牌枚数">
      <span class="tile tile-back">${player.hand.length}</span>
    </div>
  `;
}

function renderStatus(round) {
  if (round.phase === "ended") {
    if (round.endReason === "win" && round.winningResult?.winType === "tsumo") {
      const winner = round.players.find((player) => player.id === round.winningResult.winnerId);
      return winner?.type === "human" ? "あなたのツモ和了です" : `${winner?.name || "CPU"}のツモ和了です`;
    }

    if (round.endReason === "win" && round.winningResult?.winType === "ron") {
      const winner = round.players.find((player) => player.id === round.winningResult.winnerId);
      return winner?.type === "human" ? "あなたのロン和了です" : `${winner?.name || "CPU"}のロン和了です`;
    }

    return round.endReason === "exhaustive-draw" ? "流局しました" : "局が終了しました";
  }

  if (round.phase === "reaction") {
    return "ロンできます。ロンしますか？";
  }

  const currentPlayer = round.players[round.currentPlayerIndex];
  return currentPlayer.type === "human" ? "あなたの番です。牌を選んでください" : `CPUの手番です (${currentPlayer.name})`;
}

function renderRonAction(state, options) {
  const round = state.round;
  const human = round.players.find((player) => player.type === "human");

  if (!human || typeof options.canDeclareRon !== "function" || !options.canDeclareRon(state, human.id)) {
    return "";
  }

  return `
    <div class="reaction-actions">
      <button type="button" class="ron-button" data-action="declare-ron">ロン</button>
      <button type="button" class="skip-ron-button" data-action="skip-ron">見送る</button>
    </div>
  `;
}

function renderTsumoAction(state, options) {
  const round = state.round;
  const human = round.players.find((player) => player.type === "human");

  if (!human || typeof options.canDeclareTsumo !== "function" || !options.canDeclareTsumo(state, human.id)) {
    return "";
  }

  return `
    <button type="button" class="tsumo-button" data-action="declare-tsumo">
      ツモ
    </button>
  `;
}

function renderDoraIndicators(round) {
  if (!round.doraIndicators.length) {
    return "-";
  }

  return round.doraIndicators.map((tile) => getTileLabel(tile)).join(" ");
}

function renderTile(tile, extraClass = "") {
  return `<span class="tile ${extraClass}">${getTileLabel(tile)}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTileLabel(tile) {
  if (!tile) {
    return "";
  }

  const honors = ["", "東", "南", "西", "北", "白", "發", "中"];
  const suits = { m: "萬", p: "筒", s: "索" };

  if (tile.suit === "z") {
    return honors[tile.rank] || "?";
  }

  return `${tile.rank}${suits[tile.suit] || "?"}`;
}
