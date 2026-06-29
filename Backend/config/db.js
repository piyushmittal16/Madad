const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds ke baad automatic retry karega
    });
    console.log('MongoDB Connected Successfully...');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    // Server crash hone se rokne ke liye process.exit(1) ko temporary hata rahe hain
  }
};
module.exports = connectDB;