'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/lib/wallet';

const LINKS = [
  ['/', 'Games'],
  ['/prizes', 'Prize Shop'],
  ['/shelf', 'Shelf'],
  ['/leaderboard', 'Leaderboard'],
  ['/badges', 'Badges'],
  ['/door', 'Door'],
] as const;

export default function Header() {
  const path = usePathname();
  const { name, tickets, muted, toggleMute } = useWallet();
  return (
    <header>
      <h1><Link href="/">🎟️ Ticket Arcade</Link></h1>
      <nav>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? 'on' : ''}>{label}</Link>
        ))}
      </nav>
      <span className="pill">👤 {name || 'Guest'}</span>
      <span className="pill tix">🎟️ {tickets}</span>
      <button onClick={toggleMute} title={muted ? 'Sound is off' : 'Sound is on'} aria-label="Toggle sound">{muted ? '🔇' : '🔊'}</button>
    </header>
  );
}
