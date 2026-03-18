const express = require('express');
const { carts } = require('../data/store');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

function getUserCart(userId) {
  if (!carts[userId]) carts[userId] = [];
  return carts[userId];
}

function cartResponse(cart) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  return { items: cart, total, count };
}

// GET /api/cart
router.get('/', authenticateToken, (req, res) => {
  res.json(cartResponse(getUserCart(req.user.id)));
});

// POST /api/cart  { productId, shopId, qty }
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot use the cart' });
    }

    const { productId, shopId, qty = 1 } = req.body;
    if (!productId || !shopId) return res.status(400).json({ error: 'productId and shopId required' });

    const shop = await Shop.findOne({ id: shopId });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.stock < qty) return res.status(400).json({ error: 'Insufficient stock' });

    const cart = getUserCart(req.user.id);
    const existing = cart.find(i => i.id === productId);

    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, shopId: shop.id, shopName: shop.name, qty });
    }

    res.json(cartResponse(cart));
  } catch (err) {
    res.status(500).json({ error: 'Server error adding to cart' });
  }
});

// PATCH /api/cart/:productId
router.patch('/:productId', authenticateToken, (req, res) => {
  const { qty } = req.body;
  const cart = getUserCart(req.user.id);
  const item = cart.find(i => i.id === req.params.productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });

  if (qty <= 0) {
    cart.splice(cart.indexOf(item), 1);
  } else {
    item.qty = Math.min(qty, 10);
  }
  res.json(cartResponse(cart));
});

// DELETE /api/cart/:productId
router.delete('/:productId', authenticateToken, (req, res) => {
  const cart = getUserCart(req.user.id);
  const idx = cart.findIndex(i => i.id === req.params.productId);
  if (idx === -1) return res.status(404).json({ error: 'Item not in cart' });
  cart.splice(idx, 1);
  res.json(cartResponse(cart));
});

// DELETE /api/cart  (clear all)
router.delete('/', authenticateToken, (req, res) => {
  carts[req.user.id] = [];
  res.json(cartResponse([]));
});

module.exports = router;
