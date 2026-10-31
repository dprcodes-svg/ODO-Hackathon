/**
 * Module 3: Products and Plans Controller
 * Implements:
 * - Products with types, costs, and brand variants (e.g. Odoo Brand +$560)
 * - Plans with billing frequencies (daily, weekly, monthly, yearly) and lifecycle controls
 * - Admin discount rules (percentage/fixed, minimum quantity/spend, date rules, usage limits)
 */

const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Discount = require('../models/Discount');

// ==================== PRODUCTS ====================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, code, type, salesPrice, costPrice, taxRate, notes, variants } = req.body;
    if (!name || salesPrice === undefined) {
      return res.status(400).json({ error: 'Product name and sales price are required.' });
    }

    const defaultVariants = variants && variants.length > 0 ? variants : [
      { groupName: 'Brand', optionName: 'Standard', priceModifier: 0 },
      { groupName: 'Brand', optionName: 'Odoo Brand Edition', priceModifier: 560 }
    ];

    const product = await Product.create({
      name,
      code: code || ('PRD-' + Math.floor(1000 + Math.random() * 9000)),
      type: type || 'Software',
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice || 0),
      taxRate: Number(taxRate !== undefined ? taxRate : 10),
      notes: notes || '',
      variants: defaultVariants
    });

    return res.status(201).json({ message: 'Product created successfully.', product });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
    return res.json({ message: 'Product updated.', product: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndUpdate(id, { active: false });
    return res.json({ message: 'Product removed.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==================== PLANS ====================
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ active: true });
    return res.json({ plans });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      code,
      billingInterval,
      price,
      minQuantity,
      availableFrom,
      availableTo,
      autoCloseOnEnd,
      allowEarlyClose,
      allowPause,
      allowRenew,
      description
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Plan name and price are required.' });
    }

    const plan = await Plan.create({
      name,
      code: code || ('PLN-' + (billingInterval || 'monthly').toUpperCase().slice(0, 3)),
      billingInterval: billingInterval || 'monthly',
      price: Number(price),
      minQuantity: Number(minQuantity || 1),
      availableFrom: availableFrom || '',
      availableTo: availableTo || '',
      autoCloseOnEnd: Boolean(autoCloseOnEnd),
      allowEarlyClose: allowEarlyClose !== undefined ? Boolean(allowEarlyClose) : true,
      allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
      allowRenew: allowRenew !== undefined ? Boolean(allowRenew) : true,
      description: description || ''
    });

    return res.status(201).json({ message: 'Plan created successfully.', plan });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Plan.findByIdAndUpdate(id, req.body, { new: true });
    return res.json({ message: 'Plan updated.', plan: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==================== DISCOUNTS ====================
exports.getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({ active: true });
    return res.json({ discounts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createDiscount = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      value,
      minQuantity,
      minPurchaseAmount,
      startDate,
      endDate,
      maxUses,
      appliesTo,
      specificProductId
    } = req.body;

    if (!code || !name || value === undefined) {
      return res.status(400).json({ error: 'Code, name, and value are required.' });
    }

    const discount = await Discount.create({
      code: code.toUpperCase().trim(),
      name,
      type: type || 'percentage',
      value: Number(value),
      minQuantity: Number(minQuantity || 0),
      minPurchaseAmount: Number(minPurchaseAmount || 0),
      startDate: startDate || '',
      endDate: endDate || '',
      maxUses: Number(maxUses || 100),
      usedCount: 0,
      appliesTo: appliesTo || 'subscription',
      specificProductId: specificProductId || null
    });

    return res.status(201).json({ message: 'Discount rule created.', discount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
