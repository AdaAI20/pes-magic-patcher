// Add this helper to display player names properly
function displayPlayerName(player: any): string {
  if (player.name && player.name.length > 0) {
    return player.name;
  }
  if (player.shirtName && player.shirtName.length > 0) {
    return player.shirtName;
  }
  return `Player ${player.id || 'Unknown'}`;
}
