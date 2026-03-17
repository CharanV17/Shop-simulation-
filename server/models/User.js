const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar:    { type: String, default: '?' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password helper
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Seed default admin + user on first run
userSchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create([
      { name: 'Alex Chen',  email: 'user@nexus.vr',  password: 'user123',  role: 'user',  avatar: 'AC' },
      { name: 'Nova Admin', email: 'admin@nexus.vr', password: 'admin123', role: 'admin', avatar: 'NA' },
    ]);
    console.log('  🌱  Demo accounts seeded (user@nexus.vr / admin@nexus.vr)');
  }
};

module.exports = mongoose.model('User', userSchema);