Arcade.registerGame({
  id: 'react', name: 'Reaction Test', emoji: '⚡', author: 'Starter game',
  blurb: '5 rounds. Faster = more tickets.',
  play(el, api) {
    let round = 0, times = [], state = 'idle', timer, t0;
    el.innerHTML = `<p>Round <b id="rd">1</b> / 5. Click when it turns green.</p><div class="react" id="pad"></div><div id="res"></div>`;
    const pad = el.querySelector('#pad');
    function ready() {
      state = 'wait'; pad.style.background = '#a33'; pad.textContent = 'Wait...';
      timer = setTimeout(() => { state = 'go'; pad.style.background = '#2a2'; pad.textContent = 'CLICK!'; t0 = performance.now(); api.beep(880, .08); }, 1000 + Math.random() * 2000);
    }
    pad.style.background = '#446'; pad.textContent = 'Click to start';
    pad.onclick = () => {
      if (state === 'idle') return ready();
      if (state === 'wait') { clearTimeout(timer); pad.textContent = 'Too early! Click to retry'; pad.style.background = '#446'; state = 'idle'; return; }
      if (state === 'go') {
        const ms = Math.round(performance.now() - t0); times.push(ms); round++;
        if (round >= 5) {
          state = 'done';
          const avg = Math.round(times.reduce((a, b) => a + b) / 5);
          const t = Math.max(1, Math.min(20, Math.round((600 - avg) / 20)));
          pad.textContent = `Average ${avg} ms`;
          el.querySelector('#res').innerHTML = `<h3>${t} tickets!</h3>`;
          api.finish(Math.max(0, 1000 - avg), t);
        } else { el.querySelector('#rd').textContent = round + 1; pad.textContent = ms + ' ms - click for next'; pad.style.background = '#446'; state = 'idle'; }
      }
    };
    return () => clearTimeout(timer);
  },
});
