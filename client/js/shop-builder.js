/* ═══════════════════════════════════════════════════════════
   shop-builder.js — Builds the 3D room for each shop
   Room: floor, ceiling, 4 walls, shelf units, lights, decor
═══════════════════════════════════════════════════════════ */

const SHOP_OBJECTS = [];   // track everything added so we can tear it down

/* ── Main builder ─────────────────────────────────────── */
export function buildShopEnvironment(scene, shopData) {
  const t = shopData.theme;
  const accentColor = new THREE.Color(t.accent);
  const floorColor  = new THREE.Color(t.floor);
  const wallColor   = new THREE.Color(t.wall);

  buildFloor(scene, floorColor, accentColor);
  buildCeiling(scene, wallColor);
  buildWalls(scene, wallColor, accentColor);
  buildShelves(scene, t);
  buildLighting(scene, t, accentColor);
  buildShopSign(scene, shopData, accentColor);
  buildDecorLines(scene, accentColor);
}

/* ── Floor ────────────────────────────────────────────── */
function buildFloor(scene, floorColor, accentColor) {
  // Base floor
  const geo  = new THREE.PlaneGeometry(30, 30, 20, 20);
  const mat  = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.3,
    metalness: 0.4,
    envMapIntensity: 0.5
  });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  add(scene, floor);

  // Grid lines on floor
  const gridHelper = new THREE.GridHelper(30, 30, accentColor.clone().multiplyScalar(0.08), accentColor.clone().multiplyScalar(0.05));
  gridHelper.position.y = 0.001;
  add(scene, gridHelper);

  // Reflective strip down the aisle
  const stripGeo = new THREE.PlaneGeometry(1.2, 20);
  const stripMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.04,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.15
  });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = 0.002;
  add(scene, strip);
}

/* ── Ceiling ──────────────────────────────────────────── */
function buildCeiling(scene, wallColor) {
  const geo = new THREE.PlaneGeometry(30, 30);
  const mat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9, metalness: 0.0 });
  const ceiling = new THREE.Mesh(geo, mat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 7;
  add(scene, ceiling);

  // Ceiling light track
  const trackGeo = new THREE.BoxGeometry(14, 0.05, 0.15);
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 });
  [-2, 2].forEach(z => {
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, 6.9, z);
    add(scene, track);
  });
}

/* ── Walls ────────────────────────────────────────────── */
function buildWalls(scene, wallColor, accentColor) {
  const mat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor, emissive: accentColor,
    emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.7
  });

  // Back wall
  const backGeo = new THREE.PlaneGeometry(20, 7);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, 3.5, -8);
  add(scene, back);

  // Left wall
  const leftGeo = new THREE.PlaneGeometry(20, 7);
  const left = new THREE.Mesh(leftGeo, mat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-8, 3.5, 0);
  add(scene, left);

  // Right wall
  const right = left.clone();
  right.rotation.y = -Math.PI / 2;
  right.position.set(8, 3.5, 0);
  add(scene, right);

  // Accent skirting on back wall
  const skirtGeo = new THREE.BoxGeometry(20, 0.08, 0.08);
  const skirt = new THREE.Mesh(skirtGeo, accentMat);
  skirt.position.set(0, 0.04, -7.95);
  add(scene, skirt);

  // Accent lines on back wall (vertical)
  [-6, -3, 0, 3, 6].forEach(x => {
    const lineGeo = new THREE.BoxGeometry(0.03, 4, 0.04);
    const line = new THREE.Mesh(lineGeo, accentMat);
    line.position.set(x, 2, -7.96);
    add(scene, line);
  });

  // Wainscoting top trim
  const trimGeo = new THREE.BoxGeometry(20, 0.08, 0.08);
  const trim = new THREE.Mesh(trimGeo, accentMat);
  trim.position.set(0, 4.5, -7.95);
  add(scene, trim);
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
      new THREE.BoxGeometry(3.0, 0.06, 0.45),
      mat
    );
    plank.position.set(0, y, 0.12);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);

    // Accent front edge of each shelf
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.03, 0.03),
      accentMat
    );
    edge.position.set(0, y + 0.045, 0.345);
    group.add(edge);
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
  const ambient = new THREE.AmbientLight(new THREE.Color(theme.secondary), 0.4);
  add(scene, ambient);

  // Main directional (soft fill)
  const dir = new THREE.DirectionalLight(0xffffff, 0.3);
  dir.position.set(5, 10, 5);
  add(scene, dir);

  // Accent point lights above each shelf unit
  [-4.5, 0, 4.5].forEach(x => {
    const pt = new THREE.PointLight(accentColor, 1.2, 8);
    pt.position.set(x, 5.5, -4);
    pt.castShadow = true;
    add(scene, pt);

    // Small spotlight cone
    const spot = new THREE.SpotLight(accentColor, 0.8, 10, Math.PI / 6, 0.4);
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

  // CSS2D label for shop name
  const div = document.createElement('div');
  div.style.cssText = `
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${shopData.theme.accent};
    text-shadow: 0 0 20px ${shopData.theme.accent};
    pointer-events: none;
    white-space: nowrap;
  `;
  div.textContent = shopData.emoji + '  ' + shopData.name.toUpperCase();
  const label = new THREE.CSS2DObject(div);
  label.position.set(0, 5.8, -7.85);
  add(scene, label);
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
