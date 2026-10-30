'use client';
import { GAMES } from '@/lib/games';
import { useWallet } from '@/lib/wallet';

export default function Leaderboard() {
  const { scores } = useWallet();
  return (
    <>
      <h2>Leaderboard</h2>
      <p className="muted">Top 5 per game on this device.</p>
      {GAMES.filter((g) => !g.soon).map((g) => {
        const rows = scores[g.id] ?? [];
        return (
          <div key={g.id}>
            <h3>{g.emoji} {g.name}</h3>
            {rows.length ? (
              <table><tbody>
                {rows.map((r, i) => <tr key={i}><td>{i + 1}</td><td>{r.name}</td><td>{r.score}</td></tr>)}
              </tbody></table>
            ) : <p className="muted">No scores yet.</p>}
          </div>
        );
      })}
    </>
  );
}
