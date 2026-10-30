'use client';
import { PRIZES } from '@/lib/prizes';
import { useWallet } from '@/lib/wallet';

export default function Shelf() {
  const { owned } = useWallet();
  const items = PRIZES.filter((p) => owned[p.id]);
  return (
    <>
      <h2>Prize Shelf</h2>
      {items.length === 0 ? (
        <p className="muted">Nothing yet. Win some tickets and visit the Prize Shop!</p>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <div className="card" key={p.id}>
              <div className="big">{p.emoji}</div>
              <b>{p.name}</b>
              <p className="muted">× {owned[p.id]}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
