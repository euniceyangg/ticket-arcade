// Snake by Wynne (Wzhu). Ported from the plain-HTML version on branch wynne-snake: the game
// code is unchanged except one line in handleKeyDown (marked). It plugs in through <LegacyGame>.
// @ts-nocheck
export const snake = {
  id: 'snake',
  name: 'Snake',
  emoji: '🐍',
  author: 'Wynne',
  blurb: 'Classic arcade snake! Eat apples to grow, avoid walls and your tail.',
  play(el, api) {
    const GRID_SIZE = 20;
    const CANVAS_SIZE = 300;
    const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
    const MOVE_SPEED_MS = 190; // Relaxed speed / 较慢且更易上手的游动速度

    // Crisp pixelated arrows (7x7 retro pixel blocks)
    const PIXEL_ARROW_UP = `
      <svg width="22" height="22" viewBox="0 0 7 7" shape-rendering="crispEdges" style="display:block; fill:currentColor;">
        <rect x="3" y="0" width="1" height="1"/>
        <rect x="2" y="1" width="3" height="1"/>
        <rect x="1" y="2" width="5" height="1"/>
        <rect x="0" y="3" width="7" height="1"/>
        <rect x="2" y="4" width="3" height="3"/>
      </svg>`;

    const PIXEL_ARROW_DOWN = `
      <svg width="22" height="22" viewBox="0 0 7 7" shape-rendering="crispEdges" style="display:block; fill:currentColor;">
        <rect x="2" y="0" width="3" height="3"/>
        <rect x="0" y="3" width="7" height="1"/>
        <rect x="1" y="4" width="5" height="1"/>
        <rect x="2" y="5" width="3" height="1"/>
        <rect x="3" y="6" width="1" height="1"/>
      </svg>`;

    const PIXEL_ARROW_LEFT = `
      <svg width="22" height="22" viewBox="0 0 7 7" shape-rendering="crispEdges" style="display:block; fill:currentColor;">
        <rect x="4" y="2" width="3" height="3"/>
        <rect x="3" y="0" width="1" height="7"/>
        <rect x="2" y="1" width="1" height="5"/>
        <rect x="1" y="2" width="1" height="3"/>
        <rect x="0" y="3" width="1" height="1"/>
      </svg>`;

    const PIXEL_ARROW_RIGHT = `
      <svg width="22" height="22" viewBox="0 0 7 7" shape-rendering="crispEdges" style="display:block; fill:currentColor;">
        <rect x="0" y="2" width="3" height="3"/>
        <rect x="3" y="0" width="1" height="7"/>
        <rect x="4" y="1" width="1" height="5"/>
        <rect x="5" y="2" width="1" height="3"/>
        <rect x="6" y="3" width="1" height="1"/>
      </svg>`;

    el.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:12px; max-width:100%;">
        <div style="display:flex; gap:16px; font-weight:700;">
          <span>Score: <b id="sn-score" style="color:var(--accent);">0</b></span>
          <span>Tickets: <b id="sn-tix" style="color:var(--good);">0</b></span>
        </div>
        <canvas id="sn-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"
          style="background:#0e0a1a; border:2px solid var(--line); border-radius:10px; display:block; max-width:100%; height:auto; aspect-ratio:1/1; box-sizing:border-box;"></canvas>
        <div id="sn-status" style="min-height:24px; font-weight:700; text-align:center;"></div>
        
        <!-- Retro pixelated directional buttons -->
        <div style="display:grid; grid-template-columns: repeat(3, 50px); gap:6px; justify-content:center;">
          <div></div>
          <button id="sn-btn-up" class="dpad-btn" title="Up">${PIXEL_ARROW_UP}</button>
          <div></div>
          <button id="sn-btn-left" class="dpad-btn" title="Left">${PIXEL_ARROW_LEFT}</button>
          <button id="sn-btn-down" class="dpad-btn" title="Down">${PIXEL_ARROW_DOWN}</button>
          <button id="sn-btn-right" class="dpad-btn" title="Right">${PIXEL_ARROW_RIGHT}</button>
        </div>

        <button id="sn-btn-restart" class="primary" style="margin-top:6px; display:none;">Play Again (Space)</button>
      </div>
      <style>
        .dpad-btn {
          width: 50px;
          height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--panel);
          border: 2px solid var(--line);
          border-radius: 8px;
          color: var(--accent);
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }
        .dpad-btn:hover {
          background: var(--line);
          color: #fff;
        }
        .dpad-btn:active {
          transform: scale(0.94);
        }
      </style>
    `;

    const canvas = el.querySelector('#sn-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#sn-score');
    const tixEl = el.querySelector('#sn-tix');
    const statusEl = el.querySelector('#sn-status');
    const restartBtn = el.querySelector('#sn-btn-restart');

    let snake = [];
    let dir = { x: 1, y: 0 };
    let inputQueue = []; // Input buffer queue to prevent double-turn dropping & instant self-reversal
    let food = { x: 15, y: 10 };
    let score = 0;
    let gameOver = false;
    let gameLoop = null;

    function resetGame() {
      snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
      ];
      dir = { x: 1, y: 0 };
      inputQueue = [];
      score = 0;
      gameOver = false;
      scoreEl.textContent = '0';
      tixEl.textContent = '0';
      statusEl.textContent = '';
      restartBtn.style.display = 'none';
      spawnFood();
      clearInterval(gameLoop);
      gameLoop = setInterval(step, MOVE_SPEED_MS);
      draw();
    }

    function spawnFood() {
      let valid = false;
      while (!valid) {
        food = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        };
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
      }
    }

    function setDirection(newDir) {
      if (gameOver) return;
      // Compare against the latest queued direction or the current moving direction
      const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : dir;
      // Prevent 180-degree reversing into oneself
      if (newDir.x !== -lastDir.x || newDir.y !== -lastDir.y) {
        if (inputQueue.length < 2) {
          inputQueue.push(newDir);
        }
      }
    }

    function handleKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return; // added in the port: leave Cmd/Ctrl shortcuts alone
      const key = e.key.toLowerCase();

      // If game is over, Space or Enter restarts; allow arrows to scroll page normally
      if (gameOver) {
        if (key === ' ' || key === 'enter') {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      if (['arrowup', 'w'].includes(key)) {
        setDirection({ x: 0, y: -1 });
        e.preventDefault();
      } else if (['arrowdown', 's'].includes(key)) {
        setDirection({ x: 0, y: 1 });
        e.preventDefault();
      } else if (['arrowleft', 'a'].includes(key)) {
        setDirection({ x: -1, y: 0 });
        e.preventDefault();
      } else if (['arrowright', 'd'].includes(key)) {
        setDirection({ x: 1, y: 0 });
        e.preventDefault();
      }
    }

    function step() {
      if (gameOver) return;
      if (inputQueue.length > 0) {
        dir = inputQueue.shift();
      }
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame();
        return;
      }

      // Self collision
      if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        endGame();
        return;
      }

      snake.unshift(head);

      // Check food
      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        const currentTickets = Math.min(20, Math.floor(score / 2));
        tixEl.textContent = currentTickets;
        api.beep(720, 0.08); // Eat sound
        spawnFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function draw() {
      ctx.fillStyle = '#0e0a1a';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Subtle grid
      ctx.strokeStyle = '#1b1433';
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      // Draw food (apple)
      ctx.fillStyle = '#ff5d73';
      ctx.beginPath();
      const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
      const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw snake
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#3ddc97' : '#22b074';
        const px = seg.x * CELL_SIZE + 1;
        const py = seg.y * CELL_SIZE + 1;
        const size = CELL_SIZE - 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(px, py, size, size, 4) : ctx.rect(px, py, size, size);
        ctx.fill();
      });
    }

    function endGame() {
      if (gameOver) return;
      gameOver = true;
      clearInterval(gameLoop);
      api.beep(200, 0.2, 'sawtooth'); // Game over sound
      const tickets = Math.min(20, Math.floor(score / 2));
      statusEl.innerHTML = `<span style="color:var(--bad);">Game Over!</span> Won <b style="color:var(--good);">${tickets}</b> tickets!`;
      restartBtn.style.display = 'inline-block';
      api.finish(score, tickets);
    }

    // Attach responsive controls (both pointerdown for zero-lag touch and click fallback)
    function bindControl(selector, dirObj) {
      const btn = el.querySelector(selector);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        setDirection(dirObj);
      });
    }

    bindControl('#sn-btn-up', { x: 0, y: -1 });
    bindControl('#sn-btn-down', { x: 0, y: 1 });
    bindControl('#sn-btn-left', { x: -1, y: 0 });
    bindControl('#sn-btn-right', { x: 1, y: 0 });
    restartBtn.onclick = resetGame;

    // Window keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    // Start game
    resetGame();

    // Cleanup when user navigates away from #/play-snake
    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKeyDown);
    };
  },
};
