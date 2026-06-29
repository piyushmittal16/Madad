const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification'); // 🔥 Added linkage

// 1. CREATE BOOKING WITH EXACT SNAPSHOT PRICE LOCK
exports.createBooking = async (req, res) => {
  try {
    const { customer, provider, serviceType, date, time, notes } = req.body;

    const targetProvider = await User.findById(provider);
    if (!targetProvider) {
      return res.status(404).json({ message: "Selected specialist node not found." });
    }

    const newBooking = new Booking({
      customer,
      provider,
      serviceType,
      date,
      time,
      notes,
      pricePerHour: targetProvider.pricePerHour
    });

    await newBooking.save();

    if (req.io) {
      req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'BOOKING_CREATED' });
    }

    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: 'Error processing booking allocation engines.' });
  }
};

// 2. GET BOOKINGS PACKED WITH PROVIDER RATING POOLS
exports.getBookings = async (req, res) => {
  try {
    const { userId, role } = req.query;
    let query = {};
    
    if (role === 'customer') {
      query.customer = userId;
    } else if (role === 'provider') {
      query.provider = userId;
    }

    const bookings = await Booking.find(query)
                                  .populate('customer', 'name email')
                                  .populate('provider') 
                                  .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error streaming booking ledger.' });
  }
};

// 3. STATUS MUTATION WITH REALTIME NOTIFICATION PIPELINES
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    
    const booking = await Booking.findById(id).populate('provider');
    if (!booking) return res.status(404).json({ message: 'Target booking instance absent.' });

    booking.status = status;
    await booking.save();

    let notificationMsg = '';
    let notificationType = 'System';

    if (status === 'Accepted') {
      await User.findByIdAndUpdate(booking.provider._id, { availabilityStatus: 'busy' });
      notificationMsg = `Specialist ${booking.provider.name} ne aapki ${booking.serviceType} booking ko Accept kar liya hai!`;
      notificationType = 'Accept';
    } else if (status === 'Completed') {
      await User.findByIdAndUpdate(booking.provider._id, { availabilityStatus: 'available' });
      notificationMsg = `Aapka ${booking.serviceType} task Complete ho chuka hai. Kripya experience rate karein!`;
      notificationType = 'Complete';
    }

    // 🔥 Trigger database log logging for customer notification feed
    if (notificationMsg !== '') {
      const newNotification = new Notification({
        recipient: booking.customer,
        bookingId: booking._id,
        message: notificationMsg,
        type: notificationType
      });
      await newNotification.save();
    }

    if (req.io) {
      req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'BOOKING_STATUS_MUTATED' });
    }

    res.json({ success: true, message: 'Status matrix mutated seamlessly and cascading logic executed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};