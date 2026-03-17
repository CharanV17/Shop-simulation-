const express = require('express');
const Order   = require('../models/Order');
const { carts, shops } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders  — checkout & save to MongoDB
router.post('/', authenticateToken, async (req, res) => {
  try {
    const cart = carts[req.user.id] || [];
    if (cart.length === 0)
      return res.status(400).json({ error: 'Cart is empty' });

    const { paymentDetails } = req.body;
    if (!paymentDetails)
      return res.status(400).json({ error: 'Payment details required' });

    // Deduct stock from in-memory store
    for (const item of cart) {
      const shop    = shops.find(s => s.id === item.shopId);
      const product = shop?.products.find(p => p.id === item.id);
      if (product) product.stock = Math.max(0, product.stock - item.qty);
    }

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    const order = await Order.create({
      userId:  req.user.id,
      userName: req.user.name,
      items:   cart,
      total,
      paymentDetails: { name: paymentDetails.name, last4: paymentDetails.last4 },
      status:  'completed'
    });

    // Clear cart
    carts[req.user.id] = [];

    res.status(201).json({ orderId: order._id, id: order._id, total: order.total, status: order.status });

  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Server error during checkout' });
  }
});

// GET /api/orders  — fetch this user's order history from MongoDB
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
