Arcade.registerGame({
  id: 'mole', name: 'Whack-a-Mole', emoji: '🔨', author: 'Starter game',
  blurb: '20 seconds. 1 ticket per 2 moles.',
  play(el, api) {
    let score = 0, left = 20, active = -1, over = false;
    el.innerHTML = `<p>Score: <b id="sc">0</b> · Time: <b id="tm">20</b></p><div class="moles" id="holes"></div><div id="res"></div>`;
    const holes = [...Array(9)].map((_, i) => {
      const b = document.createElement('button'); b.className = 'hole'; b.onclick = () => hit(i);
      el.querySelector('#holes').appendChild(b); return b;
    });
    function hit(i) { if (over || i !== active) return; score++; active = -1; holes[i].textContent = ''; el.querySelector('#sc').textContent = score; api.beep(660, .06); }
    function pop() { holes.forEach(h => h.textContent = ''); active = Math.floor(Math.random() * 9); holes[active].textContent = '🐹'; }
    const pt = setInterval(pop, 700);
    const tt = setInterval(() => {
      el.querySelector('#tm').textContent = --left;
      if (left <= 0) {
        over = true; stop();
        const t = Math.floor(score / 2);
        el.querySelector('#res').innerHTML = `<h3>Time! ${score} moles → ${t} tickets</h3>`;
        api.finish(score, t);
      }
    }, 1000);
    function stop() { clearInterval(pt); clearInterval(tt); }
    return stop; // cleanup when the player leaves
  },
});
