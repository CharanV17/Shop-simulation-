const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  emoji:       { type: String, required: true },
  theme: {
    primary:   { type: String },
    accent:    { type: String },
    secondary: { type: String },
    floor:     { type: String },
    wall:      { type: String }
  },
  createdAt:   { type: Date, default: Date.now }
});

// Virtual to get products
shopSchema.virtual('products', {
  ref: 'Product',
  localField: 'id',
  foreignField: 'shopId'
});

shopSchema.set('toJSON', { virtuals: true });
shopSchema.set('toObject', { virtuals: true });

// Seed default shops
shopSchema.statics.seedDefaults = async function (shopsData) {
  const count = await this.countDocuments();
  if (count === 0) {
    const data = shopsData.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      emoji: s.emoji,
      theme: s.theme
    }));
    await this.create(data);
    console.log(`  🌱  Shops seeded (${data.length} shops)`);
  }
};

module.exports = mongoose.model('Shop', shopSchema);
