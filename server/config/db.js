const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://CharanV17:L1qorYsk7LNV1qBU@charan17.icrlhlw.mongodb.net/?appName=Charan17';
    await mongoose.connect(uri);
    console.log('  ✅  MongoDB connected:', uri);
  } catch (err) {
    console.error('  ❌  MongoDB connection failed:', err.message);
    console.error('     Make sure MongoDB is running: mongod');
    process.exit(1);
  }
};

module.exports = connectDB;
