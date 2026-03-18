require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');
const User      = require('./models/User');
const Shop      = require('./models/Shop');
const Product   = require('./models/Product');
const { shops: defaultShops } = require('./data/store');

const authRoutes  = require('./routes/auth');
const shopRoutes  = require('./routes/shops');
const cartRoutes  = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Connect to MongoDB then start server ──────────────────
connectDB().then(async () => {

  // Seed data if DB is empty
  await User.seedDefaults();
  await Shop.seedDefaults(defaultShops);
  await Product.seedDefaults(defaultShops);

  // ── Middleware ──────────────────────────────────────────
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // ── Serve static frontend ───────────────────────────────
  app.use(express.static(path.join(__dirname, '../client')));

  // ── API Routes ──────────────────────────────────────────
  app.use('/api/auth',   authRoutes);
  app.use('/api/shops',  shopRoutes);
  app.use('/api/cart',   cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin',  adminRoutes);

  // ── Health check ────────────────────────────────────────
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // ── Catch-all → index.html ──────────────────────────────
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/index.html')));

  // ── Start ───────────────────────────────────────────────
  app.listen(PORT, () => {
    console.log('');
    console.log('  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗');
    console.log('  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝');
    console.log('  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗');
    console.log('  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║');
    console.log('  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║');
    console.log('  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝');
    console.log('');
    console.log(`  🚀  Server    →  http://localhost:${PORT}`);
    console.log(`  🛍️   Open app  →  http://localhost:${PORT}`);
    console.log('');
    console.log('  Demo accounts:');
    console.log('    user@nexus.vr  / user123');
    console.log('    admin@nexus.vr / admin123');
    console.log('');
  });
});
