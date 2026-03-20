/* ═══════════════════════════════════════════════════════════
   ui-overlay.js — All HTML/CSS UI on top of the 3D canvas
   Product panel, cart drawer, checkout modal, minimap, toasts
═══════════════════════════════════════════════════════════ */
import { CartAPI, OrdersAPI } from './api.js';
import { onProductHoverFX, clearProducts } from './product-mesh.js';
import {
  moveCameraLeft, moveCameraRight,
  moveCameraForward, moveCameraBack,
  moveCameraCenter, moveCameraTo,
  getCameraIndex, getCameraPresets,
  clearSelectedProduct
} from './vr-engine.js';

let cartState       = { items: [], total: 0, count: 0 };
let currentShop     = null;
let allShops        = [];
let currentUser     = null;
let selectedProduct = null;
let selectedQty     = 1;
let checkoutStep    = 0;

/* ── Bootstrap ────────────────────────────────────────── */
// NEW
export function initUI(shops, shopData, exitCallback, user = null) {
  allShops    = shops;
  currentShop = shopData;
  currentUser = user;
  window._uiExitShop = exitCallback;
  renderMinimap();
  renderHUD();
  refreshNavDots();   
  if (currentUser && currentUser.role !== 'admin') {
    loadCart();
  }
}

export function setCurrentShop(shopData) {
  currentShop = shopData;
  renderMinimap();
  renderHUD();
  renderNavDots();
}

/* ── Hover wiring (called from vr-engine) ─────────────── */
export function onProductHover(group)    { onProductHoverFX(group, true);  }
export function onProductHoverEnd(group) { onProductHoverFX(group, false); }

/* ── Click → open side panel ──────────────────────────── */
export function onProductClick(product) {
  selectedProduct = product;
  selectedQty     = 1;
  openProductPanel(product);
}

/* ════════════════════════════════════════════════════════
   PRODUCT DETAIL PANEL  (slides in from right)
════════════════════════════════════════════════════════ */
function openProductPanel(product) {
  const panel = document.getElementById('productPanel');
  const body  = document.getElementById('pdpBody');
  const acts  = document.getElementById('pdpActions');
  const t     = currentShop.theme;

  body.innerHTML = `
    <div class="pdp-visual" style="background:linear-gradient(135deg,${t.accent}18,${t.accent}06);border-color:${t.accent}35;">
      <span style="font-size:4.5rem;filter:drop-shadow(0 4px 18px rgba(0,0,0,.6));">${product.emoji}</span>
      <span class="pdp-cat-tag" style="background:${t.accent}22;color:${t.accent};border-color:${t.accent}44;">${product.category}</span>
    </div>

    <h2 class="pdp-name">${product.name}</h2>
    <div class="pdp-shop-ref">📍 ${currentShop.name}</div>
    <div class="pdp-price" style="color:${t.accent};">$${product.price.toLocaleString()}</div>
    <p class="pdp-desc">${product.description}</p>

    <div class="pdp-attrs">
      <div class="attr"><div class="attr-l">Rating</div><div class="attr-v">⭐ ${product.rating}/5</div></div>
      <div class="attr"><div class="attr-l">Stock</div><div class="attr-v" style="color:${product.stock < 5 ? '#FF2D6B' : '#00FFB3'};">${product.stock} left</div></div>
      <div class="attr"><div class="attr-l">Category</div><div class="attr-v">${product.category}</div></div>
      <div class="attr"><div class="attr-l">Finish</div><div class="attr-v">${product.color || '—'}</div></div>
    </div>

    <div class="pdp-qty-row">
      <span class="qty-lbl">QTY</span>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="window._uiChangeQty(-1)">−</button>
        <span class="qty-val" id="pdpQty">1</span>
        <button class="qty-btn" onclick="window._uiChangeQty(1)">+</button>
      </div>
    </div>
  `;

  if (currentUser && currentUser.role === 'admin') {
    acts.innerHTML = `
      <div class="pdp-admin-note" style="font-size:.7rem;font-family:var(--font-m);color:rgba(255,255,255,.3);text-align:center;padding:10px;border:1px dashed var(--border);">
        Admin Mode: Purchasing Disabled
      </div>
    `;
  } else {
    acts.innerHTML = `
      <button class="btn-add-cart" style="--a:${t.accent};" onclick="window._uiAddToCart()">
        Add to Cart 🛒
      </button>
      <button class="btn-buy-now" style="background:${t.accent}22;color:${t.accent};border-color:${t.accent}44;"
              onclick="window._uiBuyNow()">
        Buy Now — $${product.price.toLocaleString()}
      </button>
    `;
  }

  panel.classList.add('open');
}

function closeProductPanel() {
  document.getElementById('productPanel').classList.remove('open');
  clearSelectedProduct();   // remove 3D highlight
  selectedProduct = null;
}

/* ── Quantity ─────────────────────────────────────────── */
window._uiChangeQty = (d) => {
  selectedQty = Math.max(1, Math.min(10, selectedQty + d));
  const el = document.getElementById('pdpQty');
  if (el) el.textContent = selectedQty;
};

/* ── Add to cart ──────────────────────────────────────── */
window._uiAddToCart = async () => {
  if (!selectedProduct) return;
  try {
    cartState = await CartAPI.add(selectedProduct.id, currentShop.id, selectedQty);
    updateCartBadge();
    toast(`${selectedProduct.emoji} Added to cart!`, 'success');
    closeProductPanel();
  } catch (e) { toast(e.message, 'error'); }
};

window._uiBuyNow = async () => {
  await window._uiAddToCart();
  setTimeout(openCheckout, 250);
};

window._uiClosePanelBtn = closeProductPanel;

/* ════════════════════════════════════════════════════════
   CART DRAWER
════════════════════════════════════════════════════════ */
async function loadCart() {
  try { cartState = await CartAPI.get(); updateCartBadge(); } catch (_) {}
}

function updateCartBadge() {
  const n = cartState.count || 0;
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent   = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

window._uiToggleCart = async () => {
  const drawer = document.getElementById('cartDrawer');
  const open   = drawer.classList.toggle('open');
  if (open) {
    try { cartState = await CartAPI.get(); updateCartBadge(); } catch (_) {}
    renderCartItems();
  }
};

function renderCartItems() {
  const list   = document.getElementById('cartList');
  const footer = document.getElementById('cartFooter');

  if (!cartState.items || cartState.items.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        <p>Your cart is empty</p>
        <small>Explore a shop to add items</small>
      </div>`;
    footer.innerHTML = '';
    return;
  }

  list.innerHTML = cartState.items.map(item => `
    <div class="cart-item">
      <div class="ci-icon">${item.emoji}</div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-shop">${item.shopName}</div>
        <div class="ci-qty">Qty: ${item.qty}</div>
      </div>
      <div class="ci-right">
        <div class="ci-price">$${(item.price * item.qty).toLocaleString()}</div>
        <button class="ci-remove" onclick="window._uiRemoveCartItem('${item.id}')">✕</button>
      </div>
    </div>
  `).join('');

  const total = cartState.total || 0;
  footer.innerHTML = `
    <div class="cart-total">
      <span>Total</span>
      <span class="ct-val">$${total.toLocaleString()}</span>
    </div>
    <button class="btn-checkout" onclick="window._uiToggleCart();setTimeout(openCheckout,150)">
      🔒 Secure Checkout
    </button>
    <button class="btn-clear-cart" onclick="window._uiClearCart()">Clear Cart</button>
  `;
}

window._uiRemoveCartItem = async (id) => {
  try { cartState = await CartAPI.remove(id); updateCartBadge(); renderCartItems(); toast('Item removed', 'info'); }
  catch (e) { toast(e.message, 'error'); }
};

window._uiClearCart = async () => {
  try { cartState = await CartAPI.clear(); updateCartBadge(); renderCartItems(); toast('Cart cleared', 'info'); }
  catch (e) { toast(e.message, 'error'); }
};

window.openCheckout = openCheckout;

/* ════════════════════════════════════════════════════════
   CHECKOUT MODAL  — 3 steps
════════════════════════════════════════════════════════ */
function openCheckout() {
  if (!cartState.items || cartState.items.length === 0) { toast('Cart is empty!', 'error'); return; }
  checkoutStep = 0;
  renderCheckout();
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}
window._uiCloseCheckout = closeCheckout;

function renderCheckout() {
  const body  = document.getElementById('checkoutBody');
  const steps = ['Review', 'Payment', 'Done'];
  const stepsH = `
    <div class="ck-steps">
      ${steps.map((s, i) => `
        <div class="ck-step ${i === checkoutStep ? 'active' : i < checkoutStep ? 'done' : ''}">
          <span class="ck-step-num">${i < checkoutStep ? '✓' : i + 1}</span> ${s}
        </div>
        ${i < steps.length - 1 ? '<div class="ck-step-line"></div>' : ''}
      `).join('')}
    </div>`;

  if (checkoutStep === 0) {
    body.innerHTML = stepsH + `
      <div class="ck-order-list">
        ${(cartState.items || []).map(item => `
          <div class="ck-order-item">
            <span>${item.emoji} ${item.name} <span class="ck-qty">×${item.qty}</span></span>
            <span class="ck-item-price">$${(item.price * item.qty).toLocaleString()}</span>
          </div>`).join('')}
        <div class="ck-order-total">
          <span>Total</span>
          <span>$${(cartState.total || 0).toLocaleString()}</span>
        </div>
      </div>
      <button class="btn-ck-next" onclick="checkoutStep=1;renderCheckout()">Proceed to Payment →</button>
      <button class="btn-ck-cancel" onclick="window._uiCloseCheckout()">Cancel</button>
    `;
  } else if (checkoutStep === 1) {
    body.innerHTML = stepsH + `
      <div class="ck-form">
        <div class="ck-field"><label>Cardholder Name</label><input id="ckName" placeholder="Full name"/></div>
        <div class="ck-field"><label>Card Number</label>
          <input id="ckCard" placeholder="4242 4242 4242 4242" maxlength="19" inputmode="numeric" autocomplete="cc-number"/>
        </div>
        <div class="ck-row">
          <div class="ck-field"><label>Expiry</label><input id="ckExp" placeholder="MM/YY" maxlength="5" inputmode="numeric" autocomplete="cc-exp"/></div>
          <div class="ck-field"><label>CVV</label><input id="ckCvv" placeholder="123" maxlength="3" inputmode="numeric" autocomplete="cc-csc"/></div>
        </div>
        <div class="ck-field"><label>Shipping Address</label><input id="ckAddr" placeholder="123 Main St, City"/></div>
      </div>
      <div class="ck-secure-note">🔒 256-bit SSL · PCI-DSS Compliant</div>
      <button class="btn-ck-next" onclick="window._uiProcessPayment()">
        Pay $${(cartState.total || 0).toLocaleString()} →
      </button>
      <button class="btn-ck-back" onclick="checkoutStep=0;renderCheckout()">← Back</button>
    `;
    wireCheckoutInputs();
  } else {
    body.innerHTML = stepsH + `
      <div class="ck-success">
        <div class="ck-success-icon">✅</div>
        <h2>Order Confirmed!</h2>
        <p id="ckOrderId" style="font-family:var(--font-m);font-size:.72rem;color:rgba(255,255,255,.4);margin-bottom:.5rem;"></p>
        <p class="ck-success-note">A confirmation has been sent to your email.</p>
        <button class="btn-ck-next" onclick="window._uiCloseCheckout();window._uiGoLobby?.()">
          Continue Shopping →
        </button>
        <button class="btn-ck-cancel" onclick="window._uiCloseCheckout()">Close</button>
      </div>
    `;
  }
}

function wireCheckoutInputs() {
  const cardInput = document.getElementById('ckCard');
  const expInput = document.getElementById('ckExp');
  const cvvInput = document.getElementById('ckCvv');

  if (cardInput) {
    cardInput.addEventListener('input', () => {
      const digits = cardInput.value.replace(/\D/g, '').slice(0, 16);
      cardInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
  }

  if (expInput) {
    expInput.addEventListener('input', () => {
      const digits = expInput.value.replace(/\D/g, '').slice(0, 4);
      expInput.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });
  }

  if (cvvInput) {
    cvvInput.addEventListener('input', () => {
      cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 3);
    });
  }
}

/* expose renderCheckout so inline onclick can call it */
window.renderCheckout = renderCheckout;
window.checkoutStep   = 0;
Object.defineProperty(window, 'checkoutStep', {
  get: () => checkoutStep,
  set: (v) => { checkoutStep = v; }
});

window._uiProcessPayment = async () => {
  const name = document.getElementById('ckName')?.value?.trim();
  const card = document.getElementById('ckCard')?.value?.replace(/\s/g, '');
  const exp  = document.getElementById('ckExp')?.value?.trim();
  const cvv  = document.getElementById('ckCvv')?.value?.trim();
  const addr = document.getElementById('ckAddr')?.value?.trim();

  if (!name || !card || !exp || !cvv || !addr) { toast('Please fill all fields', 'error'); return; }
  if (card.length < 16) { toast('Invalid card number', 'error'); return; }

  const btn = document.querySelector('.btn-ck-next');
  if (btn) { btn.textContent = 'Processing…'; btn.disabled = true; }

  try {
    const order = await OrdersAPI.checkout({ paymentDetails: { name, last4: card.slice(-4), exp, addr } });
    cartState = { items: [], total: 0, count: 0 };
    updateCartBadge();
    checkoutStep = 2;
    renderCheckout();
    const oid = document.getElementById('ckOrderId');
    if (oid) oid.textContent = `Order ID: ${order.orderId || order.id}`;
  } catch (e) {
    if (btn) { btn.textContent = `Pay $${(cartState.total || 0).toLocaleString()} →`; btn.disabled = false; }
    toast(e.message, 'error');
  }
};

/* ════════════════════════════════════════════════════════
   HUD
════════════════════════════════════════════════════════ */
function renderHUD() {
  const el = document.getElementById('vrShopName');
  if (el && currentShop) el.textContent = currentShop.emoji + '  ' + currentShop.name;
}

/* ════════════════════════════════════════════════════════
   MINIMAP
════════════════════════════════════════════════════════ */
function renderMinimap() {
  const map = document.getElementById('minimapList');
  if (!map) return;
  map.innerHTML = allShops.map(s => `
    <div class="mm-shop ${s.id === currentShop?.id ? 'active' : ''}"
         onclick="window._uiEnterShop('${s.id}')">
      <span class="mm-dot" style="background:${s.theme.accent};${s.id === currentShop?.id ? `box-shadow:0 0 6px ${s.theme.accent};` : ''}"></span>
      <span class="mm-name">${s.name}</span>
    </div>
  `).join('');
}

/* ════════════════════════════════════════════════════════
   NAV DOTS  (4 dots now: centre, left, right, forward)
════════════════════════════════════════════════════════ */
export function refreshNavDots() {
  const container = document.getElementById('navDots');
  if (!container) return;
  const total = getCameraPresets().length;
  const cur   = getCameraIndex();
  const labels = ['●', '◀', '▶', '⬛'];
  container.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="nav-dot ${i === cur ? 'active' : ''}" title="${labels[i] || i}" onclick="window._uiJumpCam(${i})"></div>`
  ).join('');
}

/* ════════════════════════════════════════════════════════
   CAMERA BUTTON WIRING
════════════════════════════════════════════════════════ */
window._uiMoveLeft    = () => { moveCameraLeft();    refreshNavDots(); };
window._uiMoveRight   = () => { moveCameraRight();   refreshNavDots(); };
window._uiMoveForward = () => { moveCameraForward(); refreshNavDots(); };
window._uiMoveBack    = () => { moveCameraBack();    refreshNavDots(); };
window._uiMoveCenter  = () => { moveCameraCenter();  refreshNavDots(); };
window._uiJumpCam     = (i) => { moveCameraTo(i);   refreshNavDots(); };

/* ════════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════════ */
export function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const tc    = document.getElementById('toastContainer');
  if (!tc) return;
  const el    = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  tc.appendChild(el);
  setTimeout(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateX(12px)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
window._uiToast = toast;
