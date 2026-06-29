const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification'); // 🔥 Added layout

// 1. ADMIN COHORT CONTROL DASHBOARD DATA MATRIX ENGINE
exports.getAdminDashboardData = async (req, res) => {
  try {
    const { filter, search } = req.query;
    let searchCriteria = {};

    if (filter && filter !== 'all') {
      searchCriteria.role = filter.toLowerCase().trim();
    }

    if (search && search.trim() !== '') {
      searchCriteria.name = { $regex: search.trim(), $options: 'i' };
    }

    const users = await User.find(searchCriteria).sort({ createdAt: -1 });
    const allUsers = await User.find({});
    const allBookings = await Booking.find({}).populate('provider');

    const totalProvidersCount = allUsers.filter(u => u.role === 'provider' && u.isApproved === true && u.isRejected === false).length;
    const activeContracts = allBookings.filter(b => b.status === 'Accepted' || b.status === 'Completed');

    let totalConsumerBookedValue = 0;
    activeContracts.forEach(b => {
      const historicalPrice = b.pricePerHour || (b.provider ? b.provider.pricePerHour : 0);
      totalConsumerBookedValue += historicalPrice;
    });

    const unverifiedProviders = allUsers.filter(u => {
      return u.role === 'provider' && 
             u.isApproved === false && 
             u.isRejected === false && 
             u.serviceType && u.serviceType.trim() !== "" &&
             u.bio && u.bio.trim() !== "" &&
             u.pricePerHour > 0 &&
             u.city && u.city.trim() !== "";
    });

    res.json({
      users,
      analytics: {
        totalBookingsRequires: activeContracts.length,
        joinedProvidersNo: totalProvidersCount,
        platformEarning: totalConsumerBookedValue * 0.15,
        totalConsumerBookedValue: totalConsumerBookedValue
      },
      notifications: unverifiedProviders
    });
  } catch (err) {
    res.status(500).json({ message: 'Error compiling administrative metrics matrix engines.' });
  }
};

// 2. PROVIDER MANUAL STATUS SWITCH TOGGLE OVERRIDE CHANNEL
exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const checkUser = await User.findById(id);
    if (checkUser && checkUser.isRejected === true) {
      return res.status(403).json({ success: false, message: 'Rejected application block lock constraints.' });
    }
    await User.findByIdAndUpdate(id, { availabilityStatus: status });
    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'AVAILABILITY_STATE_MUTATED' }); }
    res.json({ success: true, message: 'Availability status calibrated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error mapping live availability indicators.' });
  }
};

// 3. PROVIDER PROFILE SPECS COMPLETE FILLUP LOGIC SUBMISSION
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceType, pricePerHour, bio, city, isApproved } = req.body;
    const checkUser = await User.findById(id);
    if (checkUser && checkUser.isRejected === true) {
      return res.status(403).json({ success: false, message: 'Access Denied: Account stands permanently restricted.' });
    }
    const targetApprovalState = isApproved !== undefined ? isApproved : checkUser.isApproved;
    await User.findByIdAndUpdate(id, { 
      serviceType, pricePerHour: Number(pricePerHour), bio, city: city.toLowerCase().trim(), isApproved: targetApprovalState
    });
    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'NEW_VERIFICATION_REQUEST_SUBMITTED' }); }
    res.json({ success: true, message: 'Profile details locked.' });
  } catch (err) {
    res.status(500).json({ message: 'Profile verification stream update collapsed.' });
  }
};

// 4. ADMIN APPROVAL EXECUTION ACTION
exports.updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { isApproved: true, isRejected: false, availabilityStatus: 'available' });
    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'PROVIDER_APPROVED_BY_ADMIN' }); }
    res.json({ success: true, message: 'Provider approved and catalog synchronized.' });
  } catch (err) {
    res.status(500).json({ message: 'Admin approval pipeline error.' });
  }
};

// 5. ADMIN REJECTION WORKFLOW
exports.rejectAndRemoveUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { isApproved: false, isRejected: true, availabilityStatus: 'not available' });
    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'PROVIDER_REJECTED_BY_ADMIN' }); }
    res.json({ success: true, message: 'Account status successfully mutated to rejected status.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating rejection gate loops.' });
  }
};

// 6. CUSTOMER HOME PANEL ACTIVE PROVIDERS DIRECTORY LISTING
exports.getProviders = async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider', isApproved: true, isRejected: false }).sort({ averageRating: -1 }); 
    res.json(providers);
  } catch (err) { 
    res.status(500).json({ message: 'Error streaming providers directory.' }); 
  }
};

// ⭐ REVIEWS MANAGER INJECTING PROVIDER LIVE ALERTS
exports.addReview = async (req, res) => {
  try {
    const { bookingId, providerId, rating } = req.body;

    if (!bookingId || !providerId || rating === undefined || rating === null) {
      return res.status(400).json({ message: 'bookingId, providerId aur rating teeno zaroori hain.' });
    }

    const [provider, booking] = await Promise.all([
      User.findById(providerId),
      Booking.findById(bookingId).populate('customer')
    ]);

    if (!provider || !booking) return res.status(404).json({ message: 'Required instances missing.' });

    if (booking.pricePerHour === undefined || booking.pricePerHour === null) {
      booking.pricePerHour = provider.pricePerHour || 0; 
    }

    const existingRating = Number(booking.ratingGiven) || 0; 
    let totalReviews = Number(provider.totalReviews) || 0;
    let currentTotalScore = (Number(provider.averageRating) || 0) * totalReviews;

    if (existingRating > 0) {
      currentTotalScore = currentTotalScore - existingRating + Number(rating);
    } else {
      totalReviews += 1;
      currentTotalScore += Number(rating);
    }

    provider.totalReviews = totalReviews;
    provider.averageRating = totalReviews > 0 ? Number((currentTotalScore / totalReviews).toFixed(1)) : 0;
    booking.ratingGiven = Number(rating);

    await Promise.all([provider.save(), booking.save()]);

    // 🔥 Generate realtime rating notification logs for the provider
    const reviewAlert = new Notification({
      recipient: provider._id,
      bookingId: booking._id,
      message: `Client ${booking.customer?.name || 'Customer'} ne aapko ${rating} Star rating di hai!`,
      type: 'Rating'
    });
    await reviewAlert.save();

    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'REVIEW_STREAM_MUTATED' }); }
    res.json({ success: true, message: 'Rating save ho gayi.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// 🔥 NEW CORE METHODS TO FETCH AND MUTATE NOTIFICATION TOAST SYSTEMS
exports.getNotifications = async (req, res) => {
  try {
    const { userId, fetchToasts } = req.query;
    let criteria = { recipient: userId, isRead: false };
    
    // Custom check: If called during gateway login session, target un-toasted fields specifically
    if (fetchToasts === 'true') {
      criteria.isToasted = false;
    }

    const alertsList = await Notification.find(criteria).sort({ createdAt: -1 });
    
    // Auto flag toasted packets true on retrieval to prevent infinity reload loops
    if (fetchToasts === 'true' && alertsList.length > 0) {
      await Notification.updateMany({ _id: { $in: alertsList.map(n => n._id) } }, { isToasted: true });
    }

    res.json(alertsList);
  } catch (err) {
    res.status(500).json({ message: 'Error streaming alerts.' });
  }
};

exports.dismissNotification = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, isToasted: true });
    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'NOTIFICATIONS_MUTATED' }); }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.bulkDismissNotifications = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.body.userId }, { isRead: true, isToasted: true });
    if (req.io) { req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'NOTIFICATIONS_MUTATED' }); }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};