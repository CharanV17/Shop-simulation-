const express = require('express');
const User    = require('../models/User');
const Order   = require('../models/Order');
const { shops } = require('../data/store');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalProducts = shops.reduce((s, sh) => s + sh.products.length, 0);
    const userCount     = await User.countDocuments();
    const orders        = await Order.find();
    const totalRevenue  = orders.reduce((s, o) => s + o.total, 0);
    res.json({
      shops:       shops.length,
      products:    totalProducts,
      users:       userCount,
      orders:      orders.length,
      revenue:     totalRevenue,
      shopSummary: shops.map(s => ({
        id: s.id, name: s.name, emoji: s.emoji,
        products: s.products.length,
        avgPrice: Math.round(s.products.reduce((a, p) => a + p.price, 0) / (s.products.length || 1))
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const orders = await Order.find();
    res.json(users.map(u => ({
      id: u._id, name: u.name, email: u.email,
      role: u.role, avatar: u.avatar, createdAt: u.createdAt,
      orderCount: orders.filter(o => String(o.userId) === String(u._id)).length
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', (req, res) => {
  const { price, stock, name } = req.body;
  for (const shop of shops) {
    const product = shop.products.find(p => p.id === req.params.id);
    if (product) {
      if (price !== undefined) product.price = parseFloat(price);
      if (stock !== undefined) product.stock = parseInt(stock);
      if (name  !== undefined) product.name  = name;
      return res.json(product);
    }
  }
  res.status(404).json({ error: 'Product not found' });
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req, res) => {
  for (const shop of shops) {
    const idx = shop.products.findIndex(p => p.id === req.params.id);
    if (idx !== -1) { shop.products.splice(idx, 1); return res.json({ message: 'Deleted' }); }
  }
  res.status(404).json({ error: 'Product not found' });
});

module.exports = router;
