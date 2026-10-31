/**
 * Module 3: Products, Plans & Discounts Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyAuth, requireRole } = require('../middleware/auth');

// Products
router.get('/products', verifyAuth, productController.getProducts);
router.post('/products', verifyAuth, requireRole('admin'), productController.createProduct);
router.put('/products/:id', verifyAuth, requireRole('admin'), productController.updateProduct);
router.delete('/products/:id', verifyAuth, requireRole('admin'), productController.deleteProduct);

// Plans
router.get('/plans', verifyAuth, productController.getPlans);
router.post('/plans', verifyAuth, requireRole('admin'), productController.createPlan);
router.put('/plans/:id', verifyAuth, requireRole('admin'), productController.updatePlan);

// Discounts
router.get('/discounts', verifyAuth, productController.getDiscounts);
router.post('/discounts', verifyAuth, requireRole('admin'), productController.createDiscount);

module.exports = router;
