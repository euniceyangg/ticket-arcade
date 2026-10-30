'use client';
import Link from 'next/link';
import LegacyGame from '@/components/LegacyGame';
import { frogger } from './frogger';

export default function Frogger() {
  return (
    <>
      <h2>🐸 Frogger</h2>
      <LegacyGame id="frogger" play={frogger.play} />
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
