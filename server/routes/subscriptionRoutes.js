/**
 * Module 5: Subscriptions & Quotations Routes
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyAuth, requireRole } = require('../middleware/auth');

router.get('/templates', verifyAuth, subscriptionController.getTemplates);
router.get('/', verifyAuth, subscriptionController.getSubscriptions);
router.get('/:id', verifyAuth, subscriptionController.getSubscriptionById);
router.post('/', verifyAuth, requireRole('admin', 'staff', 'customer'), subscriptionController.createSubscription);
router.patch('/:id/status', verifyAuth, requireRole('admin', 'staff'), subscriptionController.updateStatus);

module.exports = router;
