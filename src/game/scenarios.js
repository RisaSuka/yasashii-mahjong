import { createPlayers } from "./player.js";
import { createTiles } from "./tiles.js";
import { createInitialGameState } from "./round.js";

const SCENARIO_ALIASES = {
  "human-tsumo-standard": "human-tsumo-ready",
  "cpu-tsumo-standard": "cpu-tsumo-ready",
  "ron-ready-human-ron-on-cpu-discard": "ron-ready-basic",
  "human-ron-ready-tanyao": "ron-ready-tanyao",
  "human-ron-ready-yakuhai": "ron-ready-yakuhai",
  "human-ron-ready-chiitoitsu": "ron-ready-chiitoitsu",
  "no-yaku-ron-shape": "ron-ready-basic",
  "human-riichi-tsumo-ready": "human-riichi-tsumo-ready",
  "human-riichi-ron-ready": "human-riichi-ron-ready",
  "human-not-riichi-ready": "human-not-riichi-ready",
  "cpu-riichi-ready": "cpu-riichi-ready",
  "cpu-riichi-tsumo-ready": "cpu-riichi-tsumo-ready",
  "cpu-riichi-ron-ready": "cpu-riichi-ron-ready",
  "cpu-not-riichi-ready": "cpu-not-riichi-ready",
  "human-pon-ready-yakuhai": "human-pon-ready-yakuhai",
  "human-pon-after-discard": "human-pon-after-discard",
  "human-pon-riichi-blocked": "human-pon-riichi-blocked",
  "human-pon-yakuhai-win-shape": "human-pon-yakuhai-win-shape",
  "human-chi-ready": "human-chi-ready",
  "human-chi-multiple-options": "human-chi-multiple-options",
  "human-chi-not-kamicha": "human-chi-not-kamicha",
  "human-chi-riichi-blocked": "human-chi-riichi-blocked",
  "human-multiple-melds-layout": "human-multiple-melds-layout",
  "human-open-tanyao-win-shape": "human-open-tanyao-win-shape",
  "human-open-no-yaku-win-shape": "human-open-no-yaku-win-shape",
  "human-open-yakuhai-ron-ready": "human-open-yakuhai-ron-ready",
  "cpu-pon-ready-yakuhai": "cpu-pon-ready-yakuhai",
  "cpu-pon-after-human-discard": "cpu-pon-ready-yakuhai",
  "cpu-pon-ready-toitoi": "cpu-pon-ready-toitoi",
  "cpu-pon-no-yaku-avoid": "cpu-pon-no-yaku-avoid",
  "cpu-pon-riichi-blocked": "cpu-pon-riichi-blocked",
  "cpu-pon-open-yakuhai-win-shape": "cpu-pon-open-yakuhai-win-shape",
  "cpu-chi-ready-tanyao": "cpu-chi-ready-tanyao",
  "cpu-chi-after-human-discard": "cpu-chi-ready-tanyao",
  "cpu-chi-multiple-options": "cpu-chi-multiple-options",
  "cpu-chi-not-kamicha": "cpu-chi-not-kamicha",
  "cpu-chi-no-yaku-avoid": "cpu-chi-no-yaku-avoid",
  "cpu-chi-riichi-blocked": "cpu-chi-riichi-blocked",
  "cpu-chi-open-tanyao-win-shape": "cpu-chi-open-tanyao-win-shape",
  "cpu-chi-open-no-yaku-win-shape": "cpu-chi-open-no-yaku-win-shape",
  "cpu-pon-priority-over-chi": "cpu-pon-priority-over-chi"
};

const SCENARIOS = {
  "human-tsumo-ready": {
    name: "human-tsumo-ready",
    description: "Human player has a standard winning 14-tile hand.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1"
    },
    discards: {}
  },
  "cpu-tsumo-ready": {
    name: "cpu-tsumo-ready",
    description: "CPU player 1 has a standard winning 14-tile hand.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1"
    },
    discards: {}
  },
  "cpu-tsumo-ready-yakuhai": {
    name: "cpu-tsumo-ready-yakuhai",
    description: "CPU player 1 has a yakuhai tsumo winning hand.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z5 z5 z5 m9 m9"
    },
    discards: {}
  },
  "ron-ready-basic": {
    name: "ron-ready-basic",
    description: "Future ron setup: CPU 1 has discarded a tile that completes the human pair.",
    phase: "discard",
    currentPlayerIndex: 2,
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1"
    },
    discards: {
      1: "z1"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z1"
    }
  },
  "ron-ready-tanyao": {
    name: "ron-ready-tanyao",
    description: "Human player can ron on a CPU discard with tanyao.",
    phase: "discard",
    currentPlayerIndex: 2,
    hands: {
      0: "m2 m3 m4 m4 m5 m6 p2 p3 p4 p6 p7 p8 s5"
    },
    discards: {
      1: "s5"
    },
    lastDiscard: {
      playerId: 1,
      tile: "s5"
    }
  },
  "ron-ready-yakuhai": {
    name: "ron-ready-yakuhai",
    description: "Human player can ron on a CPU discard with yakuhai.",
    phase: "discard",
    currentPlayerIndex: 2,
    hands: {
      0: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z1 z1 z5 z5"
    },
    discards: {
      1: "z5"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z5"
    }
  },
  "ron-ready-chiitoitsu": {
    name: "ron-ready-chiitoitsu",
    description: "Human player can ron on a CPU discard with seven pairs.",
    phase: "discard",
    currentPlayerIndex: 2,
    hands: {
      0: "m1 m1 m2 m2 p3 p3 p4 p4 s5 s5 s6 s6 z1"
    },
    discards: {
      1: "z1"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z1"
    }
  },
  "cpu-ron-ready-yakuhai": {
    name: "cpu-ron-ready-yakuhai",
    description: "CPU player 1 can ron on a human discard with yakuhai.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z5 z5 m9 m9"
    },
    discards: {
      0: "z5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "z5"
    }
  },
  "cpu-no-yaku-win-shape": {
    name: "cpu-no-yaku-win-shape",
    description: "CPU player 1 has a complete ron shape but no yaku.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m1 m2 m3 p1 p2 p3 s7 s8 s9 m4 m5 p9 p9",
      2: "z1 z2 z3 z4 z5 z6 z7 m7 m8 m9 p4 p5 p6",
      3: "z1 z2 z3 z4 z5 z6 z7 s1 s2 s3 p7 p8 s4"
    },
    discards: {
      0: "m6"
    },
    lastDiscard: {
      playerId: 0,
      tile: "m6"
    }
  },
  "human-riichi-ready": {
    name: "human-riichi-ready",
    description: "Human player can declare riichi by discarding an extra honor tile.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p1 p2 p3 s7 s8 s9 z1 z2"
    },
    discards: {}
  },
  "human-riichi-tsumo-ready": {
    name: "human-riichi-tsumo-ready",
    description: "Human player is already riichi with a complete tsumo shape.",
    phase: "discard",
    currentPlayerIndex: 0,
    riichi: [0],
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p1 p2 p3 s7 s8 s9 z1 z1"
    },
    discards: {}
  },
  "human-riichi-ron-ready": {
    name: "human-riichi-ron-ready",
    description: "Human player is already riichi and can ron on the latest discard.",
    phase: "reaction",
    currentPlayerIndex: 2,
    riichi: [0],
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p1 p2 p3 s7 s8 s9 z1"
    },
    discards: {
      1: "z1"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z1"
    }
  },
  "human-not-riichi-ready": {
    name: "human-not-riichi-ready",
    description: "Human player has a 14-tile hand that does not leave tenpai after any discard.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1 z3"
    },
    discards: {}
  },
  "cpu-riichi-ready": {
    name: "cpu-riichi-ready",
    description: "CPU player 1 can declare riichi by discarding an extra honor tile.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m3 m4 m5 m6 p1 p2 p3 s7 s8 s9 z1 z2"
    },
    discards: {}
  },
  "cpu-riichi-tsumo-ready": {
    name: "cpu-riichi-tsumo-ready",
    description: "CPU player 1 is already riichi with a complete tsumo shape.",
    phase: "discard",
    currentPlayerIndex: 1,
    riichi: [1],
    hands: {
      1: "m1 m2 m3 m4 m5 m6 p1 p2 p3 s7 s8 s9 z1 z1"
    },
    discards: {}
  },
  "cpu-riichi-ron-ready": {
    name: "cpu-riichi-ron-ready",
    description: "CPU player 1 is already riichi and can ron on the latest human discard.",
    phase: "draw",
    currentPlayerIndex: 0,
    riichi: [1],
    hands: {
      1: "m1 m2 m3 m4 m5 m6 p1 p2 p3 s7 s8 s9 z1"
    },
    discards: {
      0: "z1"
    },
    lastDiscard: {
      playerId: 0,
      tile: "z1"
    }
  },
  "cpu-not-riichi-ready": {
    name: "cpu-not-riichi-ready",
    description: "CPU player 1 has a 14-tile hand that does not leave tenpai after any discard.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1 z3"
    },
    discards: {}
  },
  "human-pon-ready-yakuhai": {
    name: "human-pon-ready-yakuhai",
    description: "Human player can pon a CPU yakuhai discard.",
    phase: "reaction",
    currentPlayerIndex: 1,
    hands: {
      0: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z5 z5 m9 m9"
    },
    discards: {
      1: "z5"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z5"
    }
  },
  "human-pon-after-discard": {
    name: "human-pon-after-discard",
    description: "Human player has an open pon meld and must discard.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 p2 p3 p4 s7 s8 s9 m9 m9"
    },
    discards: {
      1: "z5"
    },
    melds: {
      0: [
        {
          type: "pon",
          tiles: "z5 z5 z5",
          calledTile: "z5",
          fromPlayerId: 1
        }
      ]
    },
    lastDiscard: {
      playerId: 1,
      tile: "z5"
    }
  },
  "human-pon-riichi-blocked": {
    name: "human-pon-riichi-blocked",
    description: "Human player has matching tiles but cannot pon while riichi.",
    phase: "reaction",
    currentPlayerIndex: 1,
    riichi: [0],
    hands: {
      0: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z5 z5 m9 m9"
    },
    discards: {
      1: "z5"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z5"
    }
  },
  "human-pon-yakuhai-win-shape": {
    name: "human-pon-yakuhai-win-shape",
    description: "Human player has an open yakuhai pon plus a complete shape.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 p2 p3 p4 s7 s8 s9 m9 m9"
    },
    discards: {
      1: "z5"
    },
    melds: {
      0: [
        {
          type: "pon",
          tiles: "z5 z5 z5",
          calledTile: "z5",
          fromPlayerId: 1
        }
      ]
    },
    lastDiscard: {
      playerId: 1,
      tile: "z5"
    }
  },
  "human-chi-ready": {
    name: "human-chi-ready",
    description: "Human player can chi the upper player's discard.",
    phase: "reaction",
    currentPlayerIndex: 3,
    hands: {
      0: "m1 m2 m3 p3 p4 p7 p8 s2 s3 s4 z5 z5 z6"
    },
    discards: {
      3: "p5"
    },
    lastDiscard: {
      playerId: 3,
      tile: "p5"
    }
  },
  "human-chi-multiple-options": {
    name: "human-chi-multiple-options",
    description: "Human player has three chi options on a five discard.",
    phase: "reaction",
    currentPlayerIndex: 3,
    hands: {
      0: "p3 p4 p4 p6 p6 p7 m1 m2 m3 s2 s3 s4 z5"
    },
    discards: {
      3: "p5"
    },
    lastDiscard: {
      playerId: 3,
      tile: "p5"
    }
  },
  "human-chi-not-kamicha": {
    name: "human-chi-not-kamicha",
    description: "Human player has a sequence shape but the discard is not from the upper player.",
    phase: "reaction",
    currentPlayerIndex: 1,
    hands: {
      0: "m1 m2 m3 p3 p4 p7 p8 s2 s3 s4 z5 z5 z6"
    },
    discards: {
      1: "p5"
    },
    lastDiscard: {
      playerId: 1,
      tile: "p5"
    }
  },
  "human-chi-riichi-blocked": {
    name: "human-chi-riichi-blocked",
    description: "Human player cannot chi while riichi.",
    phase: "reaction",
    currentPlayerIndex: 3,
    riichi: [0],
    hands: {
      0: "m1 m2 m3 p3 p4 p7 p8 s2 s3 s4 z5 z5 z6"
    },
    discards: {
      3: "p5"
    },
    lastDiscard: {
      playerId: 3,
      tile: "p5"
    }
  },
  "human-multiple-melds-layout": {
    name: "human-multiple-melds-layout",
    description: "Human player has multiple open melds for landscape layout checks.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 p7 p8 s2 s3 s4 z6"
    },
    discards: {
      1: "z5",
      3: "p5"
    },
    melds: {
      0: [
        {
          type: "pon",
          tiles: "z5 z5 z5",
          calledTile: "z5",
          fromPlayerId: 1
        },
        {
          type: "chi",
          tiles: "p3 p4 p5",
          calledTile: "p5",
          fromPlayerId: 3
        },
        {
          type: "pon",
          tiles: "m9 m9 m9",
          calledTile: "m9",
          fromPlayerId: 2
        }
      ]
    },
    lastDiscard: {
      playerId: 3,
      tile: "p5"
    }
  },
  "human-open-tanyao-win-shape": {
    name: "human-open-tanyao-win-shape",
    description: "Human player has an open chi and a complete tanyao tsumo shape.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m2 m3 m4 p2 p3 p4 s6 s7 s8 m5 m5"
    },
    discards: {
      3: "p5"
    },
    melds: {
      0: [
        {
          type: "chi",
          tiles: "p3 p4 p5",
          calledTile: "p5",
          fromPlayerId: 3
        }
      ]
    },
    lastDiscard: {
      playerId: 3,
      tile: "p5"
    }
  },
  "human-open-no-yaku-win-shape": {
    name: "human-open-no-yaku-win-shape",
    description: "Human player has an open complete shape with no yaku.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 p7 p8 p9 s1 s2 s3 z1 z1"
    },
    discards: {
      3: "p5"
    },
    melds: {
      0: [
        {
          type: "chi",
          tiles: "p3 p4 p5",
          calledTile: "p5",
          fromPlayerId: 3
        }
      ]
    },
    lastDiscard: {
      playerId: 3,
      tile: "p5"
    }
  },
  "human-open-yakuhai-ron-ready": {
    name: "human-open-yakuhai-ron-ready",
    description: "Human player can ron with an open yakuhai pon hand.",
    phase: "reaction",
    currentPlayerIndex: 1,
    hands: {
      0: "m1 m2 m3 p2 p3 p4 s7 s8 s9 m9"
    },
    discards: {
      1: "m9"
    },
    melds: {
      0: [
        {
          type: "pon",
          tiles: "z5 z5 z5",
          calledTile: "z5",
          fromPlayerId: 1
        }
      ]
    },
    lastDiscard: {
      playerId: 1,
      tile: "m9"
    }
  },
  "cpu-pon-ready-yakuhai": {
    name: "cpu-pon-ready-yakuhai",
    description: "CPU player 1 can pon a human yakuhai discard.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z5 z5 m9 p9"
    },
    discards: {
      0: "z5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "z5"
    }
  },
  "cpu-pon-ready-toitoi": {
    name: "cpu-pon-ready-toitoi",
    description: "CPU player 1 has a pair-heavy toitoi direction and can pon.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m2 m2 p3 p3 s4 s4 m7 m7 p8 p8 z1 z2 z3"
    },
    discards: {
      0: "m2"
    },
    lastDiscard: {
      playerId: 0,
      tile: "m2"
    }
  },
  "cpu-pon-no-yaku-avoid": {
    name: "cpu-pon-no-yaku-avoid",
    description: "CPU player 1 can pon an ordinary pair but has no clear open-yaku route.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m2 m2 m3 m4 p3 p4 s4 s5 m6 p6 s6 z1 z3"
    },
    discards: {
      0: "m2"
    },
    lastDiscard: {
      playerId: 0,
      tile: "m2"
    }
  },
  "cpu-pon-riichi-blocked": {
    name: "cpu-pon-riichi-blocked",
    description: "CPU player 1 has matching tiles but cannot pon while riichi.",
    phase: "draw",
    currentPlayerIndex: 0,
    riichi: [1],
    hands: {
      1: "m1 m2 m3 p2 p3 p4 s7 s8 s9 z5 z5 m9 p9"
    },
    discards: {
      0: "z5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "z5"
    }
  },
  "cpu-pon-open-yakuhai-win-shape": {
    name: "cpu-pon-open-yakuhai-win-shape",
    description: "CPU player 1 has an open yakuhai pon plus a complete tsumo shape.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m3 p2 p3 p4 s7 s8 s9 m9 m9"
    },
    discards: {
      0: "z5"
    },
    melds: {
      1: [
        {
          type: "pon",
          tiles: "z5 z5 z5",
          calledTile: "z5",
          fromPlayerId: 0
        }
      ]
    },
    lastDiscard: {
      playerId: 0,
      tile: "z5"
    }
  },
  "cpu-chi-ready-tanyao": {
    name: "cpu-chi-ready-tanyao",
    description: "CPU player 1 can chi a human suited discard toward tanyao.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m2 m3 m4 p3 p4 p7 p8 s2 s3 s4 s6 s7 s8"
    },
    discards: {
      0: "p5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "p5"
    }
  },
  "cpu-chi-multiple-options": {
    name: "cpu-chi-multiple-options",
    description: "CPU player 1 has three chi options on a human five discard.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "m2 m3 m4 p3 p4 p4 p6 p6 p7 s2 s3 s4 s8"
    },
    discards: {
      0: "p5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "p5"
    }
  },
  "cpu-chi-not-kamicha": {
    name: "cpu-chi-not-kamicha",
    description: "CPU player 1 has a chi shape, but the discard is not from the upper player.",
    phase: "draw",
    currentPlayerIndex: 2,
    hands: {
      1: "m2 m3 m4 p3 p4 p7 p8 s2 s3 s4 s6 s7 s8"
    },
    discards: {
      2: "p5"
    },
    lastDiscard: {
      playerId: 2,
      tile: "p5"
    }
  },
  "cpu-chi-no-yaku-avoid": {
    name: "cpu-chi-no-yaku-avoid",
    description: "CPU player 1 can chi a terminal shape but has no clear open-yaku route.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "p2 p3 m1 m9 p9 s1 s9 z1 z2 z3 z4 z6 z7"
    },
    discards: {
      0: "p1"
    },
    lastDiscard: {
      playerId: 0,
      tile: "p1"
    }
  },
  "cpu-chi-riichi-blocked": {
    name: "cpu-chi-riichi-blocked",
    description: "CPU player 1 cannot chi while riichi.",
    phase: "draw",
    currentPlayerIndex: 0,
    riichi: [1],
    hands: {
      1: "m2 m3 m4 p3 p4 p7 p8 s2 s3 s4 s6 s7 s8"
    },
    discards: {
      0: "p5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "p5"
    }
  },
  "cpu-chi-open-tanyao-win-shape": {
    name: "cpu-chi-open-tanyao-win-shape",
    description: "CPU player 1 has an open chi plus a complete tanyao tsumo shape.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m2 m3 m4 p6 p7 p8 s2 s3 s4 m5 m5"
    },
    discards: {
      0: "p5"
    },
    melds: {
      1: [
        {
          type: "chi",
          tiles: "p3 p4 p5",
          calledTile: "p5",
          fromPlayerId: 0
        }
      ]
    },
    lastDiscard: {
      playerId: 0,
      tile: "p5"
    }
  },
  "cpu-chi-open-no-yaku-win-shape": {
    name: "cpu-chi-open-no-yaku-win-shape",
    description: "CPU player 1 has an open chi plus a complete no-yaku shape.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m3 p7 p8 p9 s1 s2 s3 z3 z3"
    },
    discards: {
      0: "p5"
    },
    melds: {
      1: [
        {
          type: "chi",
          tiles: "p3 p4 p5",
          calledTile: "p5",
          fromPlayerId: 0
        }
      ]
    },
    lastDiscard: {
      playerId: 0,
      tile: "p5"
    }
  },
  "cpu-pon-priority-over-chi": {
    name: "cpu-pon-priority-over-chi",
    description: "CPU player 1 can both pon and chi, so CPU pon priority should block chi.",
    phase: "draw",
    currentPlayerIndex: 0,
    hands: {
      1: "p5 p5 p3 p4 m2 m3 m4 s2 s3 s4 p7 p8 m6"
    },
    discards: {
      0: "p5"
    },
    lastDiscard: {
      playerId: 0,
      tile: "p5"
    }
  }
};

export function listScenarios() {
  return Object.values(SCENARIOS).map((scenario) => ({
    name: scenario.name,
    description: scenario.description
  }));
}

export function createScenarioState(name, options = {}) {
  const scenario = getScenario(name);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}`);
  }

  const pool = createTilePool();
  const players = createPlayers();

  for (const player of players) {
    const handPattern = scenario.hands[player.id];
    const discardPattern = scenario.discards[player.id];

    player.hand = handPattern ? takePattern(pool, handPattern) : [];
    player.discards = discardPattern ? takePattern(pool, discardPattern) : [];
  }

  for (const player of players) {
    if (!scenario.hands[player.id]) {
      player.hand = takeNextTiles(pool, getTargetHandSize(scenario, player.id));
    }

    if (Array.isArray(scenario.riichi) && scenario.riichi.includes(player.id)) {
      player.isRiichi = true;
      player.riichi = true;
      player.riichiDeclaredAt = {
        roundId: `scenario-${scenario.name}`,
        turnCount: 0
      };
    }

    if (scenario.melds?.[player.id]) {
      player.melds = scenario.melds[player.id].map((meld, index) => {
        const tiles = takePattern(pool, meld.tiles);
        const calledTile = tiles.find((tile) => getTileToken(tile) === meld.calledTile) || tiles[tiles.length - 1];

        return {
          id: `scenario-${scenario.name}-meld-${player.id}-${index}`,
          type: meld.type,
          tiles,
          calledTile,
          fromPlayerId: meld.fromPlayerId
        };
      });
      player.isClosed = false;
      player.menzen = false;
    }
  }

  const deadWall = takeNextTiles(pool, 14);
  const wall = takeNextTiles(pool, pool.length);
  const currentPlayerIndex = options.currentPlayerIndex ?? scenario.currentPlayerIndex;
  const phase = options.phase ?? scenario.phase;
  const lastDiscard = createLastDiscard(scenario, players);
  const lastDraw = createLastDraw(players, currentPlayerIndex);

  return {
    ...createInitialGameState(),
    round: {
      id: `scenario-${scenario.name}`,
      phase,
      roundWind: "east",
      handNumber: 1,
      honba: 0,
      riichiSticks: 0,
      dealerIndex: 0,
      currentPlayerIndex,
      wall,
      deadWall,
      doraIndicators: deadWall.length > 0 ? [deadWall[0]] : [],
      lastDraw,
      lastDiscard,
      turnCount: 0,
      endReason: null,
      winningResult: null,
      players
    }
  };
}

function getScenario(name) {
  const canonicalName = SCENARIO_ALIASES[name] || name;
  return SCENARIOS[canonicalName] || null;
}

function createTilePool() {
  return createTiles().map((tile) => ({ ...tile }));
}

function getTargetHandSize(scenario, playerId) {
  return scenario.currentPlayerIndex === playerId && scenario.phase === "discard" ? 14 : 13;
}

function takePattern(pool, pattern) {
  return pattern
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => takeTile(pool, token));
}

function takeTile(pool, token) {
  const suit = token[0];
  const rank = Number(token.slice(1));
  const index = pool.findIndex((tile) => tile.suit === suit && tile.rank === rank);

  if (index < 0) {
    throw new Error(`Scenario tile is unavailable: ${token}`);
  }

  const [tile] = pool.splice(index, 1);
  return tile;
}

function takeNextTiles(pool, count) {
  if (count > pool.length) {
    throw new Error("Scenario does not have enough tiles");
  }

  return pool.splice(0, count);
}

function createLastDiscard(scenario, players) {
  if (!scenario.lastDiscard) {
    return {
      playerId: null,
      tile: null
    };
  }

  const player = players.find((candidate) => candidate.id === scenario.lastDiscard.playerId);
  const tile = player?.discards.find((candidate) => getTileToken(candidate) === scenario.lastDiscard.tile) || null;

  return {
    playerId: scenario.lastDiscard.playerId,
    tile
  };
}

function createLastDraw(players, currentPlayerIndex) {
  const player = players[currentPlayerIndex];

  return {
    playerId: player?.id ?? null,
    tile: player?.hand[player.hand.length - 1] ?? null
  };
}

function getTileToken(tile) {
  return `${tile.suit}${tile.rank}`;
}
