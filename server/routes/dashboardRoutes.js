/**
 * Module 2: Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyAuth } = require('../middleware/auth');

router.get('/stats', verifyAuth, dashboardController.getDashboardStats);

module.exports = router;
