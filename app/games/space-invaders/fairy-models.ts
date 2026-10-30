import * as THREE from 'three';

// -------------------------------------------------------------
// Sims-Inspired Pastel Toy Palette
// -------------------------------------------------------------
export const PALETTE = {
  mint: 0x74c69d,
  mintLight: 0xb7e4c7,
  dustyPink: 0xff8fab,
  pinkLight: 0xffc2d1,
  rose: 0xfb6f92,
  creamYellow: 0xffe6a7,
  paleYellow: 0xfff3b0,
  lavender: 0xc8b6ff,
  lavenderLight: 0xe7c6ff,
  softBrown: 0xd4a373,
  caramel: 0xc38e70,
  darkBrown: 0x5a3d28,
  gold: 0xffd166,
  white: 0xffffff,
  glossyEye: 0x1f1f2e,
  cheeks: 0xff758f,
  frogGreen: 0x80ed99,
  mushroomStem: 0xfefae0,
  stageFloor: 0xf4edff,
  stageBorder: 0xfae1dd,
};

// Common Clay Material Factory
export function createClayMaterial(color: number, options?: { roughness?: number; metalness?: number; transparent?: boolean; opacity?: number }) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options?.roughness ?? 0.48,
    metalness: options?.metalness ?? 0.05,
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1.0,
  });
}

// -------------------------------------------------------------
// 1. Player Aircraft: Cute Pastel Flying Machine
// -------------------------------------------------------------
export function createPlayerCraft(): THREE.Group {
  const group = new THREE.Group();

  // Main Saucer / Cloud Body (soft lavender)
  const hullGeo = new THREE.SphereGeometry(1.2, 24, 16);
  hullGeo.scale(1.3, 0.45, 1.0);
  const hullMat = createClayMaterial(PALETTE.lavender);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.castShadow = true;
  group.add(hull);

  // Lower Trim Ring (dusty pink)
  const ringGeo = new THREE.TorusGeometry(1.15, 0.16, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = createClayMaterial(PALETTE.dustyPink);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = -0.05;
  group.add(ring);

  // Cockpit Bubble Canopy (translucent glassy bubble)
  const bubbleGeo = new THREE.SphereGeometry(0.65, 20, 16);
  bubbleGeo.scale(1, 0.85, 0.9);
  const bubbleMat = createClayMaterial(PALETTE.white, { roughness: 0.1, transparent: true, opacity: 0.65 });
  const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
  bubble.position.set(0, 0.28, -0.05);
  group.add(bubble);

  // Fairy Pilot inside Cockpit (cute head with flower/star)
  const pilotHeadGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const pilotHeadMat = createClayMaterial(PALETTE.creamYellow);
  const pilotHead = new THREE.Mesh(pilotHeadGeo, pilotHeadMat);
  pilotHead.position.set(0, 0.32, -0.05);
  group.add(pilotHead);

  // Pilot Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const cheekMat = createClayMaterial(PALETTE.cheeks);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.16, 0.3, 0.15);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.16;
  group.add(cheekL, cheekR);

  // Star Antenna on top
  const rodGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8);
  const rodMat = createClayMaterial(PALETTE.gold);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.set(0, 0.95, -0.05);
  group.add(rod);

  const starGeo = new THREE.OctahedronGeometry(0.18, 0);
  starGeo.scale(1, 1.4, 0.6);
  const star = new THREE.Mesh(starGeo, rodMat);
  star.position.set(0, 1.15, -0.05);
  group.add(star);

  // Cute Rounded Wings (pastel mint)
  const wingGeo = new THREE.BoxGeometry(0.8, 0.12, 0.6);
  const wingMat = createClayMaterial(PALETTE.mint);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-1.4, -0.05, 0);
  leftWing.rotation.z = 0.12;
  const rightWing = leftWing.clone();
  rightWing.position.x = 1.4;
  rightWing.rotation.z = -0.12;
  group.add(leftWing, rightWing);

  // Wing Tip Spheres (golden beads)
  const tipGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const tipL = new THREE.Mesh(tipGeo, rodMat);
  tipL.position.set(-1.82, -0.1, 0);
  const tipR = tipL.clone();
  tipR.position.x = 1.82;
  group.add(tipL, tipR);

  // Front Headlights / Magical Gems
  const gemGeo = new THREE.SphereGeometry(0.15, 12, 12);
  const gemMat = createClayMaterial(PALETTE.creamYellow, { roughness: 0.2 });
  const gemL = new THREE.Mesh(gemGeo, gemMat);
  gemL.position.set(-0.55, 0.05, 0.85);
  const gemR = gemL.clone();
  gemR.position.x = 0.55;
  group.add(gemL, gemR);

  // Rear Thruster Nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 12);
  nozzleGeo.rotateX(Math.PI / 2);
  const nozzleMat = createClayMaterial(PALETTE.dustyPink);
  const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzleL.position.set(-0.45, -0.08, -0.95);
  const nozzleR = nozzleL.clone();
  nozzleR.position.x = 0.45;
  group.add(nozzleL, nozzleR);

  return group;
}

// -------------------------------------------------------------
// 2. Row 1: Tiny Green Dragon (Row of 30 pts)
// -------------------------------------------------------------
export function createDragonMesh(): THREE.Group {
  const group = new THREE.Group();

  // Chubby Egg Body (Mint Green)
  const bodyGeo = new THREE.SphereGeometry(0.72, 18, 16);
  bodyGeo.scale(1.0, 1.15, 0.95);
  const bodyMat = createClayMaterial(PALETTE.mint);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Cream Belly Patch
  const bellyGeo = new THREE.SphereGeometry(0.48, 14, 14);
  bellyGeo.scale(0.85, 1.05, 0.4);
  const bellyMat = createClayMaterial(PALETTE.paleYellow);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.set(0, -0.12, 0.5);
  group.add(belly);

  // Cute Rounded Snout
  const snoutGeo = new THREE.SphereGeometry(0.28, 12, 12);
  snoutGeo.scale(1.1, 0.8, 0.9);
  const snout = new THREE.Mesh(snoutGeo, bodyMat);
  snout.position.set(0, 0.15, 0.65);
  group.add(snout);

  // Dark Nostril Dots
  const nosGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const nosMat = createClayMaterial(PALETTE.darkBrown);
  const nosL = new THREE.Mesh(nosGeo, nosMat);
  nosL.position.set(-0.1, 0.18, 0.88);
  const nosR = nosL.clone();
  nosR.position.x = 0.1;
  group.add(nosL, nosR);

  // Big Glossy Bead Eyes with Specular Highlights
  const eyeGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const eyeMat = createClayMaterial(PALETTE.glossyEye, { roughness: 0.15 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.35, 0.38, 0.5);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.35;

  const specGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const specMat = createClayMaterial(PALETTE.white, { roughness: 0.1 });
  const specL = new THREE.Mesh(specGeo, specMat);
  specL.position.set(-0.32, 0.43, 0.61);
  const specR = specL.clone();
  specR.position.x = 0.38;
  group.add(eyeL, eyeR, specL, specR);

  // Rosy Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.1, 8, 8);
  cheekGeo.scale(1, 0.6, 0.3);
  const cheekMat = createClayMaterial(PALETTE.cheeks);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.48, 0.18, 0.45);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.48;
  group.add(cheekL, cheekR);

  // Little Golden Horn Buds
  const hornGeo = new THREE.ConeGeometry(0.12, 0.32, 10);
  hornGeo.rotateX(-0.3);
  const hornMat = createClayMaterial(PALETTE.gold);
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(-0.28, 0.85, -0.08);
  hornL.rotation.z = -0.25;
  const hornR = hornL.clone();
  hornR.position.x = 0.28;
  hornR.rotation.z = 0.25;
  group.add(hornL, hornR);

  // Cute Little Wings on Back (Dusty Pink)
  const wingGroup = new THREE.Group();
  wingGroup.name = 'wings';
  const wingGeo = new THREE.SphereGeometry(0.35, 10, 8);
  wingGeo.scale(1.1, 0.45, 0.15);
  const wingMat = createClayMaterial(PALETTE.dustyPink);
  const wL = new THREE.Mesh(wingGeo, wingMat);
  wL.position.set(-0.55, 0.2, -0.45);
  wL.rotation.y = 0.4;
  wL.rotation.z = 0.3;
  const wR = wL.clone();
  wR.position.x = 0.55;
  wR.rotation.y = -0.4;
  wR.rotation.z = -0.3;
  wingGroup.add(wL, wR);
  group.add(wingGroup);

  return group;
}

// -------------------------------------------------------------
// 3. Row 2: Pink Teddy-Bear Monster (Row of 20 pts)
// -------------------------------------------------------------
export function createBearMesh(): THREE.Group {
  const group = new THREE.Group();

  // Chubby Head Body (Dusty Pink)
  const headGeo = new THREE.SphereGeometry(0.72, 18, 16);
  headGeo.scale(1.08, 1.0, 0.95);
  const headMat = createClayMaterial(PALETTE.dustyPink);
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  group.add(head);

  // Round Teddy Ears
  const earGeo = new THREE.SphereGeometry(0.28, 12, 12);
  const earInnerGeo = new THREE.SphereGeometry(0.16, 10, 10);
  earInnerGeo.scale(1, 1, 0.4);
  const earInnerMat = createClayMaterial(PALETTE.creamYellow);

  const earL = new THREE.Mesh(earGeo, headMat);
  earL.position.set(-0.58, 0.62, 0);
  const earInL = new THREE.Mesh(earInnerGeo, earInnerMat);
  earInL.position.set(-0.58, 0.62, 0.16);

  const earR = earL.clone();
  earR.position.x = 0.58;
  const earInR = earInL.clone();
  earInR.position.x = 0.58;
  group.add(earL, earInL, earR, earInR);

  // Soft Cream Muzzle
  const muzzleGeo = new THREE.SphereGeometry(0.32, 14, 12);
  muzzleGeo.scale(1.15, 0.85, 0.7);
  const muzzleMat = createClayMaterial(PALETTE.creamYellow);
  const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzle.position.set(0, -0.05, 0.55);
  group.add(muzzle);

  // Chocolate Button Nose
  const noseGeo = new THREE.SphereGeometry(0.1, 10, 10);
  noseGeo.scale(1.2, 0.8, 0.7);
  const noseMat = createClayMaterial(PALETTE.darkBrown);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0.06, 0.82);
  group.add(nose);

  // Cute Button Eyes
  const eyeGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const eyeMat = createClayMaterial(PALETTE.glossyEye);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.3, 0.25, 0.55);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.3;

  const specGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const specMat = createClayMaterial(PALETTE.white);
  const specL = new THREE.Mesh(specGeo, specMat);
  specL.position.set(-0.28, 0.28, 0.65);
  const specR = specL.clone();
  specR.position.x = 0.32;
  group.add(eyeL, eyeR, specL, specR);

  // Rosy Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.11, 8, 8);
  cheekGeo.scale(1, 0.6, 0.3);
  const cheekMat = createClayMaterial(PALETTE.rose);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.46, 0.06, 0.52);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.46;
  group.add(cheekL, cheekR);

  // Stubby Bear Paws waving in front
  const pawGeo = new THREE.SphereGeometry(0.2, 10, 10);
  const pawMat = createClayMaterial(PALETTE.dustyPink);
  const pawL = new THREE.Mesh(pawGeo, pawMat);
  pawL.position.set(-0.42, -0.45, 0.42);
  const pawR = pawL.clone();
  pawR.position.x = 0.42;
  group.add(pawL, pawR);

  return group;
}

// -------------------------------------------------------------
// 4. Row 3: Little Crowned Frog (Row of 15 pts)
// -------------------------------------------------------------
export function createFrogMesh(): THREE.Group {
  const group = new THREE.Group();

  // Wide Squishy Body (Pastel Lime/Sage Green)
  const bodyGeo = new THREE.SphereGeometry(0.72, 18, 16);
  bodyGeo.scale(1.22, 0.88, 0.98);
  const bodyMat = createClayMaterial(PALETTE.frogGreen);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Cream Belly
  const bellyGeo = new THREE.SphereGeometry(0.48, 12, 12);
  bellyGeo.scale(1.1, 0.75, 0.4);
  const bellyMat = createClayMaterial(PALETTE.paleYellow);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.set(0, -0.18, 0.52);
  group.add(belly);

  // Giant Bulbous Frog Eyes on top
  const socketGeo = new THREE.SphereGeometry(0.28, 14, 14);
  const socketL = new THREE.Mesh(socketGeo, bodyMat);
  socketL.position.set(-0.45, 0.55, 0.15);
  const socketR = socketL.clone();
  socketR.position.x = 0.45;

  const eyeGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const eyeMat = createClayMaterial(PALETTE.white);
  const eyeballL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeballL.position.set(-0.45, 0.58, 0.28);
  const eyeballR = eyeballL.clone();
  eyeballR.position.x = 0.45;

  const pupilGeo = new THREE.SphereGeometry(0.1, 10, 10);
  const pupilMat = createClayMaterial(PALETTE.glossyEye);
  const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
  pupilL.position.set(-0.44, 0.58, 0.42);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.44;

  const specGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const specMat = createClayMaterial(PALETTE.white);
  const specL = new THREE.Mesh(specGeo, specMat);
  specL.position.set(-0.41, 0.62, 0.49);
  const specR = specL.clone();
  specR.position.x = 0.47;

  group.add(socketL, socketR, eyeballL, eyeballR, pupilL, pupilR, specL, specR);

  // Tiny Shiny Golden Crown on Head
  const crownGroup = new THREE.Group();
  const crownBaseGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.12, 12);
  const crownMat = createClayMaterial(PALETTE.gold, { metalness: 0.2, roughness: 0.35 });
  const crownBase = new THREE.Mesh(crownBaseGeo, crownMat);
  crownGroup.add(crownBase);

  // 3 Crown Spikes
  const spikeGeo = new THREE.ConeGeometry(0.08, 0.22, 8);
  const spike1 = new THREE.Mesh(spikeGeo, crownMat);
  spike1.position.set(-0.16, 0.14, 0);
  const spike2 = new THREE.Mesh(spikeGeo, crownMat);
  spike2.position.set(0, 0.18, 0);
  const spike3 = new THREE.Mesh(spikeGeo, crownMat);
  spike3.position.set(0.16, 0.14, 0);
  crownGroup.add(spike1, spike2, spike3);

  crownGroup.position.set(0.06, 0.72, 0.05);
  crownGroup.rotation.z = -0.15;
  group.add(crownGroup);

  // Rosy Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.12, 8, 8);
  cheekGeo.scale(1, 0.5, 0.3);
  const cheekMat = createClayMaterial(PALETTE.cheeks);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.52, -0.02, 0.55);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.52;
  group.add(cheekL, cheekR);

  return group;
}

// -------------------------------------------------------------
// 5. Row 4: Magical Winged Star Bunny (Row of 10 pts)
// -------------------------------------------------------------
export function createBunnyMesh(): THREE.Group {
  const group = new THREE.Group();

  // Cream Bunny Body
  const bodyGeo = new THREE.SphereGeometry(0.7, 18, 16);
  bodyGeo.scale(1.0, 1.05, 0.95);
  const bodyMat = createClayMaterial(PALETTE.white);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  // Long Floppy Lavender Ears
  const earGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.85, 12);
  earGeo.scale(1, 1, 0.55);
  const earMat = createClayMaterial(PALETTE.lavender);
  const earL = new THREE.Mesh(earGeo, earMat);
  earL.position.set(-0.38, 0.92, -0.05);
  earL.rotation.z = -0.28;
  earL.rotation.x = -0.1;

  const earR = earL.clone();
  earR.position.x = 0.38;
  earR.rotation.z = 0.28;
  group.add(earL, earR);

  // Pink Ear Inner Strips
  const inGeo = new THREE.CylinderGeometry(0.07, 0.12, 0.65, 8);
  inGeo.scale(1, 1, 0.3);
  const inMat = createClayMaterial(PALETTE.pinkLight);
  const inL = new THREE.Mesh(inGeo, inMat);
  inL.position.set(-0.37, 0.9, 0.04);
  inL.rotation.z = -0.28;
  const inR = inL.clone();
  inR.position.x = 0.37;
  inR.rotation.z = 0.28;
  group.add(inL, inR);

  // Cute Little Muzzle & Nose
  const muzzleGeo = new THREE.SphereGeometry(0.24, 12, 10);
  muzzleGeo.scale(1.2, 0.8, 0.6);
  const muzzleMat = createClayMaterial(PALETTE.creamYellow);
  const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzle.position.set(0, 0.05, 0.58);
  group.add(muzzle);

  const noseGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const noseMat = createClayMaterial(PALETTE.rose);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0.12, 0.76);
  group.add(nose);

  // Cheerful Eyes
  const eyeGeo = new THREE.SphereGeometry(0.1, 10, 10);
  const eyeMat = createClayMaterial(PALETTE.glossyEye);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.28, 0.28, 0.54);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.28;

  const specGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const specMat = createClayMaterial(PALETTE.white);
  const specL = new THREE.Mesh(specGeo, specMat);
  specL.position.set(-0.26, 0.31, 0.63);
  const specR = specL.clone();
  specR.position.x = 0.3;
  group.add(eyeL, eyeR, specL, specR);

  // Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.1, 8, 8);
  cheekGeo.scale(1, 0.6, 0.3);
  const cheekMat = createClayMaterial(PALETTE.cheeks);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.44, 0.1, 0.5);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.44;
  group.add(cheekL, cheekR);

  // Tiny Magical Wings
  const wingGeo = new THREE.SphereGeometry(0.32, 10, 8);
  wingGeo.scale(1.1, 0.5, 0.15);
  const wingMat = createClayMaterial(PALETTE.lavenderLight);
  const wL = new THREE.Mesh(wingGeo, wingMat);
  wL.position.set(-0.58, 0.15, -0.4);
  wL.rotation.y = 0.4;
  const wR = wL.clone();
  wR.position.x = 0.58;
  wR.rotation.y = -0.4;
  group.add(wL, wR);

  return group;
}

// -------------------------------------------------------------
// 6. Mystery Visitor: Floating Star Cloud (Classic UFO bonus)
// -------------------------------------------------------------
export function createMysteryStarMesh(): THREE.Group {
  const group = new THREE.Group();

  // Fluffy Pastel Cloud Body
  const cloudMat = createClayMaterial(PALETTE.lavenderLight);
  const centerBall = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), cloudMat);
  const ballL = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 14), cloudMat);
  ballL.position.set(-0.65, -0.1, 0);
  const ballR = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 14), cloudMat);
  ballR.position.set(0.68, -0.08, 0);
  group.add(centerBall, ballL, ballR);

  // Giant Sparkling Star Sitting on Top
  const starGeo = new THREE.OctahedronGeometry(0.65, 0);
  starGeo.scale(1.1, 1.3, 0.7);
  const starMat = createClayMaterial(PALETTE.gold, { roughness: 0.25 });
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(0, 0.65, 0.1);
  group.add(star);

  // Cute Face on the Star!
  const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const eyeMat = createClayMaterial(PALETTE.glossyEye);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.2, 0.75, 0.52);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.2;
  const cheekGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const cheekMat = createClayMaterial(PALETTE.cheeks);
  const chL = new THREE.Mesh(cheekGeo, cheekMat);
  chL.position.set(-0.32, 0.64, 0.45);
  const chR = chL.clone();
  chR.position.x = 0.32;
  group.add(eyeL, eyeR, chL, chR);

  return group;
}

// -------------------------------------------------------------
// 7. Mushroom Defense Barriers (Classic Bunkers)
// -------------------------------------------------------------
export function createMushroomShield(color: number): THREE.Group {
  const group = new THREE.Group();

  // Stem (Soft Cream)
  const stemGeo = new THREE.CylinderGeometry(0.45, 0.6, 0.9, 16);
  const stemMat = createClayMaterial(PALETTE.mushroomStem);
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = -0.45;
  stem.castShadow = true;
  group.add(stem);

  // Cap (Pastel Color: Mint, Pink, or Yellow)
  const capGeo = new THREE.SphereGeometry(1.25, 20, 16);
  capGeo.scale(1.15, 0.7, 1.15);
  const capMat = createClayMaterial(color);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.15;
  cap.castShadow = true;
  cap.name = 'cap';
  group.add(cap);

  // Cute White Polka Dots on Cap
  const dotGeo = new THREE.SphereGeometry(0.18, 10, 8);
  dotGeo.scale(1, 0.3, 1);
  const dotMat = createClayMaterial(PALETTE.white);

  const dot1 = new THREE.Mesh(dotGeo, dotMat);
  dot1.position.set(0, 0.72, 0);
  const dot2 = new THREE.Mesh(dotGeo, dotMat);
  dot2.position.set(-0.65, 0.45, 0.45);
  dot2.rotation.z = 0.4;
  const dot3 = new THREE.Mesh(dotGeo, dotMat);
  dot3.position.set(0.65, 0.45, 0.45);
  dot3.rotation.z = -0.4;
  const dot4 = new THREE.Mesh(dotGeo, dotMat);
  dot4.position.set(0, 0.42, 0.85);
  dot4.rotation.x = -0.4;
  group.add(dot1, dot2, dot3, dot4);

  return group;
}

// -------------------------------------------------------------
// 8. Projectiles: Magical Stars & Bubbly Droplets
// -------------------------------------------------------------
export function createPlayerStarProjectile(): THREE.Mesh {
  const geo = new THREE.OctahedronGeometry(0.35, 0);
  geo.scale(1, 1.25, 0.6);
  const mat = createClayMaterial(PALETTE.gold, { roughness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

export function createEnemyDropletProjectile(): THREE.Group {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    createClayMaterial(PALETTE.dustyPink, { roughness: 0.3 })
  );
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.45, 10),
    createClayMaterial(PALETTE.dustyPink, { roughness: 0.3 })
  );
  cone.position.y = 0.22;
  group.add(sphere, cone);
  return group;
}

// -------------------------------------------------------------
// 9. Particle Effect: Star / Fairy Dust Explosion
// -------------------------------------------------------------
export class ParticleEmitter {
  scene: THREE.Scene;
  particles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number; rotSpeed: number }[] = [];
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geos = [
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.BoxGeometry(0.16, 0.16, 0.16),
    ];
    this.mats = [
      createClayMaterial(PALETTE.gold),
      createClayMaterial(PALETTE.dustyPink),
      createClayMaterial(PALETTE.mint),
      createClayMaterial(PALETTE.lavender),
      createClayMaterial(PALETTE.paleYellow),
    ];
  }

  burst(x: number, y: number, z: number, count = 16) {
    for (let i = 0; i < count; i++) {
      const geo = this.geos[Math.floor(Math.random() * this.geos.length)];
      const mat = this.mats[Math.floor(Math.random() * this.mats.length)];
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (Math.random() * 2),
        vz: (Math.random() - 0.5) * 3,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        rotSpeed: (Math.random() - 0.5) * 12,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 8.0 * dt; // gentle gravity
      p.mesh.rotation.x += p.rotSpeed * dt;
      p.mesh.rotation.y += p.rotSpeed * dt;
      const progress = 1 - (p.life / p.maxLife);
      p.mesh.scale.setScalar(Math.max(0.01, progress));
    }
  }

  clear() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.particles = [];
  }
}
