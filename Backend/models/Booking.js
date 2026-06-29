const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Accepted', 'Completed', 'Cancelled'], default: 'Pending' },
  paymentMode: { type: String, default: 'COD' },
  pricePerHour: { type: Number, required: true },
  
  // 🔥 FIX: Track existing rating on this specific contract to prevent duplicate sum updates
  ratingGiven: { type: Number, default: 0 } 
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);