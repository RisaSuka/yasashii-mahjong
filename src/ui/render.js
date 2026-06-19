import {
  getMahjongTermDescription,
  getMahjongTermReading,
  getTotalHan,
  getYakuDescription,
  getYakuDisplayName,
  sortYakuForDisplay
} from "./yaku-display.js";
import { getTileSvgPath } from "./tile-assets.js?v=mvp201-svg-tiles-redesign-1";
import { sortTiles } from "../game/tiles.js";

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
        <h1 class="title">じゅんちゃん麻雀</h1>
        <div class="controls">
          <button type="button" data-action="start-match">
            <span class="button-label-full">新規局開始</span>
            <span class="button-label-short" aria-hidden="true">新規局</span>
          </button>
          <button type="button" class="secondary" data-action="toggle-large">
            <span class="button-label-full">${state.settings.largeTileMode ? "通常牌" : "大きい牌"}</span>
            <span class="button-label-short" aria-hidden="true">${state.settings.largeTileMode ? "通常" : "大牌"}</span>
          </button>
          <button type="button" class="secondary" data-action="toggle-discard-advice">
            <span class="button-label-full">アドバイス: ${state.settings.discardAdviceEnabled ? "ON" : "OFF"}</span>
            <span class="button-label-short" aria-hidden="true">助言${state.settings.discardAdviceEnabled ? "ON" : "OFF"}</span>
          </button>
          <button type="button" class="secondary beginner-help-button" data-action="open-beginner-help">
            <span class="button-label-full">初心者ヘルプ</span>
            <span class="button-label-short" aria-hidden="true">ヘルプ</span>
          </button>
        </div>
      </header>

      <p class="orientation-hint">スマホを横向きにすると、牌とボタンが見やすくなります。</p>

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

function renderTableLegacy(state, options) {
  const { round } = state;
  const seats = [
    round.players[2],
    round.players[3],
    round.players[1],
    round.players[0]
  ];
  const discardAdvice = getDiscardAdvice(state, options);
  const yakuGuide = getYakuGuide(state, options);
  const waitInfo = getWaitInfo(state, options);
  const allHandsOpen = Boolean(options.allHandsDialogOpen);

  return `
    <main class="table" aria-label="4人麻雀卓">
      ${seats.map((player) => renderSeat(player, round, discardAdvice, yakuGuide, waitInfo)).join("")}
      <section class="center-panel">
        <div class="table-discard-ring">
          ${renderTableDiscardZone(round.players[3], "north", round)}
          ${renderTableDiscardZone(round.players[2], "west", round)}
          <div class="center-info">
            <div class="center-info-main">
              <div class="center-primary">
                ${renderMatchSummary(state)}
                <strong class="center-status">${renderCompactStatus(round)}</strong>
              </div>
              <div class="center-secondary">
            ${renderPreviousRoundResult(state.lastRoundResult, round)}
            ${renderLastActionResult(round)}
            ${renderDiscardAdviceDialog(discardAdvice, options.discardAdviceDialogOpen && options.discardZoomPlayerId == null && !options.matchResultDialogOpen && !options.beginnerHelpDialogOpen && !options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderDiscardZoomDialog(round, options.matchResultDialogOpen || options.beginnerHelpDialogOpen || options.yakuGuideDialogOpen || options.waitsDialogOpen || allHandsOpen ? null : options.discardZoomPlayerId)}
            ${renderMatchResultDialog(state, options.matchResultDialogOpen && !options.beginnerHelpDialogOpen && !options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderBeginnerHelpDialog(options.beginnerHelpDialogOpen && !options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderYakuGuideDialog(yakuGuide, options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderWaitsDialog(waitInfo, options.waitsDialogOpen && !allHandsOpen)}
            ${renderAllHandsDialog(state, allHandsOpen)}
            ${renderYakuSummary(round)}
            <div class="table-meta-row">
              <span class="table-meta">山 ${round.wall.length}</span>
              <span class="table-meta">王牌 ${round.deadWall.length}</span>
              <span class="table-meta">ドラ ${renderDoraIndicators(round)}</span>
            </div>
            ${renderTableActionBar(state, options)}
          </div>
          ${renderTableDiscardZone(round.players[1], "south", round)}
          ${renderTableDiscardZone(round.players[0], "east", round)}
        </div>
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
  const discardAdvice = getDiscardAdvice(state, options);
  const yakuGuide = getYakuGuide(state, options);
  const waitInfo = getWaitInfo(state, options);
  const allHandsOpen = Boolean(options.allHandsDialogOpen);

  return `
    <main class="table" aria-label="4人麻雀卓">
      ${seats.map((player) => renderSeat(player, round, discardAdvice, yakuGuide, waitInfo)).join("")}
      <section class="center-panel">
        <div class="table-discard-ring">
          ${renderTableDiscardZone(round.players[3], "north", round)}
          ${renderTableDiscardZone(round.players[2], "west", round)}
          <div class="center-info">
            <div class="center-info-main">
              <div class="center-primary">
                ${renderMatchSummary(state)}
                <strong class="center-status">${renderCompactStatus(round)}</strong>
              </div>
              <div class="center-secondary">
                <div class="table-meta-row">
                  <span class="table-meta">山 ${round.wall.length}</span>
                  <span class="table-meta">王牌 ${round.deadWall.length}</span>
                  <span class="table-meta">ドラ ${renderDoraIndicators(round)}</span>
                </div>
                ${renderTableActionBar(state, options)}
              </div>
            </div>
            ${renderPreviousRoundResult(state.lastRoundResult, round)}
            ${renderLastActionResult(round)}
            ${renderDiscardAdviceDialog(discardAdvice, options.discardAdviceDialogOpen && options.discardZoomPlayerId == null && !options.matchResultDialogOpen && !options.beginnerHelpDialogOpen && !options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderDiscardZoomDialog(round, options.matchResultDialogOpen || options.beginnerHelpDialogOpen || options.yakuGuideDialogOpen || options.waitsDialogOpen || allHandsOpen ? null : options.discardZoomPlayerId)}
            ${renderMatchResultDialog(state, options.matchResultDialogOpen && !options.beginnerHelpDialogOpen && !options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderBeginnerHelpDialog(options.beginnerHelpDialogOpen && !options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderYakuGuideDialog(yakuGuide, options.yakuGuideDialogOpen && !options.waitsDialogOpen && !allHandsOpen)}
            ${renderWaitsDialog(waitInfo, options.waitsDialogOpen && !allHandsOpen)}
            ${renderAllHandsDialog(state, allHandsOpen)}
            ${renderYakuSummary(round)}
          </div>
          ${renderTableDiscardZone(round.players[1], "south", round)}
          ${renderTableDiscardZone(round.players[0], "east", round)}
        </div>
      </section>
    </main>
  `;
}

function renderTableActionBar(state, options) {
  const actions = [
    renderMatchEndAction(state),
    renderAllHandsAction(state),
    renderNextRoundAction(state),
    renderRonAction(state, options),
    renderTsumoAction(state, options)
  ].filter(Boolean).join("");

  if (!actions) {
    return "";
  }

  return `<div class="table-action-bar">${actions}</div>`;
}

function renderMatchSummary(state) {
  const { match, round } = state;

  if (!match && !round?.handNumber) {
    return "";
  }

  const label = getHandLabel(match || round);
  const dealerLabel = getDealerLabel(match?.dealerIndex ?? round?.dealerIndex);

  return `
    <section class="match-summary" aria-label="現在の局">
      <span class="match-hand-label">${escapeHtml(label)}</span>
      ${dealerLabel ? `<span class="match-dealer-label">親 ${escapeHtml(dealerLabel)}</span>` : ""}
    </section>
  `;
}

function renderMatchEndAction(state) {
  if (!isMatchFinishedForDisplay(state)) {
    return "";
  }

  return `
    <section class="match-ended-summary" aria-label="東風戦終了">
      <strong>東風戦終了</strong>
      <span>4局遊び終わりました。</span>
      <span>点数計算はまだ未対応です。</span>
      <button type="button" class="match-result-button" data-action="open-match-result">結果を見る</button>
      <button type="button" class="all-hands-button match-all-hands-button" data-action="open-all-hands">みんなの手を見る</button>
      <button type="button" class="restart-match-button" data-action="start-match">もう一度遊ぶ</button>
    </section>
  `;
}

function renderPreviousRoundResult(lastRoundResult, round) {
  if (!lastRoundResult || round.phase === "ended") {
    return "";
  }

  return `
    <section class="previous-round-result" aria-label="前の局の結果">
      前の局: ${escapeHtml(formatRoundResult(lastRoundResult))}
    </section>
  `;
}

function renderNextRoundAction(state) {
  const { round } = state;

  if (round.phase !== "ended") {
    return "";
  }

  if (isMatchFinishedForDisplay(state)) {
    return "";
  }

  return `
    <button type="button" class="next-round-button" data-action="start-next-round">
      次の局へ
    </button>
  `;
}

function renderAllHandsAction(state) {
  if (state.round?.phase !== "ended") {
    return "";
  }

  if (isMatchFinishedForDisplay(state)) {
    return "";
  }

  return `
    <button type="button" class="all-hands-button" data-action="open-all-hands">
      みんなの手を見る
    </button>
  `;
}

function isMatchFinishedForDisplay(state) {
  const { match, round } = state;

  if (!match) {
    return false;
  }

  return match.status === "ended" || match.phase === "ended" || (round?.phase === "ended" && match.handNumber >= match.maxHands);
}

function getDiscardAdvice(state, options) {
  const round = state.round;

  if (
    !state.settings.discardAdviceEnabled ||
    !round ||
    round.phase !== "discard" ||
    typeof options.suggestDiscards !== "function"
  ) {
    return [];
  }

  const human = round.players.find((player) => player.type === "human");

  if (!human || round.currentPlayerIndex !== human.id) {
    return [];
  }

  return options.suggestDiscards(human.hand, {
    round,
    player: human,
    strategy: state.settings.discardAdviceStrategy || "beginner",
    maxSuggestions: 3
  });
}

function getYakuGuide(state, options) {
  const round = state.round;

  if (!round || typeof options.suggestYakuTargets !== "function") {
    return [];
  }

  const human = round.players.find((player) => player.type === "human");

  if (!human) {
    return [];
  }

  return options.suggestYakuTargets(human.hand, {
    round,
    player: human,
    match: state.match,
    maxTargets: 3
  });
}

function getWaitInfo(state, options) {
  const round = state.round;

  if (!round) {
    return null;
  }

  const human = round.players.find((player) => player.type === "human");

  if (!human) {
    return null;
  }

  const context = {
    round,
    player: human,
    match: state.match
  };
  const waitInfo = typeof options.analyzeWaits === "function"
    ? options.analyzeWaits(human.hand, context)
    : {
      isTenpai: false,
      waits: [],
      message: ""
    };
  const discardWaitInfo = typeof options.analyzeDiscardWaits === "function"
    ? options.analyzeDiscardWaits(human.hand, context)
    : {
      hasTenpaiDiscard: false,
      options: [],
      message: ""
    };

  return {
    ...waitInfo,
    discardWaitOptions: Array.isArray(discardWaitInfo.options) ? discardWaitInfo.options : [],
    hasTenpaiDiscard: Boolean(discardWaitInfo.hasTenpaiDiscard),
    discardWaitMessage: discardWaitInfo.message || ""
  };
}

function renderWaitsButton(waitInfo) {
  const hasWaits = waitInfo?.isTenpai && Array.isArray(waitInfo.waits) && waitInfo.waits.length > 0;
  const hasDiscardWaits = waitInfo?.hasTenpaiDiscard && Array.isArray(waitInfo.discardWaitOptions) && waitInfo.discardWaitOptions.length > 0;

  return `
    <button type="button" class="waits-trigger${hasWaits || hasDiscardWaits ? " has-waits" : ""}" data-action="open-waits">
      ${hasDiscardWaits ? "\u5207\u308b\u3068\u5f85\u3061" : hasWaits ? "\u5f85\u3061\u3042\u308a" : "\u5f85\u3061"}
    </button>
  `;
}

function renderWaitsDialog(waitInfo, isOpen) {
  if (!isOpen) {
    return "";
  }

  const waits = Array.isArray(waitInfo?.waits) ? waitInfo.waits : [];
  const discardWaitOptions = getDisplayDiscardWaitOptions(waitInfo?.discardWaitOptions);
  const hasAnyGuidance = waits.length > 0 || discardWaitOptions.length > 0;

  return `
    <section class="waits-backdrop" data-action="close-waits" aria-label="\u5f85\u3061\u724c\u3092\u9589\u3058\u308b">
      <div class="waits-modal" role="dialog" aria-modal="false" aria-label="\u5f85\u3061\u724c">
        <div class="waits-header">
          <div>
            <strong>\u5f85\u3061\u724c</strong>
            <span>\u4e0a\u304c\u308a\u306b\u8fd1\u3044\u304b\u3001\u4f55\u3092\u5207\u308b\u3068\u5f85\u3061\u304c\u6b8b\u308b\u304b\u306e\u76ee\u5b89\u3067\u3059\u3002</span>
          </div>
          <button type="button" class="waits-close" data-action="close-waits">\u9589\u3058\u308b</button>
        </div>
        ${discardWaitOptions.length ? renderDiscardWaitOptions(discardWaitOptions) : ""}
        ${waits.length ? renderWaitsList(waits) : ""}
        ${!hasAnyGuidance ? `
          <p class="waits-empty">${escapeHtml(waitInfo?.message || "\u307e\u3060\u30c6\u30f3\u30d1\u30a4\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002")}</p>
          <p class="waits-note">\u5f79\u30ac\u30a4\u30c9\u3084\u52a9\u8a00\u3092\u898b\u306a\u304c\u3089\u3001\u5f62\u3092\u5c11\u3057\u305a\u3064\u6574\u3048\u3066\u3044\u304d\u307e\u3057\u3087\u3046\u3002</p>
        ` : ""}
      </div>
    </section>
  `;
}

function getDisplayDiscardWaitOptions(options = []) {
  const seen = new Set();
  const uniqueOptions = [];

  for (const option of Array.isArray(options) ? options : []) {
    const key = option.discardTile ? `${option.discardTile.suit}${option.discardTile.rank}` : option.discardTileId;
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueOptions.push(option);
    if (uniqueOptions.length >= 4) {
      break;
    }
  }

  return uniqueOptions;
}

function renderDiscardWaitOptions(options) {
  return `
    <section class="discard-waits-section">
      <h3>\u5207\u308b\u3068\u5f85\u3061</h3>
      <ol class="discard-waits-list">
        ${options.map((option) => renderDiscardWaitOption(option)).join("")}
      </ol>
    </section>
  `;
}

function renderDiscardWaitOption(option) {
  const waits = Array.isArray(option.waits) ? option.waits : [];
  const displayWaits = waits.slice(0, 4);
  const hasYakuWait = waits.some((wait) => wait.hasYaku);

  return `
    <li class="discard-waits-item${hasYakuWait ? " has-yaku" : " no-yaku"}">
      <div class="discard-waits-discard">
        <span>\u5207\u308b</span>
        ${renderTile(option.discardTile, "waits-tile discard-waits-discard-tile")}
        <strong>${escapeHtml(option.discardTileLabel || "")}</strong>
      </div>
      <div class="discard-waits-result">
        <span>${escapeHtml(option.message || "")}</span>
        <div class="discard-waits-tiles">
          ${displayWaits.map((wait) => renderTile(wait.tile, "waits-tile")).join("")}
        </div>
        ${hasYakuWait
          ? `<p class="waits-yaku">\u5f79\u3042\u308a\u5f85\u3061: ${escapeHtml(formatWaitYaku(waits.flatMap((wait) => wait.hasYaku ? wait.yaku : [])))}</p>`
          : `<p class="waits-no-yaku">\u5f79\u306a\u3057\u306b\u306a\u308a\u305d\u3046\u3067\u3059\u3002</p>`}
      </div>
    </li>
  `;
}

function renderWaitsList(waits) {
  return `
    <section class="current-waits-section">
      <h3>\u4eca\u306e\u5f85\u3061</h3>
    <ol class="waits-list">
      ${waits.map((wait) => `
        <li class="waits-item${wait.hasYaku ? " has-yaku" : " no-yaku"}">
          <div class="waits-tile-line">
            ${renderTile(wait.tile, "waits-tile")}
            <div>
              <strong>${escapeHtml(wait.tileLabel || "")}</strong>
              <span>${escapeHtml(wait.message || "")}</span>
            </div>
          </div>
          ${wait.hasYaku
            ? `<p class="waits-yaku">\u5f79: ${escapeHtml(formatWaitYaku(wait.yaku))}</p>`
            : `<p class="waits-no-yaku">\u5f79\u306a\u3057\u306b\u306a\u308a\u305d\u3046\u3067\u3059\u3002\u30bf\u30f3\u30e4\u30aa\u3084\u5f79\u724c\u3092\u610f\u8b58\u3059\u308b\u3068\u4e0a\u304c\u308a\u3084\u3059\u304f\u306a\u308a\u307e\u3059\u3002</p>`}
        </li>
      `).join("")}
    </ol>
    </section>
  `;
}

function formatWaitYaku(yaku = []) {
  if (!Array.isArray(yaku) || yaku.length === 0) {
    return "\u306a\u3057";
  }

  return sortYakuForDisplay(yaku).map((entry) => getYakuDisplayName(entry)).join("\u3001");
}

function renderDiscardAdviceButton(advice) {
  if (!Array.isArray(advice) || advice.length === 0) {
    return "";
  }

  return `
    <button type="button" class="discard-advice-trigger" data-action="open-discard-advice">
      助言を見る
    </button>
  `;
}

function renderDiscardAdviceDialog(advice, isOpen) {
  if (!Array.isArray(advice) || advice.length === 0) {
    return "";
  }

  if (!isOpen) {
    return "";
  }

  return `
    <section class="discard-advice-modal" role="dialog" aria-modal="false" aria-label="おすすめ理由">
      <div class="discard-advice">
        <div class="discard-advice-header">
          <strong class="discard-advice-title">おすすめ理由</strong>
          <button type="button" class="discard-advice-close" data-action="close-discard-advice">閉じる</button>
        </div>
      <ol class="discard-advice-list">
        ${advice.map((entry, index) => `
          <li class="discard-advice-item${index === 0 ? " is-primary" : " is-secondary"}">
            <span class="discard-advice-label">${index === 0 ? escapeHtml(entry.label || "おすすめ") : "候補"}: ${escapeHtml(formatAdviceTileId(entry.tileId))}</span>
            <span class="discard-advice-reason">理由: ${escapeHtml(entry.reason || "")}</span>
          </li>
        `).join("")}
      </ol>
      </div>
    </section>
  `;
}

function renderYakuGuideButton(targets) {
  if (!Array.isArray(targets) || targets.length === 0) {
    return `<span class="seat-yaku-guide-placeholder" aria-hidden="true">\u5f79\u30ac\u30a4\u30c9</span>`;
  }

  return `
    <button type="button" class="yaku-guide-trigger" data-action="open-yaku-guide">
      \u5f79\u30ac\u30a4\u30c9
    </button>
  `;
}

function renderYakuGuideDialog(targets, isOpen) {
  if (!isOpen || !Array.isArray(targets) || targets.length === 0) {
    return "";
  }

  return `
    <section class="yaku-guide-backdrop" data-action="close-yaku-guide" aria-label="\u5f79\u30ac\u30a4\u30c9\u3092\u9589\u3058\u308b">
      <div class="yaku-guide-modal" role="dialog" aria-modal="false" aria-label="\u4eca\u306e\u624b\u3067\u72d9\u3044\u3084\u3059\u3044\u5f79">
        <div class="yaku-guide-header">
          <div>
            <strong>\u4eca\u306e\u624b\u3067\u72d9\u3044\u3084\u3059\u3044\u5f79</strong>
            <span>\u7d76\u5bfe\u6b63\u89e3\u3067\u306f\u306a\u304f\u3001\u8ff7\u3063\u305f\u6642\u306e\u76ee\u5b89\u3067\u3059\u3002</span>
          </div>
          <button type="button" class="yaku-guide-close" data-action="close-yaku-guide">\u9589\u3058\u308b</button>
        </div>
        <ol class="yaku-guide-list">
          ${targets.map((target) => `
            <li class="yaku-guide-item yaku-guide-${escapeHtml(target.id)}">
              <div class="yaku-guide-item-header">
                <strong>${escapeHtml(target.name)}${target.reading ? `\uff08${escapeHtml(target.reading)}\uff09` : ""}</strong>
              </div>
              <p>${escapeHtml(target.description || "")}</p>
              <p>${escapeHtml(target.why || "")}</p>
              <div class="yaku-guide-example">
                <span>\u5b8c\u6210\u30a4\u30e1\u30fc\u30b8\uff08\u4f8b\uff09</span>
                <div class="yaku-guide-example-tiles">
                  ${(target.exampleTiles || []).map((tile) => renderTile(tile, "yaku-guide-tile")).join("")}
                </div>
              </div>
              ${renderYakuGuideHints(target)}
            </li>
          `).join("")}
        </ol>
      </div>
    </section>
  `;
}

function renderYakuGuideHints(target) {
  const keepHints = Array.isArray(target.keepHints) ? target.keepHints : [];
  const discardHints = Array.isArray(target.discardHints) ? target.discardHints : [];

  if (!keepHints.length && !discardHints.length) {
    return "";
  }

  return `
    <div class="yaku-guide-hints">
      ${keepHints.length ? `<span>\u6b8b\u3057\u305f\u3044: ${escapeHtml(keepHints.join("\u3001"))}</span>` : ""}
      ${discardHints.length ? `<span>\u5207\u308a\u3084\u3059\u3044: ${escapeHtml(discardHints.join("\u3001"))}</span>` : ""}
    </div>
  `;
}

function renderDiscardZoomDialog(round, playerId) {
  if (playerId === null || playerId === undefined) {
    return "";
  }

  const player = round.players.find((candidate) => candidate.id === Number(playerId));

  if (!player) {
    return "";
  }

  const label = `${WIND_LABELS[player.wind]} ${player.name}`;
  const discards = player.discards || [];

  return `
    <section class="discard-zoom-backdrop" data-action="close-discard-zoom" aria-label="捨て牌拡大を閉じる">
      <div class="discard-zoom-modal" role="dialog" aria-modal="false" aria-label="${escapeHtml(label)}の捨て牌">
        <div class="discard-zoom-header">
          <strong>${escapeHtml(label)}の捨て牌</strong>
          <button type="button" class="discard-zoom-close" data-action="close-discard-zoom">閉じる</button>
        </div>
        <div class="discard-zoom-count">捨て牌 ${discards.length}枚</div>
        <div class="discard-zoom-tiles">
          ${discards.length
            ? discards.map((tile) => renderTile(tile, "discard-zoom-tile")).join("")
            : `<span class="discard-zoom-empty">まだ捨て牌はありません</span>`}
        </div>
      </div>
    </section>
  `;
}

function renderMatchResultDialog(state, isOpen) {
  if (!isOpen || !isMatchFinishedForDisplay(state)) {
    return "";
  }

  const history = Array.isArray(state.match?.roundHistory) ? state.match.roundHistory : [];

  return `
    <section class="match-result-backdrop" data-action="close-match-result" aria-label="今回の結果を閉じる">
      <div class="match-result-modal" role="dialog" aria-modal="false" aria-label="今回の結果">
        <div class="match-result-header">
          <strong>今回の結果</strong>
          <button type="button" class="match-result-close" data-action="close-match-result">閉じる</button>
        </div>
        <p class="match-result-note">点数計算と順位はまだ未対応です。</p>
        <ol class="match-result-list">
          ${history.length
            ? history.map((entry) => `
              <li>
                <span class="match-result-hand">${escapeHtml(entry.handLabel || getHandLabel(entry))}</span>
                <span class="match-result-text">${escapeHtml(formatHistoryResult(entry))}</span>
              </li>
            `).join("")
            : `<li>まだ局履歴がありません</li>`}
        </ol>
      </div>
    </section>
  `;
}

function renderAllHandsDialog(state, isOpen) {
  const round = state.round;

  if (!isOpen || round?.phase !== "ended") {
    return "";
  }

  const winnerId = round.winningResult?.winnerId;
  const winningTile = round.winningResult?.winningTile || round.lastDiscard?.tile || null;
  const yakuResult = Array.isArray(round.winningResult?.yakuResult) ? round.winningResult.yakuResult : [];
  const resultLabel = round.endReason === "win"
    ? formatRoundResult({
      endReason: "win",
      winType: round.winningResult?.winType,
      winnerId
    })
    : formatRoundResult({ endReason: "exhaustive-draw" });

  return `
    <section class="all-hands-backdrop" data-action="close-all-hands" aria-label="みんなの手牌を閉じる">
      <div class="all-hands-modal" role="dialog" aria-modal="false" aria-label="みんなの手牌">
        <div class="all-hands-header">
          <div>
            <strong>みんなの手牌</strong>
            <span>${escapeHtml(resultLabel)}のあとだけ見られる学習用の表示です。</span>
          </div>
          <button type="button" class="all-hands-close" data-action="close-all-hands">閉じる</button>
        </div>
        <p class="all-hands-note">点数計算と順位はまだ未対応です。</p>
        <div class="all-hands-list">
          ${round.players.map((player) => renderAllHandsPlayer(player, winnerId, winningTile, yakuResult)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderAllHandsPlayer(player, winnerId, winningTile, yakuResult) {
  const isWinner = player.id === winnerId;
  const label = `${WIND_LABELS[player.wind]} ${player.name}`;
  const sortedHand = sortTiles(player.hand || []);
  const yakuText = isWinner && yakuResult.length
    ? sortYakuForDisplay(yakuResult).map((entry) => getYakuDisplayName(entry)).join("、")
    : "";

  return `
    <section class="all-hands-item${isWinner ? " all-hands-winner" : ""}" data-player-id="${player.id}">
      <div class="all-hands-player-header">
        <strong>${escapeHtml(label)}の手牌</strong>
        ${isWinner ? `<span class="all-hands-winner-badge">上がり</span>` : ""}
      </div>
      <div class="all-hands-tiles">
        ${sortedHand.map((tile) => renderTile(tile, "all-hands-tile")).join("")}
        ${isWinner && winningTile ? `
          <span class="all-hands-winning-tile">
            <span>上がり牌</span>
            ${renderTile(winningTile, "all-hands-tile")}
          </span>
        ` : ""}
      </div>
      ${yakuText ? `<p class="all-hands-yaku">役: ${escapeHtml(yakuText)}</p>` : ""}
    </section>
  `;
}

function renderBeginnerHelpDialog(isOpen) {
  if (!isOpen) {
    return "";
  }

  const topics = [
    ["おすすめ", "絶対の正解ではなく、迷った時の補助です。"],
    ["孤立牌", "近い数字や同じ牌がなく、組み合わせを作りにくい牌です。"],
    ["端牌", "1や9の牌です。つながる数字が少ないので、孤立している時は候補になりやすいです。"],
    ["字牌", "東・南・西・北・白・發・中です。同じ牌が集まると役になります。"],
    ["対子", "同じ牌2枚の組です。3枚そろうと形や役になりやすいので、残すことが多いです。"],
    ["連続した数牌", "3・4や6・7のような近い数字は、順子を作りやすいので残すことが多いです。"],
    ["ドラ", "持っていると点が高くなりやすい大事な牌です。MVPでは点数計算はまだ未対応です。"],
    ["狙いやすい役", "まずはタンヤオや役牌を狙うと分かりやすいです。"]
  ];

  return `
    <section class="beginner-help-backdrop" data-action="close-beginner-help" aria-label="初心者ヘルプを閉じる">
      <div class="beginner-help-modal" role="dialog" aria-modal="false" aria-label="初心者ヘルプ">
        <div class="beginner-help-header">
          <strong>初心者ヘルプ</strong>
          <button type="button" class="beginner-help-close" data-action="close-beginner-help">閉じる</button>
        </div>
        <p class="beginner-help-note">おすすめ捨て牌は、強い正解ではなく「迷った時の考え方」です。</p>
        <dl class="beginner-help-list">
          ${topics.map(([term, description]) => `
            <div class="beginner-help-item">
              <dt>${escapeHtml(term)}</dt>
              <dd>${escapeHtml(description)}</dd>
            </div>
          `).join("")}
        </dl>
      </div>
    </section>
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

  const sortedYakuResult = sortYakuForDisplay(yakuResult);
  const totalHan = getTotalHan(sortedYakuResult);
  const hanReading = getMahjongTermReading("翻");

  return `
    <section class="yaku-summary" aria-label="役の説明">
      <span class="yaku-summary-title">役（ヤク）:</span>
      ${sortedYakuResult.map((yaku) => renderYakuSummaryItem(yaku, hanReading)).join("")}
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

function renderSeat(player, round, discardAdvice, yakuGuide, waitInfo) {
  const isCurrent = round.currentPlayerIndex === player.id;
  const positionClass = `seat-${player.wind}`;
  const currentClass = isCurrent ? " current" : "";
  const currentIndicator = isCurrent ? `<span class="seat-turn-indicator" aria-label="現在の手番">▶ 手番</span>` : "";

  return `
    <section class="seat ${positionClass}${currentClass}">
      <div class="seat-header">
        <span class="seat-name">${WIND_LABELS[player.wind]} ${player.name}</span>
        <span class="seat-meta seat-header-actions">
          ${player.type === "human" ? renderSeatAdviceButton(discardAdvice) : ""}
          ${player.type === "human" ? renderYakuGuideButton(yakuGuide) : ""}
          ${player.type === "human" ? renderWaitsButton(waitInfo) : ""}
          ${currentIndicator}
        </span>
      </div>
      ${player.type === "human" ? renderHumanHand(player, round, discardAdvice) : renderCpuHand(player)}
      <div class="discard-area ${player.type === "human" ? "discard-area-human" : "discard-area-cpu"}">
        <div class="seat-meta">捨て牌 ${player.discards.length}枚</div>
        <div class="discards">${getVisibleDiscards(player).map((tile) => renderTile(tile, "discard-tile")).join("")}</div>
      </div>
    </section>
  `;
}

function renderSeatAdviceButton(advice) {
  if (!Array.isArray(advice) || advice.length === 0) {
    return `<span class="seat-advice-placeholder" aria-hidden="true">助言を見る</span>`;
  }

  return `
    <button type="button" class="discard-advice-trigger seat-advice-trigger" data-action="open-discard-advice">
      助言を見る
    </button>
  `;
}

function renderTableDiscardZone(player, position, round) {
  if (!player) {
    return "";
  }

  const visibleDiscards = getVisibleDiscards(player);
  const label = `${WIND_LABELS[player.wind]} ${player.name}`;
  const currentClass = round?.currentPlayerIndex === player.id ? " is-current-turn" : "";

  return `
    <section class="table-discard-zone table-discard-${position}${currentClass}" role="button" tabindex="0" data-action="open-discard-zoom" data-player-id="${player.id}" aria-label="${escapeHtml(label)}の捨て牌を拡大">
      <div class="table-discard-label">
        <span>${escapeHtml(label)}</span>
        <span>捨て牌 ${player.discards.length}枚</span>
        <span class="discard-zoom-hint">拡大</span>
      </div>
      <div class="discards table-center-discards">
        ${visibleDiscards.map((tile) => renderTile(tile, "discard-tile")).join("")}
      </div>
    </section>
  `;
}

function getVisibleDiscards(player) {
  const limit = 18;

  return player.discards.slice(-limit);
}

function renderHumanHand(player, round, discardAdvice) {
  const disabled = round.currentPlayerIndex !== player.id || round.phase !== "discard";
  const adviceTileIds = new Set((discardAdvice || []).map((entry) => entry.tileId));

  return `
    <div class="hand" aria-label="あなたの手牌">
      ${player.hand.map((tile) => `
        <button class="tile-button${adviceTileIds.has(tile.id) ? " advice-suggested" : ""}" type="button" data-action="discard-tile" data-tile-id="${tile.id}" ${disabled ? "disabled" : ""}>
          ${renderTile(tile)}
          ${adviceTileIds.has(tile.id) ? `<span class="advice-badge">おすすめ</span>` : ""}
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

function renderCompactStatus(round) {
  if (round.phase === "ended") {
    if (round.endReason === "win" && round.winningResult?.winType === "tsumo") {
      const winner = round.players.find((player) => player.id === round.winningResult.winnerId);
      return winner?.type === "human" ? "あなたのツモ" : `${winner?.name || "CPU"}のツモ`;
    }

    if (round.endReason === "win" && round.winningResult?.winType === "ron") {
      const winner = round.players.find((player) => player.id === round.winningResult.winnerId);
      return winner?.type === "human" ? "あなたのロン" : `${winner?.name || "CPU"}のロン`;
    }

    return round.endReason === "exhaustive-draw" ? "流局" : "局終了";
  }

  if (round.phase === "reaction") {
    return "ロン確認";
  }

  const currentPlayer = round.players[round.currentPlayerIndex];
  return currentPlayer.type === "human" ? "あなたの番" : `${currentPlayer.name}の番`;
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

function getHandLabel(source) {
  const windLabels = {
    east: "東"
  };
  const wind = windLabels[source?.roundWind] || source?.roundWind || "東";
  const handNumber = source?.handNumber || 1;

  return `${wind}${handNumber}局`;
}

function getDealerLabel(dealerIndex) {
  const labels = ["あなた", "南 CPU", "西 CPU", "北 CPU"];

  return labels[dealerIndex] || "";
}

function formatRoundResult(result) {
  if (result.endReason === "win" && result.winType === "tsumo") {
    return result.winnerId === 0 ? "あなたのツモ" : `CPU ${result.winnerId}のツモ`;
  }

  if (result.endReason === "win" && result.winType === "ron") {
    return result.winnerId === 0 ? "あなたのロン" : `CPU ${result.winnerId}のロン`;
  }

  if (result.endReason === "exhaustive-draw") {
    return "流局";
  }

  return "局が終了しました";
}

function formatHistoryResult(result) {
  if (result.resultType === "tsumo" || result.winType === "tsumo") {
    return `${getPlayerResultLabel(result.winnerId)}のツモ`;
  }

  if (result.resultType === "ron" || result.winType === "ron") {
    return `${getPlayerResultLabel(result.winnerId)}のロン`;
  }

  if (result.resultType === "draw" || result.endReason === "exhaustive-draw") {
    return "流局";
  }

  return formatRoundResult(result);
}

function getPlayerResultLabel(playerId) {
  const labels = ["あなた", "南CPU", "西CPU", "北CPU"];

  return labels[playerId] || "CPU";
}

function renderRonAction(state, options) {
  const round = state.round;
  const human = round.players.find((player) => player.type === "human");

  if (!human || round.phase !== "reaction") {
    return "";
  }

  if (typeof options.canDeclareRon === "function" && options.canDeclareRon(state, human.id)) {
    return `
      <div class="reaction-actions">
        <button type="button" class="ron-button" data-action="declare-ron">ロン</button>
        <button type="button" class="skip-ron-button" data-action="skip-ron">見送る</button>
      </div>
    `;
  }

  if (typeof options.canCompleteRonLatestDiscard === "function" && options.canCompleteRonLatestDiscard(state, human.id)) {
    return `
      <div class="reaction-actions no-yaku-reaction">
        <span class="reaction-message">${getNoYakuReactionMessage()}</span>
        <button type="button" class="skip-ron-button" data-action="skip-ron">見送る</button>
      </div>
    `;
  }

  return "";
}

function getNoYakuReactionMessage() {
  return [
    "\u5f62\u306f\u5b8c\u6210\u3057\u3066\u3044\u307e\u3059\u304c\u3001\u5f79\u304c\u3042\u308a\u307e\u305b\u3093\u3002",
    "\u307e\u305a\u306f\u30bf\u30f3\u30e4\u30aa\u3084\u5f79\u724c\u3092\u72d9\u3063\u3066\u307f\u307e\u3057\u3087\u3046\u3002"
  ].join(" ");
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
  const suitClass = tile ? ` tile-${tile.suit}` : "";
  const mainLabel = getTileMainLabel(tile);
  const suitLabel = getTileSuitLabel(tile);
  const visualCue = getTileVisualCue(tile);
  const tileLabel = getTileLabel(tile);
  const svgPath = getTileSvgPath(tile);
  const svgClass = svgPath ? " has-svg" : "";
  const imageAttribute = svgPath ? ` data-tile-image="${escapeHtml(svgPath)}"` : "";
  const className = `tile${suitClass}${svgClass} ${extraClass}`.trim();

  return `
    <span class="${className}" title="${escapeHtml(tileLabel)}" aria-label="${escapeHtml(tileLabel)}"${imageAttribute}>
      ${svgPath ? `<img class="tile-image" src="${escapeHtml(svgPath)}" alt="" aria-hidden="true" onerror="this.hidden=true;this.closest('.tile').classList.remove('has-svg')">` : ""}
      <span class="tile-face">
        <span class="tile-symbol">${escapeHtml(mainLabel)}</span>
        ${suitLabel ? `
          <span class="tile-helper">
            ${visualCue ? `<span class="tile-visual-cue" aria-hidden="true">${escapeHtml(visualCue)}</span>` : ""}
            <span class="tile-suit-label">${escapeHtml(suitLabel)}</span>
          </span>
        ` : ""}
      </span>
    </span>
  `;
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

function formatAdviceTileId(tileId) {
  if (!tileId) {
    return "";
  }

  const match = String(tileId).match(/^([mpsz])(\d+)/);

  if (!match) {
    return String(tileId);
  }

  const tile = {
    suit: match[1],
    rank: Number(match[2])
  };

  return getTileLabel(tile);
}

function getTileMainLabel(tile) {
  if (!tile) {
    return "";
  }

  if (tile.suit === "z") {
    const honors = ["", "東", "南", "西", "北", "白", "發", "中"];
    return honors[tile.rank] || "?";
  }

  return String(tile.rank);
}

function getTileSuitLabel(tile) {
  if (!tile) {
    return "";
  }

  const suitLabels = {
    m: "萬",
    p: "筒",
    s: "索",
    z: "字牌"
  };

  return suitLabels[tile.suit] || "";
}

function getTileVisualCue(tile) {
  if (!tile) {
    return "";
  }

  const visualCues = {
    m: "萬",
    p: "○",
    s: "┃",
    z: "字"
  };

  return visualCues[tile.suit] || "";
}
