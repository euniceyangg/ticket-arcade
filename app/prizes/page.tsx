'use client';
import { PRIZES } from '@/lib/prizes';
import { useWallet } from '@/lib/wallet';

export default function PrizeShop() {
  const { tickets, stock, buyPrize } = useWallet();
  return (
    <>
      <h2>Prize Shop</h2>
      <div className="grid">
        {PRIZES.map((p) => {
          const left = p.stock === null ? null : stock[p.id] ?? 0;
          const soldOut = left === 0;
          return (
            <div className="card" key={p.id}>
              <div className="big">{p.emoji}</div>
              <b>{p.name}</b>
              <p>🎟️ {p.cost}</p>
              <p className="muted">{left === null ? ' ' : soldOut ? <span className="tag">Sold out</span> : `${left} left`}</p>
              <button className="primary" disabled={soldOut || tickets < p.cost} onClick={() => buyPrize(p.id)}>
                {soldOut ? 'Sold out' : 'Buy'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
