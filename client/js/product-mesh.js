/* ═══════════════════════════════════════════════════════════
   product-mesh.js
   - NO CSS2D floating price labels (removed entirely)
   - Clean 3D product boxes with emoji canvas texture
   - Hover: subtle scale + glow
   - Click: handled by vr-engine (highlight + side panel)
═══════════════════════════════════════════════════════════ */

const PRODUCT_MESHES = [];

/* ── Shelf slot positions ─────────────────────────────────
   3 shelf units × 2 shelf levels × 3 slots = 18 positions
──────────────────────────────────────────────────────────*/
const SLOTS = [
  // Left unit  (x ≈ -4.5)
  { x: -5.2, y: 0.9,  z: -5.2 }, { x: -4.5, y: 0.9,  z: -5.2 }, { x: -3.8, y: 0.9,  z: -5.2 },
  { x: -5.2, y: 2.0,  z: -5.2 }, { x: -4.5, y: 2.0,  z: -5.2 }, { x: -3.8, y: 2.0,  z: -5.2 },
  // Centre unit (x ≈ 0)
  { x: -0.7, y: 0.9,  z: -5.2 }, { x:  0.0, y: 0.9,  z: -5.2 }, { x:  0.7, y: 0.9,  z: -5.2 },
  { x: -0.7, y: 2.0,  z: -5.2 }, { x:  0.0, y: 2.0,  z: -5.2 }, { x:  0.7, y: 2.0,  z: -5.2 },
  // Right unit (x ≈ 4.5)
  { x:  3.8, y: 0.9,  z: -5.2 }, { x:  4.5, y: 0.9,  z: -5.2 }, { x:  5.2, y: 0.9,  z: -5.2 },
  { x:  3.8, y: 2.0,  z: -5.2 }, { x:  4.5, y: 2.0,  z: -5.2 }, { x:  5.2, y: 2.0,  z: -5.2 },
];

/* ── Main builder ─────────────────────────────────────── */
export function buildProductMeshes(scene, products, theme) {
  products.forEach((product, i) => {
    const slot = SLOTS[i % SLOTS.length];
    if (!slot) return;

    const group = new THREE.Group();
    group.userData.isProduct = true;
    group.userData.product   = product;

    const d = product.dimensions || { w: 0.45, h: 0.45, d: 0.45 };

    // ── Main product box ──────────────────────────────
    const geo = new THREE.BoxGeometry(d.w, d.h, d.d);
    const mat = new THREE.MeshStandardMaterial({
      color:     new THREE.Color(product.color || '#444455'),
      roughness: 0.35,
      metalness: 0.5,
    });
    const box = new THREE.Mesh(geo, mat);
    box.castShadow    = true;
    box.receiveShadow = true;
    group.add(box);

    // ── Emoji canvas texture on front face ────────────
    const faceTex = makeEmojiTexture(product.emoji, product.color || '#1a1a2e', theme.accent);
    const faceMat = new THREE.MeshStandardMaterial({
      map:         faceTex,
      roughness:   0.25,
      metalness:   0.1,
      transparent: true,
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.88, d.h * 0.88), faceMat);
    face.position.z = d.d / 2 + 0.003;
    group.add(face);

    // ── Thin accent border around box (invisible at rest, glows on hover) ──
    const edgeMat = new THREE.MeshStandardMaterial({
      color:            new THREE.Color(theme.accent),
      emissive:         new THREE.Color(theme.accent),
      emissiveIntensity: 0,
      roughness:        0.1,
      metalness:        1.0,
      transparent:      true,
      opacity:          0.0,   // hidden at rest
    });
    const edgeGeo = new THREE.BoxGeometry(d.w + 0.03, d.h + 0.03, d.d + 0.03);
    const edges   = new THREE.Mesh(edgeGeo, edgeMat);
    group.add(edges);
    group.userData.edgeMesh = edges;
    group.userData.edgeMat  = edgeMat;

    // ── Hidden point light — shown on hover/select ────
    const glow = new THREE.PointLight(new THREE.Color(theme.accent), 0, 3.0);
    glow.position.set(0, 0, 0.8);
    group.add(glow);
    group.userData.glowLight = glow;

    // ── Position on shelf ─────────────────────────────
    group.position.set(slot.x, slot.y + d.h / 2, slot.z);
    group.userData.baseY   = slot.y + d.h / 2;
    group.userData.animate = true;
    group.rotation.y       = (Math.random() - 0.5) * 0.25;

    scene.add(group);
    PRODUCT_MESHES.push(group);
  });
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
