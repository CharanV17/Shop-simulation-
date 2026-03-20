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

  if (shopData.id === 'gourmet-market') {
    buildGourmetMarketEnvironment(scene, shopData);
    return;
  }

  if (shopData.id === 'art-gallery') {
    buildArtGalleryEnvironment(scene, shopData);
    return;
  }

  if (shopData.id === 'fashion-district') {
    buildFashionDistrictEnvironmentTop(scene, shopData);
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

/* ── Art Gallery custom environment ──────────────────── */
function buildArtGalleryEnvironment(scene, shopData) {
  const t = shopData.theme;

  const woodFloorMat = new THREE.MeshStandardMaterial({ color: 0x6b4628, roughness: 0.48, metalness: 0.14 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 28), woodFloorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  for (let z = -13; z <= 13; z += 0.95) {
    const seam = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x4d311b, roughness: 0.8, metalness: 0.06, transparent: true, opacity: 0.55 })
    );
    seam.rotation.x = -Math.PI / 2;
    seam.position.set(0, 0.002, z);
    add(scene, seam);
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.9, metalness: 0.0 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(24, 9.5), wallMat);
  backWall.position.set(0, 4.75, -9);
  add(scene, backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 9.5), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-12, 4.75, 0);
  add(scene, leftWall);

  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(12, 4.75, 0);
  add(scene, rightWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({ color: 0xf0ece6, roughness: 0.95, metalness: 0.0 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 9.3;
  add(scene, ceiling);

  const beamMat = new THREE.MeshStandardMaterial({ color: 0x4e3523, roughness: 0.55, metalness: 0.2 });
  [-10, -5, 0, 5, 10].forEach((x) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 22), beamMat);
    beam.position.set(x, 8.7, -0.6);
    beam.castShadow = true;
    add(scene, beam);
  });

  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(16, 0.24, 0.24), beamMat);
  crossBeam.position.set(0, 8.6, -1.1);
  crossBeam.rotation.z = 0.16;
  add(scene, crossBeam);

  addArtWoodTable(scene, -4.2, -3.2, 3.6, 1.5, 0.78);
  addArtWoodTable(scene,  1.2, -3.5, 4.0, 1.55, 0.78);

  addArtPedestal(scene, -6.9, -1.0, 0.9);
  addArtPedestal(scene,  6.8, -1.3, 0.95);
  addArtPedestal(scene,  3.7,  1.9, 0.88);

  // Wall photo frames removed per latest gallery styling direction.

  addHangingSculpture(scene);

  add(scene, new THREE.AmbientLight(0xffffff, 0.62));

  const key = new THREE.DirectionalLight(0xffffff, 0.72);
  key.position.set(5.5, 10.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  add(scene, key);

  [-8, -4, 0, 4, 8].forEach((x) => {
    const spot = new THREE.SpotLight(0xfff2da, 1.05, 16, Math.PI / 6, 0.4, 1.3);
    spot.position.set(x, 8.9, -2.0);
    spot.target.position.set(x * 0.5, 1.1, -2.8);
    add(scene, spot);
    add(scene, spot.target);
  });

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 240;
  const signCtx = signCanvas.getContext('2d');
  signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.font = '700 82px Syne';
  signCtx.fillStyle = '#f2f2f0';
  signCtx.shadowColor = 'rgba(123,92,255,0.45)';
  signCtx.shadowBlur = 16;
  signCtx.fillText(`${shopData.emoji}  ${shopData.name.toUpperCase()}`, 512, 120);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 1.65),
    new THREE.MeshStandardMaterial({ map: signTex, transparent: true, emissive: new THREE.Color(t.accent), emissiveIntensity: 0.28 })
  );
  sign.position.set(0, 6.95, -8.78);
  add(scene, sign);
}

function addArtWoodTable(scene, x, z, w, d, h = 0.78) {
  const topMat = new THREE.MeshStandardMaterial({ color: 0x6c4a2c, roughness: 0.45, metalness: 0.14 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 0.58, metalness: 0.2 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), topMat);
  top.position.set(x, h + 0.04, z);
  top.castShadow = true;
  top.receiveShadow = true;
  add(scene, top);

  [-w / 2 + 0.2, w / 2 - 0.2].forEach((dx) => {
    [-d / 2 + 0.2, d / 2 - 0.2].forEach((dz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.1), legMat);
      leg.position.set(x + dx, h / 2, z + dz);
      leg.castShadow = true;
      add(scene, leg);
    });
  });
}

function addArtPedestal(scene, x, z, h = 0.9) {
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, h, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xf6f6f3, roughness: 0.9, metalness: 0.03 })
  );
  pedestal.position.set(x, h / 2, z);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  add(scene, pedestal);
}

function addFramedPoster(scene, opts) {
  const { x, y, z, w, h, rotY = 0, palette = ['#4a5c6b', '#d9dce2', '#b56576'] } = opts;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x2a2522, roughness: 0.4, metalness: 0.5 })
  );
  frame.position.set(x, y, z);
  frame.rotation.y = rotY;
  add(scene, frame);

  const artCanvas = document.createElement('canvas');
  artCanvas.width = 768;
  artCanvas.height = 512;
  const ctx = artCanvas.getContext('2d');

  ctx.fillStyle = '#f3f0ea';
  ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);
  ctx.fillStyle = palette[0];
  ctx.fillRect(42, 70, 280, 180);
  ctx.fillStyle = palette[1];
  ctx.fillRect(330, 110, 360, 130);
  ctx.fillStyle = palette[2];
  ctx.beginPath();
  ctx.moveTo(70, 420);
  ctx.lineTo(290, 280);
  ctx.lineTo(640, 435);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1f1f1f';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(68, 86);
  ctx.lineTo(708, 450);
  ctx.stroke();

  const artTex = new THREE.CanvasTexture(artCanvas);
  const artPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.6, metalness: 0.04 })
  );
  artPlane.position.set(x, y, z + (rotY === 0 ? 0.028 : 0));
  artPlane.rotation.y = rotY;
  if (rotY > 0) artPlane.position.x += 0.028;
  if (rotY < 0) artPlane.position.x -= 0.028;
  add(scene, artPlane);
}

function addHangingSculpture(scene) {
  const g = new THREE.Group();
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x8e6e46, roughness: 0.36, metalness: 0.62 });

  for (let i = 0; i < 30; i++) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5 + (i % 4) * 0.28, 6), rodMat);
    rod.position.set(
      Math.sin(i * 1.73) * (0.2 + (i % 6) * 0.12),
      -0.2 - (i % 5) * 0.08,
      Math.cos(i * 1.21) * (0.2 + (i % 7) * 0.12)
    );
    rod.rotation.set(i * 0.18, i * 0.22, i * 0.11);
    g.add(rod);
  }

  const hub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22, 1),
    new THREE.MeshStandardMaterial({ color: 0x5d4b3a, roughness: 0.34, metalness: 0.7 })
  );
  g.add(hub);

  g.position.set(0.2, 7.1, -1.7);
  g.traverse((m) => {
    if (m.isMesh) m.castShadow = true;
  });
  add(scene, g);
}

/* ── Gourmet Market custom environment ───────────────── */
function buildGourmetMarketEnvironment(scene, shopData) {
  const t = shopData.theme;

  // Warm wood floor with subtle plank seams.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 28),
    new THREE.MeshStandardMaterial({ color: 0x6a4528, roughness: 0.5, metalness: 0.18 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  for (let z = -13; z <= 13; z += 1.05) {
    const seam = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x51331d, roughness: 0.75, metalness: 0.08, transparent: true, opacity: 0.55 })
    );
    seam.rotation.x = -Math.PI / 2;
    seam.position.set(0, 0.002, z);
    add(scene, seam);
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd5c3a8, roughness: 0.84, metalness: 0.05 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x2e2a27, roughness: 0.36, metalness: 0.78 });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(26, 10), wallMat);
  backWall.position.set(0, 5, -9);
  add(scene, backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-13, 5, 0);
  add(scene, leftWall);

  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(13, 5, 0);
  add(scene, rightWall);

  // Curved balcony bands to echo upscale mall architecture.
  [7.6, 8.7].forEach((y, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(12.8 - i * 0.7, 0.19, 16, 120, Math.PI * 1.08),
      trimMat
    );
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = Math.PI;
    arc.position.set(0, y, -2.3);
    add(scene, arc);
  });

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 28),
    new THREE.MeshStandardMaterial({ color: 0xf2ecdf, roughness: 0.9, metalness: 0.0 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 9.5;
  add(scene, ceiling);

  // Main service island and side counters with curved glass fronts.
  addGourmetDisplayCase(scene, 0, -3.15, 5.2, 2.0, 2.45, 0.04);
  addGourmetDisplayCase(scene, -7.7, 1.7, 5.0, 2.0, 2.6, 0.62);
  addGourmetDisplayCase(scene, 7.4, 1.85, 4.8, 1.95, 2.4, -0.62);

  // Back wall shelving wall.
  const shelfBody = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 2.6, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x8b623d, roughness: 0.62, metalness: 0.16 })
  );
  shelfBody.position.set(0, 1.35, -8.4);
  add(scene, shelfBody);

  [-2.35, 0, 2.35].forEach((x) => {
    for (let row = 0; row < 4; row++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.34, 0.58),
        new THREE.MeshStandardMaterial({ color: row % 2 ? 0x654028 : 0x704932, roughness: 0.6, metalness: 0.14 })
      );
      box.position.set(x, 0.48 + row * 0.58, -8.12);
      add(scene, box);
    }
  });

  // Warm lighting and showroom spots.
  add(scene, new THREE.AmbientLight(0xffe6c9, 0.6));

  const key = new THREE.DirectionalLight(0xffddb2, 0.95);
  key.position.set(5, 11, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  add(scene, key);

  [-9, -5, -1, 3, 7, 11].forEach((x) => {
    const down = new THREE.SpotLight(0xffe3bd, 1.25, 14, Math.PI / 5, 0.5, 1.5);
    down.position.set(x, 8.8, -1.5);
    down.target.position.set(x * 0.65, 0.8, -3.2);
    add(scene, down);
    add(scene, down.target);
  });

  const accentLine = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: t.accent, emissive: t.accent, emissiveIntensity: 0.32, roughness: 0.25, metalness: 0.6 })
  );
  accentLine.position.set(0, 0.42, -7.95);
  add(scene, accentLine);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 250;
  const signCtx = signCanvas.getContext('2d');
  signCtx.fillStyle = '#00000000';
  signCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.font = '700 86px Syne';
  signCtx.fillStyle = '#f5f1e9';
  signCtx.shadowColor = 'rgba(255,209,102,0.5)';
  signCtx.shadowBlur = 18;
  signCtx.fillText(`${shopData.emoji}  ${shopData.name.toUpperCase()}`, 512, 125);
  const signTex = new THREE.CanvasTexture(signCanvas);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 1.8),
    new THREE.MeshStandardMaterial({ map: signTex, transparent: true, emissive: 0xffd166, emissiveIntensity: 0.28 })
  );
  sign.position.set(0, 6.35, -8.75);
  add(scene, sign);
}

function addGourmetDisplayCase(scene, x, z, w, h, d, rotY = 0) {
  const g = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({ color: 0xbf9570, roughness: 0.42, metalness: 0.58 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.2, metalness: 0.46 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.03,
    metalness: 0.0,
    transmission: 0.96,
    thickness: 0.12,
    ior: 1.48,
    transparent: true,
    opacity: 0.95
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.58, w * 0.62, h * 0.58, 40), baseMat);
  base.position.y = h * 0.29;
  g.add(base);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.6, w * 0.6, 0.1, 40), topMat);
  top.position.y = h * 0.6;
  g.add(top);

  const glassCurve = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.62, w * 0.62, d, 48, 1, true, Math.PI * 0.18, Math.PI * 0.64),
    glassMat
  );
  glassCurve.rotation.z = Math.PI / 2;
  glassCurve.position.set(0, h * 0.78, 0.32);
  g.add(glassCurve);

  // Merchandise pads inside the glass case for luxe confectionary feel.
  const palette = [0x95b78d, 0x4f5b44, 0xa96f53, 0x7a5138, 0xd8b7a0, 0x6d8f84];
  for (let i = 0; i < 16; i++) {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.06, 0.22),
      new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.62, metalness: 0.14 })
    );
    const ring = i % 8;
    const row = Math.floor(i / 8);
    tray.position.set(-0.98 + ring * 0.28, h * 0.63 + row * 0.14, 0.1 + ((ring % 2) ? 0.08 : -0.03));
    g.add(tray);
  }

  const trimRing = new THREE.Mesh(new THREE.TorusGeometry(w * 0.6, 0.02, 10, 40), topMat);
  trimRing.rotation.x = Math.PI / 2;
  trimRing.position.y = h * 0.6;
  g.add(trimRing);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  add(scene, g);
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


/* ── Fashion District custom environment ─────────────── */
function buildFashionDistrictEnvironment(scene, shopData) {
  const t = shopData.theme;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({ color: 0xf3ece8, roughness: 0.55, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  // Boutique floor pattern similar to luxury tile motifs.
  for (let x = -14; x <= 14; x += 2.0) {
    for (let z = -11; z <= 11; z += 2.0) {
      const motif = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.22),
        new THREE.MeshStandardMaterial({ color: ((x + z) % 4 === 0) ? 0x3f3438 : 0x1f1a1e, roughness: 0.4, metalness: 0.25 })
      );
      motif.rotation.x = -Math.PI / 2;
      motif.position.set(x, 0.003, z);
      add(scene, motif);
    }
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x9a3f5c, roughness: 0.78, metalness: 0.06 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x7a2f47, roughness: 0.58, metalness: 0.22 });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(24, 10), wallMat);
  backWall.position.set(0, 5, -9);
  add(scene, backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-12, 5, 0);
  add(scene, leftWall);

  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(12, 5, 0);
  add(scene, rightWall);

  // Bright faux window/light panel on the left side.
  const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 4.2, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.82, metalness: 0.04 })
  );
  windowFrame.position.set(-11.92, 3.95, 3.0);
  windowFrame.rotation.y = Math.PI / 2;
  add(scene, windowFrame);

  const windowGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.35, 3.75),
    new THREE.MeshStandardMaterial({ color: 0xe7f4ff, emissive: 0xe7f4ff, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.0 })
  );
  windowGlow.position.set(-11.86, 3.95, 3.0);
  windowGlow.rotation.y = Math.PI / 2;
  add(scene, windowGlow);

  // Wall panel trims.
  [-7.5, -2.5, 2.5, 7.5].forEach((x) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 6.8, 0.08), trimMat);
    panel.position.set(x, 4.0, -8.96);
    add(scene, panel);
  });

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({ color: 0x8f3654, roughness: 0.7, metalness: 0.1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 9.3;
  add(scene, ceiling);

  // Track lights on black rails.
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1c1b1f, roughness: 0.28, metalness: 0.72 });
  [-5, 0, 5].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 16), railMat);
    rail.position.set(x, 8.8, -1.5);
    add(scene, rail);
  });

  for (let x = -7; x <= 7; x += 2.8) {
    for (let z = -7; z <= 3; z += 2.5) {
      const can = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), railMat);
      can.position.set(x, 8.7, z);
      add(scene, can);
      const spot = new THREE.SpotLight(0xfff0e8, 1.15, 13, Math.PI / 6, 0.4, 1.4);
      spot.position.set(x, 8.65, z);
      spot.target.position.set(x * 0.8, 1.1, z - 0.8);
      add(scene, spot);
      add(scene, spot.target);
    }
  }

  addFashionCurtain(scene, 0, -8.65, 16.5, 6.0, 0x7a2546);
  addFashionDisplayCase(scene, 0, -2.9, 4.8, 2.2, 2.0);

  addFashionRack(scene, -9.3, -0.6, 0.0, 5.8);
  addFashionRack(scene, 9.3, -0.9, Math.PI, 5.8);

  addFashionMannequin(scene, -6.5, -1.9, 0xb89a75, 0x1f1f1f, 0x9f3561);
  addFashionMannequin(scene, 6.0, -2.0, 0xc8a687, 0x121317, 0xd03f7d);
  addFashionMannequin(scene, 0.0,  1.5, 0xd6b397, 0x23242a, 0xff7bac);

  add(scene, new THREE.AmbientLight(0xffdce8, 0.58));

  const key = new THREE.DirectionalLight(0xfff0ea, 0.55);
  key.position.set(4.8, 10, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  add(scene, key);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 240;
  const signCtx = signCanvas.getContext('2d');
  signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.font = '700 82px Syne';
  signCtx.fillStyle = '#ffe6ef';
  signCtx.shadowColor = 'rgba(255,45,107,0.45)';
  signCtx.shadowBlur = 18;
  signCtx.fillText(`${shopData.emoji}  ${shopData.name.toUpperCase()}`, 512, 120);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.7),
    new THREE.MeshStandardMaterial({ map: signTex, transparent: true, emissive: new THREE.Color(t.accent), emissiveIntensity: 0.35 })
  );
  sign.position.set(0, 6.9, -8.75);
  add(scene, sign);
}

function addFashionCurtain(scene, x, z, width, height, color) {
  const g = new THREE.Group();
  const curtainMat = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide });
  const stripe = width / 18;
  for (let i = 0; i < 18; i++) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(stripe + 0.04, height), curtainMat);
    panel.position.set(-width / 2 + (i + 0.5) * stripe, height / 2, 0);
    panel.rotation.y = Math.sin(i * 0.7) * 0.08;
    g.add(panel);
  }
  g.position.set(x, 0.8, z);
  add(scene, g);
}

function addFashionDisplayCase(scene, x, z, w, h, d) {
  const g = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x201b21, roughness: 0.36, metalness: 0.72 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x5a2c3f, roughness: 0.3, metalness: 0.75 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.02,
    metalness: 0.0,
    transmission: 0.96,
    thickness: 0.1,
    ior: 1.48,
    transparent: true,
    opacity: 0.95
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.35, d), baseMat);
  base.position.y = h * 0.18;
  g.add(base);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.08, d * 0.9), trimMat);
  deck.position.y = h * 0.36;
  g.add(deck);

  const dome = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.5, w * 0.5, d * 0.75, 42, 1, true, Math.PI * 0.1, Math.PI * 0.8), glassMat);
  dome.rotation.z = Math.PI / 2;
  dome.position.set(0, h * 0.72, 0.24);
  g.add(dome);

  const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, 0.05, d * 0.56), trimMat);
  shelfTop.position.y = h * 0.66;
  g.add(shelfTop);

  g.position.set(x, 0, z);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  add(scene, g);
}

function addFashionRack(scene, x, z, rotY, width) {
  const g = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x23232a, roughness: 0.25, metalness: 0.86 });
  const clothMatA = new THREE.MeshStandardMaterial({ color: 0xa43f6a, roughness: 0.88, metalness: 0.0, side: THREE.DoubleSide });
  const clothMatB = new THREE.MeshStandardMaterial({ color: 0xe5acc0, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, width, 12), metalMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 2.05;
  g.add(bar);

  [-width / 2 + 0.25, width / 2 - 0.25].forEach((dx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.05, 12), metalMat);
    leg.position.set(dx, 1.02, 0);
    g.add(leg);
  });

  for (let i = 0; i < 8; i++) {
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.05), i % 2 ? clothMatA : clothMatB);
    cloth.position.set(-width / 2 + 0.55 + i * 0.7, 1.45, 0.12 + (i % 2 ? -0.04 : 0.02));
    cloth.rotation.y = (i % 2 ? -0.14 : 0.14);
    g.add(cloth);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  add(scene, g);
}

function addFashionMannequin(scene, x, z, skinColor, dressColor, accentColor) {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.62, metalness: 0.02 });
  const dressMat = new THREE.MeshStandardMaterial({ color: dressColor, roughness: 0.55, metalness: 0.18 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.45, metalness: 0.25 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.55, 18), dressMat);
  torso.position.y = 1.35;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), skinMat);
  head.position.y = 2.35;
  g.add(head);

  const waistBelt = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 10, 24), accentMat);
  waistBelt.rotation.x = Math.PI / 2;
  waistBelt.position.y = 1.45;
  g.add(waistBelt);

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.24, 0.05, 20),
    new THREE.MeshStandardMaterial({ color: 0x1c1a1f, roughness: 0.3, metalness: 0.7 })
  );
  stand.position.y = 0.02;
  g.add(stand);

  g.position.set(x, 0, z);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  add(scene, g);
}
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

/* ── Fashion District custom environment (top-level safe path) ── */
function buildFashionDistrictEnvironmentTop(scene, shopData) {
  const t = shopData.theme || { accent: '#d7b47a' };

  // Warm wood-look floor to match bridal boutique references.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({ color: 0x7d6b58, roughness: 0.56, metalness: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  for (let z = -13; z <= 13; z += 1.18) {
    const seam = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x635142, roughness: 0.82, metalness: 0.06, transparent: true, opacity: 0.45 })
    );
    seam.rotation.x = -Math.PI / 2;
    seam.position.set(0, 0.002, z);
    add(scene, seam);
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3eee7, roughness: 0.9, metalness: 0.0 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc8a76b, roughness: 0.62, metalness: 0.28 });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(24, 10), wallMat);
  backWall.position.set(0, 5, -9);
  add(scene, backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-12, 5, 0);
  add(scene, leftWall);

  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(12, 5, 0);
  add(scene, rightWall);

  // Boutique wall paneling.
  [-8.5, -4.5, -0.5, 3.5, 7.5].forEach((x) => {
    const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(3.1, 6.9, 0.06), new THREE.MeshStandardMaterial({ color: 0xe4d9cb, roughness: 0.85, metalness: 0.05 }));
    panelFrame.position.set(x, 4.05, -8.96);
    add(scene, panelFrame);
  });

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({ color: 0xf9f6f1, roughness: 0.93, metalness: 0.0 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 9.3;
  add(scene, ceiling);

  // Circular ceiling feature above center stage.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.05, 12, 60), goldMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 8.85, -2.6);
  add(scene, ring);

  // Back drapes and center arch alcove.
  const drapeMat = new THREE.MeshStandardMaterial({ color: 0x9f907f, roughness: 0.92, metalness: 0.0, side: THREE.DoubleSide });
  const stripe = 16.5 / 24;
  for (let i = 0; i < 24; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(stripe + 0.05, 6.4), drapeMat);
    p.position.set(-8.25 + (i + 0.5) * stripe, 3.6, -8.62);
    p.rotation.y = Math.sin(i * 0.55) * 0.1;
    add(scene, p);
  }

  const archOuter = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.15, 16, 60, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xfdfaf5, roughness: 0.8, metalness: 0.05 })
  );
  archOuter.rotation.z = Math.PI;
  archOuter.position.set(0, 3.9, -8.55);
  add(scene, archOuter);

  const archInner = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), new THREE.MeshStandardMaterial({ color: 0xebe1d3, roughness: 0.85, metalness: 0.02 }));
  archInner.position.set(0, 3.4, -8.54);
  add(scene, archInner);

  // Central elevated bridal podium.
  const podiumBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.35, 0.34, 46),
    new THREE.MeshStandardMaterial({ color: 0xf8f4ed, roughness: 0.62, metalness: 0.08 })
  );
  podiumBase.position.set(0, 0.17, -2.6);
  add(scene, podiumBase);

  const podiumTrim = new THREE.Mesh(new THREE.TorusGeometry(2.22, 0.04, 10, 48), goldMat);
  podiumTrim.rotation.x = Math.PI / 2;
  podiumTrim.position.set(0, 0.35, -2.6);
  add(scene, podiumTrim);

  // Four couture glass containers for accessories/featured pieces.
  const addGlassContainer = (x, z) => {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xddd3c6, roughness: 0.88, metalness: 0.02 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xc8a76b, roughness: 0.8, metalness: 0.06 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.97,
      thickness: 0.1,
      ior: 1.48,
      transparent: true,
      opacity: 0.92
    });

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.32, 28), baseMat);
    plinth.position.set(x, 0.16, z);
    add(scene, plinth);

    const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 24), trimMat);
    deck.position.set(x, 0.36, z);
    add(scene, deck);

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.9, 28), glassMat);
    glass.position.set(x, 0.84, z);
    add(scene, glass);

    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 8, 26), trimMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(x, 1.28, z);
    add(scene, crown);
  };

  addGlassContainer(-1.5, -1.9);
  addGlassContainer(-0.5, -1.9);
  addGlassContainer(0.5, -1.9);
  addGlassContainer(1.5, -1.9);

  const addFlowerPot = (x, z, petalA, petalB) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.2, 0.34, 18),
      new THREE.MeshStandardMaterial({ color: 0xf2ede3, roughness: 0.82, metalness: 0.05 })
    );
    pot.position.set(x, 0.17, z);
    add(scene, pot);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x486843, roughness: 0.78, metalness: 0.0 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x6f8f5f, roughness: 0.72, metalness: 0.0 });
    const petalMatA = new THREE.MeshStandardMaterial({ color: petalA, roughness: 0.65, metalness: 0.02 });
    const petalMatB = new THREE.MeshStandardMaterial({ color: petalB, roughness: 0.65, metalness: 0.02 });

    for (let i = 0; i < 8; i++) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6), stemMat);
      stem.position.set(x + Math.cos(i) * 0.06, 0.34, z + Math.sin(i * 1.6) * 0.06);
      add(scene, stem);

      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), i % 2 ? petalMatA : petalMatB);
      bloom.position.set(stem.position.x, 0.5 + (i % 3) * 0.02, stem.position.z);
      add(scene, bloom);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), leafMat);
      leaf.scale.set(1.5, 0.7, 1);
      leaf.position.set(stem.position.x + 0.03, 0.28, stem.position.z - 0.01);
      add(scene, leaf);
    }
  };

  addFlowerPot(-2.55, -2.15, 0xe7d1a2, 0x8f6cae);
  addFlowerPot(2.55, -2.15, 0xe8d5aa, 0x7f5da1);

  // Side hanging racks.
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x222125, roughness: 0.25, metalness: 0.86 });
  const addRack = (x, z, rotY) => {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6.0, 12), rackMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(x, 2.2, z);
    add(scene, bar);
    [-2.7, 2.7].forEach((dx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), rackMat);
      leg.position.set(x + dx, 1.1, z);
      add(scene, leg);
    });
    for (let i = 0; i < 8; i++) {
      const hanger = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.01, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.3, metalness: 0.7 }));
      hanger.position.set(x - 2.2 + i * 0.62, 2.18, z + (rotY > 0 ? -0.08 : 0.08));
      hanger.rotation.y = rotY;
      add(scene, hanger);
    }
  };
  addRack(-8.9, -1.1, 0.35);
  addRack(8.9, -1.1, -0.35);

  // Bridal mannequins.
  const addBridalMannequin = (x, z, tone, dressCol) => {
    const skin = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.62, metalness: 0.02 });
    const dress = new THREE.MeshStandardMaterial({ color: dressCol, roughness: 0.82, metalness: 0.05 });

    // More realistic layered bridal silhouette.
    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.33, 0.72, 20), dress);
    bodice.position.set(x, 2.0, z);
    add(scene, bodice);

    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.14, 20), dress);
    waist.position.set(x, 1.58, z);
    add(scene, waist);

    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.9, 1.45, 24), dress);
    skirt.position.set(x, 0.8, z);
    add(scene, skirt);

    const train = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.05, 20), dress);
    train.rotation.x = Math.PI;
    train.position.set(x, 0.56, z + 0.36);
    add(scene, train);

    const shimmer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.82, 1.36, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.08, transparent: true, opacity: 0.12 })
    );
    shimmer.position.set(x, 0.82, z);
    add(scene, shimmer);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skin);
    head.position.set(x, 2.5, z);
    add(scene, head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 10), skin);
    neck.position.set(x, 2.33, z);
    add(scene, neck);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 18), new THREE.MeshStandardMaterial({ color: 0x7a6c5f, roughness: 0.42, metalness: 0.45 }));
    stand.position.set(x, 0.02, z);
    add(scene, stand);
  };
  // Mannequin pillars removed per request.

  // Lounge corner.
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 28), new THREE.MeshStandardMaterial({ color: 0xe6dfd4, roughness: 0.94, metalness: 0.0 }));
  table.position.set(-8.6, 0.52, 2.5);
  add(scene, table);
  const stoolMat = new THREE.MeshStandardMaterial({ color: 0xe4d3bf, roughness: 0.82, metalness: 0.02 });
  [[-10.1, 2.8], [-8.2, 3.9], [-7.0, 2.4]].forEach(([x, z]) => {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.48, 22), stoolMat);
    stool.position.set(x, 0.24, z);
    add(scene, stool);
  });

  add(scene, new THREE.AmbientLight(0xfff4ea, 0.62));
  const key = new THREE.DirectionalLight(0xfff8ef, 0.7);
  key.position.set(4.8, 10, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  add(scene, key);

  // Track spots.
  for (let x = -8; x <= 8; x += 2.6) {
    for (let z = -8; z <= 2; z += 2.5) {
      const spot = new THREE.SpotLight(0xfff7ef, 0.85, 14, Math.PI / 6, 0.45, 1.45);
      spot.position.set(x, 8.65, z);
      spot.target.position.set(x * 0.75, 1.3, z - 0.7);
      add(scene, spot);
      add(scene, spot.target);
    }
  }

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 240;
  const signCtx = signCanvas.getContext('2d');
  signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.font = '700 82px Syne';
  signCtx.fillStyle = '#fff7ee';
  signCtx.shadowColor = 'rgba(199,165,106,0.5)';
  signCtx.shadowBlur = 14;
  signCtx.fillText(`${shopData.emoji}  ${shopData.name.toUpperCase()}`, 512, 120);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 1.72),
    new THREE.MeshStandardMaterial({ map: signTex, transparent: true, emissive: new THREE.Color(t.accent || '#d7b47a'), emissiveIntensity: 0.3 })
  );
  sign.position.set(0, 6.9, -8.74);
  add(scene, sign);
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
