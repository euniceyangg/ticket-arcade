import { GAMES } from './games';
import { PRIZES } from './prizes';
import type { ArcadeState } from './wallet';

export const ACHIEVEMENTS = [
  { id: 'first', name: 'First prize', emoji: '🎁', test: (s: ArcadeState) => Object.keys(s.owned).length > 0 },
  { id: 'every', name: 'Played every game', emoji: '🕹️', test: (s: ArcadeState) => GAMES.filter((g) => !g.soon).every((g) => s.played[g.id]) },
  { id: 'rich', name: '100 tickets earned', emoji: '💰', test: (s: ArcadeState) => s.earned >= 100 },
  { id: 'rare', name: 'Rare find', emoji: '💎', test: (s: ArcadeState) => PRIZES.some((p) => p.stock !== null && s.owned[p.id]) },
];
