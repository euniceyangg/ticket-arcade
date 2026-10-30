// The shared game list. The home page and leaderboard read from here.
// To add a game: add one line below, then create app/games/<id>/page.tsx.
// Games without their own page show "Coming soon" (see app/games/[id]/page.tsx).
export type Game = { id: string; name: string; emoji: string; blurb: string; author: string };

export const GAMES: Game[] = [
  { id: 'mole', name: 'Garden Patrol', emoji: '🌾', blurb: 'Whack the crop thieves. Be gentle with fairies!', author: 'Starter game' },
  { id: 'reaction', name: 'Fishing Spot', emoji: '🎣', blurb: 'Reel in the moment you see the bite.', author: 'Starter game' },
  { id: 'pacman', name: 'Farm Pac-Man', emoji: '🧑‍🌾', blurb: 'Gather the daisies, dodge the jellies.', author: 'Eunice' },
  { id: 'space-invaders', name: 'Space Invaders', emoji: '👾', blurb: 'Shoot every wave before it lands.', author: '<teammate>' },
  { id: 'breakout', name: 'Breakout', emoji: '🧱', blurb: 'Smash the wall of bricks.', author: '<teammate>' },
];
