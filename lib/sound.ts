let ctx: AudioContext | undefined;

export function beep(muted: boolean, freq = 440, dur = 0.1, type: OscillatorType = 'square') {
  if (muted || typeof window === 'undefined') return;
  try {
    ctx = ctx ?? new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {}
}

export function jingle(muted: boolean) {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(muted, f, 0.12), i * 90));
}
