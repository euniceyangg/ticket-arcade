'use client';
import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet';

// Tickets spill down the screen whenever tickets are won; plus the toast.
export default function Overlays() {
  const { rainKey, rainCount, toast } = useWallet();
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!rainKey) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 2600);
    return () => clearTimeout(t);
  }, [rainKey]);
  return (
    <>
      {on && (
        <div className="rain" key={rainKey}>
          {Array.from({ length: Math.min(rainCount, 40) }, (_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.1}s` }}>🎟️</span>
          ))}
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
