const WIND_LABELS = {
  east: "東",
  south: "南",
  west: "西",
  north: "北"
};

export function renderGame(state, root) {
  const round = state.round;
  const largeTileClass = state.settings.largeTileMode ? " large-tiles" : "";

  root.innerHTML = `
    <div class="app${largeTileClass}">
      <header class="topbar">
        <h1 class="title">じゅんちゃん麻雀 MVP-0.1</h1>
        <div class="controls">
          <button type="button" data-action="start-round">新規局開始</button>
          <button type="button" class="secondary" data-action="toggle-large">
            ${state.settings.largeTileMode ? "通常牌" : "大きい牌"}
          </button>
        </div>
      </header>

      ${round ? renderTable(state) : renderEmptyState()}

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
        <span class="status-line">game core未統合でもUIの形を確認できます。</span>
      </section>
    </main>
  `;
}

function renderTable(state) {
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
        <span class="table-meta">通常山: ${round.wall.length}枚</span>
        <span class="table-meta">王牌: ${round.deadWall.length}枚</span>
        <span class="table-meta">ドラ表示牌: ${renderDoraIndicators(round)}</span>
      </section>
    </main>
  `;
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
    return round.endReason === "exhaustive-draw" ? "流局しました" : "局が終了しました";
  }

  const currentPlayer = round.players[round.currentPlayerIndex];
  return `${WIND_LABELS[currentPlayer.wind]} ${currentPlayer.name} の手番`;
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
