/* One-off script: adds Fresh Market shop + products to MongoDB */
require('dotenv').config();
const mongoose = require('mongoose');
const Shop     = require('./models/Shop');
const Product  = require('./models/Product');

const SHOP = {
  id: 'fresh-market', name: 'Fresh Market',
  description: 'Farm-fresh fruits and vegetables, straight from the countryside',
  emoji: '🥦',
  theme: { primary: '#FF6B35', accent: '#FF6B35', secondary: '#3d1f00', floor: '#2a1400', wall: '#1a0d00' }
};

const PRODUCTS = [
  { id: 'fm1', shopId: 'fresh-market', name: 'Watermelon',    price: 5,  description: 'Sweet, juicy whole watermelon. Grown in sunny fields, perfect for summer.', emoji: '🍉', category: 'Fruits',     stock: 20, rating: 4.9, color: '#2d8a2d', dimensions: { w:0.55, h:0.38, d:0.55 } },
  { id: 'fm2', shopId: 'fresh-market', name: 'Banana Bunch',  price: 3,  description: 'Ripe, golden banana bunch. Rich in potassium and natural energy.',          emoji: '🍌', category: 'Fruits',     stock: 30, rating: 4.8, color: '#f5d020', dimensions: { w:0.35, h:0.18, d:0.2  } },
  { id: 'fm3', shopId: 'fresh-market', name: 'Orange Basket', price: 8,  description: 'Hand-picked navel oranges, bursting with vitamin C.',                       emoji: '🍊', category: 'Fruits',     stock: 25, rating: 4.7, color: '#e8821a', dimensions: { w:0.4,  h:0.22, d:0.4  } },
  { id: 'fm4', shopId: 'fresh-market', name: 'Tomato Crate',  price: 6,  description: 'Vine-ripened red tomatoes. Sweet, firm and full of flavour.',               emoji: '🍅', category: 'Vegetables', stock: 22, rating: 4.8, color: '#cc2200', dimensions: { w:0.45, h:0.2,  d:0.35 } },
  { id: 'fm5', shopId: 'fresh-market', name: 'Broccoli Head', price: 4,  description: 'Fresh-cut broccoli crowns. High in fibre and antioxidants.',                emoji: '🥦', category: 'Vegetables', stock: 15, rating: 4.6, color: '#2a7a1a', dimensions: { w:0.3,  h:0.32, d:0.3  } },
  { id: 'fm6', shopId: 'fresh-market', name: 'Carrot Bundle', price: 3,  description: 'Crisp baby carrots with greens still attached. Naturally sweet.',           emoji: '🥕', category: 'Vegetables', stock: 28, rating: 4.9, color: '#e05a00', dimensions: { w:0.12, h:0.45, d:0.12 } },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Remove any stale sports-zone docs (just in case)
  await Shop.deleteOne({ id: 'sports-zone' });
  await Product.deleteMany({ shopId: 'sports-zone' });

  // Remove existing fresh-market if present (idempotent)
  await Shop.deleteOne({ id: 'fresh-market' });
  await Product.deleteMany({ shopId: 'fresh-market' });

  await Shop.create(SHOP);
  await Product.insertMany(PRODUCTS);

  console.log('✅  Fresh Market shop + products inserted!');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
