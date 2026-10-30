'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { useWallet } from '@/lib/wallet';
import {
  createClayMaterial,
  createDragonMesh,
  createBearMesh,
  createFrogMesh,
  createBunnyMesh,
  createPlayerCraft,
  createMushroomShield,
  createMysteryStarMesh,
  createPlayerStarProjectile,
  createEnemyDropletProjectile,
  ParticleEmitter,
  PALETTE,
} from './fairy-models';

// Type definitions
type EnemyType = 'dragon' | 'bear' | 'frog' | 'bunny';

interface EnemyData {
  id: number;
  row: number;
  col: number;
  type: EnemyType;
  mesh: THREE.Group;
  alive: boolean;
  baseX: number;
  baseY: number;
  points: number;
}

interface Projectile {
  mesh: THREE.Object3D;
  vy: number;
  fromPlayer: boolean;
}

interface ShieldData {
  mesh: THREE.Group;
  x: number;
  y: number;
  hp: number;
}

export default function FairyInvaders() {
  const { finishGame, addTickets, beep } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<'title' | 'playing' | 'wave-clear' | 'game-over'>('title');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [waveBanner, setWaveBanner] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Game loop state refs
  const stateRef = useRef<'title' | 'playing' | 'wave-clear' | 'game-over'>('title');
  stateRef.current = gameState;

  const scoreRef = useRef(0);
  scoreRef.current = score;
  const waveRef = useRef(1);
  waveRef.current = wave;
  const livesRef = useRef(3);
  livesRef.current = lives;
  const ticketsWonRef = useRef(0);
  ticketsWonRef.current = ticketsWon;

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  // Three.js instances ref
  const gameRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player: THREE.Group;
    enemies: EnemyData[];
    shields: ShieldData[];
    projectiles: Projectile[];
    emitter: ParticleEmitter;
    mysteryStar: THREE.Group | null;
    mysteryVx: number;
    mysteryTimer: number;
    gridX: number;
    gridY: number;
    gridDir: number;
    stepTimer: number;
    stepToneIndex: number;
    shootCooldown: number;
    enemyShootCooldown: number;
    invulnerableTime: number;
    playerTargetX: number;
    playerX: number;
  } | null>(null);

  // Set mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // -------------------------------------------------------------
  // Keyboard Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) {
        keysRef.current.left = true;
      }
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) {
        keysRef.current.right = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        keysRef.current.shoot = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) {
        keysRef.current.left = false;
      }
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) {
        keysRef.current.right = false;
      }
      if (e.code === 'Space') {
        keysRef.current.shoot = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // -------------------------------------------------------------
  // Spawning Wave Function
  // -------------------------------------------------------------
  const spawnWaveEnemies = useCallback((scene: THREE.Scene, waveNum: number) => {
    const enemies: EnemyData[] = [];
    const cols = 6;
    const rows = 4;
    const spacingX = 2.4;
    const spacingY = 2.1;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = 4.2;

    let id = 0;
    for (let r = 0; r < rows; r++) {
      let type: EnemyType = 'dragon';
      let points = 30;
      let meshFn = createDragonMesh;

      if (r === 1) {
        type = 'bear';
        points = 20;
        meshFn = createBearMesh;
      } else if (r === 2) {
        type = 'frog';
        points = 15;
        meshFn = createFrogMesh;
      } else if (r === 3) {
        type = 'bunny';
        points = 10;
        meshFn = createBunnyMesh;
      }

      for (let c = 0; c < cols; c++) {
        const mesh = meshFn();
        const bx = startX + c * spacingX;
        const by = startY + (rows - 1 - r) * spacingY;
        mesh.position.set(bx, by, 0);
        scene.add(mesh);

        enemies.push({
          id: id++,
          row: r,
          col: c,
          type,
          mesh,
          alive: true,
          baseX: bx,
          baseY: by,
          points,
        });
      }
    }
    return enemies;
  }, []);

  // -------------------------------------------------------------
  // Spawning Mushroom Shields
  // -------------------------------------------------------------
  const spawnShields = useCallback((scene: THREE.Scene) => {
    const shields: ShieldData[] = [];
    const positions = [-5.6, 0, 5.6];
    const colors = [PALETTE.mint, PALETTE.dustyPink, PALETTE.creamYellow];

    positions.forEach((x, i) => {
      const mesh = createMushroomShield(colors[i % colors.length]);
      mesh.position.set(x, -6.8, 0);
      scene.add(mesh);
      shields.push({ mesh, x, y: -6.8, hp: 4 });
    });
    return shields;
  }, []);

  // -------------------------------------------------------------
  // Three.js Game Setup & Animation Loop
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xecdff8); // Soft pastel lavender sky

    // Camera: Slight tilt-shift angled view for dollhouse miniature effect
    const aspect = 800 / 600;
    const camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
    camera.position.set(0, -1.0, 26.5);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(800, 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // -------------------------------------------------------------
    // Lighting Setup (Sims CC Pastel Gentle Lights)
    // -------------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight(0xfff6ea, 0xd0c2eb, 0.95);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffdf5, 1.1);
    dirLight.position.set(10, 18, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Soft colored rim lights
    const pinkRim = new THREE.PointLight(0xff8fab, 0.7, 30);
    pinkRim.position.set(-14, -8, 8);
    scene.add(pinkRim);

    const mintRim = new THREE.PointLight(0x74c69d, 0.5, 30);
    mintRim.position.set(14, 10, 8);
    scene.add(mintRim);

    // -------------------------------------------------------------
    // Playfield Dollhouse Border & Decorative Fluffy Clouds
    // -------------------------------------------------------------
    const boardGroup = new THREE.Group();

    // Floor Tray
    const floorGeo = new THREE.BoxGeometry(22.4, 28.5, 0.8);
    const floorMat = createClayMaterial(PALETTE.stageFloor, { roughness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, -0.6);
    floor.receiveShadow = true;
    boardGroup.add(floor);

    // Playfield Decorative Border Rim (warm cream/peach)
    const rimMat = createClayMaterial(PALETTE.stageBorder, { roughness: 0.45 });
    const topRim = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.8, 1.2), rimMat);
    topRim.position.set(0, 14.4, -0.2);
    const botRim = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.8, 1.2), rimMat);
    botRim.position.set(0, -14.4, -0.2);
    const leftRim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 29.2, 1.2), rimMat);
    leftRim.position.set(-11.4, 0, -0.2);
    const rightRim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 29.2, 1.2), rimMat);
    rightRim.position.set(11.4, 0, -0.2);
    boardGroup.add(topRim, botRim, leftRim, rightRim);

    // Floating Miniature Background Clouds
    const cloudMat = createClayMaterial(PALETTE.white, { roughness: 0.4 });
    const cloudPositions = [
      [-10.2, 12, 0.2],
      [10.5, 11.5, 0.2],
      [-9.8, -12.5, 0.2],
      [10.2, -12, 0.2],
      [-10.5, 0, 0.2],
      [10.8, -2, 0.2],
    ];
    cloudPositions.forEach(([cx, cy, cz]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), cloudMat);
      puff.scale.set(1.4, 0.7, 0.8);
      puff.position.set(cx, cy, cz);
      boardGroup.add(puff);
    });

    scene.add(boardGroup);

    // -------------------------------------------------------------
    // Entities Setup
    // -------------------------------------------------------------
    const player = createPlayerCraft();
    player.position.set(0, -10.5, 0);
    scene.add(player);

    const emitter = new ParticleEmitter(scene);
    const shields = spawnShields(scene);
    const enemies = spawnWaveEnemies(scene, 1);

    gameRef.current = {
      scene,
      camera,
      renderer,
      player,
      enemies,
      shields,
      projectiles: [],
      emitter,
      mysteryStar: null,
      mysteryVx: 0,
      mysteryTimer: 18 + Math.random() * 10,
      gridX: 0,
      gridY: 0,
      gridDir: 1,
      stepTimer: 0.65,
      stepToneIndex: 0,
      shootCooldown: 0,
      enemyShootCooldown: 1.5,
      invulnerableTime: 0,
      playerTargetX: 0,
      playerX: 0,
    };

    // -------------------------------------------------------------
    // Animation Game Loop
    // -------------------------------------------------------------
    let animId: number;
    let lastTime = performance.now();
    const STEP_NOTES = [260, 290, 330, 390];

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const g = gameRef.current;
      if (!g) return;

      const currentState = stateRef.current;

      // Update particle effects
      g.emitter.update(dt);

      // Idle bobbing / cloud animations
      const t = now * 0.002;
      g.player.position.y = -10.5 + Math.sin(t * 3) * 0.12;

      // Animate dragon wings / idle wiggles for alive enemies
      g.enemies.forEach((e) => {
        if (!e.alive) return;
        if (e.type === 'dragon') {
          const wings = e.mesh.getObjectByName('wings');
          if (wings) wings.rotation.x = Math.sin(now * 0.008 + e.id) * 0.35;
        } else if (e.type === 'frog') {
          e.mesh.rotation.z = Math.sin(now * 0.004 + e.id) * 0.08;
        } else if (e.type === 'bear') {
          e.mesh.rotation.y = Math.sin(now * 0.005 + e.id) * 0.1;
        } else if (e.type === 'bunny') {
          e.mesh.position.z = Math.sin(now * 0.006 + e.id) * 0.08;
        }
      });

      // -------------------------------------------------------
      // Playing State Logic
      // -------------------------------------------------------
      if (currentState === 'playing') {
        // 1. Player Movement & Tilting
        const moveSpeed = 14.5;
        if (keysRef.current.left) {
          g.playerTargetX -= moveSpeed * dt;
        }
        if (keysRef.current.right) {
          g.playerTargetX += moveSpeed * dt;
        }
        g.playerTargetX = Math.max(-9.2, Math.min(9.2, g.playerTargetX));
        g.playerX += (g.playerTargetX - g.playerX) * 0.25;
        g.player.position.x = g.playerX;

        // Banking tilt when moving
        const targetRoll = -(g.playerTargetX - g.playerX) * 0.6;
        g.player.rotation.z += (targetRoll - g.player.rotation.z) * 0.2;

        // Player invulnerability blinking
        if (g.invulnerableTime > 0) {
          g.invulnerableTime -= dt;
          g.player.visible = Math.floor(g.invulnerableTime * 12) % 2 === 0;
        } else {
          g.player.visible = true;
        }

        // 2. Player Shooting
        g.shootCooldown -= dt;
        if (keysRef.current.shoot && g.shootCooldown <= 0) {
          g.shootCooldown = 0.26;
          // Spawn star projectile
          const pMesh = createPlayerStarProjectile();
          pMesh.position.set(g.player.position.x, g.player.position.y + 1.2, 0);
          g.scene.add(pMesh);
          g.projectiles.push({ mesh: pMesh, vy: 21.0, fromPlayer: true });
          beep(880, 0.05); // high cheerful chime
        }

        // 3. Enemy Grid Step Logic
        const aliveEnemies = g.enemies.filter((e) => e.alive);
        const totalEnemies = g.enemies.length;

        if (aliveEnemies.length === 0) {
          // Wave Cleared!
          stateRef.current = 'wave-clear';
          setGameState('wave-clear');

          const waveBonusTickets = 4 + waveRef.current; // Wave 1: 5 tix, Wave 2: 6 tix, etc.
          addTickets(waveBonusTickets);
          setTicketsWon((tw) => tw + waveBonusTickets);
          setWaveBanner(`🎉 WAVE ${waveRef.current} CLEARED! +${waveBonusTickets} TICKETS!`);

          // Fanfare
          [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 90));

          // Big particle celebration
          for (let k = -6; k <= 6; k += 3) {
            g.emitter.burst(k, 3, 0, 18);
          }

          // Advance to next wave after 1.8 seconds
          setTimeout(() => {
            const nextWave = waveRef.current + 1;
            setWave(nextWave);

            // Clean old meshes
            g.enemies.forEach((e) => g.scene.remove(e.mesh));
            g.projectiles.forEach((p) => g.scene.remove(p.mesh));
            g.projectiles = [];

            // Spawn next wave
            g.enemies = spawnWaveEnemies(g.scene, nextWave);
            g.gridX = 0;
            g.gridY = 0;
            g.gridDir = 1;
            g.stepTimer = 0.65;
            g.stepToneIndex = 0;

            stateRef.current = 'playing';
            setGameState('playing');
            setWaveBanner('');
          }, 1800);
        } else {
          // Step Interval: speeds up dramatically as enemies dwindle
          const speedRatio = aliveEnemies.length / totalEnemies;
          const waveSpeedBonus = 1 + (waveRef.current - 1) * 0.14;
          const currentStepInterval = Math.max(0.075, (0.55 * speedRatio + 0.05) / waveSpeedBonus);

          g.stepTimer -= dt;
          if (g.stepTimer <= 0) {
            g.stepTimer = currentStepInterval;

            // Check edge bounce
            let hitEdge = false;
            const stepAmount = 0.45;
            const nextGridX = g.gridX + g.gridDir * stepAmount;

            for (const e of aliveEnemies) {
              const testX = e.baseX + nextGridX;
              if (testX > 9.1 || testX < -9.1) {
                hitEdge = true;
                break;
              }
            }

            if (hitEdge) {
              g.gridDir *= -1;
              g.gridY -= 0.8; // Descend towards player
            } else {
              g.gridX = nextGridX;
            }

            // Play stepped heartbeat chime
            beep(STEP_NOTES[g.stepToneIndex % STEP_NOTES.length], 0.05);
            g.stepToneIndex++;

            // Position and squash-hop all living enemies
            g.enemies.forEach((e) => {
              if (e.alive) {
                e.mesh.position.x = e.baseX + g.gridX;
                e.mesh.position.y = e.baseY + g.gridY;
                // Cute squash-bounce on step
                e.mesh.scale.set(1.15, 0.85, 1.15);
                setTimeout(() => {
                  if (e.alive) e.mesh.scale.set(1, 1, 1);
                }, 75);
              }
            });

            // Check if any enemy reached the bottom line!
            for (const e of aliveEnemies) {
              if (e.mesh.position.y <= -9.5) {
                // Aliens reached player! Game Over!
                triggerGameOver('The fairy creatures reached the defense line!');
                return;
              }
            }
          }

          // 4. Enemy Shooting
          g.enemyShootCooldown -= dt;
          if (g.enemyShootCooldown <= 0 && aliveEnemies.length > 0) {
            const shootIntervalBase = Math.max(0.8, 2.0 - waveRef.current * 0.2);
            g.enemyShootCooldown = shootIntervalBase + Math.random() * 0.8;

            // Pick a random column that has an alive enemy (bottom-most in that column)
            const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            if (shooter) {
              const drop = createEnemyDropletProjectile();
              drop.position.set(shooter.mesh.position.x, shooter.mesh.position.y - 0.9, 0);
              g.scene.add(drop);
              g.projectiles.push({ mesh: drop, vy: -(6.5 + waveRef.current * 0.5), fromPlayer: false });
              beep(330, 0.07);
            }
          }
        }

        // 5. Mystery Flying Star (UFO bonus)
        g.mysteryTimer -= dt;
        if (g.mysteryTimer <= 0 && !g.mysteryStar) {
          const starMesh = createMysteryStarMesh();
          const fromLeft = Math.random() > 0.5;
          starMesh.position.set(fromLeft ? -13 : 13, 11.5, 0);
          g.scene.add(starMesh);
          g.mysteryStar = starMesh;
          g.mysteryVx = fromLeft ? 7.5 : -7.5;
          beep(1046, 0.08); // high chime announcing mystery visitor
        }

        if (g.mysteryStar) {
          g.mysteryStar.position.x += g.mysteryVx * dt;
          g.mysteryStar.position.y = 11.5 + Math.sin(now * 0.005) * 0.3;
          // Clean up if off-screen
          if (Math.abs(g.mysteryStar.position.x) > 14) {
            g.scene.remove(g.mysteryStar);
            g.mysteryStar = null;
            g.mysteryTimer = 22 + Math.random() * 12;
          }
        }

        // 6. Projectiles Movement & Collisions
        for (let i = g.projectiles.length - 1; i >= 0; i--) {
          const p = g.projectiles[i];
          p.mesh.position.y += p.vy * dt;
          p.mesh.rotation.z += (p.fromPlayer ? 10 : -6) * dt;

          // Screen bounds removal
          if (p.mesh.position.y > 14.5 || p.mesh.position.y < -14.5) {
            g.scene.remove(p.mesh);
            g.projectiles.splice(i, 1);
            continue;
          }

          const px = p.mesh.position.x;
          const py = p.mesh.position.y;

          // A) Player Star Hit Enemy
          if (p.fromPlayer) {
            let hitEnemy = false;

            for (const e of g.enemies) {
              if (!e.alive) continue;
              const ex = e.mesh.position.x;
              const ey = e.mesh.position.y;
              const dist = Math.hypot(px - ex, py - ey);

              if (dist < 1.05) {
                // Enemy Defeated!
                e.alive = false;
                g.scene.remove(e.mesh);
                g.emitter.burst(ex, ey, 0, 14);

                scoreRef.current += e.points;
                setScore(scoreRef.current);
                beep(620, 0.08);

                g.scene.remove(p.mesh);
                g.projectiles.splice(i, 1);
                hitEnemy = true;
                break;
              }
            }
            if (hitEnemy) continue;

            // B) Player Star Hit Mystery Flying Star
            if (g.mysteryStar) {
              const mx = g.mysteryStar.position.x;
              const my = g.mysteryStar.position.y;
              if (Math.hypot(px - mx, py - my) < 1.4) {
                const bonusPoints = 200;
                scoreRef.current += bonusPoints;
                setScore(scoreRef.current);

                g.emitter.burst(mx, my, 0, 24);
                g.scene.remove(g.mysteryStar);
                g.mysteryStar = null;
                g.mysteryTimer = 25 + Math.random() * 10;

                // High celebration chime
                [784, 1047, 1318].forEach((f, idx) => setTimeout(() => beep(f, 0.1), idx * 80));

                g.scene.remove(p.mesh);
                g.projectiles.splice(i, 1);
                continue;
              }
            }
          }

          // C) Projectile Hit Mushroom Shields
          let hitShield = false;
          for (const s of g.shields) {
            if (s.hp <= 0) continue;
            const dist = Math.hypot(px - s.x, py - s.y);
            if (dist < 1.35) {
              s.hp--;
              hitShield = true;
              g.emitter.burst(px, py, 0, 6);
              beep(220, 0.05);

              if (s.hp <= 0) {
                g.scene.remove(s.mesh);
                g.emitter.burst(s.x, s.y, 0, 16);
              } else {
                // Shrink cap slightly on damage
                const cap = s.mesh.getObjectByName('cap');
                if (cap) {
                  const factor = 0.6 + 0.4 * (s.hp / 4);
                  cap.scale.set(1.15 * factor, 0.7 * factor, 1.15 * factor);
                }
              }

              g.scene.remove(p.mesh);
              g.projectiles.splice(i, 1);
              break;
            }
          }
          if (hitShield) continue;

          // D) Enemy Droplet Hit Player
          if (!p.fromPlayer && g.invulnerableTime <= 0) {
            const playerDist = Math.hypot(px - g.player.position.x, py - g.player.position.y);
            if (playerDist < 1.25) {
              // Player Hit!
              g.emitter.burst(g.player.position.x, g.player.position.y, 0, 18);
              beep(180, 0.25); // Sad bonk
              g.invulnerableTime = 2.0;

              livesRef.current -= 1;
              setLives(livesRef.current);

              g.scene.remove(p.mesh);
              g.projectiles.splice(i, 1);

              if (livesRef.current <= 0) {
                triggerGameOver('All lives lost!');
                return;
              }
              continue;
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // -------------------------------------------------------------
    // Game Over Trigger
    // -------------------------------------------------------------
    function triggerGameOver(reason: string) {
      stateRef.current = 'game-over';
      setGameState('game-over');
      setWaveBanner(reason);

      // Finish game using shared arcade ticket wallet!
      // Records score on shared leaderboard, triggers celebration & badges
      const finalScore = scoreRef.current;
      const finalTickets = ticketsWonRef.current;
      finishGame('space-invaders', finalScore, 0); // tickets already awarded or final bonus
    }

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [mounted, spawnShields, spawnWaveEnemies, addTickets, finishGame, beep]);

  // -------------------------------------------------------------
  // Restart Game Handler
  // -------------------------------------------------------------
  const handleStartGame = () => {
    const g = gameRef.current;
    if (!g) return;

    // Reset scores & state
    scoreRef.current = 0;
    setScore(0);
    waveRef.current = 1;
    setWave(1);
    livesRef.current = 3;
    setLives(3);
    ticketsWonRef.current = 0;
    setTicketsWon(0);
    setWaveBanner('');

    // Reset player position
    g.playerX = 0;
    g.playerTargetX = 0;
    g.player.position.set(0, -10.5, 0);
    g.invulnerableTime = 0;
    g.player.visible = true;

    // Clean entities
    g.enemies.forEach((e) => g.scene.remove(e.mesh));
    g.shields.forEach((s) => g.scene.remove(s.mesh));
    g.projectiles.forEach((p) => g.scene.remove(p.mesh));
    if (g.mysteryStar) {
      g.scene.remove(g.mysteryStar);
      g.mysteryStar = null;
    }
    g.projectiles = [];
    g.emitter.clear();

    // Respawn shields and enemies
    g.shields = spawnShields(g.scene);
    g.enemies = spawnWaveEnemies(g.scene, 1);
    g.gridX = 0;
    g.gridY = 0;
    g.gridDir = 1;
    g.stepTimer = 0.65;
    g.stepToneIndex = 0;
    g.mysteryTimer = 18 + Math.random() * 8;

    stateRef.current = 'playing';
    setGameState('playing');
    beep(523, 0.1);
  };

  if (!mounted) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#b9a9e0' }}>
        <p>Loading Fairy Invaders...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '860px',
        margin: '0 auto',
        userSelect: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Mini Breadcrumb Back Button */}
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/"
          style={{
            color: '#b8c0ff',
            textDecoration: 'none',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '6px 14px',
            borderRadius: '99px',
            transition: 'background 0.2s',
          }}
        >
          &larr; Back to Arcade Floor
        </Link>
        <span style={{ fontSize: '0.9rem', color: '#ffb3c6' }}>Fairy Invaders by Ruyi 🌸</span>
      </div>

      {/* Main 3D Dollhouse Container Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 50%, #e0f2fe 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 4px #ffc2d1',
        }}
      >
        {/* Soft Pastel HUD Bar */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {/* Score Counter */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '99px',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#5b21b6',
              boxShadow: '0 4px 12px rgba(91, 33, 182, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⭐</span>
            <span>{score}</span>
          </div>

          {/* Wave Counter */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '99px',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#db2777',
              boxShadow: '0 4px 12px rgba(219, 39, 119, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🌸</span>
            <span>Wave {wave}</span>
          </div>

          {/* Lives Indicator */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '99px',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#e11d48',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ opacity: i < lives ? 1 : 0.25, transition: 'opacity 0.2s' }}>
                💖
              </span>
            ))}
          </div>

          {/* Tickets Earned */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '99px',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#059669',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🎟️</span>
            <span>+{ticketsWon}</span>
          </div>
        </div>

        {/* Wave Clear Celebration Banner */}
        {waveBanner && gameState === 'wave-clear' && (
          <div
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '18px 32px',
              borderRadius: '24px',
              boxShadow: '0 12px 32px rgba(219, 39, 119, 0.25)',
              textAlign: 'center',
              animation: 'bounce 0.4s ease-out',
            }}
          >
            <h3 style={{ margin: 0, color: '#db2777', fontSize: '1.4rem' }}>{waveBanner}</h3>
          </div>
        )}

        {/* Title Screen Overlay */}
        {gameState === 'title' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(245, 237, 255, 0.82)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                background: '#ffc2d1',
                color: '#831843',
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: '99px',
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              CUTE 3D TOY ARCADE
            </div>
            <h1
              style={{
                margin: '0 0 10px 0',
                fontSize: '2.8rem',
                fontWeight: 900,
                color: '#4c1d95',
                letterSpacing: '2px',
                textShadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
              }}
            >
              FAIRY INVADERS 🧚
            </h1>
            <p
              style={{
                maxWidth: '480px',
                fontSize: '1.05rem',
                lineHeight: 1.5,
                color: '#5b21b6',
                margin: '0 0 20px 0',
              }}
            >
              Defend the miniature fairy dollhouse realm! Pilot your pastel flying machine, shoot glowing magical stars,
              and clear waves of adorable toy dragons, teddy bears, crowned frogs, and star bunnies.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '10px 20px',
                borderRadius: '16px',
                marginBottom: '24px',
                fontSize: '0.9rem',
                color: '#6b21a8',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              <span>⌨️ <b>A / D</b> or <b>← / →</b> to Move</span>
              <span>·</span>
              <span>⭐ <b>SPACE</b> to Shoot</span>
            </div>

            <button
              onClick={handleStartGame}
              style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '16px 42px',
                borderRadius: '99px',
                fontSize: '1.25rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(219, 39, 119, 0.4)',
                transform: 'scale(1)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              PLAY FAIRY INVADERS ✨
            </button>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'game-over' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 241, 242, 0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🌸</div>
            <h2
              style={{
                margin: '0 0 10px 0',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#be123c',
              }}
            >
              GAME OVER
            </h2>
            <p style={{ color: '#881337', margin: '0 0 16px 0', fontSize: '1rem' }}>
              {waveBanner || 'The fairy realm was overwhelmed!'}
            </p>

            {/* Scorecard */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px 36px',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(190, 18, 60, 0.12)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', color: '#9f1239', fontWeight: 600 }}>FINAL SCORE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#581c87' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#9f1239', fontWeight: 600 }}>WAVE REACHED</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#db2777' }}>{wave}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#9f1239', fontWeight: 600 }}>TICKETS WON</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669' }}>+{ticketsWon} 🎟️</div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 36px',
                borderRadius: '99px',
                fontSize: '1.15rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(126, 34, 206, 0.35)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Play Again 🔄
            </button>
          </div>
        )}

        {/* 3D WebGL Canvas Mount Node */}
        <div ref={containerRef} style={{ width: '100%', height: '600px', display: 'block' }} />
      </div>

      {/* Touch / Mobile / Desktop Accessibility Controls */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onPointerDown={() => {
            keysRef.current.left = true;
          }}
          onPointerUp={() => {
            keysRef.current.left = false;
          }}
          onPointerLeave={() => {
            keysRef.current.left = false;
          }}
          style={{
            background: '#2a1d4d',
            color: '#c8b6ff',
            border: '2px solid #c8b6ff',
            borderRadius: '14px',
            padding: '12px 28px',
            fontSize: '1.2rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ◀ Move Left
        </button>

        <button
          onPointerDown={() => {
            keysRef.current.shoot = true;
          }}
          onPointerUp={() => {
            keysRef.current.shoot = false;
          }}
          style={{
            background: '#ff8fab',
            color: '#2a1d4d',
            border: '2px solid #ffd166',
            borderRadius: '14px',
            padding: '12px 36px',
            fontSize: '1.2rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ⭐ Shoot
        </button>

        <button
          onPointerDown={() => {
            keysRef.current.right = true;
          }}
          onPointerUp={() => {
            keysRef.current.right = false;
          }}
          onPointerLeave={() => {
            keysRef.current.right = false;
          }}
          style={{
            background: '#2a1d4d',
            color: '#c8b6ff',
            border: '2px solid #c8b6ff',
            borderRadius: '14px',
            padding: '12px 28px',
            fontSize: '1.2rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Move Right ▶
        </button>
      </div>
    </div>
  );
}
