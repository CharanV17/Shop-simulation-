const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  shopId:      { type: String, required: true },
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true },
  description: { type: String },
  emoji:       { type: String },
  category:    { type: String },
  stock:       { type: Number, default: 0 },
  rating:      { type: Number, default: 0 },
  color:       { type: String },
  dimensions: {
    w: { type: Number },
    h: { type: Number },
    d: { type: Number }
  },
  modelUrl:    { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

// Seed default products
productSchema.statics.seedDefaults = async function (shopsData) {
  const defaults = [];
  shopsData.forEach(shop => {
    shop.products.forEach(p => {
      defaults.push({ ...p, shopId: shop.id });
    });
  });

  const existing = await this.find({}, { id: 1, _id: 0 }).lean();
  const existingIds = new Set(existing.map(p => p.id));
  const missing = defaults.filter(p => !existingIds.has(p.id));

  if (missing.length > 0) {
    await this.insertMany(missing, { ordered: false });
  }

  if (existing.length === 0) {
    console.log(`  🌱  Products seeded (${defaults.length} products)`);
  } else if (missing.length > 0) {
    console.log(`  🌱  Products backfilled (${missing.length} missing defaults)`);
  }
};

module.exports = mongoose.model('Product', productSchema);
