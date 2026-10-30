'use client';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useWallet } from '@/lib/wallet';

export default function Badges() {
  const { badges } = useWallet();
  return (
    <>
      <h2>Achievements</h2>
      <div className="grid">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={`card badge ${badges[a.id] ? 'got' : ''}`}>
            <div className="big">{a.emoji}</div>
            <b>{a.name}</b>
          </div>
        ))}
      </div>
    </>
  );
}
