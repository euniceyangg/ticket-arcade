import Link from 'next/link';
import { GAMES } from '@/lib/games';

// Fallback for games that don't have their own page yet.
// A real game lives at app/games/<id>/page.tsx, which takes priority over this.
export default async function ComingSoon({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  return (
    <>
      <h2>{game ? `${game.emoji} ${game.name}` : 'Unknown game'}</h2>
      <p>{game ? 'Coming soon!' : "We couldn't find that game."}</p>
      <Link href="/">&larr; Back to the arcade floor</Link>
    </>
  );
}
