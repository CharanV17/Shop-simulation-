/* ═══════════════════════════════════════════════════════════
   vr-engine.js — Three.js core engine
   Camera positions:
     Index 0  = centre front  (default)
     Index 1  = angle left
     Index 2  = angle right
     Index 3  = close-up front (forward / UP arrow)
   Arrow keys:
     ← Left   = angle left  (index 1)
     → Right  = angle right (index 2)
     ↑ Up     = move FORWARD closer to shelves (index 3)
     ↓ Down   = move BACK to entrance (index 0)
═══════════════════════════════════════════════════════════ */
import { buildShopEnvironment, clearShop } from './shop-builder.js';
import { buildProductMeshes, clearProducts, getProductMeshes, onProductHoverFX } from './product-mesh.js';
import { onProductClick, onProductHover, onProductHoverEnd } from './ui-overlay.js';

let renderer, cssRenderer, scene, camera, animId;
let currentLookAt   = new THREE.Vector3(0, 1.5, 0);
let targetCamPos    = null;
let targetLookAt    = null;
let hoveredMesh     = null;
let selectedMesh    = null;    // currently clicked/highlighted product
let raycaster, mouse;
let isReady = false;

const LERP = 0.065;

/* ── 4 camera presets ─────────────────────────────────────
   0 = centre entrance   (default view)
   1 = left angle
   2 = right angle
   3 = close-up front    (UP arrow — move forward)
──────────────────────────────────────────────────────────*/
const CAM = [
  { pos: new THREE.Vector3(  0,  2.2,  7.5 ), look: new THREE.Vector3(  0,  1.5,  0  ) }, // 0 centre
  { pos: new THREE.Vector3( -5,  2.0,  4.0 ), look: new THREE.Vector3( -1,  1.5, -2  ) }, // 1 left angle
  { pos: new THREE.Vector3(  5,  2.0,  4.0 ), look: new THREE.Vector3(  1,  1.5, -2  ) }, // 2 right angle
  { pos: new THREE.Vector3(  0,  1.8,  2.5 ), look: new THREE.Vector3(  0,  1.6, -5  ) }, // 3 close-up forward
];

let currentCamIdx = 0;

/* ── Init ─────────────────────────────────────────────── */
export function initEngine(canvasContainer, cssContainer) {
  scene  = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.04);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(CAM[0].pos);
  currentLookAt.copy(CAM[0].look);
  camera.lookAt(currentLookAt);

  // WebGL renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.outputEncoding    = THREE.sRGBEncoding;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  canvasContainer.appendChild(renderer.domElement);

  // CSS2D renderer for any remaining overlays
  cssRenderer = new THREE.CSS2DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
  cssContainer.appendChild(cssRenderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse     = new THREE.Vector2();

  window.addEventListener('resize',      onResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click',     onMouseClick);

  animate();
}

/* ── Load shop ────────────────────────────────────────── */
export async function loadShop(shopData) {
  await fadeOut();

  clearShop(scene);
  clearProducts(scene);
  selectedMesh  = null;
  currentCamIdx = 0;

  const fogColor = new THREE.Color(shopData.theme.wall);
  scene.fog.color.copy(fogColor);
  renderer.setClearColor(fogColor, 1);

  buildShopEnvironment(scene, shopData);
  buildProductMeshes(scene, shopData.products, shopData.theme);

  snapCamera(0);
  await fadeIn();
  isReady = true;
}

/* ── Camera controls ──────────────────────────────────── */
export function moveCameraTo(idx) {
  const i = Math.max(0, Math.min(CAM.length - 1, idx));
  currentCamIdx  = i;
  targetCamPos   = CAM[i].pos.clone();
  targetLookAt   = CAM[i].look.clone();
}

// ← Left angle
export function moveCameraLeft()    { moveCameraTo(1); }
// → Right angle
export function moveCameraRight()   { moveCameraTo(2); }
// ↑ Forward (close-up)
export function moveCameraForward() { moveCameraTo(3); }
// ↓ Back (centre entrance)
export function moveCameraBack()    { moveCameraTo(0); }
// Centre reset
export function moveCameraCenter()  { moveCameraTo(0); }

export function getCameraIndex()    { return currentCamIdx; }
export function getCameraPresets()  { return CAM; }

function snapCamera(idx) {
  camera.position.copy(CAM[idx].pos);
  currentLookAt.copy(CAM[idx].look);
  camera.lookAt(currentLookAt);
  targetCamPos  = null;
  targetLookAt  = null;
  currentCamIdx = idx;
}

/* ── Animate loop ─────────────────────────────────────── */
function animate() {
  animId = requestAnimationFrame(animate);

  // Smooth camera lerp
  if (targetCamPos) {
    camera.position.lerp(targetCamPos, LERP);
    currentLookAt.lerp(targetLookAt,   LERP);
    camera.lookAt(currentLookAt);
    if (camera.position.distanceTo(targetCamPos) < 0.008) {
      camera.position.copy(targetCamPos);
      currentLookAt.copy(targetLookAt);
      camera.lookAt(currentLookAt);
      targetCamPos = null;
      targetLookAt = null;
    }
  }

  // Float + slow rotate products
  const t = performance.now() * 0.001;
  getProductMeshes().forEach((m, i) => {
    if (m.userData.animate) {
      m.position.y = m.userData.baseY + Math.sin(t * 0.8 + i * 1.2) * 0.04;
      m.rotation.y += 0.003;
    }
  });

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

/* ── Raycasting ───────────────────────────────────────── */
function onMouseMove(e) {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(getProductMeshes(), true);

  if (hits.length > 0) {
    const root = getRoot(hits[0].object);
    if (root && root !== hoveredMesh) {
      if (hoveredMesh && hoveredMesh !== selectedMesh) onProductHoverEnd(hoveredMesh);
      hoveredMesh = root;
      if (root !== selectedMesh) onProductHover(root);
    }
    renderer.domElement.style.cursor = 'pointer';
  } else {
    if (hoveredMesh && hoveredMesh !== selectedMesh) {
      onProductHoverEnd(hoveredMesh);
      hoveredMesh = null;
    }
    renderer.domElement.style.cursor = 'default';
  }
}

function onMouseClick(e) {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(getProductMeshes(), true);

  if (hits.length > 0) {
    const root = getRoot(hits[0].object);
    if (!root || !root.userData.product) return;

    // Deselect previous
    if (selectedMesh && selectedMesh !== root) {
      clearHighlight(selectedMesh);
    }

    selectedMesh = root;
    applyHighlight(root);
    onProductClick(root.userData.product);
  }
}

/* ── Highlight selected product ──────────────────────── */
function applyHighlight(group) {
  // Scale up + strong glow
  group.scale.setScalar(1.18);
  if (group.userData.glowLight) group.userData.glowLight.intensity = 3.0;
  // Pulsing outline via emissive
  group.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.emissive    = child.material.emissive || new THREE.Color(0x000000);
      child.userData._origEmissive = child.material.emissive.clone();
      child.material.emissiveIntensity = 0.35;
    }
  });
}

export function clearHighlight(group) {
  if (!group) return;
  group.scale.setScalar(1.0);
  if (group.userData.glowLight) group.userData.glowLight.intensity = 0;
  group.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.emissiveIntensity = 0;
    }
  });
}

export function clearSelectedProduct() {
  if (selectedMesh) { clearHighlight(selectedMesh); selectedMesh = null; }
}

/* ── Root finder ──────────────────────────────────────── */
function getRoot(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData?.isProduct) return cur;
    cur = cur.parent;
  }
  return null;
}

/* ── Fade ─────────────────────────────────────────────── */
function fadeOut() {
  return new Promise(res => {
    const o = document.getElementById('vrFadeOverlay');
    if (o) { o.style.opacity = '1'; setTimeout(res, 350); } else res();
  });
}
function fadeIn() {
  return new Promise(res => {
    const o = document.getElementById('vrFadeOverlay');
    if (o) { o.style.opacity = '0'; setTimeout(res, 350); } else res();
  });
}

/* ── Resize ───────────────────────────────────────────── */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

export function destroyEngine() {
  cancelAnimationFrame(animId);
  renderer.dispose();
}
