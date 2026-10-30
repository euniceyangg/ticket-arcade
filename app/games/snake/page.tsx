'use client';
import Link from 'next/link';
import LegacyGame from '@/components/LegacyGame';
import { snake } from './snake';

export default function Snake() {
  return (
    <>
      <h2>🐍 Snake</h2>
      <LegacyGame id="snake" play={snake.play} />
      <p><Link href="/">&larr; Back to the arcade floor</Link></p>
    </>
  );
}
