export type Prize = { id: string; name: string; emoji: string; cost: number; stock: number | null };

// stock: null = unlimited. Numbers are limited stock that sells out.
export const PRIZES: Prize[] = [
  { id: 'eraser', name: 'Star Eraser', emoji: '🌟', cost: 10, stock: null },
  { id: 'bouncy', name: 'Bouncy Ball', emoji: '🏀', cost: 25, stock: null },
  { id: 'yoyo', name: 'Glow Yo-Yo', emoji: '🪀', cost: 50, stock: null },
  { id: 'plush', name: 'Plush Bear', emoji: '🧸', cost: 120, stock: 5 },
  { id: 'robot', name: 'Mini Robot', emoji: '🤖', cost: 200, stock: 3 },
  { id: 'crown', name: 'Golden Crown', emoji: '👑', cost: 400, stock: 1 },
];
