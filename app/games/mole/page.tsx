'use client';
// Garden Patrol: a Stardew-style whack-a-mole. Gophers and crows pop out of your tilled
// plots to steal crops. Whack them! But be gentle with the crop fairies 🧚.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet';

const DAY_SECONDS = 30; // one in-game day, 6:00 am to 6:00 pm
const START_CROPS = 5;
const TICK = 0.1;

type Kind = 'gopher' | 'crow' | 'golden' | 'fairy';
type Critter = { kind: Kind; ttl: number; id: number };
type Fx = { text: string; id: number; ttl: number };
type Status = 'ready' | 'playing' | 'done';

const FACE: Record<Kind, string> = { gopher: '🐹', crow: '🐦‍⬛', golden: '🐹', fairy: '🧚' };
const POINTS: Record<Kind, number> = { gopher: 10, crow: 15, golden: 40, fairy: -20 };
const CROPS = ['🥕', '🍓', '🌽', '🎃', '🥔'];

function newGame() {
  return {
    plots: Array<Critter | null>(9).fill(null),
    fx: Array<Fx | null>(9).fill(null),
    elapsed: 0,
    spawnIn: 0.8,
    score: 0,
    combo: 0,
    crops: START_CROPS,
    status: 'ready' as Status,
    ending: '',
    finished: false,
    nextId: 1,
  };
}

function clock(elapsed: number) {
  const minutes = 6 * 60 + Math.floor((elapsed / DAY_SECONDS) * 12 * 60);
  const h24 = Math.floor(minutes / 60);
  const m = Math.floor((minutes % 60) / 10) * 10;
  const h = h24 > 12 ? h24 - 12 : h24;
  return `${h}:${String(m).padStart(2, '0')} ${h24 >= 12 ? 'pm' : 'am'}`;
}

export default function Garden() {
  const { finishGame, beep } = useWallet();
  const G = useRef(newGame());
  const finishRef = useRef(finishGame);
  const beepRef = useRef(beep);
  finishRef.current = finishGame;
  beepRef.current = beep;
  const [, render] = useState(0);
  const [tickets, setTickets] = useState(0);

  const start = useCallback(() => {
    if (G.current.status === 'playing') return; // double-click guard
    G.current = newGame();
    G.current.status = 'playing';
    setTickets(0);
    render((n) => n + 1);
  }, []);

  const whack = useCallback((i: number) => {
    const g = G.current;
    if (g.status !== 'playing') return;
    const c = g.plots[i];
    if (!c) return;
    g.plots[i] = null;
    if (c.kind === 'fairy') {
      g.score = Math.max(0, g.score + POINTS.fairy);
      g.combo = 0;
      g.fx[i] = { text: '💔 −20', id: g.nextId++, ttl: 0.9 };
      beepRef.current(140, 0.2);
    } else {
      g.combo += 1;
      const mult = 1 + Math.min(g.combo, 10) * 0.1; // up to ×2 for a long streak
      const pts = Math.round(POINTS[c.kind] * mult);
      g.score += pts;
      g.fx[i] = { text: `${c.kind === 'golden' ? '✨ ' : ''}+${pts}`, id: g.nextId++, ttl: 0.8 };
      beepRef.current(c.kind === 'golden' ? 990 : 520 + g.combo * 25, 0.07);
    }
    render((n) => n + 1);
  }, []);

  // Keys 1-9 mirror the numpad layout: 7 8 9 / 4 5 6 / 1 2 3.
  useEffect(() => {
    const map: Record<string, number> = { '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8 };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key in map) whack(map[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [whack]);

  // One timer drives the whole day. It stops the moment the day ends or you leave the page.
  const playing = G.current.status === 'playing';
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const g = G.current;
      if (g.status !== 'playing') return;
      g.elapsed += TICK;
      const day = g.elapsed / DAY_SECONDS;

      g.plots.forEach((c, i) => {
        if (!c) return;
        c.ttl -= TICK;
        if (c.ttl <= 0) {
          g.plots[i] = null;
          if (c.kind !== 'fairy') {
            g.crops -= 1; // it got away with a crop
            g.combo = 0;
            g.fx[i] = { text: '🥺 −1 crop', id: g.nextId++, ttl: 0.9 };
            beepRef.current(180, 0.15);
          }
        }
      });
      g.fx.forEach((f, i) => { if (f && (f.ttl -= TICK) <= 0) g.fx[i] = null; });

      g.spawnIn -= TICK;
      if (g.spawnIn <= 0) {
        const empty = g.plots.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
        if (empty.length) {
          const spot = empty[Math.floor(Math.random() * empty.length)];
          const r = Math.random();
          const kind: Kind = r < 0.1 ? 'fairy' : r < 0.18 ? 'golden' : r < 0.4 ? 'crow' : 'gopher';
          const up = Math.max(0.75, 1.5 - day * 0.7) * (kind === 'crow' ? 0.7 : kind === 'golden' ? 0.8 : 1);
          g.plots[spot] = { kind, ttl: up, id: g.nextId++ };
        }
        g.spawnIn = Math.max(0.4, 0.95 - day * 0.5) * (0.7 + Math.random() * 0.6);
      }

      if (g.crops <= 0 || g.elapsed >= DAY_SECONDS) {
        const survived = g.crops > 0;
        g.status = 'done';
        g.ending = survived ? 'The day is done! 🌇' : 'The critters ate every crop! 🥺';
        g.plots.fill(null);
        if (!g.finished) {
          g.finished = true; // tickets are only ever awarded once per day
          const t = Math.min(20, Math.floor(g.score / 15) + (survived ? g.crops : 0));
          setTickets(t);
          finishRef.current('mole', g.score, t);
        }
      }
      render((n) => n + 1);
    }, TICK * 1000);
    return () => clearInterval(id);
  }, [playing]);

  const g = G.current;
  return (
    <>
      <h2>🌾 Garden Patrol</h2>
      <div className="farm">
        <div className="farm-hud">
          <span>☀️ Spring 12 · {clock(g.elapsed)}</span>
          <span>⭐ {g.score}</span>
          <span>{g.combo >= 3 ? `🔥 x${g.combo}` : ' '}</span>
        </div>
        <div className="farm-hud" aria-label="Crops left">
          {Array.from({ length: START_CROPS }, (_, i) => (
            <span key={i} style={{ opacity: i < g.crops ? 1 : 0.2 }}>{CROPS[i]}</span>
          ))}
        </div>
        <div className="farm-grid">
          {g.plots.map((c, i) => (
            <button
              key={i}
              className={`plot${c?.kind === 'golden' ? ' golden' : ''}`}
              aria-label={`Plot ${i + 1}`}
              onPointerDown={() => whack(i)}
            >
              <span className="dirt" />
              {c && <span key={c.id} className="critter">{FACE[c.kind]}</span>}
              {g.fx[i] && <span key={g.fx[i]!.id} className="fx">{g.fx[i]!.text}</span>}
            </button>
          ))}
        </div>
        {g.status !== 'playing' && (
          <div className="farm-overlay">
            <div>
              {g.status === 'ready' ? (
                <>
                  <h3>Protect your crops!</h3>
                  <p>Whack gophers 🐹 and crows 🐦‍⬛. Golden ones are worth lots!<br />Be gentle with crop fairies 🧚.</p>
                </>
              ) : (
                <>
                  <h3>{g.ending}</h3>
                  <p>{g.score} points → {tickets} tickets</p>
                </>
              )}
              <button className="primary" onClick={start}>{g.status === 'ready' ? 'Start the day' : 'Play again'}</button>
            </div>
          </div>
        )}
      </div>
      <p className="muted">Tap the critters, or use the number keys (like a numpad).</p>
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
