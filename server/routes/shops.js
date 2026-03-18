const express = require('express');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all shops (with simplified data for the grid)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shops = await Shop.find().populate('products');
    const result = shops.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      emoji: s.emoji,
      theme: s.theme,
      productCount: s.products ? s.products.length : 0
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching shops' });
  }
});

// Get one shop
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findOne({ id: req.params.id }).populate('products');
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching shop' });
  }
});

// Get products for a shop
router.get('/:id/products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.params.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

module.exports = router;

module.exports = router;
