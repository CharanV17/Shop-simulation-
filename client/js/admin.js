import { Auth, AuthAPI, ShopsAPI, AdminAPI } from './api.js';

let dashboardData = null;

window.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) { location.href = 'index.html'; return; }
  try {
    const user = await AuthAPI.me();
    if (user.role !== 'admin') { location.href = 'index.html'; return; }
  } catch (_) { location.href = 'index.html'; return; }

  initNav();
  await refreshData();
});

function initNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

async function refreshData() {
  try {
    dashboardData = await AdminAPI.getDashboard();
    renderDashboard();
    renderShops();
    renderProducts();
  } catch (e) {
    alert('Failed to fetch admin data: ' + e.message);
  }
}

function renderDashboard() {
  document.getElementById('stat-shops').textContent    = dashboardData.shops;
  document.getElementById('stat-products').textContent = dashboardData.products;
  document.getElementById('stat-users').textContent    = dashboardData.users;
  document.getElementById('stat-revenue').textContent  = `$${dashboardData.revenue.toLocaleString()}`;
}

async function renderShops() {
  const shops = await ShopsAPI.getAll();
  const tbody = document.querySelector('#table-shops tbody');
  tbody.innerHTML = shops.map(s => `
    <tr>
      <td style="font-size:1.5rem">${s.emoji}</td>
      <td style="font-weight:700">${s.name}</td>
      <td style="font-family:var(--font-m)">${s.id}</td>
      <td><span class="badge" style="background:${s.theme.primary}20; color:${s.theme.primary}">${s.theme.primary}</span></td>
      <td>${s.productCount}</td>
      <td>
        <button class="btn btn-danger" onclick="window.deleteShop('${s.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.deleteShop = async (id) => {
  if (!confirm(`Are you sure you want to delete shop "${id}" and ALL its products?`)) return;
  try {
    await AdminAPI.deleteShop(id);
    await refreshData();
  } catch (e) { alert(e.message); }
};

async function renderProducts() {
  const shops = await ShopsAPI.getAll();
  let allProducts = [];
  for(const s of shops) {
    const products = await ShopsAPI.getProducts(s.id);
    allProducts = allProducts.concat(products.map(p => ({ ...p, shopName: s.name })));
  }

  const tbody = document.querySelector('#table-products tbody');
  tbody.innerHTML = allProducts.map(p => `
    <tr>
      <td>${p.emoji} ${p.name}</td>
      <td style="font-family:var(--font-m)">${p.id}</td>
      <td>${p.shopName}</td>
      <td style="color:var(--neon);font-weight:700">$${p.price}</td>
      <td>${p.stock}</td>
      <td><span class="badge badge-neon">${p.category}</span></td>
      <td>
        <button class="btn btn-danger" onclick="window.deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Global modal helpers
window.showAddShop    = () => document.getElementById('modal-shop').style.display = 'flex';
window.showAddProduct = () => document.getElementById('modal-product').style.display = 'flex';
window.closeModals    = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

window.submitShop = async () => {
  const id    = document.getElementById('shop-id').value;
  const name  = document.getElementById('shop-name').value;
  const emoji = document.getElementById('shop-emoji').value;
  const desc  = document.getElementById('shop-desc').value;

  try {
    await AdminAPI.addShop({ id, name, emoji, description: desc, theme: { primary: '#00FFB3', accent: '#00FFB3', secondary: '#0a0a1a', floor: '#050510', wall: '#020205' } });
    window.closeModals();
    await refreshData();
  } catch (e) { alert(e.message); }
};

window.submitProduct = async () => {
  const id     = document.getElementById('p-id').value;
  const shopId = document.getElementById('p-shop').value;
  const name   = document.getElementById('p-name').value;
  const price  = document.getElementById('p-price').value;
  const stock    = document.getElementById('p-stock').value;
  const modelUrl = document.getElementById('p-model').value;

  try {
    await AdminAPI.apiFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify({ id, shopId, name, price, stock, modelUrl, emoji: '📦', category: 'General' })
    });
    window.closeModals();
    await refreshData();
  } catch (e) { alert(e.message); }
};

window.deleteProduct = async (id) => {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await AdminAPI.deleteProduct(id);
    await refreshData();
  } catch (e) { alert(e.message); }
};
