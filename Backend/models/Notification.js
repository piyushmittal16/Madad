const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // 👥 Target user identifier (Chahe Customer ho, Provider ho ya Admin)
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // 🛠️ Structural core mapping linkage (Contextual dynamic redirects ke liye)
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    required: true 
  },
  
  // 📝 Dynamic human-readable text contents 
  message: { 
    type: String, 
    required: true 
  },
  
  // 🏷️ Category parameters for dynamic colors, icons, and click actions routing:
  // 'Accept'   -> Icon: Blue Bag,   Route: Redirect to page view
  // 'Complete' -> Icon: Green Check, Route: Redirect to review panel
  // 'Rating'   -> Icon: Amber Star,  Route: Redirect to provider performance
  // 'System'   -> Icon: Admin Shield, Route: Dynamic admin parameters
  type: { 
    type: String, 
    enum: ['Accept', 'Complete', 'Rating', 'System'], 
    required: true 
  },
  
  // 🔘 Bell icon dropdown view triggers (Navbar clear logic management)
  isRead: { 
    type: Boolean, 
    default: false 
  },

  // 🚀 OFFLINE/ONLINE TOAST CACHE CONTROL FLAGGING
  // Jab user logged out ho ya background mein ho, isToasted false rahega.
  // Jaise hi user login karega ya active hoga, frontend top un-toasted messages ka toast pop-up dikha kar ise true set kar dega.
  isToasted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true // This is crucial for your 'Time-Ago Counter' (e.g. 2 mins ago) calculations on the client-side
});

module.exports = mongoose.model('Notification', NotificationSchema);