const express = require('express');
const User    = require('../models/User');
const Order   = require('../models/Order');
const Shop    = require('../models/Shop');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const shopCount     = await Shop.countDocuments();
    const productCount  = await Product.countDocuments();
    const userCount     = await User.countDocuments();
    const orders        = await Order.find();
    const totalRevenue  = orders.reduce((s, o) => s + o.total, 0);

    const shops = await Shop.find().populate('products');

    res.json({
      shops:       shopCount,
      products:    productCount,
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
router.patch('/products/:id', async (req, res) => {
  try {
    const { price, stock, name } = req.body;
    const updates = {};
    if (price !== undefined) updates.price = parseFloat(price);
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (name  !== undefined) updates.name  = name;

    const product = await Product.findOneAndUpdate({ id: req.params.id }, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/shops
router.post('/shops', async (req, res) => {
  try {
    const { id, name, description, emoji, theme } = req.body;
    if (!id || !name || !emoji) return res.status(400).json({ error: 'Missing required fields' });

    const existing = await Shop.findOne({ id });
    if (existing) return res.status(400).json({ error: 'Shop ID already exists' });

    const shop = await Shop.create({ id, name, description, emoji, theme });
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating shop' });
  }
});

// DELETE /api/admin/shops/:id
router.delete('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findOneAndDelete({ id: req.params.id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    
    // Cascade delete products
    await Product.deleteMany({ shopId: req.params.id });
    
    res.json({ message: 'Shop and associated products deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting shop' });
  }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const { id, shopId, name, price, description, emoji, category, stock, color, dimensions, modelUrl } = req.body;
    if (!id || !shopId || !name || price === undefined) return res.status(400).json({ error: 'Missing required fields' });

    const shop = await Shop.findOne({ id: shopId });
    if (!shop) return res.status(404).json({ error: 'Target shop not found' });

    const existing = await Product.findOne({ id });
    if (existing) return res.status(400).json({ error: 'Product ID already exists' });

    const product = await Product.create({ id, shopId, name, price, description, emoji, category, stock, color, dimensions, modelUrl });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating product' });
  }
});

module.exports = router;
