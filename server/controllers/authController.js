/**
 * Module 1: Authentication Controller
 * Enforces business requirements:
 * - Email uniqueness
 * - Password complexity (> 8 chars, uppercase, lowercase, special char)
 * - Password reset simulation link
 * - RBAC: Admin, Staff, Customer
 * - Only Admin can register/add staff members
 */

const User = require('../models/User');
const Customer = require('../models/Customer');
const { generateToken } = require('../middleware/auth');

// Validation helper for password complexity
const isPasswordValid = (password) => {
  if (!password || password.length <= 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpper && hasLower && hasSpecial;
};

// Customer self-registration
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check existing email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Password validation rule from specification
    if (!isPasswordValid(password)) {
      return res.status(400).json({
        error: 'Password must be more than 8 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.'
      });
    }

    // Create linked customer profile for portal
    const customer = await Customer.create({
      name,
      companyName: companyName || name,
      email: email.toLowerCase(),
      phone: phone || '',
      paymentTerms: 'Net 30'
    });

    // Create User with customer role
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // In full production bcrypt.hash, keeping plaintext/hashed compatible for demo
      role: 'customer',
      customerId: customer._id
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during registration: ' + error.message });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during login: ' + error.message });
  }
};

// Reset link simulation
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to request a reset link.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account registered with that email address.' });
    }

    const resetToken = 'rst_' + Math.random().toString(36).substring(2, 12);
    const simulatedLink = `http://localhost:5000/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    return res.json({
      message: `Password reset link sent to ${user.email}.`,
      simulatedLink
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error generating reset link: ' + error.message });
  }
};

// Admin only: Add internal staff member
exports.addStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required for staff members.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({
        error: 'Staff password must be > 8 characters with uppercase, lowercase, and special character.'
      });
    }

    const newStaff = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'staff'
    });

    return res.status(201).json({
      message: 'Staff member added successfully.',
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add staff: ' + error.message });
  }
};

// Get current authenticated user profile
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(req.user.id || req.user._id);
    return res.json({ user: user || req.user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// List all system users (Admin / Staff audit)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
