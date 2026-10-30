'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet';

export default function Mole() {
  const { finishGame, beep } = useWallet();
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(20);
  const [active, setActive] = useState(-1);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const pop = setInterval(() => setActive(Math.floor(Math.random() * 9)), 700);
    const tick = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { clearInterval(pop); clearInterval(tick); };
  }, []);

  useEffect(() => {
    if (left === 0 && !over) {
      setOver(true);
      setActive(-1);
      finishGame('mole', scoreRef.current, Math.floor(scoreRef.current / 2));
    }
  }, [left, over, finishGame]);

  function hit(i: number) {
    if (over || i !== active) return;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setActive(-1);
    beep(660, 0.06);
  }

  return (
    <>
      <h2>🔨 Whack-a-Mole</h2>
      <p>Score: <b>{score}</b> · Time: <b>{Math.max(left, 0)}</b></p>
      <div className="moles">
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} className="hole" onClick={() => hit(i)}>{active === i ? '🐹' : ''}</button>
        ))}
      </div>
      {over && <h3>Time! {score} moles → {Math.floor(score / 2)} tickets</h3>}
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
