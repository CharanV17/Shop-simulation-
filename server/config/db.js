const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
    const dbName = process.env.MONGO_DB_NAME || 'nexus-vr';
    await mongoose.connect(uri, { dbName });
    console.log('  ✅  MongoDB connected:', uri);
  } catch (err) {
    console.error('  ❌  MongoDB connection failed:', err.message);
    console.error('     Make sure MongoDB is running: mongod');
    process.exit(1);
  }
};

module.exports = connectDB;
