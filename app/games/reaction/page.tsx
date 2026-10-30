'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet';

type Phase = 'idle' | 'wait' | 'go' | 'done';
const COLORS: Record<Phase, string> = { idle: '#c4d96a', wait: '#ff7eb6', go: '#9bbc0f', done: '#c4d96a' };

export default function Reaction() {
  const { finishGame, beep } = useWallet();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState('Click to start');
  const [round, setRound] = useState(0);
  const [tickets, setTickets] = useState<number | null>(null);
  const times = useRef<number[]>([]);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function click() {
    if (phase === 'idle') {
      setPhase('wait');
      setMsg('Wait...');
      timer.current = setTimeout(() => {
        setPhase('go'); setMsg('CLICK!'); t0.current = performance.now(); beep(880, 0.08);
      }, 1000 + Math.random() * 2000);
    } else if (phase === 'wait') {
      clearTimeout(timer.current);
      setPhase('idle'); setMsg('Too early! Click to retry');
    } else if (phase === 'go') {
      const ms = Math.round(performance.now() - t0.current);
      times.current.push(ms);
      const r = round + 1;
      setRound(r);
      if (r >= 5) {
        const avg = Math.round(times.current.reduce((a, b) => a + b) / 5);
        const t = Math.max(1, Math.min(20, Math.round((600 - avg) / 20)));
        setPhase('done'); setMsg(`Average ${avg} ms`); setTickets(t);
        finishGame('reaction', Math.max(0, 1000 - avg), t);
      } else {
        setPhase('idle'); setMsg(`${ms} ms - click for next`);
      }
    }
  }

  return (
    <>
      <h2>⚡ Reaction Test</h2>
      <p>Round {Math.min(round + 1, 5)} / 5. Click when it turns green.</p>
      <div className="react" style={{ background: COLORS[phase] }} onClick={click}>{msg}</div>
      {tickets !== null && <h3>{tickets} tickets!</h3>}
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
