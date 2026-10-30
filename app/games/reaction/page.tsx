'use client';
// Fishing Spot: a Stardew-style reaction test. Cast your line, wait for the bite (!),
// then reel in as fast as you can. Reel too early and the fish gets spooked.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet';

type Phase = 'idle' | 'wait' | 'bite' | 'result' | 'done';
const CASTS = 5;
const ESCAPE_MS = 900; // if you're slower than this, the fish gets away

function catchFor(ms: number) {
  if (ms >= ESCAPE_MS) return { fish: '💨', label: 'It got away!' };
  if (ms < 300) return { fish: '🐟', label: 'Perfect catch!' };
  if (ms < 450) return { fish: '🐠', label: 'Nice catch!' };
  if (ms < 650) return { fish: '🦀', label: 'A crab!' };
  return { fish: '🥾', label: 'An old boot...' };
}

export default function Fishing() {
  const { finishGame, beep } = useWallet();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState('Click to cast your line 🎣');
  const [caught, setCaught] = useState<string[]>([]);
  const [tickets, setTickets] = useState<number | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const times = useRef<number[]>([]);
  const t0 = useRef(0);
  const biteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const escapeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const finishRef = useRef(finishGame);
  const beepRef = useRef(beep);
  finishRef.current = finishGame;
  beepRef.current = beep;

  const go = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const clearTimers = () => { clearTimeout(biteTimer.current); clearTimeout(escapeTimer.current); };
  useEffect(() => clearTimers, []); // nothing keeps running after you leave the page

  const land = useCallback((ms: number) => {
    clearTimers();
    const c = catchFor(ms);
    times.current.push(ms);
    setCaught((list) => [...list, c.fish]);
    if (times.current.length >= CASTS) {
      const avg = Math.round(times.current.reduce((a, b) => a + b, 0) / CASTS);
      const t = Math.max(1, Math.min(20, Math.round((600 - avg) / 20)));
      setMsg(`${c.label} · average ${avg} ms`);
      setTickets(t);
      go('done');
      finishRef.current('reaction', Math.max(0, 1000 - avg), t); // once, when the 5th cast lands
    } else {
      setMsg(ms >= ESCAPE_MS ? c.label : `${c.label} ${ms} ms`);
      go('result');
    }
  }, []);

  const press = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'idle' || p === 'result') {
      go('wait');
      setMsg('Waiting for a bite...');
      biteTimer.current = setTimeout(() => {
        t0.current = performance.now();
        go('bite');
        setMsg('!');
        beepRef.current(880, 0.1);
        escapeTimer.current = setTimeout(() => land(ESCAPE_MS), ESCAPE_MS);
      }, 1200 + Math.random() * 2300);
    } else if (p === 'wait') {
      clearTimers(); // reeled in too early: that cast doesn't count
      go('idle');
      setMsg('Too early! The fish got spooked. Cast again 🎣');
      beepRef.current(150, 0.2);
    } else if (p === 'bite') {
      land(Math.round(performance.now() - t0.current));
    }
  }, [land]);

  // Space / Enter also work, handy without a mouse. Ignore real shortcuts like Cmd+S.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.key !== ' ' && e.key !== 'Enter')) return;
      e.preventDefault();
      if (!e.repeat) press();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const again = () => {
    times.current = [];
    setCaught([]);
    setTickets(null);
    go('idle');
    setMsg('Click to cast your line 🎣');
  };

  const cast = Math.min(times.current.length + 1, CASTS);
  return (
    <>
      <h2>🎣 Fishing Spot</h2>
      <p>Cast {cast} of {CASTS}. Reel in the moment you see the <b>!</b></p>
      <button
        className={`pond ${phase}`}
        onPointerDown={phase === 'done' ? undefined : press}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
        aria-label="Fishing pond"
      >
        <span className="ripple" />
        <span className="bobber">{phase === 'bite' ? '❗' : '🎣'}</span>
        <span className="pond-msg">{msg}</span>
      </button>
      <p className="catches" aria-label="Your catches">{caught.join(' ') || ' '}</p>
      {tickets !== null && (
        <>
          <h3>{tickets} tickets!</h3>
          <p><button className="primary" onClick={again}>Fish again</button></p>
        </>
      )}
      <p className="muted">Click, tap, or press Space.</p>
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
