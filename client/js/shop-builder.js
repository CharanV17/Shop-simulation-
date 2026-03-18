/* ═══════════════════════════════════════════════════════════
   shop-builder.js — Builds the 3D room for each shop
   Room: floor, ceiling, 4 walls, shelf units, lights, decor
═══════════════════════════════════════════════════════════ */

const SHOP_OBJECTS = [];   // track everything added so we can tear it down

/* ── Main builder ─────────────────────────────────────── */
export function buildShopEnvironment(scene, shopData) {
  if (shopData.id === 'fresh-market') {
    buildFreshMarketEnvironment(scene, shopData);
    return;
  }

  const t = shopData.theme;
  const accentColor = new THREE.Color(t.accent);
  const floorColor  = new THREE.Color(t.floor);
  const wallColor   = new THREE.Color(t.wall);

  buildFloor(scene, floorColor, accentColor);
  buildCeiling(scene, wallColor, accentColor);
  buildWalls(scene, wallColor, accentColor);
  buildShelves(scene, t);
  buildLighting(scene, t, accentColor);
  buildShopSign(scene, shopData, accentColor);
  buildDecorLines(scene, accentColor);
}

/* ── Fresh Market custom environment ─────────────────── */
function buildFreshMarketEnvironment(scene, shopData) {
  const t = shopData.theme;

  const woodTex = createWoodTexture('#8b5e3c', '#6b4226', '#a3754d');
  const woodTexDark = createWoodTexture('#6b4226', '#4f2f1b', '#7a5132');
  woodTex.repeat.set(2.5, 1.2);
  woodTexDark.repeat.set(2.5, 1.2);
  woodTex.needsUpdate = true;
  woodTexDark.needsUpdate = true;

  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0xffffff, roughness: 0.88, metalness: 0.02 });
  const woodDarkMat = new THREE.MeshStandardMaterial({ map: woodTexDark, color: 0xffffff, roughness: 0.92, metalness: 0.01 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xf3efe3, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  const clothGreenMat = new THREE.MeshStandardMaterial({ color: 0x5a7f45, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  const plasterMat = new THREE.MeshStandardMaterial({ color: 0xceb89d, roughness: 0.95, metalness: 0.0 });

  // Ground
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({ color: 0x2c2118, roughness: 0.98, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  // Rough plank seams on floor for handmade market feel.
  for (let z = -12; z <= 12; z += 1.2) {
    const seam = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x1e1510, roughness: 1.0, metalness: 0.0 })
    );
    seam.rotation.x = -Math.PI / 2;
    seam.position.set(0, 0.002, z);
    add(scene, seam);
  }

  // Back + side walls
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(24, 10), plasterMat);
  backWall.position.set(0, 5, -9);
  add(scene, backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), plasterMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-11, 5, -0.3);
  add(scene, leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), plasterMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(11, 5, -0.3);
  add(scene, rightWall);

  // Timber beam frame
  [-8.5, -4.2, 0, 4.2, 8.5].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.8, 0.24), woodDarkMat);
    post.position.set(x, 3.4, -5.6);
    post.castShadow = true;
    add(scene, post);
  });

  const beamTop = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.26, 0.26), woodDarkMat);
  beamTop.position.set(0, 6.8, -5.6);
  add(scene, beamTop);

  // Striped awning
  const awningY = 6.45;
  const awningZ = -3.6;
  const awningDepth = 4.2;
  const awningWidth = 18;
  const stripes = 14;
  for (let i = 0; i < stripes; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(awningWidth / stripes + 0.02, awningDepth),
      i % 2 === 0 ? clothMat : clothGreenMat
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-awningWidth / 2 + (i + 0.5) * (awningWidth / stripes), awningY, awningZ);
    add(scene, stripe);
  }

  // Main display tables
  addMarketTable(scene, -5.5, -2.9, 6.0, 1.8, woodMat, woodDarkMat);
  addMarketTable(scene,  1.6, -2.9, 6.2, 1.8, woodMat, woodDarkMat);
  addMarketTable(scene,  0.0, -5.3, 11.2, 1.5, woodMat, woodDarkMat);

  // Tighter hero cluster inspired by reference (foreground stack + adjacent crates)
  addDecorCrate(scene, -6.8, 1.00, -2.9, 1.55, 0.78, 1.05, woodMat, woodDarkMat, 'bread', -0.06, 'hero');
  addDecorCrate(scene, -5.0, 1.03, -2.82, 1.55, 0.78, 1.05, woodMat, woodDarkMat, 'tomato', 0.04, 'hero');
  addDecorCrate(scene, -3.2, 1.01, -2.95, 1.55, 0.78, 1.05, woodMat, woodDarkMat, 'cucumber', -0.04, 'hero');
  addDecorCrate(scene,  2.95, 1.03, -2.95, 1.5, 0.88, 1.12, woodMat, woodDarkMat, 'cucumber', 0.03, 'hero');
  addDecorCrate(scene,  1.5,  0.56, -4.2,  1.2, 0.64, 0.96, woodMat, woodDarkMat, 'eggplant', -0.09, 'hero');
  addDecorCrate(scene,  4.8,  0.56, -4.1,  1.2, 0.64, 0.96, woodMat, woodDarkMat, 'bread', 0.08, 'hero');

  // Reduced back row for depth while keeping focus on front composition
  addDecorCrate(scene, -3.9, 0.82, -6.05, 1.12, 0.58, 0.86, woodMat, woodDarkMat, 'orange', 0.03);
  addDecorCrate(scene, -2.5, 0.82, -6.1,  1.12, 0.58, 0.86, woodMat, woodDarkMat, 'carrot', -0.04);
  addDecorCrate(scene, -1.1, 0.82, -6.0,  1.12, 0.58, 0.86, woodMat, woodDarkMat, 'broccoli', 0.02);
  addDecorCrate(scene,  0.3, 0.82, -6.1,  1.12, 0.58, 0.86, woodMat, woodDarkMat, 'banana', -0.03);
  addDecorCrate(scene,  1.7, 0.82, -6.0,  1.12, 0.58, 0.86, woodMat, woodDarkMat, 'tomato', 0.03);

  // Warm market lighting
  const amb = new THREE.AmbientLight(0xffe5c6, 0.55);
  add(scene, amb);

  const topWarm = new THREE.DirectionalLight(0xffd39f, 0.9);
  topWarm.position.set(5, 11, 3);
  topWarm.castShadow = true;
  topWarm.shadow.mapSize.set(1024, 1024);
  add(scene, topWarm);

  [-6.2, -2.2, 1.8, 5.8].forEach((x) => {
    const lamp = new THREE.PointLight(0xffc87a, 1.2, 9, 2);
    lamp.position.set(x, 5.8, -3.4);
    add(scene, lamp);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffe9b3, emissive: 0xffc96a, emissiveIntensity: 1.8 })
    );
    bulb.position.copy(lamp.position);
    add(scene, bulb);
  });

  // Rustic sign board instead of neon panel
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 0.12), woodDarkMat);
  signBoard.position.set(0, 7.8, -8.85);
  add(scene, signBoard);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 220;
  const signCtx = signCanvas.getContext('2d');
  signCtx.fillStyle = '#6b4226';
  signCtx.fillRect(0, 0, 1024, 220);
  signCtx.fillStyle = '#f9f3df';
  signCtx.font = '700 78px Syne';
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.fillText(`${shopData.emoji}  ${shopData.name.toUpperCase()}`, 512, 110);

  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signText = new THREE.Mesh(
    new THREE.PlaneGeometry(4.9, 0.95),
    new THREE.MeshStandardMaterial({ map: signTexture })
  );
  signText.position.set(0, 7.8, -8.78);
  add(scene, signText);

  // Subtle accent so theme color still appears in this warm environment
  const accentLine = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 0.02, 0.04),
    new THREE.MeshStandardMaterial({ color: t.accent, emissive: t.accent, emissiveIntensity: 0.15, transparent: true, opacity: 0.6 })
  );
  accentLine.position.set(0, 0.04, -4.6);
  add(scene, accentLine);
}

function addMarketTable(scene, x, z, width, depth, woodMat, woodDarkMat) {
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, depth), woodMat);
  top.position.set(x, 0.98, z);
  top.castShadow = true;
  top.receiveShadow = true;
  add(scene, top);

  [-width / 2 + 0.28, width / 2 - 0.28].forEach((dx) => {
    [-depth / 2 + 0.24, depth / 2 - 0.24].forEach((dz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.96, 0.16), woodDarkMat);
      leg.position.set(x + dx, 0.48, z + dz);
      leg.castShadow = true;
      add(scene, leg);
    });
  });
}

function addDecorCrate(scene, x, y, z, w, h, d, woodMat, woodDarkMat, fillType, rotY = 0, profile = 'full') {
  const g = new THREE.Group();

  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, d), woodMat);
  base.position.y = 0;
  g.add(base);

  const frontHeight = profile === 'hero' ? h * 0.52 : h;
  const frontGeo = new THREE.BoxGeometry(w, frontHeight, 0.05);
  const backGeo = new THREE.BoxGeometry(w, h, 0.05);
  const sideGeo = new THREE.BoxGeometry(0.05, h, d);
  const front = new THREE.Mesh(frontGeo, woodMat);
  front.position.set(0, frontHeight / 2, d / 2);
  g.add(front);

  const back = new THREE.Mesh(backGeo, woodMat);
  back.position.set(0, h / 2, -d / 2);
  g.add(back);

  const left = new THREE.Mesh(sideGeo, woodMat);
  left.position.set(-w / 2, h / 2, 0);
  g.add(left);

  const right = new THREE.Mesh(sideGeo, woodMat);
  right.position.set(w / 2, h / 2, 0);
  g.add(right);

  [0.18, 0.4, 0.62].forEach((rowY) => {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, 0.016, 0.01), woodDarkMat);
    const frontRefH = profile === 'hero' ? frontHeight : h;
    slat.position.set(0, Math.min(rowY * frontRefH, frontRefH - 0.03), d / 2 + 0.025);
    g.add(slat);
  });

  const fill = buildCrateFill(fillType, w, d);
  fill.position.y = profile === 'hero' ? 0.14 : 0.06;
  g.add(fill);

  g.position.set(x, y, z);
  g.rotation.y = rotY;
  g.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  add(scene, g);
}

function createWoodTexture(base, mid, lines) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 7) {
    const a = 0.08 + ((y % 21) / 21) * 0.07;
    ctx.strokeStyle = `rgba(0,0,0,${a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.11) * 2);
    ctx.bezierCurveTo(150, y + 3, 340, y - 3, 512, y + Math.cos(y * 0.09) * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 1.4 + 0.4;
    ctx.fillStyle = i % 2 === 0 ? mid : lines;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function buildCrateFill(fillType, w, d) {
  const fillGroup = new THREE.Group();

  const makePiece = (geo, mat, px, py, pz, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    fillGroup.add(m);
  };

  const limW = w * 0.34;
  const limD = d * 0.31;

  if (fillType === 'bread') {
    const breadMat = new THREE.MeshStandardMaterial({ color: 0xcfae87, roughness: 0.85, metalness: 0.0 });
    for (let i = 0; i < 6; i++) {
      const px = -limW + (i % 3) * limW;
      const pz = -limD + Math.floor(i / 3) * limD * 1.3;
      makePiece(new THREE.SphereGeometry(0.17, 10, 8), breadMat, px, 0.18 + (i % 2) * 0.04, pz, 0, i * 0.35, 0);
    }
    return fillGroup;
  }

  if (fillType === 'cucumber') {
    const vegMat = new THREE.MeshStandardMaterial({ color: 0x6b8f43, roughness: 0.7, metalness: 0.0 });
    for (let i = 0; i < 10; i++) {
      const px = -limW + (i % 5) * (limW * 0.5);
      const pz = -limD + Math.floor(i / 5) * (limD * 1.25);
      makePiece(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 8), vegMat, px, 0.18 + (i % 3) * 0.02, pz, Math.PI / 2, i * 0.32, 0.4);
    }
    return fillGroup;
  }

  if (fillType === 'eggplant') {
    const eggMat = new THREE.MeshStandardMaterial({ color: 0x5c3c7a, roughness: 0.55, metalness: 0.0 });
    for (let i = 0; i < 8; i++) {
      const px = -limW + (i % 4) * (limW * 0.64);
      const pz = -limD + Math.floor(i / 4) * (limD * 1.45);
      makePiece(new THREE.SphereGeometry(0.1, 9, 7), eggMat, px, 0.17 + (i % 2) * 0.03, pz);
    }
    return fillGroup;
  }

  if (fillType === 'orange') {
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xe98221, roughness: 0.55, metalness: 0.0 });
    for (let i = 0; i < 10; i++) {
      const px = -limW + (i % 5) * (limW * 0.5);
      const pz = -limD + Math.floor(i / 5) * (limD * 1.3);
      makePiece(new THREE.SphereGeometry(0.095, 10, 8), orangeMat, px, 0.15 + (i % 3) * 0.02, pz);
    }
    return fillGroup;
  }

  if (fillType === 'carrot') {
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xe06514, roughness: 0.65, metalness: 0.0 });
    for (let i = 0; i < 12; i++) {
      const px = -limW + (i % 6) * (limW * 0.4);
      const pz = -limD + Math.floor(i / 6) * (limD * 1.2);
      makePiece(new THREE.CylinderGeometry(0.025, 0.06, 0.24, 7), carrotMat, px, 0.14 + (i % 2) * 0.02, pz, Math.PI / 2, i * 0.2, 0.3);
    }
    return fillGroup;
  }

  if (fillType === 'broccoli') {
    const brocMat = new THREE.MeshStandardMaterial({ color: 0x2f7a24, roughness: 0.8, metalness: 0.0 });
    for (let i = 0; i < 8; i++) {
      const px = -limW + (i % 4) * (limW * 0.64);
      const pz = -limD + Math.floor(i / 4) * (limD * 1.45);
      makePiece(new THREE.SphereGeometry(0.1, 9, 7), brocMat, px, 0.16 + (i % 2) * 0.03, pz);
    }
    return fillGroup;
  }

  if (fillType === 'banana') {
    const bananaMat = new THREE.MeshStandardMaterial({ color: 0xe7c63c, roughness: 0.6, metalness: 0.0 });
    for (let i = 0; i < 10; i++) {
      const px = -limW + (i % 5) * (limW * 0.5);
      const pz = -limD + Math.floor(i / 5) * (limD * 1.3);
      makePiece(new THREE.TorusGeometry(0.07, 0.02, 6, 9, Math.PI * 0.8), bananaMat, px, 0.14 + (i % 2) * 0.025, pz, Math.PI / 2, i * 0.2, 0.2);
    }
    return fillGroup;
  }

  // default tomato-like fill
  const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xc92b18, roughness: 0.5, metalness: 0.0 });
  for (let i = 0; i < 12; i++) {
    const px = -limW + (i % 6) * (limW * 0.4);
    const pz = -limD + Math.floor(i / 6) * (limD * 1.2);
    makePiece(new THREE.SphereGeometry(0.085, 9, 7), tomatoMat, px, 0.14 + (i % 3) * 0.02, pz);
  }

  return fillGroup;
}

/* ── Floor ────────────────────────────────────────────── */
function buildFloor(scene, floorColor, accentColor) {
  // Ultra-glossy white base (if tech hub)
  const isCleanWhite = floorColor.getHex() === 0x0d1a2e || floorColor.getHex() === 0xffffff; 
  const finalColor = isCleanWhite ? new THREE.Color(0xfcfcff) : floorColor;

  const geo = new THREE.PlaneGeometry(40, 40, 1, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: finalColor,
    roughness: 0.05,
    metalness: 0.4,
    envMapIntensity: 1.0
  });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  // Large Tiled grid (Luxury feel)
  const grid = new THREE.GridHelper(40, 20, 0x000000, 0x000000);
  grid.material.transparent = true;
  grid.material.opacity = 0.03;
  grid.position.y = 0.001;
  add(scene, grid);

  // Center aisle reflective "Glass" strip
  const stripGeo = new THREE.PlaneGeometry(4, 40);
  const stripMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.02,
    roughness: 0.0,
    metalness: 1.0,
    transparent: true,
    opacity: 0.1
  });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = 0.002;
  add(scene, strip);
}

/* ── Ceiling ──────────────────────────────────────────── */
function buildCeiling(scene, wallColor, accentColor) {
  // Determine ceiling colour: use white only for genuinely bright shop themes
  const wallLum = wallColor.r * 0.299 + wallColor.g * 0.587 + wallColor.b * 0.114;
  const col = wallLum > 0.4 ? new THREE.Color(0xffffff) : wallColor;

  // Main high ceiling
  const geo = new THREE.PlaneGeometry(40, 40);
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, metalness: 0.0 });
  const ceiling = new THREE.Mesh(geo, mat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 7.5;
  add(scene, ceiling);

  // Tiered "Light Cove" frame
  const coveGeo = new THREE.BoxGeometry(16, 0.4, 16);
  const coveMat = new THREE.MeshStandardMaterial({ color: col, roughness: 1.0 });
  const cove = new THREE.Mesh(coveGeo, coveMat);
  cove.position.set(0, 7.3, 0);
  add(scene, cove);

  // Perimeter Glow for Cove — tinted to shop accent, low intensity for dark shops
  const glowGeo = new THREE.PlaneGeometry(15.8, 15.8);
  const panelColor = wallLum > 0.4 ? new THREE.Color(0xffffff) : accentColor.clone().multiplyScalar(0.15);
  const glowMat = new THREE.MeshStandardMaterial({
    color: panelColor,
    emissive: panelColor,
    emissiveIntensity: wallLum > 0.4 ? 1.5 : 0.4,
    roughness: 0.1, transparent: true,
    opacity: wallLum > 0.4 ? 0.9 : 0.25
  });
  const lightPanel = new THREE.Mesh(glowGeo, glowMat);
  lightPanel.rotation.x = Math.PI / 2;
  lightPanel.position.y = 7.08;
  add(scene, lightPanel);

  // Spotlight meshes
  const spotGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
  const spotMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
  
  for(let x = -6; x <= 6; x += 3) {
    for(let z = -6; z <= 6; z += 3) {
      if(Math.abs(x) < 2 && Math.abs(z) < 2) continue; // skip center
      const s = new THREE.Mesh(spotGeo, spotMat);
      s.position.set(x, 7.09, z);
      add(scene, s);
    }
  }
}

/* ── Walls ────────────────────────────────────────────── */
function buildWalls(scene, wallColor, accentColor) {
  const wallLum = wallColor.r * 0.299 + wallColor.g * 0.587 + wallColor.b * 0.114;
  const col = wallLum > 0.4 ? new THREE.Color(0xf5f5f7) : wallColor;
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.05 });
  
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 0.95, opacity: 1, transparent: true,
    metalness: 0, roughness: 0.05, ior: 1.5, thickness: 0.1,
    specularIntensity: 1, specularColor: 0xffffff, envMapIntensity: 1
  });

  // Back wall (Split with recessed niche)
  const wallGroup = new THREE.Group();
  
  // Outer wall parts
  const sideGeo = new THREE.PlaneGeometry(7.5, 7.5);
  const leftW = new THREE.Mesh(sideGeo, mat);
  leftW.position.set(-6, 3.75, -8);
  wallGroup.add(leftW);

  const rightW = leftW.clone();
  rightW.position.x = 6;
  wallGroup.add(rightW);

  // Recessed Niche for Sign/Logo
  const nicheGeo = new THREE.PlaneGeometry(4.5, 4.5);
  const nicheW = new THREE.Mesh(nicheGeo, mat);
  nicheW.position.set(0, 5.25, -8.3); // Recessed
  wallGroup.add(nicheW);

  // Side return walls for niche
  const retGeo = new THREE.PlaneGeometry(0.3, 4.5);
  const leftR = new THREE.Mesh(retGeo, mat);
  leftR.rotation.y = Math.PI/2;
  leftR.position.set(-2.25, 5.25, -8.15);
  wallGroup.add(leftR);

  const rightR = leftR.clone();
  rightR.rotation.y = -Math.PI/2;
  rightR.position.set(2.25, 5.25, -8.15);
  wallGroup.add(rightR);

  // Left & Right Glass Partition Walls
  const glassGeo = new THREE.PlaneGeometry(20, 7.5);
  const leftG = new THREE.Mesh(glassGeo, glassMat);
  leftG.rotation.y = Math.PI / 2;
  leftG.position.set(-8.5, 3.75, 0);
  wallGroup.add(leftG);

  const rightG = leftG.clone();
  rightG.rotation.y = -Math.PI / 2;
  rightG.position.set(8.5, 3.75, 0);
  wallGroup.add(rightG);

  // Concrete style outer walls behind glass
  const outGeo = new THREE.PlaneGeometry(22, 10);
  const leftO = new THREE.Mesh(outGeo, mat);
  leftO.rotation.y = Math.PI/2;
  leftO.position.set(-10, 5, 0);
  wallGroup.add(leftO);

  const rightO = leftO.clone();
  rightO.rotation.y = -Math.PI/2;
  rightO.position.set(10, 5, 0);
  wallGroup.add(rightO);

  add(scene, wallGroup);
}



/* ── Shelf units ──────────────────────────────────────── */
export function buildShelves(scene, theme) {
  const shelfColor  = new THREE.Color(theme.secondary).multiplyScalar(3);
  const accentColor = new THREE.Color(theme.accent);
  const shelfMat = new THREE.MeshStandardMaterial({ color: shelfColor, roughness: 0.5, metalness: 0.6 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor, emissive: accentColor,
    emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.9
  });

  // Three shelf units across the back
  const unitPositions = [-4.5, 0, 4.5];
  unitPositions.forEach(x => {
    buildSingleShelfUnit(scene, x, -5.5, shelfMat, accentMat);
  });

  // Two side display pedestals
  buildPedestal(scene, -6.5, -3, shelfMat, accentMat);
  buildPedestal(scene,  6.5, -3, shelfMat, accentMat);
}

function buildSingleShelfUnit(scene, x, z, mat, accentMat) {
  const group = new THREE.Group();

  // Back panel
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.5, 0.08),
    mat
  );
  backPanel.position.set(0, 2.25, -0.1);
  group.add(backPanel);

  // Shelf planks (3 shelves)
  [0.8, 1.9, 3.0].forEach(y => {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.08, 0.5),
      mat
    );
    plank.position.set(0, y, 0.15);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);

    // Integrated LED Under-glow strip
    const ledMat = new THREE.MeshStandardMaterial({
      color: accentMat.color,
      emissive: accentMat.color,
      emissiveIntensity: 2.5, // Boosted for better bloom
      roughness: 0.1
    });
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 0.015, 0.015),
      ledMat
    );
    led.position.set(0, y - 0.045, 0.38);
    group.add(led);

    // Small point light for physical under-glow (expensive but looks great)
    const ledLight = new THREE.PointLight(accentMat.color, 0.45, 1.8);
    ledLight.position.set(0, y - 0.1, 0.4);
    group.add(ledLight);
  });

  // Side pillars
  [-1.55, 1.55].forEach(px => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 4.5, 0.45),
      mat
    );
    pillar.position.set(px, 2.25, 0.12);
    group.add(pillar);
  });

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.12, 0.5),
    mat
  );
  base.position.set(0, 0.06, 0.1);
  group.add(base);

  group.position.set(x, 0, z);
  add(scene, group);
}

function buildPedestal(scene, x, z, mat, accentMat) {
  const group = new THREE.Group();

  // Column
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 1.1, 8),
    mat
  );
  col.position.y = 0.55;
  group.add(col);

  // Top surface
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.06, 8),
    mat
  );
  top.position.y = 1.13;
  group.add(top);

  // Accent ring on top
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.015, 8, 32),
    accentMat
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.16;
  group.add(ring);

  group.position.set(x, 0, z);
  add(scene, group);
}

/* ── Lighting ─────────────────────────────────────────── */
function buildLighting(scene, theme, accentColor) {
  // Ambient
  const ambient = new THREE.AmbientLight(new THREE.Color(theme.secondary), 0.55);
  add(scene, ambient);

  // Main directional (soft fill)
  const dir = new THREE.DirectionalLight(0xffffff, 0.45);
  dir.position.set(5, 10, 5);
  add(scene, dir);

  // Accent point lights above each shelf unit
  [-4.5, 0, 4.5].forEach(x => {
    const pt = new THREE.PointLight(accentColor, 1.8, 10);
    pt.position.set(x, 5.5, -4);
    pt.castShadow = true;
    add(scene, pt);

    // Small spotlight cone
    const spot = new THREE.SpotLight(accentColor, 1.2, 12, Math.PI / 6, 0.4);
    spot.position.set(x, 6.5, -4);
    spot.target.position.set(x, 1.5, -5.5);
    add(scene, spot);
    add(scene, spot.target);
  });

  // Rim light from front
  const rim = new THREE.PointLight(accentColor, 0.5, 15);
  rim.position.set(0, 3, 7);
  add(scene, rim);

  // Floor glow strip light
  const strip = new THREE.PointLight(accentColor, 0.3, 8);
  strip.position.set(0, 0.2, 0);
  add(scene, strip);
}

/* ── Shop sign ────────────────────────────────────────── */
function buildShopSign(scene, shopData, accentColor) {
  // Sign backing
  const signGeo = new THREE.BoxGeometry(5, 0.8, 0.06);
  const signMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x050505),
    roughness: 0.4,
    metalness: 0.8,
    emissive: accentColor,
    emissiveIntensity: 0.05
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 5.8, -7.9);
  add(scene, sign);

  // Sign border glow
  const borderMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 1.0
  });
  const borderTop = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.025, 0.025), borderMat);
  borderTop.position.set(0, 5.8 + 0.4125, -7.87);
  add(scene, borderTop);

  const borderBot = borderTop.clone();
  borderBot.position.y = 5.8 - 0.4125;
  add(scene, borderBot);

  // Large subtle glow plane behind the whole sign
  const glowGeo = new THREE.PlaneGeometry(8, 2.5);
  const glowMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glowPlane = new THREE.Mesh(glowGeo, glowMat);
  glowPlane.position.set(0, 5.8, -7.95);
  add(scene, glowPlane);

  // Textured plane for shop name (Static within board)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 256;

  // Background is transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // High-fidelity font rendering
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 80px Syne';
  
  const accent = accentColor.getStyle();
  
  // Neon Bloom Style: White core with strong accent glow
  ctx.shadowColor = accent;
  ctx.shadowBlur = 25;
  ctx.fillStyle = '#ffffff'; // White pops better with bloom
  
  const displayText = shopData.emoji + '  ' + shopData.name.toUpperCase();
  ctx.fillText(displayText, canvas.width/2, canvas.height/2);
  
  // Second pass for extra intensity
  ctx.shadowBlur = 10;
  ctx.fillText(displayText, canvas.width/2, canvas.height/2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8; // Sharper text at angles

  const textPlaneGeo = new THREE.PlaneGeometry(4.2, 1.05);
  const textMat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05,
    emissive: accentColor,
    emissiveIntensity: 4.0, // Significant boost for bloom
    side: THREE.FrontSide
  });

  const textMesh = new THREE.Mesh(textPlaneGeo, textMat);
  textMesh.position.set(0, 5.8, -7.86); // Perfectly flush -8.4 + 0.1 logic
  add(scene, textMesh);
}

/* ── Decorative accent lines ──────────────────────────── */
function buildDecorLines(scene, accentColor) {
  const mat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 1.0
  });

  // Floor accent frame
  const corners = [
    [-7, 0.005, 7], [7, 0.005, 7],
    [-7, 0.005, -7], [7, 0.005, -7]
  ];
  corners.forEach(([x, y, z]) => {
    const cg = new THREE.BoxGeometry(0.5, 0.02, 0.02);
    const ch = new THREE.BoxGeometry(0.02, 0.02, 0.5);
    const c1 = new THREE.Mesh(cg, mat);
    const c2 = new THREE.Mesh(ch, mat);
    const xSign = x > 0 ? -1 : 1;
    const zSign = z > 0 ? -1 : 1;
    c1.position.set(x + xSign * 0.25, y, z);
    c2.position.set(x, y, z + zSign * 0.25);
    add(scene, c1);
    add(scene, c2);
  });
}

/* ── Helpers ──────────────────────────────────────────── */
function add(scene, obj) {
  scene.add(obj);
  SHOP_OBJECTS.push(obj);
}

export function clearShop(scene) {
  SHOP_OBJECTS.forEach(obj => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
  SHOP_OBJECTS.length = 0;
}
