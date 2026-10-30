# Ticket Arcade

A retro arcade: play games, win tickets, spend them in the prize shop.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Where things live
| Piece | File |
|---|---|
| Game list (home page reads this) | `lib/games.ts` |
| Ticket wallet (`addTickets`, `spendTickets`, `finishGame`) | `lib/wallet.tsx` |
| Header + ticket counter | `components/Header.tsx` |
| Global look (colors, fonts) | `app/globals.css` (one owner, please) |
| Prizes and stock | `lib/prizes.ts` |
| Achievements | `lib/achievements.ts` |
| Prize shop / shelf / leaderboard / badges / door | `app/prizes`, `app/shelf`, `app/leaderboard`, `app/badges`, `app/door` |

## Add your game
1. Add one line to `lib/games.ts` (id, name, emoji, blurb, author). Placeholders have `soon: true`; remove it once your game works.
2. Create `app/games/<id>/page.tsx` (see `app/games/mole/page.tsx` for an example).
3. Use the wallet, never your own counter:
   ```tsx
   const { finishGame } = useWallet();
   finishGame('<id>', score, ticketsEarned); // records the score + awards tickets + animation
   ```
Aim for 5-20 tickets per play so prize prices stay balanced. Games without a page show "Coming soon".

## Working together
Make a branch, commit, push, and open a pull request. Don't commit `.env.local` or any secret keys.
