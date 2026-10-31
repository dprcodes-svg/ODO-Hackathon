/**
 * Module 1: Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth, requireRole } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// Protected routes
router.get('/me', verifyAuth, authController.getMe);
router.post('/staff', verifyAuth, requireRole('admin'), authController.addStaff);
router.get('/users', verifyAuth, requireRole('admin', 'staff'), authController.listUsers);

module.exports = router;
