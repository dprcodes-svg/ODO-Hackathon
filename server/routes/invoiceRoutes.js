/**
 * Module 6: Invoices & Payments Routes
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyAuth, requireRole } = require('../middleware/auth');

// Invoices
router.get('/', verifyAuth, invoiceController.getInvoices);
router.get('/:id', verifyAuth, invoiceController.getInvoiceById);
router.post('/run-billing-day', verifyAuth, requireRole('admin', 'staff'), invoiceController.runBillingDay);
router.patch('/:id/status', verifyAuth, requireRole('admin', 'staff'), invoiceController.updateInvoiceStatus);

// Payments
router.get('/payments/list', verifyAuth, invoiceController.getPayments);
router.post('/payments', verifyAuth, requireRole('admin', 'staff', 'customer'), invoiceController.recordPayment);

module.exports = router;
