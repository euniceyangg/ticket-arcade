// Frogger by Ziqing. Ported from the plain-HTML version (PR #2): the game code is unchanged.
// It plugs in through <LegacyGame>, which gives it the same `play(el, api)` it was written for.
// @ts-nocheck
export const frogger = {
  id: 'frogger',
  name: 'Frogger',
  emoji: '🐸',
  author: 'Ziqing',
  blurb: 'Help the kawaii frog hop across candy roads and dessert rivers! 3 lives.',
  play(el, api) {
    // ---------- Container & Layout (Spoon Pet / Kawaii Pastel Style) ----------
    el.innerHTML = `
      <style>
        .spoon-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          user-select: none;
          touch-action: manipulation;
          font-family: 'Comic Sans MS', 'Chalkboard SE', system-ui, -apple-system, sans-serif;
        }
        /* Top HUD styled like the Spoon Pet Book card */
        .spoon-hud {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 480px;
          background: #fff8fc;
          border: 3.5px solid #ff5a92;
          box-shadow: 0 4px 14px rgba(255, 90, 146, 0.28), inset 0 2px 0 #ffffff;
          border-radius: 18px;
          padding: 8px 14px;
          box-sizing: border-box;
          color: #3d2314;
        }
        .spoon-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .spoon-badge {
          background: #00c4cc;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 900;
          padding: 3px 9px;
          border-radius: 99px;
          border: 2px solid #24565b;
          text-shadow: 0 1px 1px #0e3b40;
          letter-spacing: 0.5px;
        }
        .spoon-badge.lvl { background: #ff85a2; border-color: #7a233b; text-shadow: 0 1px 1px #591728; }
        .spoon-badge.lives { background: #ffcf33; border-color: #6e4e00; text-shadow: 0 1px 1px #543b00; }
        .spoon-val {
          background: #ffffff;
          border: 2px solid #3d2314;
          border-radius: 8px;
          padding: 2px 8px;
          color: #3d2314;
          font-family: monospace, sans-serif;
          font-weight: 800;
          font-size: 1.05rem;
          min-width: 52px;
          text-align: center;
          box-shadow: inset 0 1px 2px #0001;
        }
        .spoon-lives-icons {
          font-size: 1.25rem;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
        }
        /* Canvas container with pastel scallop frame */
        .spoon-canvas-wrap {
          position: relative;
          width: 100%;
          max-width: 480px;
          aspect-ratio: 480 / 520;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(255, 90, 146, 0.25), 0 2px 6px #0002;
          border: 4px solid #ff5a92;
          background: #ffeaf3;
        }
        #frogCanvas {
          width: 100%;
          height: 100%;
          display: block;
          image-rendering: auto;
        }
        /* Buttons styled like the Spoon Pet Close / House buttons */
        .spoon-bar {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 480px;
        }
        .spoon-btn {
          background: linear-gradient(180deg, #48dbfb 0%, #00b8c4 100%);
          color: #ffffff;
          border: 2.5px solid #23474a;
          box-shadow: 0 4px 0 #1b393b, 0 5px 8px rgba(0,0,0,0.15);
          border-radius: 14px;
          padding: 8px 18px;
          font-weight: 900;
          font-size: 0.92rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-shadow: 0 1px 2px #0d2a2d;
          transition: transform 0.08s, box-shadow 0.08s;
        }
        .spoon-btn:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #1b393b;
        }
        .spoon-btn.pink {
          background: linear-gradient(180deg, #ff9eb9 0%, #ff5287 100%);
          border-color: #611830;
          box-shadow: 0 4px 0 #4f1024, 0 5px 8px rgba(0,0,0,0.15);
          text-shadow: 0 1px 2px #3b0918;
        }
        .spoon-btn.pink:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #4f1024;
        }
        /* On-screen D-Pad */
        .spoon-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }
        .dpad-row { display: flex; gap: 10px; justify-content: center; }
        .dpad-btn {
          width: 52px;
          height: 46px;
          font-size: 1.35rem;
          font-weight: 900;
          background: linear-gradient(180deg, #fffcf0 0%, #ffeaa7 100%);
          color: #3d2314;
          border: 2.5px solid #3d2314;
          border-radius: 12px;
          box-shadow: 0 3.5px 0 #3d2314;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 0.05s, box-shadow 0.05s;
        }
        .dpad-btn:active {
          transform: translateY(3px);
          box-shadow: 0 0.5px 0 #3d2314;
          background: #ffd32a;
        }
        .spoon-hint {
          color: #8c6a99;
          font-size: 0.85rem;
          font-weight: bold;
          text-align: center;
        }
      </style>

      <div class="spoon-wrap">
        <div class="spoon-hud">
          <div class="spoon-stat">
            <span class="spoon-badge">SCORE</span>
            <span class="spoon-val" id="fg-score">00000</span>
          </div>
          <div class="spoon-stat">
            <span class="spoon-badge lvl">LVL</span>
            <span class="spoon-val" id="fg-lvl" style="min-width: 32px;">1</span>
          </div>
          <div class="spoon-stat">
            <span class="spoon-badge lives">LIVES</span>
            <span class="spoon-lives-icons" id="fg-lives">🐸🐸🐸</span>
          </div>
        </div>

        <div class="spoon-canvas-wrap">
          <canvas id="frogCanvas" width="480" height="520"></canvas>
        </div>

        <div class="spoon-bar">
          <button class="spoon-btn pink" id="fg-restart">🔄 Restart</button>
          <button class="spoon-btn" id="fg-toggle-dpad">📱 Show D-Pad</button>
        </div>

        <div class="spoon-controls" id="fg-dpad" style="display: none;">
          <div class="dpad-row">
            <button class="dpad-btn" data-dir="up">▲</button>
          </div>
          <div class="dpad-row">
            <button class="dpad-btn" data-dir="left">◄</button>
            <button class="dpad-btn" data-dir="down">▼</button>
            <button class="dpad-btn" data-dir="right">►</button>
          </div>
        </div>

        <div class="spoon-hint">Hop with <b>Arrow Keys</b> or <b>W / A / S / D</b> ⭐</div>
      </div>
    `;

    const canvas = el.querySelector('#frogCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#fg-score');
    const lvlEl = el.querySelector('#fg-lvl');
    const livesEl = el.querySelector('#fg-lives');
    const restartBtn = el.querySelector('#fg-restart');
    const toggleDpadBtn = el.querySelector('#fg-toggle-dpad');
    const dpadEl = el.querySelector('#fg-dpad');

    // ---------- Constants & Grid ----------
    const COLS = 12;
    const ROWS = 13;
    const CELL = 40;
    const WIDTH = 480;
    const HEIGHT = 520;

    // 5 Goal bays along row 0 (Spoon Pet cushions / stamp frames)
    const DOCKS = [
      { x: 30,  w: 48, filled: false },
      { x: 126, w: 48, filled: false },
      { x: 222, w: 48, filled: false },
      { x: 318, w: 48, filled: false },
      { x: 414, w: 48, filled: false },
    ];

    // ---------- State ----------
    let level = 1;
    let score = 0;
    let lives = 3;
    let highestRow = 12;
    let roundTicketsAwarded = false;
    let gameState = 'playing'; // 'playing' | 'dead' | 'roundWon' | 'gameOver'
    let stateTimer = 0;
    let roundTime = 30;
    let sparkles = [];
    let waterWaveOffset = 0;
    let lastTime = performance.now();
    let animId = null;

    // Kawaii frog state
    const frog = {
      col: 5,
      row: 12,
      x: 5 * CELL,
      y: 12 * CELL,
      targetX: 5 * CELL,
      targetY: 12 * CELL,
      isHopping: false,
      hopProgress: 0,
      dir: 'up',
      ridingSpeed: 0,
      deathType: null,
    };

    // Obstacles
    let cars = [];
    let riverItems = [];

    function setupLanes() {
      const speedMult = 1 + (level - 1) * 0.18;

      // Vehicles on road: Cute pastel toy vehicles
      cars = [
        // Row 7: Strawberry pink buggies with heart lights (moving left)
        { row: 7, x: 50,  w: 52, h: 30, speed: -75 * speedMult, type: 'pinkBuggy', color: '#ff6b95' },
        { row: 7, x: 240, w: 52, h: 30, speed: -75 * speedMult, type: 'pinkBuggy', color: '#ff6b95' },
        { row: 7, x: 410, w: 52, h: 30, speed: -75 * speedMult, type: 'pinkBuggy', color: '#ff6b95' },

        // Row 8: Pastel mint & yellow speedsters with star decals (moving right)
        { row: 8, x: 20,  w: 50, h: 28, speed: 120 * speedMult, type: 'mintRacer', color: '#55efc4' },
        { row: 8, x: 260, w: 50, h: 28, speed: 120 * speedMult, type: 'mintRacer', color: '#55efc4' },

        // Row 9: Strawberry milk / ice-cream delivery trucks (moving left)
        { row: 9, x: 80,  w: 94, h: 32, speed: -55 * speedMult, type: 'sweetsTruck', color: '#ffa8ba' },
        { row: 9, x: 320, w: 94, h: 32, speed: -55 * speedMult, type: 'sweetsTruck', color: '#ffa8ba' },

        // Row 10: Honey-yellow taxi wagons with flower signs (moving right)
        { row: 10, x: 40,  w: 54, h: 30, speed: 85 * speedMult, type: 'honeyTaxi', color: '#fed330' },
        { row: 10, x: 220, w: 54, h: 30, speed: 85 * speedMult, type: 'honeyTaxi', color: '#fed330' },
        { row: 10, x: 390, w: 54, h: 30, speed: 85 * speedMult, type: 'honeyTaxi', color: '#fed330' },

        // Row 11: Lavender marshmallow cruisers (moving left)
        { row: 11, x: 90,  w: 46, h: 28, speed: -95 * speedMult, type: 'lavenderCar', color: '#c56cf0' },
        { row: 11, x: 270, w: 46, h: 28, speed: -95 * speedMult, type: 'lavenderCar', color: '#c56cf0' },
      ];

      // River items: Sweet strawberry macarons, wafer biscuit logs, and flower turtles
      const logLen = Math.max(72, 112 - (level - 1) * 8);
      riverItems = [
        // Row 1: Strawberry cream wafer logs (moving right)
        { row: 1, x: 40,  w: logLen,       h: 30, speed: 65 * speedMult,  type: 'waferLog' },
        { row: 1, x: 230, w: logLen,       h: 30, speed: 65 * speedMult,  type: 'waferLog' },
        { row: 1, x: 410, w: logLen,       h: 30, speed: 65 * speedMult,  type: 'waferLog' },

        // Row 2: Giant strawberry macarons (moving left, like Spoon Pet Macaron #1!)
        { row: 2, x: 30,  w: 80,           h: 30, speed: -80 * speedMult, type: 'macaron' },
        { row: 2, x: 190, w: 80,           h: 30, speed: -80 * speedMult, type: 'macaron' },
        { row: 2, x: 360, w: 80,           h: 30, speed: -80 * speedMult, type: 'macaron' },

        // Row 3: Long swiss roll logs with strawberry slices (moving right)
        { row: 3, x: 80,  w: logLen + 48,  h: 32, speed: 50 * speedMult,  type: 'swissRoll' },
        { row: 3, x: 320, w: logLen + 48,  h: 32, speed: 50 * speedMult,  type: 'swissRoll' },

        // Row 4: Pastel biscuit rafts (moving right)
        { row: 4, x: 50,  w: 72,           h: 28, speed: 105 * speedMult, type: 'biscuit' },
        { row: 4, x: 220, w: 72,           h: 28, speed: 105 * speedMult, type: 'biscuit' },
        { row: 4, x: 390, w: 72,           h: 28, speed: 105 * speedMult, type: 'biscuit' },

        // Row 5: Chubby flower turtles (moving left)
        { row: 5, x: 60,  w: 80,           h: 28, speed: -75 * speedMult, type: 'flowerTurtle' },
        { row: 5, x: 240, w: 80,           h: 28, speed: -75 * speedMult, type: 'flowerTurtle' },
        { row: 5, x: 420, w: 80,           h: 28, speed: -75 * speedMult, type: 'flowerTurtle' },
      ];
    }

    function resetFrog() {
      frog.col = 5;
      frog.row = 12;
      frog.x = 5 * CELL;
      frog.y = 12 * CELL;
      frog.targetX = frog.x;
      frog.targetY = frog.y;
      frog.isHopping = false;
      frog.hopProgress = 0;
      frog.dir = 'up';
      frog.ridingSpeed = 0;
      frog.deathType = null;
      highestRow = 12;
      roundTime = 30;
    }

    function resetGame(fullReset = true) {
      if (fullReset) {
        level = 1;
        score = 0;
        lives = 3;
        DOCKS.forEach(d => (d.filled = false));
      }
      roundTicketsAwarded = false;
      gameState = 'playing';
      stateTimer = 0;
      sparkles = [];
      setupLanes();
      resetFrog();
      updateHUD();
    }

    function updateHUD() {
      scoreEl.textContent = String(score).padStart(5, '0');
      lvlEl.textContent = level;
      livesEl.textContent = '🐸'.repeat(Math.max(0, lives)) || '💔';
    }

    // ---------- Movement & Input ----------
    function moveFrog(dir) {
      if (gameState !== 'playing' || frog.isHopping) return;

      let nextCol = frog.col;
      let nextRow = frog.row;

      if (dir === 'up') nextRow--;
      else if (dir === 'down') nextRow++;
      else if (dir === 'left') nextCol--;
      else if (dir === 'right') nextCol++;

      if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow > 12) return;

      frog.dir = dir;
      frog.col = nextCol;
      frog.row = nextRow;
      frog.targetX = nextCol * CELL;
      frog.targetY = nextRow * CELL;
      frog.isHopping = true;
      frog.hopProgress = 0;

      // Cute bubbly hop sound
      api.beep(587, 0.05, 'triangle');

      // Points for forward progress
      if (nextRow < highestRow) {
        score += (highestRow - nextRow) * 10;
        highestRow = nextRow;
        updateHUD();
      }
    }

    function onKeyDown(e) {
      const k = e.key;
      if (['ArrowUp', 'KeyW'].includes(k)) { moveFrog('up'); e.preventDefault(); }
      else if (['ArrowDown', 'KeyS'].includes(k)) { moveFrog('down'); e.preventDefault(); }
      else if (['ArrowLeft', 'KeyA'].includes(k)) { moveFrog('left'); e.preventDefault(); }
      else if (['ArrowRight', 'KeyD'].includes(k)) { moveFrog('right'); e.preventDefault(); }
      else if (['Space', 'Enter'].includes(k)) {
        if (gameState === 'roundWon') nextLevel();
        else if (gameState === 'gameOver') resetGame(true);
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    dpadEl.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('click', () => moveFrog(btn.dataset.dir));
    });

    toggleDpadBtn.addEventListener('click', () => {
      const isHidden = dpadEl.style.display === 'none';
      dpadEl.style.display = isHidden ? 'flex' : 'none';
      toggleDpadBtn.textContent = isHidden ? '📱 Hide D-Pad' : '📱 Show D-Pad';
    });

    restartBtn.addEventListener('click', () => resetGame(true));

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const clickY = ((e.clientY - rect.top) / rect.height) * HEIGHT;

      if (gameState === 'roundWon' || gameState === 'gameOver') {
        const btnBox = { x: WIDTH / 2 - 85, y: HEIGHT / 2 + 55, w: 170, h: 46 };
        if (
          clickX >= btnBox.x && clickX <= btnBox.x + btnBox.w &&
          clickY >= btnBox.y && clickY <= btnBox.y + btnBox.h
        ) {
          if (gameState === 'roundWon') nextLevel();
          else resetGame(true);
        }
      }
    });

    // ---------- Kawaii Sparkles & Confetti ----------
    function spawnSparkles(x, y, color, count = 18, isStar = false) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 35 + Math.random() * 110;
        sparkles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 3 + Math.random() * 4,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 0.9,
          isStar,
        });
      }
    }

    // ---------- Life Loss & Game Over ----------
    function triggerDeath(type) {
      if (gameState !== 'playing') return;

      gameState = 'dead';
      stateTimer = 1.0;
      frog.deathType = type;

      if (type === 'squish') {
        api.beep(180, 0.1, 'sawtooth');
        setTimeout(() => api.beep(110, 0.18, 'square'), 70);
        spawnSparkles(frog.x + CELL / 2, frog.y + CELL / 2, '#ff6b81', 16, true);
        spawnSparkles(frog.x + CELL / 2, frog.y + CELL / 2, '#ffeaa7', 12);
      } else {
        api.beep(240, 0.12, 'sawtooth');
        setTimeout(() => api.beep(140, 0.22, 'sine'), 80);
        spawnSparkles(frog.x + CELL / 2, frog.y + CELL / 2, '#00c4cc', 18, true);
        spawnSparkles(frog.x + CELL / 2, frog.y + CELL / 2, '#ffffff', 10);
      }

      lives--;
      updateHUD();
    }

    // ---------- Goal Reached ----------
    function checkGoalReach() {
      const fcX = frog.x + CELL / 2;

      let landedDock = null;
      for (let i = 0; i < DOCKS.length; i++) {
        const d = DOCKS[i];
        if (fcX >= d.x && fcX <= d.x + d.w) {
          landedDock = d;
          break;
        }
      }

      if (!landedDock || landedDock.filled) {
        triggerDeath('drown');
        return;
      }

      landedDock.filled = true;
      score += 250 + Math.floor(roundTime * 10);
      updateHUD();

      // Cheerful victory arpeggio
      spawnSparkles(landedDock.x + landedDock.w / 2, 20, '#ff5a92', 24, true);
      spawnSparkles(landedDock.x + landedDock.w / 2, 20, '#ffcf33', 20, true);
      spawnSparkles(landedDock.x + landedDock.w / 2, 20, '#00c4cc', 16);
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => api.beep(f, 0.09, 'triangle'), i * 85));

      gameState = 'roundWon';
      stateTimer = 0;

      // Ticket award (5-20 target in README)
      const lifeBonus = (lives - 1) * 2;
      const timeBonus = Math.min(4, Math.floor(roundTime / 8));
      const tickets = Math.min(20, Math.max(5, 10 + lifeBonus + timeBonus));

      if (!roundTicketsAwarded) {
        roundTicketsAwarded = true;
        api.finish(score, tickets);
      }
    }

    function nextLevel() {
      level++;
      if (DOCKS.every(d => d.filled)) {
        DOCKS.forEach(d => (d.filled = false));
      }
      resetGame(false);
    }

    // ---------- Update Loop ----------
    function update(dt) {
      waterWaveOffset += dt * 35;

      // Update sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const p = sparkles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) sparkles.splice(i, 1);
      }

      if (gameState === 'dead') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
          if (lives <= 0) {
            gameState = 'gameOver';
            [349, 311, 261, 220].forEach((f, i) => setTimeout(() => api.beep(f, 0.12, 'sine'), i * 110));
          } else {
            gameState = 'playing';
            resetFrog();
          }
        }
        return;
      }

      if (gameState !== 'playing') return;

      roundTime -= dt;
      if (roundTime <= 0) {
        roundTime = 0;
        triggerDeath('drown');
        return;
      }

      // Update Cars
      cars.forEach(c => {
        c.x += c.speed * dt;
        if (c.speed > 0 && c.x > WIDTH + 40) c.x = -c.w - 20;
        else if (c.speed < 0 && c.x < -c.w - 40) c.x = WIDTH + 20;
      });

      // Update River Items
      riverItems.forEach(r => {
        r.x += r.speed * dt;
        if (r.speed > 0 && r.x > WIDTH + 60) r.x = -r.w - 30;
        else if (r.speed < 0 && r.x < -r.w - 60) r.x = WIDTH + 30;
      });

      // Frog Hopping
      if (frog.isHopping) {
        frog.hopProgress += dt * 9;
        if (frog.hopProgress >= 1) {
          frog.hopProgress = 1;
          frog.isHopping = false;
          frog.x = frog.targetX;
          frog.y = frog.targetY;
        } else {
          frog.x = frog.col * CELL + (frog.targetX - frog.col * CELL) * frog.hopProgress;
          frog.y = frog.row * CELL + (frog.targetY - frog.row * CELL) * frog.hopProgress;
        }
      }

      // Road Collisions (Rows 7..11)
      if (frog.row >= 7 && frog.row <= 11) {
        const frogBox = { x: frog.x + 8, y: frog.y + 8, w: CELL - 16, h: CELL - 16 };
        for (const c of cars) {
          if (c.row === frog.row) {
            const carBox = { x: c.x, y: c.row * CELL + 5, w: c.w, h: c.h };
            if (
              frogBox.x < carBox.x + carBox.w &&
              frogBox.x + frogBox.w > carBox.x &&
              frogBox.y < carBox.y + carBox.h &&
              frogBox.y + frogBox.h > carBox.y
            ) {
              triggerDeath('squish');
              return;
            }
          }
        }
      }

      // River Floating / Drowning (Rows 1..5)
      if (frog.row >= 1 && frog.row <= 5) {
        let onRaft = null;
        const fcX = frog.x + CELL / 2;

        for (const item of riverItems) {
          if (item.row === frog.row) {
            if (fcX >= item.x && fcX <= item.x + item.w) {
              onRaft = item;
              break;
            }
          }
        }

        if (onRaft) {
          frog.ridingSpeed = onRaft.speed;
          frog.x += onRaft.speed * dt;
          frog.targetX = frog.x;
          frog.col = Math.round(frog.x / CELL);

          if (frog.x < -CELL / 2 || frog.x > WIDTH - CELL / 2) {
            triggerDeath('drown');
            return;
          }
        } else if (!frog.isHopping) {
          triggerDeath('drown');
          return;
        }
      }

      // Goal Bank (Row 0)
      if (frog.row === 0 && !frog.isHopping) {
        checkGoalReach();
      }
    }

    // ---------- Drawing Utilities (Spoon Pet Aesthetic) ----------
    function drawCuteFlower(cx, cy, petalColor, centerColor = '#fed330', size = 6) {
      ctx.save();
      ctx.fillStyle = petalColor;
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const px = cx + Math.cos(ang) * size;
        const py = cy + Math.sin(ang) * size;
        ctx.beginPath();
        ctx.arc(px, py, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Center
      ctx.fillStyle = centerColor;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function drawCuteHeart(cx, cy, size = 10, color = '#ff3860') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo(-size * 0.8, -size * 0.5, -size * 0.9, size * 0.4, 0, size);
      ctx.bezierCurveTo(size * 0.9, size * 0.4, size * 0.8, -size * 0.5, 0, size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // White catchlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-size * 0.3, size * 0.1, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPawPrint(cx, cy, color = '#8ae096', size = 8) {
      ctx.save();
      ctx.fillStyle = color;
      // Main pad
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.2, size * 0.6, size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      // 3 Toes
      ctx.beginPath();
      ctx.arc(cx - size * 0.45, cy - size * 0.35, size * 0.25, 0, Math.PI * 2);
      ctx.arc(cx, cy - size * 0.55, size * 0.25, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.45, cy - size * 0.35, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Yellow checkerboard patio (matching Spoon Pet portrait frame)
    function drawCheckerboard(y, rowsCount = 1) {
      const h = rowsCount * CELL;
      const sq = 20; // 20px squares
      for (let py = y; py < y + h; py += sq) {
        for (let px = 0; px < WIDTH; px += sq) {
          const isEven = ((px / sq) + (py / sq)) % 2 === 0;
          ctx.fillStyle = isEven ? '#fffce6' : '#fff099';
          ctx.fillRect(px, py, sq, sq);
        }
      }

      // Top & Bottom scalloped trim
      ctx.fillStyle = '#ff7ea4';
      ctx.fillRect(0, y, WIDTH, 3);
      ctx.fillRect(0, y + h - 3, WIDTH, 3);
    }

    // ---------- Main Render Function ----------
    function draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // 1. River Background (Rows 1..5): Pastel turquoise candy waters
      const riverGrad = ctx.createLinearGradient(0, CELL, 0, CELL * 6);
      riverGrad.addColorStop(0, '#5dd4e6');
      riverGrad.addColorStop(1, '#7ee4f2');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(0, CELL, WIDTH, CELL * 5);

      // River cute waves & sparkles
      ctx.fillStyle = '#ffffffbb';
      for (let r = 1; r <= 5; r++) {
        const y = r * CELL;
        const waveX = (waterWaveOffset * (r % 2 === 0 ? -1 : 1)) % 40;
        for (let x = -40 + waveX; x < WIDTH + 40; x += 44) {
          ctx.beginPath();
          ctx.arc(x + 12, y + 14, 5, 0, Math.PI);
          ctx.arc(x + 22, y + 14, 5, 0, Math.PI);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff99';
          ctx.stroke();

          // Sparkle star
          if ((x + r * 15) % 88 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 8, y + 26, 3, 3);
            ctx.fillRect(x + 7, y + 27, 5, 1);
          }
        }
      }

      // 2. Road Background (Rows 7..11): Warm pastel plum / chocolate road
      const roadGrad = ctx.createLinearGradient(0, 7 * CELL, 0, 12 * CELL);
      roadGrad.addColorStop(0, '#3d2847');
      roadGrad.addColorStop(1, '#4f335c');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 7 * CELL, WIDTH, 5 * CELL);

      // Dashed lane lines (cute pastel stars & dashes)
      for (let r = 8; r <= 11; r++) {
        const y = r * CELL;
        ctx.fillStyle = '#fffae6aa';
        for (let x = 12; x < WIDTH; x += 36) {
          ctx.fillRect(x, y - 1, 16, 2.5);
          if (x % 72 === 0) {
            // Little star marker
            ctx.fillStyle = '#fed330';
            ctx.fillRect(x + 20, y - 2, 4, 4);
            ctx.fillStyle = '#fffae6aa';
          }
        }
      }

      // 3. Median Sidewalk (Row 6): Yellow checkerboard patio with flowers
      drawCheckerboard(6 * CELL, 1);
      // Sprinkle cute flowers along median
      drawCuteFlower(45, 6 * CELL + 20, '#ff70a6', '#ffcf33', 5);
      drawCuteFlower(140, 6 * CELL + 20, '#48dbfb', '#ffcf33', 5);
      drawCuteFlower(240, 6 * CELL + 20, '#ff70a6', '#ffcf33', 5);
      drawCuteFlower(340, 6 * CELL + 20, '#48dbfb', '#ffcf33', 5);
      drawCuteFlower(435, 6 * CELL + 20, '#ff70a6', '#ffcf33', 5);

      // 4. Starting Zone (Row 12): Yellow checkerboard with green paw prints
      drawCheckerboard(12 * CELL, 1);
      for (let x = 40; x < WIDTH; x += 80) {
        drawPawPrint(x, 12 * CELL + 20, '#8ae096', 7);
      }

      // 5. Goal Bank (Row 0): Spoon Pet Book pink scalloped ribbon banner
      drawGoalBank();

      // 6. River Rafts (Macarons, Wafer logs, Swiss rolls, Flower turtles)
      riverItems.forEach(drawRiverRaft);

      // 7. Vehicles (Chubby pastel toy cars)
      cars.forEach(drawCuteCar);

      // 8. The Kawaii Frog
      if (gameState !== 'dead' || Math.floor(stateTimer * 8) % 2 === 0) {
        drawSpoonPetFrog();
      }

      // 9. Sparkles & Confetti
      sparkles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        if (p.isStar) {
          ctx.translate(p.x, p.y);
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Star cross
          ctx.fillRect(-p.size * 1.4, -1, p.size * 2.8, 2);
          ctx.fillRect(-1, -p.size * 1.4, 2, p.size * 2.8);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      ctx.globalAlpha = 1;

      // 10. Pastel Time Bar
      drawTimeBar();

      // 11. Overlays
      if (gameState === 'roundWon') drawVictoryCard();
      else if (gameState === 'gameOver') drawGameOverCard();
    }

    // ---------- Goal Bank (Row 0) ----------
    function drawGoalBank() {
      // Pink ribbon background with white scalloped lace
      ctx.fillStyle = '#ff6b95';
      ctx.fillRect(0, 0, WIDTH, CELL);

      // Scalloped bottom trim
      ctx.fillStyle = '#ff85a8';
      for (let x = 0; x < WIDTH; x += 16) {
        ctx.beginPath();
        ctx.arc(x + 8, CELL, 8, Math.PI, 0);
        ctx.fill();
      }

      // Cute white polka dots / stars on the pink banner
      ctx.fillStyle = '#ffffff66';
      for (let x = 10; x < WIDTH; x += 28) {
        ctx.beginPath();
        ctx.arc(x, 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5 Goal bays styled like the Spoon Pet "Favorites" postage stamp
      DOCKS.forEach((d) => {
        const cx = d.x + d.w / 2;
        const cy = CELL / 2;

        // Stamp background
        ctx.save();
        ctx.fillStyle = '#fffdf5';
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 2.5;

        // Rounded cushion
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(d.x + 2, 4, d.w - 4, CELL - 8, 10);
        else ctx.rect(d.x + 2, 4, d.w - 4, CELL - 8);
        ctx.fill();
        ctx.stroke();

        // Inner cushion stitching / pattern
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.fill();

        if (d.filled) {
          // Happy sleeping/smiling frog resting in the cushion
          drawRestingFrog(cx, cy);
          drawCuteHeart(cx + 14, cy - 8, 5, '#ff3860');
        } else {
          // Golden star waiting for a frog
          ctx.fillStyle = '#ffd32a';
          ctx.strokeStyle = '#3d2314';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    function drawRestingFrog(cx, cy) {
      ctx.save();
      // Mint body
      ctx.fillStyle = '#55efc4';
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cheeks
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 2, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Happy curved sleeping eyes (^ ^)
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 2, 3, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 5, cy - 2, 3, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.stroke();

      // Cute little red hair ribbon!
      ctx.fillStyle = '#ff3860';
      ctx.beginPath();
      ctx.arc(cx, cy - 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ---------- River Floating Rafts ----------
    function drawRiverRaft(item) {
      const y = item.row * CELL + 5;
      ctx.save();

      if (item.type === 'macaron') {
        // Giant strawberry macaron (inspired by Spoon Pet Top 3 Goods Macaron!)
        const r = item.h / 2;
        const cx = item.x + item.w / 2;

        // Shadow
        ctx.fillStyle = '#22707a55';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(item.x + 3, y + 4, item.w - 6, item.h, 14);
        else ctx.rect(item.x + 3, y + 4, item.w - 6, item.h);
        ctx.fill();

        // Bottom cookie shell (Pink strawberry meringue)
        ctx.fillStyle = '#ff70a6';
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(item.x + 2, y + 14, item.w - 4, item.h - 14, 12);
        else ctx.rect(item.x + 2, y + 14, item.w - 4, item.h - 14);
        ctx.fill();
        ctx.stroke();

        // Fluffy white cream filling with scalloped edges
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(item.x + 6, y + 10, item.w - 12, 10, 5);
        else ctx.rect(item.x + 6, y + 10, item.w - 12, 10);
        ctx.fill();
        ctx.stroke();

        // Top cookie shell
        ctx.fillStyle = '#ff85b6';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(item.x + 2, y, item.w - 4, item.h - 12, 12);
        else ctx.rect(item.x + 2, y, item.w - 4, item.h - 12);
        ctx.fill();
        ctx.stroke();

        // Macaron sprinkles / dots
        ctx.fillStyle = '#ffd32a';
        ctx.fillRect(cx - 16, y + 4, 4, 3);
        ctx.fillRect(cx + 12, y + 4, 4, 3);
        ctx.fillStyle = '#55efc4';
        ctx.fillRect(cx - 2, y + 5, 4, 3);

      } else if (item.type === 'waferLog' || item.type === 'biscuit') {
        // Strawberry cream wafer biscuit log
        ctx.fillStyle = '#ffe0b2';
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(item.x, y, item.w, item.h, 8);
        else ctx.rect(item.x, y, item.w, item.h);
        ctx.fill();
        ctx.stroke();

        // Strawberry cream center layer
        ctx.fillStyle = '#ff70a6';
        ctx.fillRect(item.x + 4, y + item.h / 2 - 2, item.w - 8, 4);

        // Wafer waffle crosshatch pattern
        ctx.strokeStyle = '#d7a15c';
        ctx.lineWidth = 1;
        for (let wx = item.x + 8; wx < item.x + item.w - 8; wx += 14) {
          ctx.beginPath();
          ctx.moveTo(wx, y + 3);
          ctx.lineTo(wx + 8, y + item.h - 3);
          ctx.stroke();
        }

      } else if (item.type === 'swissRoll') {
        // Swirled strawberry swiss roll cake log
        ctx.fillStyle = '#fff4e6';
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(item.x, y, item.w, item.h, 12);
        else ctx.rect(item.x, y, item.w, item.h);
        ctx.fill();
        ctx.stroke();

        // Pink glaze drizzle
        ctx.fillStyle = '#ff85b6';
        for (let gx = item.x + 10; gx < item.x + item.w - 10; gx += 22) {
          ctx.beginPath();
          ctx.arc(gx, y + 4, 6, 0, Math.PI);
          ctx.fill();
        }

        // Cute strawberry slices on top
        for (let sx = item.x + 18; sx < item.x + item.w - 18; sx += 32) {
          drawCuteHeart(sx, y + item.h / 2, 6, '#ff3860');
        }

      } else {
        // Chubby mint flower turtles
        const turtleW = 32;
        const count = Math.floor(item.w / (turtleW + 6));
        for (let i = 0; i < count; i++) {
          const tx = item.x + i * (turtleW + 8) + 4;
          // Shell (mint green with dark outline)
          ctx.fillStyle = '#55efc4';
          ctx.strokeStyle = '#3d2314';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(tx + 16, y + 14, 15, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Flower on back of turtle
          drawCuteFlower(tx + 16, y + 14, '#ff9ff3', '#ffd32a', 4);

          // Head & flippers
          ctx.fillStyle = '#7eedc8';
          const headX = item.speed < 0 ? tx - 2 : tx + 30;
          ctx.beginPath();
          ctx.arc(headX, y + 14, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Eye
          ctx.fillStyle = '#3d2314';
          ctx.fillRect(headX - 1, y + 13, 2, 2);
        }
      }

      ctx.restore();
    }

    // ---------- Vehicles (Chubby Pastel Toy Cars) ----------
    function drawCuteCar(c) {
      const y = c.row * CELL + 6;
      ctx.save();

      // Shadow
      ctx.fillStyle = '#1c0f2455';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(c.x + 2, y + 4, c.w - 4, c.h, 10);
      else ctx.rect(c.x + 2, y + 4, c.w - 4, c.h);
      ctx.fill();

      if (c.type === 'sweetsTruck') {
        // Strawberry dessert / ice cream delivery truck
        const cabW = 28;
        const trW = c.w - cabW - 4;
        const goingRight = c.speed > 0;
        const cabX = goingRight ? c.x + trW + 4 : c.x;
        const trX = goingRight ? c.x : c.x + cabW + 4;

        // Trailer with pink & white candy stripes
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(trX, y, trW, c.h, 8);
        else ctx.rect(trX, y, trW, c.h);
        ctx.fill();
        ctx.stroke();

        // Pink awning stripes
        ctx.fillStyle = '#ff70a6';
        for (let sx = trX + 4; sx < trX + trW - 4; sx += 12) {
          ctx.fillRect(sx, y + 2, 6, c.h - 4);
        }

        // Heart logo on side
        drawCuteHeart(trX + trW / 2, y + c.h / 2, 5, '#ff3860');

        // Cab
        ctx.fillStyle = '#ff85a2';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cabX, y + 2, cabW, c.h - 4, 8);
        else ctx.rect(cabX, y + 2, cabW, c.h - 4);
        ctx.fill();
        ctx.stroke();

        // Windshield
        ctx.fillStyle = '#dff9fb';
        ctx.beginPath();
        const wsX = goingRight ? cabX + 14 : cabX + 4;
        if (ctx.roundRect) ctx.roundRect(wsX, y + 5, 8, c.h - 10, 4);
        else ctx.rect(wsX, y + 5, 8, c.h - 10);
        ctx.fill();
        ctx.stroke();

      } else {
        // Chubby kawaii car
        ctx.fillStyle = c.color;
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(c.x + 2, y + 2, c.w - 4, c.h - 4, 12);
        else ctx.rect(c.x + 2, y + 2, c.w - 4, c.h - 4);
        ctx.fill();
        ctx.stroke();

        // Bubble white/cream cabin roof
        ctx.fillStyle = '#fffdf7';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(c.x + 10, y + 5, c.w - 20, c.h - 10, 8);
        else ctx.rect(c.x + 10, y + 5, c.w - 20, c.h - 10);
        ctx.fill();
        ctx.stroke();

        // Glossy sky-blue windshield
        ctx.fillStyle = '#c7ecee';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(c.x + 13, y + 7, c.w - 26, c.h - 14, 6);
        else ctx.rect(c.x + 13, y + 7, c.w - 26, c.h - 14);
        ctx.fill();

        // Honey taxi flower sign
        if (c.type === 'honeyTaxi') {
          drawCuteFlower(c.x + c.w / 2, y - 1, '#ffffff', '#ffd32a', 4);
        }

        // Star / Heart decal on sports racer
        if (c.type === 'mintRacer') {
          ctx.fillStyle = '#fed330';
          ctx.fillRect(c.x + c.w / 2 - 3, y + c.h / 2 - 3, 6, 6);
        }

        // Headlights (Heart or Star shaped!)
        if (c.speed > 0) {
          ctx.fillStyle = '#fed330'; // front headlights
          ctx.beginPath();
          ctx.arc(c.x + c.w - 3, y + 7, 3, 0, Math.PI * 2);
          ctx.arc(c.x + c.w - 3, y + c.h - 7, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff3860'; // back taillights
          ctx.fillRect(c.x + 1, y + 6, 2.5, 4);
          ctx.fillRect(c.x + 1, y + c.h - 10, 2.5, 4);
        } else {
          ctx.fillStyle = '#fed330'; // front headlights left
          ctx.beginPath();
          ctx.arc(c.x + 3, y + 7, 3, 0, Math.PI * 2);
          ctx.arc(c.x + 3, y + c.h - 7, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff3860'; // back taillights right
          ctx.fillRect(c.x + c.w - 3.5, y + 6, 2.5, 4);
          ctx.fillRect(c.x + c.w - 3.5, y + c.h - 10, 2.5, 4);
        }
      }

      ctx.restore();
    }

    // ---------- The Kawaii Frog (Spoon Pet Style) ----------
    function drawSpoonPetFrog() {
      ctx.save();
      const cx = frog.x + CELL / 2;
      const cy = frog.y + CELL / 2;

      ctx.translate(cx, cy);

      if (frog.dir === 'right') ctx.rotate(Math.PI / 2);
      else if (frog.dir === 'down') ctx.rotate(Math.PI);
      else if (frog.dir === 'left') ctx.rotate(-Math.PI / 2);

      // Hop stretch scale
      const hopScale = frog.isHopping ? 1 + Math.sin(frog.hopProgress * Math.PI) * 0.28 : 1;
      ctx.scale(hopScale, hopScale);

      // Soft drop shadow
      ctx.fillStyle = '#3d231433';
      ctx.beginPath();
      ctx.ellipse(0, 3, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rounded chubby feet
      ctx.fillStyle = '#3ddc97';
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 1.8;
      if (frog.isHopping) {
        // Extended feet
        [-13, 13].forEach(fx => {
          ctx.beginPath();
          ctx.arc(fx, -11, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(fx, 11, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      } else {
        // Tucked chubby paws
        [-11, 11].forEach(fx => {
          ctx.beginPath();
          ctx.arc(fx, -8, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(fx, 8, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      // Chubby mint-green body
      ctx.fillStyle = '#55efc4';
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pale cream belly
      ctx.fillStyle = '#e8fdf5';
      ctx.beginPath();
      ctx.ellipse(0, 2, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big round anime eyes (like the Spoon Pet rabbit in the screenshot!)
      [-7, 7].forEach(ex => {
        // Eye white
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3d2314';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(ex, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dark glossy pupil
        ctx.fillStyle = '#22110c';
        ctx.beginPath();
        ctx.arc(ex, -10, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Double white sparkle catchlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 1, -11.5, 1.4, 0, Math.PI * 2);
        ctx.arc(ex + 1.2, -9, 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cute rosy blush cheeks
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.ellipse(-9, -2, 3, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(9, -2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sweet little 'w' mouth
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(-1.5, 2, 2, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1.5, 2, 2, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();

      // Cute red hairbow with white button (like the pet's bow in reference!)
      ctx.fillStyle = '#ff3860';
      ctx.beginPath();
      ctx.ellipse(-3, -15, 3.5, 2.2, -Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(3, -15, 3.5, 2.2, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -15, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ---------- Time Bar ----------
    function drawTimeBar() {
      const barH = 7;
      const barY = HEIGHT - barH;
      const pct = Math.max(0, roundTime / 30);

      ctx.fillStyle = '#ff85a255';
      ctx.fillRect(0, barY, WIDTH, barH);

      const grad = ctx.createLinearGradient(0, 0, WIDTH, 0);
      grad.addColorStop(0, '#55efc4');
      grad.addColorStop(0.5, '#fed330');
      grad.addColorStop(1, '#ff6b81');
      ctx.fillStyle = grad;
      ctx.fillRect(0, barY, WIDTH * pct, barH);
    }

    // ---------- Overlays Styled Like the Spoon Pet Book Card ----------
    function drawCardFrame(titleText, subtitleText, badgeText, btnText, isWon) {
      // Backdrop blur/dim
      ctx.fillStyle = '#3d231477';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.save();
      const cardW = 380;
      const cardH = 340;
      const cardX = (WIDTH - cardW) / 2;
      const cardY = (HEIGHT - cardH) / 2;

      // Outer Pink Card Border with scalloped top
      ctx.fillStyle = '#ff6b95';
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 24);
      else ctx.rect(cardX, cardY, cardW, cardH);
      ctx.fill();
      ctx.stroke();

      // Inner Cream Parchment Card with dashed red/pink notebook lines
      ctx.fillStyle = '#fffdf7';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cardX + 10, cardY + 12, cardW - 20, cardH - 24, 18);
      else ctx.rect(cardX + 10, cardY + 12, cardW - 20, cardH - 24);
      ctx.fill();
      ctx.stroke();

      // Top Pink Ribbon Header
      ctx.fillStyle = '#ff85a8';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cardX + 24, cardY + 22, cardW - 48, 38, 12);
      else ctx.rect(cardX + 24, cardY + 22, cardW - 48, 38);
      ctx.fill();
      ctx.stroke();

      // Cute Hearts on the sides
      drawCuteHeart(cardX + 44, cardY + 41, 9, '#ff3860');
      drawCuteHeart(cardX + cardW - 44, cardY + 41, 9, '#ff3860');

      // Title
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px "Comic Sans MS", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, WIDTH / 2, cardY + 47);

      // Subtitle
      ctx.font = 'bold 15px "Comic Sans MS", system-ui, sans-serif';
      ctx.fillStyle = isWon ? '#00b8c4' : '#ff4757';
      ctx.fillText(subtitleText, WIDTH / 2, cardY + 95);

      // Dashed notebook lines (like Spoon Pet Book description box)
      ctx.strokeStyle = '#ff85a288';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(cardX + 35, cardY + 125);
      ctx.lineTo(cardX + cardW - 35, cardY + 125);
      ctx.moveTo(cardX + 35, cardY + 175);
      ctx.lineTo(cardX + cardW - 35, cardY + 175);
      ctx.moveTo(cardX + 35, cardY + 225);
      ctx.lineTo(cardX + cardW - 35, cardY + 225);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Big Ticket / Result Badge
      ctx.font = 'bold 22px "Comic Sans MS", system-ui, sans-serif';
      ctx.fillStyle = '#3d2314';
      ctx.fillText(badgeText, WIDTH / 2, cardY + 155);

      // Stats line
      ctx.font = '15px "Comic Sans MS", system-ui, sans-serif';
      ctx.fillStyle = '#7a5a82';
      ctx.fillText(`Score: ${score}  ⭐  Level: ${level}`, WIDTH / 2, cardY + 205);

      // Chunky Rounded Action Button (like the Spoon Pet Close / House button!)
      const bx = WIDTH / 2 - 85;
      const by = cardY + 250;
      const bw = 170;
      const bh = 46;

      ctx.fillStyle = isWon ? '#00c4cc' : '#ff5a92';
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 14);
      else ctx.rect(bx, by, bw, bh);
      ctx.fill();
      ctx.stroke();

      // Button highlight
      ctx.fillStyle = '#ffffff44';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx + 4, by + 3, bw - 8, bh / 2 - 2, 8);
      else ctx.rect(bx + 4, by + 3, bw - 8, bh / 2 - 2);
      ctx.fill();

      // Button Text
      ctx.font = 'bold 17px "Comic Sans MS", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(btnText, WIDTH / 2, by + 29);

      ctx.restore();
    }

    function drawVictoryCard() {
      const lifeBonus = (lives - 1) * 2;
      const timeBonus = Math.min(4, Math.floor(roundTime / 8));
      const tickets = Math.min(20, Math.max(5, 10 + lifeBonus + timeBonus));
      drawCardFrame(
        '⭐ GOAL REACHED! ⭐',
        `Round Cleared! Level ${level} Complete`,
        `🎟️ +${tickets} Arcade Tickets!`,
        'Next Level ➔',
        true
      );
    }

    function drawGameOverCard() {
      drawCardFrame(
        '💔 GAME OVER 💔',
        'Try again to win arcade tickets!',
        `Final Score: ${score}`,
        'Play Again 🔄',
        false
      );
    }

    // ---------- Main Animation Loop ----------
    function loop(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      update(dt);
      draw();

      animId = requestAnimationFrame(loop);
    }

    resetGame(true);
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
    };
  },
};
