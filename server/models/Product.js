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
  const count = await this.countDocuments();
  if (count === 0) {
    const products = [];
    shopsData.forEach(shop => {
      shop.products.forEach(p => {
        products.push({ ...p, shopId: shop.id });
      });
    });
    await this.create(products);
    console.log(`  🌱  Products seeded (${products.length} products)`);
  }
};

module.exports = mongoose.model('Product', productSchema);
