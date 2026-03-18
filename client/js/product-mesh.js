/* ═══════════════════════════════════════════════════════════
   product-mesh.js
   - NO CSS2D floating price labels (removed entirely)
   - Clean 3D product boxes with emoji canvas texture
   - Hover: subtle scale + glow
   - Click: handled by vr-engine (highlight + side panel)
═══════════════════════════════════════════════════════════ */

const PRODUCT_MESHES = [];
const gltfLoader = new THREE.GLTFLoader();

/* ── Shelf slot positions ─────────────────────────────────
   3 shelf units × 2 shelf levels × 3 slots = 18 positions
──────────────────────────────────────────────────────────*/
const SLOTS = [
  // --- Level 1 (Bottom, y=0.9) --- Mid slots
  { x: -4.5, y: 0.9, z: -5.2 }, { x:  0.0, y: 0.9, z: -5.2 }, { x:  4.5, y: 0.9, z: -5.2 },
  // --- Level 2 (Middle, y=2.0) --- Mid slots
  { x: -4.5, y: 2.0, z: -5.2 }, { x:  0.0, y: 2.0, z: -5.2 }, { x:  4.5, y: 2.0, z: -5.2 },
  // --- Level 3 (Top,    y=3.1) --- Mid slots
  { x: -4.5, y: 3.1, z: -5.2 }, { x:  0.0, y: 3.1, z: -5.2 }, { x:  4.5, y: 3.1, z: -5.2 },

  // --- Level 1 --- Side slots (Left then Right)
  { x: -5.2, y: 0.9, z: -5.2 }, { x: -3.8, y: 0.9, z: -5.2 },
  { x: -0.7, y: 0.9, z: -5.2 }, { x:  0.7, y: 0.9, z: -5.2 },
  { x:  3.8, y: 0.9, z: -5.2 }, { x:  5.2, y: 0.9, z: -5.2 },

  // --- Level 2 --- Side slots
  { x: -5.2, y: 2.0, z: -5.2 }, { x: -3.8, y: 2.0, z: -5.2 },
  { x: -0.7, y: 2.0, z: -5.2 }, { x:  0.7, y: 2.0, z: -5.2 },
  { x:  3.8, y: 2.0, z: -5.2 }, { x:  5.2, y: 2.0, z: -5.2 },

  // --- Level 3 --- Side slots
  { x: -5.2, y: 3.1, z: -5.2 }, { x: -3.8, y: 3.1, z: -5.2 },
  { x: -0.7, y: 3.1, z: -5.2 }, { x:  0.7, y: 3.1, z: -5.2 },
  { x:  3.8, y: 3.1, z: -5.2 }, { x:  5.2, y: 3.1, z: -5.2 }
];

const FRESH_MARKET_SLOTS = [
  { x: -6.8, y: 0.96, z: -2.9 },
  { x: -5.0, y: 0.99, z: -2.82 },
  { x: -3.2, y: 0.97, z: -2.95 },
  { x:  2.95, y: 0.99, z: -2.95 },
  { x:  4.8, y: 0.52, z: -4.1 },
  { x:  1.5, y: 0.52, z: -4.2 },
  { x: -3.9, y: 0.78, z: -6.05 },
  { x: -2.5, y: 0.78, z: -6.1 },
  { x: -1.1, y: 0.78, z: -6.0 },
  { x:  0.3, y: 0.78, z: -6.1 },
  { x:  1.7, y: 0.78, z: -6.0 },
  { x:  3.0, y: 0.78, z: -6.08 }
];

/* ── Main builder ─────────────────────────────────────── */
export async function buildProductMeshes(scene, products, theme) {
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const isFreshMarket = product.shopId === 'fresh-market';
    const slotSet = isFreshMarket ? FRESH_MARKET_SLOTS : SLOTS;
    const slot    = slotSet[i % slotSet.length];
    if (!slot) continue;

    const group = new THREE.Group();
    group.userData.isProduct = true;
    group.userData.product   = product;

    const d    = product.dimensions || { w: 0.45, h: 0.45, d: 0.45 };
    const cat  = (product.category || 'General').toLowerCase();
    const name = (product.name || '').toLowerCase();

    if (isFreshMarket) {
      // ── Wooden Crate + Pile of Produce ───────────────
      createFreshMarketCrate(group, name, cat, theme.accent);
    } else {
      // ── Standard single-item procedural / GLTF ───────
      let hasExternalModel = false;
      if (product.modelUrl) {
        try {
          const gltf  = await loadGLTF(product.modelUrl);
          const model = gltf.scene;
          const bbox  = new THREE.Box3().setFromObject(model);
          const size  = bbox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale  = Math.min(d.w, d.h, d.d) / maxDim;
          model.scale.setScalar(scale);
          const center = bbox.getCenter(new THREE.Vector3());
          model.position.sub(center.multiplyScalar(scale));
          group.add(model);
          hasExternalModel = true;
        } catch (err) {
          console.warn(`Failed to load GLTF for ${product.name}`, err);
        }
      }

      if (!hasExternalModel) {
        const productParts = createProductMeshParts(cat, name, d, product.color || '#444455');
        productParts.forEach(part => group.add(part));
      }

      // Emoji label for non-fresh-market items
      const faceTex = makeEmojiTexture(product.emoji, product.color || '#1a1a2e', theme.accent);
      const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.25, metalness: 0.1, transparent: true });
      const labelGeo = new THREE.PlaneGeometry(d.w * 0.75, d.h * 0.75);
      const face = new THREE.Mesh(labelGeo, faceMat);
      face.position.z = hasExternalModel ? d.d * 0.55 :
                        (cat.includes('drink') || cat.includes('food')) ? d.w / 2 + 0.005 :
                        (cat.includes('tech') || cat.includes('electronic')) ? d.d / 2 + 0.005 :
                        d.d * 0.45;
      group.add(face);
    }

    // ── Hover FX (all products) ───────────────────────
    const crateW = isFreshMarket ? 0.6 : d.w;
    const crateH = isFreshMarket ? 0.4 : d.h;
    const crateD = isFreshMarket ? 0.5 : d.d;
    const edgeMat = new THREE.MeshStandardMaterial({
      color: theme.accent, emissive: theme.accent, emissiveIntensity: 0,
      roughness: 0.1, metalness: 1.0, transparent: true, opacity: 0
    });
    const edges = new THREE.Mesh(new THREE.BoxGeometry(crateW + 0.05, crateH + 0.05, crateD + 0.05), edgeMat);
    group.add(edges);
    group.userData.edgeMesh = edges;
    group.userData.edgeMat  = edgeMat;

    const glow = new THREE.PointLight(new THREE.Color(theme.accent), 0, 3.0);
    group.add(glow);
    group.userData.glowLight = glow;

    // ── Final Positioning ─────────────────────────────
    const posY = isFreshMarket ? slot.y + 0.26 : slot.y + d.h / 2 + 0.05;
    group.position.set(slot.x, posY, slot.z);
    group.userData.baseY   = posY;
    group.userData.animate = false; // crates don't float
    group.rotation.y       = (Math.random() - 0.5) * 0.4;

    scene.add(group);
    PRODUCT_MESHES.push(group);
  }
}

/* ══════════════════════════════════════════════════════════
   FRESH MARKET: Wooden Crate + Produce Pile
══════════════════════════════════════════════════════════ */

const CRATE_W = 0.58, CRATE_H = 0.24, CRATE_D = 0.48;
const WOOD_COLOR  = new THREE.Color('#8B5E3C');
const WOOD_DARK   = new THREE.Color('#6B4226');
const CRATE_WOOD_TEX = createCrateWoodTexture('#8b5e3c', '#6b4226', '#a87752');
const CRATE_WOOD_DARK_TEX = createCrateWoodTexture('#6b4226', '#4f2f1b', '#7a5132');

function createFreshMarketCrate(group, name, cat, accentHex) {
  // ── Wooden crate box ─────────────────────────────
  const woodMat  = new THREE.MeshStandardMaterial({ map: CRATE_WOOD_TEX, color: 0xffffff, roughness: 0.9, metalness: 0.0 });
  const darkMat  = new THREE.MeshStandardMaterial({ map: CRATE_WOOD_DARK_TEX, color: 0xffffff, roughness: 0.95, metalness: 0.0 });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(CRATE_W, 0.025, CRATE_D), woodMat);
  floor.position.y = 0;
  group.add(floor);

  // 4 Walls
  const wallFB = new THREE.BoxGeometry(CRATE_W, CRATE_H, 0.025);
  const wallLR = new THREE.BoxGeometry(0.025,   CRATE_H, CRATE_D);
  const frontW = new THREE.Mesh(wallFB, woodMat); frontW.position.set(0, CRATE_H/2,  CRATE_D/2); group.add(frontW);
  const backW  = new THREE.Mesh(wallFB, woodMat); backW.position.set(0,  CRATE_H/2, -CRATE_D/2); group.add(backW);
  const leftW  = new THREE.Mesh(wallLR, woodMat); leftW.position.set(-CRATE_W/2, CRATE_H/2, 0); group.add(leftW);
  const rightW = new THREE.Mesh(wallLR, woodMat); rightW.position.set( CRATE_W/2, CRATE_H/2, 0); group.add(rightW);

  // Corner posts for stronger crate silhouette.
  [[-CRATE_W/2, CRATE_D/2], [CRATE_W/2, CRATE_D/2], [-CRATE_W/2, -CRATE_D/2], [CRATE_W/2, -CRATE_D/2]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, CRATE_H + 0.05, 0.03), darkMat);
    post.position.set(px, (CRATE_H + 0.05) / 2, pz);
    group.add(post);
  });

  // Plank lines on front wall (horizontal slats)
  [0.05, 0.12, 0.19, 0.26].forEach(ry => {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(CRATE_W + 0.002, 0.012, 0.008), darkMat);
    slat.position.set(0, ry, CRATE_D/2 + 0.013);
    group.add(slat);

    const slatBack = slat.clone();
    slatBack.position.z = -CRATE_D/2 - 0.013;
    group.add(slatBack);
  });

  // ── Pile of produce inside ────────────────────────
  const pileGroup = new THREE.Group();
  const rng = seededRng(name); // deterministic randomness per product

  const count    = 10 + Math.floor(rng() * 5); // 10–14 items
  const innerW   = CRATE_W * 0.85;
  const innerD   = CRATE_D * 0.85;

  for (let k = 0; k < count; k++) {
    const item = makeProduceUnit(name, cat, rng);
    if (!item) break;

    // Spread items in a pile: lower layer spread wide, upper layer more clustered
    const layer  = Math.floor(k / 5);
    const spread = layer === 0 ? 1.0 : 0.55;
    const px = (rng() - 0.5) * innerW * spread;
    const pz = (rng() - 0.5) * innerD * spread;
    const py = 0.08 + layer * 0.11 + rng() * 0.04;

    item.position.set(px, py, pz);
    item.rotation.set(
      (rng() - 0.5) * 0.6,
      rng() * Math.PI * 2,
      (rng() - 0.5) * 0.6
    );
    item.castShadow = true;
    pileGroup.add(item);
  }

  pileGroup.position.y = 0.08;
  group.add(pileGroup);
}

function createCrateWoodTexture(base, grain, knots) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 8) {
    ctx.strokeStyle = `${grain}${Math.floor(40 + (y % 16) * 2).toString(16)}`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.12) * 1.7);
    ctx.bezierCurveTo(80, y + 2, 180, y - 2, 256, y + Math.cos(y * 0.1) * 1.7);
    ctx.stroke();
  }

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const rx = 2 + Math.random() * 4;
    const ry = 1 + Math.random() * 2;
    ctx.fillStyle = knots;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.4, 1.4);
  tex.anisotropy = 8;
  return tex;
}

/* ── Simple seeded RNG (deterministic per product name) ── */
function seededRng(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  let s = h >>> 0;
  return function () {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}

/* ── Produce unit dispatchers ─────────────────────────── */
function makeProduceUnit(name, cat, rng) {
  if (name.includes('tomato'))     return makeSmallTomato();
  if (name.includes('broccoli'))   return makeSmallBroccoli();
  if (name.includes('watermelon')) return makeSmallWatermelon();
  if (name.includes('banana'))     return makeSmallBanana(rng);
  if (name.includes('orange'))     return makeSmallOrange();
  if (name.includes('carrot'))     return makeSmallCarrot();
  // fallback by category
  if (cat.includes('fruit'))       return makeSmallOrange();
  if (cat.includes('vegetable'))   return makeSmallTomato();
  return makeSmallOrange();
}

function makeSmallTomato() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), new THREE.MeshStandardMaterial({ color: '#cc2200', roughness: 0.32 }));
  body.scale.y = 0.82;
  g.add(body);

  // Ribbed profile for less toy-like tomato
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshStandardMaterial({ color: '#a81a00', roughness: 0.6 }));
    rib.position.set(Math.cos(a) * 0.042, 0, Math.sin(a) * 0.042);
    g.add(rib);
  }

  // tiny green calyx
  const cx = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 6, 4),
    new THREE.MeshStandardMaterial({ color: '#2a7a1a', roughness: 0.8 })
  );
  cx.position.y = 0.044;
  g.add(cx);
  return g;
}

function makeSmallBroccoli() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#2a7a1a', roughness: 0.9 });
  // stalk
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.013, 0.06, 6), new THREE.MeshStandardMaterial({ color: '#4a7a20', roughness: 0.9 }));
  stalk.position.y = -0.025;
  g.add(stalk);
  // head dome
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 7, 0, Math.PI*2, 0, Math.PI*0.6), mat);
  head.position.y = 0.02;
  g.add(head);
  // Floret bumps
  for (let i = 0; i < 7; i++) {
    const a = (i/7)*Math.PI*2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), mat);
    b.position.set(Math.sin(a)*0.033, 0.028, Math.cos(a)*0.033);
    g.add(b);
  }
  return g;
}

function makeSmallWatermelon() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 10),
    new THREE.MeshStandardMaterial({ color: '#1e7a1e', roughness: 0.5 })
  );
  body.scale.set(1.1, 0.85, 1.0);
  g.add(body);
  // dark stripes
  const stripeMat = new THREE.MeshStandardMaterial({ color: '#0d4a0d', roughness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = (i/4)*Math.PI*2;
    const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.067, 4, 10, 0, Math.PI*2, 0, Math.PI), stripeMat);
    stripe.scale.set(0.15, 0.85, 0.15);
    stripe.position.set(Math.sin(a)*0.055, 0, Math.cos(a)*0.055);
    g.add(stripe);
  }

  // little stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.03, 6), new THREE.MeshStandardMaterial({ color: '#5a3a17', roughness: 0.9 }));
  stem.position.y = 0.058;
  g.add(stem);
  return g;
}

function makeSmallBanana(rng) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#f5d020', roughness: 0.6 });
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.015, 5, 10, Math.PI * 0.7),
    mat
  );
  arc.rotation.z = Math.PI / 2;
  arc.rotation.x = (rng() - 0.5) * 0.5;
  g.add(arc);

  const tipMat = new THREE.MeshStandardMaterial({ color: '#6b4b20', roughness: 0.9 });
  const tipA = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 5), tipMat);
  tipA.position.set(0.02, 0.045, 0);
  g.add(tipA);
  const tipB = tipA.clone();
  tipB.position.set(-0.02, -0.045, 0);
  g.add(tipB);
  return g;
}

function makeSmallOrange() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#e8821a', roughness: 0.5 })
  );
  g.add(body);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 4), new THREE.MeshStandardMaterial({ color: '#3c7f2a', roughness: 0.85 }));
  leaf.scale.set(1.7, 0.45, 0.8);
  leaf.position.set(0.01, 0.052, 0);
  g.add(leaf);
  // tiny navel dot
  const navel = new THREE.Mesh(
    new THREE.SphereGeometry(0.01, 5, 4),
    new THREE.MeshStandardMaterial({ color: '#c06010', roughness: 0.8 })
  );
  navel.position.y = -0.05;
  g.add(navel);
  return g;
}

function makeSmallCarrot() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.028, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: '#e05a00', roughness: 0.6 })
  );
  g.add(body);
  // green top
  const topMat = new THREE.MeshStandardMaterial({ color: '#2a7a1a', roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.008, 0.04, 5), topMat);
    top.position.set((i - 1) * 0.007, 0.062, 0);
    top.rotation.z = (i - 1) * 0.22;
    g.add(top);
  }
  return g;
}



/** 
 * Procedural Mesh Generator
 * Returns array of meshes for the product body
 */
function createProductMeshParts(cat, name, d, color) {
  const parts = [];
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: (cat.includes('tech') || cat.includes('electronic')) ? 0.05 : 0.2,
    metalness: (cat.includes('tech') || cat.includes('electronic')) ? 0.9 : 0.4,
    envMapIntensity: 1.5
  });

  // Art Gallery named pieces get dedicated sculptural models.
  if (name.includes('digital genesis print') || name.includes('genesis print')) {
    return createDigitalGenesisPrintModel(d, color);
  }
  if (name.includes('crystal sculpture')) {
    return createCrystalSculptureModel(d, color);
  }
  if (name.includes('vinyl art record')) {
    return createVinylArtRecordModel(d, color);
  }
  if (name.includes('kinetic wall art')) {
    return createKineticWallArtModel(d, color);
  }
  if (name.includes('neo-brutalist poster') || name.includes('brutalist poster')) {
    return createNeoBrutalistPosterModel(d, color);
  }
  if (name.includes('designer chess set')) {
    return createDesignerChessSetModel(d, color);
  }

  // Fashion District hero items
  if (name.includes('silk noir blazer')) {
    return createSilkBlazerModel(d, color);
  }
  if (name.includes('crystal heels')) {
    return createCrystalHeelsModel(d, color);
  }
  if (name.includes('velvet weekender')) {
    return createVelvetWeekenderModel(d, color);
  }
  if (name.includes('aurora sunglasses')) {
    return createAuroraSunglassesModel(d, color);
  }
  if (name.includes('cashmere wrap')) {
    return createCashmereWrapModel(d, color);
  }
  if (name.includes('neo bomber jacket')) {
    return createNeoBomberJacketModel(d, color);
  }

  // ── Specific Item Overrides ─────────────────────
  if (name.includes('earbuds') || name.includes('audio') || name.includes('headphones')) {
    return createHeadphonesModel(d, color);
  }
  if (name.includes('drone')) {
    return createDroneModel(d, color);
  }
  if (name.includes('watch')) {
    return createWatchModel(d, color);
  }
  if (name.includes('headset') || name.includes('vr')) {
    return createVRModel(d, color);
  }
  if (name.includes('keyboard') || name.includes('board') || name.includes('chess')) {
    return createKeyboardModel(d, color, name.includes('chess'));
  }
  if (name.includes('blazer') || name.includes('jacket') || name.includes('shirt') || cat.includes('outerwear') || cat.includes('apparel')) {
    return createApparelModel(d, color);
  }
  if (name.includes('heels') || name.includes('shoe') || name.includes('cleats') || name.includes('boot') || cat.includes('footwear')) {
    return createShoeModel(d, color);
  }
  if (name.includes('bag') || name.includes('tote') || name.includes('pack') || name.includes('weekender') || cat.includes('bags')) {
    return createBagModel(d, color);
  }
  if (name.includes('racket')) {
    return createRacketModel(d, color);
  }
  if (name.includes('vinyl') || name.includes('record')) {
    return createDiscModel(d, color);
  }
  if (name.includes('goggles') || name.includes('sunglasses') || cat.includes('eyewear')) {
    return createSunglassesModel(d, color);
  }
  if (name.includes('wrap') || name.includes('scarf')) {
    return createWrapModel(d, color);
  }
  if (cat.includes('art') || cat.includes('poster') || name.includes('print')) {
    return createFrameModel(d, color);
  }
  if (name.includes('knife') || name.includes('knives')) {
    return createKnifeModel(d, color);
  }

  // Gourmet Market specific product models
  if (name.includes('truffle')) {
    return createTruffleJarModel(d, color);
  }
  if (name.includes('saffron')) {
    return createSaffronVialModel(d, color);
  }
  if (name.includes('balsamic')) {
    return createBalsamicBottleModel(d, color);
  }
  if (name.includes('cacao') || name.includes('chocolate')) {
    return createCacaoBarModel(d, color);
  }
  if (name.includes('wagyu') || name.includes('beef')) {
    return createWagyuTrayModel(d, color);
  }

  if (name.includes('tomato') || name.includes('crate') && cat.includes('vegetable')) {
    return createTomatoModel(d, color);
  }
  if (name.includes('broccoli')) {
    return createBroccoliModel(d, color);
  }

  // ── Category-Based Shapes ───────────────────────
  if (cat.includes('drink') || cat.includes('bottle')) {
    // Bottle/Can shape
    const body = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2, d.w/2, d.h, 16), baseMat);
    parts.push(body);
    // Lid
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(d.w/2.2, d.w/2.2, 0.05, 16), 
                new THREE.MeshStandardMaterial({color: 0xcccccc, metalness: 0.9}));
    lid.position.y = d.h/2;
    parts.push(lid);
  } 
  else if (cat.includes('book')) {
    // Thin Book shape
    const body = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.8, d.h, d.d*0.3), baseMat);
    parts.push(body);
    // Pages / Spine accent
    const spine = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.1, d.h*1.01, d.d*0.31), 
                  new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.8}));
    spine.position.x = -d.w*0.4;
    parts.push(spine);
  }
  else if (cat.includes('food') || cat.includes('fruit') || cat.includes('sport') || cat.includes('accessory')) {
    // Spherical/Organic
    const body = new THREE.Mesh(new THREE.SphereGeometry(d.w/2, 16, 12), baseMat);
    body.scale.y = d.h / d.w;
    parts.push(body);
  }
  else if (cat.includes('tech') || cat.includes('gear') || cat.includes('electronic') || cat.includes('gaming')) {
    // Chamfered Box / Console shape
    const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), baseMat);
    parts.push(body);
    // Bezel accent
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(d.w*1.02, d.h*0.8, d.d*0.2), 
                  new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.1}));
    bezel.position.z = d.d/2;
    parts.push(bezel);
  }
  else if (cat.includes('apparel') || cat.includes('footwear') || cat.includes('lifestyle')) {
    // Folded Fabric / Soft Box
    const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h*0.6, d.d*0.9), baseMat);
    parts.push(body);
    // Fold line
    const fold = new THREE.Mesh(new THREE.BoxGeometry(d.w*1.05, 0.02, d.d*0.95), 
                 new THREE.MeshStandardMaterial({color: 0x000000, transparent: true, opacity: 0.2}));
    parts.push(fold);
  }
  else {
    // Default: Gift Box
    const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), baseMat);
    parts.push(body);
    // Ribbon
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(d.w*0.2, d.h*1.05, d.d*1.05),
                   new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2}));
    parts.push(ribbon);
  }

  parts.forEach(p => { p.castShadow = true; p.receiveShadow = true; });
  return parts;
}

/* ── Specific Model Builders ─────────────────────────── */

function createDroneModel(d, color) {
  const parts = [];
  // Pro-tech dark theme materials
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.7 });
  const emissiveBlue = new THREE.MeshStandardMaterial({ 
    color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 2.0 
  });
  const rotorMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide
  });

  // 1. Sleek Central Chassis
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.45, d.h * 0.35, d.d * 0.7), chassisMat);
  parts.push(mainBody);

  const topCover = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.42, 0.04, d.d * 0.65), chassisMat);
  topCover.position.y = d.h * 0.2;
  parts.push(topCover);

  // TECH HUB branding plate
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.3, d.d * 0.15), new THREE.MeshStandardMaterial({
    color: 0x222222, metalness: 0.9, roughness: 0.1
  }));
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = d.h * 0.221;
  parts.push(plate);

  // 2. Camera & Front LED
  const cameraHousing = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.22, d.h * 0.25, 0.12), chassisMat);
  cameraHousing.position.set(0, -0.05, d.d * 0.35);
  parts.push(cameraHousing);

  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1 }));
  lens.position.set(0, -0.05, d.d * 0.35 + 0.06);
  parts.push(lens);

  const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.01), emissiveBlue);
  led.position.set(0, 0.08, d.d * 0.35 + 0.061);
  parts.push(led);

  // 3. 4 Angled Arms & Motors
  const armOffsets = [
    { x: 0.5, z: 0.5 }, { x: -0.5, z: 0.5 },
    { x: 0.5, z: -0.5 }, { x: -0.5, z: -0.5 }
  ];

  armOffsets.forEach(off => {
    // Arm
    const armGeo = new THREE.BoxGeometry(d.w * 0.5, 0.05, 0.05);
    const arm = new THREE.Mesh(armGeo, chassisMat);
    arm.position.set(off.x * d.w * 0.4, 0, off.z * d.d * 0.4);
    arm.rotation.y = (off.x * off.z > 0) ? Math.PI / 4 : -Math.PI / 4;
    parts.push(arm);

    // Motor
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12), chassisMat);
    motor.position.set(off.x * d.w * 0.6, 0.05, off.z * d.d * 0.6);
    parts.push(motor);

    // Rotors
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.4, d.w * 0.4, 0.01, 16), rotorMat);
    rotor.position.set(motor.position.x, motor.position.y + 0.08, motor.position.z);
    rotor.userData.isRotor = true;
    parts.push(rotor);

    // Rotor Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), accentMat);
    hub.position.copy(rotor.position);
    parts.push(hub);
  });

  // 4. Side Battery indicators
  const batLed = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.15), emissiveBlue);
  batLed.position.set(d.w * 0.226, 0.05, 0);
  parts.push(batLed);

  const batLed2 = batLed.clone();
  batLed2.position.x = -d.w * 0.226;
  parts.push(batLed2);

  parts.forEach(p => { p.castShadow = true; p.receiveShadow = true; });
  return parts;
}

function createWatchModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.0 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

  // Face
  const face = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.1), mat);
  parts.push(face);

  // Screen
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.85, d.h * 0.85), screenMat);
  screen.position.z = 0.051;
  parts.push(screen);

  // Straps
  const strapGeo = new THREE.BoxGeometry(d.w * 0.7, 0.4, 0.04);
  const strapT = new THREE.Mesh(strapGeo, strapMat);
  strapT.position.y = d.h / 2 + 0.1;
  parts.push(strapT);

  const strapB = strapT.clone();
  strapB.position.y = -(d.h / 2 + 0.1);
  parts.push(strapB);

  parts.forEach(p => { p.castShadow = true; });
  return parts;
}

function createVRModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
  const frontMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });

  // Main visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d * 0.7), mat);
  parts.push(visor);

  // Glass front
  const glass = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.95, d.h * 0.8, 0.02), frontMat);
  glass.position.z = d.d * 0.35 + 0.01;
  parts.push(glass);

  // Head strap
  const strapGeo = new THREE.TorusGeometry(d.d * 0.6, 0.03, 8, 24, Math.PI);
  const strap = new THREE.Mesh(strapGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
  strap.rotation.x = -Math.PI / 2;
  strap.position.z = -d.d * 0.1;
  parts.push(strap);

  return parts;
}

function createKeyboardModel(d, color, isChess = false) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.6 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), mat);
  parts.push(base);

  if (isChess) {
    // Chess grid
    const grid = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.9, 0.02, d.d * 0.9), 
                 new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    grid.position.y = d.h / 2 + 0.01;
    parts.push(grid);
  } else {
    // Keyboard Key block
    const keys = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.95, 0.04, d.d * 0.85), accentMat);
    keys.position.y = d.h / 2 + 0.01;
    parts.push(keys);
  }

  return parts;
}

function createApparelModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 });
  
  // Body (slightly tapered)
  const bodyGeo = new THREE.BoxGeometry(d.w * 0.8, d.h * 0.85, d.d * 0.35);
  const body = new THREE.Mesh(bodyGeo, mat);
  parts.push(body);

  // Sleeves
  const sleeveGeo = new THREE.BoxGeometry(d.w * 0.25, d.h * 0.6, d.d * 0.3);
  const leftSleeve = new THREE.Mesh(sleeveGeo, mat);
  leftSleeve.position.set(-d.w * 0.45, -d.h * 0.05, 0);
  leftSleeve.rotation.z = Math.PI / 12;
  parts.push(leftSleeve);

  const rightSleeve = leftSleeve.clone();
  rightSleeve.position.x = d.w * 0.45;
  rightSleeve.rotation.z = -Math.PI / 12;
  parts.push(rightSleeve);

  // Collar
  const collar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.4, 0.08, d.d * 0.42), mat);
  collar.position.y = d.h * 0.4;
  parts.push(collar);

  // Zipper / Front line
  const zipMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
  const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.02, d.h * 0.7, 0.01), zipMat);
  zipper.position.set(0, -d.h * 0.1, d.d * 0.18);
  parts.push(zipper);

  // Hanger (Refined)
  const hangerMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.0, 0.03, 0.03), hangerMat);
  bar.position.y = d.h * 0.45;
  parts.push(bar);

  const hookGeo = new THREE.TorusGeometry(0.06, 0.01, 8, 16, Math.PI + 0.5);
  const hook = new THREE.Mesh(hookGeo, hangerMat);
  hook.position.y = d.h * 0.55;
  hook.rotation.z = -Math.PI/2;
  parts.push(hook);

  parts.forEach(p => { p.castShadow = true; });
  return parts;
}

function createShoeModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
  
  // Sole
  const sole = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h * 0.2, d.d), mat);
  parts.push(sole);

  // Upper/Heel
  const upper = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.9, d.h * 0.6, d.d * 0.5), mat);
  upper.position.set(0, d.h * 0.3, -d.d * 0.2);
  parts.push(upper);

  return parts;
}

function createBagModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
  
  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h * 0.8, d.d), mat);
  parts.push(body);

  // Handles / Strap
  const strapGeo = new THREE.TorusGeometry(d.w * 0.3, 0.025, 8, 16, Math.PI);
  const strap = new THREE.Mesh(strapGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
  strap.position.y = d.h * 0.4;
  parts.push(strap);

  return parts;
}

function createRacketModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.2 });
  
  // Oval Frame
  const frameGeo = new THREE.TorusGeometry(d.w * 0.45, 0.02, 8, 32);
  const frame = new THREE.Mesh(frameGeo, mat);
  frame.scale.y = 1.3;
  parts.push(frame);

  // Shaft/Handle
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, d.h * 0.6), mat);
  shaft.position.y = -d.h * 0.4;
  parts.push(shaft);

  return parts;
}

function createFrameModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.4 });
  
  // Frame border
  const frame = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.04), mat);
  parts.push(frame);

  // Recessed "Canvas"
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.9, d.h * 0.9), 
                 new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
  canvas.position.z = 0.021;
  parts.push(canvas);

  return parts;
}

function createDigitalGenesisPrintModel(d, color) {
  const parts = [];
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1d1d28, roughness: 0.55, metalness: 0.45 });
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xe7e2f5, roughness: 0.75, metalness: 0.0 });
  const neonMat = new THREE.MeshStandardMaterial({ color: 0x7b5cff, emissive: 0x7b5cff, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.9 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.02, d.h * 1.02, 0.05), frameMat);
  parts.push(frame);

  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.88, d.h * 0.88), canvasMat);
  canvas.position.z = 0.028;
  parts.push(canvas);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(d.w * 0.19, 0.015, 10, 42), neonMat);
  ring.position.set(0, 0.05, 0.03);
  parts.push(ring);

  const line = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.38, 0.018, 0.008), neonMat);
  line.position.set(0, -0.08, 0.03);
  line.rotation.z = 0.35;
  parts.push(line);

  return parts;
}

function createCrystalSculptureModel(d, color) {
  const parts = [];
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.65, metalness: 0.35 });
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x66c8ff,
    roughness: 0.03,
    metalness: 0.0,
    transmission: 0.95,
    thickness: 0.24,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.2, d.w * 0.24, d.h * 0.22, 12), plinthMat);
  plinth.position.y = -d.h * 0.26;
  parts.push(plinth);

  const shard1 = new THREE.Mesh(new THREE.ConeGeometry(d.w * 0.18, d.h * 0.75, 6), crystalMat);
  shard1.position.y = d.h * 0.08;
  shard1.rotation.z = 0.18;
  parts.push(shard1);

  const shard2 = new THREE.Mesh(new THREE.ConeGeometry(d.w * 0.12, d.h * 0.58, 6), crystalMat);
  shard2.position.set(-d.w * 0.1, -d.h * 0.02, d.w * 0.03);
  shard2.rotation.z = -0.25;
  parts.push(shard2);

  const shard3 = new THREE.Mesh(new THREE.ConeGeometry(d.w * 0.1, d.h * 0.5, 6), crystalMat);
  shard3.position.set(d.w * 0.11, -d.h * 0.05, -d.w * 0.03);
  shard3.rotation.z = 0.32;
  parts.push(shard3);

  return parts;
}

function createVinylArtRecordModel(d, color) {
  const parts = [];
  const standMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.7, metalness: 0.2 });
  const discMat = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.15, metalness: 0.85 });
  const labelMat = new THREE.MeshStandardMaterial({ color: 0xff5a2f, roughness: 0.4, metalness: 0.1 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.85, d.h * 0.16, d.d * 0.55), standMat);
  base.position.y = -d.h * 0.24;
  parts.push(base);

  const back = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.85, d.h * 0.56, 0.04), standMat);
  back.position.set(0, 0, -d.d * 0.2);
  parts.push(back);

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.34, d.w * 0.34, 0.012, 44), discMat);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, d.h * 0.02, -d.d * 0.16);
  parts.push(disc);

  const label = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.11, d.w * 0.11, 0.013, 24), labelMat);
  label.rotation.x = Math.PI / 2;
  label.position.copy(disc.position);
  parts.push(label);

  return parts;
}

function createKineticWallArtModel(d, color) {
  const parts = [];
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x181824, roughness: 0.6, metalness: 0.3 });
  const armMat = new THREE.MeshStandardMaterial({ color: 0x9aa0ad, roughness: 0.25, metalness: 0.95 });
  const discMat = new THREE.MeshStandardMaterial({ color: 0x666c78, roughness: 0.25, metalness: 0.9 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.04), frameMat);
  parts.push(frame);

  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 14), armMat);
  center.rotation.x = Math.PI / 2;
  center.position.z = 0.03;
  parts.push(center);

  [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((a) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.22, 0.012, 0.012), armMat);
    arm.position.z = 0.03;
    arm.rotation.z = a;
    parts.push(arm);

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.06, d.w * 0.06, 0.012, 18), discMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(Math.cos(a) * d.w * 0.11, Math.sin(a) * d.w * 0.11, 0.035);
    parts.push(disc);
  });

  return parts;
}

function createNeoBrutalistPosterModel(d, color) {
  const parts = [];
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });
  const barMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.35 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.4, metalness: 0.0 });

  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.88, d.h * 0.95), sheetMat);
  parts.push(sheet);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.92, 0.02, 0.02), barMat);
  topBar.position.y = d.h * 0.48;
  parts.push(topBar);

  const bottomBar = topBar.clone();
  bottomBar.position.y = -d.h * 0.48;
  parts.push(bottomBar);

  const blockA = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.32, d.h * 0.1, 0.006), accentMat);
  blockA.position.set(-d.w * 0.14, d.h * 0.12, 0.004);
  parts.push(blockA);

  const blockB = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.22, d.h * 0.08, 0.006), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }));
  blockB.position.set(d.w * 0.1, -d.h * 0.08, 0.004);
  parts.push(blockB);

  return parts;
}

function createDesignerChessSetModel(d, color) {
  const parts = [];
  const boardMatA = new THREE.MeshStandardMaterial({ color: 0x1f1f22, roughness: 0.5, metalness: 0.25 });
  const boardMatB = new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: 0.7, metalness: 0.05 });
  const pieceLight = new THREE.MeshStandardMaterial({ color: 0xd7d3cc, roughness: 0.45, metalness: 0.25 });
  const pieceDark = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.45, metalness: 0.35 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h * 0.24, d.d), boardMatA);
  parts.push(base);

  // Two-tone board surface
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(d.w * 0.3, 0.01, d.d * 0.3),
        (x + z) % 2 === 0 ? boardMatB : boardMatA
      );
      tile.position.set(x * d.w * 0.31, d.h * 0.13, z * d.d * 0.31);
      parts.push(tile);
    }
  }

  // Minimal sculptural pieces
  const piecePositions = [
    [-0.18, -0.18, pieceLight],
    [0, -0.18, pieceDark],
    [0.18, -0.18, pieceLight],
    [-0.09, 0.18, pieceDark],
    [0.09, 0.18, pieceLight]
  ];
  piecePositions.forEach(([px, pz, mat]) => {
    const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.1, 10), mat);
    piece.position.set(px, d.h * 0.2, pz);
    parts.push(piece);
  });

  return parts;
}

function createSilkBlazerModel(d, color) {
  const parts = [];
  const fabric = new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.85, metalness: 0.05 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.55, metalness: 0.25 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.82, d.h * 0.9, d.d * 0.34), fabric);
  parts.push(torso);

  const lapelL = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.18, d.h * 0.5, d.d * 0.06), trim);
  lapelL.position.set(-d.w * 0.12, d.h * 0.1, d.d * 0.19);
  lapelL.rotation.z = 0.22;
  parts.push(lapelL);

  const lapelR = lapelL.clone();
  lapelR.position.x = d.w * 0.12;
  lapelR.rotation.z = -0.22;
  parts.push(lapelR);

  const sleeveGeo = new THREE.BoxGeometry(d.w * 0.24, d.h * 0.62, d.d * 0.26);
  const sleeveL = new THREE.Mesh(sleeveGeo, fabric);
  sleeveL.position.set(-d.w * 0.45, -d.h * 0.02, 0);
  sleeveL.rotation.z = 0.22;
  parts.push(sleeveL);

  const sleeveR = sleeveL.clone();
  sleeveR.position.x = d.w * 0.45;
  sleeveR.rotation.z = -0.22;
  parts.push(sleeveR);

  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12), new THREE.MeshStandardMaterial({ color: 0xb59a6a, roughness: 0.25, metalness: 0.95 }));
  button.rotation.x = Math.PI / 2;
  button.position.set(0, -d.h * 0.04, d.d * 0.19);
  parts.push(button);

  return parts;
}

function createCrystalHeelsModel(d, color) {
  const parts = [];
  const soleMat = new THREE.MeshStandardMaterial({ color: 0xead7be, roughness: 0.35, metalness: 0.28 });
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8f4ff,
    roughness: 0.03,
    metalness: 0,
    transmission: 0.92,
    thickness: 0.1,
    ior: 1.47,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.96
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc8cdd4, roughness: 0.2, metalness: 1.0 });

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(d.w * 0.42, d.w * 0.46, d.h * 0.12, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a2328, roughness: 0.65, metalness: 0.2 })
  );
  plinth.position.y = -d.h * 0.28;
  parts.push(plinth);

  const addHeel = (xOffset, zOffset, yRot) => {
    const group = new THREE.Group();

    const rearSole = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.46, d.h * 0.08, d.d * 0.16), soleMat);
    rearSole.position.set(d.w * 0.06, -d.h * 0.03, -d.d * 0.1);
    group.add(rearSole);

    const arch = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.26, d.h * 0.06, d.d * 0.14), soleMat);
    arch.position.set(-d.w * 0.03, -d.h * 0.005, -d.d * 0.02);
    arch.rotation.z = -0.28;
    group.add(arch);

    const toe = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.28, d.h * 0.05, d.d * 0.2), soleMat);
    toe.position.set(-d.w * 0.2, d.h * 0.01, d.d * 0.08);
    toe.rotation.z = -0.18;
    group.add(toe);

    const heelStem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.018, d.h * 0.42, 10), metalMat);
    heelStem.position.set(d.w * 0.24, -d.h * 0.06, -d.d * 0.13);
    group.add(heelStem);

    const heelTip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    heelTip.position.set(d.w * 0.24, -d.h * 0.27, -d.d * 0.13);
    group.add(heelTip);

    const toeStrap = new THREE.Mesh(new THREE.TorusGeometry(d.w * 0.12, 0.012, 8, 18, Math.PI), crystalMat);
    toeStrap.position.set(-d.w * 0.21, d.h * 0.08, d.d * 0.1);
    toeStrap.rotation.z = Math.PI / 2;
    group.add(toeStrap);

    const ankleStrap = new THREE.Mesh(new THREE.TorusGeometry(d.w * 0.09, 0.011, 8, 18), crystalMat);
    ankleStrap.position.set(d.w * 0.02, d.h * 0.18, -d.d * 0.02);
    ankleStrap.rotation.y = Math.PI / 2;
    group.add(ankleStrap);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.022), crystalMat);
    gem.position.set(-d.w * 0.1, d.h * 0.12, d.d * 0.05);
    group.add(gem);

    group.position.set(xOffset, 0, zOffset);
    group.rotation.y = yRot;
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    parts.push(group);
  };

  addHeel(-d.w * 0.22, -0.01, 0.28);
  addHeel(d.w * 0.22, 0.03, -0.22);

  return parts;
}

function createVelvetWeekenderModel(d, color) {
  const parts = [];
  const velvet = new THREE.MeshStandardMaterial({ color: 0x4a0e6b, roughness: 0.95, metalness: 0.02 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x2a1710, roughness: 0.7, metalness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.2, metalness: 0.95 });

  const bag = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.94, d.h * 0.7, d.d * 0.85), velvet);
  parts.push(bag);

  const strapGeo = new THREE.TorusGeometry(d.w * 0.2, 0.02, 8, 20, Math.PI);
  const strapL = new THREE.Mesh(strapGeo, leather);
  strapL.position.set(-d.w * 0.2, d.h * 0.22, 0);
  parts.push(strapL);

  const strapR = strapL.clone();
  strapR.position.x = d.w * 0.2;
  parts.push(strapR);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.028, 0.01), metal);
  buckle.position.set(0, d.h * 0.08, d.d * 0.43);
  parts.push(buckle);

  return parts;
}

function createAuroraSunglassesModel(d, color) {
  const parts = [];
  const frame = new THREE.MeshStandardMaterial({ color: 0x2a2522, roughness: 0.2, metalness: 0.95 });
  const lens = new THREE.MeshPhysicalMaterial({ color: 0x9b7cff, roughness: 0.03, metalness: 0.0, transmission: 0.75, thickness: 0.04, ior: 1.45, clearcoat: 0.9, clearcoatRoughness: 0.06, transparent: true, opacity: 0.9 });

  const lensGeo = new THREE.PlaneGeometry(d.w * 0.36, d.h * 0.54);
  const leftLens = new THREE.Mesh(lensGeo, lens);
  leftLens.position.set(-d.w * 0.22, 0, 0.04);
  parts.push(leftLens);

  const rightLens = leftLens.clone();
  rightLens.position.x = d.w * 0.22;
  parts.push(rightLens);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.9, 0.02, 0.02), frame);
  topBar.position.y = d.h * 0.26;
  parts.push(topBar);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.08, 0.02, 0.02), frame);
  bridge.position.y = d.h * 0.02;
  parts.push(bridge);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, d.d * 0.72), frame);
  arm.position.set(d.w * 0.45, 0.07, -d.d * 0.34);
  parts.push(arm);

  const arm2 = arm.clone();
  arm2.position.x = -d.w * 0.45;
  parts.push(arm2);

  return parts;
}

function createCashmereWrapModel(d, color) {
  const parts = [];
  const wrapMat = new THREE.MeshStandardMaterial({ color: 0xf2ead7, roughness: 0.98, metalness: 0.0 });

  const folded = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h * 0.34, d.d * 0.86), wrapMat);
  parts.push(folded);

  const roll = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.14, d.w * 0.14, d.d * 0.74, 14), wrapMat);
  roll.rotation.x = Math.PI / 2;
  roll.position.set(0, d.h * 0.14, 0);
  parts.push(roll);

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.02, 0.012, d.d * 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 }));
  fringe.position.y = -d.h * 0.18;
  parts.push(fringe);

  return parts;
}

function createNeoBomberJacketModel(d, color) {
  const parts = [];
  const shell = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.4, metalness: 0.45 });
  const rib = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.8, metalness: 0.15 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.84, d.h * 0.8, d.d * 0.36), shell);
  parts.push(body);

  const sleeveGeo = new THREE.BoxGeometry(d.w * 0.24, d.h * 0.56, d.d * 0.24);
  const sl = new THREE.Mesh(sleeveGeo, shell);
  sl.position.set(-d.w * 0.45, -d.h * 0.02, 0);
  sl.rotation.z = 0.24;
  parts.push(sl);

  const sr = sl.clone();
  sr.position.x = d.w * 0.45;
  sr.rotation.z = -0.24;
  parts.push(sr);

  const waist = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.84, d.h * 0.09, d.d * 0.37), rib);
  waist.position.y = -d.h * 0.35;
  parts.push(waist);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.34, d.h * 0.1, d.d * 0.37), rib);
  collar.position.y = d.h * 0.35;
  parts.push(collar);

  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.012, d.h * 0.72, 0.006), new THREE.MeshStandardMaterial({ color: 0x9ba1ac, roughness: 0.2, metalness: 1.0 }));
  zip.position.set(0, 0, d.d * 0.18);
  parts.push(zip);

  return parts;
}

function createKnifeModel(d, color) {
  const parts = [];
  const blockMat = new THREE.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.86, metalness: 0.05 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xcfd4db, roughness: 0.2, metalness: 1.0 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6, metalness: 0.25 });

  const block = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.08, d.h * 0.62, d.d * 0.9), blockMat);
  block.position.y = -d.h * 0.02;
  parts.push(block);

  // Subtle top cap so blade slots read better.
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.12, d.h * 0.05, d.d * 0.95), blockMat);
  topCap.position.y = d.h * 0.3;
  parts.push(topCap);

  const knives = [
    { x: -0.11, bladeLen: 0.34, rot: -Math.PI / 3.15 },
    { x: -0.03, bladeLen: 0.3,  rot: -Math.PI / 3.0 },
    { x:  0.05, bladeLen: 0.36, rot: -Math.PI / 3.2 },
    { x:  0.13, bladeLen: 0.27, rot: -Math.PI / 2.9 }
  ];

  knives.forEach((k) => {
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.01, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0, metalness: 0.0 })
    );
    slot.position.set(k.x, d.h * 0.32, -0.03);
    parts.push(slot);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.018, k.bladeLen, 0.055), steelMat);
    blade.position.set(k.x, d.h * 0.46, -0.03);
    blade.rotation.x = k.rot;
    parts.push(blade);

    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.04, 0.06), new THREE.MeshStandardMaterial({ color: 0xa8adb5, roughness: 0.25, metalness: 1.0 }));
    bolster.position.set(k.x, d.h * 0.35, -0.03);
    bolster.rotation.x = k.rot;
    parts.push(bolster);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.2, 10), handleMat);
    handle.position.set(k.x, d.h * 0.23, 0.02);
    handle.rotation.x = k.rot;
    parts.push(handle);
  });

  return parts;
}

function createTruffleJarModel(d, color) {
  const parts = [];
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x6a3f2a,
    roughness: 0.06,
    metalness: 0.0,
    transmission: 0.85,
    thickness: 0.18,
    ior: 1.45,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.95
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.35, metalness: 0.85 });

  const jar = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.34, d.w * 0.39, d.h * 0.8, 20), glassMat);
  parts.push(jar);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.31, d.w * 0.31, d.h * 0.12, 20), capMat);
  cap.position.y = d.h * 0.44;
  parts.push(cap);

  // Truffles inside glass
  const truffleMat = new THREE.MeshStandardMaterial({ color: 0x2d2017, roughness: 0.95, metalness: 0.02 });
  [[-0.05, -0.12, 0.02], [0.02, -0.08, -0.01], [0.06, -0.12, 0.03], [-0.01, -0.15, -0.03]].forEach(([x, y, z]) => {
    const truffle = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), truffleMat);
    truffle.position.set(x, y, z);
    parts.push(truffle);
  });

  const label = new THREE.Mesh(
    new THREE.BoxGeometry(d.w * 0.62, d.h * 0.26, 0.008),
    new THREE.MeshStandardMaterial({ color: 0xf4ead9, roughness: 0.88, metalness: 0.0 })
  );
  label.position.set(0, -d.h * 0.03, d.w * 0.39);
  parts.push(label);

  return parts;
}

function createSaffronVialModel(d, color) {
  const parts = [];
  const vialMat = new THREE.MeshPhysicalMaterial({
    color: 0xe37a1f,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 0.12,
    ior: 1.46,
    clearcoat: 0.85,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.96
  });
  const corkMat = new THREE.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.95, metalness: 0.0 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.2, d.w * 0.22, d.h * 0.82, 16), vialMat);
  parts.push(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.1, d.w * 0.14, d.h * 0.18, 12), vialMat);
  neck.position.y = d.h * 0.43;
  parts.push(neck);

  // Saffron strands inside vial
  const strandMat = new THREE.MeshStandardMaterial({ color: 0xcd3a00, roughness: 0.55, metalness: 0.0 });
  for (let i = 0; i < 9; i++) {
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.09, 5), strandMat);
    strand.position.set((i - 4) * 0.004, -0.08 + (i % 3) * 0.02, (i % 2 === 0 ? -1 : 1) * 0.01);
    strand.rotation.z = 0.35 - i * 0.05;
    parts.push(strand);
  }

  const cork = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.11, d.w * 0.105, d.h * 0.16, 10), corkMat);
  cork.position.y = d.h * 0.58;
  parts.push(cork);

  return parts;
}

function createBalsamicBottleModel(d, color) {
  const parts = [];
  const bottleGlass = new THREE.MeshPhysicalMaterial({
    color: 0x1c140f,
    roughness: 0.08,
    metalness: 0.0,
    transmission: 0.78,
    thickness: 0.2,
    ior: 1.48,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.96
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.45, metalness: 0.85 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.22, d.w * 0.27, d.h * 0.54, 18), bottleGlass);
  base.position.y = -d.h * 0.1;
  parts.push(base);

  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.16, d.w * 0.22, d.h * 0.2, 16), bottleGlass);
  shoulder.position.y = d.h * 0.25;
  parts.push(shoulder);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.085, d.w * 0.1, d.h * 0.24, 12), bottleGlass);
  neck.position.y = d.h * 0.46;
  parts.push(neck);

  // Liquid core for depth
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(d.w * 0.16, d.w * 0.2, d.h * 0.45, 16),
    new THREE.MeshStandardMaterial({ color: 0x120a06, roughness: 0.25, metalness: 0.0 })
  );
  liquid.position.y = -d.h * 0.12;
  parts.push(liquid);

  const label = new THREE.Mesh(
    new THREE.BoxGeometry(d.w * 0.34, d.h * 0.24, 0.008),
    new THREE.MeshStandardMaterial({ color: 0xf1e6d4, roughness: 0.9 })
  );
  label.position.set(0, 0.02, d.w * 0.24);
  parts.push(label);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.082, d.w * 0.082, d.h * 0.1, 10), capMat);
  cap.position.y = d.h * 0.61;
  parts.push(cap);

  return parts;
}

function createCacaoBarModel(d, color) {
  const parts = [];
  const wrapMat = new THREE.MeshStandardMaterial({ color: 0x3d1c02, roughness: 0.55, metalness: 0.08 });
  const chocoMat = new THREE.MeshStandardMaterial({ color: 0x2a1508, roughness: 0.75, metalness: 0.0 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.05, d.h * 0.35, d.d * 0.78), wrapMat);
  parts.push(base);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.92, d.h * 0.22, d.d * 0.68), chocoMat);
  slab.position.y = d.h * 0.16;
  parts.push(slab);

  for (let i = -1; i <= 1; i++) {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.26, 0.008, d.d * 0.62),
      new THREE.MeshStandardMaterial({ color: 0x1a0d05, roughness: 1.0 })
    );
    groove.position.set(i * d.w * 0.28, d.h * 0.27, 0);
    parts.push(groove);
  }

  return parts;
}

function createWagyuTrayModel(d, color) {
  const parts = [];
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.65, metalness: 0.1 });
  const marbleTex = getWagyuMarbleTexture();
  const meatMat = new THREE.MeshStandardMaterial({
    color: 0x8b0000,
    roughness: 0.5,
    metalness: 0.0,
    map: marbleTex,
    bumpMap: marbleTex,
    bumpScale: 0.006
  });
  const fatMat = new THREE.MeshStandardMaterial({ color: 0xf2c4bc, roughness: 0.75, metalness: 0.0 });

  const tray = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.12, d.h * 0.22, d.d * 0.85), trayMat);
  tray.position.y = -d.h * 0.12;
  parts.push(tray);

  for (let i = 0; i < 3; i++) {
    const meat = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.28, d.h * 0.17, d.d * 0.65), meatMat);
    meat.position.set((i - 1) * d.w * 0.31, d.h * 0.02, 0);
    parts.push(meat);

    for (let s = 0; s < 4; s++) {
      const marbling = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.2, 0.005, d.d * (0.1 + s * 0.07)), fatMat);
      marbling.position.set((i - 1) * d.w * 0.31 + (s - 1.5) * 0.006, d.h * (0.07 + s * 0.013), 0);
      marbling.rotation.y = (s - 1.5) * 0.2;
      parts.push(marbling);
    }
  }

  return parts;
}

let _wagyuMarbleTexture = null;
function getWagyuMarbleTexture() {
  if (_wagyuMarbleTexture) return _wagyuMarbleTexture;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#8a1111';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 24; i++) {
    ctx.strokeStyle = `rgba(247, 214, 206, ${0.14 + (i % 6) * 0.04})`;
    ctx.lineWidth = 2 + (i % 3);
    const y = 8 + i * 10;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(i * 0.5) * 6);
    ctx.bezierCurveTo(60, y - 8, 140, y + 8, 256, y + Math.cos(i * 0.37) * 6);
    ctx.stroke();
  }

  _wagyuMarbleTexture = new THREE.CanvasTexture(c);
  _wagyuMarbleTexture.wrapS = THREE.RepeatWrapping;
  _wagyuMarbleTexture.wrapT = THREE.RepeatWrapping;
  _wagyuMarbleTexture.repeat.set(1.3, 1.3);
  _wagyuMarbleTexture.anisotropy = 8;
  return _wagyuMarbleTexture;
}

function createTomatoModel(d, color) {
  const parts = [];
  const tomatoRed = new THREE.Color('#cc2200');
  const tomatoDark = new THREE.Color('#991a00');

  // ── Main body: squashed sphere (slightly wider than tall) ──
  const bodyMat = new THREE.MeshStandardMaterial({
    color: tomatoRed,
    roughness: 0.35,
    metalness: 0.05,
    envMapIntensity: 1.2
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(d.w * 0.48, 32, 24), bodyMat);
  body.scale.y = 0.82; // squash vertically — tomatoes are wider than tall
  body.castShadow = true;
  body.receiveShadow = true;
  parts.push(body);

  // ── Subtle ribbing: 5 darker vertical seam lines ──
  const seamMat = new THREE.MeshStandardMaterial({
    color: tomatoDark,
    roughness: 0.55,
    metalness: 0.0
  });
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const seamGeo = new THREE.SphereGeometry(d.w * 0.045, 4, 12);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.scale.set(0.25, 0.85, 0.25);
    seam.position.set(
      Math.sin(angle) * d.w * 0.38,
      0,
      Math.cos(angle) * d.w * 0.38
    );
    seam.castShadow = false;
    parts.push(seam);
  }

  // ── Green calyx (star-shaped leaves at top) ──
  const calyxMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2a7a1a'),
    roughness: 0.75,
    metalness: 0.0
  });
  const numLeaves = 5;
  for (let i = 0; i < numLeaves; i++) {
    const angle = (i / numLeaves) * Math.PI * 2;
    const leafGeo = new THREE.SphereGeometry(1, 8, 6);
    const leaf = new THREE.Mesh(leafGeo, calyxMat);
    // Flatten into a pointed leaf shape
    leaf.scale.set(d.w * 0.075, d.w * 0.018, d.w * 0.22);
    leaf.rotation.x = -0.45; // tilt slightly upward
    leaf.rotation.y = angle;
    leaf.position.set(
      Math.sin(angle) * d.w * 0.18,
      body.scale.y * d.w * 0.47,
      Math.cos(angle) * d.w * 0.18
    );
    leaf.castShadow = true;
    parts.push(leaf);
  }

  // ── Small centre disc at calyx base ──
  const calyxCentre = new THREE.Mesh(
    new THREE.CylinderGeometry(d.w * 0.075, d.w * 0.075, d.w * 0.025, 12),
    calyxMat
  );
  calyxCentre.position.y = body.scale.y * d.w * 0.47;
  parts.push(calyxCentre);

  // ── Stem ──
  const stemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5a3010'),
    roughness: 0.85,
    metalness: 0.0
  });
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(d.w * 0.025, d.w * 0.035, d.w * 0.14, 8),
    stemMat
  );
  stem.position.y = body.scale.y * d.w * 0.47 + d.w * 0.075;
  stem.rotation.z = 0.15; // slight lean
  stem.castShadow = true;
  parts.push(stem);

  return parts;
}

function createBroccoliModel(d, color) {
  const parts = [];

  const darkGreen  = new THREE.Color('#1a5c0a');
  const midGreen   = new THREE.Color('#2a7a1a');
  const lightGreen = new THREE.Color('#3d9e28');
  const stalkColor = new THREE.Color('#4a7a20');

  // ── Thick stalk ──
  const stalkMat = new THREE.MeshStandardMaterial({ color: stalkColor, roughness: 0.8, metalness: 0.0 });
  const stalk = new THREE.Mesh(
    new THREE.CylinderGeometry(d.w * 0.10, d.w * 0.13, d.h * 0.55, 10),
    stalkMat
  );
  stalk.position.y = -d.h * 0.10;
  stalk.castShadow = true;
  parts.push(stalk);

  // ── Stalk top disc (connects stalk to head) ──
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(d.w * 0.22, d.w * 0.14, d.h * 0.06, 12),
    stalkMat
  );
  disc.position.y = d.h * 0.18;
  parts.push(disc);

  // Helper: a bumpy dome cluster
  function addCluster(cx, cy, cz, radius, mat) {
    // Central dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
      mat
    );
    dome.position.set(cx, cy, cz);
    dome.castShadow = true;
    parts.push(dome);

    // Smaller bumps around dome edge for floret texture
    const bumpCount = 6;
    for (let i = 0; i < bumpCount; i++) {
      const ba = (i / bumpCount) * Math.PI * 2;
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.42, 8, 6),
        mat
      );
      bump.position.set(
        cx + Math.sin(ba) * radius * 0.68,
        cy + radius * 0.18,
        cz + Math.cos(ba) * radius * 0.68
      );
      bump.castShadow = true;
      parts.push(bump);
    }
  }

  const darkMat  = new THREE.MeshStandardMaterial({ color: darkGreen,  roughness: 0.85, metalness: 0.0 });
  const midMat   = new THREE.MeshStandardMaterial({ color: midGreen,   roughness: 0.80, metalness: 0.0 });
  const lightMat = new THREE.MeshStandardMaterial({ color: lightGreen, roughness: 0.75, metalness: 0.0 });

  // ── Main central large cluster ──
  addCluster(0, d.h * 0.36, 0, d.w * 0.25, midMat);

  // ── Surrounding mid clusters (5 around) ──
  const midCount = 5;
  for (let i = 0; i < midCount; i++) {
    const angle = (i / midCount) * Math.PI * 2;
    const r = d.w * 0.21;
    addCluster(
      Math.sin(angle) * r,
      d.h * 0.28 + (i % 2 === 0 ? 0.01 : -0.01),
      Math.cos(angle) * r,
      d.w * 0.17,
      i % 2 === 0 ? darkMat : lightMat
    );
  }

  // ── Outer ring of smaller florets ──
  const outerCount = 8;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2 + 0.2;
    const r = d.w * 0.33;
    addCluster(
      Math.sin(angle) * r,
      d.h * 0.18,
      Math.cos(angle) * r,
      d.w * 0.11,
      i % 3 === 0 ? darkMat : midMat
    );
  }

  return parts;
}

function createDiscModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
  
  // Disc
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.45, d.w * 0.45, 0.01, 32), mat);
  disc.rotation.x = Math.PI / 2;
  parts.push(disc);

  // Center label
  const label = new THREE.Mesh(new THREE.CylinderGeometry(d.w * 0.15, d.w * 0.15, 0.011, 16), 
                new THREE.MeshStandardMaterial({ color }));
  label.rotation.x = Math.PI / 2;
  parts.push(label);

  return parts;
}

function createSunglassesModel(d, color) {
  const parts = [];
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.7, metalness: 0.5 });

  // 2 Lenses (flat rectangles for style)
  const lensGeo = new THREE.PlaneGeometry(d.w * 0.4, d.h * 0.6);
  const leftLens = new THREE.Mesh(lensGeo, lensMat);
  leftLens.position.set(-d.w * 0.22, 0, 0.05);
  parts.push(leftLens);

  const rightLens = leftLens.clone();
  rightLens.position.x = d.w * 0.22;
  parts.push(rightLens);

  // Frame
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.1, 0.02, 0.02), frameMat);
  parts.push(bridge);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.9, 0.03, 0.02), frameMat);
  topBar.position.y = d.h * 0.3;
  parts.push(topBar);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.02, 0.02, d.d);
  const leftArm = new THREE.Mesh(armGeo, frameMat);
  leftArm.position.set(-d.w * 0.45, 0.1, -d.d/2);
  parts.push(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = d.w * 0.45;
  parts.push(rightArm);

  return parts;
}

function createWrapModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.0 });
  
  // Folded scarf shape
  const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h * 0.4, d.d), mat);
  parts.push(body);
  
  // Fringe/Edges
  const fringe = new THREE.Mesh(new THREE.BoxGeometry(d.w * 1.05, d.h * 0.05, d.d * 1.05),
                 new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
  fringe.position.y = -d.h * 0.2;
  parts.push(fringe);

  return parts;
}

function createGogglesModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, transparent: true, opacity: 0.6, metalness: 0.9 });

  // 2 Lenses
  const lensGeo = new THREE.SphereGeometry(d.w * 0.2, 16, 12);
  const leftLens = new THREE.Mesh(lensGeo, lensMat);
  leftLens.scale.z = 0.5;
  leftLens.position.x = -d.w * 0.22;
  parts.push(leftLens);

  const rightLens = leftLens.clone();
  rightLens.position.x = d.w * 0.22;
  parts.push(rightLens);

  // Strap
  const strap = new THREE.Mesh(new THREE.TorusGeometry(d.w * 0.4, 0.02, 8, 24, Math.PI), 
                new THREE.MeshStandardMaterial({ color: 0x222222 }));
  strap.rotation.x = -Math.PI / 2;
  parts.push(strap);

  return parts;
}

function createHeadphonesModel(d, color) {
  const parts = [];
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
  const softMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

  // 2 Ear cups
  const cupGeo = new THREE.CylinderGeometry(d.w * 0.35, d.w * 0.35, 0.15, 16);
  const leftCup = new THREE.Mesh(cupGeo, mat);
  leftCup.rotation.z = Math.PI / 2;
  leftCup.position.x = -d.w * 0.4;
  parts.push(leftCup);

  const rightCup = leftCup.clone();
  rightCup.position.x = d.w * 0.4;
  parts.push(rightCup);

  // Soft pads
  const padGeo = new THREE.CylinderGeometry(d.w * 0.38, d.w * 0.38, 0.05, 16);
  const leftPad = new THREE.Mesh(padGeo, softMat);
  leftPad.rotation.z = Math.PI / 2;
  leftPad.position.x = -d.w * 0.3;
  parts.push(leftPad);

  const rightPad = leftPad.clone();
  rightPad.position.x = d.w * 0.3;
  parts.push(rightPad);

  // Headband
  const bandGeo = new THREE.TorusGeometry(d.w * 0.4, 0.04, 8, 24, Math.PI);
  const band = new THREE.Mesh(bandGeo, mat);
  band.position.y = 0.1;
  parts.push(band);

  return parts;
}

/* ── Emoji → CanvasTexture ────────────────────────────── */
function makeEmojiTexture(emoji, bgColor, accent) {
  const size   = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx    = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Radial highlight
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   'rgba(255,255,255,0.07)');
  g.addColorStop(1,   'rgba(0,0,0,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Thin accent border
  ctx.strokeStyle = accent + '55';
  ctx.lineWidth   = 5;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // Emoji
  ctx.font         = `${Math.floor(size * 0.52)}px serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * GLTF Loader Promise wrapper
 */
function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}

/* ── Hover FX (called from vr-engine) ────────────────── */
export function onProductHoverFX(group, isHover) {
  if (!group) return;
  const scale = isHover ? 1.1 : 1.0;
  const glow  = isHover ? 1.5 : 0.0;
  const edge  = isHover ? 0.5 : 0.0;
  const op    = isHover ? 0.6 : 0.0;

  group.scale.setScalar(scale);
  if (group.userData.glowLight) group.userData.glowLight.intensity = glow;
  if (group.userData.edgeMat) {
    group.userData.edgeMat.emissiveIntensity = edge;
    group.userData.edgeMat.opacity           = op;
  }
}

/* ── Getters / cleanup ────────────────────────────────── */
export function getProductMeshes() { return PRODUCT_MESHES; }

export function clearProducts(scene) {
  PRODUCT_MESHES.forEach(g => {
    scene.remove(g);
    g.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
  });
  PRODUCT_MESHES.length = 0;
}
