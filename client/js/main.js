/* ═══════════════════════════════════════════════════════════
   main.js — App bootstrap, screen routing, auth + session
   Entry point for index.html (lobby / auth)
═══════════════════════════════════════════════════════════ */
import { Auth, AuthAPI, ShopsAPI } from './api.js';

let currentUser = null;
let allShops    = [];

/* ── On load ──────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  // Splash sequence
  const msgs = [
    'Initialising VR environment…',
    'Loading Three.js engine…',
    'Fetching shop data…',
    'Preparing 3D assets…',
    'Ready!'
  ];
  let i = 0;
  const statusEl = document.getElementById('splashStatus');
  const splashInterval = setInterval(() => {
    i++;
    if (statusEl && i < msgs.length) statusEl.textContent = msgs[i];
    if (i >= msgs.length - 1) {
      clearInterval(splashInterval);
      setTimeout(init, 400);
    }
  }, 550);
});

async function init() {
  if (Auth.isLoggedIn()) {
    try {
      currentUser = await AuthAPI.me();
      await loadLobby();
    } catch (_) {
      Auth.clearToken();
      showScreen('auth');
    }
  } else {
    showScreen('auth');
  }
}

/* ── Screen management ────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('visible');
  });
  const el = document.getElementById('screen-' + id);
  if (el) { el.classList.remove('hidden'); el.classList.add('visible'); }
}

/* ════════════════════════════════════════════════════════
   AUTH
════════════════════════════════════════════════════════ */
// Toggle forms
window.showLoginForm    = () => {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
};
window.showRegisterForm = () => {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
};

window.fillDemo = (e, p) => {
  document.getElementById('loginEmail').value    = e;
  document.getElementById('loginPassword').value = p;
};

window.handleLogin = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  const btn = document.getElementById('loginBtn');
  btn.textContent = 'Signing in…'; btn.disabled = true;

  try {
    currentUser = await AuthAPI.login(email, pwd);
    await loadLobby();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    btn.textContent = 'Enter NEXUS →'; btn.disabled = false;
  }
};

window.handleRegister = async () => {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pwd   = document.getElementById('regPassword').value;
  const errEl = document.getElementById('regError');
  errEl.classList.add('hidden');

  const btn = document.getElementById('registerBtn');
  btn.textContent = 'Creating…'; btn.disabled = true;

  try {
    currentUser = await AuthAPI.register(name, email, pwd);
    await loadLobby();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    btn.textContent = 'Create Account →'; btn.disabled = false;
  }
};

window.handleLogout = () => {
  AuthAPI.logout();
  currentUser = null;
  allShops    = [];
  showScreen('auth');
};

/* ════════════════════════════════════════════════════════
   LOBBY
════════════════════════════════════════════════════════ */
async function loadLobby() {
  try {
    allShops = await ShopsAPI.getAll();
  } catch (e) {
    // Fallback to embedded data if backend unavailable
    allShops = getFallbackShops();
  }
  renderUserChip();
  renderShopsGrid();
  showScreen('lobby');
}

function renderUserChip() {
  if (!currentUser) return;
  const avatarEl = document.getElementById('userAvatar');
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRoleLabel');
  const adminBtn = document.getElementById('adminBtn');

  if (avatarEl) avatarEl.textContent = currentUser.avatar || currentUser.name[0].toUpperCase();
  if (nameEl)   nameEl.textContent   = currentUser.name;
  if (roleEl)   roleEl.textContent   = currentUser.role.toUpperCase();
  if (adminBtn) adminBtn.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
}

function renderShopsGrid() {
  const grid = document.getElementById('shopsGrid');
  if (!grid) return;

  grid.innerHTML = allShops.map((shop, i) => `
    <article class="shop-card" style="--accent:${shop.theme.primary || shop.theme.accent};animation-delay:${i * 80}ms"
             onclick="window.enterShop('${shop.id}')">
      <div class="shop-card-bg" style="background:linear-gradient(135deg,${shop.theme.secondary},${shop.theme.wall});">
        <span class="shop-emoji">${shop.emoji}</span>
        <div class="shop-card-glow" style="background:radial-gradient(circle,${shop.theme.accent}30 0%,transparent 70%);"></div>
      </div>
      <div class="shop-card-badge">
        <span style="color:${shop.theme.accent};">● OPEN</span>
        <span>${shop.productCount || '6'} items</span>
      </div>
      <div class="shop-card-body">
        <h3 class="shop-name">${shop.name}</h3>
        <p class="shop-desc">${shop.description}</p>
        <div class="shop-card-footer">
          <span class="shop-enter-hint">Click to Enter</span>
          <span class="shop-arrow" style="color:${shop.theme.accent};">→</span>
        </div>
      </div>
    </article>
  `).join('');
}

window.enterShop = async (shopId) => {
  // Store shop ID + token in sessionStorage and navigate
  sessionStorage.setItem('nexus_shopId', shopId);
  sessionStorage.setItem('nexus_shops',  JSON.stringify(allShops));
  window.location.href = 'shop.html';
};

window.goAdmin = () => {
  if (currentUser?.role !== 'admin') { alert('Admin access only.'); return; }
  window.location.href = 'admin.html';
};

/* ── Enter key on login ───────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const loginScreen = document.getElementById('screen-auth');
    if (loginScreen && !loginScreen.classList.contains('hidden')) {
      if (!document.getElementById('loginForm')?.classList.contains('hidden')) {
        window.handleLogin?.();
      }
    }
  }
});

/* ── Fallback shop data (offline mode) ────────────────── */
function getFallbackShops() {
  return [
    { id:'tech-hub',         name:'Tech Hub',          description:'Cutting-edge gadgets & electronics', emoji:'⚡', theme:{primary:'#00FFB3',accent:'#00FFB3',secondary:'#0a2040',wall:'#071020'}, productCount:6 },
    { id:'fashion-district', name:'Fashion District',  description:'Curated luxury fashion',              emoji:'👗', theme:{primary:'#FF2D6B',accent:'#FF2D6B',secondary:'#2d0820',wall:'#0f0210'}, productCount:6 },
    { id:'gourmet-market',   name:'Gourmet Market',    description:'Artisan foods & kitchen essentials',  emoji:'🍕', theme:{primary:'#FFD166',accent:'#FFD166',secondary:'#2d1800',wall:'#0f0800'}, productCount:6 },
    { id:'sports-zone',      name:'Sports Zone',       description:'Performance gear for champions',       emoji:'⚽', theme:{primary:'#00FF7F',accent:'#00FF7F',secondary:'#002810',wall:'#000e05'}, productCount:6 },
    { id:'art-gallery',      name:'Art Gallery',       description:'Curated fine art & collectibles',      emoji:'🎨', theme:{primary:'#7B5CFF',accent:'#7B5CFF',secondary:'#10001a',wall:'#07000e'}, productCount:6 },
  ];
}
