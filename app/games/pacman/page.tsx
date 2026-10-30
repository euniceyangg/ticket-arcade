'use client';
// Farm Pac-Man, cozy Stardew-style: a little farmer gathers daisies, jelly slimes chase you,
// strawberries make the jellies shy. Tickets are awarded once, when the run ends.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet';

const MAP = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '#....#   G   #....#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '#.##.#.#####.#.##.#',
  '#........P........#',
  '#o##.###.#.###.##o#',
  '#........#........#',
  '###################',
];
const COLS = 19;
const ROWS = 15;
const T = 30; // tile size in canvas pixels
const POWER_SECONDS = 7;
const START_LIVES = 3;

type Dir = { x: number; y: number };
const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };
const ALL = [UP, DOWN, LEFT, RIGHT];
const NONE: Dir = { x: 0, y: 0 };
const same = (a: Dir, b: Dir) => a.x === b.x && a.y === b.y;
const opposite = (a: Dir, b: Dir) => a.x === -b.x && a.y === -b.y && (a.x !== 0 || a.y !== 0);

type Actor = { cx: number; cy: number; nx: number; ny: number; p: number; dir: Dir; speed: number };
type Slime = { a: Actor; color: string; chase: number; delay: number };
type Status = 'ready' | 'playing' | 'won' | 'lost';

const walkable = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS && MAP[y][x] !== '#';
const makeActor = (x: number, y: number, speed: number): Actor => ({ cx: x, cy: y, nx: x, ny: y, p: 0, dir: NONE, speed });
const pos = (a: Actor) => ({ x: a.cx + (a.nx - a.cx) * a.p, y: a.cy + (a.ny - a.cy) * a.p });

// Move an actor along the grid. `choose` picks a direction whenever it's sitting on a tile.
function advance(a: Actor, dt: number, choose: (a: Actor) => Dir | null, arrive?: (a: Actor) => void) {
  let move = a.speed * dt;
  while (move > 0) {
    if (a.nx === a.cx && a.ny === a.cy) {
      const d = choose(a);
      if (!d) return;
      a.dir = d;
      a.nx = a.cx + d.x;
      a.ny = a.cy + d.y;
      a.p = 0;
    }
    const need = 1 - a.p;
    if (move >= need) {
      move -= need;
      a.cx = a.nx;
      a.cy = a.ny;
      a.p = 0;
      arrive?.(a);
    } else {
      a.p += move;
      move = 0;
    }
  }
}

function find(ch: string) {
  for (let y = 0; y < ROWS; y++) { const x = MAP[y].indexOf(ch); if (x >= 0) return { x, y }; }
  return { x: 1, y: 1 };
}
const PAC_START = find('P');
const SLIME_START = find('G');
const SLIME_COLORS = ['#8ee6a8', '#8cc8ff', '#ffa6cf', '#ffc98a'];
const SLIME_CHASE = [0.85, 0.6, 0.4, 0.25];
const SLIME_X = [7, 9, 11, 9]; // where each slime starts and respawns

function newGame() {
  const grid = MAP.map((r) => [...r].map((c) => (c === '.' ? 1 : c === 'o' ? 2 : 0)));
  const dots = grid.flat().filter((v) => v > 0).length;
  const slimes: Slime[] = SLIME_COLORS.map((color, i) => ({
    a: makeActor(SLIME_X[i], SLIME_START.y, 4.4),
    color,
    chase: SLIME_CHASE[i],
    delay: 1 + i * 1.5,
  }));
  return {
    grid,
    dots,
    dotsLeft: dots,
    pac: makeActor(PAC_START.x, PAC_START.y, 5.6),
    want: NONE,
    slimes,
    score: 0,
    lives: START_LIVES,
    power: 0,
    freeze: 0,
    chain: 0,
    status: 'ready' as Status,
    finished: false,
  };
}

export default function Pacman() {
  const { finishGame, beep } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const G = useRef(newGame());
  const finishRef = useRef(finishGame);
  const beepRef = useRef(beep);
  finishRef.current = finishGame;
  beepRef.current = beep;
  const [hud, setHud] = useState({ score: 0, lives: START_LIVES, left: G.current.dotsLeft, status: 'ready' as Status, tickets: 0 });

  const start = useCallback(() => {
    if (G.current.status === 'playing') return; // double-click guard
    if (G.current.status !== 'ready') G.current = newGame();
    G.current.status = 'playing';
  }, []);

  const steer = useCallback((d: Dir) => {
    const g = G.current;
    if (g.status === 'ready') start();
    if (G.current.status !== 'playing') return;
    const p = G.current.pac;
    // Turning around mid-tile is allowed straight away.
    if (opposite(d, p.dir) && (p.nx !== p.cx || p.ny !== p.cy)) {
      [p.cx, p.nx] = [p.nx, p.cx];
      [p.cy, p.ny] = [p.ny, p.cy];
      p.p = 1 - p.p;
      p.dir = d;
    }
    G.current.want = d;
  }, [start]);

  // Keyboard controls (arrow keys + WASD).
  useEffect(() => {
    const keys: Record<string, Dir> = {
      ArrowUp: UP, ArrowDown: DOWN, ArrowLeft: LEFT, ArrowRight: RIGHT,
      w: UP, s: DOWN, a: LEFT, d: RIGHT, W: UP, S: DOWN, A: LEFT, D: RIGHT,
    };
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault(); // don't scroll the page
      steer(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steer]);

  // The game loop. Cleaned up on leaving the page so nothing keeps running.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    let shown = '';

    const finish = (won: boolean) => {
      const g = G.current;
      if (g.finished) return; // tickets are only ever awarded once per run
      g.finished = true;
      g.status = won ? 'won' : 'lost';
      const eaten = g.dots - g.dotsLeft;
      const tickets = won ? Math.min(20, 10 + 3 * g.lives) : Math.floor(eaten / 25);
      finishRef.current('pacman', g.score, tickets);
      setHud((h) => ({ ...h, tickets }));
    };

    const loseLife = () => {
      const g = G.current;
      g.lives -= 1;
      if (g.lives <= 0) { finish(false); return; }
      g.pac = makeActor(PAC_START.x, PAC_START.y, 5.6);
      g.want = NONE;
      g.power = 0;
      g.freeze = 1;
      g.slimes.forEach((s, i) => {
        s.a = makeActor(SLIME_X[i], SLIME_START.y, 4.4);
        s.delay = 1.5 + i;
      });
      beepRef.current(150, 0.3);
    };

    const update = (dt: number) => {
      const g = G.current;
      if (g.status !== 'playing') return;
      if (g.freeze > 0) { g.freeze -= dt; return; }
      g.power = Math.max(0, g.power - dt);
      if (g.power === 0) g.chain = 0;

      advance(
        g.pac,
        dt,
        (a) => {
          if (!same(g.want, NONE) && walkable(a.cx + g.want.x, a.cy + g.want.y)) return g.want;
          if (!same(a.dir, NONE) && walkable(a.cx + a.dir.x, a.cy + a.dir.y)) return a.dir;
          return null;
        },
        (a) => {
          const v = g.grid[a.cy][a.cx];
          if (v === 0) return;
          g.grid[a.cy][a.cx] = 0;
          g.dotsLeft -= 1;
          g.score += v === 2 ? 50 : 10;
          if (v === 2) { g.power = POWER_SECONDS; g.chain = 0; beepRef.current(880, 0.12); }
          else beepRef.current(330, 0.03);
        },
      );
      if (g.dotsLeft === 0) { finish(true); return; }

      for (const s of g.slimes) {
        if (s.delay > 0) { s.delay -= dt; continue; }
        s.a.speed = g.power > 0 ? 3.1 : 4.4;
        advance(s.a, dt, (a) => {
          let opts = ALL.filter((d) => walkable(a.cx + d.x, a.cy + d.y));
          const forward = opts.filter((d) => !opposite(d, a.dir));
          if (forward.length) opts = forward;
          if (!opts.length) return null;
          const scared = g.power > 0;
          if (!scared && Math.random() < s.chase) {
            const target = { x: Math.round(pos(g.pac).x), y: Math.round(pos(g.pac).y) };
            const dist = (d: Dir) => Math.abs(a.cx + d.x - target.x) + Math.abs(a.cy + d.y - target.y);
            return opts.reduce((best, d) => (dist(d) < dist(best) ? d : best));
          }
          return opts[Math.floor(Math.random() * opts.length)];
        });
      }

      // Slime / farmer collisions.
      const pp = pos(g.pac);
      for (const s of g.slimes) {
        if (s.delay > 0) continue;
        const sp = pos(s.a);
        if (Math.hypot(pp.x - sp.x, pp.y - sp.y) < 0.6) {
          if (g.power > 0) {
            g.chain += 1;
            g.score += 100 * 2 ** g.chain;
            s.a = makeActor(SLIME_X[g.slimes.indexOf(s)], SLIME_START.y, 4.4);
            s.delay = 2;
            beepRef.current(990, 0.15);
          } else {
            loseLife();
            break;
          }
        }
      }
    };

    // ---- drawing ----
    const rr = (x: number, y: number, w: number, h: number, r: number | number[]) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
    const ellipse = (x: number, y: number, rx: number, ry: number) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };

    const draw = () => {
      const g = G.current;
      const t = performance.now() / 1000;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const px = x * T;
          const py = y * T;
          const cx = px + T / 2;
          const cy = py + T / 2;
          ctx.fillStyle = (x + y) % 2 ? '#f9e8c4' : '#f5dfb4';
          ctx.fillRect(px, py, T, T);
          if (MAP[y][x] === '#') {
            // fluffy hedge with tiny flowers
            ctx.fillStyle = '#3f9a52'; rr(px + 1, py + 3, T - 2, T - 3, 10); ctx.fill();
            ctx.fillStyle = '#62c46e'; rr(px + 1, py + 1, T - 2, T - 5, 10); ctx.fill();
            ctx.fillStyle = '#9af0a6'; rr(px + 5, py + 4, 9, 5, 3); ctx.fill();
            if ((x * 5 + y * 7) % 4 === 0) { ctx.fillStyle = '#ffb3d1'; ellipse(px + 21, py + 16, 3, 3); ctx.fillStyle = '#fff'; ellipse(px + 21, py + 16, 1.2, 1.2); }
            if ((x * 3 + y * 11) % 5 === 0) { ctx.fillStyle = '#fff3a8'; ellipse(px + 9, py + 20, 2.2, 2.2); }
          } else {
            if ((x * 7 + y * 13) % 5 === 0) { ctx.fillStyle = '#ead29f'; ctx.fillRect(px + 6, py + 9, 3, 2); }
            const v = g.grid[y][x];
            if (v === 1) {
              // little daisy seed
              ctx.fillStyle = '#fff';
              ellipse(cx - 3, cy, 2.3, 2.3); ellipse(cx + 3, cy, 2.3, 2.3); ellipse(cx, cy - 3, 2.3, 2.3); ellipse(cx, cy + 3, 2.3, 2.3);
              ctx.fillStyle = '#ffcf4a'; ellipse(cx, cy, 2.2, 2.2);
            } else if (v === 2) {
              ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText('🍓', cx, cy + 1 + Math.sin(t * 4 + x) * 1.5);
            }
          }
        }
      }

      // Jelly slimes: round, shiny eyes, blushing cheeks
      for (const s of g.slimes) {
        const p = pos(s.a);
        const x = p.x * T + T / 2;
        const y = p.y * T + T / 2;
        const scared = g.power > 0;
        const blink = scared && g.power < 2 && Math.floor(t * 6) % 2 === 0;
        const body = scared ? (blink ? '#ffffff' : '#c9b8ff') : s.color;
        const bob = Math.sin(t * 6 + x) * 1.6;
        const w = 24 + bob;
        const h = 22 - bob;
        ctx.globalAlpha = s.delay > 0 ? 0.5 : 1;
        ctx.fillStyle = '#4a3560'; rr(x - w / 2 - 1.5, y - h / 2 - 1.5 + 2, w + 3, h + 3, [w / 2, w / 2, 7, 7]); ctx.fill();
        ctx.fillStyle = body; rr(x - w / 2, y - h / 2 + 2, w, h, [w / 2, w / 2, 6, 6]); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; rr(x - w / 2 + 4, y - h / 2 + 5, 6, 4, 2); ctx.fill();
        const lx = Math.sign(s.a.dir.x);
        ctx.fillStyle = '#2b1d3a'; ellipse(x - 5 + lx, y + 1, 2.6, 3.4); ellipse(x + 5 + lx, y + 1, 2.6, 3.4);
        ctx.fillStyle = '#fff'; ellipse(x - 5.8 + lx, y - 0.4, 1.1, 1.1); ellipse(x + 4.2 + lx, y - 0.4, 1.1, 1.1);
        ctx.fillStyle = 'rgba(255,110,160,.55)'; ellipse(x - 9, y + 6, 3, 2); ellipse(x + 9, y + 6, 3, 2);
        ctx.strokeStyle = '#2b1d3a'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (scared) ctx.arc(x, y + 8, 1.8, 0, Math.PI * 2);
        else ctx.arc(x, y + 5.5, 2.2, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Chibi farmer
      const pp = pos(g.pac);
      const x = pp.x * T + T / 2;
      const y = pp.y * T + T / 2;
      const flicker = g.freeze > 0 && Math.floor(t * 10) % 2 === 0;
      if (!flicker) {
        const moving = g.pac.nx !== g.pac.cx || g.pac.ny !== g.pac.cy;
        const open = moving ? Math.abs(Math.sin(t * 14)) * 0.65 : 0.25;
        const a0 = same(g.pac.dir, NONE) ? 0 : Math.atan2(g.pac.dir.y, g.pac.dir.x);
        ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = '#c98a1a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 12, a0 + open, a0 - open + Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2b1d3a'; ellipse(x + g.pac.dir.x * 1.5, y - 3 + g.pac.dir.y * 1.5, 2.2, 3);
        ctx.fillStyle = '#fff'; ellipse(x + g.pac.dir.x * 1.5 - 0.7, y - 4 + g.pac.dir.y * 1.5, 0.9, 0.9);
        ctx.fillStyle = 'rgba(255,110,160,.6)'; ellipse(x - 6, y + 4, 3, 2);
        // straw hat with a pink ribbon and a flower
        ctx.fillStyle = '#f2cf86'; ellipse(x, y - 9, 15, 4);
        ctx.fillStyle = '#f9e0a4'; rr(x - 7, y - 18, 14, 10, [6, 6, 2, 2]); ctx.fill();
        ctx.fillStyle = '#ff8fb8'; ctx.fillRect(x - 7, y - 11, 14, 3);
        ctx.fillStyle = '#fff'; ellipse(x + 5, y - 13, 2, 2); ctx.fillStyle = '#ffcf4a'; ellipse(x + 5, y - 13, 0.9, 0.9);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp so switching tabs doesn't teleport anyone
      last = now;
      update(dt);
      draw();
      const g = G.current;
      const sig = `${g.score}|${g.lives}|${g.dotsLeft}|${g.status}`;
      if (sig !== shown) {
        shown = sig;
        setHud((h) => ({ ...h, score: g.score, lives: g.lives, left: g.dotsLeft, status: g.status, tickets: g.status === 'playing' || g.status === 'ready' ? 0 : h.tickets }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const over = hud.status === 'won' || hud.status === 'lost';

  return (
    <>
      <h2>🧑‍🌾 Farm Pac-Man</h2>
      <p>
        Score <b>{hud.score}</b> · Lives {'💗'.repeat(Math.max(hud.lives, 0)) || '🥺'} · Daisies left <b>{hud.left}</b>
      </p>
      <div style={{ position: 'relative', maxWidth: COLS * T, margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          width={COLS * T}
          height={ROWS * T}
          style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', border: '5px solid #ff9ecb', borderRadius: 16, boxShadow: '0 0 0 3px #fff, 4px 6px 0 #4a2b3d', display: 'block', touchAction: 'none' }}
        />
        {(hud.status === 'ready' || over) && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#fff4faee', color: '#4a2b3d', borderRadius: 12, textAlign: 'center', padding: 12 }}>
            <div>
              {hud.status === 'ready' && (<><h3 style={{ color: '#ff4f9a' }}>Gather all the daisies! 🌼</h3><p>Dodge the jellies. Strawberries make them shy 🍓</p></>)}
              {hud.status === 'won' && (<><h3 style={{ color: '#ff4f9a' }}>Yay, all gathered! 🌸</h3><p>{hud.tickets} tickets earned</p></>)}
              {hud.status === 'lost' && (<><h3 style={{ color: '#ff4f9a' }}>Oh no, the jellies got you! 🥺</h3><p>{hud.tickets} tickets earned</p></>)}
              <button className="primary" onClick={start}>{hud.status === 'ready' ? 'Start' : 'Play again'}</button>
            </div>
          </div>
        )}
      </div>
      <p className="muted">Arrow keys or WASD. Gather every daisy for 13–19 tickets.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 8, justifyContent: 'center', margin: '8px 0' }}>
        <span />
        <button aria-label="Up" onPointerDown={() => steer(UP)}>▲</button>
        <span />
        <button aria-label="Left" onPointerDown={() => steer(LEFT)}>◀</button>
        <button aria-label="Down" onPointerDown={() => steer(DOWN)}>▼</button>
        <button aria-label="Right" onPointerDown={() => steer(RIGHT)}>▶</button>
      </div>
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
