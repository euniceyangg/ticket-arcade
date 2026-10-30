import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/lib/wallet';
import Header from '@/components/Header';
import Overlays from '@/components/Overlays';

export const metadata: Metadata = { title: 'Ticket Arcade', description: 'Play games, win tickets, spend them on prizes.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Header />
          <main>{children}</main>
          <Overlays />
        </WalletProvider>
      </body>
    </html>
  );
}
