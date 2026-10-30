# Ticket Arcade

Open `index.html` in a browser (no build step). Progress is saved in localStorage.

## Add your game
1. Create `games/yourgame.js`:
```js
Arcade.registerGame({
  id: 'yourgame',            // unique, no spaces
  name: 'Your Game', emoji: '🎮', author: 'You', blurb: 'One line description',
  play(el, api) {
    // draw your game inside `el`
    // when it ends: api.finish(score, ticketsEarned)
    // api.beep(freq, seconds) plays a sound (respects mute)
    return () => { /* cleanup timers when the player leaves */ };
  },
});
```
2. Add `<script src="games/yourgame.js"></script>` above `Arcade.start()` in `index.html`.

Each game must award a sensible number of tickets (aim for 5-20 per play) so the prize prices stay balanced.
