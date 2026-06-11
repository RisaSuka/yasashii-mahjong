export function chooseRandomDiscard(player, random = Math.random) {
  if (!player.hand.length) {
    return null;
  }

  const index = Math.floor(random() * player.hand.length);
  return player.hand[index];
}
