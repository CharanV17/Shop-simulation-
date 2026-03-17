const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/nexus-vr';
    await mongoose.connect(uri);
    console.log('  ✅  MongoDB connected:', uri);
  } catch (err) {
    console.error('  ❌  MongoDB connection failed:', err.message);
    console.error('     Make sure MongoDB is running: mongod');
    process.exit(1);
  }
};

module.exports = connectDB;
