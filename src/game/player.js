const WINDS = ["east", "south", "west", "north"];

export function createPlayers() {
  return [
    createPlayer(0, "あなた", "human"),
    createPlayer(1, "CPU 1", "cpu"),
    createPlayer(2, "CPU 2", "cpu"),
    createPlayer(3, "CPU 3", "cpu")
  ];
}

export function createPlayer(id, name, type) {
  return {
    id,
    name,
    type,
    wind: WINDS[id],
    score: 25000,
    hand: [],
    discards: [],
    melds: [],
    riichi: false
  };
}
