export function buildWall(tiles, random = Math.random) {
  const shuffledTiles = shuffleTiles(tiles, random);
  const deadWall = shuffledTiles.slice(0, 14);
  const wall = shuffledTiles.slice(14);

  return {
    wall,
    deadWall,
    doraIndicators: deadWall.length > 0 ? [deadWall[0]] : []
  };
}

export function drawFromWall(round) {
  if (!round.wall.length) {
    return {
      round: {
        ...round,
        phase: "ended",
        endReason: "exhaustive-draw"
      },
      tile: null
    };
  }

  const [tile, ...wall] = round.wall;

  return {
    round: {
      ...round,
      wall
    },
    tile
  };
}

export function shuffleTiles(tiles, random = Math.random) {
  const shuffled = tiles.map((tile) => ({ ...tile }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}
