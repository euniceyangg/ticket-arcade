import Link from 'next/link';
import { GAMES } from '@/lib/games';

// The arcade floor: a welcome banner, then one card per game from lib/games.ts.
export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="sticker" style={{ right: 28, top: 18, transform: 'rotate(10deg)' }}>🎟️</span>
        <span className="sticker" style={{ right: 100, bottom: 14, transform: 'rotate(-12deg)' }}>🍓</span>
        <span className="sticker" style={{ right: 190, top: 30, transform: 'rotate(6deg)', fontSize: 34 }}>🌼</span>
        <h2>Welcome to the Ticket Arcade</h2>
        <p>Play little games, win tickets, and trade them for prizes at the counter.</p>
        <div className="hero-actions">
          <a className="btn primary" href="#games">Start playing</a>
          <Link className="btn" href="/prizes">Prize shop</Link>
        </div>
      </section>

      <div className="section-title" id="games">
        <h2 style={{ margin: 0 }}>Games</h2>
        <span className="muted">{GAMES.filter((g) => !g.soon).length} to play</span>
      </div>
      <div className="grid">
        {GAMES.map((g) => (
          <div className={`card game-card${g.soon ? ' soon' : ''}`} key={g.id}>
            <div className="tile">{g.emoji}</div>
            <h3>{g.name}</h3>
            <p>{g.blurb}</p>
            <div className="foot">
              <span className="chip">{g.soon ? 'coming soon' : `by ${g.author}`}</span>
              {g.soon ? null : <Link className="btn primary" href={`/games/${g.id}`}>Play</Link>}
            </div>
          </div>
        ))}
      </div>

      <div className="steps">
        <div className="step"><b>1. Play</b>Pick any game on the floor.</div>
        <div className="step"><b>2. Win tickets</b>Better runs earn more tickets.</div>
        <div className="step"><b>3. Get prizes</b>Spend them at the prize shop.</div>
      </div>
    </>
  );
}
