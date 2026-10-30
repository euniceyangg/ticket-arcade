'use client';
// THE TICKET WALLET. Every game and the shop use these helpers instead of
// tracking tickets on their own:
//   const { tickets, addTickets, spendTickets, finishGame } = useWallet();
// State is saved in localStorage (swap load/save for Supabase later).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PRIZES } from './prizes';
import { ACHIEVEMENTS } from './achievements';
import { beep as playBeep, jingle } from './sound';

export type ArcadeState = {
  name: string;
  tickets: number;
  earned: number;
  owned: Record<string, number>;
  played: Record<string, boolean>;
  scores: Record<string, { name: string; score: number }[]>;
  stock: Record<string, number>;
  bonusDay: string;
  badges: Record<string, boolean>;
  muted: boolean;
};

const KEY = 'ticket-arcade-v2';
const today = () => new Date().toISOString().slice(0, 10);

function fresh(): ArcadeState {
  const stock: Record<string, number> = {};
  PRIZES.forEach((p) => { if (p.stock !== null) stock[p.id] = p.stock; });
  return { name: '', tickets: 0, earned: 0, owned: {}, played: {}, scores: {}, stock, bonusDay: '', badges: {}, muted: false };
}

type Wallet = ArcadeState & {
  ready: boolean;
  /** Add tickets (negative or fractional amounts are ignored). */
  addTickets: (n: number) => void;
  /** Spend tickets. Returns false (and changes nothing) if you can't afford it. */
  spendTickets: (n: number) => boolean;
  /** Call when a game ends: records the score, awards tickets, triggers the win animation. */
  finishGame: (gameId: string, score: number, tickets: number) => void;
  buyPrize: (prizeId: string) => boolean;
  setName: (name: string) => void;
  claimBonus: () => boolean;
  canClaimBonus: boolean;
  toggleMute: () => void;
  beep: (freq?: number, dur?: number, type?: OscillatorType) => void;
  toast: string;
  rainKey: number;
  rainCount: number;
};

const Ctx = createContext<Wallet | null>(null);

// Saved data can be old or edited by hand, so make sure the numbers are sane.
function clean(raw: Partial<ArcadeState>): ArcadeState {
  const base = fresh();
  const merged = { ...base, ...raw, stock: { ...base.stock, ...raw.stock } };
  const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
  merged.tickets = num(merged.tickets);
  merged.earned = num(merged.earned);
  Object.keys(merged.stock).forEach((k) => { merged.stock[k] = num(merged.stock[k]); });
  return merged;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<ArcadeState>(fresh);
  // `latest` always holds the newest state, even between React renders. Every check
  // ("can I afford this?") reads it, so rapid double-clicks can't spend the same tickets twice.
  const latest = useRef<ArcadeState>(s);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [rain, setRain] = useState({ key: 0, count: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const loaded = clean(JSON.parse(raw));
        latest.current = loaded;
        setS(loaded);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, [s, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Apply a change right away, then unlock any achievements it earned.
  const update = useCallback((fn: (prev: ArcadeState) => ArcadeState) => {
    const next = fn(latest.current);
    const badges = { ...next.badges };
    ACHIEVEMENTS.forEach((a) => {
      if (!badges[a.id] && a.test(next)) {
        badges[a.id] = true;
        setToast(`${a.emoji} Achievement: ${a.name}`);
        jingle(next.muted);
      }
    });
    latest.current = { ...next, badges };
    setS(latest.current);
  }, []);

  const celebrate = (n: number) => setRain((r) => ({ key: r.key + 1, count: n }));

  const addTickets: Wallet['addTickets'] = (n) => {
    const amt = Math.floor(n);
    if (!(amt > 0)) return;
    update((p) => ({ ...p, tickets: p.tickets + amt, earned: p.earned + amt }));
  };

  const spendTickets: Wallet['spendTickets'] = (n) => {
    const amt = Math.floor(n);
    if (!(amt > 0) || amt > latest.current.tickets) return false;
    update((p) => ({ ...p, tickets: p.tickets - amt }));
    return true;
  };

  const finishGame: Wallet['finishGame'] = (gameId, score, tickets) => {
    const amt = Math.max(0, Math.floor(tickets));
    update((p) => {
      const board = [...(p.scores[gameId] ?? []), { name: p.name || 'Guest', score }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return {
        ...p,
        tickets: p.tickets + amt,
        earned: p.earned + amt,
        played: { ...p.played, [gameId]: true },
        scores: { ...p.scores, [gameId]: board },
      };
    });
    if (amt > 0) { celebrate(amt); jingle(latest.current.muted); }
  };

  const buyPrize: Wallet['buyPrize'] = (id) => {
    const prize = PRIZES.find((p) => p.id === id);
    if (!prize) return false;
    if (prize.stock !== null && (latest.current.stock[id] ?? 0) <= 0) return false; // sold out
    if (!spendTickets(prize.cost)) return false; // can't afford it
    update((p) => ({
      ...p,
      owned: { ...p.owned, [id]: (p.owned[id] ?? 0) + 1 },
      stock: prize.stock !== null ? { ...p.stock, [id]: p.stock[id] - 1 } : p.stock,
    }));
    playBeep(latest.current.muted, 520, 0.1);
    setToast(`${prize.emoji} You got a ${prize.name}!`);
    return true;
  };

  const canClaimBonus = s.bonusDay !== today();
  const claimBonus = () => {
    if (latest.current.bonusDay === today()) return false; // already claimed today
    update((p) => ({ ...p, bonusDay: today(), tickets: p.tickets + 15, earned: p.earned + 15 }));
    celebrate(15);
    jingle(latest.current.muted);
    return true;
  };

  const value: Wallet = {
    ...s,
    ready,
    addTickets,
    spendTickets,
    finishGame,
    buyPrize,
    setName: (name) => update((p) => ({ ...p, name: name.trim().slice(0, 16) })),
    claimBonus,
    canClaimBonus,
    toggleMute: () => update((p) => ({ ...p, muted: !p.muted })),
    beep: (freq = 440, dur = 0.1, type = 'square') => playBeep(s.muted, freq, dur, type),
    toast,
    rainKey: rain.key,
    rainCount: rain.count,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): Wallet {
  const w = useContext(Ctx);
  if (!w) throw new Error('useWallet must be used inside <WalletProvider>');
  return w;
}
