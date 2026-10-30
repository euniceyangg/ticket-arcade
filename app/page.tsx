import Link from 'next/link';
import { GAMES } from '@/lib/games';

// The arcade floor: one card per game, read from lib/games.ts.
export default function Home() {
  return (
    <>
      <h2>Arcade floor</h2>
      <div className="grid">
        {GAMES.map((g) => (
          <div className="card" key={g.id}>
            <div className="big">{g.emoji}</div>
            <b>{g.name}</b>
            <p className="muted">{g.blurb}</p>
            <p className="muted">by {g.author}</p>
            <Link className="btn primary" href={`/games/${g.id}`}>Play</Link>
          </div>
        ))}
      </div>
    </>
  );
}
