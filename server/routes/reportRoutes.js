/**
 * Module 7: Reports Routes
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyAuth, requireRole } = require('../middleware/auth');

router.get('/summary', verifyAuth, requireRole('admin', 'staff'), reportController.getFinancialSummary);

module.exports = router;
