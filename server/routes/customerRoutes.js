/**
 * Module 4: Customers Routes
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyAuth, requireRole } = require('../middleware/auth');

router.get('/', verifyAuth, customerController.getCustomers);
router.get('/:id', verifyAuth, customerController.getCustomerById);
router.post('/', verifyAuth, requireRole('admin', 'staff'), customerController.createCustomer);
router.put('/:id', verifyAuth, requireRole('admin', 'staff'), customerController.updateCustomer);

module.exports = router;
