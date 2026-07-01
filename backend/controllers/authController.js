const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeCollegeIdentity } = require('../utils/registrationValidation');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
const register = async (req, res) => {
  try {
    const { password, department } = req.body;
    const validation = normalizeCollegeIdentity(req.body);

    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const { normalizedEmail, normalizedRollNumber, normalizedName } = validation;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const existingEmailUser = await User.findOne({ email: normalizedEmail });
    if (existingEmailUser) {
      if (existingEmailUser.role === 'department' || existingEmailUser.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'This email is reserved for an existing staff account. Please use a different email.'
        });
      }

      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const existingRollNumberUser = await User.findOne({ rollNumber: normalizedRollNumber });
    if (existingRollNumberUser) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already registered. Please use your existing account.'
      });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      rollNumber: normalizedRollNumber,
      department: department || '',
      role: 'student'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Register error:', err);

    if (err && err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];

      if (duplicateField === 'rollNumber') {
        return res.status(400).json({
          success: false,
          message: 'Roll number already registered. Please use your existing account.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.'
      });
    }

    if (err && err.name === 'ValidationError') {
      const firstError = Object.values(err.errors || {})[0];
      return res.status(400).json({
        success: false,
        message: firstError?.message || 'Invalid registration data.'
      });
    }

    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @route   POST /api/auth/login
// @desc    Login user (student or admin)
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Must explicitly select password since we set select: false
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist. Please register first.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber,
      department: req.user.department
    }
  });
};

// @route   POST /api/auth/create-admin
// @desc    Create an admin account (run once to seed admin)
// @access  Public (protect with a secret key in production)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    if (adminSecret !== 'CAMPUS_ADMIN_SECRET_2024') {
      return res.status(403).json({ success: false, message: 'Invalid admin secret.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const admin = await User.create({ name, email, password, role: 'admin' });
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully!',
      token,
      user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe, createAdmin };
