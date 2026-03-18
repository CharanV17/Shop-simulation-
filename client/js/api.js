/* ═══════════════════════════════════════════════════════════
   api.js — All backend communication + JWT management
   Base URL auto-detects dev vs prod
═══════════════════════════════════════════════════════════ */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

const TOKEN_KEY = 'nexus_jwt';

// ── Token helpers ─────────────────────────────────────────
const Auth = {
  setToken(token) { localStorage.setItem(TOKEN_KEY, token); },
  getToken()      { return localStorage.getItem(TOKEN_KEY); },
  clearToken()    { localStorage.removeItem(TOKEN_KEY); },
  isLoggedIn()    { return !!localStorage.getItem(TOKEN_KEY); }
};

// ── Core fetch wrapper ────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Token expired — force logout
  if (res.status === 401 || res.status === 403) {
    Auth.clearToken();
    window.location.href = 'index.html';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth API ──────────────────────────────────────────────
const AuthAPI = {
  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    Auth.setToken(data.token);
    return data.user;
  },

  async register(name, email, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    Auth.setToken(data.token);
    return data.user;
  },

  async me() {
    return apiFetch('/auth/me');
  },

  logout() {
    Auth.clearToken();
  }
};

// ── Shops API ─────────────────────────────────────────────
const ShopsAPI = {
  async getAll() {
    return apiFetch('/shops');
  },

  async getOne(shopId) {
    return apiFetch(`/shops/${shopId}`);
  },

  async getProducts(shopId) {
    return apiFetch(`/shops/${shopId}/products`);
  }
};

// ── Cart API ──────────────────────────────────────────────
const CartAPI = {
  async get() {
    return apiFetch('/cart');
  },

  async add(productId, shopId, qty = 1) {
    return apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, shopId, qty })
    });
  },

  async updateQty(productId, qty) {
    return apiFetch(`/cart/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ qty })
    });
  },

  async remove(productId) {
    return apiFetch(`/cart/${productId}`, { method: 'DELETE' });
  },

  async clear() {
    return apiFetch('/cart', { method: 'DELETE' });
  }
};

// ── Orders API ────────────────────────────────────────────
const OrdersAPI = {
  async checkout(paymentDetails) {
    return apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(paymentDetails)
    });
  },

  async getHistory() {
    return apiFetch('/orders');
  },

  async getOne(orderId) {
    return apiFetch(`/orders/${orderId}`);
  }
};

// ── Admin API ─────────────────────────────────────────────
const AdminAPI = {
  async getDashboard() {
    return apiFetch('/admin/dashboard');
  },

  async getUsers() {
    return apiFetch('/admin/users');
  },

  async getOrders() {
    return apiFetch('/admin/orders');
  },

  async updateProduct(productId, updates) {
    return apiFetch(`/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteProduct(productId) {
    return apiFetch(`/admin/products/${productId}`, { method: 'DELETE' });
  },

  async addShop(shopData) {
    return apiFetch('/admin/shops', {
      method: 'POST',
      body: JSON.stringify(shopData)
    });
  },

  async deleteShop(shopId) {
    return apiFetch(`/admin/shops/${shopId}`, { method: 'DELETE' });
  },

  async addProduct(productData) {
    return apiFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  // Helper for custom calls
  apiFetch
};

export { Auth, AuthAPI, ShopsAPI, CartAPI, OrdersAPI, AdminAPI };
