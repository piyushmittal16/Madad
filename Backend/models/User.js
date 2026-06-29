const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  city: { type: String, required: true },
  role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
  
  // 💼 Provider Specific Profile Parameters
  serviceType: { type: String, default: '' },
  pricePerHour: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  
  // 📡 Live Application Triggers Matrix
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  availabilityStatus: { type: String, default: 'available' },

  // ⭐ RATING SYSTEM ENGINE
  averageRating: { type: Number, default: 0 }, // Holds aggregate average rating score
  totalReviews: { type: Number, default: 0 }    // Tally counter of submitted reviews
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);