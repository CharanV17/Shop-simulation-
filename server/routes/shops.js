const express = require('express');
const { shops } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  res.json(shops.map(s => ({ id: s.id, name: s.name, description: s.description, emoji: s.emoji, theme: s.theme, productCount: s.products.length })));
});

router.get('/:id', authenticateToken, (req, res) => {
  const shop = shops.find(s => s.id === req.params.id);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json(shop);
});

router.get('/:id/products', authenticateToken, (req, res) => {
  const shop = shops.find(s => s.id === req.params.id);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json(shop.products);
});

module.exports = router;
