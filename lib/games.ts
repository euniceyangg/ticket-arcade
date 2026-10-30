// The shared game list. The home page and leaderboard read from here.
// To add a game: add one line below, then create app/games/<id>/page.tsx.
// Games without their own page show "Coming soon" (see app/games/[id]/page.tsx).
export type Game = { id: string; name: string; emoji: string; blurb: string; author: string };

export const GAMES: Game[] = [
  { id: 'mole', name: 'Whack-a-Mole', emoji: '🔨', blurb: '20 seconds. 1 ticket per 2 moles.', author: 'Starter game' },
  { id: 'reaction', name: 'Reaction Test', emoji: '⚡', blurb: '5 rounds. Faster = more tickets.', author: 'Starter game' },
  { id: 'pacman', name: 'Pac-Man', emoji: '👻', blurb: 'Eat the dots, dodge the ghosts.', author: '<teammate>' },
  { id: 'space-invaders', name: 'Space Invaders', emoji: '👾', blurb: 'Shoot every wave before it lands.', author: '<teammate>' },
  { id: 'breakout', name: 'Breakout', emoji: '🧱', blurb: 'Smash the wall of bricks.', author: '<teammate>' },
];
