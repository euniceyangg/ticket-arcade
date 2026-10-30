'use client';
// Runs a game written as `play(el, api)` (the original plain-HTML plug-in shape).
// api.beep(freq, seconds, waveform) plays a sound; api.finish(score, tickets) ends a round.
import { useEffect, useRef } from 'react';
import { useWallet } from '@/lib/wallet';

type Api = { beep: (freq?: number, dur?: number, type?: OscillatorType) => void; finish: (score: number, tickets: number) => void };
type Play = (el: HTMLElement, api: Api) => void | (() => void);

export default function LegacyGame({ id, play }: { id: string; play: Play }) {
  const box = useRef<HTMLDivElement>(null);
  const { finishGame, beep } = useWallet();
  // The game calls these long after the first render, so always use the latest ones.
  const latest = useRef({ finishGame, beep });
  latest.current = { finishGame, beep };

  useEffect(() => {
    const el = box.current!;
    const cleanup = play(el, {
      beep: (freq, dur, type) => latest.current.beep(freq, dur, type),
      finish: (score, tickets) => latest.current.finishGame(id, score, tickets),
    });
    return () => {
      if (typeof cleanup === 'function') cleanup(); // stops timers and key listeners
      el.innerHTML = '';
    };
  }, [id, play]);

  return <div ref={box} />;
}
