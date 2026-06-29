const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. CLEAN SECURE REGISTRATION GATEWAY CONTROLLER
exports.register = async (req, res) => {
  try {
    const { name, email, password, city, role } = req.body;

    // Check existing registration records to avoid duplication overrides
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'Operational node handles an identical email register already.' });
    }

    // 🔥 CONDITIONS ENFORCED: Strict role based defaults distribution mapping
    const isProviderNode = role === 'provider';
    const strictApprovalRequirement = isProviderNode ? false : true; // Providers are locked out by default
    const initialAvailability = isProviderNode ? 'not available' : 'available'; // Offline on registration

    // Direct explicit bcrypt hashing processing bounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword, // Hashed and secured securely
      city: city.trim().toLowerCase(),
      role: role,
      isApproved: strictApprovalRequirement, // Strict clean Boolean distribution logic
      isRejected: false, // Default fresh application marker
      availabilityStatus: initialAvailability
    });

    await newUser.save();

    // Broadcast globally to update admin's waiting queue totals instantly if provider signs up
    if (req.io && isProviderNode) {
      req.io.emit('GLOBAL_DATABASE_MUTATION', { type: 'NEW_UNVERIFIED_PROVIDER_SIGNUP' });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registration schema synced successfully. Verification conditions pending for providers.' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. CLEAN SECURE LOGIN AUTHENTICATION LOGIC ENGINE
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'No registered account found with this email configuration.' });
    }

    // Check hashed verification compatibility strings match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Incorrect authentication password setup. Please verify your access key or reset it below.' 
      });
    }

    // Generate Standard Unencrypted JWT Validation Session Bearer Token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'MADAD_CORE_SECRET_KEY', 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        city: user.city 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. SMART FORGET PASSWORD RECOVERY LOGIC MATRIX
exports.forgetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    let user = await User.findOne({ email: email.trim().toLowerCase() });
    
    // Strict enforcement constraint: Verify account records visibility parameters
    if (!user) {
      return res.status(404).json({ message: 'Account context email not discovered in database framework.' });
    }

    // Explicit encryption overwrite loop parameters
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password framework securely updated. Please use your new key to log in to the marketplace.' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};