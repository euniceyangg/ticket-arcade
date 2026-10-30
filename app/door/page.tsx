'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet';

export default function Door() {
  const { name, setName, canClaimBonus, claimBonus, ready } = useWallet();
  const [draft, setDraft] = useState<string | null>(null);
  const router = useRouter();
  const value = draft ?? name;
  if (!ready) return null;
  return (
    <>
      <h2>Welcome to the arcade!</h2>
      <p className="muted">Tell us your name, play games to win tickets, then spend them at the prize counter.</p>
      <p>
        <input type="text" maxLength={16} placeholder="Your name" value={value} onChange={(e) => setDraft(e.target.value)} />{' '}
        <button className="primary" onClick={() => { setName(value); router.push('/'); }}>Enter</button>
      </p>
      <div className="card" style={{ maxWidth: 320 }}>
        <div className="big">🎁</div>
        <b>Daily bonus</b>
        <p className="muted">{canClaimBonus ? 'Free 15 tickets today!' : 'Come back tomorrow.'}</p>
        <button className="primary" disabled={!canClaimBonus} onClick={claimBonus}>Claim 15 tickets</button>
      </div>
    </>
  );
}
