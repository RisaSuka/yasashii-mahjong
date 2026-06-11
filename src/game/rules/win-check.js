const SUITED_SUITS = new Set(["m", "p", "s"]);
const VALID_SUITS = new Set(["m", "p", "s", "z"]);
const THIRTEEN_ORPHANS_KEYS = [
  "m1",
  "m9",
  "p1",
  "p9",
  "s1",
  "s9",
  "z1",
  "z2",
  "z3",
  "z4",
  "z5",
  "z6",
  "z7"
];

export function validateHandTiles(tiles) {
  if (!Array.isArray(tiles) || tiles.length !== 14) {
    return {
      valid: false,
      reason: "not-14-tiles"
    };
  }

  const counts = new Map();

  for (const tile of tiles) {
    if (!isValidTile(tile)) {
      return {
        valid: false,
        reason: "invalid-tile"
      };
    }

    const key = getTileKey(tile);
    const count = (counts.get(key) || 0) + 1;

    if (count > 4) {
      return {
        valid: false,
        reason: "too-many-copies"
      };
    }

    counts.set(key, count);
  }

  return {
    valid: true,
    reason: null
  };
}

export function isWinningHand(tiles) {
  const validation = validateHandTiles(tiles);

  if (!validation.valid) {
    return {
      winning: false,
      type: null,
      reason: validation.reason
    };
  }

  const counts = createTileCounts(tiles);

  if (isThirteenOrphansFromCounts(counts)) {
    return winningResult("thirteen-orphans");
  }

  if (isSevenPairsFromCounts(counts)) {
    return winningResult("seven-pairs");
  }

  if (isStandardFromCounts(counts)) {
    return winningResult("standard");
  }

  return {
    winning: false,
    type: null,
    reason: "no-winning-shape"
  };
}

export function createTileCounts(tiles) {
  const counts = new Map();

  for (const tile of tiles) {
    const key = getTileKey(tile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

export function isStandardWinningHand(tiles) {
  const validation = validateHandTiles(tiles);
  return validation.valid && isStandardFromCounts(createTileCounts(tiles));
}

export function isSevenPairs(tiles) {
  const validation = validateHandTiles(tiles);
  return validation.valid && isSevenPairsFromCounts(createTileCounts(tiles));
}

export function isThirteenOrphans(tiles) {
  const validation = validateHandTiles(tiles);
  return validation.valid && isThirteenOrphansFromCounts(createTileCounts(tiles));
}

function winningResult(type) {
  return {
    winning: true,
    type,
    reason: null
  };
}

function isValidTile(tile) {
  if (!tile || !VALID_SUITS.has(tile.suit) || !Number.isInteger(tile.rank)) {
    return false;
  }

  if (tile.suit === "z") {
    return tile.rank >= 1 && tile.rank <= 7;
  }

  return tile.rank >= 1 && tile.rank <= 9;
}

function getTileKey(tile) {
  return `${tile.suit}${tile.rank}`;
}

function isSevenPairsFromCounts(counts) {
  if (counts.size !== 7) {
    return false;
  }

  return [...counts.values()].every((count) => count === 2);
}

function isThirteenOrphansFromCounts(counts) {
  if (counts.size !== 13) {
    return false;
  }

  let pairCount = 0;

  for (const key of THIRTEEN_ORPHANS_KEYS) {
    const count = counts.get(key) || 0;

    if (count === 2) {
      pairCount += 1;
    } else if (count !== 1) {
      return false;
    }
  }

  return pairCount === 1;
}

function isStandardFromCounts(counts) {
  for (const [key, count] of counts) {
    if (count < 2) {
      continue;
    }

    const remaining = cloneCounts(counts);
    decrementCount(remaining, key, 2);

    if (canMakeMelds(remaining)) {
      return true;
    }
  }

  return false;
}

function canMakeMelds(counts) {
  const key = getFirstRemainingKey(counts);

  if (!key) {
    return true;
  }

  if ((counts.get(key) || 0) >= 3) {
    const withoutTriplet = cloneCounts(counts);
    decrementCount(withoutTriplet, key, 3);

    if (canMakeMelds(withoutTriplet)) {
      return true;
    }
  }

  if (canStartSequence(key, counts)) {
    const withoutSequence = cloneCounts(counts);
    decrementCount(withoutSequence, key, 1);
    decrementCount(withoutSequence, getNextKey(key, 1), 1);
    decrementCount(withoutSequence, getNextKey(key, 2), 1);

    if (canMakeMelds(withoutSequence)) {
      return true;
    }
  }

  return false;
}

function canStartSequence(key, counts) {
  const { suit, rank } = parseKey(key);

  if (!SUITED_SUITS.has(suit) || rank > 7) {
    return false;
  }

  return (counts.get(getNextKey(key, 1)) || 0) > 0 && (counts.get(getNextKey(key, 2)) || 0) > 0;
}

function getFirstRemainingKey(counts) {
  return [...counts.keys()].sort(compareKeys).find((key) => (counts.get(key) || 0) > 0) || null;
}

function compareKeys(a, b) {
  const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
  const parsedA = parseKey(a);
  const parsedB = parseKey(b);
  const suitDiff = suitOrder[parsedA.suit] - suitOrder[parsedB.suit];

  if (suitDiff !== 0) {
    return suitDiff;
  }

  return parsedA.rank - parsedB.rank;
}

function parseKey(key) {
  return {
    suit: key[0],
    rank: Number(key.slice(1))
  };
}

function getNextKey(key, offset) {
  const { suit, rank } = parseKey(key);
  return `${suit}${rank + offset}`;
}

function cloneCounts(counts) {
  return new Map(counts);
}

function decrementCount(counts, key, amount) {
  const nextCount = (counts.get(key) || 0) - amount;

  if (nextCount > 0) {
    counts.set(key, nextCount);
  } else {
    counts.delete(key);
  }
}
